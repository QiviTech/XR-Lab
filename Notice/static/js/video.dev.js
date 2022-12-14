var vjs = function(id, options, ready) {
    var tag;
    if (typeof id === 'string') {

        if (id.indexOf('#') === 0) {
            id = id.slice(1);
        }

        if (vjs.players[id]) {
            return vjs.players[id];

        } else {
            tag = vjs.el(id);
        }

    } else {
        tag = id;
    }

    if (!tag || !tag.nodeName) { throw new TypeError('The element or ID supplied is not valid. (videojs)'); }

    return tag['player'] || new vjs.Player(tag, options, ready);
};

var videojs = vjs;
window.videojs = window.vjs = vjs;

vjs.CDN_VERSION = '4.4';
vjs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');


vjs.options = {
    'techOrder': ['html5', 'flash'],

    'html5': {},
    'flash': {},

    'width': 300,
    'height': 150,
    'defaultVolume': 0.00,
    'children': {
        'mediaLoader': {},
        'posterImage': {},
        'textTrackDisplay': {},
        'loadingSpinner': {},
        'bigPlayButton': {},
        'controlBar': {}
    },

    'notSupportedMessage': 'Sorry, no compatible source and playback ' +
        'technology were found for this video. Try using another browser ' +
        'like <a href="http://bit.ly/ccMUEC">Chrome</a> or download the ' +
        'latest <a href="http://adobe.ly/mwfN1">Adobe Flash Player</a>.'
};

if (vjs.CDN_VERSION !== 'GENERATED' + '_CDN_VSN') {
    videojs.options['flash']['swf'] = vjs.ACCESS_PROTOCOL + 'vjs.zencdn.net/' + vjs.CDN_VERSION + '/video-js.swf';
}


vjs.players = {};


if (typeof define === 'function' && define['amd']) {
    define([], function() { return videojs; });

} else if (typeof exports === 'object' && typeof module === 'object') {
    module['exports'] = videojs;
}

vjs.CoreObject = vjs['CoreObject'] = function() {};


vjs.CoreObject.extend = function(props) {
    var init, subObj;

    props = props || {};
    init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function() {};
    subObj = function() {
        init.apply(this, arguments);
    };

    subObj.prototype = vjs.obj.create(this.prototype);
    subObj.prototype.constructor = subObj;

    subObj.extend = vjs.CoreObject.extend;
    subObj.create = vjs.CoreObject.create;

    for (var name in props) {
        if (props.hasOwnProperty(name)) {
            subObj.prototype[name] = props[name];
        }
    }

    return subObj;
};


vjs.CoreObject.create = function() {
    var inst = vjs.obj.create(this.prototype);

    this.apply(inst, arguments);

    return inst;
};



vjs.on = function(elem, type, fn) {
    var data = vjs.getData(elem);

    if (!data.handlers) data.handlers = {};

    if (!data.handlers[type]) data.handlers[type] = [];

    if (!fn.guid) fn.guid = vjs.guid++;

    data.handlers[type].push(fn);

    if (!data.dispatcher) {
        data.disabled = false;

        data.dispatcher = function(event) {

            if (data.disabled) return;
            event = vjs.fixEvent(event);

            var handlers = data.handlers[event.type];

            if (handlers) {
                var handlersCopy = handlers.slice(0);

                for (var m = 0, n = handlersCopy.length; m < n; m++) {
                    if (event.isImmediatePropagationStopped()) {
                        break;
                    } else {
                        handlersCopy[m].call(elem, event);
                    }
                }
            }
        };
    }

    if (data.handlers[type].length == 1) {
        if (document.addEventListener) {
            elem.addEventListener(type, data.dispatcher, false);
        } else if (document.attachEvent) {
            elem.attachEvent('on' + type, data.dispatcher);
        }
    }
};


vjs.off = function(elem, type, fn) {
    if (!vjs.hasData(elem)) return;

    var data = vjs.getData(elem);

    if (!data.handlers) { return; }

    var removeType = function(t) {
        data.handlers[t] = [];
        vjs.cleanUpEvents(elem, t);
    };

    if (!type) {
        for (var t in data.handlers) removeType(t);
        return;
    }

    var handlers = data.handlers[type];

    if (!handlers) return;

    if (!fn) {
        removeType(type);
        return;
    }

    if (fn.guid) {
        for (var n = 0; n < handlers.length; n++) {
            if (handlers[n].guid === fn.guid) {
                handlers.splice(n--, 1);
            }
        }
    }

    vjs.cleanUpEvents(elem, type);
};


vjs.cleanUpEvents = function(elem, type) {
    var data = vjs.getData(elem);

    if (data.handlers[type].length === 0) {
        delete data.handlers[type];

        if (document.removeEventListener) {
            elem.removeEventListener(type, data.dispatcher, false);
        } else if (document.detachEvent) {
            elem.detachEvent('on' + type, data.dispatcher);
        }
    }

    if (vjs.isEmpty(data.handlers)) {
        delete data.handlers;
        delete data.dispatcher;
        delete data.disabled;

    }

    if (vjs.isEmpty(data)) {
        vjs.removeData(elem);
    }
};


vjs.fixEvent = function(event) {

    function returnTrue() { return true; }

    function returnFalse() { return false; }

    if (!event || !event.isPropagationStopped) {
        var old = event || window.event;

        event = {};
        for (var key in old) {
            if (key !== 'layerX' && key !== 'layerY' && key !== 'keyboardEvent.keyLocation') {
                if (!(key == 'returnValue' && old.preventDefault)) {
                    event[key] = old[key];
                }
            }
        }

        if (!event.target) {
            event.target = event.srcElement || document;
        }

        event.relatedTarget = event.fromElement === event.target ?
            event.toElement :
            event.fromElement;

        event.preventDefault = function() {
            if (old.preventDefault) {
                old.preventDefault();
            }
            event.returnValue = false;
            event.isDefaultPrevented = returnTrue;
        };

        event.isDefaultPrevented = returnFalse;

        event.stopPropagation = function() {
            if (old.stopPropagation) {
                old.stopPropagation();
            }
            event.cancelBubble = true;
            event.isPropagationStopped = returnTrue;
        };

        event.isPropagationStopped = returnFalse;

        event.stopImmediatePropagation = function() {
            if (old.stopImmediatePropagation) {
                old.stopImmediatePropagation();
            }
            event.isImmediatePropagationStopped = returnTrue;
            event.stopPropagation();
        };

        event.isImmediatePropagationStopped = returnFalse;

        if (event.clientX != null) {
            var doc = document.documentElement,
                body = document.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                (doc && doc.clientTop || body && body.clientTop || 0);
        }

        event.which = event.charCode || event.keyCode;

        if (event.button != null) {
            event.button = (event.button & 1 ? 0 :
                (event.button & 4 ? 1 :
                    (event.button & 2 ? 2 : 0)));
        }
    }

    return event;
};


vjs.trigger = function(elem, event) {
    var elemData = (vjs.hasData(elem)) ? vjs.getData(elem) : {};
    var parent = elem.parentNode || elem.ownerDocument;

    if (typeof event === 'string') {
        event = { type: event, target: elem };
    }
    event = vjs.fixEvent(event);

    if (elemData.dispatcher) {
        elemData.dispatcher.call(elem, event);
    }

    if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
        vjs.trigger(parent, event);

    } else if (!parent && !event.isDefaultPrevented()) {
        var targetData = vjs.getData(event.target);

        if (event.target[event.type]) {
            targetData.disabled = true;
            if (typeof event.target[event.type] === 'function') {
                event.target[event.type]();
            }
            targetData.disabled = false;
        }
    }

    return !event.isDefaultPrevented();



};


vjs.one = function(elem, type, fn) {
    var func = function() {
        vjs.off(elem, type, func);
        fn.apply(this, arguments);
    };
    func.guid = fn.guid = fn.guid || vjs.guid++;
    vjs.on(elem, type, func);
};
var hasOwnProp = Object.prototype.hasOwnProperty;


vjs.createEl = function(tagName, properties) {
    var el, propName;

    el = document.createElement(tagName || 'div');

    for (propName in properties) {
        if (hasOwnProp.call(properties, propName)) {


            if (propName.indexOf('aria-') !== -1 || propName == 'role') {
                el.setAttribute(propName, properties[propName]);
            } else {
                el[propName] = properties[propName];
            }
        }
    }
    return el;
};


vjs.capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};


vjs.obj = {};


vjs.obj.create = Object.create || function(obj) {
    function F() {}

    F.prototype = obj;

    return new F();
};


vjs.obj.each = function(obj, fn, context) {
    for (var key in obj) {
        if (hasOwnProp.call(obj, key)) {
            fn.call(context || this, key, obj[key]);
        }
    }
};


vjs.obj.merge = function(obj1, obj2) {
    if (!obj2) { return obj1; }
    for (var key in obj2) {
        if (hasOwnProp.call(obj2, key)) {
            obj1[key] = obj2[key];
        }
    }
    return obj1;
};


vjs.obj.deepMerge = function(obj1, obj2) {
    var key, val1, val2;

    obj1 = vjs.obj.copy(obj1);

    for (key in obj2) {
        if (hasOwnProp.call(obj2, key)) {
            val1 = obj1[key];
            val2 = obj2[key];

            if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
                obj1[key] = vjs.obj.deepMerge(val1, val2);
            } else {
                obj1[key] = obj2[key];
            }
        }
    }
    return obj1;
};


vjs.obj.copy = function(obj) {
    return vjs.obj.merge({}, obj);
};


vjs.obj.isPlain = function(obj) {
    return !!obj &&
        typeof obj === 'object' &&
        obj.toString() === '[object Object]' &&
        obj.constructor === Object;
};


vjs.bind = function(context, fn, uid) {
    if (!fn.guid) { fn.guid = vjs.guid++; }

    var ret = function() {
        return fn.apply(context, arguments);
    };

    ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

    return ret;
};


vjs.cache = {};


vjs.guid = 1;


vjs.expando = 'vdata' + (new Date()).getTime();


vjs.getData = function(el) {
    var id = el[vjs.expando];
    if (!id) {
        id = el[vjs.expando] = vjs.guid++;
        vjs.cache[id] = {};
    }
    return vjs.cache[id];
};


vjs.hasData = function(el) {
    var id = el[vjs.expando];
    return !(!id || vjs.isEmpty(vjs.cache[id]));
};


vjs.removeData = function(el) {
    var id = el[vjs.expando];
    if (!id) { return; }
    delete vjs.cache[id];

    try {
        delete el[vjs.expando];
    } catch (e) {
        if (el.removeAttribute) {
            el.removeAttribute(vjs.expando);
        } else {
            el[vjs.expando] = null;
        }
    }
};


vjs.isEmpty = function(obj) {
    for (var prop in obj) {
        if (obj[prop] !== null) {
            return false;
        }
    }
    return true;
};


vjs.addClass = function(element, classToAdd) {
    if ((' ' + element.className + ' ').indexOf(' ' + classToAdd + ' ') == -1) {
        element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
    }
};


vjs.removeClass = function(element, classToRemove) {
    var classNames, i;

    if (element.className.indexOf(classToRemove) == -1) { return; }

    classNames = element.className.split(' ');

    for (i = classNames.length - 1; i >= 0; i--) {
        if (classNames[i] === classToRemove) {
            classNames.splice(i, 1);
        }
    }

    element.className = classNames.join(' ');
};


vjs.TEST_VID = vjs.createEl('video');


vjs.USER_AGENT = navigator.userAgent;


vjs.IS_IPHONE = (/iPhone/i).test(vjs.USER_AGENT);
vjs.IS_IPAD = (/iPad/i).test(vjs.USER_AGENT);
vjs.IS_IPOD = (/iPod/i).test(vjs.USER_AGENT);
vjs.IS_IOS = vjs.IS_IPHONE || vjs.IS_IPAD || vjs.IS_IPOD;

vjs.IOS_VERSION = (function() {
    var match = vjs.USER_AGENT.match(/OS (\d+)_/i);
    if (match && match[1]) { return match[1]; }
})();

vjs.IS_ANDROID = (/Android/i).test(vjs.USER_AGENT);
vjs.ANDROID_VERSION = (function() {
    var match = vjs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
        major,
        minor;

    if (!match) {
        return null;
    }

    major = match[1] && parseFloat(match[1]);
    minor = match[2] && parseFloat(match[2]);

    if (major && minor) {
        return parseFloat(match[1] + '.' + match[2]);
    } else if (major) {
        return major;
    } else {
        return null;
    }
})();
vjs.IS_OLD_ANDROID = vjs.IS_ANDROID && (/webkit/i).test(vjs.USER_AGENT) && vjs.ANDROID_VERSION < 2.3;

vjs.IS_FIREFOX = (/Firefox/i).test(vjs.USER_AGENT);
vjs.IS_CHROME = (/Chrome/i).test(vjs.USER_AGENT);

vjs.TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);


vjs.getAttributeValues = function(tag) {
    var obj, knownBooleans, attrs, attrName, attrVal;

    obj = {};

    knownBooleans = ',' + 'autoplay,controls,loop,muted,default' + ',';

    if (tag && tag.attributes && tag.attributes.length > 0) {
        attrs = tag.attributes;

        for (var i = attrs.length - 1; i >= 0; i--) {
            attrName = attrs[i].name;
            attrVal = attrs[i].value;

            if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(',' + attrName + ',') !== -1) {
                attrVal = (attrVal !== null) ? true : false;
            }

            obj[attrName] = attrVal;
        }
    }

    return obj;
};


vjs.getComputedDimension = function(el, strCssRule) {
    var strValue = '';
    if (document.defaultView && document.defaultView.getComputedStyle) {
        strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

    } else if (el.currentStyle) {
        strValue = el['client' + strCssRule.substr(0, 1).toUpperCase() + strCssRule.substr(1)] + 'px';
    }
    return strValue;
};


vjs.insertFirst = function(child, parent) {
    if (parent.firstChild) {
        parent.insertBefore(child, parent.firstChild);
    } else {
        parent.appendChild(child);
    }
};


