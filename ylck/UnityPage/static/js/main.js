if (typeof console === "undefined" || typeof console.log === "undefined") {
  console = {};
  console.log = function() {
  };
}
else {

}

if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  }
}

;
(function($) {
  
  var eventNamespace = 'waitForImages';

 
  $.waitForImages = {
    hasImageProperties: ['backgroundImage', 'listStyleImage', 'borderImage', 'borderCornerImage', 'cursor']
  };

 
  $.expr[':'].uncached = function(obj) {
   
    if (!$(obj).is('img[src!=""]')) {
      return false;
    }

  
    var img = new Image();
    img.src = obj.src;
    return !img.complete;
  };

  $.fn.waitForImages = function(finishedCallback, eachCallback, waitForAll) {

    var allImgsLength = 0;
    var allImgsLoaded = 0;

   
    if ($.isPlainObject(arguments[0])) {
      waitForAll = arguments[0].waitForAll;
      eachCallback = arguments[0].each;
     
      finishedCallback = arguments[0].finished;
    }

   
    finishedCallback = finishedCallback || $.noop;
    eachCallback = eachCallback || $.noop;

   
    waitForAll = !!waitForAll;

    
    if (!$.isFunction(finishedCallback) || !$.isFunction(eachCallback)) {
      throw new TypeError('An invalid callback was supplied.');
    }

    return this.each(function() {
    
      var obj = $(this);
      var allImgs = [];
    
      var hasImgProperties = $.waitForImages.hasImageProperties || [];
   
      var matchUrl = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

      if (waitForAll) {

      
        obj.find('*').each(function() {
          var element = $(this);

         
          if (element.is('img:uncached')) {
            allImgs.push({
              src: element.attr('src'),
              element: element[0]
            });
          }

          $.each(hasImgProperties, function(i, property) {
            var propertyValue = element.css(property);
            var match;

        
            if (!propertyValue) {
              return true;
            }

         
            while (match = matchUrl.exec(propertyValue)) {
              allImgs.push({
                src: match[2],
                element: element[0]
              });
            }
          });
        });
      } else {
      
        obj.find('img:uncached')
                .each(function() {
                  allImgs.push({
                    src: this.src,
                    element: this
                  });
                });
      }

      allImgsLength = allImgs.length;
      allImgsLoaded = 0;

    
      if (allImgsLength === 0) {
        finishedCallback.call(obj[0]);
      }

      $.each(allImgs, function(i, img) {

        var image = new Image();

      
        $(image).on('load.' + eventNamespace + ' error.' + eventNamespace, function(event) {
          allImgsLoaded++;

         
          eachCallback.call(img.element, allImgsLoaded, allImgsLength, event.type == 'load');

          if (allImgsLoaded == allImgsLength) {
            finishedCallback.call(obj[0]);
            return false;
          }

        });

        image.src = img.src;
      });
    });
  };
}(jQuery));

