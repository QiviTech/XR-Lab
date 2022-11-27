
(function ($) {
    window.animate_speed = 1000 * 1;
    var btn_width = 41;
    $.resizeAcademySlideBtns = function () {
        var con = $("#academy");
        var slideBtnCon = $(".slider-btns", con);
        var slidesCon = slideBtnCon.siblings(".slides");
        var height = $(slidesCon).height();
        slideBtnCon.css({
            width: height - 1
        });
        var margin_left = -(height / 2  - slideBtnCon.height() / 2);
        slideBtnCon.css({
            "margin-left": margin_left
        });
        if (window.isIE8) {
          var margin_top = (slideBtnCon.height())/2;
          slideBtnCon.css({
            "margin-top": -margin_top
          });
        }
        slideBtnCon.css("display", "block");
        slideBtnCon.show();
        

        var backBtnCon = $(".btn-c", con);
        backBtnCon.css({
            width: height - 1
        });
        backBtnCon.each(function () {
           var self = $(this);
           
           var count_btns = $(".btn-item", self).size();
           if (!window.isIE8) {
            var margin_right = - (height / 2 - self.height() / 2);
            self.css({
                "margin-right": margin_right
            });
            var margin_top = -(self.height() / 2);
            self.css({
                "margin-top": margin_top
            });
           }
           else {
              var margin_top = (self.height())/2;
              self.css({
                "margin-top": (- margin_top),
                "margin-right": - ( self.height() - count_btns * btn_width)
              });
           }
           
           self.show();
        });

    };
    
    $.adaptSlideContentSize = function () {
        var con = $("#academy");
        var total = $(".r", con).size();
         $(".r", con).each(function (index) {
             var r = $(this);
             if (r.siblings(".btn-c").size()) {
                var right_btns_count = $(".btn-item" ,r.siblings(".btn-c")).size();
                var padding_right = btn_width * right_btns_count;
                var padding_left = btn_width * (total - right_btns_count - 1);
             }
             else {
                var padding_right = btn_width * index;
                var padding_left = btn_width * (total - index - 1);
             }
             
             r.css({
                 "padding-left": padding_left,
                 "padding-right": padding_right
             });
         });
    };
    
    function SlideBtnClicked() {
        var self = $(this);
        var btnCon = self.parent();
        var oneslide = $("body");
        if ($.moving_is_moving(oneslide)) {
            return;
        }
        else {
            $.moving_start(oneslide);
        }
        var index = $.getIndexFromClass(self.attr("class"));
        var slideItems = btnCon.parent().siblings(".slides");
        var next_slide = $(".slide-item-" + index, slideItems);
        var current_slide = $(".slide-item:not(.hideme)", slideItems);
        var crt_index = $.getIndexFromClass(current_slide.attr("class"));
        
        if (crt_index == index) {
            $.moving_finished(oneslide);
            return;
        }
        

        current_slide.css({
            "position": "absolute",
            "z-index": 2
        });
        next_slide.css({
            "z-index": 1
        });
        

        var image = $(".l img", current_slide);
        var left_image = $(".l img", current_slide);
        var image_width = image.width();
        var image_height = image.height();
        left_image.parent().css({
            "width": image_width,
            "height": image_height
        });
        left_image.css({
            "position": "relative"
        });
        
        console.log("LEFT IMAGE AINIMATE START");
        left_image.animate({
            left: -image_width
        }, window.animate_speed, function () {

        });
        

        var content = $(".r", current_slide);
        $(".r", next_slide).css({
            "background-color": self.css("background-color")
        });
        console.log(self.css("background-color"));
        var back_btn_count = $(".btn-c .btn-item", current_slide).size();
        var total = $(".slider-btns .btns .btn", slideItems.parent()).size();
        content.animate({
            right: -($(".r", current_slide).width() + (total - back_btn_count) * btn_width)
        }, window.animate_speed  );
        
        setTimeout(function () {
            console.log("ANIMATE FINISHED");
            current_slide.addClass("hideme");
            
           
            left_image.removeAttr("style");
            next_slide.removeAttr("style");
            content.css("right", 0);
            current_slide.removeAttr("style");
            
            $.moving_finished(oneslide);
        }, window.animate_speed * 1.1);
        
        console.log("BEGIN REMOVE hideme class on next slide");
        next_slide.removeClass("hideme");
        
        self.addClass("hideme");
        $("~ .btn", self).each(function () {
            $(this).addClass("hideme");
        });
        
        $.resizeAcademySlideBtns();
    }
    
    function BackSlideBtnClicked () {
        var self = $(this);
        var index = $.getIndexFromClass(self.attr("class"));
        
        var oneslide = $("body");
        if ($.moving_is_moving(oneslide)) {
            return;
        }
        else {
            $.moving_start(oneslide);
        }
        
        var slideItems = self.parents(".slides");
        var next_slide = $(".slide-item-" + index, slideItems);
        var current_slide = $(".slide-item:not(.hideme)", slideItems);
        var crt_index = $.getIndexFromClass(current_slide.attr("class"));
        var total = $(".slide-item", slideItems).size();
        
        var right_c = $("~ .btn-item", self).size();
        var total = $(".slider-btns .btns .btn", slideItems.parent()).size();

        
       
        next_slide.css({
            "position": "absolute",
            "z-index": 2
        });
        current_slide.css({
            "z-index": 1
        });
        
      
        var image = $(".l img", current_slide);
        var left_image = $(".l img", next_slide);
        var image_width = image.width();
        var image_height = image.height();
        left_image.css({
            "position": "relative",
            "width": image_width,
            "height": image_height,
            left: -image_width
        });
        
        left_image.animate({
            left: 0
        }, window.animate_speed, function () {

        });
        
      
        var content = $(".r", next_slide);
        content.css({
            "background-color": self.css("background-color"),
            right: -($(".r", current_slide).width())
        });
        
        content.animate({
            right: 0
        }, window.animate_speed, function () {
            for (var i = 0; i < parseInt(total)- parseInt(right_c); i++) {
               
            }
            (function next(i) {
               if (i < 0) {
                 return;
               }
               var btn = $(".slider-btns .btns .btn-" + (i + 1), slideItems.parent());
               if (btn.hasClass("hideme")) {
                  btn.removeClass("hideme");
                  $("> span", btn).css({
                    bottom: - ($("> span", btn).height() / 2 - 5)
                  }).animate({
                    bottom: 0
                  }, 300);
                  next (i - 1);
               }
            })(parseInt(total)- parseInt(right_c)  - 1);
            $.moving_finished(oneslide);
        });
        
        setTimeout(function () {
            current_slide.addClass("hideme");
            
         
            left_image.removeAttr("style");
            next_slide.removeAttr("style");
            content.css("right", 0);
            current_slide.removeAttr("style");
            
        }, window.animate_speed * 1.1);
        
        next_slide.removeClass("hideme");
        
        $.resizeAcademySlideBtns();
    }
    
    $(function () {
        $.adaptSlideContentSize();
        
     
        var btn = $("#academy .slider-btns .btn");
        btn.click(SlideBtnClicked);
        
       
        var back_btn = $("#academy .btn-c .btn-item");
        back_btn.click(BackSlideBtnClicked);
        
    });
    $(window).load(function () {
        $.resizeAcademySlideBtns();
    });
    
    $(window).resize(function() {
        $.resizeAcademySlideBtns();
    });
})(jQuery);