vjs.support = {};


vjs.el = function(id) {
    if (id.indexOf('#') === 0) {
        id = id.slice(1);
    }

    return document.getElementById(id);
};


vjs.formatTime = function(seconds, guide) {
    guide = guide || seconds;
    var s = Math.floor(seconds % 60),
        m = Math.floor(seconds / 60 % 60),
        h = Math.floor(seconds / 3600),
        gm = Math.floor(guide / 60 % 60),
        gh = Math.floor(guide / 3600);

    if (isNaN(seconds) || seconds === Infinity) {
        h = m = s = '-';
    }

    h = (h > 0 || gh > 0) ? h + ':' : '';

    m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

    s = (s < 10) ? '0' + s : s;

    return h + m + s;
};

vjs.blockTextSelection = function() {
    document.body.focus();
    document.onselectstart = function() { return false; };
};
vjs.unblockTextSelection = function() { document.onselectstart = function() { return true; }; };


vjs.trim = function(str) {
    return (str + '').replace(/^\s+|\s+$/g, '');
};


vjs.round = function(num, dec) {
    if (!dec) { dec = 0; }
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
};


vjs.createTimeRange = function(start, end) {
    return {
        length: 1,
        start: function() { return start; },
        end: function() { return end; }
    };
};


vjs.get = function(url, onSuccess, onError) {
    var local, request;

    if (typeof XMLHttpRequest === 'undefined') {
        window.XMLHttpRequest = function() {
            try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
            try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
            try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
            throw new Error('This browser does not support XMLHttpRequest.');
        };
    }

    request = new XMLHttpRequest();
    try {
        request.open('GET', url);
    } catch (e) {
        onError(e);
    }

    local = (url.indexOf('file:') === 0 || (window.location.href.indexOf('file:') === 0 && url.indexOf('http') === -1));

    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200 || local && request.status === 0) {
                onSuccess(request.responseText);
            } else {
                if (onError) {
                    onError();
                }
            }
        }
    };

    try {
        request.send();
    } catch (e) {
        if (onError) {
            onError(e);
        }
    }
};


vjs.setLocalStorage = function(key, value) {
    try {
        var localStorage = window.localStorage || false;
        if (!localStorage) { return; }
        localStorage[key] = value;
    } catch (e) {
        if (e.code == 22 || e.code == 1014) {
            vjs.log('LocalStorage Full (VideoJS)', e);
        } else {
            if (e.code == 18) {
                vjs.log('LocalStorage not allowed (VideoJS)', e);
            } else {
                vjs.log('LocalStorage Error (VideoJS)', e);
            }
        }
    }
};


vjs.getAbsoluteURL = function(url) {

    if (!url.match(/^https?:\/\//)) {
        url = vjs.createEl('div', {
            innerHTML: '<a href="' + url + '">x</a>'
        }).firstChild.href;
    }

    return url;
};

vjs.log = function() {
    vjs.log.history = vjs.log.history || [];
    vjs.log.history.push(arguments);
    if (window.console) {
        window.console.log(Array.prototype.slice.call(arguments));
    }
};

vjs.findPosition = function(el) {
    var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;

    if (el.getBoundingClientRect && el.parentNode) {
        box = el.getBoundingClientRect();
    }

    if (!box) {
        return {
            left: 0,
            top: 0
        };
    }

    docEl = document.documentElement;
    body = document.body;

    clientLeft = docEl.clientLeft || body.clientLeft || 0;
    scrollLeft = window.pageXOffset || body.scrollLeft;
    left = box.left + scrollLeft - clientLeft;

    clientTop = docEl.clientTop || body.clientTop || 0;
    scrollTop = window.pageYOffset || body.scrollTop;
    top = box.top + scrollTop - clientTop;

    return {
        left: left,
        top: top
    };
};

vjs.util = {};


vjs.util.mergeOptions = function(obj1, obj2) {
    var key, val1, val2;

    obj1 = vjs.obj.copy(obj1);

    for (key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            val1 = obj1[key];
            val2 = obj2[key];

            if (vjs.obj.isPlain(val1) && vjs.obj.isPlain(val2)) {
                obj1[key] = vjs.util.mergeOptions(val1, val2);
            } else {
                obj1[key] = obj2[key];
            }
        }
    }
    return obj1;
};





vjs.Component = vjs.CoreObject.extend({

    init: function(player, options, ready) {
        this.player_ = player;

        this.options_ = vjs.obj.copy(this.options_);

        options = this.options(options);

        this.id_ = options['id'] || ((options['el'] && options['el']['id']) ? options['el']['id'] : player.id() + '_component_' + vjs.guid++);

        this.name_ = options['name'] || null;

        this.el_ = options['el'] || this.createEl();

        this.children_ = [];
        this.childIndex_ = {};
        this.childNameIndex_ = {};

        this.initChildren();

        this.ready(ready);

        if (options.reportTouchActivity !== false) {
            this.enableTouchActivity();
        }
    }
});


vjs.Component.prototype.dispose = function() {
    this.trigger({ type: 'dispose', 'bubbles': false });

    if (this.children_) {
        for (var i = this.children_.length - 1; i >= 0; i--) {
            if (this.children_[i].dispose) {
                this.children_[i].dispose();
            }
        }
    }

    this.children_ = null;
    this.childIndex_ = null;
    this.childNameIndex_ = null;

    this.off();

    if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_);
    }

    vjs.removeData(this.el_);
    this.el_ = null;
};


vjs.Component.prototype.player_ = true;


vjs.Component.prototype.player = function() {
    return this.player_;
};


vjs.Component.prototype.options_;


vjs.Component.prototype.options = function(obj) {
    if (obj === undefined) return this.options_;

    return this.options_ = vjs.util.mergeOptions(this.options_, obj);
};


vjs.Component.prototype.el_;


vjs.Component.prototype.createEl = function(tagName, attributes) {
    return vjs.createEl(tagName, attributes);
};


vjs.Component.prototype.el = function() {
    return this.el_;
};


vjs.Component.prototype.contentEl_;


vjs.Component.prototype.contentEl = function() {
    return this.contentEl_ || this.el_;
};


vjs.Component.prototype.id_;


vjs.Component.prototype.id = function() {
    return this.id_;
};


vjs.Component.prototype.name_;


vjs.Component.prototype.name = function() {
    return this.name_;
};


vjs.Component.prototype.children_;


vjs.Component.prototype.children = function() {
    return this.children_;
};


vjs.Component.prototype.childIndex_;


vjs.Component.prototype.getChildById = function(id) {
    return this.childIndex_[id];
};


vjs.Component.prototype.childNameIndex_;


vjs.Component.prototype.getChild = function(name) {
    return this.childNameIndex_[name];
};


vjs.Component.prototype.addChild = function(child, options) {
    var component, componentClass, componentName, componentId;

    if (typeof child === 'string') {

        componentName = child;

        options = options || {};

        componentClass = options['componentClass'] || vjs.capitalize(componentName);

        options['name'] = componentName;

        component = new window['videojs'][componentClass](this.player_ || this, options);

    } else {
        component = child;
    }

    this.children_.push(component);

    if (typeof component.id === 'function') {
        this.childIndex_[component.id()] = component;
    }

    componentName = componentName || (component.name && component.name());

    if (componentName) {
        this.childNameIndex_[componentName] = component;
    }

    if (typeof component['el'] === 'function' && component['el']()) {
        this.contentEl().appendChild(component['el']());
    }

    return component;
};


vjs.Component.prototype.removeChild = function(component) {
    if (typeof component === 'string') {
        component = this.getChild(component);
    }

    if (!component || !this.children_) return;

    var childFound = false;
    for (var i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i] === component) {
            childFound = true;
            this.children_.splice(i, 1);
            break;
        }
    }

    if (!childFound) return;

    this.childIndex_[component.id] = null;
    this.childNameIndex_[component.name] = null;

    var compEl = component.el();
    if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el());
    }
};


vjs.Component.prototype.initChildren = function() {
    var options = this.options_;

    if (options && options['children']) {
        var self = this;

        vjs.obj.each(options['children'], function(name, opts) {
            if (opts === false) return;

            var tempAdd = function() {
                self[name] = self.addChild(name, opts);
            };

            if (opts['loadEvent']) {} else {
                tempAdd();
            }
        });
    }
};


vjs.Component.prototype.buildCSSClass = function() {
    return '';
};




vjs.Component.prototype.on = function(type, fn) {
    vjs.on(this.el_, type, vjs.bind(this, fn));
    return this;
};


vjs.Component.prototype.off = function(type, fn) {
    vjs.off(this.el_, type, fn);
    return this;
};


vjs.Component.prototype.one = function(type, fn) {
    vjs.one(this.el_, type, vjs.bind(this, fn));
    return this;
};


vjs.Component.prototype.trigger = function(type, event) {
    vjs.trigger(this.el_, type, event);
    return this;
};



vjs.Component.prototype.isReady_;


vjs.Component.prototype.isReadyOnInitFinish_ = true;


vjs.Component.prototype.readyQueue_;


vjs.Component.prototype.ready = function(fn) {
    if (fn) {
        if (this.isReady_) {
            fn.call(this);
        } else {
            if (this.readyQueue_ === undefined) {
                this.readyQueue_ = [];
            }
            this.readyQueue_.push(fn);
        }
    }
    return this;
};


vjs.Component.prototype.triggerReady = function() {
    this.isReady_ = true;

    var readyQueue = this.readyQueue_;

    if (readyQueue && readyQueue.length > 0) {

        for (var i = 0, j = readyQueue.length; i < j; i++) {
            readyQueue[i].call(this);
        }

        this.readyQueue_ = [];

        this.trigger('ready');
    }
};




vjs.Component.prototype.addClass = function(classToAdd) {
    vjs.addClass(this.el_, classToAdd);
    return this;
};


vjs.Component.prototype.removeClass = function(classToRemove) {
    vjs.removeClass(this.el_, classToRemove);
    return this;
};


vjs.Component.prototype.show = function() {
    this.el_.style.display = 'block';
    return this;
};


vjs.Component.prototype.hide = function() {
    this.el_.style.display = 'none';
    return this;
};


vjs.Component.prototype.lockShowing = function() {
    this.addClass('vjs-lock-showing');
    return this;
};


vjs.Component.prototype.unlockShowing = function() {
    this.removeClass('vjs-lock-showing');
    return this;
};


vjs.Component.prototype.disable = function() {
    this.hide();
    this.show = function() {};
};


vjs.Component.prototype.width = function(num, skipListeners) {
    return this.dimension('width', num, skipListeners);
};


vjs.Component.prototype.height = function(num, skipListeners) {
    return this.dimension('height', num, skipListeners);
};


vjs.Component.prototype.dimensions = function(width, height) {
    return this.width(width, true).height(height);
};


vjs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners) {
    if (num !== undefined) {

        if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
            this.el_.style[widthOrHeight] = num;
        } else if (num === 'auto') {
            this.el_.style[widthOrHeight] = '';
        } else {
            this.el_.style[widthOrHeight] = num + 'px';
        }

        if (!skipListeners) { this.trigger('resize'); }

        return this;
    }

    if (!this.el_) return 0;

    var val = this.el_.style[widthOrHeight];
    var pxIndex = val.indexOf('px');
    if (pxIndex !== -1) {
        return parseInt(val.slice(0, pxIndex), 10);

    } else {

        return parseInt(this.el_['offset' + vjs.capitalize(widthOrHeight)], 10);


    }
};


vjs.Component.prototype.onResize;


vjs.Component.prototype.emitTapEvents = function() {
    var touchStart, touchTime, couldBeTap, noTap;

    touchStart = 0;

    this.on('touchstart', function(event) {
        touchStart = new Date().getTime();
        couldBeTap = true;
    });

    noTap = function() {
        couldBeTap = false;
    };
    this.on('touchmove', noTap);
    this.on('touchleave', noTap);
    this.on('touchcancel', noTap);

    this.on('touchend', function(event) {
        if (couldBeTap === true) {
            touchTime = new Date().getTime() - touchStart;
            if (touchTime < 250) {
                this.trigger('tap');
            }
        }
    });
};


vjs.Component.prototype.enableTouchActivity = function() {
    var report, touchHolding, touchEnd;

    report = vjs.bind(this.player(), this.player().reportUserActivity);

    this.on('touchstart', function() {
        report();
        clearInterval(touchHolding);
        touchHolding = setInterval(report, 250);
    });

    touchEnd = function(event) {
        report();
        clearInterval(touchHolding);
    };

    this.on('touchmove', report);
    this.on('touchend', touchEnd);
    this.on('touchcancel', touchEnd);
};



vjs.Button = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        var touchstart = false;
        this.on('touchstart', function(event) {
            event.preventDefault();
            touchstart = true;
        });
        this.on('touchmove', function() {
            touchstart = false;
        });
        var self = this;
        this.on('touchend', function(event) {
            if (touchstart) {
                self.onClick(event);
            }
            event.preventDefault();
        });

        this.on('click', this.onClick);
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
    }
});

vjs.Button.prototype.createEl = function(type, props) {
    props = vjs.obj.merge({
        className: this.buildCSSClass(),
        innerHTML: '<div class="vjs-control-content"><span class="vjs-control-text">' + (this.buttonText || 'Need Text') + '</span></div>',
        'role': 'button',
        'aria-live': 'polite',
        tabIndex: 0
    }, props);

    return vjs.Component.prototype.createEl.call(this, type, props);
};

vjs.Button.prototype.buildCSSClass = function() {
    return 'vjs-control ' + vjs.Component.prototype.buildCSSClass.call(this);
};

vjs.Button.prototype.onClick = function() {};