(function() {

  (function($, window, document) {
    var Plugin, defaults, pluginName;
    pluginName = "slidesjs";
    defaults = {
      width: 940,
      height: 528,
      start: 1,
      navigation: {
        active: true,
        effect: "fade"
      },
      pagination: {
        active: true,
        effect: "fade"
      },
      play: {
        active: false,
        effect: "fade",
        interval: 3000,
        auto: true,
        swap: true,
        pauseOnHover: false,
        restartDelay: 2500
      },
      effect: {
        slide: {
          speed: 500
        },
        fade: {
          speed: 300 * 3,
          crossfade: true
        }
      },
      callback: {
        loaded: function() {
        },
        start: function() {
        },
        complete: function() {
        }
      }
    };
    Plugin = (function() {

      function Plugin(element, options) {
        this.element = element;
        this.options = $.extend(true, {}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
      }

      return Plugin;

    })();
    Plugin.prototype.init = function() {
      var $element, nextButton, pagination, playButton, prevButton, stopButton,
              _this = this;
      $element = $(this.element);
      this.data = $.data(this);
      $.data(this, "animating", false);
      $.data(this, "total", $element.children().not(".slidesjs-navigation", $element).length);
      $.data(this, "current", this.options.start - 1);
      $.data(this, "vendorPrefix", this._getVendorPrefix());
      if (typeof TouchEvent !== "undefined") {
        $.data(this, "touch", true);
        this.options.effect.slide.speed = this.options.effect.slide.speed / 2;
      }
      $element.css({
        overflow: "hidden"
      });
      $element.slidesContainer = $element.children().not(".slidesjs-navigation", $element).wrapAll("<div class='slidesjs-container'>", $element).parent().css({
        overflow: "hidden",
        position: "relative"
      });
      $(".slidesjs-container", $element).wrapInner("<div class='slidesjs-control'>", $element).children();
      $(".slidesjs-control", $element).css({
        position: "relative",
        left: 0
      });
      $(".slidesjs-control", $element).children().addClass("slidesjs-slide").css({
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 0,
        display: "none",
      
      });
      $.each($(".slidesjs-control", $element).children(), function(i) {
        var $slide;
        $slide = $(this);
        return $slide.attr("slidesjs-index", i);
      });
      if (this.data.touch) {
        $(".slidesjs-control", $element).on("touchstart", function(e) {
          return _this._touchstart(e);
        });
        $(".slidesjs-control", $element).on("touchmove", function(e) {
          return _this._touchmove(e);
        });
        $(".slidesjs-control", $element).on("touchend", function(e) {
          return _this._touchend(e);
        });
      }
      $element.fadeIn(0);
      this.update();
      if (this.data.touch) {
        this._setuptouch();
      }
      $(".slidesjs-control", $element).children(":eq(" + this.data.current + ")").eq(0).fadeIn(0, function() {
        return $(this).css({
          zIndex: 10
        });
      });
      if (this.options.navigation.active) {
        prevButton = $("<a>", {
          "class": "slidesjs-previous slidesjs-navigation",
          href: "#",
          title: "Previous",
          text: "Previous"
        }).appendTo($element);
        nextButton = $("<a>", {
          "class": "slidesjs-next slidesjs-navigation",
          href: "#",
          title: "Next",
          text: "Next"
        }).appendTo($element);
      }
      $(".slidesjs-next", $element).click(function(e) {
        e.preventDefault();
        _this.stop(true);
        return _this.next(_this.options.navigation.effect);
      });
      $(".slidesjs-previous", $element).click(function(e) {
        e.preventDefault();
        _this.stop(true);
        return _this.previous(_this.options.navigation.effect);
      });
      if (this.options.play.active) {
        playButton = $("<a>", {
          "class": "slidesjs-play slidesjs-navigation",
          href: "#",
          title: "Play",
          text: "Play"
        }).appendTo($element);
        stopButton = $("<a>", {
          "class": "slidesjs-stop slidesjs-navigation",
          href: "#",
          title: "Stop",
          text: "Stop"
        }).appendTo($element);
        playButton.click(function(e) {
          e.preventDefault();
          return _this.play(true);
        });
        stopButton.click(function(e) {
          e.preventDefault();
          return _this.stop(true);
        });
        if (this.options.play.swap) {
          stopButton.css({
            display: "none"
          });
        }
      }
      if (this.options.pagination.active) {
        pagination = $("<ul>", {
          "class": "slidesjs-pagination"
        }).appendTo($element);
        $.each(new Array(this.data.total), function(i) {
          var paginationItem, paginationLink;
          paginationItem = $("<li>", {
            "class": "slidesjs-pagination-item"
          }).appendTo(pagination);
          paginationLink = $("<a>", {
            href: "#",
            "data-slidesjs-item": i,
            html: i + 1
          }).appendTo(paginationItem);
          return paginationLink.click(function(e) {
            e.preventDefault();
            _this.stop(true);
            return _this.goto(($(e.currentTarget).attr("data-slidesjs-item") * 1) + 1);
          });
        });
      }
      $(window).bind("resize", function() {
        return _this.update();
      });
      this._setActive();
      if (this.options.play.auto) {
        this.play();
      }
      return this.options.callback.loaded(this.options.start);
    };
    Plugin.prototype._setActive = function(number) {
      var $element, current;
      $element = $(this.element);
      this.data = $.data(this);
      current = number > -1 ? number : this.data.current;
      $(".active", $element).removeClass("active");
      return $(".slidesjs-pagination li:eq(" + current + ") a", $element).addClass("active");
    };
    Plugin.prototype.update = function() {
      var $element, height, width;
      $element = $(this.element);
      this.data = $.data(this);
      $(".slidesjs-control", $element).children(":not(:eq(" + this.data.current + "))").css({
        display: "none",
        left: 0,
        zIndex: 0
      });
      width = $element.width();
      height = (this.options.height / this.options.width) * width;
      this.options.width = width;
      this.options.height = height;
      return $(".slidesjs-control, .slidesjs-container", $element).css({
        width: width,
        height: height
      });
    };
    Plugin.prototype.next = function(effect) {
      var $element;
      $element = $(this.element);
      this.data = $.data(this);
      $.data(this, "direction", "next");
      if (effect === void 0) {
        effect = this.options.navigation.effect;
      }
      if (effect === "fade") {
        return this._fade();
      } else {
        return this._slide();
      }
    };
    Plugin.prototype.previous = function(effect) {
      var $element;
      $element = $(this.element);
      this.data = $.data(this);
      $.data(this, "direction", "previous");
      if (effect === void 0) {
        effect = this.options.navigation.effect;
      }
      if (effect === "fade") {
        return this._fade();
      } else {
        return this._slide();
      }
    };
    Plugin.prototype.goto = function(number) {
      var $element, effect;
      $element = $(this.element);
      this.data = $.data(this);
      if (effect === void 0) {
        effect = this.options.pagination.effect;
      }
      if (number > this.data.total) {
        number = this.data.total;
      } else if (number < 1) {
        number = 1;
      }
      if (typeof number === "number") {
        if (effect === "fade") {
          return this._fade(number);
        } else {
          return this._slide(number);
        }
      } else if (typeof number === "string") {
        if (number === "first") {
          if (effect === "fade") {
            return this._fade(0);
          } else {
            return this._slide(0);
          }
        } else if (number === "last") {
          if (effect === "fade") {
            return this._fade(this.data.total);
          } else {
            return this._slide(this.data.total);
          }
        }
      }
    };
    Plugin.prototype._setuptouch = function() {
      var $element, next, previous, slidesControl;
      $element = $(this.element);
      this.data = $.data(this);
      slidesControl = $(".slidesjs-control", $element);
      next = this.data.current + 1;
      previous = this.data.current - 1;
      if (previous < 0) {
        previous = this.data.total - 1;
      }
      if (next > this.data.total - 1) {
        next = 0;
      }
      slidesControl.children(":eq(" + next + ")").css({
        display: "block",
        left: this.options.width
      });
      return slidesControl.children(":eq(" + previous + ")").css({
        display: "block",
        left: -this.options.width
      });
    };
    Plugin.prototype._touchstart = function(e) {
      var $element, touches;
      $element = $(this.element);
      this.data = $.data(this);
      touches = e.originalEvent.touches[0];
      this._setuptouch();
      $.data(this, "touchtimer", Number(new Date()));
      $.data(this, "touchstartx", touches.pageX);
      $.data(this, "touchstarty", touches.pageY);
      return e.stopPropagation();
    };
    Plugin.prototype._touchend = function(e) {
      var $element, duration, prefix, slidesControl, timing, touches, transform,
              _this = this;
      $element = $(this.element);
      this.data = $.data(this);
      touches = e.originalEvent.touches[0];
      slidesControl = $(".slidesjs-control", $element);
      if (slidesControl.position().left > this.options.width * 0.5 || slidesControl.position().left > this.options.width * 0.1 && (Number(new Date()) - this.data.touchtimer < 250)) {
        $.data(this, "direction", "previous");
        this._slide();
      } else if (slidesControl.position().left < -(this.options.width * 0.5) || slidesControl.position().left < -(this.options.width * 0.1) && (Number(new Date()) - this.data.touchtimer < 250)) {
        $.data(this, "direction", "next");
        this._slide();
      } else {
        prefix = this.data.vendorPrefix;
        transform = prefix + "Transform";
        duration = prefix + "TransitionDuration";
        timing = prefix + "TransitionTimingFunction";
        slidesControl[0].style[transform] = "translateX(0px)";
        slidesControl[0].style[duration] = this.options.effect.slide.speed * 0.85 + "ms";
      }
      slidesControl.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
        prefix = _this.data.vendorPrefix;
        transform = prefix + "Transform";
        duration = prefix + "TransitionDuration";
        timing = prefix + "TransitionTimingFunction";
        slidesControl[0].style[transform] = "";
        slidesControl[0].style[duration] = "";
        return slidesControl[0].style[timing] = "";
      });
      return e.stopPropagation();
    };
    Plugin.prototype._touchmove = function(e) {
      var $element, prefix, slidesControl, touches, transform;
      $element = $(this.element);
      this.data = $.data(this);
      touches = e.originalEvent.touches[0];
      prefix = this.data.vendorPrefix;
      slidesControl = $(".slidesjs-control", $element);
      transform = prefix + "Transform";
      $.data(this, "scrolling", Math.abs(touches.pageX - this.data.touchstartx) < Math.abs(touches.pageY - this.data.touchstarty));
      if (!this.data.animating && !this.data.scrolling) {
        e.preventDefault();
        this._setuptouch();
        slidesControl[0].style[transform] = "translateX(" + (touches.pageX - this.data.touchstartx) + "px)";
      }
      return e.stopPropagation();
    };
    Plugin.prototype.play = function(next) {
      var $element, currentSlide, slidesContainer,
              _this = this;
      $element = $(this.element);
      this.data = $.data(this);
      if (!this.data.playInterval) {
        if (next) {
          currentSlide = this.data.current;
          this.data.direction = "next";
          if (this.options.play.effect === "fade") {
            this._fade();
          } else {
            this._slide();
          }
        }
        $.data(this, "playInterval", setInterval((function() {
          currentSlide = _this.data.current;
          _this.data.direction = "next";
          if (_this.options.play.effect === "fade") {
            return _this._fade();
          } else {
            return _this._slide();
          }
        }), this.options.play.interval));
        slidesContainer = $(".slidesjs-container", $element);
        if (this.options.play.pauseOnHover) {
          slidesContainer.unbind();
          slidesContainer.bind("mouseenter", function() {
            return _this.stop();
          });
          slidesContainer.bind("mouseleave", function() {
            if (_this.options.play.restartDelay) {
              return $.data(_this, "restartDelay", setTimeout((function() {
                return _this.play(true);
              }), _this.options.play.restartDelay));
            } else {
              return _this.play();
            }
          });
        }
        $.data(this, "playing", true);
        $(".slidesjs-play", $element).addClass("slidesjs-playing");
        if (this.options.play.swap) {
          $(".slidesjs-play", $element).hide();
          return $(".slidesjs-stop", $element).show();
        }
      }
    };
    Plugin.prototype.stop = function(clicked) {
      var $element;
      $element = $(this.element);
      this.data = $.data(this);
      clearInterval(this.data.playInterval);
      if (this.options.play.pauseOnHover && clicked) {
        $(".slidesjs-container", $element).unbind();
      }
      $.data(this, "playInterval", null);
      $.data(this, "playing", false);
      $(".slidesjs-play", $element).removeClass("slidesjs-playing");
      if (this.options.play.swap) {
        $(".slidesjs-stop", $element).hide();
        return $(".slidesjs-play", $element).show();
      }
    };
    Plugin.prototype._slide = function(number) {
      var $element, currentSlide, direction, duration, next, prefix, slidesControl, timing, transform, value,
              _this = this;
      $element = $(this.element);
      this.data = $.data(this);
      if (!this.data.animating && number !== this.data.current + 1) {
        $.data(this, "animating", true);
        currentSlide = this.data.current;
        if (number > -1) {
          number = number - 1;
          value = number > currentSlide ? 1 : -1;
          direction = number > currentSlide ? -this.options.width : this.options.width;
          next = number;
        } else {
          value = this.data.direction === "next" ? 1 : -1;
          direction = this.data.direction === "next" ? -this.options.width : this.options.width;
          next = currentSlide + value;
        }
        if (next === -1) {
          next = this.data.total - 1;
        }
        if (next === this.data.total) {
          next = 0;
        }
        this._setActive(next);
        slidesControl = $(".slidesjs-control", $element);
        if (number > -1) {
          slidesControl.children(":not(:eq(" + currentSlide + "))").css({
            display: "none",
            left: 0,
            zIndex: 0
          });
        }
        slidesControl.children(":eq(" + next + ")").css({
          display: "block",
          left: value * this.options.width,
          zIndex: 10
        });
        this.options.callback.start(currentSlide + 1);
        if (this.data.vendorPrefix) {
          prefix = this.data.vendorPrefix;
          transform = prefix + "Transform";
          duration = prefix + "TransitionDuration";
          timing = prefix + "TransitionTimingFunction";
          slidesControl[0].style[transform] = "translateX(" + direction + "px)";
          slidesControl[0].style[duration] = this.options.effect.slide.speed + "ms";
          return slidesControl.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function() {
            slidesControl[0].style[transform] = "";
            slidesControl[0].style[duration] = "";
            slidesControl.children(":eq(" + next + ")").css({
              left: 0
            });
            slidesControl.children(":eq(" + currentSlide + ")").css({
              display: "none",
              left: 0,
              zIndex: 0
            });
            $.data(_this, "current", next);
            $.data(_this, "animating", false);
            slidesControl.unbind("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd");
            slidesControl.children(":not(:eq(" + next + "))").css({
              display: "none",
              left: 0,
              zIndex: 0
            });
            if (_this.data.touch) {
              _this._setuptouch();
            }
            return _this.options.callback.complete(next + 1);
          });
        } else {
          return slidesControl.stop().animate({
            left: direction
          }, this.options.effect.slide.speed, (function() {
            slidesControl.css({
              left: 0
            });
            slidesControl.children(":eq(" + next + ")").css({
              left: 0
            });
            return slidesControl.children(":eq(" + currentSlide + ")").css({
              display: "none",
              left: 0,
              zIndex: 0
            }, $.data(_this, "current", next), $.data(_this, "animating", false), _this.options.callback.complete(next + 1));
          }));
        }
      }
    };
    Plugin.prototype._fade = function(number) {
      var $element, currentSlide, next, slidesControl, value,
              _this = this;
      $element = $(this.element);
      this.data = $.data(this);
      if (!this.data.animating && number !== this.data.current + 1) {
        $.data(this, "animating", true);
        currentSlide = this.data.current;
        if (number) {
          number = number - 1;
          value = number > currentSlide ? 1 : -1;
          next = number;
        } else {
          value = this.data.direction === "next" ? 1 : -1;
          next = currentSlide + value;
        }
        if (next === -1) {
          next = this.data.total - 1;
        }
        if (next === this.data.total) {
          next = 0;
        }
        this._setActive(next);
        slidesControl = $(".slidesjs-control", $element);
        slidesControl.children(":eq(" + next + ")").css({
          display: "none",
          left: 0,
          zIndex: 10
        });
        this.options.callback.start(currentSlide + 1);
        if (this.options.effect.fade.crossfade) {
          slidesControl.children(":eq(" + this.data.current + ")").stop().fadeOut(this.options.effect.fade.speed);
          return slidesControl.children(":eq(" + next + ")").stop().fadeIn(this.options.effect.fade.speed, (function() {
            slidesControl.children(":eq(" + next + ")").css({
              zIndex: 0
            });
            $.data(_this, "animating", false);
            $.data(_this, "current", next);
            return _this.options.callback.complete(next + 1);
          }));
        } else {
          return slidesControl.children(":eq(" + currentSlide + ")").stop().fadeOut(this.options.effect.fade.speed, (function() {
            slidesControl.children(":eq(" + next + ")").stop().fadeIn(_this.options.effect.fade.speed, (function() {
              return slidesControl.children(":eq(" + next + ")").css({
                zIndex: 10
              });
            }));
            $.data(_this, "animating", false);
            $.data(_this, "current", next);
            return _this.options.callback.complete(next + 1);
          }));
        }
      }
    };
    Plugin.prototype._getVendorPrefix = function() {
      var body, i, style, transition, vendor;
      body = document.body || document.documentElement;
      style = body.style;
      transition = "transition";
      vendor = ["Moz", "Webkit", "Khtml", "O", "ms"];
      transition = transition.charAt(0).toUpperCase() + transition.substr(1);
      i = 0;
      while (i < vendor.length) {
        if (typeof style[vendor[i] + transition] === "string") {
          return vendor[i];
        }
        i++;
      }
      return false;
    };
    return $.fn[pluginName] = function(options) {
      return this.each(function() {
        if (!$.data(this, "plugin_" + pluginName)) {
          return $.data(this, "plugin_" + pluginName, new Plugin(this, options));
        }
      });
    };
  })(jQuery, window, document);

}).call(this);

