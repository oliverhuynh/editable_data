<?php

/**
 * @file
 */
class editable_data_views_handler_field_date extends views_handler_field_date {
  function render($values) {
    $external = editable_embed_field($this, $values);
    return $external ? $external : $this->parentrender($values);
  }
  function parentrender($values) {
    return parent::render($values);
  }
}
