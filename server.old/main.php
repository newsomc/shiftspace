<?php

require_once "$dir/server/setup.php";
$method = str_replace('..', '', $_GET['method']);

if (empty($method)) {
  respond(0, "No method specified.");
} else if (substr($method, 0, 8) == 'plugins.') {
  $method = preg_replace('#plugins\.(\w+)\.(.+)#', '$1/$2', $method);
  if (!file_exists("$dir/plugins/$method.php")) {
    respond(0, "Invalid method.");
  } else {
    require_once "$dir/plugins/$method.php";
  }
} else if (!file_exists("$dir/server/methods/$method.php")) {
  respond(0, "Invalid method.");
} else {
  require_once "$dir/server/methods/$method.php";
}

function respond($status, $payload) {
  if (is_string($payload)) {
    $payload = array(
      'status' => $status,
      'message' => $payload
    );
  } else if (is_array($payload)) {
    $payload['status'] = $status;
  }
  echo json_encode($payload);
  exit;
}

function normalize_url($url) {
  $anchor_pos = strpos($url, '#');
  if ($anchor_pos !== false) {
    $url = substr($url, 0, $anchor_pos); 
  }
  return $url;
}

function calculate_domain($url) {
  $url = @parse_url($url);
  if (empty($url) || empty($url['host'])) {
    continue;
  }
  $domain = $url['host'];
  if (substr($domain, 0, 4) == 'www.') {
    $domain = substr($domain, 4);
  }
  return $domain;
}

function require_login() {
  global $user;
  if (empty($user) || empty($user->id)) {
    respond(0, array(
      'authenticate' => 1,
      'message' => 'Oops, your has session expired. Please login and try again.'
    ));
  }
}

function generate_slug($length = 4) {
  global $db;
  $values = serialize($_POST);
  $length = 4;
  $slug = substr(md5($values . time()), 0, $length);
  $exists = $db->value("
    SELECT COUNT(id)
    FROM shift
    WHERE url_slug = '$slug'
  ");
  if ($length == 32) {
    respond(0, "Could not generate URL slug.");
  }
  if ($exists) {
    return generate_slug($length + 1);
  } else {
    return $slug;
  }
}

function elapsed_time($date) {
  $date = strtotime($date);
  $now = time();
  if ($now - $date < 60) {
    return ($now - $date) . ' seconds ago';
  } else if (($now - $date) < 120) {
    return 'about a minute ago';
  } else if (($now - $date) < 60 * 60) {
    $mins = round(($now - $date) / 60);
    return "$mins minutes ago";
  } else if (($now - $date) < 60 * 60 * 2) {
    return 'about an hour ago';
  } else if (($now - $date) < 60 * 60 * 24) {
    $hours = round(($now - $date) / 3600);
    return "$hours hours ago";
  } else if (($now - $date) < 60 * 60 * 24 * 2) {
    return 'yesterday';
  } else {
    return date('M j, Y', $date);
  }
}

function summarize($summary) {
  $summary = strip_tags($summary);
  $summary = preg_replace("#\s+#", ' ', $summary);
  if (strlen($summary) > 140) {
    $summary = substr($summary, 0, 140) . '...';
  }
  return $summary;
}

function filter_content($content) {
  global $purify_content;
  $dir = dirname(__FILE__);
  if (!empty($_POST['filters'])) {
    
    if (!empty($purify_content)) {
      require_once "$dir/htmlpurifier/library/HTMLPurifier.auto.php";
      $purifier_config = HTMLPurifier_Config::createDefault();
      $purifier = new HTMLPurifier($purifier_config);
    }
    
    $filters = json_decode($_POST['filters']);
    $decoded = json_decode($_POST['content']);
    
    if($filters)
    {
      foreach ($filters as $var => $filter) {
        switch ($filter) {
          case 'text':
            $decoded->$var = strip_tags($decoded->$var);
            break;
          case 'html':
            if (!empty($purify_content)) {
              $decoded->$var = $purifier->purify($decoded->$var);
            }
            break;
        }
      }
    }
    $content = json_encode($decoded);
  }
  return $content;
}

if ($db->type == 'mysql' && $db->handler->conn) {
  mysql_close($db->handler->conn);
}

?>