vjs.Button.prototype.onFocus = function() {
    vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

vjs.Button.prototype.onKeyPress = function(event) {
    if (event.which == 32 || event.which == 13) {
        event.preventDefault();
        this.onClick();
    }
};

vjs.Button.prototype.onBlur = function() {
    vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};


vjs.Slider = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        this.bar = this.getChild(this.options_['barName']);
        this.handle = this.getChild(this.options_['handleName']);

        player.on(this.playerEvent, vjs.bind(this, this.update));

        this.on('mousedown', this.onMouseDown);
        this.on('touchstart', this.onMouseDown);
        this.on('focus', this.onFocus);
        this.on('blur', this.onBlur);
        this.on('click', this.onClick);

        this.player_.on('controlsvisible', vjs.bind(this, this.update));


        player.ready(vjs.bind(this, this.update));

        this.boundEvents = {};
    }
});

vjs.Slider.prototype.createEl = function(type, props) {
    props = props || {};
    props.className = props.className + ' vjs-slider';
    props = vjs.obj.merge({
        'role': 'slider',
        'aria-valuenow': 0,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        tabIndex: 0
    }, props);

    return vjs.Component.prototype.createEl.call(this, type, props);
};

vjs.Slider.prototype.onMouseDown = function(event) {
    event.preventDefault();
    vjs.blockTextSelection();

    this.boundEvents.move = vjs.bind(this, this.onMouseMove);
    this.boundEvents.end = vjs.bind(this, this.onMouseUp);

    vjs.on(document, 'mousemove', this.boundEvents.move);
    vjs.on(document, 'mouseup', this.boundEvents.end);
    vjs.on(document, 'touchmove', this.boundEvents.move);
    vjs.on(document, 'touchend', this.boundEvents.end);

    this.onMouseMove(event);
};

vjs.Slider.prototype.onMouseUp = function() {
    vjs.unblockTextSelection();
    vjs.off(document, 'mousemove', this.boundEvents.move, false);
    vjs.off(document, 'mouseup', this.boundEvents.end, false);
    vjs.off(document, 'touchmove', this.boundEvents.move, false);
    vjs.off(document, 'touchend', this.boundEvents.end, false);

    this.update();
};

vjs.Slider.prototype.update = function() {
    if (!this.el_) return;


    var barProgress,
        progress = this.getPercent(),
        handle = this.handle,
        bar = this.bar;

    if (isNaN(progress)) { progress = 0; }

    barProgress = progress;

    if (handle) {

        var box = this.el_,
            boxWidth = box.offsetWidth,

            handleWidth = handle.el().offsetWidth,

            handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

            boxAdjustedPercent = 1 - handlePercent,

            adjustedProgress = progress * boxAdjustedPercent;

        barProgress = adjustedProgress + (handlePercent / 2);

        handle.el().style.left = vjs.round(adjustedProgress * 100, 2) + '%';
    }

    bar.el().style.width = vjs.round(barProgress * 100, 2) + '%';
};

vjs.Slider.prototype.calculateDistance = function(event) {
    var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;

    el = this.el_;
    box = vjs.findPosition(el);
    boxW = boxH = el.offsetWidth;
    handle = this.handle;

    if (this.options_.vertical) {
        boxY = box.top;

        if (event.changedTouches) {
            pageY = event.changedTouches[0].pageY;
        } else {
            pageY = event.pageY;
        }

        if (handle) {
            var handleH = handle.el().offsetHeight;
            boxY = boxY + (handleH / 2);
            boxH = boxH - handleH;
        }

        return Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));

    } else {
        boxX = box.left;

        if (event.changedTouches) {
            pageX = event.changedTouches[0].pageX;
        } else {
            pageX = event.pageX;
        }

        if (handle) {
            var handleW = handle.el().offsetWidth;

            boxX = boxX + (handleW / 2);
            boxW = boxW - handleW;
        }

        return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
    }
};

vjs.Slider.prototype.onFocus = function() {
    vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

vjs.Slider.prototype.onKeyPress = function(event) {
    if (event.which == 37) {
        event.preventDefault();
        this.stepBack();
    } else if (event.which == 39) {
        event.preventDefault();
        this.stepForward();
    }
};

vjs.Slider.prototype.onBlur = function() {
    vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};


vjs.Slider.prototype.onClick = function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();
};


vjs.SliderHandle = vjs.Component.extend();


vjs.SliderHandle.prototype.defaultValue = 0;


vjs.SliderHandle.prototype.createEl = function(type, props) {
    props = props || {};
    props.className = props.className + ' vjs-slider-handle';
    props = vjs.obj.merge({
        innerHTML: '<span class="vjs-control-text">' + this.defaultValue + '</span>'
    }, props);

    return vjs.Component.prototype.createEl.call(this, 'div', props);
};


vjs.Menu = vjs.Component.extend();


vjs.Menu.prototype.addItem = function(component) {
    this.addChild(component);
    component.on('click', vjs.bind(this, function() {
        this.unlockShowing();
    }));
};


vjs.Menu.prototype.createEl = function() {
    var contentElType = this.options().contentElType || 'ul';
    this.contentEl_ = vjs.createEl(contentElType, {
        className: 'vjs-menu-content'
    });
    var el = vjs.Component.prototype.createEl.call(this, 'div', {
        append: this.contentEl_,
        className: 'vjs-menu'
    });
    el.appendChild(this.contentEl_);

    vjs.on(el, 'click', function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    });

    return el;
};


vjs.MenuItem = vjs.Button.extend({

    init: function(player, options) {
        vjs.Button.call(this, player, options);
        this.selected(options['selected']);
    }
});


vjs.MenuItem.prototype.createEl = function(type, props) {
    return vjs.Button.prototype.createEl.call(this, 'li', vjs.obj.merge({
        className: 'vjs-menu-item',
        innerHTML: this.options_['label']
    }, props));
};


vjs.MenuItem.prototype.onClick = function() {
    this.selected(true);
};


vjs.MenuItem.prototype.selected = function(selected) {
    if (selected) {
        this.addClass('vjs-selected');
        this.el_.setAttribute('aria-selected', true);
    } else {
        this.removeClass('vjs-selected');
        this.el_.setAttribute('aria-selected', false);
    }
};



vjs.MenuButton = vjs.Button.extend({

    init: function(player, options) {
        vjs.Button.call(this, player, options);

        this.menu = this.createMenu();

        this.addChild(this.menu);

        if (this.items && this.items.length === 0) {
            this.hide();
        }

        this.on('keyup', this.onKeyPress);
        this.el_.setAttribute('aria-haspopup', true);
        this.el_.setAttribute('role', 'button');
    }
});


vjs.MenuButton.prototype.buttonPressed_ = false;

vjs.MenuButton.prototype.createMenu = function() {
    var menu = new vjs.Menu(this.player_);

    if (this.options().title) {
        menu.el().appendChild(vjs.createEl('li', {
            className: 'vjs-menu-title',
            innerHTML: vjs.capitalize(this.kind_),
            tabindex: -1
        }));
    }

    this.items = this['createItems']();

    if (this.items) {
        for (var i = 0; i < this.items.length; i++) {
            menu.addItem(this.items[i]);
        }
    }

    return menu;
};


vjs.MenuButton.prototype.createItems = function() {};


vjs.MenuButton.prototype.buildCSSClass = function() {
    return this.className + ' vjs-menu-button ' + vjs.Button.prototype.buildCSSClass.call(this);
};

vjs.MenuButton.prototype.onFocus = function() {};
vjs.MenuButton.prototype.onBlur = function() {};

vjs.MenuButton.prototype.onClick = function() {
    this.one('mouseout', vjs.bind(this, function() {
        this.menu.unlockShowing();
        this.el_.blur();
    }));
    if (this.buttonPressed_) {
        this.unpressButton();
    } else {
        this.pressButton();
    }
};

vjs.MenuButton.prototype.onKeyPress = function(event) {
    event.preventDefault();

    if (event.which == 32 || event.which == 13) {
        if (this.buttonPressed_) {
            this.unpressButton();
        } else {
            this.pressButton();
        }
    } else if (event.which == 27) {
        if (this.buttonPressed_) {
            this.unpressButton();
        }
    }
};

vjs.MenuButton.prototype.pressButton = function() {
    this.buttonPressed_ = true;
    this.menu.lockShowing();
    this.el_.setAttribute('aria-pressed', true);
    if (this.items && this.items.length > 0) {
        this.items[0].el().focus();
    }
};

vjs.MenuButton.prototype.unpressButton = function() {
    this.buttonPressed_ = false;
    this.menu.unlockShowing();
    this.el_.setAttribute('aria-pressed', false);
};


vjs.Player = vjs.Component.extend({


    init: function(tag, options, ready) {
        this.tag = tag;
        tag.id = tag.id || 'vjs_video_' + vjs.guid++;

        options = vjs.obj.merge(this.getTagSettings(tag), options);

        this.cache_ = {};

        this.poster_ = options['poster'];
        this.controls_ = options['controls'];
        tag.controls = false;

        options.reportTouchActivity = false;

        vjs.Component.call(this, this, options, ready);

        if (this.controls()) {
            this.addClass('vjs-controls-enabled');
        } else {
            this.addClass('vjs-controls-disabled');
        }


        this.one('play', function(e) {
            var fpEvent = { type: 'firstplay', target: this.el_ };
            var keepGoing = vjs.trigger(this.el_, fpEvent);

            if (!keepGoing) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        });

        this.on('ended', this.onEnded);
        this.on('play', this.onPlay);
        this.on('firstplay', this.onFirstPlay);
        this.on('pause', this.onPause);
        this.on('progress', this.onProgress);
        this.on('durationchange', this.onDurationChange);
        this.on('error', this.onError);
        this.on('fullscreenchange', this.onFullscreenChange);

        vjs.players[this.id_] = this;

        if (options['plugins']) {
            vjs.obj.each(options['plugins'], function(key, val) {
                this[key](val);
            }, this);
        }

        this.listenForUserActivity();
    }
});


vjs.Player.prototype.options_ = vjs.options;


vjs.Player.prototype.dispose = function() {
    this.trigger('dispose');
    this.off('dispose');

    vjs.players[this.id_] = null;
    if (this.tag && this.tag['player']) { this.tag['player'] = null; }
    if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

    this.stopTrackingProgress();
    this.stopTrackingCurrentTime();

    if (this.tech) { this.tech.dispose(); }

    vjs.Component.prototype.dispose.call(this);
};

vjs.Player.prototype.getTagSettings = function(tag) {
    var options = {
        'sources': [],
        'tracks': []
    };

    vjs.obj.merge(options, vjs.getAttributeValues(tag));

    if (tag.hasChildNodes()) {
        var children, child, childName, i, j;

        children = tag.childNodes;

        for (i = 0, j = children.length; i < j; i++) {
            child = children[i];
            childName = child.nodeName.toLowerCase();
            if (childName === 'source') {
                options['sources'].push(vjs.getAttributeValues(child));
            } else if (childName === 'track') {
                options['tracks'].push(vjs.getAttributeValues(child));
            }
        }
    }

    return options;
};

vjs.Player.prototype.createEl = function() {
    var el = this.el_ = vjs.Component.prototype.createEl.call(this, 'div');
    var tag = this.tag;

    tag.removeAttribute('width');
    tag.removeAttribute('height');
    if (tag.hasChildNodes()) {
        var nodes, nodesLength, i, node, nodeName, removeNodes;

        nodes = tag.childNodes;
        nodesLength = nodes.length;
        removeNodes = [];

        while (nodesLength--) {
            node = nodes[nodesLength];
            nodeName = node.nodeName.toLowerCase();
            if (nodeName === 'track') {
                removeNodes.push(node);
            }
        }

        for (i = 0; i < removeNodes.length; i++) {
            tag.removeChild(removeNodes[i]);
        }
    }

    el.id = tag.id;
    el.className = tag.className;

    tag.id += '_html5_api';
    tag.className = 'vjs-tech';

    tag['player'] = el['player'] = this;
    this.addClass('vjs-paused');

    this.width(this.options_['width'], true);
    this.height(this.options_['height'], true);

    if (tag.parentNode) {
        tag.parentNode.insertBefore(el, tag);
    }
    vjs.insertFirst(tag, el);
    return el;
};

vjs.Player.prototype.loadTech = function(techName, source) {

    if (this.tech) {
        this.unloadTech();
    }

    if (techName !== 'Html5' && this.tag) {
        vjs.Html5.disposeMediaElement(this.tag);
        this.tag = null;
    }

    this.techName = techName;

    this.isReady_ = false;

    var techReady = function() {
        this.player_.triggerReady();

        if (!this.features['progressEvents']) {
            this.player_.manualProgressOn();
        }

        if (!this.features['timeupdateEvents']) {
            this.player_.manualTimeUpdatesOn();
        }
    };

    var techOptions = vjs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

    if (source) {
        if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
            techOptions['startTime'] = this.cache_.currentTime;
        }

        this.cache_.src = source.src;
    }

    this.tech = new window['videojs'][techName](this, techOptions);

    this.tech.ready(techReady);
};

vjs.Player.prototype.unloadTech = function() {
    this.isReady_ = false;
    this.tech.dispose();

    if (this.manualProgress) { this.manualProgressOff(); }

    if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

    this.tech = false;
};



vjs.Player.prototype.manualProgressOn = function() {
    this.manualProgress = true;

    this.trackProgress();

    this.tech.one('progress', function() {

        this.features['progressEvents'] = true;

        this.player_.manualProgressOff();
    });
};

vjs.Player.prototype.manualProgressOff = function() {
    this.manualProgress = false;
    this.stopTrackingProgress();
};

vjs.Player.prototype.trackProgress = function() {

    this.progressInterval = setInterval(vjs.bind(this, function() {

        if (this.cache_.bufferEnd < this.buffered().end(0)) {
            this.trigger('progress');
        } else if (this.bufferedPercent() == 1) {
            this.stopTrackingProgress();
            this.trigger('progress');
        }
    }), 500);
};
vjs.Player.prototype.stopTrackingProgress = function() { clearInterval(this.progressInterval); };


