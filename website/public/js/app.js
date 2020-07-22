
function App() {

  var app = this;
  app.data = {};
  app.controller = null;
  app.homeController = null;
  app.storyController = null;
  app.galleryController = null;
  app.photoController = null;

  app.KEYCODE = { BACKSPACE: 8,
                  TAB: 9,
                  ENTER: 13,
                  RETURN: 13,
                  SHIFT: 16,
                  CTRL: 17,
                  ALT: 18,
                  ESC: 27,
                  SPACE: 32,
                  PAGEUP: 33,
                  PAGEDOWN: 34,
                  END: 35,
                  HOME: 36,
                  LEFT: 37,
                  UP: 38,
                  RIGHT: 39,
                  DOWN: 40,
                  DEL: 40,
                  CMD_L: 91,
                  WIN_L: 91,
                  WIN_R: 92,
                  CMD_R: 93,
                  SELECT: 93,
                  F1: 112,
                  F2: 113,
                  F3: 114,
                  F4: 115,
                  F5: 116,
                  F6: 117,
                  F7: 118,
                  F8: 119,
                  F9: 120,
                  F10: 121,
                  F11: 122,
                  F12: 123,
                  _: 189
                  };

  // views

  function HorizontalScrollListView() {
    var view = this;
    view.delegate = null;
    view.dataSource = null;
    view.$frame = null;
    view.data = {};

    view.data.numberOfItems = 0;
    view.data.itemWidth = 0;
    view.data.panBoundaryRight = 0;
    view.data.panBoundaryLeft = 0;
    view.data.panPosition = 0;
    view.data.selectedItemIndex = 0;
    view.data.position = 0;

    /*
    ** initWithFrame is called each time the view needs a complete redraw
    */
    view.initWithFrame = function($frame) {
      view.$frame = $frame;
      view.$frame.html('<div class="view"><div class="items"></div></div>');
      view.$items = $('> .view > .items', view.$frame);
      view.$items.panhandler({inertia: 1.0, callback: view.panhandler});
      view.$items.on('click', function(e) { e.preventDefault(); e.stopPropagation(); return false; });
      view.$items.on('activate', view.handleEvent);
      view.$items_style = view.$items.get(0).style;
    };

    /*
    ** draw is used to redraw the internals, in this case the items
    */
    view.draw = function() {
      view.layout();
      var items = String();
      for(var i = 0; i<view.data.numberOfItems; ++i) {
        items+= '<div class="item" data-item-index="'+i+'">'+view.dataSource.htmlForItemAtIndex(i)+'</div>';
      }
      view.$items.html(items);
      $('*', view.$items).attr('unselectable', 'on');

      var minheight = parseInt(view.$frame.css('minHeight'), 10);
      $('> .item', view.$items).each(function() {
        minheight = Math.max(minheight, 1.20*$(this).outerHeight());
      });
      $('> .view', view.$frame).css({'minHeight': minheight});
      view.$items.css({'minHeight': minheight});
      var right = -(view.data.selectedItemIndex*view.data.itemWidth)-(view.data.itemWidth/2.0);
      view.updatePosition(right);
    };

    /*
    ** layout is used to update in response to global resize
    */
    view.layout = function() {
      view.$items.css({'width':view.data.numberOfItems*view.data.itemWidth+app.data.w});
      window.setTimeout(function() {
        view.scrollIntoView(true);
      }, 200);
    };

    /*
    ** reloadData is called to indicate data from the controller has changed
    ** usually means a (partial) redraw
    */
    view.reloadData = function() {
      if (view.dataSource) {
        view.data.numberOfItems = view.dataSource.numberOfItems();
        view.data.itemWidth = view.dataSource.itemWidth() || 1;
        view.data.panBoundaryRight = -0.5*view.data.itemWidth;
        view.data.panBoundaryLeft = -view.data.numberOfItems*view.data.itemWidth + 0.5*view.data.itemWidth;
        view.data.selectedItemIndex = 0;
        view.draw();
      }
    };

    view.scrollIntoView = function(animated) {
      // scroll into view, to top
      var duration = (animated? 200: 0);
      app.data.$scrollable.stop().animate({scrollTop: 0}, duration);
    };

    view.itemAtIndex = function(index) {
      if (index<0 || index>=view.data.numberOfItems) return null;
      return $('> .item[data-item-index="'+index+'"]', view.$items);
    };

    view.indexForSelectedItem = function() {
      return view.data.selectedItemIndex;
    };

    view._setIndex = function(index) {
      if (index<0) return;
      view.data.selectedItemIndex = index;
      view.delegate.didSelectItemAtIndex(view, index);
    };

    view.selectItemAtIndex = function(index, animated) {
      var duration = (animated? 200: 0);
      if (index<0) index = 0;
      if (index>=view.data.numberOfItems) index = view.data.numberOfItems-1;
      if (index==view.data.selectedItemIndex) {
        $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
        return; // no change
      }
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).removeClass('selected');
      view._setIndex(index);
      var right = -(view.data.selectedItemIndex*view.data.itemWidth)-(view.data.itemWidth/2.0);
      view.updatePosition(right, animated);
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
    };

    view.updateIndexFromPanPosition = function() {
      var index = Math.round((view.data.panBoundaryRight - view.data.panPosition) / view.data.itemWidth);
      if (index<0) index = 0;
      if (index>=view.data.numberOfItems) index = view.data.numberOfItems-1;
      if (index==view.data.selectedItemIndex) return; // no change
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).removeClass('selected');
      view._setIndex(index);
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
    };

    view.updatePosition = function(right, animated) {

      var duration = (animated? 200: 0);
      var style = view.$items_style;

      if (app.data.css3transformsupport) {
        // set duration speed (0 represents 1-to-1 scrolling)
        if (app.data.css3transitionsupport) { style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = duration + 'ms'; }
        // translate to given index position
        style.MozTransform = style.webkitTransform = 'translate3d(' + -(right) + 'px,0,0)';
        style.msTransform = style.OTransform = 'translateX(' + -(right) + 'px)';

        view.data.position = right;
      }
      else {
        //view.$items.css({'right':right});
        view.$items.stop().animate({'right':right},
                                   duration,
                                   'swing',
                                   function() { view.data.position = right; });
      }
    };

    view.panhandler = function($element, data, done) {

      if (data.state == 'end-click' && data.target) {
        $(data.target).trigger('activate');
        return;
      }

      if (data.state == 'start') {
        view.data.panPosition = view.data.position;
      }

      view.data.panPosition = view.data.panPosition - data.dx;
      var right = 0;

      if (view.data.panPosition > view.data.panBoundaryRight) {
        var overX = Math.abs(view.data.panPosition - view.data.panBoundaryRight);
        var resistedX = view.data.itemWidth * overX / (view.data.itemWidth + overX);
        right = view.data.panBoundaryRight + resistedX;
        if (data.state == 'move' && $(":animated").length) {
          $element.finish();
          return false;
        }
      }
      else if (view.data.panPosition < view.data.panBoundaryLeft) {
        var overX = Math.abs(view.data.panPosition - view.data.panBoundaryLeft);
        var resistedX = view.data.itemWidth * overX / (view.data.itemWidth + overX);
        right = view.data.panBoundaryLeft - resistedX;
        if (data.state == 'move' && $(":animated").length) {
          $element.finish();
          return false;
        }
      }
      else right = view.data.panPosition;

      view.updatePosition(right);

      if (done) {
        // snap to boundaries
        if (view.data.panPosition > view.data.panBoundaryRight) { view.updatePosition(view.data.panBoundaryRight, true); }
        else if (view.data.panPosition < view.data.panBoundaryLeft) { view.updatePosition(view.data.panBoundaryLeft, true); }
        // update index to nearest item
        //view.updateIndexFromPanPosition();
      }

      view.updateIndexFromPanPosition();
    };

    view.handleEvent = function(e) {
      var handled = false;
      switch (e.type) {
        case 'activate': handled = view.eventActivate(e); break;
        case 'keydown': handled = view.eventKeyDown(e); break;
        case 'keyup': handled = view.eventKeyUp(e); break;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    view.eventActivate = function(e) {

      var $item = null;
      if ($(e.target).hasClass('item')) {
        $item = $(e.target);
      }
      else {
        $item = $(e.target).closest('.item');
      }

      if ($item.length) {
        var index = parseInt($item.attr('data-item-index'), 10);
        view.selectItemAtIndex(index, true);
        view.delegate.didActivateItemAtIndex(view, view.data.selectedItemIndex);
      }

      return true;
    };

    view.eventKeyDown = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.LEFT:
               view.selectItemAtIndex(view.data.selectedItemIndex+1, true);
               return true;
        case app.KEYCODE.RIGHT:
               view.selectItemAtIndex(view.data.selectedItemIndex-1, true);
               return true;
      }
      return false;
    };

    view.eventKeyUp = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.ENTER:
               view.delegate.didActivateItemAtIndex(view, view.data.selectedItemIndex);
               return true;
        case app.KEYCODE.ESC:
               view.delegate.didCancel(view);
               return true;
      }
      return false;
    };
  };

  function HtmlView() {
    var view = this;
    view.delegate = null;
    view.dataSource = null;
    view.$frame = null;
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
      var html = view.dataSource.html();
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
        case 'keyup': handled = view.eventKeyUp(e); break;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    view.eventKeyUp = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.ESC:
               view.delegate.didCancel(view);
               return true;
      }
      return false;
    };
  };

  function GalleryView() {
    var view = this;
    view.delegate = null;
    view.dataSource = null;
    view.$frame = null;
    view.data = {};

    view.data.numberOfItems = 0;
    view.data.itemWidth = 0;
    view.data.selectedItemIndex = 0;
    view.data.numberOfItemsPerRow = 0;
    view.data.frameWidth = 0;
    view.data.isScrolling = false;

    /*
    ** initWithFrame is called each time the view needs a complete redraw
    */
    view.initWithFrame = function($frame) {
      view.$frame = $frame;
      view.$frame.html('<div class="view"><div class="header"></div><div class="items"></div></div>');
      view.$view = $('> .view', view.$frame);
      view.$items = $('> .view > .items', view.$frame);
      view.$items.on('click', view.handleEvent);
    };

    /*
    ** draw is used to redraw the internals, in this case the items
    */
    view.draw = function() {
      $('> .header', view.$view).html(view.dataSource.htmlForHeader());
      var items = String();
      for(var i = 0; i<view.data.numberOfItems; ++i) {
        items+= '<div class="item" data-item-index="'+i+'">'+view.dataSource.htmlForItemAtIndex(i)+'</div>';
      }
      view.$items.html(items);
      view.scrollIntoView(false);
    };

    /*
    ** layout is used to update in response to global resize
    */
    view.layout = function() {
      if (view.data.itemWidth) {
        view.data.frameWidth = view.$frame.width();
        view.data.numberOfItemsPerRow = Math.max(1, Math.floor((view.data.frameWidth - 20) / view.data.itemWidth));
        view.$view.width(view.data.numberOfItemsPerRow * view.data.itemWidth);
        window.setTimeout(function() {
          view.scrollIntoView(true);
        }, 200);
      }
    };

    /*
    ** reloadData is called to indicate data from the controller has changed
    ** usually means a (partial) redraw
    */
    view.reloadData = function() {
      if (view.dataSource) {
        view.data.numberOfItems = view.dataSource.numberOfItems();
        view.data.itemWidth = view.dataSource.itemWidth() || 1;
        view.data.selectedItemIndex = 0;
        view.layout();
        view.draw();
      }
    };

    view.itemAtIndex = function(index) {
      if (index<0 || index>=view.data.numberOfItems) return null;
      return $('> .item[data-item-index="'+index+'"]', view.$items);
    };

    view.indexForSelectedItem = function() {
      return view.data.selectedItemIndex;
    };

    view._setIndex = function(index) {
      if (index<0) return;
      view.data.selectedItemIndex = index;
      view.delegate.didSelectItemAtIndex(view, index);
    };

    view.selectItemAtIndex = function(index, animated) {
      if (index<0) index = 0;
      if (index>=view.data.numberOfItems) index = view.data.numberOfItems-1;
      if (index==view.data.selectedItemIndex) {
        $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
        view.scrollIntoView(animated);
        return; // no change
      }
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).removeClass('selected');
      view._setIndex(index);
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
      view.scrollIntoView(animated);
    };

    view.selectItemFromScrollposition = function() {
      if (view.data.isScrolling) return;
      var $photo = $('.items .item.selected', view.$frame);
      var $firstphoto = $('.items .item[data-item-index="0"]', view.$frame);
      var top = app.helpers.scrollTop();
      var bottom = top + app.data.h - $firstphoto.height(); // actually, bottom means the top of a last fully visible photo
      var newtop = $photo.offset().top - $firstphoto.offset().top;

      var minindexInView = Math.max(view.data.numberOfItemsPerRow * Math.floor((top - $firstphoto.offset().top)/$firstphoto.height() + 1), 0);
      var maxindexInView = Math.max(minindexInView + view.data.numberOfItemsPerRow * Math.floor(app.data.h/$firstphoto.height()) - 1, minindexInView + view.data.numberOfItemsPerRow - 1);

      var index = view.data.selectedItemIndex;
      while (index < minindexInView) {
        index+= view.data.numberOfItemsPerRow;
      }
      while (index > maxindexInView) {
        index-= view.data.numberOfItemsPerRow;
      }
      if (index==view.data.selectedItemIndex) return;

      if (index<0) index = 0;
      if (index>=view.data.numberOfItems) index = view.data.numberOfItems-1;
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).removeClass('selected');
      view._setIndex(index);
      $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
    };

    view.scrollIntoView = function(animated) {
      // scroll into view, bit above bottom
      var duration = (animated? 400: 0);
      var $photo = $('.items .item.selected', view.$frame);
      var $firstphoto = $('.items .item[data-item-index="0"]', view.$frame);
      if (!$photo.length || !$firstphoto.length) return;
      var top = app.helpers.scrollTop();
      var bottom = top + app.data.h - $firstphoto.height(); // actually, bottom means the top of a last fully visible photo
      var newtop = $photo.offset().top - $firstphoto.offset().top;
      if (newtop<=top || newtop>=bottom) { // <= and >= for some reason it doesn't scroll on load, but it comes around a secound time but then newtop==top, so just scroll then too
        view.data.isScrolling = true;
        app.data.$scrollable.stop();
        app.data.$scrollable.animate({scrollTop: newtop}, duration, 'swing', function(){ view.data.isScrolling = false;});
      }
    };

    view.handleEvent = function(e) {
      var handled = false;
      switch (e.type) {
        case 'click': handled = view.eventActivate(e); break;
        case 'keydown': handled = view.eventKeyDown(e); break;
        case 'keyup': handled = view.eventKeyUp(e); break;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    view.eventActivate = function(e) {

      var $item = null;
      if ($(e.target).hasClass('item')) {
        $item = $(e.target);
      }
      else {
        $item = $(e.target).closest('.item');
      }

      if ($item.length) {
        var index = parseInt($item.attr('data-item-index'), 10);
        view.selectItemAtIndex(index, true);
        view.delegate.didActivateItemAtIndex(view, view.data.selectedItemIndex);
      }

      return true;
    };

    view.eventKeyDown = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.LEFT:
               view.selectItemAtIndex(view.data.selectedItemIndex-1, true);
               return true;
        case app.KEYCODE.RIGHT:
               view.selectItemAtIndex(view.data.selectedItemIndex+1, true);
               return true;
        case app.KEYCODE.UP:
               view.selectItemAtIndex(view.data.selectedItemIndex-view.data.numberOfItemsPerRow, true);
               return true;
        case app.KEYCODE.DOWN:
               view.selectItemAtIndex(view.data.selectedItemIndex+view.data.numberOfItemsPerRow, true);
               return true;
        case app.KEYCODE.HOME:
               view.selectItemAtIndex(0, true);
               return true;
        case app.KEYCODE.END:
               view.selectItemAtIndex(view.data.numberOfItems-1, true);
               return true;
      }
      return false;
    };

    view.eventKeyUp = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.ENTER:
               view.delegate.didActivateItemAtIndex(view, view.data.selectedItemIndex);
               return true;
        case app.KEYCODE.ESC:
               view.delegate.didCancel(view);
               return true;
      }
      return false;
    };
  };

  function HorizontalSwipeGalleryPhotoView() {
    var view = this;
    view.delegate = null;
    view.dataSource = null;
    view.$frame = null;
    view.data = {};

    view.data.numberOfItems = 0;
    view.data.itemWidth = 0;
    view.data.panBoundaryRight = 0;
    view.data.panBoundaryLeft = 0;
    view.data.panPosition = 0;
    view.data.selectedItemIndex = 0;
    view.data.position = 0;

    /*
    ** initWithFrame is called each time the view needs a complete redraw
    */
    view.initWithFrame = function($frame) {
      view.$frame = $frame;
      view.$frame.html('<div class="view"><div class="header"></div><div class="items"></div></div>');
      view.$view = $('> .view', view.$frame);
      view.$header = $('> .view > .header', view.$frame);
      view.$header.on('click', view.handleEvent);
      view.$items = $('> .view > .items', view.$frame);
      view.$items.panhandler({inertia: 0.0, callback: view.panhandler});
      view.$items.on('click', function(e) { e.preventDefault(); e.stopPropagation(); return false; });
      view.$items.on('activate', view.handleEvent);
      view.$items.on('webkitTransitionEnd', view.handleEvent);
      view.$items.on('transitionend', view.handleEvent);
      view.$items.on('oTransitionEnd', view.handleEvent);
      view.$items_style = view.$items.get(0).style;
    };

    /*
    ** draw is used to redraw the internals, in this case the items
    */
    view.draw = function() {
      $('> .header', view.$view).html(view.dataSource.htmlForHeader());

      view.$items.css({'width':3*view.data.itemWidth});

      var minheightItem = app.data.h;
      $('> .view', view.$frame).css({'minHeight': minheightItem + view.$header.height()});
      view.$items.css({'minHeight': minheightItem});

      var items = String();
      var index = view.indexForSelectedItem();
      for(var i = index-1; i<=index+1; ++i) {
        items+= '<div class="item" data-item-index="'+i+'">'+view.dataSource.htmlForItemAtIndex(i)+'</div>';
      }

      view.$items.html(items);
      $('*', view.$items).attr('unselectable', 'on');

      var minheightItem = app.data.h;
      $('> .item', view.$items).width(app.data.w).height(minheightItem);

      view.updatePosition(-(view.data.itemWidth));
    };

    /*
    ** layout is used to update in response to global resize
    */
    view.layout = function() {
      if (view.data.itemWidth) {
        view.data.itemWidth = view.dataSource.itemWidth() || app.data.w;
        view.data.panBoundaryRight = -0.5*view.data.itemWidth;
        view.data.panBoundaryLeft = -2*view.data.itemWidth + 0.5*view.data.itemWidth;
        view.draw();
      }
      window.setTimeout(function() {
        view.scrollIntoView(true);
      }, 200);
    };

    /*
    ** reloadData is called to indicate data from the controller has changed
    ** usually means a (partial) redraw
    */
    view.reloadData = function() {
      if (view.dataSource) {
        view.data.numberOfItems = view.dataSource.numberOfItems();
        view.data.itemWidth = view.dataSource.itemWidth() || app.data.w;
        view.data.panBoundaryRight = -0.5*view.data.itemWidth;
        view.data.panBoundaryLeft = -2*view.data.itemWidth + 0.5*view.data.itemWidth;
        view.data.selectedItemIndex = 0;
        view.draw();
      }
    };

    view.scrollIntoView = function(animated) {
      // scroll into view, top of photo at top
      var duration = (animated? 400: 0);
      var $item = $('> .item', view.$items);
      if (!$item.length) return;
      var newtop = $item.offset().top;
      app.data.$scrollable.stop();
      app.data.$scrollable.animate({scrollTop: newtop}, duration);
    };

    view.itemAtIndex = function(index) {
      if (index<0 || index>=view.data.numberOfItems) return null;
      return $('> .item[data-item-index="'+index+'"]', view.$items);
    };

    view.indexForSelectedItem = function() {
      return view.data.selectedItemIndex;
    };

    view._setIndex = function(index) {
      if (index<0) return;
      view.data.selectedItemIndex = index;
      view.delegate.didSelectItemAtIndex(view, index);
    };

    view.eventTransitionEnd = function(e) {
      window.clearTimeout(view.updatePositionCallbackTimeout);
      var callback = view.data.transitionEndCallback;
      if (typeof callback != 'undefined') callback();
      delete(view.data.transitionEndCallback);

      return true;
    };

    view.selectItemAtIndex = function(index, animated) {
      var duration = (animated? 200: 0);
      if (index<0) index = 0;
      if (index>=view.data.numberOfItems) index = view.data.numberOfItems-1;
      if (index==view.data.selectedItemIndex) {
        $('> .item[data-item-index="'+view.data.selectedItemIndex+'"]', view.$items).addClass('selected');
        return; // no change
      }

      var newitem = $('> .item[data-item-index="'+index+'"]', view.$items);

      if (!newitem.length) {
        // update selected index
        view._setIndex(index);
        view.draw();
        return;
      }

      // set all to new item, reset position to center
      $('> .item', view.$items).html(newitem.html());
      view._setIndex(index);

      // ugly hack to get flicker to stop on iPad
      window.setTimeout(function() {
            // update selected index
            view.updatePosition(-(view.data.itemWidth), false);
            // and update left/right item images + all index data-attributes
            var index = view.indexForSelectedItem();
            var i = index-1;
            $('> .item', view.$items).each(function() {
              $(this).attr('data-item-index', i);
              if (i!=index) {
                $(this).html(view.dataSource.htmlForItemAtIndex(i));
              }
              ++i;
            });
      }, 200);
    };

    view.updateIndexFromPanPosition = function() {
      var index = view.data.selectedItemIndex;
      var dindex = (view.data.panPosition + view.data.itemWidth);
      // threshold for prev/next
      if (Math.abs(dindex / view.data.itemWidth) >= 0.25) {
        dindex = Math.round(Math.abs(dindex)/dindex);
      }
      else dindex = 0;
      if (index+dindex<0) dindex = 0;
      if (index+dindex>=view.data.numberOfItems) dindex = 0;
      index+= dindex;

      var right = -(view.data.itemWidth) + (dindex * view.data.itemWidth);
      view.updatePosition(right, true, function() { view.selectItemAtIndex(index); });

      return;
    };

    view.updatePosition = function(right, animated, callback) {

      var duration = (animated? 200: 0);
      var style = view.$items_style;
      if (app.data.css3transformsupport) {
        // set duration speed (0 represents 1-to-1 scrolling)
        if (app.data.css3transitionsupport) { style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = duration + 'ms'; }
        // translate to given index position
        style.MozTransform = style.webkitTransform = 'translate3d(' + -(right) + 'px,0,0)';
        style.msTransform = style.OTransform = 'translateX(' + -(right) + 'px)';
        view.data.position = right;
        view.data.transitionEndCallback = callback;
        // ugly hack to get callback for ie9, which supports css3transitions but not transitionEndCallback
        view.updatePositionCallbackTimeout = window.setTimeout(function() {
              // update selected index
              if (typeof callback != 'undefined') callback();
        }, duration+200);
      }
      else {
        //view.$items.css({'right':right});
        view.$items.stop().animate({'right':right},
                                   duration,
                                   'swing',
                                   function() { view.data.position = right;
                                                if (typeof callback != 'undefined') callback();
                                              });
      }
    };

    view.panhandler = function($element, data, done) {

      if (data.state == 'end-click' && data.target) {
        $(data.target).trigger('activate');
        return;
      }

      if (data.state == 'start') {
        view.data.panPosition = view.data.position;
      }

      view.data.panPosition = view.data.panPosition - data.dx;
      var right = 0;

      if (view.data.panPosition > view.data.panBoundaryRight) {
        var overX = Math.abs(view.data.panPosition - view.data.panBoundaryRight);
        var resistedX = view.data.itemWidth * overX / (view.data.itemWidth + overX);
        right = view.data.panBoundaryRight + resistedX;
        if (data.state == 'move' && $(":animated").length) {
          $element.finish();
          return false;
        }
      }
      else if (view.data.panPosition < view.data.panBoundaryLeft) {
        var overX = Math.abs(view.data.panPosition - view.data.panBoundaryLeft);
        var resistedX = view.data.itemWidth * overX / (view.data.itemWidth + overX);
        right = view.data.panBoundaryLeft - resistedX;
        if (data.state == 'move' && $(":animated").length) {
          $element.finish();
          return false;
        }
      }
      else right = view.data.panPosition;

      view.updatePosition(right);

      if (done) {
        // snap to boundaries
        if (view.data.panPosition > view.data.panBoundaryRight) { view.updatePosition(view.data.panBoundaryRight, true); }
        else if (view.data.panPosition < view.data.panBoundaryLeft) { view.updatePosition(view.data.panBoundaryLeft, true); }
        // update index to nearest item
        view.updateIndexFromPanPosition();
      }

      //view.updateIndexFromPanPosition();
    };

    view.handleEvent = function(e) {
      var handled = false;
      switch (e.type) {
        case 'click':
        case 'activate': handled = view.eventActivate(e); break;
        case 'keydown': handled = view.eventKeyDown(e); break;
        case 'keyup': handled = view.eventKeyUp(e); break;

        case 'webkitTransitionEnd':
        case 'oTransitionEnd':
        case 'transitionend': handled = view.eventTransitionEnd(e); break;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    view.eventActivate = function(e) {

      var $header = null;
      if ($(e.target).hasClass('header')) {
        $header = $(e.target);
      }
      else {
        $header = $(e.target).closest('.header');
      }
      if ($header.length) {
        view.delegate.didCancel(view);
        return true;
      }

      var $item = null;
      if ($(e.target).hasClass('item')) {
        $item = $(e.target);
      }
      else {
        $item = $(e.target).closest('.item');
      }

      if ($item.length) {
        var index = parseInt($item.attr('data-item-index'), 10);
        view.selectItemAtIndex(index, true);
        view.delegate.didActivateItemAtIndex(view, view.data.selectedItemIndex);
      }

      return true;
    };

    view.eventKeyDown = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.LEFT:
              if (view.data.selectedItemIndex==0) {
                view.updatePosition(-(1.5*view.data.itemWidth), true, function() {
                  view.updatePosition(-(1*view.data.itemWidth), true);
                });
                return true;
              }
              view.updatePosition(-(2*view.data.itemWidth), true, function() {
                view.selectItemAtIndex(view.data.selectedItemIndex-1, true);
              });
              return true;
        case app.KEYCODE.RIGHT:
              if (view.data.selectedItemIndex==view.data.numberOfItems-1) {
                view.updatePosition(-(0.5*view.data.itemWidth), true, function() {
                  view.updatePosition(-(1*view.data.itemWidth), true);
                });
                return true;
              }
              view.updatePosition(0, true, function() {
                view.selectItemAtIndex(view.data.selectedItemIndex+1, true);
              });
              return true;
      }
      return false;
    };

    view.eventKeyUp = function(e) {
      switch (e.keyCode) {
        case app.KEYCODE.ENTER:
              view.delegate.didActivateItemAtIndex(view, view.data.selectedItemIndex);
              return true;
        case app.KEYCODE.ESC:
              view.delegate.didCancel(view);
              return true;
      }
      return false;
    };
  };

  // models

  app.homeItem = {
    countString: function(item) {
      return item.is_gallery? item.count+' photo'+(item.count==1?'':'s'):'a story';
    },
    source: function(item) {
      if (item.is_gallery) {
        return app.helpers.autoRetinaSource('/galleries/'+item.slug+'/index.jpg');
      }
      else {
        return app.helpers.autoRetinaSource('/stories/'+item.slug+'/index.jpg');
      }
    }
  };

  app.photoItem = {
    thumb: function(gallery, photo) {
      return app.helpers.autoRetinaSource('/galleries/'+gallery.slug+'/'+photo.name+'-thumb.jpg');
    },
    source: function(gallery, photo) {
      var threshold_retina = 786432; // 1024 *  768
      var threshold_full = 3145728; // 2048 * 1536
      var viewarea = app.data.w*app.data.h;
      var imagename = '/galleries/'+gallery.slug+'/'+photo.name+'.jpg';
      if (viewarea > threshold_full) return app.photoItem.fullsize(gallery, photo);
      else if (viewarea > threshold_retina) return app.helpers.retinaSource(imagename);
      else return app.helpers.autoRetinaSource(imagename);
    },
    fullsize: function(gallery, photo) {
      return '/galleries/'+gallery.slug+'/'+photo.name+'-full.jpg';
    }
  };

  // controllers

  function HomeController($frame) {
    var controller = this;
    controller.$frame = $frame;
    controller.view = null;
    controller.model = {};

    controller.model.items = [];

    /*
    ** loadView sets up the view with the frame, sets delegate & dataSource
    ** only needs to be called once, right after construction
    */
    controller.loadView = function() {
      var view = new HorizontalScrollListView();
      view.delegate = controller;
      view.dataSource = controller;
      controller.view = view;
    };

    /*
    ** viewDidLoad loads data if needed
    ** the view gets notified to update it's data & redraw
    */
    controller.viewDidLoad = function(indexslug) {
      controller.view.initWithFrame(controller.$frame);
      if (!controller.model.items.length) {
        controller.loadData(indexslug);
      }
      else {
        var index = controller.indexForSlug(indexslug);
        controller.view.reloadData();
        controller.view.selectItemAtIndex(index, true);
      }
    };

    /*
    ** layout updates the view
    */
    controller.layout = function() {
      $frame.attr('class', 'home');
      controller.view.layout();
      $frame.css({'opacity':1});
    };

    /*
    ** loadData updates the complete model
    ** the view gets notified to update it's data & redraw
    */
    controller.loadData = function(indexslug) {
      $.ajax({
        url: '/json/index.json?v=20171012',
        dataType: 'json',
        context: controller,
        success: function(response) {
          controller.model.items = []; // reset
          var n = response.length;
          for (var i=0; i<n; ++i) {
            var item = response[i];
            item.index = controller.model.items.length;
            item.is_gallery = (item.type === 'gallery');
            controller.model.items.push(item);
          }
          var index = controller.indexForSlug(indexslug);
          controller.view.reloadData();
          controller.view.selectItemAtIndex(index, true);
        }
      });
    };

    controller.setIndex = function(index) {
      controller.view.selectItemAtIndex(index);
    };

    controller.indexForSlug = function(indexslug) {
      var index = 0;
      if (indexslug) {
        var n = controller.model.items.length;
        for (var i=0; i<n; ++i) {
          var item = controller.model.items[i];
          if (item.slug == indexslug) {
            index = i;
          }
        }
      }
      return index;
    };

    controller.numberOfItems = function() {
      return controller.model.items.length;
    };

    controller.itemWidth = function() {
      return 210.0;
    };

    controller.htmlForItemAtIndex = function(index) {
      if (index<0 || index>=controller.model.items.length) return null;
      var item = controller.model.items[index];
      return String() +
      '<div class="group" data-item-slug="'+item.slug+'">' +
      '  <img class="bck" src="/css/erased.png" alt="">' +
      '  <time datetime="'+item.timestamp+'">'+app.helpers.formatDate(item.timestamp)+'</time>' +
      '  <div class="polaroid">' +
      '    <div class="vignetted"><div class="vignette"></div><img src="'+app.homeItem.source(item)+'" width="160" height="106" alt=""></div>' +
      '    <a href="#'+item.slug+'">'+item.title+'</a>' +
      '  </div>' +
      '  <p>'+item.text+'</p>' +
      '  <p>('+app.homeItem.countString(item)+')</p>' +
      '</div>';
    };

    controller.appHomeClicked = function() {
      controller.view.selectItemAtIndex(0);
    };

    controller.didCancel = function(view) {
    };

    controller.didSelectItemAtIndex = function(view, index) {
      var item = controller.model.items[index];
      app.router.home(item.slug, false);
    };

    controller.didActivateItemAtIndex = function(view, index) {
      var item = controller.model.items[index];
      app.router.home(item.slug, true);
      $frame.animate({'opacity':0.01}, 400, 'linear', function() {
        if (item.is_gallery) app.router.gallery(item.slug, '', true);
        else app.router.story(item.slug, true);
      });
    };
  };

  function StoryController($frame) {
    var controller = this;
    controller.$frame = $frame;
    controller.view = null;
    controller.model = {};

    controller.model.story = {};

    /*
    ** loadView sets up the view with the frame, sets delegate & dataSource
    ** only needs to be called once, right after construction
    */
    controller.loadView = function() {
      var view = new HtmlView();
      view.delegate = controller;
      view.dataSource = controller;
      controller.view = view;
    };

    /*
    ** viewDidLoad loads data if needed
    ** the view gets notified to update it's data & redraw
    */
    controller.viewDidLoad = function(storyslug) {
      controller.view.initWithFrame(controller.$frame);
      if (!controller.model.story || controller.model.storyslug!==storyslug) {
        controller.loadData(storyslug);
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
    controller.loadData = function(storyslug) {
      $.ajax({
        url: '/json/story/'+storyslug+'.json',
        dataType: 'json',
        context: controller,
        success: function(response) {
          controller.model.storyslug = storyslug;
          controller.model.story = response;
          controller.view.reloadData();
        }
      });
    };

    controller.html = function() {
      if (!controller.model.story) return null;
      var story = controller.model.story;
      return String() +
      '<div class="story">' +
      '  <h2 class="title">'+story.title+'<span class="date">, '+app.helpers.formatDate(story.timestamp)+'</span></h2>' +
      '  <p>'+story.text+'</p>' +
      '</div>';
    };

    controller.appHomeClicked = function() {
      $frame.animate({'opacity':0.01}, 100, 'linear', function() {
        app.router.home(controller.model.storyslug, true);
      });
    };

    controller.didCancel = function(view) {
      $frame.animate({'opacity':0.01}, 100, 'linear', function() {
        app.router.home(controller.model.storyslug, true);
      });
    };
  };

  function GalleryController($frame) {
    var controller = this;
    controller.$frame = $frame;
    controller.view = null;
    controller.model = {};

    controller.model.gallery = {};
    controller.model.galleryslug = null;

    /*
    ** loadView sets up the view with the frame, sets delegate & dataSource
    ** only needs to be called once, right after construction
    */
    controller.loadView = function() {
      var view = new GalleryView();
      view.delegate = controller;
      view.dataSource = controller;
      controller.view = view;
    };

    /*
    ** viewDidLoad loads data if needed
    ** the view gets notified to update it's data & redraw
    */
    controller.viewDidLoad = function(galleryslug, photoslug) {
      controller.view.initWithFrame(controller.$frame);
      if (!controller.model.gallery || controller.model.galleryslug!==galleryslug) {
        controller.loadData(galleryslug, photoslug);
      }
      else {
        controller.view.reloadData();
        var index = controller.indexForSlug(photoslug);
        controller.setIndex(index);
      }
    };

    /*
    ** layout updates the view
    */
    controller.layout = function() {
      $frame.attr('class', 'gallery');
      controller.view.layout();
      $frame.css({'opacity':1});
    };

    /*
    ** scroll may redefine selected item
    */
    controller.handleScroll = function() {
      if (controller.scrollTimeout) window.clearTimeout(controller.scrollTimeout);
      controller.scrollTimeout = window.setTimeout(function() {
        controller.view.selectItemFromScrollposition();
      }, 200);
    };

    /*
    ** loadData updates the complete model
    ** the view gets notified to update it's data & redraw
    */
    controller.loadData = function(galleryslug, photoslug) {
      $.ajax({
        url: '/json/gallery/'+galleryslug+'.json',
        dataType: 'json',
        context: controller,
        success: function(response) {
          controller.model.galleryslug = galleryslug;
          controller.model.gallery = response;
          controller.view.reloadData();
          var index = controller.indexForSlug(photoslug);
          controller.setIndex(index);
        }
      });
    };

    controller.setIndex = function(index) {
      controller.view.selectItemAtIndex(index);
    };

    controller.indexForSlug = function(photoslug) {
      var index = 0;
      if (photoslug) {
        var n = controller.model.gallery.photos.length;
        for (var i=0; i<n; ++i) {
          var item = controller.model.gallery.photos[i];
          if (item.name == photoslug) {
            index = i;
          }
        }
      }
      return index;
    };

    controller.numberOfItems = function() {
      return controller.model.gallery.photos.length;
    };

    controller.itemWidth = function() {
      return 190.0;
    };

    controller.htmlForHeader = function(i) {
      if (!controller.model.gallery) return null;
      var gallery = controller.model.gallery;
      return String() +
      '<h2 class="title">'+gallery.title+'<span class="date">, '+app.helpers.formatDate(gallery.timestamp)+'</span></h2>';
    };

    controller.htmlForItemAtIndex = function(index) {
      if (index<0 || index>=controller.model.gallery.photos.length) return null;
      var item = controller.model.gallery.photos[index];
      return String() +
      '<div class="group" data-item-slug="'+item.name+'">' +
      '<div class="polaroid">' +
      ' <a href="#'+item.name+'">' +
      '  <div class="vignetted"><div class="vignette"></div><img src="'+app.photoItem.thumb(controller.model.gallery, item)+'" width="160" height="106" alt=""></div>' +
      '   '+item.name +
      ' </a>' +
      '</div>' +
      '</div>';
    };

    controller.appHomeClicked = function() {
      $frame.animate({'opacity':0.01}, 100, 'linear', function() {
        app.router.home(controller.model.galleryslug, true);
      });
    };

    controller.didCancel = function(view) {
      $frame.animate({'opacity':0.01}, 100, 'linear', function() {
        app.router.home(controller.model.galleryslug, true);
      });
    };

    controller.didSelectItemAtIndex = function(view, index) {
      var item = controller.model.gallery.photos[index];
      app.router.gallery(controller.model.galleryslug, item.name, false);
    };

    controller.didActivateItemAtIndex = function(view, index) {
      var item = controller.model.gallery.photos[index];
      app.router.gallery(controller.model.galleryslug, item.name, true);
      $frame.animate({'opacity':0.01}, 400, 'linear', function() {
        app.router.galleryPhoto(controller.model.galleryslug, item.name, true);
      });
    };
  };

  function GalleryPhotoController($frame) {
    var controller = this;
    controller.$frame = $frame;
    controller.view = null;
    controller.model = {};

    controller.model.gallery = {};
    controller.model.galleryslug = null;

    /*
    ** loadView sets up the view with the frame, sets delegate & dataSource
    ** only needs to be called once, right after construction
    */
    controller.loadView = function() {
      var view = new HorizontalSwipeGalleryPhotoView();
      view.delegate = controller;
      view.dataSource = controller;
      controller.view = view;
    };

    /*
    ** viewDidLoad loads data if needed
    ** the view gets notified to update it's data & redraw
    */
    controller.viewDidLoad = function(galleryslug, photoslug) {
      controller.view.initWithFrame(controller.$frame);
      if (!controller.model.gallery || controller.model.galleryslug!==galleryslug) {
        controller.loadData(galleryslug, photoslug);
      }
      else {
        controller.view.reloadData();
        var index = controller.indexForSlug(photoslug);
        controller.setIndex(index);
      }
    };

    /*
    ** layout updates the view
    */
    controller.layout = function() {
      $frame.attr('class', 'galleryphoto');
      controller.view.layout();
      $frame.css({'opacity':1});
    };

    /*
    ** loadData updates the complete model
    ** the view gets notified to update it's data & redraw
    */
    controller.loadData = function(galleryslug, photoslug) {
      $.ajax({
        url: '/json/gallery/'+galleryslug+'.json',
        dataType: 'json',
        context: controller,
        success: function(response) {
          controller.model.galleryslug = galleryslug;
          controller.model.gallery = response;
          controller.view.reloadData();
          var index = controller.indexForSlug(photoslug);
          controller.setIndex(index);
        }
      });
    };

    controller.setIndex = function(index) {
      controller.view.selectItemAtIndex(index);
    };

    controller.indexForSlug = function(photoslug) {
      var index = 0;
      if (photoslug) {
        var n = controller.model.gallery.photos.length;
        for (var i=0; i<n; ++i) {
          var item = controller.model.gallery.photos[i];
          if (item.name == photoslug) {
            index = i;
          }
        }
      }
      return index;
    };

    controller.numberOfItems = function() {
      return controller.model.gallery.photos.length;
    };

    controller.itemWidth = function() {
      return app.data.w;
    };

    controller.htmlForHeader = function(i) {
      if (!controller.model.gallery) return null;
      var gallery = controller.model.gallery;
      return String() +
      '<h2 class="title"><a href="#gallery">'+gallery.title+'<span class="date">, '+app.helpers.formatDate(gallery.timestamp)+'</span></a></h2>';
    };

    controller.htmlForItemAtIndex = function(index) {
      var w = app.data.w;
      var h = Math.max(1, app.data.h);
      if (index<0 || index>=controller.model.gallery.photos.length) {
        return String() +
        '<div class="photo">' +
        ' <img src="/css/xpix.gif" width="'+w+'" height="'+h+'" alt="">' +
        '</div>';
      }
      var item = controller.model.gallery.photos[index];
      var wimg = item.size[0];
      var himg = Math.max(1, item.size[1]); // prevent div by zero

      if (wimg/himg > w/h) {
        h = Math.round(w*himg/Math.max(1,wimg));
      }
      else {
        w = Math.round(h*wimg/Math.max(1,himg));
      }

      return String() +
      '<div class="photo" data-item-slug="'+item.name+'">' +
      ' <a href="#'+item.name+'">' +
      '  <img src="'+app.photoItem.source(controller.model.gallery, item)+'" width="'+w+'" height="'+h+'" alt="'+item.name+'">' +
      ' </a>' +
      '</div>';
    };

    controller.sizeForItemAtIndex = function(index) {
      if (index<0 || index>=controller.model.gallery.photos.length) return [1, 1];
      var item = controller.model.gallery.photos[index];
      return item.size;
    };

    controller.appHomeClicked = function() {
      $frame.animate({'opacity':0.01}, 100, 'linear', function() {
        app.router.home(controller.model.galleryslug, true);
      });
    };

    controller.didCancel = function(view) {
      var index = controller.view.indexForSelectedItem();
      var item = controller.model.gallery.photos[index];
      $frame.animate({'opacity':0.01}, 100, 'linear', function() {
        app.router.gallery(controller.model.galleryslug, item.name, true);
      });
    };

    controller.didSelectItemAtIndex = function(view, index) {
      var item = controller.model.gallery.photos[index];
      app.router.galleryPhoto(controller.model.galleryslug, item.name, false);
    };

    controller.didActivateItemAtIndex = function(view, index) {
      var item = controller.model.gallery.photos[index];
      $frame.animate({'opacity':0.01}, 400, 'linear', function() {
        app.router.gallery(controller.model.galleryslug, item.name, true);
      });
    };
  };

  // app

  app.helpers = {

    formatDate: function(timestamp) {
      if (!timestamp) return '';
      var date = Date.parse(timestamp);
      return date.toString('MMMM dS, yyyy');
    },

    formatThisYear: function() {
      var date = new Date();
      return date.toString('yyyy');
    },

    retinaSource: function(source) {
      var sourceparts = source.split('.');
      sourceparts[sourceparts.length-2] += '@2x';
      return sourceparts.join('.');
    },

    autoRetinaSource: function(source) {
      var retina = window.devicePixelRatio > 1.5;
      if (retina) {
        return app.helpers.retinaSource(source);
      }
      return source;
    },

    layout: function() {
      app.data.w = $(window).width();
      app.data.h = $(window).height();

      var hhead = $('#head').height();
      var hcontent = $('#content').height();
      var hfoot = $('#c').height();

      // minimum full height for the lot
      $('#content').css({minHeight: app.data.h - hhead - hfoot});

      if (app.controller && app.controller.layout) {
        app.controller.layout();
      }
    },

    scrollTop: function() {
      return Math.max.apply(null, app.data.$scrollable.map(function() { return $(this).scrollTop(); }).get());
    },

    scrolled: function() {
      if (app.controller && app.controller.handleScroll) {
        app.controller.handleScroll();
      }
    },

    testSupport: function() {
      app.data.w = $(window).width();
      app.data.h = $(window).height();
      app.data.$scrollable = $('body,html,document');

      //app.data.css3animationsupport = false;
      app.data.css3transitionsupport = false;
      app.data.css3transformsupport = false;
      var style = $('body').get(0).style;
      if (typeof style.webkitTransitionDuration !== "undefined" ||
          typeof style.MozTransitionDuration !== "undefined" ||
          typeof style.msTransitionDuration !== "undefined" ||
          typeof style.OTransitionDuration !== "undefined" ||
          typeof style.transitionDuration !== "undefined") {
        app.data.css3transitionsupport = true;
      }
      if (typeof style.webkitTransform !== "undefined" ||
          typeof style.MozTransform !== "undefined" ||
          typeof style.msTransform !== "undefined" ||
          typeof style.OTransform !== "undefined") {
        app.data.css3transformsupport = true;
      }
    }
  };

  app.states = {
    home: function(indexslug) {
      if (!app.homeController) {
        app.homeController = new HomeController($('#content'));
        app.homeController.loadView();
      }
      if (app.controller !== app.homeController) {
        app.homeController.viewDidLoad(indexslug);
        app.controller = app.homeController;
      }
      else {
        var index = app.controller.indexForSlug(indexslug);
        app.controller.setIndex(index);
      }
      app.controller.layout();
    },
    story: function(storyslug) {
      if (!app.storyController) {
        app.storyController = new StoryController($('#content'));
        app.storyController.loadView();
      }
      if (app.controller !== app.storyController) {
        app.storyController.viewDidLoad(storyslug);
        app.controller = app.storyController;
      }
      app.controller.layout();
    },
    gallery: function(galleryslug, photoslug) {
      if (!app.galleryController) {
        app.galleryController = new GalleryController($('#content'));
        app.galleryController.loadView();
      }
      if (app.controller !== app.galleryController) {
        app.galleryController.viewDidLoad(galleryslug, photoslug);
        app.controller = app.galleryController;
      }
      else {
        if (app.controller.model.galleryslug !== galleryslug) {
          app.controller.loadData(galleryslug, photoslug);
        }
        else {
          var index = app.controller.indexForSlug(photoslug);
          app.controller.setIndex(index);
        }
      }
      app.controller.layout();
    },
    galleryPhoto: function(galleryslug, photoslug) {
      if (!app.galleryPhotoController) {
        app.galleryPhotoController = new GalleryPhotoController($('#content'));
        app.galleryPhotoController.loadView();
      }
      if (app.controller !== app.galleryPhotoController) {
        app.galleryPhotoController.viewDidLoad(galleryslug, photoslug);
        app.controller = app.galleryPhotoController;
      }
      else {
        if (app.controller.model.galleryslug !== galleryslug) {
          app.controller.loadData(galleryslug, photoslug);
        }
        else {
          var index = app.controller.indexForSlug(photoslug);
          app.controller.setIndex(index);
        }
      }
      app.controller.layout();
    }
  };

  /*
   *  /                     home, #latest selected
   *  /#slug                home, #slug selected
   *  /story/slug           story
   *  /gallery/slug         gallery: #first selected
   *  /gallery/slug#photo   gallery, #photo selected
   *  /gallery/slug/photo   photo
   */
  app.router = {
    parseUrl: function() {
      var pathname = window.location.pathname;
      if (pathname.charAt(pathname.length-1) === "/") pathname = pathname.substr(0, pathname.length-1);
      var hash = window.location.hash.substr(1);
      if (pathname === "") {
        app.states.home(hash);
      }
      else if (pathname.indexOf('/story/') === 0) {
        var slugs = pathname.substr('/story/'.length).split("/");
        var storyslug = slugs[0];
        if (slugs.length > 1) window.location.href = "/story/" + storyslug;
        else app.states.story(storyslug);
      }
      else if (pathname.indexOf('/gallery/') === 0) {
        var slugs = pathname.substr('/gallery/'.length).split("/");
        var galleryslug = slugs[0];
        var photoslug = null;
        if (slugs.length > 1) photoslug = slugs[1];
        if (slugs.length > 2) window.location.href = "/gallery/" + galleryslug + "/" + photoslug;
        else if (slugs.length > 1) {
          if (hash) window.location.href = "/gallery/" + galleryslug + "/" + photoslug;
          else app.states.galleryPhoto(galleryslug, photoslug);
        }
        else {
          app.states.gallery(galleryslug, hash);
        }
      }
      else window.location.href = "/";
    },
    gotoUrl: function(url, push) {
      if (window.location.href!=url) {
        if (history.pushState) {
          if (push) {
            history.pushState(null, "", url);
            app.router.parseUrl();
          }
          else {
            history.replaceState(null, "", url);
          }
        }
        else {
          if (push) window.location.href = url;
        }
      }
    },
    home: function(indexslug, push) {
      var url = "/";
      if (indexslug) url+= "#" + indexslug;
      app.router.gotoUrl(url, push);
    },
    story: function(storyslug, push) {
      var url = "/story/" + storyslug;
      app.router.gotoUrl(url, push);
    },
    gallery: function(galleryslug, photoslug, push) {
      var url = "/gallery/" + galleryslug;
      if (photoslug) url+= "#" + photoslug;
      app.router.gotoUrl(url, push);
    },
    galleryPhoto: function(galleryslug, photoslug, push) {
      var url = "/gallery/" + galleryslug + "/" + photoslug;
      app.router.gotoUrl(url, push);
    }
  };

  app.run = function() {

    app.helpers.testSupport();

    // (c) 2001-2013: auto-update the 2013 to the current year
    $('.thisyear').html(app.helpers.formatThisYear());

    $(document).on('keydown', app.handleEvent)
               .on('keyup', app.handleEvent)
               .on('keypress', app.handleEvent);

    $('[href="#home"]').on('click', app.handleHomeClick);
  };

  app.handleEvent = function(e) {
    if (app.controller && app.controller.view && app.controller.view.handleEvent) {
      app.controller.view.handleEvent(e);
    }
    else if (app.controller && app.controller.handleEvent) {
      app.controller.handleEvent(e);
    }
  };

  app.handleHomeClick = function(e) {
    if (app.controller && app.controller.appHomeClicked) {
      app.controller.appHomeClicked();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // refresh the layout on resize/orientationchange
  $(window).bind('popstate', app.router.parseUrl);

  // refresh the layout on resize/orientationchange
  $(window).bind('resize', app.helpers.layout);
  $(window).bind('orientationchange', app.helpers.layout);

  // refresh the layout on scroll
  $(window).bind('scroll', app.helpers.scrolled);

  // init on load
  $(window).load(function() {

    // start by initializing the layout
    app.helpers.layout();

    // scroll url bar out of view on iphone/ipad, if content is big enough
    setTimeout(function() { window.scrollTo(0, 0); }, 100);
  });
}

var app = new App();

$(document).ready(function() {

  app.run();
  app.router.parseUrl();

});
