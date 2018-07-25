/**
 * Attach inline edit to fish
 */
(function ($) {
  Drupal.behaviors.ed_edit_mode = {
    eeminit: function(id, options) {
      this.eeminstances = this.eeminstances || {};
      var removedInstance = $('#' + options.wrapper_id).once('eemi').length;
      if (this.eeminstances[id] && !removedInstance) {
        return ;
      }
      // this.eeminstances[id] = true;
      var t = $.extend(true, {}, this.eem);
      var ret = t.init(options);
      if (!ret) {
        this.eeminstances[id] = false;
      }
      else {
        this.eeminstances[id] = t;
      }
    },
    nextinstances: {},
    eeminstances: {},
    eem: {
      init: function(options) {
        this.id = options.wrapper_id;
        this.options = options;
        this.global = Drupal.behaviors.ed_edit_mode.eem;
        this.eeminstances = Drupal.behaviors.ed_edit_mode.eeminstances;
        this.nextinstances = Drupal.behaviors.ed_edit_mode.nextinstances;
        this.dialog = $('#editable-data-global-save').first();

        // Hire save button
        this.elm = $('#' + options.wrapper_id);
        this.dialog.prependTo("body");
        if (!this.elm.length) {
          return false;
        }
        this.actions = this.elm.find(".form-actions");
        this.actions.hide();
        this.loading = this.dialog.find(".ajax-wrapper-loading");
        this.saved = this.dialog.find(".ajax-wrapper-saved");
        this.submit = this.actions.find(".form-submit[name^='submit']");

        // Change
        this.attachChange();
        this.attachSingleRowActions();
        return true;
      },
      attachSingleRowActions: function() {
        var $this = this;
        // Check if flipped table
        var isFlipped = this.elm.closest('tr').hasClass('views-field');
        var table = this.elm.closest('table');
        if (isFlipped) {
          var columnIndex = this.elm.closest('td').index() + 1;
          this.silactions = table.find('tr td:nth-child(' + columnIndex + ')').find('.editable-data-global-save-inline');
        }
        else {
          var rowIndex = this.elm.closest('tr').index() + 1;
          this.silactions = table.find('tr:nth-child(' + rowIndex + ')').find('.editable-data-global-save-inline');
        }
        if (!this.silactions.length) {
          return ;
        }

        this.silactions.find('.confirm').once('eef').click(function() {$this.save();});
        this.loading = this.silactions.find(".ajax-wrapper-loading");
        this.saved = this.silactions.find(".ajax-wrapper-saved");
      },
      attachChange: function() {
        var $this = this;
        this.elm.find(":input").change(function() {
          $this.onChange();
        });
        this.dialog.find('.confirm').once('eef').click(function() {$this.save();});
        this.dialog.find('.cancel').once('eef').click(function() {$this.hideDialog();});
      },
      onChange: function() {
        this.changed = true;
        this.initAjax();
        this.show();
      },
      initAjax: function() {
        if (this.ajax) {
          return ;
        }
        this.ajax = Drupal.ajax[this.submit.attr("id")];

        // Init success
        var oldsuccess = this.ajax.success;
        var $this = this;
        this.ajax.success = function (response, status) {
          oldsuccess.call(this, response, status);
          $this.success.call($this, response, status);
        }
      },
      success: function (response, status) {
        var nextinstance = this.nextinstances[this.id] || false;
        if (nextinstance && this.eeminstances[nextinstance]) {
          this.eeminstances[nextinstance].saveLoop();
        }
        else {
          this.finishSave();
        }
        this.changed = false;
      },
      finishSave: function() {
        this.loading.hide();
        this.saved.show();
        this.saved.fadeOut(2000);
        if (this.silactions.length) {
          return ;
        }
        this.hideDialog();
      },
      show: function() {
        if (this.silactions.length) {
          return ;
        }
        if (this.global.showed) {
          return ;
        }
        this.global.showed = true;
        this.dialog.show(1000);
      },
      save: function() {
        var $this = this;
        this.loading.show();
        this.saved.hide();

        // Build next instances for saving each item by each item
        // this.nextinstances = {};
        var previnstance = false;
        $.each(Object.keys(this.eeminstances), function(id, inst) {
          if (previnstance) {
            $this.nextinstances[previnstance] = inst;
          }
          previnstance = inst;
        });
        var firstInstance = this.eeminstances[Object.keys(this.eeminstances)[0]];
        firstInstance.saveLoop();        // Next save will be handled in success
      },
      saveLoop: function() {
        if (this.changed) {
          // this.actions.show();
          this.submit.trigger('click');
        }
        else {
          this.success(0,0);
        }
        // Next save will be handled in success
      },
      hideDialog: function() {
        this.global.showed = false;
        this.dialog.hide(500);
      }
    },
    attach: function (context, settings) {
      var $this = Drupal.behaviors.ed_edit_mode;
      if (Drupal.settings.ed_edit_mode != null) {
        $.each(Drupal.settings.ed_edit_mode, function(index, value) {
          $this.eeminit(index, value);
        });
      }
    }
  }
})(jQuery);
