(function(root, factory) {
    if (typeof exports === "object" && exports) {
        factory(exports);
    } else {
        var mustache = {};
        factory(mustache);
        if (typeof define === "function" && define.amd) {
            define(mustache);
        } else {
            root.Mustache = mustache;
        }
    }
}(this, function(mustache) {

    var whiteRe = /\s*/;
    var spaceRe = /\s+/;
    var nonSpaceRe = /\S/;
    var eqRe = /\s*=/;
    var curlyRe = /\s*\}/;
    var tagRe = /#|\^|\/|>|\{|&|=|!/;

    var RegExp_test = RegExp.prototype.test;

    function testRegExp(re, string) {
        return RegExp_test.call(re, string);
    }

    function isWhitespace(string) {
        return !testRegExp(nonSpaceRe, string);
    }

    var Object_toString = Object.prototype.toString;
    var isArray = Array.isArray || function(object) {
        return Object_toString.call(object) === '[object Array]';
    };

    function isFunction(object) {
        return typeof object === 'function';
    }

    function escapeRegExp(string) {
        return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    }

    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'\/]/g, function(s) {
            return entityMap[s];
        });
    }

    function escapeTags(tags) {
        if (!isArray(tags) || tags.length !== 2) {
            throw new Error('Invalid tags: ' + tags);
        }

        return [
            new RegExp(escapeRegExp(tags[0]) + "\\s*"),
            new RegExp("\\s*" + escapeRegExp(tags[1]))
        ];
    }


    function parseTemplate(template, tags) {
        tags = tags || mustache.tags;
        template = template || '';

        if (typeof tags === 'string') {
            tags = tags.split(spaceRe);
        }

        var tagRes = escapeTags(tags);
        var scanner = new Scanner(template);

        var sections = [];
        var tokens = [];
        var spaces = [];
        var hasTag = false;
        var nonSpace = false;

        function stripSpace() {
            if (hasTag && !nonSpace) {
                while (spaces.length) {
                    delete tokens[spaces.pop()];
                }
            } else {
                spaces = [];
            }

            hasTag = false;
            nonSpace = false;
        }

        var start, type, value, chr, token, openSection;
        while (!scanner.eos()) {
            start = scanner.pos;

            value = scanner.scanUntil(tagRes[0]);
            if (value) {
                for (var i = 0, len = value.length; i < len; ++i) {
                    chr = value.charAt(i);

                    if (isWhitespace(chr)) {
                        spaces.push(tokens.length);
                    } else {
                        nonSpace = true;
                    }

                    tokens.push(['text', chr, start, start + 1]);
                    start += 1;

                    if (chr === '\n') {
                        stripSpace();
                    }
                }
            }

            if (!scanner.scan(tagRes[0])) break;
            hasTag = true;

            type = scanner.scan(tagRe) || 'name';
            scanner.scan(whiteRe);

            if (type === '=') {
                value = scanner.scanUntil(eqRe);
                scanner.scan(eqRe);
                scanner.scanUntil(tagRes[1]);
            } else if (type === '{') {
                value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
                scanner.scan(curlyRe);
                scanner.scanUntil(tagRes[1]);
                type = '&';
            } else {
                value = scanner.scanUntil(tagRes[1]);
            }

            if (!scanner.scan(tagRes[1])) {
                throw new Error('Unclosed tag at ' + scanner.pos);
            }

            token = [type, value, start, scanner.pos];
            tokens.push(token);

            if (type === '#' || type === '^') {
                sections.push(token);
            } else if (type === '/') {
                openSection = sections.pop();

                if (!openSection) {
                    throw new Error('Unopened section "' + value + '" at ' + start);
                }
                if (openSection[1] !== value) {
                    throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
                }
            } else if (type === 'name' || type === '{' || type === '&') {
                nonSpace = true;
            } else if (type === '=') {
                tagRes = escapeTags(tags = value.split(spaceRe));
            }
        }

        openSection = sections.pop();
        if (openSection) {
            throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
        }

        return nestTokens(squashTokens(tokens));
    }


    function squashTokens(tokens) {
        var squashedTokens = [];

        var token, lastToken;
        for (var i = 0, len = tokens.length; i < len; ++i) {
            token = tokens[i];

            if (token) {
                if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
                    lastToken[1] += token[1];
                    lastToken[3] = token[3];
                } else {
                    squashedTokens.push(token);
                    lastToken = token;
                }
            }
        }

        return squashedTokens;
    }


    function nestTokens(tokens) {
        var nestedTokens = [];
        var collector = nestedTokens;
        var sections = [];

        var token, section;
        for (var i = 0, len = tokens.length; i < len; ++i) {
            token = tokens[i];

            switch (token[0]) {
                case '#':
                case '^':
                    collector.push(token);
                    sections.push(token);
                    collector = token[4] = [];
                    break;
                case '/':
                    section = sections.pop();
                    section[5] = token[2];
                    collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
                    break;
                default:
                    collector.push(token);
            }
        }

        return nestedTokens;
    }


    function Scanner(string) {
        this.string = string;
        this.tail = string;
        this.pos = 0;
    }


    Scanner.prototype.eos = function() {
        return this.tail === "";
    };


    Scanner.prototype.scan = function(re) {
        var match = this.tail.match(re);

        if (match && match.index === 0) {
            var string = match[0];
            this.tail = this.tail.substring(string.length);
            this.pos += string.length;
            return string;
        }

        return "";
    };


    Scanner.prototype.scanUntil = function(re) {
        var index = this.tail.search(re),
            match;

        switch (index) {
            case -1:
                match = this.tail;
                this.tail = "";
                break;
            case 0:
                match = "";
                break;
            default:
                match = this.tail.substring(0, index);
                this.tail = this.tail.substring(index);
        }

        this.pos += match.length;

        return match;
    };


    function Context(view, parentContext) {
        this.view = view == null ? {} : view;
        this.cache = { '.': this.view };
        this.parent = parentContext;
    }


    Context.prototype.push = function(view) {
        return new Context(view, this);
    };


    Context.prototype.lookup = function(name) {
        var value;
        if (name in this.cache) {
            value = this.cache[name];
        } else {
            var context = this;

            while (context) {
                if (name.indexOf('.') > 0) {
                    value = context.view;

                    var names = name.split('.'),
                        i = 0;
                    while (value != null && i < names.length) {
                        value = value[names[i++]];
                    }
                } else {
                    value = context.view[name];
                }

                if (value != null) break;

                context = context.parent;
            }

            this.cache[name] = value;
        }

        if (isFunction(value)) {
            value = value.call(this.view);
        }

        return value;
    };


    function Writer() {
        this.cache = {};
    }


    Writer.prototype.clearCache = function() {
        this.cache = {};
    };


    Writer.prototype.parse = function(template, tags) {
        var cache = this.cache;
        var tokens = cache[template];

        if (tokens == null) {
            tokens = cache[template] = parseTemplate(template, tags);
        }

        return tokens;
    };


    Writer.prototype.render = function(template, view, partials) {
        var tokens = this.parse(template);
        var context = (view instanceof Context) ? view : new Context(view);
        return this.renderTokens(tokens, context, partials, template);
    };


    Writer.prototype.renderTokens = function(tokens, context, partials, originalTemplate) {
        var buffer = '';

        var self = this;

        function subRender(template) {
            return self.render(template, context, partials);
        }

        var token, value;
        for (var i = 0, len = tokens.length; i < len; ++i) {
            token = tokens[i];

            switch (token[0]) {
                case '#':
                    value = context.lookup(token[1]);
                    if (!value) continue;

                    if (isArray(value)) {
                        for (var j = 0, jlen = value.length; j < jlen; ++j) {
                            buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
                        }
                    } else if (typeof value === 'object' || typeof value === 'string') {
                        buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
                    } else if (isFunction(value)) {
                        if (typeof originalTemplate !== 'string') {
                            throw new Error('Cannot use higher-order sections without the original template');
                        }

                        value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

                        if (value != null) buffer += value;
                    } else {
                        buffer += this.renderTokens(token[4], context, partials, originalTemplate);
                    }

                    break;
                case '^':
                    value = context.lookup(token[1]);

                    if (!value || (isArray(value) && value.length === 0)) {
                        buffer += this.renderTokens(token[4], context, partials, originalTemplate);
                    }

                    break;
                case '>':
                    if (!partials) continue;
                    value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
                    if (value != null) buffer += this.renderTokens(this.parse(value), context, partials, value);
                    break;
                case '&':
                    value = context.lookup(token[1]);
                    if (value != null) buffer += value;
                    break;
                case 'name':
                    value = context.lookup(token[1]);
                    if (value != null) buffer += mustache.escape(value);
                    break;
                case 'text':
                    buffer += token[1];
                    break;
            }
        }

        return buffer;
    };

    mustache.name = "mustache.js";
    mustache.version = "0.8.1";
    mustache.tags = ["{{", "}}"];

    var defaultWriter = new Writer();


    mustache.clearCache = function() {
        return defaultWriter.clearCache();
    };


    mustache.parse = function(template, tags) {
        return defaultWriter.parse(template, tags);
    };


    mustache.render = function(template, view, partials) {
        return defaultWriter.render(template, view, partials);
    };

    mustache.to_html = function(template, view, partials, send) {
        var result = mustache.render(template, view, partials);

        if (isFunction(send)) {
            send(result);
        } else {
            return result;
        }
    };

    mustache.escape = escapeHtml;

    mustache.Scanner = Scanner;
    mustache.Context = Context;
    mustache.Writer = Writer;

}));