vjs.Player.prototype.manualTimeUpdatesOn = function() {
    this.manualTimeUpdates = true;

    this.on('play', this.trackCurrentTime);
    this.on('pause', this.stopTrackingCurrentTime);

    this.tech.one('timeupdate', function() {
        this.features['timeupdateEvents'] = true;
        this.player_.manualTimeUpdatesOff();
    });
};

vjs.Player.prototype.manualTimeUpdatesOff = function() {
    this.manualTimeUpdates = false;
    this.stopTrackingCurrentTime();
    this.off('play', this.trackCurrentTime);
    this.off('pause', this.stopTrackingCurrentTime);
};

vjs.Player.prototype.trackCurrentTime = function() {
    if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
    this.currentTimeInterval = setInterval(vjs.bind(this, function() {
        this.trigger('timeupdate');
    }), 250);
};

vjs.Player.prototype.stopTrackingCurrentTime = function() { clearInterval(this.currentTimeInterval); };



vjs.Player.prototype.onLoadStart;


vjs.Player.prototype.onLoadedMetaData;


vjs.Player.prototype.onLoadedData;


vjs.Player.prototype.onLoadedAllData;


vjs.Player.prototype.onPlay = function() {
    vjs.removeClass(this.el_, 'vjs-paused');
    vjs.addClass(this.el_, 'vjs-playing');
};


vjs.Player.prototype.onFirstPlay = function() {
    if (this.options_['starttime']) {
        this.currentTime(this.options_['starttime']);
    }

    this.addClass('vjs-has-started');
};


vjs.Player.prototype.onPause = function() {
    vjs.removeClass(this.el_, 'vjs-playing');
    vjs.addClass(this.el_, 'vjs-paused');
};


vjs.Player.prototype.onTimeUpdate;


vjs.Player.prototype.onProgress = function() {
    if (this.bufferedPercent() == 1) {
        this.trigger('loadedalldata');
    }
};


vjs.Player.prototype.onEnded = function() {
    if (this.options_['loop']) {
        this.currentTime(0);
        this.play();
    }
};


vjs.Player.prototype.onDurationChange = function() {
    var duration = this.techGet('duration');
    if (duration) {
        this.duration(duration);
    }
};


vjs.Player.prototype.onVolumeChange;


vjs.Player.prototype.onFullscreenChange = function() {
    if (this.isFullScreen()) {
        this.addClass('vjs-fullscreen');
    } else {
        this.removeClass('vjs-fullscreen');
    }
};


vjs.Player.prototype.onError = function(e) {
    vjs.log('Video Error', e);
};



vjs.Player.prototype.cache_;

vjs.Player.prototype.getCache = function() {
    return this.cache_;
};

vjs.Player.prototype.techCall = function(method, arg) {
    if (this.tech && !this.tech.isReady_) {
        this.tech.ready(function() {
            this[method](arg);
        });

    } else {
        try {
            this.tech[method](arg);
        } catch (e) {
            vjs.log(e);
            throw e;
        }
    }
};

vjs.Player.prototype.techGet = function(method) {

    if (this.tech && this.tech.isReady_) {

        try {
            return this.tech[method]();
        } catch (e) {
            if (this.tech[method] === undefined) {
                vjs.log('Video.js: ' + method + ' method not defined for ' + this.techName + ' playback technology.', e);
            } else {
                if (e.name == 'TypeError') {
                    vjs.log('Video.js: ' + method + ' unavailable on ' + this.techName + ' playback technology element.', e);
                    this.tech.isReady_ = false;
                } else {
                    vjs.log(e);
                }
            }
            throw e;
        }
    }

    return;
};


vjs.Player.prototype.play = function() {
    this.techCall('play');
    return this;
};


vjs.Player.prototype.pause = function() {
    this.techCall('pause');
    return this;
};


vjs.Player.prototype.paused = function() {
    return (this.techGet('paused') === false) ? false : true;
};


vjs.Player.prototype.currentTime = function(seconds) {
    if (seconds !== undefined) {

        this.techCall('setCurrentTime', seconds);

        if (this.manualTimeUpdates) { this.trigger('timeupdate'); }

        return this;
    }

    return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};


vjs.Player.prototype.duration = function(seconds) {
    if (seconds !== undefined) {

        this.cache_.duration = parseFloat(seconds);

        return this;
    }

    if (this.cache_.duration === undefined) {
        this.onDurationChange();
    }

    return this.cache_.duration || 0;
};

vjs.Player.prototype.remainingTime = function() {
    return this.duration() - this.currentTime();
};



vjs.Player.prototype.buffered = function() {
    var buffered = this.techGet('buffered'),
        start = 0,
        buflast = 3,
        end = this.cache_.bufferEnd = this.cache_.bufferEnd || 0;

    if (buffered && buflast >= 0 && buffered.end(buflast) !== end) {
        end = buffered.end(buflast);
        this.cache_.bufferEnd = end;
    }

    return vjs.createTimeRange(start, end);
};


vjs.Player.prototype.bufferedPercent = function() {
    return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
};


vjs.Player.prototype.volume = function(percentAsDecimal) {
    var vol;

    if (percentAsDecimal !== undefined) {
        vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
        this.cache_.volume = vol;
        this.techCall('setVolume', vol);
        vjs.setLocalStorage('volume', vol);
        return this;
    }

    vol = parseFloat(this.techGet('volume'));
    return (isNaN(vol)) ? 1 : vol;
};



vjs.Player.prototype.muted = function(muted) {
    if (muted !== undefined) {
        this.techCall('setMuted', muted);
        return this;
    }
    return this.techGet('muted') || false;
};

vjs.Player.prototype.supportsFullScreen = function() {
    return this.techGet('supportsFullScreen') || false;
};


vjs.Player.prototype.isFullScreen_ = false;


vjs.Player.prototype.isFullScreen = function(isFS) {
    if (isFS !== undefined) {
        this.isFullScreen_ = isFS;
        return this;
    }
    return this.isFullScreen_;
};


vjs.Player.prototype.requestFullScreen = function() {
    var requestFullScreen = vjs.support.requestFullScreen;
    this.isFullScreen(true);

    if (requestFullScreen) {

        vjs.on(document, requestFullScreen.eventName, vjs.bind(this, function(e) {
            this.isFullScreen(document[requestFullScreen.isFullScreen]);

            if (this.isFullScreen() === false) {
                vjs.off(document, requestFullScreen.eventName, arguments.callee);
            }

            this.trigger('fullscreenchange');
        }));

        this.el_[requestFullScreen.requestFn]();

    } else if (this.tech.supportsFullScreen()) {
        this.techCall('enterFullScreen');
    } else {
        this.enterFullWindow();
        this.trigger('fullscreenchange');
    }

    return this;
};


vjs.Player.prototype.cancelFullScreen = function() {
    var requestFullScreen = vjs.support.requestFullScreen;
    this.isFullScreen(false);

    if (requestFullScreen) {
        document[requestFullScreen.cancelFn]();
    } else if (this.tech.supportsFullScreen()) {
        this.techCall('exitFullScreen');
    } else {
        this.exitFullWindow();
        this.trigger('fullscreenchange');
    }

    return this;
};

vjs.Player.prototype.enterFullWindow = function() {
    this.isFullWindow = true;

    this.docOrigOverflow = document.documentElement.style.overflow;

    vjs.on(document, 'keydown', vjs.bind(this, this.fullWindowOnEscKey));

    document.documentElement.style.overflow = 'hidden';

    vjs.addClass(document.body, 'vjs-full-window');

    this.trigger('enterFullWindow');
};
vjs.Player.prototype.fullWindowOnEscKey = function(event) {
    if (event.keyCode === 27) {
        if (this.isFullScreen() === true) {
            this.cancelFullScreen();
        } else {
            this.exitFullWindow();
        }
    }
};

vjs.Player.prototype.exitFullWindow = function() {
    this.isFullWindow = false;
    vjs.off(document, 'keydown', this.fullWindowOnEscKey);

    document.documentElement.style.overflow = this.docOrigOverflow;

    vjs.removeClass(document.body, 'vjs-full-window');

    this.trigger('exitFullWindow');
};

vjs.Player.prototype.selectSource = function(sources) {

    for (var i = 0, j = this.options_['techOrder']; i < j.length; i++) {
        var techName = vjs.capitalize(j[i]),
            tech = window['videojs'][techName];

        if (tech.isSupported()) {
            for (var a = 0, b = sources; a < b.length; a++) {
                var source = b[a];

                if (tech['canPlaySource'](source)) {
                    return { source: source, tech: techName };
                }
            }
        }
    }

    return false;
};


vjs.Player.prototype.src = function(source) {
    if (source instanceof Array) {

        var sourceTech = this.selectSource(source),
            techName;

        if (sourceTech) {
            source = sourceTech.source;
            techName = sourceTech.tech;

            if (techName == this.techName) {
                this.src(source);
            } else {
                this.loadTech(techName, source);
            }
        } else {
            this.el_.appendChild(vjs.createEl('p', {
                innerHTML: this.options()['notSupportedMessage']
            }));
        }

    } else if (source instanceof Object) {

        if (window['videojs'][this.techName]['canPlaySource'](source)) {
            this.src(source.src);
        } else {
            this.src([source]);
        }

    } else {
        this.cache_.src = source;

        if (!this.isReady_) {
            this.ready(function() {
                this.src(source);
            });
        } else {
            this.techCall('src', source);
            if (this.options_['preload'] == 'auto') {
                this.load();
            }
            if (this.options_['autoplay']) {
                this.play();
            }
        }
    }
    return this;
};

vjs.Player.prototype.load = function() {
    this.techCall('load');
    return this;
};

vjs.Player.prototype.currentSrc = function() {
    return this.techGet('currentSrc') || this.cache_.src || '';
};

vjs.Player.prototype.preload = function(value) {
    if (value !== undefined) {
        this.techCall('setPreload', value);
        this.options_['preload'] = value;
        return this;
    }
    return this.techGet('preload');
};
vjs.Player.prototype.autoplay = function(value) {
    if (value !== undefined) {
        this.techCall('setAutoplay', value);
        this.options_['autoplay'] = value;
        return this;
    }
    return this.techGet('autoplay', value);
};
vjs.Player.prototype.loop = function(value) {
    if (value !== undefined) {
        this.techCall('setLoop', value);
        this.options_['loop'] = value;
        return this;
    }
    return this.techGet('loop');
};


vjs.Player.prototype.poster_;


vjs.Player.prototype.poster = function(src) {
    if (src === undefined) {
        return this.poster_;
    }

    this.poster_ = src;

    this.techCall('setPoster', src);

    this.trigger('posterchange');
};


vjs.Player.prototype.controls_;


vjs.Player.prototype.controls = function(bool) {
    if (bool !== undefined) {
        bool = !!bool;
        if (this.controls_ !== bool) {
            this.controls_ = bool;
            if (bool) {
                this.removeClass('vjs-controls-disabled');
                this.addClass('vjs-controls-enabled');
                this.trigger('controlsenabled');
            } else {
                this.removeClass('vjs-controls-enabled');
                this.addClass('vjs-controls-disabled');
                this.trigger('controlsdisabled');
            }
        }
        return this;
    }
    return this.controls_;
};

vjs.Player.prototype.usingNativeControls_;


vjs.Player.prototype.usingNativeControls = function(bool) {
    if (bool !== undefined) {
        bool = !!bool;
        if (this.usingNativeControls_ !== bool) {
            this.usingNativeControls_ = bool;
            if (bool) {
                this.addClass('vjs-using-native-controls');


                this.trigger('usingnativecontrols');
            } else {
                this.removeClass('vjs-using-native-controls');


                this.trigger('usingcustomcontrols');
            }
        }
        return this;
    }
    return this.usingNativeControls_;
};

vjs.Player.prototype.error = function() { return this.techGet('error'); };
vjs.Player.prototype.ended = function() { return this.techGet('ended'); };
vjs.Player.prototype.seeking = function() { return this.techGet('seeking'); };

vjs.Player.prototype.userActivity_ = true;
vjs.Player.prototype.reportUserActivity = function(event) {
    this.userActivity_ = true;
};

vjs.Player.prototype.userActive_ = true;
vjs.Player.prototype.userActive = function(bool) {
    if (bool !== undefined) {
        bool = !!bool;
        if (bool !== this.userActive_) {
            this.userActive_ = bool;
            if (bool) {
                this.userActivity_ = true;
                this.removeClass('vjs-user-inactive');
                this.addClass('vjs-user-active');
                this.trigger('useractive');
            } else {
                this.userActivity_ = false;

                if (this.tech) {
                    this.tech.one('mousemove', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                    });
                }

                this.removeClass('vjs-user-active');
                this.addClass('vjs-user-inactive');
                this.trigger('userinactive');
            }
        }
        return this;
    }
    return this.userActive_;
};

vjs.Player.prototype.listenForUserActivity = function() {
    var onMouseActivity, onMouseDown, mouseInProgress, onMouseUp,
        activityCheck, inactivityTimeout;

    onMouseActivity = vjs.bind(this, this.reportUserActivity);

    onMouseDown = function() {
        onMouseActivity();
        clearInterval(mouseInProgress);
        mouseInProgress = setInterval(onMouseActivity, 250);
    };

    onMouseUp = function(event) {
        onMouseActivity();
        clearInterval(mouseInProgress);
    };

    this.on('mousedown', onMouseDown);
    this.on('mousemove', onMouseActivity);
    this.on('mouseup', onMouseUp);

    this.on('keydown', onMouseActivity);
    this.on('keyup', onMouseActivity);

    activityCheck = setInterval(vjs.bind(this, function() {
        if (this.userActivity_) {
            this.userActivity_ = false;

            this.userActive(true);

            clearTimeout(inactivityTimeout);

            inactivityTimeout = setTimeout(vjs.bind(this, function() {
                if (!this.userActivity_) {
                    this.userActive(false);
                }
            }), 2000);
        }
    }), 250);

    this.on('dispose', function() {
        clearInterval(activityCheck);
        clearTimeout(inactivityTimeout);
    });
};



