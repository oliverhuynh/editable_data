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

    if (this.ajaxPreloadisTriggerred()) {
      setTimeout(function() {Drupal.behaviors.editable_data.preload.endCurrentRun();}, 0);
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
    preload: {
      queues: [],
      nextqueues:[],
      running: false,
      endCurrentRun: function() {
        // console.log(['Set the flag running off', this.form]);
        this.running = false;

        // Go to the next item if next item is ok
        if (this.nextAvailable()) {
          this.check_and_run();
        }
        else {
          // console.log(['queue empty. Stop working', this.form]);
        }
      },
      run: function() {
        // Skipping mpt ajaxed
        // Skip , [type="submit"][id^="edit-ef-cancel"] button for fixing that behavior
        if (this.form.find('[type="submit"][id^="edit-edit"]').filter('.ajax-processed').length == 0) {
          console.warn('Why ajax is not implemented here?');
          return ;
        }
        var t = this;
        this.running = true;

        // Decide what to do with this form
        // Description of the work
        // Trigger Edit click but not rendering the returning until user click again
        // 1. Prevent Ajax to be changed
        this.form.addClass('delay-ajax');

        // 2. Trigger click , [type="submit"][id^="edit-ef-cancel"]
        this.form.find('[type="submit"][id^="edit-edit"]').addClass('triggering-ajax-preloader').trigger('click');


        /* THIS CODE IS FOR DEBUGGING ONLY
        // Examine we have a work for 2 seconds
        setTimeout(function() {
          t.endCurrentRun();
        }, 2000);*/
      },
      nextAvailable: function() {
        return this.queues.length > 0 || this.nextqueues.length > 0;
      },
      check_and_run: function() {
        if (!this.running) {
          // Priority nextqueues
          if (this.nextqueues.length) {
            this.form = this.nextqueues.pop();
          }
          else if (this.queues.length) {
            this.form = this.queues.pop();
          }
          else {
            return ;
          }
          this.run();
        }
        else {
          // console.log(['is running. Stop working', this.form]);
        }
      },
      load: function($form) {
        if (this.running && Drupal.behaviors.editable_data.inited) {
          // console.log(['running? ', this.running, $form, this.queues]);
          this.nextqueues.push($form);
          return ;
        }
        // 1. Add to the queue
        this.queues.push($form);
        // 2. Check if the queue is running then start preloading
        this.check_and_run();
      }
    },
    attach: function(context) {
      var select = 'form[id^="property-editablefields-form"]';
      $(select, context).add(context).filter(select).once('at').each(function() {
        Drupal.behaviors.editable_data.preload.load($(this));
      });
      this.inited = true;
    }
  }
}) (jQuery);
