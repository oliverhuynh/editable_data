<?php

/**
 * Field handler that shows a jump link to the save button.
 *
 * This is intended for use on very long views.
 */
class editable_data_handler_field_actions extends views_handler_field {

  function option_definition() {
    $options = parent::option_definition();

    // $options['jump_link_text'] = array('default' => t('Jump to save button'));

    return $options;
  }

  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    /*$form['jump_link_text'] = array(
      '#type' => 'textfield',
      '#title' => t('Jump link text'),
      '#default_value' => $this->options['jump_link_text'],
      '#description' => t("The text to show for the link."),
    );*/
  }

  /**
   * Called to add the field to a query.
   */
  function query() {
    // Do nothing: fake field.
  }

  /**
   * Render the field.
   *
   * @param $values
   *   The values retrieved from the database.
   */
  function render($values) {
    return '<span class="editable-data-global-save-inline"><input name="editable-data-submit" value="Save" class="form-submit confirm" type="submit"><span class="ajax-wrapper-saved" style="display:none;">Saved</span><span class="ajax-wrapper-loading" style="display:none;"><span class="ajax-progress ajax-progress-throbber"><span class="throbber">&nbsp;</span></span>Please wait...</span></span>';
  }
}