(function($) {

  var images = ["/img/arrow_academy2.png"];

  $.each(images, function(index) {
    var img = new Image();
    img.src = images[index];
  });
})(jQuery);

(function($) {

  return;

  function resize_slide_btns() {
    var s2_slide_btns = $(".s2:not(.s3):not(.s4)").find(".slider-btns");
    var s3_slide_btns = $(".s3").find(".slider-btns");

    s2_slide_btns.css("display", "none");
    s3_slide_btns.css("display", "none");

    return function() {
      s2_slide_btns.each(function() {
        var self = $(this);
        var con = $(this).siblings("ul.slides");
        var width = con.height();
        self.width(con.height());

        self.css({
          "margin-left": -(parseInt(width) / 2 - 69),
        });
        s2_slide_btns.css("display", "block");
      });

      s3_slide_btns.each(function() {
        var self = $(this);
        var con = $(this).siblings("ul.slides");
        var width = con.height();
        self.width(con.height());

        self.css({
          "margin-left": -(parseInt(width) / 2 - 69),
        });
        s3_slide_btns.css("display", "block");
      });
    }
  }

  function resize_right_slide_btns() {
    var width = $(".s2:not(.s3) .slides").height();
    var right_slide_btns = $(".s2:not(.s3) .slides .slide-item .btn-c");
    right_slide_btns.each(function() {
      var self = $(this);
      var con = $(self).parent(".slide-item");

      var height = 41 * $(".btn-item", self).size();

      var margin_top = -parseInt(height) / 2;
      var right = -(parseInt(width) / 2 - parseInt(height) / 2);
      self.css({
        top: "50%",
        "margin-top": margin_top,
        right: right,
        height: height,
        width: width
      });
    });

    var width = $(".s3 .slides").height();
    var right_slide_btns = $(".s3 .slides .slide-item .btn-c");
    right_slide_btns.each(function() {
      var self = $(this);
      var con = $(self).parent(".slide-item");

      var height = 41 * $(".btn-item", self).size();

      var margin_top = -parseInt(height) / 2;
      var right = -(parseInt(width) / 2 - parseInt(height) / 2);
      self.css({
        top: "50%",
        "margin-top": margin_top,
        left: -parseInt(width) / 2 + parseInt(height / 2),
        height: height,
        width: width
      });
    });

    return function() {
    };
  }

  $(function() {

    var resize_slide_btns_fn = resize_slide_btns();
    $(window).load(function() {
      return;
      resize_slide_btns_fn();
      resize_right_slide_btns();
    });
    $(window).resize(function() {
      return;
      resize_slide_btns_fn();
      resize_right_slide_btns();
    });


    $("div.s3").find(".slider-btns li.btn").click(function() {
      var self = $(this);
      console.log("btn clicked: " + self.attr("class"));
      var cls = self.attr("class");
      try {
        var index = cls[cls.search(/[0-9]/)];
      }
      catch (e) {
        index = false;
      }
      if (index != false) {

      
        var con = self.parent().parent().siblings("ul.slides");
        var crtShowingSlide = $(".slide-item:not(.hideme)", con);
        var nextShowSlide = $(".slide-item-" + index, con);
        if (!nextShowSlide.size() || !crtShowingSlide.size()) {
          console.log("CAN SELECT nextShowSlide or crtShowingSlide");
          console.log("nextShowSlide size: " + nextShowSlide.size());
          console.log("crtShowingSlide size: " + crtShowingSlide.size());
          return;
        }

        if (nextShowSlide.get(0) == crtShowingSlide.get(0)) {
          console.log("SELECTED SAME SLIDE !!!");
          return;
        }

        crtShowingSlide.css({
          "z-index": 1
        });
        nextShowSlide.css({
          "z-index": 2
        });
        console.log("crtShowingSlide size : " + crtShowingSlide.size());
        console.log("nextShowSlide size : " + nextShowSlide.size());
        console.log("SET NEXT SHOW SLIDE z-index");

    
        var r = $(".l", nextShowSlide);
        var img = $(".l img", nextShowSlide);

        if ($(".l", con).is(":animated") || $(".l img", con).is(":animated")) {
          console.log("MIDDLE MOVING");
          return;
        }

        var bgcolor = self.css("background-color");
        con.css({"background": bgcolor});

     
        self.addClass("hideme");
        $(self).prevAll().addClass("hideme");
        console.log("HIDE SELF btn " + self.attr("class"));
        console.log("HIDE SELF prevAll btns: " + $(self).prevAll().size());

        nextShowSlide
                .css({
                  position: "absolute",
                  top: "0px",
                })
                .removeClass("hideme");
        console.log("REMOVE hideme on nextShowSlide: " + nextShowSlide.attr("class"));

        r.css({
          position: "relative",
          overflow: "hidden",
          "width": img.width(),
          "height": img.height()
        });
        console.log("image: " + img.width());
        console.log("height: " + img.height());
        console.log("SET r.css()");
        img.css({
          position: "absolute",
          left: "100%",
          width: "100%"
        });
        console.log("SET img.css()");

        var time = img.attr("time");
        if (!time) {
          img.attr("time", 1);
          time = 1;
        }
        img.animate({
          left: "0px"
        }, 1000 * 1, function() {
          crtShowingSlide.addClass("hideme");
          console.log("ADD hideme class on crtShowingSlide:" + crtShowingSlide.attr("class"));
          nextShowSlide.css({
            position: "static",
            top: "auto"
          });

     
          r.css({
            position: "relative",
            overflow: "inherit",
            width: "50%",
            height: "auto"
          });

          img.css({
            position: "static",
            left: "auto"
          });
        });

    
        var next_r = $(".r", nextShowSlide);
        var next_r_c = $(".r .r-c", nextShowSlide);
        next_r.css({
          position: "relative",
          width: next_r_c.width() - 1,
          overflow: "inherit"
        });
        next_r_c.css({
          position: "absolute",
          right: "100%",
          width: next_r.width(),
          top: "50%"
        });
        next_r_c.css("margin-top", -parseInt(next_r_c.innerHeight()) / 2);
        console.log("margin-top: " + parseInt(next_r_c.innerHeight()) / 2);
        console.log("margin-top: " + next_r_c.css("margin-top"));
        console.log("next_r_c height: " + next_r_c.innerHeight());

        next_r_c.animate({
          right: "0px"
        }, 1000 * 1, function() {
          next_r.css({
            position: "static",
            width: "50%",
            overflow: "inherit"
          });
          next_r_c.css({
            position: "static",
            width: "100%",
            right: "auto"
          });
        });

        var crt_r = $(".r", crtShowingSlide);
        var crt_r_c = $(".r .r-c", crtShowingSlide);
        crt_r.css({
          position: "relative",
          width: crt_r_c.width() - 1,
          overflow: "hidden"
        });
        crt_r_c.css({
          position: "absolute",
          left: "0",
          width: crt_r.width(),
          top: "50%"
        });
        crt_r_c.css("margin-top", -(parseInt(crt_r_c.innerHeight()) / 2));
        crt_r_c.animate({
          left: "100%"
        }, 1000 * 1, function() {
          crt_r.css({
            position: "static",
            width: "50%",
            left: "auto",
            overflow: "inherit"
          });
          crt_r_c.css({
            position: "static",
            left: "auto",
            width: "100%",
          });
        });
      }
    });

   
    $('.s3 .btn-c .btn-item').click(function() {
      console.log("====================================");
      var self = $(this);
      var bgcolor = self.css("background-color");
      console.log(bgcolor);
      console.log(self);
      var con = self.parent().parent().parent();
      console.log(con);
      console.log(con.size());

      if ($(".l", con).is(":animated") || $(".l img", con).is(":animated")) {
        console.log("MOVING");
        return;
      }

      var crtShowingSlide = self.parent().parent();

      var cls = self.attr("class");
      try {
        var index = parseInt(cls[cls.search(/[0-9]/)]);
      }
      catch (e) {
        index = false;
      }

      console.log("SLIDE INDEX: " + index);
      var nextShowSlide = $(".slide-item-" + index, con);
      console.log("nextShowSlide count: " + nextShowSlide.size());

      var total = $(".slider-btns .btns .btn", con.parent()).size();
      for (var i = index; i < parseInt(total); i++) {
        $(".slider-btns .btns .btn-" + (i + 1), con.parent()).removeClass("hideme");
      }

      nextShowSlide.css({
        "z-index": 2
      });
      crtShowingSlide.css({
        "z-index": 1
      });

   
      var l = $(".l", nextShowSlide);
      var img = $(".l img", nextShowSlide);

      nextShowSlide.removeClass("hideme");
      nextShowSlide
              .css({
                position: "absolute",
                width: "100%",
                top: "0px",
              })
              .removeClass("hideme");

      l.css({
        position: "relative",
        overflow: "hidden",
        "width": img.width(),
        "height": img.height()
      });
      img.css({
        position: "absolute",
        right: "100%"
      });

      img.animate({
        right: "0px"
      }, 1000 * 1, function() {
        crtShowingSlide.addClass("hideme");
        nextShowSlide.css({
          position: "static",
          top: "auto"
        });

      
        l.css({
          position: "static",
          overflow: "inherit",
          width: "50%",
          height: "auto"
        });
        img.css({
          position: "static",
          left: "auto"
        });
      });

   
      var next_r = $(".r", nextShowSlide);
      var next_r_c = $(".r .r-c", nextShowSlide);
      next_r.css({
        position: "relative",
        width: next_r_c.width() - 1,
        overflow: "hidden"
      });
      next_r_c.css({
        position: "absolute",
        left: "100%",
        width: next_r.width(),
        top: "50%"
      });
      next_r_c.css("margin-top", -(next_r_c.innerHeight() / 2));

      next_r_c.animate({
        left: "0px"
      }, 1000 * 1, function() {
        next_r.css({
          position: "static",
          width: "50%",
          overflow: "inherit"
        });
        next_r_c.css({
          position: "static",
          right: "auto",
          left: "auto"
        });
      });

      var crt_r = $(".r", crtShowingSlide);
      var crt_r_c = $(".r .r-c", crtShowingSlide);
      crt_r.css({
        position: "relative",
        width: crt_r_c.width() - 1,
        overflow: "hidden"
      });
      crt_r_c.css({
        position: "absolute",
        right: "0",
        width: crt_r.width(),
        top: "50%"
      });

      crt_r_c.css("margin-top", -(parseInt(crt_r_c.innerHeight()) / 2));
      crt_r_c.animate({
        right: "100%"
      }, 1000 * 1, function() {
        crt_r.css({
          position: "static",
          width: "50%",
          overflow: "inherit"
        });
        crt_r_c.css({
          position: "static",
          left: "auto",
          width: "100%",
        });
      });
    });

  
    $(".s2:not(.s4):not(.s3)").find(".slider-btns li.btn").click(function() {
      return;
      var self = $(this);
      var cls = self.attr("class");
      try {
        var index = cls[cls.search(/[0-9]/)];
      }
      catch (e) {
        index = false;
      }
      if (index != false) {
        $("~ li.btn", self).addClass("hideme");

       
        var con = self.parent().parent().siblings("ul.slides");
        var crtShowingSlide = $(".slide-item:not(.hideme)", con);
        var nextShowSlide = $(".slide-item-" + index, con);

    
        var l = $(".l", nextShowSlide);
        var img = $(".l img", nextShowSlide);

        if ($(".l", con).is(":animated") || $(".l img", con).is(":animated")) {
          return;
        }

        var bgcolor = self.css("background-color");
        con.css({"background": bgcolor});

      
        self.addClass("hideme");
        nextShowSlide
                .css({
                  position: "absolute",
                  width: "100%",
                  top: "0px",
                })
                .removeClass("hideme");

        l.css({
          position: "relative",
          overflow: "hidden",
          "width": img.width(),
          "height": img.height()
        });
        img.css({
          position: "absolute",
          left: "100%"
        });

        img.animate({
          left: "0px"
        }, 1000 * 1, function() {
          crtShowingSlide.addClass("hideme");
          nextShowSlide.css({
            position: "static",
            top: "auto"
          });

   
          l.css({
            position: "static",
            overflow: "auto",
            width: "50%",
            height: "auto"
          });
          img.css({
            position: "static",
            left: "auto"
          });
        });

      
        var next_r = $(".r", nextShowSlide);
        var next_r_c = $(".r .r-c", nextShowSlide);
        next_r.css({
          position: "relative",
          width: next_r_c.width() - 1,
          height: next_r.height(),
          overflow: "hidden"
        });
        next_r_c.css({
          position: "absolute",
          right: "100%",
          width: next_r.width(),
        });

        next_r_c.animate({
          right: "0px"
        }, 1000 * 1, function() {
          next_r.css({
            position: "static",
            width: "35%",
            overflow: "auto"
          });
          next_r_c.css({
            position: "static",
            right: "auto"
          });
        });

        var crt_r = $(".r", crtShowingSlide);
        var crt_r_c = $(".r .r-c", crtShowingSlide);
        crt_r.css({
          position: "relative",
          width: crt_r_c.width(),
          overflow: "hidden"
        });
        crt_r_c.css({
          position: "absolute",
          left: "0",
          width: crt_r.width(),
        });
        crt_r_c.animate({
          left: "100%"
        }, 1000 * 1, function() {
          crt_r.css({
            position: "static",
            width: "auto",
            overflow: "auto"
          });
          crt_r_c.css({
            position: "static",
            left: "auto"
          });
        });
      }
    });
  });
})(jQuery);



