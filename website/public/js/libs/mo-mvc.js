/*
 * mo-mvc.js
 * version 1.0.0
 * author: Marc Boeren
 * MillionOranges
 * http://www.million.nl
 * Licensed under the MIT license.
 */

function MOView() {
  var view = this;
  view.delegate = null;
  view.dataSource = null;
  view.$frame = null;
  view.$view = null;
  view.data = {};

  /* 
  ** initWithFrame is called each time the view needs a complete redraw
  */
  view.initWithFrame = function($frame) {
    view.$frame = $frame;
    view.$frame.html('<div class="view"></div>');
    view.$view = $('> .view', view.$frame);
  };

  /* 
  ** draw is used to redraw the internals, in this case the items
  */
  view.draw = function() {
    var html = '';
    view.$view.html(html);
  };

  /* 
  ** reloadData is called to indicate data from the controller has changed
  ** usually means a (partial) redraw
  */
  view.reloadData = function() {
    if (view.dataSource) {
      view.draw();
    }
  };

  view.handleEvent = function(e) {
    var handled = false;
    switch (e.type) {
      case 'keydown': handled = view.eventKeyDown(e); break;
      case 'keyup': handled = view.eventKeyUp(e); break;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  view.eventKeyDown = function(e) {
    switch (e.keyCode) {
      case app.KEYCODE.LEFT: 
             return true;
      case app.KEYCODE.RIGHT: 
             return true;
    }
    return false;
  };

  view.eventKeyUp = function(e) {
    switch (e.keyCode) {
      case app.KEYCODE.ENTER: 
             return true;
      case app.KEYCODE.ESC: 
             view.delegate.didCancel(view);
             return true;
    }
    return false;
  };  
};

function MOController($frame) {
  var controller = this;
  controller.$frame = $frame;
  controller.view = null;
  controller.model = {};

  /*
  ** loadView sets up the view with the frame, sets delegate & dataSource
  ** only needs to be called once, right after construction
  */
  controller.loadView = function() {
    var view = new MOView(); // Your actual view here
    view.delegate = controller;
    view.dataSource = controller;
    controller.view = view;
  };

  /*
  ** viewDidLoad loads data if needed
  ** the view gets notified to update it's data & redraw
  */
  controller.viewDidLoad = function(slug) {    
    controller.view.initWithFrame(controller.$frame);
    if (!controller.model.slug || controller.model.slug!==slug) {
      controller.loadData(slug);
    }
    else {
      controller.view.reloadData();
    }
  };

  /*
  ** layout updates the view
  */
  controller.layout = function() {
    $frame.attr('class', 'story');
    $frame.css({'opacity':1});
  };

  /*
  ** loadData updates the complete model
  ** the view gets notified to update it's data & redraw
  */
  controller.loadData = function(slug) {
    $.ajax({
      url: '/json/'+slug+'.json',
      dataType: 'json',
      context: controller,
      success: function(response) {
        controller.model.slug = slug;
        controller.model.data = response;
        controller.view.reloadData();
      }
    });
  };

  controller.appHomeClicked = function() {
    $frame.animate({'opacity':0.01}, 100, 'linear', function() {
      app.router.home(controller.model.slug, true);
    });
  };

  controller.didCancel = function(view) {
    $frame.animate({'opacity':0.01}, 100, 'linear', function() {
      app.router.home(controller.model.slug, true);
    });
  };
};

