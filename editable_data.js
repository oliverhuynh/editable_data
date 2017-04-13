(function ($) {
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  Drupal.ajax.prototype.directsuccess = Drupal.ajax.prototype.success;

  // Success of ajax is delayed until next click
  Drupal.ajax.prototype.success = function (response, status) {
    // 1 If this is not out form, return as normal behaviors
    if (this.clickByHuman() || !this.ajaxPreloadisTriggerred()) {
      this.stopDelayAjax();
      return this.directsuccess(response, status);
    }

    this.recentresponse = [response, status];
    // End current Run to load next, in a separate timeframe
    this.stopDelayAjax();
    return false;
  };
  Drupal.ajax.prototype.stopDelayAjax = function () {
    // TODO: Move outside instead
    this.clickByHuman('clear');
    var edt = $(this.form).data('edt') || 'na';
    if (edt !== 'na') {
      edt.finishedcallback();
    }
  }

  // Before send to not disable the element
  Drupal.ajax.prototype.directbeforeSend = Drupal.ajax.prototype.beforeSend;
  Drupal.ajax.prototype.beforeSend = function (xmlhttprequest, options) {
    // 1 If this is not out form, return as normal behaviors
    if (this.clickByHuman() || !this.ajaxPreloadisTriggerred()) {
      return this.directbeforeSend(xmlhttprequest, options);
    }

    // Disable loading, etc...
    this.progress = this.progress || {};
    this.progress.type = 'na';
    var r = this.directbeforeSend(xmlhttprequest, options);
    $(this.element).removeClass('progress-disabled').attr('disabled', false);
    return r;
  }

  // triggerByAjaxPreload
  Drupal.ajax.prototype.ajaxPreloadisTriggerred = function () {
    return $(this.form).hasClass('delay-ajax') && $(this.element).hasClass('triggering-ajax-preloader');
  }

  Drupal.ajax.prototype.ajaxPreloadGotData = function () {
    // Use a variable to define if this is loaded yet
    return !!this.recentresponse;
  }

  Drupal.ajax.prototype.clickByHuman = function (set) {
    set = set || 'get';
    if (set === 'clear') {
      this.manualTriggerred = false;
    }
    // Use a variable to define if this is loaded yet
    return !this.manualTriggerred;
  }

  // Wait for the next click trigger recent success
  Drupal.ajax.prototype.directeventResponse = Drupal.ajax.prototype.eventResponse;
  Drupal.ajax.prototype.eventResponse = function (element, event) {
    var tt = this;
    // Show right away if human clicking
    this.manualTriggerred = event.isTrigger;

    // 1 If this is not out form, return as normal behaviors
    if (this.ajaxPreloadisTriggerred() && this.ajaxPreloadGotData()) {
      try {
        // A bug of jQuery.extend in settings, ajax.js: function (ajax, response, status) {
        $.each(this.recentresponse[0], function(i, v) {
          tt.recentresponse[0][i].merge = false;
        });
        this.directsuccess(this.recentresponse[0], this.recentresponse[1]);
      }
      catch (e) {
        console.warn(e);
      }
      this.recentresponse = false;
      return false;
    }
    else {
      return this.directeventResponse(element, event);
    }
  }

  Drupal.behaviors.editable_data = {
    instant: $.objectbuilder({
      build: function() {
      },
      run: function(finishedcallback) {
        this._finishedcallback = finishedcallback;

        // Skipping mpt ajaxed
        // Skip , [type="submit"][id^="edit-ef-cancel"] button for fixing that behavior
        if (this.element.find('[type="submit"][id^="edit-edit"]').length == 0) {
          this.finishedcallback();
          return ;
        }
        if (this.element.find('[type="submit"][id^="edit-edit"]').filter('.ajax-processed').length == 0) {
          console.warn('Why ajax is not implemented here?');
          this.finishedcallback();
          return ;
        }

        // Decide what to do with this form
        // Description of the work
        // Trigger Edit click but not rendering the returning until user click again
        // 1. Prevent Ajax to be changed
        this.element.addClass('delay-ajax');

        // 2. Trigger click , [type="submit"][id^="edit-ef-cancel"]
        this.element.find('[type="submit"][id^="edit-edit"]').addClass('triggering-ajax-preloader').trigger('click');
      },
      _finishedcallback: function() {},
      finishedcallback: function() {
        this._finishedcallback();

        // Reset finishedcallback
        this._finishedcallback = function() {};
      }
    }, 'edt'),
    preload: {
      maxRun: 1,
      curRun: 0,
      wait: 2000,
      recentTimeout: 0,
      graceful: function() {
        var preload = this;
        if (this.queued) {
          return ;
        }
        if (this.runnning) {
          // Let's wait for next seconds
          if (preload.recentTimeout) {
            clearTimeout(preload.recentTimeout);
          }
          this.queued = true;
          preload.recentTimeout = setTimeout(function() {
            preload.queued = false;
            preload.graceful();
          }, preload.wait);
          return ;
        }
        this.runnning = true;
        preload._graceful();
        this.runnning = false;
      },
      _graceful: function() {
        var preload = this;
        // Find the item
        var allloadedandrunning = true;
        var instance;
        $.each(Drupal.behaviors.editable_data.instant.instances, function(i, v) {
          if (this._running) {
            return ;
          }
          if (!this.loaded) {
            allloadedandrunning = false;
            instance = this;
            return false;
          }
        });

        if (!allloadedandrunning) {
          if (preload.curRun < preload.maxRun) {
            preload.curRun++;
            instance._running = true;
            // console.log(['start', instance.id]);
            instance.run(function() {
              preload.curRun--;
              // console.log(['end', instance.id]);
              instance.loaded = true;
              instance._running = false;
              preload.graceful();
            });
          }
          else {
            preload.graceful();
          }
        }
      }
    },
    attach: function(context) {
      var select = 'form[id^="property-editablefields-form"]';
      $(select, context).add(context).filter(select).once('at').each(function() {
        Drupal.behaviors.editable_data.instant.refresh($(this));
      });
      Drupal.behaviors.editable_data.preload.graceful();
      this.inited = true;
    }
  }
}) (jQuery);