(function($) {
  return;
  $(function() {
    $('.s2:not(.s3) .btn-c .btn-item').click(function() {
      console.log("====================================");
      var self = $(this);
      var bgcolor = self.css("background-color");
      console.log(bgcolor);
      console.log(self);
      var con = self.parent().parent().parent();

      if ($(".l", con).is(":animated") || $(".l img", con).is(":animated")) {
        return;
      }

      var crtShowingSlide = self.parent().parent();

      var cls = self.attr("class");
      try {
        var index = parseInt(cls[cls.search(/[0-9]/)]);
      }
      catch (e) {
        index = false;
      }

      console.log("SLIDE INDEX: " + index);
      var nextShowSlide = $(".slide-item-" + index, con);
      console.log("nextShowSlide count: " + nextShowSlide.size());

      var right_c = $("~ .btn-item", self).size();
      console.log("right_c: " + right_c);

      var total = $(".slider-btns .btns .btn", con.parent()).size();
      console.log("total: " + total);
      for (var i = 0; i < parseInt(total) - parseInt(right_c); i++) {
        console.log(i);
        console.log(".slider-btns .btns .btn-" + (i + 1));
        console.log($(".slider-btns .btns .btn-" + (i + 1), con.parent()).size());
        $(".slider-btns .btns .btn-" + (i + 1), con.parent()).removeClass("hideme");
      }

   
      var l = $(".l", nextShowSlide);
      var img = $(".l img", nextShowSlide);

      nextShowSlide.removeClass("hideme");
      nextShowSlide
              .css({
                position: "absolute",
                width: "100%",
                top: "0px",
              })
              .removeClass("hideme");

      l.css({
        position: "relative",
        overflow: "hidden",
        "width": img.width(),
        "height": img.height()
      });
      img.css({
        position: "absolute",
        right: "100%"
      });

      img.animate({
        right: "0px"
      }, 1000 * 1, function() {
        crtShowingSlide.addClass("hideme");
        nextShowSlide.css({
          position: "static",
          top: "auto"
        });

      
        l.css({
          position: "static",
          overflow: "auto",
          width: "50%",
          height: "auto"
        });
        img.css({
          position: "static",
          left: "auto"
        });
      });

  
      var next_r = $(".r", nextShowSlide);
      var next_r_c = $(".r .r-c", nextShowSlide);
      next_r.css({
        position: "relative",
        width: next_r_c.width(),
        height: next_r_c.height(),
        overflow: "hidden"
      });
      next_r_c.css({
        position: "absolute",
        left: "100%",
        width: next_r.width(),
      });

      next_r_c.animate({
        left: "0px"
      }, 1000 * 1, function() {
        next_r.css({
          position: "static",
          width: "35%",
          height: "auto",
          overflow: "auto"
        });
        next_r_c.css({
          position: "static",
          right: "auto",
          left: "auto"
        });
      });

      var crt_r = $(".r", crtShowingSlide);
      var crt_r_c = $(".r .r-c", crtShowingSlide);
      crt_r.css({
        position: "relative",
        width: crt_r_c.width(),
        height: crt_r_c.height(),
        overflow: "hidden"
      });
      crt_r_c.css({
        position: "absolute",
        right: "0",
        width: crt_r.width(),
      });
      crt_r_c.animate({
        right: "100%"
      }, 1000 * 1, function() {
        crt_r.css({
          position: "static",
          width: "auto",
          height: "auto",
          overflow: "auto"
        });
        crt_r_c.css({
          position: "static",
          left: "auto",
          right: "auto"
        });
      });
    });
  });
})(jQuery);


(function($) {
  $(function() {
    $(".left-bar-menu li").hover(function() {
      var self = $(this);
      var con = $(this).parent();
      var menu_txt = self.html();
      if (menu_txt.trim() == "") {
        return;
      }
      try {
        var cls = self.attr("class");
        var index = parseInt(cls[cls.search(/[0-9]/)]);
      }
      catch (e) {
        index = false;
      }

      var menu = $(".hover-menu", con);
      if (!menu.size()) {
        var menu = $("<div class='hover-menu'></div>");
        con.append(menu);
        menu.hide();
      }
      menu.html("");
      menu.append(menu_txt);
      menu.append("<div class='arrow'></div>");
      con.append(menu);
      menu.show();
      var height = self.height() << 0;
      menu.css({top: index * height + height - 10 - menu.outerHeight()});
    }, function() {
      var self = $(this);
      var con = $(this).parent();
      var menu_txt = self.html();
      var menu = $(".hover-menu", con);
      menu.hide();
    });
  });
})(jQuery);


(function($) {
  function getIndexFromClass(cls) {
    try {
      var crt_index = parseInt(cls[cls.search(/[0-9]/)]);
    }
    catch (e) {
      crt_index = false;
    }
    return crt_index;
  }
  $.getIndexFromClass = getIndexFromClass;
  $.fn.slideToPre = function() {
    var slide = $(this);
    crt_index = getIndexFromClass(slide.attr("class"));
    if (crt_index <= 1) {
      return;
    }
    var pre_slides = slide.prevAll();
    if (pre_slides.size() <= 0) {
      return;
    }

    var pre_slide = $(pre_slides.get(0));
    slide.addClass("hideme");
    pre_slide.removeClass("hideme");
  };

  $.fn.slideToNext = function() {
    var slide = $(this);
    crt_index = getIndexFromClass(slide.attr("class"));
    var next_slides = $("~ div", slide);
    if (next_slides.size() <= 0) {
      return;
    }
    var next_slide = $(next_slides.get(0));
    slide.addClass("hideme");
    next_slide.removeClass("hideme");
  };
})(jQuery);