(function() {
    var prefix, requestFS, div;

    div = document.createElement('div');

    requestFS = {};

    if (div.cancelFullscreen !== undefined) {
        requestFS.requestFn = 'requestFullscreen';
        requestFS.cancelFn = 'exitFullscreen';
        requestFS.eventName = 'fullscreenchange';
        requestFS.isFullScreen = 'fullScreen';

    } else {

        if (document.mozCancelFullScreen) {
            prefix = 'moz';
            requestFS.isFullScreen = prefix + 'FullScreen';
        } else {
            prefix = 'webkit';
            requestFS.isFullScreen = prefix + 'IsFullScreen';
        }

        if (div[prefix + 'RequestFullScreen']) {
            requestFS.requestFn = prefix + 'RequestFullScreen';
            requestFS.cancelFn = prefix + 'CancelFullScreen';
        }
        requestFS.eventName = prefix + 'fullscreenchange';
    }

    if (document[requestFS.cancelFn]) {
        vjs.support.requestFullScreen = requestFS;
    }

})();

vjs.ControlBar = vjs.Component.extend();

vjs.ControlBar.prototype.options_ = {
    loadEvent: 'play',
    children: {
        'playToggle': {},
        'currentTimeDisplay': {},
        'timeDivider': {},
        'durationDisplay': {},
        'remainingTimeDisplay': {},
        'progressControl': {},
        'fullscreenToggle': {},
        'volumeControl': {},
        'muteToggle': {}
    }
};

vjs.ControlBar.prototype.createEl = function() {
    return vjs.createEl('div', {
        className: 'vjs-control-bar'
    });
};

vjs.PlayToggle = vjs.Button.extend({

    init: function(player, options) {
        vjs.Button.call(this, player, options);

        player.on('play', vjs.bind(this, this.onPlay));
        player.on('pause', vjs.bind(this, this.onPause));
    }
});

vjs.PlayToggle.prototype.buttonText = 'Play';

vjs.PlayToggle.prototype.buildCSSClass = function() {
    return 'vjs-play-control ' + vjs.Button.prototype.buildCSSClass.call(this);
};

vjs.PlayToggle.prototype.onClick = function() {
    if (this.player_.paused()) {
        this.player_.play();
    } else {
        this.player_.pause();
    }
};

vjs.PlayToggle.prototype.onPlay = function() {
    vjs.removeClass(this.el_, 'vjs-paused');
    vjs.addClass(this.el_, 'vjs-playing');
    this.el_.children[0].children[0].innerHTML = 'Pause';
};

vjs.PlayToggle.prototype.onPause = function() {
    vjs.removeClass(this.el_, 'vjs-playing');
    vjs.addClass(this.el_, 'vjs-paused');
    this.el_.children[0].children[0].innerHTML = 'Play';
};

vjs.CurrentTimeDisplay = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        player.on('timeupdate', vjs.bind(this, this.updateContent));
    }
});

vjs.CurrentTimeDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-current-time vjs-time-controls vjs-control'
    });

    this.contentEl_ = vjs.createEl('div', {
        className: 'vjs-current-time-display',
        innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00',
        'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
};

vjs.CurrentTimeDisplay.prototype.updateContent = function() {
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.contentEl_.innerHTML = '<span class="vjs-control-text">Current Time </span>' + vjs.formatTime(time, this.player_.duration());
};


vjs.DurationDisplay = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        player.on('timeupdate', vjs.bind(this, this.updateContent));
    }
});

vjs.DurationDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-duration vjs-time-controls vjs-control'
    });

    this.contentEl_ = vjs.createEl('div', {
        className: 'vjs-duration-display',
        innerHTML: '<span class="vjs-control-text">Duration Time </span>' + '0:00',
        'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
};

vjs.DurationDisplay.prototype.updateContent = function() {
    var duration = this.player_.duration();
    if (duration) {
        this.contentEl_.innerHTML = '<span class="vjs-control-text">Duration Time </span>' + vjs.formatTime(duration);
    }
};


vjs.TimeDivider = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);
    }
});

vjs.TimeDivider.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-time-divider',
        innerHTML: '<div><span>/</span></div>'
    });
};


vjs.RemainingTimeDisplay = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        player.on('timeupdate', vjs.bind(this, this.updateContent));
    }
});

vjs.RemainingTimeDisplay.prototype.createEl = function() {
    var el = vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-remaining-time vjs-time-controls vjs-control'
    });

    this.contentEl_ = vjs.createEl('div', {
        className: 'vjs-remaining-time-display',
        innerHTML: '<span class="vjs-control-text">Remaining Time </span>' + '-0:00',
        'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);
    return el;
};

vjs.RemainingTimeDisplay.prototype.updateContent = function() {
    if (this.player_.duration()) {
        this.contentEl_.innerHTML = '<span class="vjs-control-text">Remaining Time </span>' + '-' + vjs.formatTime(this.player_.remainingTime());
    }

};

vjs.FullscreenToggle = vjs.Button.extend({

    init: function(player, options) {
        vjs.Button.call(this, player, options);
    }
});

vjs.FullscreenToggle.prototype.buttonText = 'Fullscreen';

vjs.FullscreenToggle.prototype.buildCSSClass = function() {
    return 'vjs-fullscreen-control ' + vjs.Button.prototype.buildCSSClass.call(this);
};

vjs.FullscreenToggle.prototype.onClick = function() {
    if (!this.player_.isFullScreen()) {
        this.player_.requestFullScreen();
        this.el_.children[0].children[0].innerHTML = 'Non-Fullscreen';
    } else {
        this.player_.cancelFullScreen();
        this.el_.children[0].children[0].innerHTML = 'Fullscreen';
    }
};

vjs.ProgressControl = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);
    }
});

vjs.ProgressControl.prototype.options_ = {
    children: {
        'seekBar': {}
    }
};

vjs.ProgressControl.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-progress-control vjs-control'
    });
};


vjs.SeekBar = vjs.Slider.extend({

    init: function(player, options) {
        vjs.Slider.call(this, player, options);
        player.on('timeupdate', vjs.bind(this, this.updateARIAAttributes));
        player.ready(vjs.bind(this, this.updateARIAAttributes));
    }
});

vjs.SeekBar.prototype.options_ = {
    children: {
        'loadProgressBar': {},
        'playProgressBar': {},
        'seekHandle': {}
    },
    'barName': 'playProgressBar',
    'handleName': 'seekHandle'
};

vjs.SeekBar.prototype.playerEvent = 'timeupdate';

vjs.SeekBar.prototype.createEl = function() {
    return vjs.Slider.prototype.createEl.call(this, 'div', {
        className: 'vjs-progress-holder',
        'aria-label': 'video progress bar'
    });
};

vjs.SeekBar.prototype.updateARIAAttributes = function() {
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow', vjs.round(this.getPercent() * 100, 2));
    this.el_.setAttribute('aria-valuetext', vjs.formatTime(time, this.player_.duration()));
};

vjs.SeekBar.prototype.getPercent = function() {
    return this.player_.currentTime() / this.player_.duration();
};

vjs.SeekBar.prototype.onMouseDown = function(event) {
    vjs.Slider.prototype.onMouseDown.call(this, event);

    this.player_.scrubbing = true;

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();
};

vjs.SeekBar.prototype.onMouseMove = function(event) {
    var newTime = this.calculateDistance(event) * this.player_.duration();

    if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

    this.player_.currentTime(newTime);
};

vjs.SeekBar.prototype.onMouseUp = function(event) {
    vjs.Slider.prototype.onMouseUp.call(this, event);

    this.player_.scrubbing = false;
    if (this.videoWasPlaying) {
        this.player_.play();
    }
};

vjs.SeekBar.prototype.stepForward = function() {
    this.player_.currentTime(this.player_.currentTime() + 5);
};

vjs.SeekBar.prototype.stepBack = function() {
    this.player_.currentTime(this.player_.currentTime() - 5);
};



vjs.LoadProgressBar = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);
        player.on('progress', vjs.bind(this, this.update));
    }
});

vjs.LoadProgressBar.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-load-progress',
        innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
    });
};

vjs.LoadProgressBar.prototype.update = function() {
    if (this.el_.style) { this.el_.style.width = vjs.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};



vjs.PlayProgressBar = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);
    }
});

vjs.PlayProgressBar.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-play-progress',
        innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
    });
};


vjs.SeekHandle = vjs.SliderHandle.extend({
    init: function(player, options) {
        vjs.SliderHandle.call(this, player, options);
        player.on('timeupdate', vjs.bind(this, this.updateContent));
    }
});


vjs.SeekHandle.prototype.defaultValue = '00:00';


vjs.SeekHandle.prototype.createEl = function() {
    return vjs.SliderHandle.prototype.createEl.call(this, 'div', {
        className: 'vjs-seek-handle',
        'aria-live': 'off'
    });
};

vjs.SeekHandle.prototype.updateContent = function() {
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.innerHTML = '<span class="vjs-control-text">' + vjs.formatTime(time, this.player_.duration()) + '</span>';
};

vjs.VolumeControl = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
            this.addClass('vjs-hidden');
        }
        player.on('loadstart', vjs.bind(this, function() {
            if (player.tech.features && player.tech.features['volumeControl'] === false) {
                this.addClass('vjs-hidden');
            } else {
                this.removeClass('vjs-hidden');
            }
        }));
    }
});

vjs.VolumeControl.prototype.options_ = {
    children: {
        'volumeBar': {}
    }
};

vjs.VolumeControl.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-volume-control vjs-control'
    });
};


vjs.VolumeBar = vjs.Slider.extend({

    init: function(player, options) {
        vjs.Slider.call(this, player, options);
        player.on('volumechange', vjs.bind(this, this.updateARIAAttributes));
        player.ready(vjs.bind(this, this.updateARIAAttributes));
        setTimeout(vjs.bind(this, this.update), 0);
    }
});

vjs.VolumeBar.prototype.updateARIAAttributes = function() {
    this.el_.setAttribute('aria-valuenow', vjs.round(this.player_.volume() * 100, 2));
    this.el_.setAttribute('aria-valuetext', vjs.round(this.player_.volume() * 100, 2) + '%');
};

vjs.VolumeBar.prototype.options_ = {
    children: {
        'volumeLevel': {},
        'volumeHandle': {}
    },
    'barName': 'volumeLevel',
    'handleName': 'volumeHandle'
};

vjs.VolumeBar.prototype.playerEvent = 'volumechange';

vjs.VolumeBar.prototype.createEl = function() {
    return vjs.Slider.prototype.createEl.call(this, 'div', {
        className: 'vjs-volume-bar',
        'aria-label': 'volume level'
    });
};

vjs.VolumeBar.prototype.onMouseMove = function(event) {
    if (this.player_.muted()) {
        this.player_.muted(false);
    }

    this.player_.volume(this.calculateDistance(event));
};

vjs.VolumeBar.prototype.getPercent = function() {
    if (this.player_.muted()) {
        return 0;
    } else {
        return this.player_.volume();
    }
};

vjs.VolumeBar.prototype.stepForward = function() {
    this.player_.volume(this.player_.volume() + 0.1);
};

vjs.VolumeBar.prototype.stepBack = function() {
    this.player_.volume(this.player_.volume() - 0.1);
};


vjs.VolumeLevel = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);
    }
});

vjs.VolumeLevel.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-volume-level',
        innerHTML: '<span class="vjs-control-text"></span>'
    });
};


vjs.VolumeHandle = vjs.SliderHandle.extend();

vjs.VolumeHandle.prototype.defaultValue = '00:00';


vjs.VolumeHandle.prototype.createEl = function() {
    return vjs.SliderHandle.prototype.createEl.call(this, 'div', {
        className: 'vjs-volume-handle'
    });
};

vjs.MuteToggle = vjs.Button.extend({

    init: function(player, options) {
        vjs.Button.call(this, player, options);

        player.on('volumechange', vjs.bind(this, this.update));

        if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
            this.addClass('vjs-hidden');
        }
        player.on('loadstart', vjs.bind(this, function() {
            if (player.tech.features && player.tech.features['volumeControl'] === false) {
                this.addClass('vjs-hidden');
            } else {
                this.removeClass('vjs-hidden');
            }
        }));
    }
});

vjs.MuteToggle.prototype.createEl = function() {
    return vjs.Button.prototype.createEl.call(this, 'div', {
        className: 'vjs-mute-control vjs-control',
        innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
    });
};

vjs.MuteToggle.prototype.onClick = function() {
    this.player_.muted(this.player_.muted() ? false : true);
};

vjs.MuteToggle.prototype.update = function() {
    var vol = this.player_.volume(),
        level = 3;

    if (vol === 0 || this.player_.muted()) {
        level = 0;
    } else if (vol < 0.33) {
        level = 1;
    } else if (vol < 0.67) {
        level = 2;
    }

    if (this.player_.muted()) {
        if (this.el_.children[0].children[0].innerHTML != 'Unmute') {
            this.el_.children[0].children[0].innerHTML = 'Unmute';
        }
    } else {
        if (this.el_.children[0].children[0].innerHTML != 'Mute') {
            this.el_.children[0].children[0].innerHTML = 'Mute';
        }
    }


    for (var i = 0; i < 4; i++) {
        vjs.removeClass(this.el_, 'vjs-vol-' + i);
    }
    vjs.addClass(this.el_, 'vjs-vol-' + level);
};

vjs.VolumeMenuButton = vjs.MenuButton.extend({

    init: function(player, options) {
        vjs.MenuButton.call(this, player, options);

        player.on('volumechange', vjs.bind(this, this.update));

        if (player.tech && player.tech.features && player.tech.features.volumeControl === false) {
            this.addClass('vjs-hidden');
        }
        player.on('loadstart', vjs.bind(this, function() {
            if (player.tech.features && player.tech.features.volumeControl === false) {
                this.addClass('vjs-hidden');
            } else {
                this.removeClass('vjs-hidden');
            }
        }));
        this.addClass('vjs-menu-button');
    }
});

