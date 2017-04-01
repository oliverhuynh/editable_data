<?php

/**
 * Implements hook_views_data_alter().
 *
 */
function editable_data_views_data_alter(&$data) {
  foreach ($data as &$table) {
    if (!is_array($table)) {
      continue ;
    }
    foreach ($table as &$field) {
      if (isset($field['field']) && isset($field['field']['handler']) && $field['field']['handler'] == 'views_handler_field_date') {
        $field['field']['handler'] = 'editable_data_views_handler_field_date';
      }
      if (isset($field['field']) && isset($field['field']['handler']) && $field['field']['handler'] == 'views_handler_field') {
        $field['field']['handler'] = 'editable_data_views_handler_field';
      }
    }
  }
}