(function($) {


 
  $(function() {
    $(".s3 .slide-item-0 .next-icon .p-icon").click(function() {
      var self = $(this);
      var content_slides = $("> .r-c-slide", self.parent().siblings(".c"));
      var crt_slide = $("> :not(.hideme)", content_slides.parent());
      crt_slide.slideToPre();

      var btn = $(".s3 .slide-item-0 .next-icon .next_txt .btn");
      btn.html(btn.attr("data-nt"));
      $(".s3 .slide-item-0 .next-icon .n-icon").addClass("n-icon-on");
      self.removeClass("p-icon-on");
    });

    $(".s3 .slide-item-0 .next-icon .n-icon").click(function() {
      var self = $(this);
      var content_slides = $("> .r-c-slide", self.parent().siblings(".c"));

      var crt_slide = $("> :not(.hideme)", content_slides.parent());
      crt_slide.slideToNext();

      var btn = $(".s3 .slide-item-0 .next-icon .next_txt .btn");
      btn.html(btn.attr("data-pt"));
      $(".s3 .slide-item-0 .next-icon .p-icon").addClass("p-icon-on");
      self.removeClass("n-icon-on");
    });

    $(".s3 .slide-item-0 .next-icon .next_txt .btn").click(function() {
      var self = $(this);

      if (self.text().trim() == "NEXT") {
        $(".s3 .slide-item-0 .next-icon .n-icon").trigger("click");
      }
      else {
        $(".s3 .slide-item-0 .next-icon .p-icon").trigger("click");
      }
    });
  });


  $(function() {
    $("#FAQ_btns .p-icon").click(function() {
      var self = $(this);
      var content_slides = $("#faqPageCont");
      var crt_slide = $("> :not(.hideme)", content_slides);
      crt_slide.slideToPre();

      var btn = $("#FAQ_btns .next_txt .btn");
      btn.html(btn.attr("data-nt"));
      $("#FAQ_btns .n-icon").addClass("n-icon-on");
      self.removeClass("p-icon-on");
    });

    $("#FAQ_btns .n-icon").click(function() {
      var self = $(this);
      var content_slides = $("#faqPageCont");

      var crt_slide = $("> :not(.hideme)", content_slides);
      crt_slide.slideToNext();

      var btn = $("#FAQ_btns .next_txt .btn");
      btn.html(btn.attr("data-pt"));
      $("#FAQ_btns .p-icon").addClass("p-icon-on");
      self.removeClass("n-icon-on");
    });

    $("#FAQ_btns .next_txt .btn").click(function() {
      var self = $(this);

      if (self.text().trim() == "NEXT") {
        $("#FAQ_btns .n-icon").trigger("click");
      }
      else {
        $("#FAQ_btns .p-icon").trigger("click");
      }
    });
  });


  $(function() {
    $(".s3 .slide-item-3 .next-icon .p-icon").click(function() {
      var self = $(this);
      var content_slides = $("> .r-c-slide", self.parent().parent().siblings(".c"));
      var crt_slide = $("> :not(.hideme)", content_slides.parent());
      crt_slide.slideToPre();

      var btn = $(".s3 .slide-item-3 .next-icon .next_txt .btn");
      btn.html(btn.attr("data-nt"));
      $(".s3 .slide-item-3 .next-icon .n-icon").addClass("n-icon-on");
      self.removeClass("p-icon-on");
    });

    $(".s3 .slide-item-3 .next-icon .n-icon").click(function() {
      var self = $(this);
      var content_slides = $("> .r-c-slide", self.parent().parent().siblings(".c"));

      var crt_slide = $("> :not(.hideme)", content_slides.parent());
      crt_slide.slideToNext();

      var btn = $(".s3 .slide-item-3 .next-icon .next_txt .btn");
      btn.html(btn.attr("data-pt"));
      $(".s3 .slide-item-3 .next-icon .p-icon").addClass("p-icon-on");
      self.removeClass("n-icon-on");
    });

    $(".s3 .slide-item-3 .next-icon .next_txt .btn").click(function() {
      var self = $(this);
      if (self.text().trim() == self.attr("data-nt")) {
        $(".s3 .slide-item-3 .next-icon .n-icon").trigger("click");
      }
      else {
        console.log("SLIDE TO PREVIOUS");
        $(".s3 .slide-item-3 .next-icon .p-icon").trigger("click");
      }
    });
  });
})(jQuery);


(function($) {
  $(function() {
    $(".body .left-bar .left-bar-menu .m-item").click(function() {
      var self = $(this);
      if ($("a", self).size()) {
        var hash_dist = $("a", self).attr("href").trim();
        hash_dist = hash_dist.substr(1);
        var section = $(hash_dist);
      }
    });
  });
})(jQuery);


(function($) {
  $(window).load(function() {
    $(".slideshow .slideshow-con").slidesjs({
      navigation: {
        active: false,
      },
      effect: {
        slide: {
          speed: 500
        },
      }
    });
  });
})(jQuery);

(function($) {
  $.moving_start = function(con) {
    console.log("MOVE START");
    con.addClass("moving");
  }
  $.moving_is_moving = function(con) {
    return con.hasClass("moving");
  }
  $.moving_finished = function(con) {
    con.removeClass("moving");
  }
})(jQuery);


(function($) {
  $.loadNews = function(type, cb) {
    cb || (cb = function() {
    });
    type || (type = "");
    if (typeof type == "object") {
      var page = type["page"];
      var news_id = type["news_id"];
      type = type["type"];
    }
    console.log("NEWS LOAD WITH " + type);
    $.ajax({
      url: "/api/news",
      data: {type: type, page: page, news_id: news_id},
      dataType: "json",
      success: function(data) {
        if (data["error"]) {
          cb(null, data["error"]);
        }
        else {
          cb(data["data"]);
        }
      }
    });
  };
  $.loadNextNews = function(news_id, cb) {
    cb || (cb = function() {
    });
    news_id || (news_id = 1);
    $.ajax({
      url: "/api/nextnews",
      data: {news_id: news_id},
      dataType: "json",
      success: function(data) {
        if (data["error"]) {
          cb(null, data["error"]);
        }
        else {
          cb(data["data"]);
        }
      }
    });
  };

  $.loadPreNews = function(news_id, cb) {
    cb || (cb = function() {
    });
    news_id || (news_id = 1);
    $.ajax({
      url: "/api/prenews",
      data: {news_id: news_id},
      dataType: "json",
      success: function(data) {
        if (data["error"]) {
          cb(null, data["error"]);
        }
        else {
          cb(data["data"]);
        }
      }
    });
  };

  $(function() {
    var con = $(".news-block");
    var news_content = $(".news-list", con);
    var news_list_tp = $("#template-news-list").html();
    var news_item_tp = $('#template-news-item').html();
    var news_date_tp = $("#template-news-date").html();
    Mustache.parse(news_list_tp);
    Mustache.parse(news_item_tp);
    Mustache.parse(news_date_tp);
    var moving_seconds = 1000 * 2;
    function moving_start(con) {
      con.addClass("moving");
    }
    function moving_is_moving(con) {
      return con.hasClass("moving");
    }
    function moving_finished(con) {
      con.removeClass("moving");
    }
    var render_news = function() {
      var newslist = this.newslist;
      var c = "";
      var index = 1;
      for (var key in newslist) {
        var date = key;
        c += Mustache.render(news_date_tp, {date: key});
        for (var i = 0; i < newslist[key].length; i++) {
          var id = index + i;
          var thumbnail = newslist[key][i]["images"]["thumbnail"];
          var news_id = newslist[key][i]["news_id"];
          index += i;
          c += Mustache.render(news_item_tp, {id: id, thumbnail: thumbnail, news_id: news_id, title: newslist[key][i]["title"]});
        }
      }
      return c;
    };


    $(".filters .filter a", con).click(function() {
      var self = $(this);
      self.parent().siblings().removeClass("active");
      self.parent().addClass("active");
      var news_type = self.attr("data-type");
      $.loadNews(news_type, function(news) {
        console.log("NEWS LOADED");
        console.log(news);
        console.log("BEGIN RENDER NEWS");

        var html = Mustache.render(news_list_tp, {newslist: news, newsrender: render_news});
        news_content.html(html);
        console.log("RELOAD NEWS AND PUT NEW  HTML CONTENT" + html);
      });
    });


    $(".pager .next", con).click(function() {
      return;
      var self = $(this);
      if (moving_is_moving(con)) {
        return;
      }
      moving_start(con);
      console.log("NEXT PAGE =====");
      var type = $(".filters .filter.active a", con).attr("data-type");
      console.log("NEWS TYPE: " + type);
      var page_el = $("#crt-page", con);
      var page = parseInt(page_el.val()) + 1;
      $.loadNews({type: type, page: page}, function(news) {
        console.log("LOAD NEWS WITH TYPE: " + type + " and page: " + page);
        console.log(news);
        if (Object.prototype.toString.apply(news) == "[object Array]" && news.length <= 0) {
          moving_finished(con);
          return;
        }
        var html = Mustache.render(news_list_tp, {newslist: news, newsrender: render_news});
        var o_html = news_content.html();
        o_html = "<div class='old-content clearfix'>" + o_html + "</div>";
        var n_html = "<div class='new-content clearfix'>" + html + "</div>";
        news_content.html(o_html + n_html);
        console.log("RELOAD NEWS AND PUT NEW  HTML CONTENT" + html);

        $(".new-content", news_content).css({
          width: news_content.width()
        }).animate({
          left: "0%",
        }, moving_seconds, function() {
          console.log("YES. I finished move");
          news_content.html(html);
          page_el.val(page);
          moving_finished(con);
        });

        $(".old-content", news_content).fadeOut(moving_seconds);
      });
    });


    $(".pager .pre", con).click(function() {
      return;
      var self = $(this);

      var type = $(".filters .filter.active a", con).attr("data-type");
      var page_el = $("#crt-page", con);
      var page = parseInt(page_el.val()) - 1;
      if (page <= 0) {
        console.log("PAGE IS < 0 :" + page);
        return;
      }
      if (moving_is_moving(con)) {
        return;
      }
      moving_start(con);
      $.loadNews({type: type, page: page}, function(news) {
        console.log("LOAD NEWS WITH TYPE: " + type + " and page: " + page);
        console.log(news);
        if (Object.prototype.toString.apply(news) == "[object Array]" && news.length <= 0) {
          moving_finished(con);
          return;
        }
        var html = Mustache.render(news_list_tp, {newslist: news, newsrender: render_news});
        var o_html = news_content.html();
        o_html = "<div class='old-content clearfix'>" + o_html + "</div>";
        var n_html = "<div class='new-content clearfix'>" + html + "</div>";
        news_content.html(o_html + n_html);
        console.log("RELOAD NEWS AND PUT NEW  HTML CONTENT" + html);

        $(".new-content", news_content).css({
          width: news_content.width(),
          left: "auto",
          right: "100%",
        }).animate({
          right: "0%",
        }, moving_seconds, function() {
          console.log("YES. I finished move");
          news_content.html(html);
          page_el.val(page);
          moving_finished(con);
        });
        $(".old-content", news_content).fadeOut(moving_seconds);
      });
    });


    $(".pager .home", con).click(function() {
      return;
      console.log("HOME CLICKED");
      var self = $(this);

      var type = $(".filters .filter.active a", con).attr("data-type");
      var page_el = $("#crt-page", con);
      var page = 1;
      if (page >= page_el.val()) {
        console.log("NO NEED TO MOVE TO HOME");
        return;
      }
      if (moving_is_moving(con)) {
        return;
      }
      moving_start(con);
      $.loadNews({type: type, page: page}, function(news) {
        console.log("LOAD NEWS WITH TYPE: " + type + " and page: " + page);
        console.log(news);
        if (Object.prototype.toString.apply(news) == "[object Array]" && news.length <= 0) {
          moving_finished(con);
          return;
        }
        var html = Mustache.render(news_list_tp, {newslist: news, newsrender: render_news});
        var o_html = news_content.html();
        o_html = "<div class='old-content clearfix'>" + o_html + "</div>";
        var n_html = "<div class='new-content clearfix'>" + html + "</div>";
        news_content.html(o_html + n_html);
        console.log("RELOAD NEWS AND PUT NEW  HTML CONTENT" + html);

        $(".new-content", news_content).css({
          width: news_content.width(),
          left: "auto",
          right: "100%",
        }).animate({
          right: "0%",
        }, moving_seconds, function() {
          console.log("YES. I finished move");
          news_content.html(html);
          page_el.val(page);
          moving_finished(con);
        });
        $(".old-content", news_content).fadeOut(moving_seconds);
      });
    });


    $(".pager .last", con).click(function() {
      return;
      console.log("HOME CLICKED");
      var self = $(this);
      var type = $(".filters .filter.active a", con).attr("data-type");
      var page_el = $("#crt-page", con);
      var page = page_el.val();
      if (moving_is_moving(con)) {
        return;
      }
      moving_start(con);
      self.addClass("moving");
      $.loadNews({type: type, page: page}, function(news) {
        console.log("LOAD NEWS WITH TYPE: " + type + " and page: " + page);
        console.log(news);
        if (Object.prototype.toString.apply(news) == "[object Array]" && news.length <= 0) {
          moving_finished(con);
          return;
        }
        var html = Mustache.render(news_list_tp, {newslist: news, newsrender: render_news});
        var o_html = news_content.html();
        o_html = "<div class='old-content clearfix'>" + o_html + "</div>";
        var n_html = "<div class='new-content clearfix'>" + html + "</div>";
        news_content.html(o_html + n_html);
        console.log("RELOAD NEWS AND PUT NEW  HTML CONTENT" + html);

        $(".new-content", news_content).css({
          width: news_content.width(),
        }).animate({
          left: "0%",
        }, moving_seconds, function() {
          console.log("YES. I finished move");
          news_content.html(html);
          page_el.val(page);
          moving_finished(con);
        });
        $(".old-content", news_content).fadeOut(moving_seconds);
      });
    });


  });
})(jQuery);


