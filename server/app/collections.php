<?php

class Collections {
  public function __construct($server) {
    $this->server = $server;
  }
  
  function generate_join_clause($table) {
    $sql = '';
    $joinData = $this->server->moma->joinData[$table];
    
    if (!empty($joinData)) {
      foreach ($joinData as $column => $joins) {
        $joinTable = $joins[0];
        $joinColumn = $joins[1];
        $sql .= " JOIN $joinTable ON $column=$joinTable.$joinColumn";
      }
    }

    return $sql;
  }
  
  function generate_where_clause($constraints) {
    $sql = '';
    
    if (!empty($constraints)) {
      $sql .= " WHERE ";
      $first = false;
      
      foreach ($constraints as $column => $value) {
        if ($first) $sql .= " AND ";
        
        if (is_string($value))
          $value = "'$value'";
        
        $sql .= "$column = $value";
        $first = true;
      }
    }

    if ($sql == '')
      return " ITS_NOT_A_GOOD_IDEA_TO_DELETE_YOUR_ENTIRE_TABLE";

    return $sql;    
  }
  
  function read($desc) {
    extract($desc);
    $sql = "SELECT $properties FROM $table";
    $sql .= $this->generate_join_clause($table);
    $sql .= $this->generate_where_clause($constraints);
    
    if (!empty($orderby)) {
      if ($orderby[0] == '>')
        $ascdesc = 'DESC';
      else if ($orderby[0] == '<')
        $ascdesc = 'ASC';
      else
        throw new Error('orderby first value must be "<" or ">"');  

      $sql .= " ORDER BY $orderby[1] $ascdesc"; 
    }

    if (!empty($range)) {
      extract($range);
      $sql .= " LIMIT $count OFFSET $startIndex";
    }
      
    $rows = $this->server->moma->rows($sql);
    return new Response($rows);
  }

  function delete($desc) {
    extract($desc);
    $sql = "DELETE FROM $table";
    $sql .= $this->generate_where_clause($constraints);
    $query = $this->server->moma->query($sql);
    return new Response($query->rowCount());    
  }

  function update($desc) {
    extract($desc);
    $result = 0;
    
    if (empty($bulk)) {
      $bulk = array($desc);
    }

    foreach ($bulk as $clause) {
      extract($clause);
      $sql = "UPDATE $table SET ";
    
      $valuesSql = array();
      foreach ($values as $key => $value) {
        if (is_string($value))
          $value = "'$value'";
        
        $valuesSql[] = "$key = $value";
      }
                 
      $sql .= implode(', ', $valuesSql);                                             
      $sql .= $this->generate_where_clause($constraints);
    
      $query = $this->server->moma->query($sql);
      $result += $query->rowCount();
    }
    
    return new Response($result);    
  }

  function create($desc) {
    extract($desc);
    $sql = "INSERT INTO $table ";

    $valuesSql = array();
    $columns = implode(', ', array_keys($values));
    foreach ($values as $key => $value) {
      if (is_string($value))
        $value = "'$value'";
        
      $valuesSql[] = $value;
    }
    
    $valuesClause = implode(', ', $valuesSql);
    $sql .= "($columns) VALUES ($valuesClause)";
    
    $query = $this->server->moma->query($sql);
    return new Response($query->insertId);    
  }
}

?>