(function ($) {
    var btn_width = 41;
    $.resizeProgramSlideBtns = function () {
        var con = $("#program");
        var slideBtnCon = $(".slider-btns", con);
        var slidesCon = slideBtnCon.siblings(".slides");
        var height = $(slidesCon).height();
        var width = $(slidesCon).width();
        slideBtnCon.css({
            width: height - 1
        });
        var margin_left = -(height / 2  + slideBtnCon.height() / 2);
        var margin_top = - (slideBtnCon.height() / 2);
        slideBtnCon.css({
            "margin-top": margin_top
        });
        if (!window.isIE8) {
          slideBtnCon.css({
              "margin-left": margin_left
          });
        }
        slideBtnCon.css("display", "block");
        slideBtnCon.show();
        
     
        var backBtnCon = $(".btn-c", con);
        backBtnCon.css({
            width: height - 1
        });
        backBtnCon.each(function () {
           var self = $(this);
           var count_btns = $(".btn-item", self).size();
           var margin_left = - (height / 2 - self.height() / 2);
           self.css({
               "margin-left": margin_left
           });
           var margin_top = -(self.height() / 2);
           self.css({
               "margin-top": margin_top
           });
           self.show();
        });
    };
    
    $.adaptProgramSlideContentSize = function () {
        var con = $("#program");
        var total = $(".r", con).size();
         $(".r", con).each(function (index) {
             var r = $(this);
             if (r.siblings(".btn-c").size()) {
                var right_btns_count = $(".btn-item" ,r.siblings(".btn-c")).size();
                var padding_right = btn_width * right_btns_count;
                var padding_left = btn_width * (total - right_btns_count - 1);
             }
             else {
                var padding_right = btn_width * index;
                var padding_left = btn_width * (total - index - 1);
             }
             
             r.css({
                 "padding-right": padding_left,
                 "padding-left": padding_right
             });
         });
    };
    
    function SlideBtnClicked() {
        var self = $(this);
        var btnCon = self.parent();
        var oneslide = $("body");
        if ($.moving_is_moving(oneslide)) {
            return;
        }
        else {
            $.moving_start(oneslide);
        }
        var index = $.getIndexFromClass(self.attr("class"));
        var slideItems = btnCon.parent().siblings(".slides");
        var next_slide = $(".slide-item-" + index, slideItems);
        var current_slide = $(".slide-item:not(.hideme)", slideItems);
        var crt_index = $.getIndexFromClass(current_slide.attr("class"));
        
        if (crt_index == index) {
            $.moving_finished(oneslide);
            return;
        }
        
      
        current_slide.css({
            "position": "absolute",
            "z-index": 2
        });
        next_slide.css({
            "z-index": 1
        });
        
       
        var image = $(".l img", current_slide);
        var left_image = $(".l", current_slide);
        
        left_image.animate({
            right: -left_image.width()
        }, window.animate_speed, function () {
            
        });
        
    
        var content = $(".r", current_slide);
        $(".r", next_slide).css({
            "background-color": self.css("background-color")
        });
        
        var back_btn_count = $(".btn-c .btn-item", current_slide).size();
        var total = $(".slider-btns .btns .btn", slideItems.parent()).size();
        content.animate({
            left: - ( content.width() + ( total - back_btn_count) * btn_width)
        }, window.animate_speed * 1 );
        console.log(- ( content.width() + ( total - back_btn_count) * btn_width));
        
        setTimeout(function () {
            current_slide.addClass("hideme");
            
          
            left_image.removeAttr("style");
            next_slide.removeAttr("style");
            content.css("right", "auto");
            content.css("left", "auto");
            current_slide.removeAttr("style");
            
            $.moving_finished(oneslide);
        }, window.animate_speed * 1.5);
        
        next_slide.removeClass("hideme");
        
        self.addClass("hideme");
        $(self).prevAll(".btn").each(function () {
            $(this).addClass("hideme");
        });
        
        $.resizeProgramSlideBtns();
    }
    
    function BackSlideBtnClicked () {
        var self = $(this);
        var index = $.getIndexFromClass(self.attr("class"));
        
        var oneslide = $("body");
        if ($.moving_is_moving(oneslide)) {
            return;
        }
        else {
            $.moving_start(oneslide);
        }
        
        var slideItems = self.parents(".slides");
        var next_slide = $(".slide-item-" + index, slideItems);
        var current_slide = $(".slide-item:not(.hideme)", slideItems);
        var crt_index = $.getIndexFromClass(current_slide.attr("class"));
        if (crt_index == index) {
          $.moving_finished(oneslide);
          return;
        }
        var total = $(".slide-item", slideItems).size();
        
        var right_c = $("~ .btn-item", self).size();
        var total = $(".slider-btns .btns .btn", slideItems.parent()).size();
        
     
        next_slide.css({
            "position": "absolute",
            "z-index": 2
        });
        current_slide.css({
            "z-index": 1
        });
        
    
        var image = $(".l", current_slide);
        var left_image = $(".l", next_slide);
        var image_width = image.width();
        var image_height = image.height();
        left_image.css({
            "width": image_width,
            "height": image_height,
            right: -image_width
        });
        
        left_image.animate({
            right: 0
        }, window.animate_speed, function () {

        });
        
     
        var content = $(".r", next_slide);
        content.css({
            "background-color": self.css("background-color"),
            left: -($(".r", current_slide).width())
        });
        
        content.animate({
            left: 0
        }, window.animate_speed, function () {
            (function next(i) {
              if (i >= index) {
                console.log(i);
                var showing_btn = $(".slider-btns .btns .btn-" + (i + 1), slideItems.parent());
                if (showing_btn.hasClass("hideme")) {
                  showing_btn.removeClass("hideme");
                  $.resizeProgramSlideBtns();
                  var top = $("> span", showing_btn).css("top");
                  console.log("top: " + top);
                  $("> span", showing_btn).css({
                     top: - ($("> span", showing_btn).height() / 2 - 5)
                   }).animate({
                     top: top
                   }, 300, function () {
                     $(this).removeAttr("style");
                   });
                }
                next(i - 1);
              }
              else {
                return;
              }
            })(total - 1);
            $.resizeProgramSlideBtns();
        });
        
        setTimeout(function () {
            current_slide.addClass("hideme");
            
          
            left_image.removeAttr("style");
            next_slide.removeAttr("style");
            content.css("right", 0);
            current_slide.removeAttr("style");

            $.moving_finished(oneslide);
            
        }, window.animate_speed * 1.1);
        
        next_slide.removeClass("hideme");
        $.resizeProgramSlideBtns();
        
    }
    
    $(function () {
        $.adaptProgramSlideContentSize();
        
      
        var btn = $("#program .slider-btns .btn");
        btn.click(SlideBtnClicked);
        
       
        var back_btn = $("#program .btn-c .btn-item");
        back_btn.click(BackSlideBtnClicked);
    });
    
    $(window).load(function () {
        $.resizeProgramSlideBtns();
    });
    
    $(window).resize(function() {
        $.resizeProgramSlideBtns();
    });
    
})(jQuery);