(function($) {

  var moving_seconds = 1000 * 1;
  $.fn.customslidesjs = function(options) {
    var container = $(this);
    console.log("container size:" + container.size());
    var index = 1;
    container.children().each(function() {
      var el = $(this);
      el.addClass("hideme");
      el.data("data-index", index);
      index += 1;
    });
    var total = index - 1;
    $(container.children().get(0)).removeClass("hideme");

    return (function() {
      var next = function() {
        var crt = $(container.children(":not(.hideme)").get(0));
        var crt_index = crt.data("data-index");
        if (crt_index >= total) {
          return;
        }
        if ($.moving_is_moving(container)) {
          return;
        }
        $.moving_start(container);
        var next = $(container.children().get(crt_index));
        console.log("NEXT IMAGE IS : ");
        console.log(next);
        console.log("HIDE CURRENT IMAGE ");

        next.removeClass("hideme");
        next.css({
          position: "absolute",
          left: "100%",
          top: "0px"
        });
        next.animate({
          left: "0%"
        }, moving_seconds, function() {
          next.css({
            position: "static"
          });
          next.removeAttr("style");
          crt.removeAttr("style");
          crt.addClass("hideme");
          $.moving_finished(container);
        });
      };
      var pre = function() {
        var crt = $(container.children(":not(.hideme)").get(0));
        var crt_index = crt.data("data-index");
        var crt = container.children(":not(.hideme)");
        var crt_index = crt.data("data-index");
        if (crt_index <= 1) {
          return;
        }
        if ($.moving_is_moving(container)) {
          return;
        }
        $.moving_start(container);
        var next = $(container.children().get(crt_index - 2));
        console.log("NEXT IMAGE IS : ");
        console.log(next);
        console.log("HIDE CURRENT IMAGE ");

        next.removeClass("hideme");
        next.css({
          position: "absolute",
          right: "100%",
          top: "0px"
        });
        next.animate({
          right: "0%"
        }, moving_seconds, function() {
          next.css({
            position: "static"
          });
          next.removeAttr("style");
          crt.removeAttr("style");
          crt.addClass("hideme");
          $.moving_finished(container);
        });
      }

      return {
        next: next,
        pre: pre
      };
    })(container);
  };

  $(function() {
    var speed = 1000 * 1;
    $(".news-block").delegate(".news-detail-right .left", "click", function() {
      var slider = $(".news-block .news-detail-right .slides .slides-wrapper").data("slider");
      slider.pre();
    });
    $(".news-block").delegate(".news-detail-right .right", "click", function() {
      var slider = $(".news-block .news-detail-right .slides .slides-wrapper").data("slider");
      slider.next();
    });
    

    $.handlerNextNews = function() {
      var clickObj = $(this).parent();
      if ($.moving_is_moving(clickObj)) {
        return;
      }
      else {
        $.moving_start(clickObj);
      }
      console.log("CICKED NEXT NEWS BUTTON");

      var container = $(this).parents(".news-block");
      var details_dom_old = $(".news-detail", container);
      container.css("width", $(".news-block-list-con", container).width());
      details_dom_old.addClass("old");
      var news_id = details_dom_old.attr("data-newsid");
      if (news_id) {
        $.loadPreNews(news_id, function(news) {
          if (!news || (Object.prototype.toString.apply(news) == "[object Array]" && !news.length)) {
            console.log("EMPTY NEWS ");
            return;
          }
          news["slider"] = news["images"]["slider"];
          news["thumbnail"] = news["images"]["thumbnail"];
          var details_html = Mustache.render(detail_news_tp, news);
          $(details_html).waitForImages(function() {
            container.prepend(details_html);
            var details_dom = $(".news-detail:not(.old)", container);
            details_dom.attr("data-newsid", news["news_id"]);
            details_dom.css({
              "display": "none",
              "z-index": 2
            });
            details_dom_old.css({
              "z-index": 1
            });
            $(".img-full:eq(0)", details_dom).load(function() {
              details_dom.css("display", "block");
              var width = details_dom.width();
              var height = details_dom.height();
              details_dom.css({
                width: width,
                height: height - 5,
                position: "absolute",
                right: "100%",
                left: "auto"
              });
              details_dom.parent().animate({
                height: height
              }, speed, function() {
                console.log("WIDTH: " + width + " HEIGHT: " + height);
                details_dom.animate({
                  right: "0%"
                }, speed, function() {
                  details_dom.css({
                  
                  });
                  details_dom_old.remove();
                  $.moving_finished(clickObj);
                  $(".img-full").each(function() {
                    var self = $(this);
                    self.attr("src", self.attr("data-src"));
                  });
                });
              });
            });

         
            var slider_el = $(".news-block .news-detail:not(.old) .news-detail-right .slides .slides-wrapper");
            var slider = slider_el.customslidesjs();
            slider_el.data("slider", slider);
          });
        });
      }
    };
    

    $.handlerPrevNews = function() {
      var clickObj = $(this).parent();
      if ($.moving_is_moving(clickObj)) {
        return;
      }
      else {
        $.moving_start(clickObj);
      }
      console.log("CICKED NEXT NEWS BUTTON");

      var clickObj = $(this);

      var container = $(this).parents(".news-block");
      var details_dom_old = $(".news-detail", container);
      container.css("width", $(".news-block-list-con", container).width());
      details_dom_old.addClass("old");
      var news_id = details_dom_old.attr("data-newsid");
      if (news_id) {
        $.loadNextNews(news_id, function(news) {
          if (!news || (Object.prototype.toString.apply(news) == "[object Array]" && !news.length)) {
            console.log("EMPTY NEWS ");
            return;
          }
          news["slider"] = news["images"]["slider"];
          news["thumbnail"] = news["images"]["thumbnail"];
          var details_html = Mustache.render(detail_news_tp, news);
          $(details_html).waitForImages(function() {
            container.prepend(details_html);
            var details_dom = $(".news-detail:not(.old)", container);
            details_dom.attr("data-newsid", news["news_id"]);
            details_dom.css({
              "display": "none",
              "z-index": 2
            });
            details_dom_old.css({
              "z-index": 1
            });
            $(".img-full:eq(0)", details_dom).load(function() {
              details_dom.css("display", "block");
              var width = details_dom.width();
              var height = details_dom.height();
              details_dom.css({
                width: width,
                height: height - 5,
                position: "absolute"
              });
              details_dom.parent().animate({
                height: height
              }, speed, function() {
                console.log("WIDTH: " + width + " HEIGHT: " + height);
                details_dom.animate({
                  left: "0%"
                }, speed, function() {
                  details_dom.css({
                   
                  });
                  details_dom_old.remove();
                  $.moving_finished(clickObj);
                  $(".img-full").each(function() {
                    var self = $(this);
                    self.attr("src", self.attr("data-src"));
                  });
                });
              });
            });

        
            var slider_el = $(".news-block .news-detail:not(.old) .news-detail-right .slides .slides-wrapper");
            var slider = slider_el.customslidesjs();
            slider_el.data("slider", slider);
          });
        });
      }
    };

   
    $(".news-block").delegate(".pager-links .back", "click", function() {
      var container = $(this).parents(".news-block");
      var details_dom = $(".news-detail", container);
      var parent_height = $(".news-block-list-con", container).height();
      details_dom.animate({
        left: "100%"
      }, speed);
      container.animate({
        height: parent_height
      }, speed);
    });

 
    $(".news-block").delegate(".right .close-btn", "click", function(event) {
      event.stopPropagation();
      var container = $(this).parents(".news-block");
      var details_dom = $(".news-detail", container);
      var parent_height = $(".news-block-list-con", container).height();
      details_dom.animate({
        left: "100%"
      }, speed);
      container.animate({
        height: parent_height
      }, speed);
    });

  
    var detail_news_tp = $("#template-news-detail").html();
    Mustache.parse(detail_news_tp);
    $(".news-block").delegate(".pager-links .links .pre", "click", function() {
      $.handlerPrevNews.apply(this, arguments);
    });

    
    $(".news-block").delegate(".pager-links .links .next", "click", function() {
      $.handlerNextNews.apply(this, arguments);
    });
  });
})(jQuery);