vjs.VolumeMenuButton.prototype.createMenu = function() {
    var menu = new vjs.Menu(this.player_, {
        contentElType: 'div'
    });
    var vc = new vjs.VolumeBar(this.player_, vjs.obj.merge({ vertical: true }, this.options_.volumeBar));
    menu.addChild(vc);
    return menu;
};

vjs.VolumeMenuButton.prototype.onClick = function() {
    vjs.MuteToggle.prototype.onClick.call(this);
    vjs.MenuButton.prototype.onClick.call(this);
};

vjs.VolumeMenuButton.prototype.createEl = function() {
    return vjs.Button.prototype.createEl.call(this, 'div', {
        className: 'vjs-volume-menu-button vjs-menu-button vjs-control',
        innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
    });
};
vjs.VolumeMenuButton.prototype.update = vjs.MuteToggle.prototype.update;


vjs.PosterImage = vjs.Button.extend({

    init: function(player, options) {
        vjs.Button.call(this, player, options);

        if (player.poster()) {
            this.src(player.poster());
        }

        if (!player.poster() || !player.controls()) {
            this.hide();
        }

        player.on('posterchange', vjs.bind(this, function() {
            this.src(player.poster());
        }));

        player.on('play', vjs.bind(this, this.hide));
    }
});

var _backgroundSizeSupported = 'backgroundSize' in vjs.TEST_VID.style;

vjs.PosterImage.prototype.createEl = function() {
    var el = vjs.createEl('div', {
        className: 'vjs-poster',

        tabIndex: -1
    });

    if (!_backgroundSizeSupported) {
        el.appendChild(vjs.createEl('img'));
    }

    return el;
};

vjs.PosterImage.prototype.src = function(url) {
    var el = this.el();

    if (url === undefined) {
        return;
    }

    if (_backgroundSizeSupported) {
        el.style.backgroundImage = 'url("' + url + '")';
    } else {
        el.firstChild.src = url;
    }
};

vjs.PosterImage.prototype.onClick = function() {
    if (this.player().controls()) {
        this.player_.play();
    }
};


vjs.LoadingSpinner = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);

        player.on('canplay', vjs.bind(this, this.hide));
        player.on('canplaythrough', vjs.bind(this, this.hide));
        player.on('playing', vjs.bind(this, this.hide));
        player.on('seeked', vjs.bind(this, this.hide));

        player.on('seeking', vjs.bind(this, this.show));

        player.on('seeked', vjs.bind(this, this.hide));

        player.on('error', vjs.bind(this, this.show));


        player.on('waiting', vjs.bind(this, this.show));
    }
});

vjs.LoadingSpinner.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-loading-spinner'
    });
};


vjs.BigPlayButton = vjs.Button.extend();

vjs.BigPlayButton.prototype.createEl = function() {
    return vjs.Button.prototype.createEl.call(this, 'div', {
        className: 'vjs-big-play-button',
        innerHTML: '<span aria-hidden="true"></span>',
        'aria-label': 'play video'
    });
};

vjs.BigPlayButton.prototype.onClick = function() {
    this.player_.play();
};



vjs.MediaTechController = vjs.Component.extend({

    init: function(player, options, ready) {
        options = options || {};
        options.reportTouchActivity = false;
        vjs.Component.call(this, player, options, ready);

        this.initControlsListeners();
    }
});


vjs.MediaTechController.prototype.initControlsListeners = function() {
    var player, tech, activateControls, deactivateControls;

    tech = this;
    player = this.player();

    var activateControls = function() {
        if (player.controls() && !player.usingNativeControls()) {
            tech.addControlsListeners();
        }
    };

    deactivateControls = vjs.bind(tech, tech.removeControlsListeners);

    this.ready(activateControls);
    player.on('controlsenabled', activateControls);
    player.on('controlsdisabled', deactivateControls);
};

vjs.MediaTechController.prototype.addControlsListeners = function() {
    var userWasActive;

    this.on('mousedown', this.onClick);

    this.on('touchstart', function(event) {
        event.preventDefault();
        userWasActive = this.player_.userActive();
    });

    this.on('touchmove', function(event) {
        if (userWasActive) {
            this.player().reportUserActivity();
        }
    });

    this.emitTapEvents();

    this.on('tap', this.onTap);
};


vjs.MediaTechController.prototype.removeControlsListeners = function() {
    this.off('tap');
    this.off('touchstart');
    this.off('touchmove');
    this.off('touchleave');
    this.off('touchcancel');
    this.off('touchend');
    this.off('click');
    this.off('mousedown');
};


vjs.MediaTechController.prototype.onClick = function(event) {
    if (event.button !== 0) return;

    if (this.player().controls()) {
        if (this.player().paused()) {
            this.player().play();
        } else {
            this.player().pause();
        }
    }
};


vjs.MediaTechController.prototype.onTap = function() {
    this.player().userActive(!this.player().userActive());
};

vjs.MediaTechController.prototype.features = {
    'volumeControl': true,

    'fullscreenResize': false,

    'progressEvents': false,
    'timeupdateEvents': false
};

vjs.media = {};


vjs.media.ApiMethods = 'play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted'.split(',');

function createMethod(methodName) {
    return function() {
        throw new Error('The "' + methodName + '" method is not available on the playback technology\'s API');
    };
}

for (var i = vjs.media.ApiMethods.length - 1; i >= 0; i--) {
    var methodName = vjs.media.ApiMethods[i];
    vjs.MediaTechController.prototype[vjs.media.ApiMethods[i]] = createMethod(methodName);
}



vjs.Html5 = vjs.MediaTechController.extend({

    init: function(player, options, ready) {
        this.features['volumeControl'] = vjs.Html5.canControlVolume();

        this.features['movingMediaElementInDOM'] = !vjs.IS_IOS;

        this.features['fullscreenResize'] = true;

        vjs.MediaTechController.call(this, player, options, ready);
        this.setupTriggers();

        var source = options['source'];

        if (source && this.el_.currentSrc === source.src && this.el_.networkState > 0) {
            player.trigger('loadstart');

        } else if (source) {
            this.el_.src = source.src;
        }

        if (vjs.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] !== false) {
            this.useNativeControls();
        }

        player.ready(function() {
            if (this.tag && this.options_['autoplay'] && this.paused()) {
                delete this.tag['poster'];
                this.play();
            }
        });

        this.triggerReady();
    }
});

vjs.Html5.prototype.dispose = function() {
    vjs.MediaTechController.prototype.dispose.call(this);
};

vjs.Html5.prototype.createEl = function() {
    var player = this.player_,
        el = player.tag,
        newEl,
        clone;

    if (!el || this.features['movingMediaElementInDOM'] === false) {

        if (el) {
            clone = el.cloneNode(false);
            vjs.Html5.disposeMediaElement(el);
            el = clone;
            player.tag = null;
        } else {
            el = vjs.createEl('video', {
                id: player.id() + '_html5_api',
                className: 'vjs-tech'
            });
        }
        el['player'] = player;

        vjs.insertFirst(el, player.el());
    }

    var attrs = ['autoplay', 'preload', 'loop', 'muted'];
    for (var i = attrs.length - 1; i >= 0; i--) {
        var attr = attrs[i];
        if (player.options_[attr] !== null) {
            el[attr] = player.options_[attr];
        }
    }

    return el;
};

vjs.Html5.prototype.setupTriggers = function() {
    for (var i = vjs.Html5.Events.length - 1; i >= 0; i--) {
        vjs.on(this.el_, vjs.Html5.Events[i], vjs.bind(this.player_, this.eventHandler));
    }
};

vjs.Html5.prototype.eventHandler = function(e) {
    this.trigger(e);

    e.stopPropagation();
};

vjs.Html5.prototype.useNativeControls = function() {
    var tech, player, controlsOn, controlsOff, cleanUp;

    tech = this;
    player = this.player();

    tech.setControls(player.controls());

    controlsOn = function() {
        tech.setControls(true);
    };
    controlsOff = function() {
        tech.setControls(false);
    };
    player.on('controlsenabled', controlsOn);
    player.on('controlsdisabled', controlsOff);

    cleanUp = function() {
        player.off('controlsenabled', controlsOn);
        player.off('controlsdisabled', controlsOff);
    };
    tech.on('dispose', cleanUp);
    player.on('usingcustomcontrols', cleanUp);

    player.usingNativeControls(true);
};


vjs.Html5.prototype.play = function() { this.el_.play(); };
vjs.Html5.prototype.pause = function() { this.el_.pause(); };
vjs.Html5.prototype.paused = function() { return this.el_.paused; };

vjs.Html5.prototype.currentTime = function() { return this.el_.currentTime; };
vjs.Html5.prototype.setCurrentTime = function(seconds) {
    try {
        this.el_.currentTime = seconds;
    } catch (e) {
        vjs.log(e, 'Video is not ready. (Video.js)');
    }
};

vjs.Html5.prototype.duration = function() { return this.el_.duration || 0; };
vjs.Html5.prototype.buffered = function() { return this.el_.buffered; };

vjs.Html5.prototype.volume = function() { return this.el_.volume; };
vjs.Html5.prototype.setVolume = function(percentAsDecimal) { this.el_.volume = percentAsDecimal; };
vjs.Html5.prototype.muted = function() { return this.el_.muted; };
vjs.Html5.prototype.setMuted = function(muted) { this.el_.muted = muted; };

vjs.Html5.prototype.width = function() { return this.el_.offsetWidth; };
vjs.Html5.prototype.height = function() { return this.el_.offsetHeight; };

vjs.Html5.prototype.supportsFullScreen = function() {
    if (typeof this.el_.webkitEnterFullScreen == 'function') {

        if (/Android/.test(vjs.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(vjs.USER_AGENT)) {
            return true;
        }
    }
    return false;
};

vjs.Html5.prototype.enterFullScreen = function() {
    var video = this.el_;
    if (video.paused && video.networkState <= video.HAVE_METADATA) {
        this.el_.play();

        setTimeout(function() {
            video.pause();
            video.webkitEnterFullScreen();
        }, 0);
    } else {
        video.webkitEnterFullScreen();
    }
};
vjs.Html5.prototype.exitFullScreen = function() {
    this.el_.webkitExitFullScreen();
};
vjs.Html5.prototype.src = function(src) { this.el_.src = src; };
vjs.Html5.prototype.load = function() { this.el_.load(); };
vjs.Html5.prototype.currentSrc = function() { return this.el_.currentSrc; };

vjs.Html5.prototype.poster = function() { return this.el_.poster; };
vjs.Html5.prototype.setPoster = function(val) { this.el_.poster = val; };

vjs.Html5.prototype.preload = function() { return this.el_.preload; };
vjs.Html5.prototype.setPreload = function(val) { this.el_.preload = val; };

vjs.Html5.prototype.autoplay = function() { return this.el_.autoplay; };
vjs.Html5.prototype.setAutoplay = function(val) { this.el_.autoplay = val; };

vjs.Html5.prototype.controls = function() { return this.el_.controls; }
vjs.Html5.prototype.setControls = function(val) { this.el_.controls = !!val; }

vjs.Html5.prototype.loop = function() { return this.el_.loop; };
vjs.Html5.prototype.setLoop = function(val) { this.el_.loop = val; };

vjs.Html5.prototype.error = function() { return this.el_.error; };
vjs.Html5.prototype.seeking = function() { return this.el_.seeking; };
vjs.Html5.prototype.ended = function() { return this.el_.ended; };
vjs.Html5.prototype.defaultMuted = function() { return this.el_.defaultMuted; };



vjs.Html5.isSupported = function() {
    return !!vjs.TEST_VID.canPlayType;
};

vjs.Html5.canPlaySource = function(srcObj) {
    try {
        return !!vjs.TEST_VID.canPlayType(srcObj.type);
    } catch (e) {
        return '';
    }
};

vjs.Html5.canControlVolume = function() {
    var volume = vjs.TEST_VID.volume;
    vjs.TEST_VID.volume = (volume / 2) + 0.1;
    return volume !== vjs.TEST_VID.volume;
};

vjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

vjs.Html5.disposeMediaElement = function(el) {
    if (!el) { return; }

    el['player'] = null;

    if (el.parentNode) {
        el.parentNode.removeChild(el);
    }

    while (el.hasChildNodes()) {
        el.removeChild(el.firstChild);
    }

    el.removeAttribute('src');

    if (typeof el.load === 'function') {
        el.load();
    }
};


if (vjs.IS_OLD_ANDROID) {
    document.createElement('video').constructor.prototype.canPlayType = function(type) {
        return (type && type.toLowerCase().indexOf('video/mp4') != -1) ? 'maybe' : '';
    };
}



vjs.Flash = vjs.MediaTechController.extend({

    init: function(player, options, ready) {
        vjs.MediaTechController.call(this, player, options, ready);

        var source = options['source'],

            parentEl = options['parentEl'],

            placeHolder = this.el_ = vjs.createEl('div', { id: player.id() + '_temp_flash' }),

            objId = player.id() + '_flash_api',

            playerOptions = player.options_,

            flashVars = vjs.obj.merge({

                'readyFunction': 'videojs.Flash.onReady',
                'eventProxyFunction': 'videojs.Flash.onEvent',
                'errorEventProxyFunction': 'videojs.Flash.onError',

                'autoplay': playerOptions.autoplay,
                'preload': playerOptions.preload,
                'loop': playerOptions.loop,
                'muted': playerOptions.muted

            }, options['flashVars']),

            params = vjs.obj.merge({
                'wmode': 'opaque',
                'bgcolor': '#000000'
            }, options['params']),

            attributes = vjs.obj.merge({
                'id': objId,
                'name': objId,
                'class': 'vjs-tech'
            }, options['attributes']),

            lastSeekTarget;

        if (source) {
            if (source.type && vjs.Flash.isStreamingType(source.type)) {
                var parts = vjs.Flash.streamToParts(source.src);
                flashVars['rtmpConnection'] = encodeURIComponent(parts.connection);
                flashVars['rtmpStream'] = encodeURIComponent(parts.stream);
            } else {
                flashVars['src'] = encodeURIComponent(vjs.getAbsoluteURL(source.src));
            }
        }

        this['setCurrentTime'] = function(time) {
            lastSeekTarget = time;
            this.el_.vjs_setProperty('currentTime', time);
        };
        this['currentTime'] = function(time) {
            if (this.seeking()) {
                return lastSeekTarget;
            }
            return this.el_.vjs_getProperty('currentTime');
        };

        vjs.insertFirst(placeHolder, parentEl);

        if (options['startTime']) {
            this.ready(function() {
                this.load();
                this.play();
                this.currentTime(options['startTime']);
            });
        }

        if (vjs.IS_FIREFOX) {
            this.ready(function() {
                vjs.on(this.el(), 'mousemove', vjs.bind(this, function() {
                    this.player().trigger({ 'type': 'mousemove', 'bubbles': false });
                }));
            });
        }




        if (options['iFrameMode'] === true && !vjs.IS_FIREFOX) {

            var iFrm = vjs.createEl('iframe', {
                'id': objId + '_iframe',
                'name': objId + '_iframe',
                'className': 'vjs-tech',
                'scrolling': 'no',
                'marginWidth': 0,
                'marginHeight': 0,
                'frameBorder': 0
            });

            flashVars['readyFunction'] = 'ready';
            flashVars['eventProxyFunction'] = 'events';
            flashVars['errorEventProxyFunction'] = 'errors';





            vjs.on(iFrm, 'load', vjs.bind(this, function() {

                var iDoc,
                    iWin = iFrm.contentWindow;


                iDoc = iFrm.contentDocument ? iFrm.contentDocument : iFrm.contentWindow.document;




                iDoc.write(vjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes));

                iWin['player'] = this.player_;

                iWin['ready'] = vjs.bind(this.player_, function(currSwf) {
                    var el = iDoc.getElementById(currSwf),
                        player = this,
                        tech = player.tech;

                    tech.el_ = el;

                    vjs.Flash.checkReady(tech);
                });

                iWin['events'] = vjs.bind(this.player_, function(swfID, eventName) {
                    var player = this;
                    if (player && player.techName === 'flash') {
                        player.trigger(eventName);
                    }
                });

                iWin['errors'] = vjs.bind(this.player_, function(swfID, eventName) {
                    vjs.log('Flash Error', eventName);
                });

            }));

            placeHolder.parentNode.replaceChild(iFrm, placeHolder);

        } else {
            vjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
        }
    }
});

