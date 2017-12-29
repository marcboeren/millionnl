/*
 * jquery.panhandler.js
 * version 1.0.0
 * author: Marc Boeren
 * http://www.million.nl
 * Licensed under the MIT license.
 */

(function( $ ) {

  var options = {
    'inertia'   : 0, // 0 means disabled, 1.0 is a natural value for throwing things around
    'enabled'   : true,
    'direction' : 'horizontal', // 'horizontal', 'vertical', or 'diagonal'
    'callback'  : function($element, data, done) {}
  };

  var datakey = '.panhandler';

  $.fn.panhandler = function(method) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    }
    else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    }
    else {
      $.error( 'Method ' +  method + ' does not exist on jQuery' + datakey );
    }
  };

  var methods = {
    init : function( _options ) {
      options = $.extend(options, _options || {});
      options.inertia = 0.03 * options.inertia; // 0.03 seems a natural value on my desktop and ipad, so normalize it to make the natural setting 1.0 for users
      return this.each(function() {
        var $this = $(this),
             data = $this.data(datakey);
        if (!data) {
          $this.attr('unselectable', 'on')
               .css('user-select', 'none')
               .on('selectstart', false);
          $this.on('mousedown' + datakey, methods.start);
          $this.on('mousemove' + datakey, methods.move);
          $this.on('mouseup' + datakey, methods.end);
          $this.on('mouseover' + datakey, methods.end);
          $this.on('mouseout' + datakey, methods.end);

          $this.on('touchstart' + datakey, methods.touchstart);
          $this.on('touchmove' + datakey,  methods.touchmove);
          $this.on('touchend' + datakey,  methods.touchend);
          $this.on('touchcancel' + datakey,  methods.touchend);
          data = {
            state: 'none',
            isEnabled: options.enabled,
            isDragging: false,
            isAnimating: false,
            x: 0,
            dx: 0,
            y: 0,
            dy: 0,
            t: 0,
            dt: 0
          };
          $this.data(datakey, data);
        }
      });
    },
    destroy : function() {
      return this.each(function() {
        var $this = $(this);
        $this.off(datakey);
        $this.removeData(datakey);
      });
    },

    enable : function(e) {
      var $this = $(this),
          data = $this.data(datakey);
      data.isEnabled = true;
    },
    disable : function(e) {
      var $this = $(this),
          data = $this.data(datakey);
      data.isEnabled = false;
    },

    start : function(e) {

      // prevent dragging of images and links
      if (e.target.tagName == "IMG") { e.preventDefault(); }
      if (e.target.tagName == "A") { e.preventDefault(); }

      var $this = $(this),
          data = $this.data(datakey);
      if (!data || !data.isEnabled) return;
      if (data.isAnimating) {
        $this.stop(true);
        data.isAnimating = false;
        data.x = e.pageX;
        data.dx = 0;
        data.y = e.pageY;
        data.dy = 0;
        data.t = e.timeStamp;
        data.dt = 1;
        return;
      }
      if (data.isDragging) return;
      data.isDragging = true;
      data.x = e.pageX;
      data.dx = 0;
      data.y = e.pageY;
      data.dy = 0;
      data.t = e.timeStamp;
      data.dt = 1;
      data.state = 'start';

      // report position
      options.callback($this, jQuery.extend({}, data), false);
    },
    move : function(e) {
      var $this = $(this),
          data = $this.data(datakey);
      if (!data || !data.isEnabled) return;
      if (!data.isDragging) return;
      if (data.isAnimating) return;

      data.dx = e.pageX - data.x;
      data.dy = e.pageY - data.y;
      data.dt = (e.timeStamp - data.t) || 1;

      data.x = e.pageX;
      data.y = e.pageY;
      data.t = e.timeStamp;
      data.state = 'move';

      // report position
      options.callback($this, jQuery.extend({}, data), false);
    },
    end : function(e) {

      var $this = $(this),
          data = $this.data(datakey);
      if (!data || !data.isEnabled) return;
      if (!data.isDragging) return;
      if (data.isAnimating) return;
      // if I get an 'end' event on an inner element (relatedTarget, e.g. an image), just disregard
      if (e.relatedTarget && $(e.relatedTarget).closest($this).get(0)==$this.get(0)) return;

      var endstate = 'end';
      if (data.state == 'start') endstate = 'end-click';

      data.target = e.target;

      if (!options.inertia) {
        data.isDragging = false;
        data.isAnimating = false;
        data.state = endstate;
        options.callback($this, jQuery.extend({}, data), true);
        data.state = 'none';
        return;
      }

      var dx0 = data.dx;
      var dirx = dx0 < 0? -1: 1;
      var dy0 = data.dy;
      var diry = dy0 < 0? -1: 1;

      var vx0 = Math.abs(dx0)/data.dt; // in px/ms
      var vy0 = Math.abs(dy0)/data.dt; // in px/ms
      var v0 = 0; // in px/ms, always positive >= 0.0
      switch (options.direction) {
        case 'horizontal':
          v0 = vx0;
          vy0 = 0;
          break;
        case 'vertical':
          v0 = vy0;
          vx0 = 0;
          break;
        default:
          v0 = Math.sqrt(dx0*dx0 + dy0*dy0)/data.dt;
      }

      if (!v0) {
        data.isDragging = false;
        data.state = endstate;
        options.callback($this, jQuery.extend({}, data), true);
        data.state = 'none';
      }
      else {
        var duration = v0 / options.inertia;
        var t0 = new Date();
        t0 = t0.getTime();
        var tn = t0;
        data.isAnimating = true;
        $this.animate({opacity: 1},
          { duration: duration,
            step: function() {
              var now = new Date();
              now = now.getTime();
              var vt = Math.max(0, (v0 - options.inertia * (now - t0)));
              var vxt = vt/v0 * vx0;
              var vyt = vt/v0 * vx0;
              data.dt = now - tn;
              data.dx = dirx * vxt * data.dt;
              data.dy = diry * vyt * data.dt;
              data.state = 'move';
              options.callback($this, jQuery.extend({}, data), false);
              tn = now;
            },
            complete: function() {
              data.isDragging = false;
              data.isAnimating = false;
              data.state = endstate;
              options.callback($this, jQuery.extend({}, data), true);
              data.state = 'none';
            }
          }
        );
      }
    },

    touchstart: function(e) {
      e.preventDefault(); 
      var oe = e.originalEvent;
      if (oe.touches.length != 1) return;
      e.pageX = oe.touches[0].pageX;
      e.pageY = oe.touches[0].pageY;
      var $this = $(this),
          data = $this.data(datakey);
      if (!data || !data.isEnabled) return;
      delete(data.isTouchScroll);

      methods.start.apply(this, [e]);
    },
    touchmove: function(e) {
      //e.preventDefault(); 
      var oe = e.originalEvent;
      if (oe.touches.length != 1) return;
      e.pageX = oe.touches[0].pageX;
      e.pageY = oe.touches[0].pageY;
      var $this = $(this),
          data = $this.data(datakey);
      if (!data || !data.isEnabled) return;
      if (!data.isDragging) return;
      if (data.isAnimating) return;
      if (typeof data.isTouchScroll === "undefined") {
        var dx = Math.abs(e.pageX - data.x);
        var dy = Math.abs(e.pageY - data.y);
        data.isTouchScroll = false;
        if (options.direction=='horizontal' && dx < dy) data.isTouchScroll = true;
        if (options.direction=='vertical' && dy < dx) data.isTouchScroll = true;
      }
      if (data.isTouchScroll) return;

      e.preventDefault();
      methods.move.apply(this, [e]);
    },
    touchend: function(e) {
      e.preventDefault(); 
      var oe = e.originalEvent;
      if (oe.touches.length > 0) return;
      methods.end.apply(this, [e]);
    }
  };

})( jQuery );