(function($) {
  $.hanlderNewsItemClicked = function () {
      var detail_news_tp = $("#template-news-detail").html();
      
      var container = $(this).parents(".s").find(".news-block");
      container.css("width", $(".news-block-list-con", container).width());
      Mustache.parse(detail_news_tp);
      var speed = 1000 * 1;
      var self = $(this);
      var clickObj = self.parent();
      if ($.moving_is_moving(clickObj)) {
        return;
      }
      else {
        $.moving_start(clickObj);
      }

      var news_id = self.attr("data-newsid");
      if (news_id) {
        $.loadNews({news_id: news_id}, function(news) {
          if (!news || (Object.prototype.toString.apply(news) == "[object Array]" && !news.length)) {
            console.log("EMPTY NEWS ");
            return;
          }
          news["slider"] = news["images"]["slider"];
          news["thumbnail"] = news["images"]["thumbnail"];
          var details_html = Mustache.render(detail_news_tp, news);
       
          $(".news-detail", container).remove();
          $(details_html).waitForImages(function() {
          
            container.prepend(details_html);
            var details_dom = $(".news-detail", container);
          
            details_dom.attr("data-newsid", news["news_id"]);
            details_dom.css("display", "none");
            $(".img-full:eq(0)", details_dom).load(function() {
              var self = $(this);
              details_dom.css("display", "block");
              var width = details_dom.width();
              var height = details_dom.height();
              details_dom.css({
                width: width,
                height: height - 4,
                position: "absolute"
              });


              console.log("WIDTH: " + width + " HEIGHT: " + height);
              details_dom.parent().animate({
                height: height
              }, speed);

              details_dom.animate({
                left: "0%"
              }, speed, function() {
                details_dom.css({
               
                });

                $.moving_finished(clickObj);
              
                $(".img-full").each(function() {
                  var self = $(this);
                  self.attr("src", self.attr("data-src"));
                });
              });
            });

           
            var slider_el = $(".news-block .news-detail:not(.old) .news-detail-right .slides .slides-wrapper");
            var slider = slider_el.customslidesjs();
            slider_el.data("slider", slider);
          }, function(loaded, count, success) {
            if ($(details_html).hasClass("watiforimages-loaded")) {
              return;
            }
            else {
            
            }
          });
        });
      }
  };
  
  $(function() {

    $(".s5 .news-block").delegate(".news-block li.news-item", "click", function() {
      $.hanlderNewsItemClicked.apply(this, arguments);
    });
    $(".s7 .block-content").delegate(".blocks .items > div[data-newsid]", "click", function () {
      console.log($(this));
      $.hanlderNewsItemClicked.apply(this, arguments);
    });
  });
})(jQuery);


(function($) {
  $(function() {
    $(window).resize(function() {
      $(window).stellar({
        positionProperty: "position"
      });
    });
    $(window).stellar({
      positionProperty: "position"
    });

    var mywindow = $(window);
    var leftmenucon = $(".left-bar-menu");
    var htmlbody = $('html,body');
    mywindow.scroll(function() {
      if (mywindow.scrollTop() == 0) {
        $("li.m-item", leftmenucon).removeClass("current");
        $('li[data-section="1"]', leftmenucon).addClass("current");
        $("#home").addClass("scrolling").siblings().removeClass("scrolling");
      }
      var max_scroll = $(document).height() - $(window).height();
      if (max_scroll <= mywindow.scrollTop() + 800) {
        $("li.m-item", leftmenucon).removeClass("current");
        $('li[data-section="5"]', leftmenucon).addClass("current");
        $("#news").trigger("scrolling");
      }
    });

    $("body > .maincontent > .s").waypoint(function(direction) {
      var data_id = $(this).attr("data-section");
      if (data_id == 2) {
        $(this).siblings().removeClass("scrolling");
        var self = $(this);
        $.resizeAcademyContentTop(function() {
          self.addClass("scrolling");
          $.waypoints('refresh');
        });
      }
      else {
        $(this).addClass("scrolling").siblings().removeClass("scrolling");
      }

      $(this).trigger("scrolling");

      $("li.m-item", leftmenucon).removeClass("current");
      $('li[data-section="' + data_id + '"]', leftmenucon).addClass("current");

      var max_scroll = $(document).height() - $(window).height();

      if (max_scroll <= mywindow.scrollTop() + 800) {
        $("li.m-item", leftmenucon).removeClass("current");
        $('li[data-section="5"]', leftmenucon).addClass("current");
        $("#news").addClass("scrolling").siblings().removeClass("scrolling");
        $("#news").trigger("scrolling");
      }
    });

    window.goToByScroll = function(dataslide) {
      if ($.moving_is_moving(htmlbody)) {
        return;
      }
      else {
        $.moving_start(htmlbody);
      }
      if (dataslide.size()) {
        var scrollTop = $(document).scrollTop();
        htmlbody.animate({
          scrollTop: dataslide.offset().top + 2
        }, 2000, 'easeInOutExpo', function() {
          $.moving_finished(htmlbody);
        });
      }
    }



    $("li.m-item", leftmenucon).click(function() {
      var data_id = $(this).attr("data-section");
      if (data_id) {
        goToByScroll($("body > .maincontent > .s[data-section='" + data_id + "']"));

      }
    });
  });
})(jQuery);

(function($) {
  $.resizeAcademyContentTop = function(cb) {
  }

  $.resizeProgramContentTop = function(cb) {
  }
})(jQuery);

(function($) {
  $(function() {
    $("#home .home-nav .lan-bar .item-2").toggle(function() {
      $(this).parent().siblings(".more-info").removeClass("hideme");
    }, function() {
      $(this).parent().siblings(".more-info").addClass("hideme");
    });
  });
  $(function() {

  });
})(jQuery);

(function($) {
  $.computeContentWidth = function(num_of_bars, width_of_bars, total_width) {
    var cut_width = num_of_bars * width_of_bars;
    return total_width - cut_width;
  };

  $(function() {
    $("#news").on("scrolling", function() {
      var self = $(this);
      if ($.moving_is_moving(self)) {
        return;
      }
      else {
        $.moving_start(self);
      }
      var news_list = $(".news-list li", self);
      var total = news_list.size();
      (function() {
        var img = $("> img", news_list);
        img.each(function() {
          $(this).attr("src", $(this).attr("data-src"));
        });
      })();
    });
  });
})(jQuery);

(function($) {
  $(function() {

    var videoconver = $(".overconver-video");
    var video = videojs("yenching-video-con");
    closeBtn = $("#video-close");
    closeBtn.click(function() {
      videoconver.trigger("click");
    });
    videoconver.click(function() {
      var videocon = $("#yenching-video-con");
      video.pause();
      videocon.css({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        margin: "auto"
      }).animate({
        width: 0,
        height: 0,
      }, 1000 * 1, function() {
        videocon.removeAttr("style");
        videoconver.removeAttr("style");
      });
    });
    video.on("fullscreenchange", function() {
      var videocon = $("#yenching-video-con");
      var videoconver = $(".overconver-video");
      if (video.isFullScreen()) {
        videocon.css({
          "margin-left": 0,
          "margin-top": 0,
          "position": "static"
        });
        videoconver.css("opacity", 1);
      }
      else {
        videocon.removeAttr("style");
        videocon.css("display", 'block');
        videoconver.removeAttr("style");
        videoconver.css("display", "block");
      }
    });
    video.ready(function() {
      var videocon = $("#yenching-video-con");
      var closeBtn = videocon.siblings("#video-close");
      videocon.append(closeBtn);
      closeBtn.css("display", "block");
      var videoconver = $(".overconver-video");
      $("#academy .video img").click(function() {
        videoconver.show();
        var width = videocon.width();
        var height = videocon.height();

        videocon.css({
          width: "0px",
          height: "0px",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          margin: "auto"
        });
        videocon.css("display", "block");
        videocon.animate({
          width: width,
          height: height
        }, 1000 * 1, function() {
          videocon.removeAttr("style");
          videocon.css("display", "block");
        });
      });
    });
  });
})(jQuery);

(function($) {
  $(function() {
    $(".body .left-bar .m-item-first").click(function() {
      var activeItem = $(this).siblings(".current");
      if ($(this).siblings().get(0) == activeItem.get(0)) {
     
      }
      else {
        var index = activeItem.attr("data-section");
        if (index) {
          index = parseInt(index);
          var pre_link = $(this).siblings("[data-section=" + (index - 1) + "]");
          if (pre_link.size()) {
            pre_link.trigger("click");
          }
        }
      }
    });

    $(".body .left-bar .m-item-last").click(function() {
      var activeItem = $(this).siblings(".current");
      if ($(this).siblings().last().get(0) == activeItem.get(0)) {
      
      }
      else {
        var index = activeItem.attr("data-section");
        if (index) {
          index = parseInt(index);
          var pre_link = $(this).siblings("[data-section=" + (index + 1) + "]");
          if (pre_link.size()) {
            pre_link.trigger("click");
          }
        }
      }
    });
  });
})(jQuery);


(function($) {
  $.search = function(keyword, cb) {
    cb || (cb = function() {
    });
    $.ajax({
      url: "/index/search?q=" + encodeURIComponent(keyword),
      success: function(data) {
        cb(data);
      }
    });
  }
})(jQuery);


(function() {
  $(function() {
    $("img").each(function() {
      var img = $(this);
      if (img.attr("img-src")) {
        img.attr("src", img.attr("img-src"));
      }
    });

    $(".bg-style").each(function() {
      $(this).attr("style", $(this).attr("bg-style"));
    });
  });
})();

