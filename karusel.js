;

(function($, window, document){

    $.Karusel = { };
    
    $.Karusel.ArraySource = function (array){
        this.data = array;
    };

    $.Karusel.ArraySource.prototype = {

        getDataAt : function (widget, index) {
            return this.data[index];
        },
        count : function (widget) {
            return this.data.length;   
        },
        render: function (widget, data, $item) {
            $item.html(data);
        }
    };

    $.Karusel.DomSource = function(options) {
        this.itemSelector = options.itemSelector;
        this.wrapperSelector = options.wrapperSelector;
    };

    $.Karusel.DomSource.prototype = {

        getDataAt : function (widget, index) {
            return $(this.itemSelector + ':eq(' + index + ')', this.wrapperSelector).html();
        },
        count: function (widget) {
			return $(this.itemSelector, this.wrapperSelector).size();
        },
        render: function (widget, data, $item) {
             $item.html(data);
        }
    };
    
    $.widget('mobile.karusel', $.mobile.widget, {
        
        options: {
            loop:false,
            itemClass : 'item',
            itemsClass : 'items',
            wrapperClass : 'karusel-wrapper',
            prevItemClass : 'prev-item',
            nextItemClass : 'next-item',
            parentPadding: 15,
			itemSourceClass : 'item-source',
			wrapperSourceClass: 'wrapper-source'
        },
        
        _createItem: function ($items, index, className) {

            var itemTag = '<div class="' + this.options.itemClass;
            if(className)
                itemTag += ' ' + className;
            itemTag += '"></div>';
            
            var $item = $(itemTag);
            $item.width(this._getItemWidth());
            
			if(this.options.parentPadding)
                $item.css('marginRight', this.options.parentPadding + 'px');
            
			var data = this.options.source.getDataAt(this,index);
            
            this.options.source.render(this, data, $item);
            $item.appendTo($items);
            return $item;
        },
        
        _createItems: function(currentIndex) {
     		$('.' + this.options.wrapperClass, this.element).width(this._getItemWidth());
            
            var $items = $('<div class="' + this.options.itemsClass + '"></div>');
            var count = this.options.source.count(this);
            var hasPrev = false;
            
            if(currentIndex > 0 || this.options.loop) {
                var prevIndex = currentIndex - 1;
                
                if(prevIndex < 0)
                    prevIndex = count-1;
                
				this._createItem($items, prevIndex, this.options.prevItemClass);
                hasPrev = true;
            }

            this._createItem($items, currentIndex);
            
            if(currentIndex < count-1 || this.options.loop) {
                var nextIndex = currentIndex + 1;
                
                if(nextIndex == count)
                    nextIndex = 0;

                this._createItem($items, nextIndex, this.options.nextItemClass);
            }

            if(hasPrev)
                $items.css('left', '-'+ ($('.' + this.options.itemClass, $items).width() + this.options.parentPadding)+ 'px');
           
            return $items;
        },
        
        _appendItems: function (index) {
            
            var $items =  this._createItems(index);
            $(this.wrapper, this.element).empty().append($items);

            var evtArgs = { items: $items, widget: this };
            var eventData = jQuery.Event("itemscreated", evtArgs);
            eventData.data = evtArgs;
            
            $(this.element).trigger(eventData, evtArgs);
        },
        
        _getItemWidth : function() {
            var width= $(window).innerWidth() - this.options.parentPadding * 2;
            return width;
        },
        
        _create : function(){
            this.currentIndex = 0;
            this.lastTime = 0;
            var self = this;

			if(! this.options.source){
				this.options.source = new $.Karusel.DomSource({
					itemSelector: '.'+ this.options.itemSourceClass,
					wrapperSelector : '.'+ this.options.wrapperSourceClass
				});
			}			
			
            var count = this.options.source.count(this);
            if(count == 0)
                return;
				
			$(this.element).addClass('karusel');	

            var $wrapper = $('<div class="' + this.options.wrapperClass + '"></div>').appendTo(this.element);

            this.wrapper = $wrapper[0];
            this.itemWidth = this._getItemWidth();
            this._appendItems(0);
            this.moving = false;
            
            $(document).on('swiperight',this.element, function(evt){
                self.movePrev();
                evt.preventDefault();
                return false;
            }).on('swipeleft', this.element,function(evt){
                self.moveNext();
                evt.preventDefault();
                return false;
            });
			
			
            $(this.element).on('dragstart','img', function(evt) {
                evt.preventDefault();
				return false;
            });

            $('.previous', this.element).click(function(){
                self.movePrev();
            });
            
            $('.next', this.element).click(function(){
                self.moveNext();
            });

            $(window).bind('resize', function() {
                self.resize();
            }).bind('orientationchange', function() {
                self.resize();
            });
            
        },
        
        movePrev: function(){
            var self=this;
            self.moving = true;
            var count = self.options.source.count(self);
            var lastIndex= self.currentIndex;
            self.currentIndex --;
            
            if(self.currentIndex < 0) 
            {
                self.currentIndex =  (self.options.loop)?count -1:0;
            }

            if(lastIndex != self.currentIndex) {
                $('.'+this.options.itemsClass, self.element).animate({
                    left: '0px'
                }, function () {
                    self._appendItems(self.currentIndex);
                    self.moving = false;
                });
            }
            else
                self.moving = false;
            
        },
        
        moveNext: function(){
            var self=this;
            self.moving = true;    
            var count = self.options.source.count(self);
            var lastIndex= self.currentIndex;
            self.currentIndex ++;
            
            if(self.currentIndex == count) 
            {
                self.currentIndex =  (self.options.loop)?	0:	count -1;
				
            }
            if(lastIndex != self.currentIndex) { 
                var left =0;
                if($('.'+self.options.prevItemClass,self.element).size() > 0)
                    left = 2 * self.itemWidth;
                else
                    left = self.itemWidth+ self.options.parentPadding;
                
                left = -left;

                $('.'+this.options.itemsClass, this.element).animate({
                    left: left + 'px'
                }, function () {
					self._appendItems(self.currentIndex);
                    self.moving = false;
                });
            }
             else
                self.moving = false;
        },
    
        destroy: function(){
            $.Widget.prototype.destroy.call(this);
        },
        
        resize: function () {
            var windowWidth = this._getItemWidth();
            $('.' + this.options.itemClass, this.element).width(windowWidth);
            this.itemWidth = windowWidth;
            this._appendItems(this.currentIndex);
        },
		refresh : function(){
			this._appendItems(this.currentIndex);
		}
        
    });

    $(document).bind("pageinit", function(e) {
        return $(":jqmData(role='karusel')", e.target).karusel();
    });
    
})(jQuery, window, document);