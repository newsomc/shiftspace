<?php

class Subscription_Object extends Base_Object {}
class Event_Object extends Base_Object {}
class EventRead_Object extends Base_Object {}
class Stream_Object extends Base_Object {}
class StreamPermission_Object extends Base_Object {}

class Event {
  public function __construct($server) {
    $this->server = $server;
  }

  private function logged_in() {
    if (!$this->server->user) {
      throw new Error('You must be logged in.');
    }    
  }

  private function get_subscription_object() {
    $this->logged_in();
    extract($_REQUEST);
    
    $this->can_read($stream_id);
    
    $object = new Subscription_Object();
    $object->set(Array(
      'user_id' => $this->server->user->id,
      'stream_id' => $stream_id));
      
    return $object;
  }
  
  public function subscribe() {
    $object = $this->get_subscription_object();
    $this->server->db->toggleon($object);
  }
  
  public function unsubscribe() {
    $object = $this->get_subscription_object();
    $this->server->db->toggleoff($object);    
  }
  
  private function permission($stream_id) {
    $result = $this->server->db->row("SELECT level FROM streampermission WHERE user_id=".$this->server->user->id." AND stream_id=:stream_id", compact('stream_id'));
    return $result->level;
  }
  
  public function createstream() {
    $this->logged_in();
    extract($_REQUEST);
    
    $object = new Stream_Object();
    $object->set(compact('private', 'stream_name'));    
    $this->server->db->save($object);
    
    $permission = new StreamPermission_Object();
    $permission->set(Array(
      'user_id' => $this->server->user->id,
      'stream_id' => $object->id,
      'level' => 3));
      
    $this->server->db->save($permission);
    return new Response($object);  
  }
  
  public function post() {
    $this->logged_in();
    extract($_REQUEST);
    
    if ($this->permission($stream_id) < 2)
      throw new Error("You don't have permission for this operation.");
    
    $object = new Event_Object();
    $object->set(compact('stream_id', 'display_string', 'object_ref', 'has_read_status'));
    $object->set('created', time());
    $object->set('created_by', $this->server->user->id);
    $this->server->db->save($object);
    
    $this->markread($object->id);
  }

  private function event_read_object($event_id) {
    $this->logged_in();
    $object = new EventRead_Object();

    $user_id = $this->server->user->id;
    $read = 1;
    $object->set(compact('user_id', 'event_id', 'read'));

    return $object;
  }

  public function markread($event = NULL) {
    $object = $this->event_read_object($event ? $event : $_REQUEST['event_id']);    
    $this->server->db->toggleon($object);    
  }

  public function markunread($event = NULL) {
    $object = $this->event_read_object($event ? $event : $_REQUEST['event_id']);    
    $this->server->db->toggleoff($object);    
  }

  private function can_read($stream_id) {
    $stream = $this->server->db->load("stream($stream_id)");

    if (!$stream)
      throw new Error("No such stream.");
      
    if ($stream->private) {
      if ($this->server->user) {
        if ($this->permission($stream_id) < 1) {
          throw new Error("You don't have permission for this operation.");
        }
      } else {
        throw new Error("This is a private stream. If you have permissions please log in and try again.");
      }
    }
  }    
 
  public function onefeed() {
    extract($_REQUEST);
    $this->can_read($stream_id);
       
    return new Response($this->server->db->rows("SELECT * FROM stream, event WHERE event.stream_id = stream.id AND event.stream_id=:stream_id", compact('stream_id')));
  }
  
  public function subscriptions() {
    $this->logged_in();
    $query = "SELECT subscription.stream_id, since, private, level, stream_name 
      FROM stream, subscription 
      LEFT JOIN streampermission ON subscription.user_id = streampermission.user_id 
        AND subscription.stream_id = streampermission.stream_id 
      WHERE stream.id = subscription.stream_id AND subscription.user_id=".$this->server->user->id;
    return $this->server->db->rows($query);
  }
  
  public function feed() {
    $streams = $this->subscriptions();
    
    $values = Array();
    
    foreach ($streams as $stream) {
      if (!$stream->private || $stream->level > 0)
        $values[] = '(stream_id = '.$stream->stream_id.' AND created > '.$stream->since.')';
    }
    
    if (count($values) == 0)
      return new Response(Array());
    else
      return new Response($this->server->db->rows("SELECT * FROM stream, event LEFT JOIN eventread ON event.id = eventread.event_id AND eventread.user_id = ".$this->server->user->id." WHERE stream.id = event.stream_id AND (".implode(' OR ', $values).')'));
  }
  
  public function streamsetpermission() {
    $this->logged_in();
    extract($_REQUEST);

    if ($this->permission($stream_id) >= 3) {
      $this->server->db->query("DELETE FROM streampermission WHERE stream_id=:stream_id and user_id=:user_id", compact('stream_id', 'user_id'));

      $permission = new StreamPermission_Object();
      $permission->set(compact('stream_id', 'user_id', 'level'));
      $this->server->db->save($permission);
    }
    else {
      throw new Error("You don't have permission for this operation.");
    }
  }

  public function findstreams() {
    extract($_REQUEST);
    if ($this->server->user) {
      $user_clause = " LEFT JOIN streampermission ON stream.id = streampermission.stream_id AND user_id = ".$this->server->user->id;
      $permissions_clause = "OR (stream.private = 1 AND streampermission.level >= 1)";
    }
    else {
      $user_clause = "";
      $permissions_clause = "";
    }
    
    return new Response($this->server->db->rows("SELECT * FROM event, stream $user_clause WHERE event.stream_id = stream.id AND (stream.private = 0 $permissions_clause) AND object_ref=:object_ref", compact('object_ref')));
  }
}

?>