(function($) {
  $(function() {
    $(".news-block-list-con .block-con").delegate(".news-item", "mouseenter mouseleave", function(event) {
      return;
      var self = $(this);
      if (event.type === 'mouseenter') {
        if (self.attr("data-newsid")) {
          self.addClass("hover");
          self.append("<h3>" + self.attr("data-title") + "</h3>");
        }
      }
      else {
        if (self.attr("data-newsid")) {
          self.removeClass("hover");
          $("h3", self).remove();
        }
      }
    });

    $(".body .right-bar .m-item-0").click(function() {


$(".close-con").trigger("click");

      var searchCon = $("body > .search-con");
      searchCon.css({
        top: parseInt($(window).height() * 0.15) + parseInt($(window).scrollTop()),
      }).removeClass("hideme");

      $(".loading").removeClass("hideme").children("img").addClass("hideme");
    });

    $(".close-con, .back").click(function() {
      var loading = $("body > .loading").addClass("hideme");
      $("body > .loading img").removeClass("hideme");
      var searchCon = $("body > .search-con").addClass("hideme");
      $("body > .search-con img").removeClass("hideme");
      $("body > .search-con").addClass("hideme");
      $(".email-pop").addClass("hideme");

      $("body > .apply-pop").addClass("hideme");
    });

    var timer;
    $("input[name='search_keyword']").focus(function() {
      if ($(this).val() == "SEARCH") {
        $(this).val("");
      }
    }).focusout(function() {
      if ($(this).val() == "") {
        $(this).val("SEARCH");
      }
    }).on("input", function() {
      var self = $(this);
      var val = $(this).val();
      if (timer) {
        clearTimeout(timer);
        timer = false;
      }
      var template = $("#search-item").html();
      Mustache.parse(template);
      timer = setTimeout(
              function() {
                var loading = $("body > .loading");
                var searchCon = $("body > .search-con");
                loading.removeClass("hideme");
                $.search(val, function(data) {
                  var html = "";
                  for (var index in data) {
                    var d = data[index];
                    html += Mustache.render(template, d);
                  }
                  var searchList = $(".search-list");
                  if (html != "") {
                    searchList.html(html);
                    searchList.removeAttr("style");
                  }
                  else {
                    searchList.removeAttr("style");
                    searchList.html("<p>Sorry, there are no webpages that match this criteria.</p>");
                  }

                  $("input[name='search_keyword']", searchCon).val(val);
                  if (self.attr("name") != "search_keyword") {
                    $(".body .right-bar .m-item-1").trigger("click");
                  }
                  $("body > .loading img").addClass("hideme");
                  searchCon.css({
                    top: parseInt($(window).height() * 0.15) + parseInt($(window).scrollTop()),
                  }).removeClass("hideme");
                });
                time = false;
              }, 1000 * 1);
    });
  });
})(jQuery);


(function($) {
  $(function() {
    $(".search-item h3").live("click", function() {

      var self = $(this).parent();
      var searchCon = $("body > .search-con");
      var section_index = self.attr("data-section");
      var index = self.attr("data-index");
      var section = $("body > .maincontent > .s[data-section='" + (parseInt(section_index) + 1) + "']");
      goToByScroll(section);
      searchCon.fadeOut(2000, function() {
        searchCon.addClass("hideme").removeAttr("style");
      });
      $("body > .loading").addClass("hideme");
    });
  });
})(jQuery);


(function($) {
  $(function() {
    function validateEmail(email) {
      var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    }
    var form = $("form[name='subscribe']");
    $("input[type='submit']", form).click(function(event) {
      event.preventDefault();
      var mail = $("input[name='email']", form);
      if (!validateEmail(mail.val())) {
        mail.focus()
        mail.css("outline", "1px solid #ff0000");
        return;
      }
      if (mail.val()) {
        $.ajax({
          url: "/index/addnewmail",
          data: {mail: mail.val()},
          type: "POST",
          beforeSend: function() {
            $("body .loading img").addClass("hideme");
            $("body .loading").removeClass("hideme");
            $("body > .email-pop").removeClass("hideme");
          },
          success: function(data) {
          
          }
        });
      }
      return false;
    });
  });
})(jQuery);



(function($) {
  $(function() {
    $("#deans-btn").click(function() {

	$(".close-con").trigger("click");
      $("#deanspop").removeClass("hideme");
      $("body > .loading").removeClass("hideme");
      $("body > .loading img").addClass("hideme");
    });
  });
})(jQuery);



(function($) {
  $(function() {
    $("#see-btn").click(function() {
	  $(".close-con").trigger("click");
      $("#seepop").removeClass("hideme");
      $("body > .loading").removeClass("hideme");
      $("body > .loading img").addClass("hideme");
    });
  });
})(jQuery);



(function($) {
  $(function() {
    $("#faculty-btn").click(function() {
	  $(".close-con").trigger("click");
      $("#facultypop").removeClass("hideme");
      $("body > .loading").removeClass("hideme");
      $("body > .loading img").addClass("hideme");
    });
  });
})(jQuery);



(function($) {
  $(function() {
    $("#CoreCourseFaculty-btn").click(function() {
	  $(".close-con").trigger("click");
      $("#CoreCourseFacultyPop").removeClass("hideme");
      $("body > .loading").removeClass("hideme");
      $("body > .loading img").addClass("hideme");
    });
  });
})(jQuery);





(function($) {
  $(function() {
    $(".body .right-bar .m-item-0-2").click(function() {

      $(".close-con").trigger("click");


      $("#faqpop").removeClass("hideme");
      $("body > .loading").removeClass("hideme");
      $("body > .loading img").addClass("hideme");
    });
  });
})(jQuery);



(function ($) {
    $(function () {
        $("#council-btn").click(function () {
			
			$(".close-con").trigger("click");

            $("#councilpop").removeClass("hideme");
            $("body > .loading").removeClass("hideme");
            $("body > .loading img").addClass("hideme");
        });
    });
})(jQuery);


(function($) {
  $(function() {
    var wrapper = $(".news-block .news-detail .news-detail-right > .wrapper");
    wrapper.live({
      mouseenter: function() {
        var self = $(this);
        var count = $(".slides-wrapper img", self).size();
        if (count > 1) {
          $(".left", self).css("visibility", "visible");
          $(".right .btn", self).css("visibility", "visible");
        }
        $(".right .close-btn", self).css("visibility", "visible");
      },
      mouseleave: function() {
        var self = $(this);
        var count = $(".slides-wrapper img", self).size();
        if (count > 1) {
          $(".left", self).removeAttr("style");
          $(".right .btn", self).removeAttr("style");
          $(".right .btn", self).removeAttr("style");
        }
        $(".right .close-btn", self).removeAttr("style");
      }
    });

    $("body > .loading").click(function() {
      $(".close-con").trigger("click");
    });
  });
})(jQuery);


(function($) {
  $(function() {

    $(".home-nav .item-1").click(function() {
      var popup = $(".nav-cn-popup");
      var loading = $(".loading");
      popup.css("display", "block");
      loading.css("display", "block");
    });

    $(".nav-cn-popup .close-con, .nav-cn-popup  .back").click(function() {
      var popup = $(".nav-cn-popup");
      var loading = $(".loading");
      popup.removeAttr("style");
      loading.removeAttr("style");
    });
  });
})(jQuery);


(function ($) {
  $(function () {
    $.waitForImagesCallback = waitForImagesCallback = function(cid) {
      $(".s7 .block-pager .pager").each(function () {
        var pagerLinks = $(".pager-link[data-index]", $(this));
        var pagerIndex = 2;
        if (pagerLinks.size() <= 1) return;
        var self = $(pagerLinks.get(pagerIndex - 1)),
          category = self.parents(".blocks").data("cid"),
          blocksEl = self.parents(".blocks");

        if (typeof cid != 'undefined') {
          category = cid;
        }

        if (self.size() < 1) {
          return;
        }

        function loadNextPageNews(cb) {
          if (pagerIndex -1 >= pagerLinks.size()) {
            return;
          }
          cb || (cb = function () {});
          $.ajax({
            url: "api/nextpagenewsv2",
            type: "GET",
            data: {page: pagerIndex, category: category},
            success: function (res) {
              cb.apply(this, [res]);

              loadNextPageNews(cb);
            }
          });
        }

        loadNextPageNews(function (res) {
            var items = $("<div class='items clearfix'></div>").append($(res));
            $(".items", blocksEl).css({
              width: $(".items", blocksEl).width()
            });
            items.css({width: $(".items", blocksEl).width()})
                    .attr("data-page", pagerIndex);

            $(".items-con", blocksEl).css({
              width: $(".items", blocksEl).width() * pagerIndex
            }).append(items);

            pagerIndex += 1;
        });
      });
    }

    $(".s7 .block-content").waitForImages(function () {
      waitForImagesCallback();
    });
    
    
    $(".s7 .block-pager .pager .pager-link").live('click',function () {
      var self = $(this);
      var pagerIndex = self.data("index"),
        blocksEl = self.parents(".blocks");
        
      if(self.hasClass("active")) {
        return;
      }
      
      if (typeof pagerIndex == "undefined") {
        if (self.hasClass("pager-first")) {
          pagerIndex = 1;
          self.siblings("[data-index='"+pagerIndex+"']").trigger("click");
          return;
        }
        else if (self.hasClass("pager-last")) {
          pagerIndex = self.parents(".block-pager").data("maxpage") * 1;
          self.siblings("[data-index='"+pagerIndex+"']").trigger("click");
          return;
        }
        else if (self.hasClass("pager-next")) {
          pagerIndex = self.siblings(".active").data("index") + 1;
          self.siblings("[data-index='"+pagerIndex+"']").trigger("click");
          return;
        }
        else if (self.hasClass("pager-prev")) {
          pagerIndex = self.siblings(".active").data("index") - 1;
          self.siblings("[data-index='"+pagerIndex+"']").trigger("click");
          return;
        }
      }
      
      if ($.moving_is_moving(blocksEl)) {
        return;
      }
      $.moving_start(blocksEl);
      
      var loadedItems = $(".items[data-page='"+pagerIndex+"']", blocksEl);
      if (loadedItems.size()) {
          var crtIndex = $(self).siblings(".active").data("index");
          var rightMargin = (pagerIndex - crtIndex) * $(".items", blocksEl).width();
          $(".items-con", blocksEl).animate({
            right: 1*$(".items-con", blocksEl).css("right").replace(/(px|auto)/ig, "") + rightMargin
          }, 1000, function () {
            self.siblings().removeClass("active"); 
            self.addClass("active");
            $.moving_finished(blocksEl);
          });
      }
      else {
        $.moving_finished(blocksEl);
      }
    });
  });
})(window.jQuery);


(function ($) {
  $(function () {
    $('.category-pager li').live("click", function () {
      var parent = $(this).parent();
      if ($.moving_is_moving(parent)) {
        return;
      }
      $(this).siblings().removeClass('active');
      $(this).addClass('active');
      $.moving_start(parent);
      var cid = $(this).data('cid');
      var wrapper = $(this).parents('.wrapper[data-name]');
      $.ajax({
        url: '/api/categoryNews',
        data: {cid: cid},
        success: function (data) {
          var html = $(data);
          $.moving_finished(parent);
          wrapper.parent().html(html);
          waitForImagesCallback(cid);
        }
      });
    });
  });
})(jQuery);


(function ($) {
  $(function () {
    $("body").delegate(".news-detail[data-newsid=17] .bar").click(function () {
      console.log('hello');
    });
  });
})(jQuery);












