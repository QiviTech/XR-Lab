tide_player = {
    ua: navigator.userAgent,
    isios: false,
    isandroid: false,
    _tide_play_num: 0,
    _path: "/player/videoplayer-1.30.00.swf",
    divid: "",

    init: function() {

        this.tmpobj = {};
        if (/(iPhone|iPad|iPod|iOS)/i.test(this.ua)) {
            this.isios = true;
        } else if (/(Android)/i.test(this.ua)) {
            this.isandroid = true;
        }
        if (!this.isios && !this.enableflash()) {
            this.isios = true;
        }
        String.prototype.trim = function() {
            return this.replace(/(^\s*)|(\s*$)/g, "");
        };
    },


    showPlayer: function(obj) {

        this.init();
        obj.skin = obj.skin || "1,1,1,1";

        this.divid = obj.divid;
        if (obj.autoplay === undefined) {
            obj.autoplay = true;
        }
        var _dom_name = obj.name || "TIDE_PLAYER_" + (this._tide_play_num);
        this._tide_play_num += 1;

        var _w = obj.width || "100%";
        var _h = obj.height || "100%";
        obj.json = obj.json || obj.url || obj.id || obj.xml || "";
        if (!obj.json) delete obj.json;
        this._path = obj.path || this._path;



        if (this.isios) {

            this.forhtml5(_dom_name, _w, _h, obj);
        } else {
            this.newfla(this._path, _dom_name, _w, _h, false, obj);
        }


    },


    newfla: function(flvpath, domname, w, h, wmode, obj) {

        var flavars = this.objtourl(obj);
        var e = '<object id="' + domname + '" width="' + w + '" height="' + h + '" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" >' +
            '<param name="movie" value="' + flvpath + '" /><param name="FlashVars" value="' + flavars + '" /><param name="wmode" value="' +
            (wmode ? 'transparent' : 'opaque') +
            '" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="true" />' +
            '<embed name="' + domname + '" width="' + w + '" height="' + h + '" src="' +
            flvpath + '" wmode="' + (wmode ? 'transparent' : 'opaque') +
            '" allowFullScreen="true" allowScriptAccess="always" FlashVars="' + flavars +
            '" type="application/x-shockwave-flash"></embed></object>';

        if (!obj.notool) {
            e = "<div style='position:relative;z-index:300;'>" + e + "</div>";
        }
        if (obj.divid) {
            try {
                document.getElementById(obj.divid).innerHTML = e;
            } catch (e) {}
        } else {
            document.write(e);
        }

    },


    forhtml5: function(domname, w, h, o) {

        this.tmpobj.id = domname;
        this.tmpobj.w = w;
        this.tmpobj.h = h;
        this.tmpobj.ap = o.autoplay;

        this.tmpobj.lp = o.loop;
        this.tmpobj.cv = o.cover;

        this.tmpobj.pc = o.playcallback;
        var theurl = o.json;
        var videohtml;

        if (theurl) {
            if (theurl.indexOf("http://") == -1) {
                theurl = this.decode64(o.json);
            }
            var self = this;
            $.getJSON(theurl, this.ajaxsucc).fail(function() {
                if (theurl.substr(theurl.lastIndexOf(".") + 1) == 'json')
                    self.dojsonp(theurl);
                else self.dojsonp(theurl + "&funcname=tide_player.ihtml5");
            });








            videohtml = "Loading...";

        } else {
            var c = o.video;
            if (c) {
                if (c.indexOf("http://") == -1 || c.indexOf("https://") == -1) {
                    c = this.decode64(c);
                }
                var d = c.toLowerCase();
                var e = d.substr(d.lastIndexOf(".") + 1);
                videohtml = this.ihtml5(c, true)
            }
            if (!videohtml) {
                videohtml = "此视频暂时不支持移动设备播放，请在电脑上浏览观看！"
            }
        }

        var videodiv = '<div id=' + domname + ' style="width:' + this.tmpobj.w + 'px;height:' + this.tmpobj.h + 'px;background:#000;line-height:' + h + 'px;text-align:center;color:#fff;font-size:16px;clear:both;">' + videohtml + '</div>'
        if (!this.divid) document.write(videodiv);
        else document.getElementById(this.divid).innerHTML = videodiv;
    },


    ihtml5: function(vars, notspc) {

        var c;
        if (notspc) {
            c = vars;
        } else {
            var vc;
            for (var i = vars.videos.length - 1; i >= 0; i--) {
                var vi = vars.videos[i];
                if (!c) {
                    c = vi.url;
                }
                if (vi.type == "v") {
                    vc = vi.url;
                }
            }
            if (vc) c = vc;
        }
        if (c) {
            var cf = "tide_player.forplay(this,'" + this.tmpobj.pc + "');";
            var d = '<video ' + (this.tmpobj.pc ? ('onplay="' + cf + '" onplaying="' + cf + '" onclick="' + cf + '" ') : '') +
                'width="' + this.tmpobj.w + '" height="' + this.tmpobj.h + '" controls="controls" ' + (this.tmpobj.ap == "true" ? 'autoplay="autoplay" ' : '') +
                (this.tmpobj.lp ? 'loop="loop" ' : '') + (this.tmpobj.cv ? ('poster="' + this.tmpobj.cv + '" ') : (vars.photo ? ('poster="' + vars.photo + '" ') : '')) +
                'src="' + c + '"></video>';
            if (notspc) {
                return d;
            } else {
                var tmp = this.divid || this.tmpobj.id;
                if (tmp) document.getElementById(tmp).innerHTML = d;
            }
        }

    },
    dojsonp: function(url) {
        $.ajax({ type: "GET", url: url, dataType: "jsonp", jsonp: 'tide_player.ihtml5' });
    },

    ajaxsucc: function(data) {
        tide_player.ihtml5(data);
    },
    forplay: function(vobj, func) {
        if (eval(func)()) {
            vobj.onplay = null;
            vobj.onplaying = null;
            onclick = null;
        } else {
            if (typeof vobj.webkitExitFullscreen !== "undefined") {
                vobj.webkitExitFullscreen();
            }
            vobj.currentTime = 0;
            vobj.pause();
            try {
                vobj.stop();
            } catch (e) {}
        }
    },


    getFlashDom: function(a) {
        return document[a];
    },

    _getPlayer: function(id) {
        return document["TIDE_PLAYER_" + id];
    },

    getPlayerPageUrl: function() {
        return window.location.href;
    },

    enableflash: function() {
        if (navigator.mimeTypes.length > 0) {
            try {
                return navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin != null
            } catch (e) {
                return false;
            }
        } else if (window.ActiveXObject) {
            try {
                new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    },

    objtourl: function(a) {
        var b = [];
        for (var c in a) {
            b.push(c + "=" + encodeURIComponent(a[c]));
        }
        return b.join("&");
    },

    decode64: function(a) {
        if (a.indexOf(".") != -1) return a;
        var b = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
            -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
            42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
        ];
        var c, c2, c3, c4, i, len, out;
        len = a.length;
        i = 0;
        out = "";
        while (i < len) {
            do {
                c = b[a.charCodeAt(i++) & 0xff];
            }
            while (i < len && c == -1);
            if (c == -1) break;
            do {
                c2 = b[a.charCodeAt(i++) & 0xff];
            }
            while (i < len && c2 == -1);
            if (c2 == -1) break;
            out += String.fromCharCode((c << 2) | ((c2 & 0x30) >> 4));
            do {
                c3 = a.charCodeAt(i++) & 0xff;
                if (c3 == 61) return out;
                c3 = b[c3]
            }
            while (i < len && c3 == -1);
            if (c3 == -1) break;
            out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
            do {
                c4 = a.charCodeAt(i++) & 0xff;
                if (c4 == 61) return out;
                c4 = b[c4]
            }
            while (i < len && c4 == -1);
            if (c4 == -1) break;
            out += String.fromCharCode(((c3 & 0x03) << 6) | c4)
        }
        return out
    }

};


function newlight() {
    var d = document.createElement("div");
    d.setAttribute('style', 'position:absolute;display:none;\
        width:100%;zIndex:299;left:0px;top:0px;background-color:#000;');
    d.style.height = document.documentElement.scrollHeight + 'px';
    return d;

}

function controlLight(show) {
    if (!this.light) {
        this.light = newlight();
        document.body.appendChild(this.light);
    }
    this.light.style.display = show ? "none" : "block";
}