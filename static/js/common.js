function getMyPath() {
    var scriptSrc = document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].src;
    var jsName = scriptSrc.split('/')[scriptSrc.split('/').length - 1];
    jsName = "/js/" + jsName;
    return scriptSrc.replace(jsName, '');
}

myPath = getMyPath();

function set_class2(li, cur, text) {
    var name = li;
    text = jQuery.trim(text);
    jQuery(name).each(function() {
        var li_text = jQuery.trim(jQuery(this).children("span").text() + "");
        if (li_text == text) {
            jQuery(this).addClass(cur);
        }
    });
}

function set_class(li, cur, text) {
    var name = li;
    text = jQuery.trim(text);
    jQuery(name).each(function() {
        var li_text = jQuery.trim(jQuery(this).text() + "");
        if (li_text == text) {
            jQuery(this).addClass(cur);
        }
    });
};

function clickTabs() {
    var submenu = document.getElementById("submenu");
    var h3 = submenu.getElementsByTagName("h3");
    var ul = submenu.getElementsByTagName("ul");
    for (var i = 0; i < h3.length; i++) {
        h3[i].onclick = function() {
            for (var i = 0; i < h3.length; i++) {
                h3[i].className = 'clear';
            }
            this.className = 'on';
        }

    }
}

function mapShow() {
    var getMap = document.getElementById("map");
    var divs = getMap.getElementsByTagName("div");
    var spans = getMap.getElementsByTagName("span");
    var imgs = getMap.getElementsByTagName("img");

    for (var i = 0; i < divs.length; i++) {
        divs[i].onmouseover = function() {
            clearInterval(timer);
            for (var i = 0; i < divs.length; i++) {
                divs[i].getElementsByTagName("span")[0].style.display = "none";
                divs[i].getElementsByTagName("img")[1].src = myPath + "/images/map_bj.png";
            };
            this.getElementsByTagName("span")[0].style.display = "block";
            this.getElementsByTagName("img")[1].src = myPath + "/images/map_hv.png";
        };
        divs[i].onmouseout = function() {
            timer = setInterval(toggleMap, 6000);

        };
    };

};

function toggleMap() {
    var getMap = document.getElementById("map");
    var divs = getMap.getElementsByTagName("div");
    var spans = getMap.getElementsByTagName("span");
    var imgs = getMap.getElementsByTagName("img");
    if (num < divs.length - 1) {
        num++;
    } else {
        num = 0
    };
    for (var i = 0; i < divs.length; i++) {
        divs[i].getElementsByTagName("span")[0].style.display = "none";
        divs[i].getElementsByTagName("img")[1].src = myPath + "/images/map_bj.png";
    };
    divs[num].getElementsByTagName("span")[0].style.display = "block";
    divs[num].getElementsByTagName("img")[1].src = myPath + "/images/map_hv.png";
}
var num = 0;

function tabs(id, cur, s) {
    var content = "_main_";
    if (jQuery("#" + id).length) {
        function closeContent(id, length) {
            for (var i = 1; i <= length; i++) {
                jQuery("#" + id + content + i).hide();
            }
        }
        var length = jQuery("#" + id + "  " + s).length;
        jQuery("#" + id + "  " + s).each(function(i) {
            jQuery(this).hover(function() {
                jQuery("#" + id + "  " + s).removeClass(cur);
                closeContent(id, length);
                jQuery(this).addClass(cur);
                jQuery("#" + id + content + (i + 1)).show();
            }, function() {});
        });
    }
};



window.onload = function() {
    $(document).ready(function(e) {
        if ($('#side')) { return; };
        var offset = $('#side').offset();
        var initTop = offset.top;
        var initLeft = offset.left;
        $('#side').css({ position: 'static', top: initTop, left: initLeft, marginTop: 0 });

        var sideHeight = $('#side').outerHeight();
        var mainHeight = $('.right').eq(1).outerHeight();
        var flag = (mainHeight - sideHeight) > 0 ? true : false;
        var secTop = initTop + mainHeight - sideHeight;

        function moveRight() {
            if (flag) {
                var st = $(document).scrollTop();

                if (st < initTop) {
                    $('#side').css({ position: 'static', top: 0, marginTop: 0 });
                } else if (st > secTop) {
                    $('#side').css({ position: 'absolute', top: secTop, marginTop: 0 });
                } else {
                    $('#side').css({ position: 'fixed', top: 0, marginTop: 0 });
                }
            }
        }

        var wrapperW = $('#rapper').innerWidth();
        $(window).scroll(function(e) {
            if ($(window).outerWidth() >= wrapperW) {
                moveRight()
            }
        });

        $(window).resize(function(e) {
            $left = $('.site-nav').offset().left + $('.site-nav').innerWidth() - $('#side').innerWidth();
            $('#side').css({ left: $left });

            if ($(window).outerWidth() < wrapperW) {
                $('#side').css({ position: 'static' });
            } else {
                moveRight();
            }
        });
    });
}