vjs.Flash.prototype.dispose = function() {
    vjs.MediaTechController.prototype.dispose.call(this);
};

vjs.Flash.prototype.play = function() {
    this.el_.vjs_play();
};

vjs.Flash.prototype.pause = function() {
    this.el_.vjs_pause();
};

vjs.Flash.prototype.src = function(src) {
    if (vjs.Flash.isStreamingSrc(src)) {
        src = vjs.Flash.streamToParts(src);
        this.setRtmpConnection(src.connection);
        this.setRtmpStream(src.stream);
    } else {
        src = vjs.getAbsoluteURL(src);
        this.el_.vjs_src(src);
    }

    if (this.player_.autoplay()) {
        var tech = this;
        setTimeout(function() { tech.play(); }, 0);
    }
};

vjs.Flash.prototype.currentSrc = function() {
    var src = this.el_.vjs_getProperty('currentSrc');
    if (src == null) {
        var connection = this.rtmpConnection(),
            stream = this.rtmpStream();

        if (connection && stream) {
            src = vjs.Flash.streamFromParts(connection, stream);
        }
    }
    return src;
};

vjs.Flash.prototype.load = function() {
    this.el_.vjs_load();
};

vjs.Flash.prototype.poster = function() {
    this.el_.vjs_getProperty('poster');
};
vjs.Flash.prototype.setPoster = function() {};

vjs.Flash.prototype.buffered = function() {
    return vjs.createTimeRange(0, this.el_.vjs_getProperty('buffered'));
};

vjs.Flash.prototype.supportsFullScreen = function() {
    return false;
};

vjs.Flash.prototype.enterFullScreen = function() {
    return false;
};


var api = vjs.Flash.prototype,
    readWrite = 'rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(','),
    readOnly = 'error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks'.split(',');


var createSetter = function(attr) {
    var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
    api['set' + attrUpper] = function(val) { return this.el_.vjs_setProperty(attr, val); };
};


var createGetter = function(attr) {
    api[attr] = function() { return this.el_.vjs_getProperty(attr); };
};

(function() {
    var i;
    for (i = 0; i < readWrite.length; i++) {
        createGetter(readWrite[i]);
        createSetter(readWrite[i]);
    }

    for (i = 0; i < readOnly.length; i++) {
        createGetter(readOnly[i]);
    }
})();



vjs.Flash.isSupported = function() {
    return vjs.Flash.version()[0] >= 10;
};

vjs.Flash.canPlaySource = function(srcObj) {
    var type;

    if (!srcObj.type) {
        return '';
    }

    type = srcObj.type.replace(/;.*/, '').toLowerCase();
    if (type in vjs.Flash.formats || type in vjs.Flash.streamingFormats) {
        return 'maybe';
    }
};

vjs.Flash.formats = {
    'video/flv': 'FLV',
    'video/x-flv': 'FLV',
    'video/mp4': 'MP4',
    'video/m4v': 'MP4'
};

vjs.Flash.streamingFormats = {
    'rtmp/mp4': 'MP4',
    'rtmp/flv': 'FLV'
};

vjs.Flash['onReady'] = function(currSwf) {
    var el = vjs.el(currSwf);

    var player = el['player'] || el.parentNode['player'],
        tech = player.tech;

    el['player'] = player;

    tech.el_ = el;

    vjs.Flash.checkReady(tech);
};

vjs.Flash.checkReady = function(tech) {

    if (tech.el().vjs_getProperty) {

        tech.triggerReady();

    } else {

        setTimeout(function() {
            vjs.Flash.checkReady(tech);
        }, 50);

    }
};

vjs.Flash['onEvent'] = function(swfID, eventName) {
    var player = vjs.el(swfID)['player'];
    player.trigger(eventName);
};

vjs.Flash['onError'] = function(swfID, err) {
    var player = vjs.el(swfID)['player'];
    player.trigger('error');
    vjs.log('Flash Error', err, swfID);
};

vjs.Flash.version = function() {
    var version = '0,0,0';

    try {
        version = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

    } catch (e) {
        try {
            if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
                version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
            }
        } catch (err) {}
    }
    return version.split(',');
};

vjs.Flash.embed = function(swf, placeHolder, flashVars, params, attributes) {
    var code = vjs.Flash.getEmbedCode(swf, flashVars, params, attributes),

        obj = vjs.createEl('div', { innerHTML: code }).childNodes[0],

        par = placeHolder.parentNode;

    placeHolder.parentNode.replaceChild(obj, placeHolder);

    var newObj = par.childNodes[0];
    setTimeout(function() {
        newObj.style.display = 'block';
    }, 1000);

    return obj;

};

vjs.Flash.getEmbedCode = function(swf, flashVars, params, attributes) {

    var objTag = '<object type="application/x-shockwave-flash"',
        flashVarsString = '',
        paramsString = '',
        attrsString = '';

    if (flashVars) {
        vjs.obj.each(flashVars, function(key, val) {
            flashVarsString += (key + '=' + val + '&');
        });
    }

    params = vjs.obj.merge({
        'movie': swf,
        'flashvars': flashVarsString,
        'allowScriptAccess': 'always',
        'allowNetworking': 'all'
    }, params);

    vjs.obj.each(params, function(key, val) {
        paramsString += '<param name="' + key + '" value="' + val + '" />';
    });

    attributes = vjs.obj.merge({
        'data': swf,

        'width': '100%',
        'height': '100%'

    }, attributes);

    vjs.obj.each(attributes, function(key, val) {
        attrsString += (key + '="' + val + '" ');
    });

    return objTag + attrsString + '>' + paramsString + '</object>';
};

vjs.Flash.streamFromParts = function(connection, stream) {
    return connection + '&' + stream;
};

vjs.Flash.streamToParts = function(src) {
    var parts = {
        connection: '',
        stream: ''
    };

    if (!src) {
        return parts;
    }

    var connEnd = src.indexOf('&');
    var streamBegin;
    if (connEnd !== -1) {
        streamBegin = connEnd + 1;
    } else {
        connEnd = streamBegin = src.lastIndexOf('/') + 1;
        if (connEnd === 0) {
            connEnd = streamBegin = src.length;
        }
    }
    parts.connection = src.substring(0, connEnd);
    parts.stream = src.substring(streamBegin, src.length);

    return parts;
};

vjs.Flash.isStreamingType = function(srcType) {
    return srcType in vjs.Flash.streamingFormats;
};

vjs.Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

vjs.Flash.isStreamingSrc = function(src) {
    return vjs.Flash.RTMP_RE.test(src);
};

vjs.MediaLoader = vjs.Component.extend({

    init: function(player, options, ready) {
        vjs.Component.call(this, player, options, ready);

        if (!player.options_['sources'] || player.options_['sources'].length === 0) {
            for (var i = 0, j = player.options_['techOrder']; i < j.length; i++) {
                var techName = vjs.capitalize(j[i]),
                    tech = window['videojs'][techName];

                if (tech && tech.isSupported()) {
                    player.loadTech(techName);
                    break;
                }
            }
        } else {
            player.src(player.options_['sources']);
        }
    }
});




vjs.Player.prototype.textTracks_;


vjs.Player.prototype.textTracks = function() {
    this.textTracks_ = this.textTracks_ || [];
    return this.textTracks_;
};


vjs.Player.prototype.addTextTrack = function(kind, label, language, options) {
    var tracks = this.textTracks_ = this.textTracks_ || [];
    options = options || {};

    options['kind'] = kind;
    options['label'] = label;
    options['language'] = language;

    var Kind = vjs.capitalize(kind || 'subtitles');

    var track = new window['videojs'][Kind + 'Track'](this, options);

    tracks.push(track);


    return track;
};


vjs.Player.prototype.addTextTracks = function(trackList) {
    var trackObj;

    for (var i = 0; i < trackList.length; i++) {
        trackObj = trackList[i];
        this.addTextTrack(trackObj['kind'], trackObj['label'], trackObj['language'], trackObj);
    }

    return this;
};

vjs.Player.prototype.showTextTrack = function(id, disableSameKind) {
    var tracks = this.textTracks_,
        i = 0,
        j = tracks.length,
        track, showTrack, kind;

    for (; i < j; i++) {
        track = tracks[i];
        if (track.id() === id) {
            track.show();
            showTrack = track;

        } else if (disableSameKind && track.kind() == disableSameKind && track.mode() > 0) {
            track.disable();
        }
    }

    kind = (showTrack) ? showTrack.kind() : ((disableSameKind) ? disableSameKind : false);

    if (kind) {
        this.trigger(kind + 'trackchange');
    }

    return this;
};


vjs.TextTrack = vjs.Component.extend({

    init: function(player, options) {
        vjs.Component.call(this, player, options);


        this.id_ = options['id'] || ('vjs_' + options['kind'] + '_' + options['language'] + '_' + vjs.guid++);
        this.src_ = options['src'];
        this.dflt_ = options['default'] || options['dflt'];
        this.title_ = options['title'];
        this.language_ = options['srclang'];
        this.label_ = options['label'];
        this.cues_ = [];
        this.activeCues_ = [];
        this.readyState_ = 0;
        this.mode_ = 0;

        this.player_.on('fullscreenchange', vjs.bind(this, this.adjustFontSize));
    }
});


vjs.TextTrack.prototype.kind_;


vjs.TextTrack.prototype.kind = function() {
    return this.kind_;
};


vjs.TextTrack.prototype.src_;


vjs.TextTrack.prototype.src = function() {
    return this.src_;
};


vjs.TextTrack.prototype.dflt_;


vjs.TextTrack.prototype.dflt = function() {
    return this.dflt_;
};


vjs.TextTrack.prototype.title_;


vjs.TextTrack.prototype.title = function() {
    return this.title_;
};


vjs.TextTrack.prototype.language_;


vjs.TextTrack.prototype.language = function() {
    return this.language_;
};


vjs.TextTrack.prototype.label_;


vjs.TextTrack.prototype.label = function() {
    return this.label_;
};


vjs.TextTrack.prototype.cues_;


vjs.TextTrack.prototype.cues = function() {
    return this.cues_;
};


vjs.TextTrack.prototype.activeCues_;


vjs.TextTrack.prototype.activeCues = function() {
    return this.activeCues_;
};


vjs.TextTrack.prototype.readyState_;


vjs.TextTrack.prototype.readyState = function() {
    return this.readyState_;
};


vjs.TextTrack.prototype.mode_;


vjs.TextTrack.prototype.mode = function() {
    return this.mode_;
};


vjs.TextTrack.prototype.adjustFontSize = function() {
    if (this.player_.isFullScreen()) {
        this.el_.style.fontSize = screen.width / this.player_.width() * 1.4 * 100 + '%';
    } else {
        this.el_.style.fontSize = '';
    }
};


vjs.TextTrack.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-' + this.kind_ + ' vjs-text-track'
    });
};


vjs.TextTrack.prototype.show = function() {
    this.activate();

    this.mode_ = 2;

    vjs.Component.prototype.show.call(this);
};


vjs.TextTrack.prototype.hide = function() {
    this.activate();

    this.mode_ = 1;

    vjs.Component.prototype.hide.call(this);
};


vjs.TextTrack.prototype.disable = function() {
    if (this.mode_ == 2) { this.hide(); }

    this.deactivate();

    this.mode_ = 0;
};


vjs.TextTrack.prototype.activate = function() {
    if (this.readyState_ === 0) { this.load(); }

    if (this.mode_ === 0) {
        this.player_.on('timeupdate', vjs.bind(this, this.update, this.id_));

        this.player_.on('ended', vjs.bind(this, this.reset, this.id_));

        if (this.kind_ === 'captions' || this.kind_ === 'subtitles') {
            this.player_.getChild('textTrackDisplay').addChild(this);
        }
    }
};


vjs.TextTrack.prototype.deactivate = function() {
    this.player_.off('timeupdate', vjs.bind(this, this.update, this.id_));
    this.player_.off('ended', vjs.bind(this, this.reset, this.id_));
    this.reset();
    this.player_.getChild('textTrackDisplay').removeChild(this);
};

vjs.TextTrack.prototype.load = function() {

    if (this.readyState_ === 0) {
        this.readyState_ = 1;
        vjs.get(this.src_, vjs.bind(this, this.parseCues), vjs.bind(this, this.onError));
    }

};

vjs.TextTrack.prototype.onError = function(err) {
    this.error = err;
    this.readyState_ = 3;
    this.trigger('error');
};

vjs.TextTrack.prototype.parseCues = function(srcContent) {
    var cue, time, text,
        lines = srcContent.split('\n'),
        line = '',
        id;

    for (var i = 1, j = lines.length; i < j; i++) {

        line = vjs.trim(lines[i]);
        if (line) {
            if (line.indexOf('-->') == -1) {
                id = line;
                line = vjs.trim(lines[++i]);
            } else {
                id = this.cues_.length;
            }

            cue = {
                id: id,
                index: this.cues_.length
            };

            time = line.split(' --> ');
            cue.startTime = this.parseCueTime(time[0]);
            cue.endTime = this.parseCueTime(time[1]);

            text = [];

            while (lines[++i] && (line = vjs.trim(lines[i]))) {
                text.push(line);
            }

            cue.text = text.join('<br/>');

            this.cues_.push(cue);
        }
    }

    this.readyState_ = 2;
    this.trigger('loaded');
};


vjs.TextTrack.prototype.parseCueTime = function(timeText) {
    var parts = timeText.split(':'),
        time = 0,
        hours, minutes, other, seconds, ms;

    if (parts.length == 3) {
        hours = parts[0];
        minutes = parts[1];
        other = parts[2];
    } else {
        hours = 0;
        minutes = parts[0];
        other = parts[1];
    }

    other = other.split(/\s+/);
    seconds = other.splice(0, 1)[0];
    seconds = seconds.split(/\.|,/);
    ms = parseFloat(seconds[1]);
    seconds = seconds[0];

    time += parseFloat(hours) * 3600;
    time += parseFloat(minutes) * 60;
    time += parseFloat(seconds);
    if (ms) { time += ms / 1000; }

    return time;
};

vjs.TextTrack.prototype.update = function() {
    if (this.cues_.length > 0) {

        var time = this.player_.currentTime();

        if (this.prevChange === undefined || time < this.prevChange || this.nextChange <= time) {
            var cues = this.cues_,

                newNextChange = this.player_.duration(),
                newPrevChange = 0,
                reverse = false,
                newCues = [],
                firstActiveIndex, lastActiveIndex,
                cue, i;
            if (time >= this.nextChange || this.nextChange === undefined) {
                i = (this.firstActiveIndex !== undefined) ? this.firstActiveIndex : 0;
            } else {
                reverse = true;
                i = (this.lastActiveIndex !== undefined) ? this.lastActiveIndex : cues.length - 1;
            }

            while (true) {
                cue = cues[i];

                if (cue.endTime <= time) {
                    newPrevChange = Math.max(newPrevChange, cue.endTime);

                    if (cue.active) {
                        cue.active = false;
                    }


                } else if (time < cue.startTime) {
                    newNextChange = Math.min(newNextChange, cue.startTime);

                    if (cue.active) {
                        cue.active = false;
                    }

                    if (!reverse) { break; }

                } else {

                    if (reverse) {
                        newCues.splice(0, 0, cue);

                        if (lastActiveIndex === undefined) { lastActiveIndex = i; }
                        firstActiveIndex = i;
                    } else {
                        newCues.push(cue);

                        if (firstActiveIndex === undefined) { firstActiveIndex = i; }
                        lastActiveIndex = i;
                    }

                    newNextChange = Math.min(newNextChange, cue.endTime);
                    newPrevChange = Math.max(newPrevChange, cue.startTime);

                    cue.active = true;
                }

                if (reverse) {
                    if (i === 0) { break; } else { i--; }
                } else {
                    if (i === cues.length - 1) { break; } else { i++; }
                }

            }

            this.activeCues_ = newCues;
            this.nextChange = newNextChange;
            this.prevChange = newPrevChange;
            this.firstActiveIndex = firstActiveIndex;
            this.lastActiveIndex = lastActiveIndex;

            this.updateDisplay();

            this.trigger('cuechange');
        }
    }
};

vjs.TextTrack.prototype.updateDisplay = function() {
    var cues = this.activeCues_,
        html = '',
        i = 0,
        j = cues.length;

    for (; i < j; i++) {
        html += '<span class="vjs-tt-cue">' + cues[i].text + '</span>';
    }

    this.el_.innerHTML = html;
};

vjs.TextTrack.prototype.reset = function() {
    this.nextChange = 0;
    this.prevChange = this.player_.duration();
    this.firstActiveIndex = 0;
    this.lastActiveIndex = 0;
};


vjs.CaptionsTrack = vjs.TextTrack.extend();
vjs.CaptionsTrack.prototype.kind_ = 'captions';


vjs.SubtitlesTrack = vjs.TextTrack.extend();
vjs.SubtitlesTrack.prototype.kind_ = 'subtitles';


vjs.ChaptersTrack = vjs.TextTrack.extend();
vjs.ChaptersTrack.prototype.kind_ = 'chapters';





vjs.TextTrackDisplay = vjs.Component.extend({

    init: function(player, options, ready) {
        vjs.Component.call(this, player, options, ready);

        if (player.options_['tracks'] && player.options_['tracks'].length > 0) {
            this.player_.addTextTracks(player.options_['tracks']);
        }
    }
});

vjs.TextTrackDisplay.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
        className: 'vjs-text-track-display'
    });
};



vjs.TextTrackMenuItem = vjs.MenuItem.extend({

    init: function(player, options) {
        var track = this.track = options['track'];

        options['label'] = track.label();
        options['selected'] = track.dflt();
        vjs.MenuItem.call(this, player, options);

        this.player_.on(track.kind() + 'trackchange', vjs.bind(this, this.update));
    }
});

vjs.TextTrackMenuItem.prototype.onClick = function() {
    vjs.MenuItem.prototype.onClick.call(this);
    this.player_.showTextTrack(this.track.id_, this.track.kind());
};

vjs.TextTrackMenuItem.prototype.update = function() {
    this.selected(this.track.mode() == 2);
};


vjs.OffTextTrackMenuItem = vjs.TextTrackMenuItem.extend({

    init: function(player, options) {
        options['track'] = {
            kind: function() { return options['kind']; },
            player: player,
            label: function() { return options['kind'] + ' off'; },
            dflt: function() { return false; },
            mode: function() { return false; }
        };
        vjs.TextTrackMenuItem.call(this, player, options);
        this.selected(true);
    }
});

vjs.OffTextTrackMenuItem.prototype.onClick = function() {
    vjs.TextTrackMenuItem.prototype.onClick.call(this);
    this.player_.showTextTrack(this.track.id_, this.track.kind());
};

vjs.OffTextTrackMenuItem.prototype.update = function() {
    var tracks = this.player_.textTracks(),
        i = 0,
        j = tracks.length,
        track,
        off = true;

    for (; i < j; i++) {
        track = tracks[i];
        if (track.kind() == this.track.kind() && track.mode() == 2) {
            off = false;
        }
    }

    this.selected(off);
};


vjs.TextTrackButton = vjs.MenuButton.extend({

    init: function(player, options) {
        vjs.MenuButton.call(this, player, options);

        if (this.items.length <= 1) {
            this.hide();
        }
    }
});








vjs.TextTrackButton.prototype.createItems = function() {
    var items = [],
        track;

    items.push(new vjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

    for (var i = 0; i < this.player_.textTracks().length; i++) {
        track = this.player_.textTracks()[i];
        if (track.kind() === this.kind_) {
            items.push(new vjs.TextTrackMenuItem(this.player_, {
                'track': track
            }));
        }
    }

    return items;
};


vjs.CaptionsButton = vjs.TextTrackButton.extend({

    init: function(player, options, ready) {
        vjs.TextTrackButton.call(this, player, options, ready);
        this.el_.setAttribute('aria-label', 'Captions Menu');
    }
});
vjs.CaptionsButton.prototype.kind_ = 'captions';
vjs.CaptionsButton.prototype.buttonText = 'Captions';
vjs.CaptionsButton.prototype.className = 'vjs-captions-button';


vjs.SubtitlesButton = vjs.TextTrackButton.extend({

    init: function(player, options, ready) {
        vjs.TextTrackButton.call(this, player, options, ready);
        this.el_.setAttribute('aria-label', 'Subtitles Menu');
    }
});
vjs.SubtitlesButton.prototype.kind_ = 'subtitles';
vjs.SubtitlesButton.prototype.buttonText = 'Subtitles';
vjs.SubtitlesButton.prototype.className = 'vjs-subtitles-button';


vjs.ChaptersButton = vjs.TextTrackButton.extend({

    init: function(player, options, ready) {
        vjs.TextTrackButton.call(this, player, options, ready);
        this.el_.setAttribute('aria-label', 'Chapters Menu');
    }
});
vjs.ChaptersButton.prototype.kind_ = 'chapters';
vjs.ChaptersButton.prototype.buttonText = 'Chapters';
vjs.ChaptersButton.prototype.className = 'vjs-chapters-button';

vjs.ChaptersButton.prototype.createItems = function() {
    var items = [],
        track;

    for (var i = 0; i < this.player_.textTracks().length; i++) {
        track = this.player_.textTracks()[i];
        if (track.kind() === this.kind_) {
            items.push(new vjs.TextTrackMenuItem(this.player_, {
                'track': track
            }));
        }
    }

    return items;
};

vjs.ChaptersButton.prototype.createMenu = function() {
    var tracks = this.player_.textTracks(),
        i = 0,
        j = tracks.length,
        track, chaptersTrack,
        items = this.items = [];

    for (; i < j; i++) {
        track = tracks[i];
        if (track.kind() == this.kind_ && track.dflt()) {
            if (track.readyState() < 2) {
                this.chaptersTrack = track;
                track.on('loaded', vjs.bind(this, this.createMenu));
                return;
            } else {
                chaptersTrack = track;
                break;
            }
        }
    }

    var menu = this.menu = new vjs.Menu(this.player_);

    menu.el_.appendChild(vjs.createEl('li', {
        className: 'vjs-menu-title',
        innerHTML: vjs.capitalize(this.kind_),
        tabindex: -1
    }));

    if (chaptersTrack) {
        var cues = chaptersTrack.cues_,
            cue, mi;
        i = 0;
        j = cues.length;

        for (; i < j; i++) {
            cue = cues[i];

            mi = new vjs.ChaptersTrackMenuItem(this.player_, {
                'track': chaptersTrack,
                'cue': cue
            });

            items.push(mi);

            menu.addChild(mi);
        }
    }

    if (this.items.length > 0) {
        this.show();
    }

    return menu;
};



vjs.ChaptersTrackMenuItem = vjs.MenuItem.extend({

    init: function(player, options) {
        var track = this.track = options['track'],
            cue = this.cue = options['cue'],
            currentTime = player.currentTime();

        options['label'] = cue.text;
        options['selected'] = (cue.startTime <= currentTime && currentTime < cue.endTime);
        vjs.MenuItem.call(this, player, options);

        track.on('cuechange', vjs.bind(this, this.update));
    }
});

vjs.ChaptersTrackMenuItem.prototype.onClick = function() {
    vjs.MenuItem.prototype.onClick.call(this);
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
};

vjs.ChaptersTrackMenuItem.prototype.update = function() {
    var cue = this.cue,
        currentTime = this.player_.currentTime();

    this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
};

vjs.obj.merge(vjs.ControlBar.prototype.options_['children'], {
    'subtitlesButton': {},
    'captionsButton': {},
    'chaptersButton': {}
});




vjs.JSON;

if (typeof window.JSON !== 'undefined' && window.JSON.parse === 'function') {
    vjs.JSON = window.JSON;

} else {
    vjs.JSON = {};

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;


    vjs.JSON.parse = function(text, reviver) {
        var j;

        function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && typeof value === 'object') {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    }
                }
            }
            return reviver.call(holder, key, value);
        }
        text = String(text);
        cx.lastIndex = 0;
        if (cx.test(text)) {
            text = text.replace(cx, function(a) {
                return '\\u' +
                    ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }

        if (/^[\],:{}\s]*$/
            .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

            j = eval('(' + text + ')');

            return typeof reviver === 'function' ?
                walk({ '': j }, '') : j;
        }

        throw new SyntaxError('JSON.parse(): invalid or malformed JSON data');
    };
}


vjs.autoSetup = function() {
    var options, vid, player,
        vids = document.getElementsByTagName('video');

    if (vids && vids.length > 0) {

        for (var i = 0, j = vids.length; i < j; i++) {
            vid = vids[i];

            if (vid && vid.getAttribute) {

                if (vid['player'] === undefined) {
                    options = vid.getAttribute('data-setup');

                    if (options !== null) {

                        options = vjs.JSON.parse(options || '{}');

                        player = videojs(vid, options);
                    }
                }

            } else {
                vjs.autoSetupTimeout(1);
                break;
            }
        }

    } else if (!vjs.windowLoaded) {
        vjs.autoSetupTimeout(1);
    }
};

vjs.autoSetupTimeout = function(wait) {
    setTimeout(vjs.autoSetup, wait);
};

if (document.readyState === 'complete') {
    vjs.windowLoaded = true;
} else {
    vjs.one(window, 'load', function() {
        vjs.windowLoaded = true;
    });
}

vjs.autoSetupTimeout(1);

vjs.plugin = function(name, init) {
    vjs.Player.prototype[name] = init;
};