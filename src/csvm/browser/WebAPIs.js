// 标准 Web API 补齐（手写 DOM 路径）
//
// 与真机 Chrome 对照后缺失的 68 项标准全局接口，这里按"可用 + 品牌形态正确"补齐。
// 目标不是完整实现规范，而是让环境的 API 面与真机一致（存在性、typeof、构造器名）。
(function () {
    var W = (typeof window !== "undefined") ? window : globalThis;

    function native(fn, name) {
        try { csvm.safefunction(fn, name || fn.name); } catch (e) {}
        return fn;
    }
    function def(name, value, writable) {
        try {
            Object.defineProperty(W, name, {
                value: value, writable: writable !== false, enumerable: false, configurable: true,
            });
        } catch (e) {}
    }
    function defineGetter(obj, name, get, set) {
        try {
            Object.defineProperty(obj, name, { configurable: true, enumerable: true, get: get, set: set });
        } catch (e) {}
    }
    function classFor(name, init) {
        var C = function () { init && init.apply(this, arguments); };
        try { Object.defineProperty(C, "name", { value: name, configurable: true }); } catch (e) {}
        try { Object.defineProperty(C.prototype, Symbol.toStringTag, { value: name, configurable: true }); } catch (e) {}
        try { Object.defineProperty(C.prototype, "constructor", { value: C, writable: true, configurable: true }); } catch (e) {}
        native(C, name);
        return C;
    }

    // ── atob / btoa ───────────────────────────────────────────────────────
    var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function btoaImpl(s) {
        s = String(s);
        var out = "", i = 0;
        for (; i + 2 < s.length; i += 3) {
            var n = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8) | s.charCodeAt(i + 2);
            out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
        }
        var rem = s.length - i;
        if (rem === 1) { var n1 = s.charCodeAt(i) << 16; out += B64[(n1 >> 18) & 63] + B64[(n1 >> 12) & 63] + "=="; }
        else if (rem === 2) { var n2 = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8); out += B64[(n2 >> 18) & 63] + B64[(n2 >> 12) & 63] + B64[(n2 >> 6) & 63] + "="; }
        return out;
    }
    function atobImpl(s) {
        s = String(s).replace(/[^A-Za-z0-9+/=]/g, "");
        var out = "";
        for (var i = 0; i + 3 < s.length; i += 4) {
            var n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | ((s[i + 2] === "=" ? 0 : B64.indexOf(s[i + 2])) << 6) | (s[i + 3] === "=" ? 0 : B64.indexOf(s[i + 3]));
            out += String.fromCharCode((n >> 16) & 255, (n >> 8) & 255, n & 255);
        }
        return out.replace(/\u0000+$/, "");
    }
    def("btoa", native(btoaImpl, "btoa"));
    def("atob", native(atobImpl, "atob"));

    // ── TextEncoder / TextDecoder ─────────────────────────────────────────
    var TextEncoder = classFor("TextEncoder", function () {});
    Object.defineProperty(TextEncoder.prototype, "encoding", { configurable: true, enumerable: true, get: function () { return "utf-8"; } });
    Object.defineProperty(TextEncoder.prototype, "encode", {
        configurable: true, enumerable: true, writable: true,
        value: native(function encode(s) {
            var str = unescape(encodeURIComponent(String(s == null ? "" : s)));
            var arr = new Uint8Array(str.length);
            for (var i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
            return arr;
        }, "encode"),
    });
    def("TextEncoder", TextEncoder);

    var TextDecoder = classFor("TextDecoder", function (label) { this.encoding = String(label || "utf-8").toLowerCase(); });
    Object.defineProperty(TextDecoder.prototype, "decode", {
        configurable: true, enumerable: true, writable: true,
        value: native(function decode(buf) {
            if (!buf) return "";
            var bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : (buf.buffer ? new Uint8Array(buf.buffer, buf.byteOffset || 0, buf.byteLength || buf.length) : buf);
            var s = "";
            for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
            try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
        }, "decode"),
    });
    def("TextDecoder", TextDecoder);

    // ── URL / URLSearchParams ─────────────────────────────────────────────
    var URLSearchParams = classFor("URLSearchParams", function (init) {
        var st = {};
        Object.defineProperty(this, "__p", { value: st, configurable: true, enumerable: false });
        if (typeof init === "string") {
            init.replace(/^\?/, "").split("&").forEach(function (kv) {
                if (!kv) return; var i = kv.indexOf("=");
                var k = decodeURIComponent(i === -1 ? kv : kv.slice(0, i));
                var v = decodeURIComponent(i === -1 ? "" : kv.slice(i + 1));
                (st[k] = st[k] || []).push(v);
            });
        } else if (init && typeof init === "object") {
            Object.keys(init).forEach(function (k) { st[k] = [String(init[k])]; });
        }
    });
    var spMethods = {
        append: function (k, v) { var s = this.__p; (s[k] = s[k] || []).push(String(v)); },
        delete: function (k) { delete this.__p[k]; },
        get: function (k) { var a = this.__p[k]; return a ? a[0] : null; },
        getAll: function (k) { return (this.__p[k] || []).slice(); },
        has: function (k) { return Object.prototype.hasOwnProperty.call(this.__p, k); },
        set: function (k, v) { this.__p[k] = [String(v)]; },
        sort: function () { var s = this.__p, o = {}; Object.keys(s).sort().forEach(function (k) { o[k] = s[k]; }); this.__p = o; },
        forEach: function (cb, th) { var s = this.__p, self = this; Object.keys(s).forEach(function (k) { s[k].forEach(function (v) { cb.call(th, v, k, self); }); }); },
        keys: function () { var a = []; this.forEach(function (v, k) { a.push(k); }); return a[Symbol.iterator](); },
        values: function () { var a = []; this.forEach(function (v) { a.push(v); }); return a[Symbol.iterator](); },
        entries: function () { var a = []; this.forEach(function (v, k) { a.push([k, v]); }); return a[Symbol.iterator](); },
        toString: function () {
            var s = this.__p; return Object.keys(s).map(function (k) {
                return s[k].map(function (v) { return encodeURIComponent(k) + "=" + encodeURIComponent(v); }).join("&");
            }).join("&");
        },
    };
    Object.keys(spMethods).forEach(function (n) {
        Object.defineProperty(URLSearchParams.prototype, n, { configurable: true, enumerable: true, writable: true, value: native(spMethods[n], n) });
    });
    try { URLSearchParams.prototype[Symbol.iterator] = URLSearchParams.prototype.entries; } catch (e) {}
    def("URLSearchParams", URLSearchParams);

    function parseURL(u, base) {
        var s = String(u == null ? "" : u);
        var m = /^([a-z][a-z0-9+.-]*:)?(\/\/)?([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(s);
        var proto = (m && m[1]) || (base && /^([a-z][a-z0-9+.-]*:)/i.exec(base) || [])[1] || "https:";
        var host = m && m[3] || "";
        var path = m && m[4] || "/";
        if (!m || !m[2]) {
            var bm = base ? /^([a-z][a-z0-9+.-]*:)\/\/([^/?#]*)([^?#]*)/i.exec(base) : null;
            if (bm) { proto = bm[1]; host = host || bm[2]; if (path && path[0] !== "/") path = bm[3].replace(/[^/]*$/, "") + path; }
        }
        var h = host.split(":");
        return {
            protocol: proto.toLowerCase(), host: host, hostname: h[0] || "", port: h[1] || "",
            pathname: path || "/", search: (m && m[5]) || "", hash: (m && m[6]) || "",
        };
    }
    var URL = classFor("URL", function (url, base) {
        var p = parseURL(url, base);
        var st = {
            protocol: p.protocol, host: p.host, hostname: p.hostname, port: p.port,
            pathname: p.pathname, search: p.search, hash: p.hash,
        };
        Object.defineProperty(this, "__u", { value: st, configurable: true, enumerable: false });
        var sp = st.search ? new URLSearchParams(st.search) : new URLSearchParams("");
        Object.defineProperty(this, "searchParams", { value: sp, configurable: true, enumerable: true });
    });
    ["protocol", "host", "hostname", "port", "pathname", "search", "hash"].forEach(function (k) {
        Object.defineProperty(URL.prototype, k, {
            configurable: true, enumerable: true,
            get: native(function () { return this.__u[k]; }, "get " + k),
            set: native(function (v) { this.__u[k] = String(v); }, "set " + k),
        });
    });
    Object.defineProperty(URL.prototype, "origin", { configurable: true, enumerable: true, get: native(function () { var u = this.__u; return u.protocol + "//" + u.host; }, "get origin") });
    Object.defineProperty(URL.prototype, "href", {
        configurable: true, enumerable: true,
        get: native(function () { var u = this.__u; return u.protocol + "//" + u.host + u.pathname + u.search + u.hash; }, "get href"),
    });
    Object.defineProperty(URL.prototype, "toString", { configurable: true, enumerable: true, writable: true, value: native(function toString() { return this.href; }, "toString") });
    Object.defineProperty(URL.prototype, "toJSON", { configurable: true, enumerable: true, writable: true, value: native(function toJSON() { return this.href; }, "toJSON") });
    def("URL", URL);
    try { def("webkitURL", URL); } catch (e) {}

    // ── DOMException ──────────────────────────────────────────────────────
    var DOMException = classFor("DOMException", function (message, name) {
        this.message = String(message || "");
        this.name = String(name || "Error");
        this.code = 0;
    });
    ["INDEX_SIZE_ERR", "DOMSTRING_SIZE_ERR", "HIERARCHY_REQUEST_ERR", "WRONG_DOCUMENT_ERR", "INVALID_CHARACTER_ERR",
     "NO_DATA_ALLOWED_ERR", "NO_MODIFICATION_ALLOWED_ERR", "NOT_FOUND_ERR", "NOT_SUPPORTED_ERR", "INUSE_ATTRIBUTE_ERR",
     "INVALID_STATE_ERR", "SYNTAX_ERR", "INVALID_MODIFICATION_ERR", "NAMESPACE_ERR", "INVALID_ACCESS_ERR",
     "VALIDATION_ERR", "TYPE_MISMATCH_ERR", "SECURITY_ERR", "NETWORK_ERR", "ABORT_ERR", "URL_MISMATCH_ERR",
     "QUOTA_EXCEEDED_ERR", "TIMEOUT_ERR", "INVALID_NODE_TYPE_ERR", "DATA_CLONE_ERR"].forEach(function (n, i) {
        try { Object.defineProperty(DOMException, n, { value: i + 1, configurable: true }); } catch (e) {}
    });
    def("DOMException", DOMException);

    // ── AbortController / AbortSignal ─────────────────────────────────────
    var AbortSignal = classFor("AbortSignal", function () { this.aborted = false; this.reason = undefined; this.__ls = []; });
    Object.defineProperty(AbortSignal.prototype, "addEventListener", { configurable: true, enumerable: true, writable: true, value: native(function (t, f) { if (t === "abort" && typeof f === "function") this.__ls.push(f); }, "addEventListener") });
    Object.defineProperty(AbortSignal.prototype, "removeEventListener", { configurable: true, enumerable: true, writable: true, value: native(function (t, f) { var i = this.__ls.indexOf(f); if (i !== -1) this.__ls.splice(i, 1); }, "removeEventListener") });
    Object.defineProperty(AbortSignal.prototype, "throwIfAborted", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "throwIfAborted") });
    var AbortController = classFor("AbortController", function () {
        this.signal = new AbortSignal();
        Object.defineProperty(this.signal, "abort", { configurable: true, enumerable: true, writable: true, value: native(function () { this.aborted = true; this.__ls.slice().forEach(function (f) { try { f({ type: "abort", target: this }); } catch (e) {} }, this); }, "abort") });
    });
    def("AbortSignal", AbortSignal);
    def("AbortController", AbortController);

    // ── Blob / File / FileReader / FormData ───────────────────────────────
    var Blob = classFor("Blob", function (parts, opts) {
        opts = opts || {};
        var data = (parts || []).map(function (p) { return String(p); }).join("");
        this.size = data.length;
        this.type = String(opts.type || "");
        this.__data = data;
    });
    Object.defineProperty(Blob.prototype, "text", { configurable: true, enumerable: true, writable: true, value: native(function () { return Promise.resolve(this.__data || ""); }, "text") });
    Object.defineProperty(Blob.prototype, "arrayBuffer", { configurable: true, enumerable: true, writable: true, value: native(function () { return Promise.resolve(new ArrayBuffer(this.size || 0)); }, "arrayBuffer") });
    Object.defineProperty(Blob.prototype, "slice", { configurable: true, enumerable: true, writable: true, value: native(function () { return new Blob([]); }, "slice") });
    def("Blob", Blob);

    var File = classFor("File", function (parts, name, opts) { Blob.call(this, parts, opts); this.name = String(name); this.lastModified = (opts && opts.lastModified) || Date.now(); });
    File.prototype = Object.create(Blob.prototype);
    Object.defineProperty(File.prototype, "constructor", { value: File, writable: true, configurable: true });
    Object.defineProperty(File.prototype, Symbol.toStringTag, { value: "File", configurable: true });
    def("File", File);

    var FileReader = classFor("FileReader", function () { this.readyState = 0; this.result = null; this.error = null; this.__ls = {}; });
    ["LOADING", "EMPTY", "DONE"].forEach(function (n, i) { try { Object.defineProperty(FileReader, n, { value: [1, 2][i] || 0, configurable: true }); } catch (e) {} });
    ["readAsText", "readAsDataURL", "readAsArrayBuffer", "readAsBinaryString", "abort"].forEach(function (n) {
        Object.defineProperty(FileReader.prototype, n, { configurable: true, enumerable: true, writable: true, value: native(function () { this.readyState = 2; }, n) });
    });
    Object.defineProperty(FileReader.prototype, "addEventListener", { configurable: true, enumerable: true, writable: true, value: native(function (t, f) { (this.__ls[t] = this.__ls[t] || []).push(f); }, "addEventListener") });
    Object.defineProperty(FileReader.prototype, "removeEventListener", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "removeEventListener") });
    def("FileReader", FileReader);

    var FormData = classFor("FormData", function () { this.__d = []; });
    [["append", 2], ["set", 2], ["get", 1], ["getAll", 1], ["has", 1], ["delete", 1], ["forEach", 1], ["entries", 0], ["keys", 0], ["values", 0]].forEach(function (p) {
        Object.defineProperty(FormData.prototype, p[0], {
            configurable: true, enumerable: true, writable: true,
            value: native(function () {
                var a = Array.prototype.slice.call(arguments);
                if (p[0] === "append" || p[0] === "set") { this.__d.push([String(a[0]), a[1]]); return; }
                if (p[0] === "get") { for (var i = 0; i < this.__d.length; i++) if (this.__d[i][0] === String(a[0])) return this.__d[i][1]; return null; }
                if (p[0] === "getAll") { var o = []; for (var j = 0; j < this.__d.length; j++) if (this.__d[j][0] === String(a[0])) o.push(this.__d[j][1]); return o; }
                if (p[0] === "has") { for (var k = 0; k < this.__d.length; k++) if (this.__d[k][0] === String(a[0])) return true; return false; }
                if (p[0] === "delete") { this.__d = this.__d.filter(function (x) { return x[0] !== String(a[0]); }); return; }
                var arr = this.__d.slice(); return arr[Symbol.iterator]();
            }, p[0]),
        });
    });
    def("FormData", FormData);

    // ── MessageChannel / MessagePort / BroadcastChannel ───────────────────
    var MessagePort = classFor("MessagePort", function () { this.onmessage = null; this.__ls = []; });
    Object.defineProperty(MessagePort.prototype, "postMessage", { configurable: true, enumerable: true, writable: true, value: native(function (msg) { try { this.onmessage && this.onmessage({ data: msg }); } catch (e) {} }, "postMessage") });
    Object.defineProperty(MessagePort.prototype, "start", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "start") });
    Object.defineProperty(MessagePort.prototype, "close", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "close") });
    Object.defineProperty(MessagePort.prototype, "addEventListener", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "addEventListener") });
    Object.defineProperty(MessagePort.prototype, "removeEventListener", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "removeEventListener") });
    var MessageChannel = classFor("MessageChannel", function () { this.port1 = new MessagePort(); this.port2 = new MessagePort(); });
    def("MessagePort", MessagePort);
    def("MessageChannel", MessageChannel);

    var BroadcastChannel = classFor("BroadcastChannel", function (name) { this.name = String(name); this.onmessage = null; });
    Object.defineProperty(BroadcastChannel.prototype, "postMessage", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "postMessage") });
    Object.defineProperty(BroadcastChannel.prototype, "close", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "close") });
    Object.defineProperty(BroadcastChannel.prototype, "addEventListener", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "addEventListener") });
    def("BroadcastChannel", BroadcastChannel);

    // ── Worker / SharedWorker / EventSource（stub）───────────────────────
    var Worker = classFor("Worker", function (url) { this.__url = String(url); this.onmessage = null; });
    Object.defineProperty(Worker.prototype, "postMessage", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "postMessage") });
    Object.defineProperty(Worker.prototype, "terminate", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "terminate") });
    Object.defineProperty(Worker.prototype, "addEventListener", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "addEventListener") });
    def("Worker", Worker);
    def("SharedWorker", Worker);

    var EventSource = classFor("EventSource", function (url) { this.url = String(url); this.readyState = 0; this.withCredentials = false; this.onmessage = null; });
    Object.defineProperty(EventSource.prototype, "close", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "close") });
    Object.defineProperty(EventSource.prototype, "addEventListener", { configurable: true, enumerable: true, writable: true, value: native(function () {}, "addEventListener") });
    def("EventSource", EventSource);

    // ── Headers / Response ────────────────────────────────────────────────
    var Headers = classFor("Headers", function (init) {
        var self = this;
        Object.defineProperty(self, "__h", { value: {}, configurable: true, enumerable: false });
        if (Array.isArray(init)) init.forEach(function (p) { self.__h[String(p[0]).toLowerCase()] = String(p[1]); });
        else if (init && typeof init === "object") Object.keys(init).forEach(function (k) { self.__h[k.toLowerCase()] = String(init[k]); });
    });
    [["append", 2], ["delete", 1], ["get", 1], ["has", 1], ["set", 2]].forEach(function (p) {
        Object.defineProperty(Headers.prototype, p[0], {
            configurable: true, enumerable: true, writable: true,
            value: native(function () {
                var k = String(arguments[0]).toLowerCase();
                if (p[0] === "append" || p[0] === "set") { this.__h[k] = String(arguments[1]); return; }
                if (p[0] === "delete") { delete this.__h[k]; return; }
                if (p[0] === "has") return Object.prototype.hasOwnProperty.call(this.__h, k);
                return Object.prototype.hasOwnProperty.call(this.__h, k) ? this.__h[k] : null;
            }, p[0]),
        });
    });
    Object.defineProperty(Headers.prototype, "forEach", {
        configurable: true, enumerable: true, writable: true,
        value: native(function forEach(cb, th) { var h = this.__h; Object.keys(h).forEach(function (k) { cb.call(th, h[k], k, this); }, this); }, "forEach"),
    });
    ["entries", "keys", "values"].forEach(function (n) {
        Object.defineProperty(Headers.prototype, n, {
            configurable: true, enumerable: true, writable: true,
            value: native(function () {
                var h = this.__h, arr = [];
                Object.keys(h).forEach(function (k) { arr.push(n === "entries" ? [k, h[k]] : (n === "keys" ? k : h[k])); });
                return arr[Symbol.iterator]();
            }, n),
        });
    });
    try { Headers.prototype[Symbol.iterator] = Headers.prototype.entries; } catch (e) {}
    def("Headers", Headers);

    var Response = classFor("Response", function (body, init) {
        init = init || {};
        this.body = body == null ? null : body;
        this.status = init.status === undefined ? 200 : Number(init.status);
        this.statusText = String(init.statusText || "");
        this.ok = this.status >= 200 && this.status < 300;
        this.headers = new Headers(init.headers);
        this.url = String(init.url || "");
        this.redirected = false;
        this.type = "default";
        this.bodyUsed = false;
    });
    [["text", "text"], ["json", "json"], ["arrayBuffer", "arrayBuffer"], ["blob", "blob"]].forEach(function (p) {
        Object.defineProperty(Response.prototype, p[0], {
            configurable: true, enumerable: true, writable: true,
            value: native(function () {
                this.bodyUsed = true;
                var b = this.body;
                if (p[0] === "text") return Promise.resolve(b == null ? "" : String(b));
                if (p[0] === "json") { try { return Promise.resolve(typeof b === "string" ? JSON.parse(b) : b); } catch (e) { return Promise.reject(e); } }
                if (p[0] === "arrayBuffer") return Promise.resolve(new ArrayBuffer(0));
                return Promise.resolve(new Blob([b == null ? "" : String(b)]));
            }, p[0]),
        });
    });
    Object.defineProperty(Response.prototype, "clone", { configurable: true, enumerable: true, writable: true, value: native(function () { return new Response(this.body, { status: this.status, statusText: this.statusText }); }, "clone") });
    Response.json = native(function json(data, init) { return new Response(JSON.stringify(data), init); }, "json");
    Response.error = native(function error() { var r = new Response(null, { status: 0 }); return r; }, "error");
    Response.redirect = native(function redirect(url, status) { return new Response(null, { status: status || 302 }); }, "redirect");
    def("Response", Response);

    // ── structuredClone ───────────────────────────────────────────────────
    def("structuredClone", native(function structuredClone(v) {
        if (v === null || typeof v !== "object") return v;
        try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
    }, "structuredClone"));

    // ── postMessage / getSelection / Range / Selection ────────────────────
    def("postMessage", native(function postMessage() {}, "postMessage"));
    var Range = classFor("Range", function () { this.startContainer = null; this.endContainer = null; this.startOffset = 0; this.endOffset = 0; this.collapsed = true; });
    ["setStart", "setEnd", "setStartBefore", "setStartAfter", "setEndBefore", "setEndAfter", "selectNode", "selectNodeContents", "collapse", "detach", "deleteContents"].forEach(function (n) {
        Object.defineProperty(Range.prototype, n, { configurable: true, enumerable: true, writable: true, value: native(function () {}, n) });
    });
    Object.defineProperty(Range.prototype, "cloneContents", { configurable: true, enumerable: true, writable: true, value: native(function () { return null; }, "cloneContents") });
    def("Range", Range);
    var Selection = classFor("Selection", function () { this.rangeCount = 0; this.type = "None"; });
    ["getRangeAt", "addRange", "removeRange", "removeAllRanges", "collapse", "collapseToStart", "collapseToEnd", "extend", "selectAllChildren", "deleteFromDocument", "containsNode", "toString"].forEach(function (n) {
        Object.defineProperty(Selection.prototype, n, { configurable: true, enumerable: true, writable: true, value: native(function () { return n === "toString" ? "" : (n === "getRangeAt" ? null : undefined); }, n) });
    });
    def("Selection", Selection);
    def("getSelection", native(function getSelection() { return new Selection(); }, "getSelection"));

    // ── CSS / CSSStyleSheet / CSSRule ─────────────────────────────────────
    var CSSStyleSheet = classFor("CSSStyleSheet", function () { this.cssRules = []; });
    var CSSRule = classFor("CSSRule", function () {});
    var CSS = {};
    Object.defineProperty(CSS, "supports", { configurable: true, enumerable: true, writable: true, value: native(function supports() { return true; }, "supports") });
    Object.defineProperty(CSS, "escape", { configurable: true, enumerable: true, writable: true, value: native(function escape(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, function (c) { return "\\" + c; }); }, "escape") });
    def("CSS", CSS);
    def("CSSStyleSheet", CSSStyleSheet);
    def("CSSRule", CSSRule);

    // ── Image / Audio / Option ────────────────────────────────────────────
    function makeElementCtor(name, tag) {
        var C = classFor(name, function (w, h) {
            var el = document.createElement(tag);
            try { if (typeof w === "number") el.width = w; if (typeof h === "number") el.height = h; } catch (e) {}
            return el;
        });
        def(name, C);
        return C;
    }
    makeElementCtor("Image", "img");
    makeElementCtor("Audio", "audio");
    var Option = classFor("Option", function (text, value, defaultSelected, selected) {
        var el = document.createElement("option");
        if (text != null) el.text = String(text);
        if (value != null) el.value = String(value);
        if (defaultSelected) el.defaultSelected = !!defaultSelected;
        if (selected) el.selected = !!selected;
        return el;
    });
    def("Option", Option);

    // ── 滚动 / 对话框 / 焦点 ──────────────────────────────────────────────
    ["scroll", "scrollTo", "scrollBy", "open", "close", "print", "alert", "confirm", "prompt", "focus", "blur", "stop", "moveTo", "moveBy", "resizeTo", "resizeBy"].forEach(function (n) {
        if (typeof W[n] === "function") return;
        def(n, native(function () { return n === "confirm" ? false : (n === "prompt" ? null : undefined); }, n));
    });

    // ── requestIdleCallback ───────────────────────────────────────────────
    def("requestIdleCallback", native(function requestIdleCallback(fn) {
        if (typeof fn === "function") {
            var id = W.setTimeout(function () { fn({ didTimeout: false, timeRemaining: function () { return 50; } }); }, 1);
            return id;
        }
        return 0;
    }, "requestIdleCallback"));
    def("cancelIdleCallback", native(function cancelIdleCallback(id) { try { W.clearTimeout(id); } catch (e) {} }, "cancelIdleCallback"));

    // ── 观察者 ────────────────────────────────────────────────────────────
    function makeObserver(name) {
        var C = classFor(name, function (cb) { this.__cb = cb; this.__targets = []; });
        Object.defineProperty(C.prototype, "observe", { configurable: true, enumerable: true, writable: true, value: native(function (t) { this.__targets.push(t); }, "observe") });
        Object.defineProperty(C.prototype, "unobserve", { configurable: true, enumerable: true, writable: true, value: native(function (t) { var i = this.__targets.indexOf(t); if (i !== -1) this.__targets.splice(i, 1); }, "unobserve") });
        Object.defineProperty(C.prototype, "disconnect", { configurable: true, enumerable: true, writable: true, value: native(function () { this.__targets = []; }, "disconnect") });
        Object.defineProperty(C.prototype, "takeRecords", { configurable: true, enumerable: true, writable: true, value: native(function () { return []; }, "takeRecords") });
        def(name, C);
        return C;
    }
    makeObserver("IntersectionObserver");
    makeObserver("ResizeObserver");
    makeObserver("PerformanceObserver");
    makeObserver("ReportingObserver");

    // ── visualViewport / external / navigation / scheduler / customElements ─
    try {
        def("visualViewport", {
            width: 1280, height: 720, offsetLeft: 0, offsetTop: 0, pageLeft: 0, pageTop: 0, scale: 1,
            addEventListener: native(function () {}, "addEventListener"),
            removeEventListener: native(function () {}, "removeEventListener"),
        });
    } catch (e) {}
    try {
        def("external", { AddSearchProvider: native(function () {}, "AddSearchProvider"), IsSearchProviderInstalled: native(function () { return 0; }, "IsSearchProviderInstalled") });
    } catch (e) {}
    try {
        def("navigation", {
            type: "navigate", redirectCount: 0,
            canGoBack: false, canGoForward: false,
            addEventListener: native(function () {}, "addEventListener"),
            removeEventListener: native(function () {}, "removeEventListener"),
            entries: native(function () { return []; }, "entries"),
            currentEntry: null,
        });
    } catch (e) {}
    try {
        def("scheduler", {
            postTask: native(function (cb) { return Promise.resolve().then(cb); }, "postTask"),
            yield: native(function () { return Promise.resolve(); }, "yield"),
        });
    } catch (e) {}
    try {
        def("customElements", {
            define: native(function () {}, "define"),
            get: native(function () { return undefined; }, "get"),
            whenDefined: native(function () { return Promise.resolve(); }, "whenDefined"),
            upgrade: native(function () {}, "upgrade"),
        });
    } catch (e) {}
    try { def("speechSynthesis", { speak: native(function () {}, "speak"), cancel: native(function () {}, "cancel"), getVoices: native(function () { return []; }, "getVoices"), pause: native(function () {}, "pause"), resume: native(function () {}, "resume"), paused: false, speaking: false, pending: false, onvoiceschanged: null }); } catch (e) {}
    try { def("originAgentCluster", false); } catch (e) {}
    try { def("crossOriginIsolated", false); } catch (e) {}
    try { def("status", ""); } catch (e) {}
    try { def("trustedTypes", { createPolicy: native(function () { return { createHTML: function (s) { return String(s); }, createScript: function (s) { return String(s); }, createScriptURL: function (s) { return String(s); } }; }, "createPolicy") }); } catch (e) {}
    try { def("launchQueue", { setConsumer: native(function () {}, "setConsumer") }); } catch (e) {}
    try { def("reportError", native(function reportError() {}, "reportError")); } catch (e) {}

    // ── XMLSerializer ─────────────────────────────────────────────────────
    var XMLSerializer = classFor("XMLSerializer", function () {});
    Object.defineProperty(XMLSerializer.prototype, "serializeToString", {
        configurable: true, enumerable: true, writable: true,
        value: native(function (node) {
            try { if (node && node.outerHTML != null) return String(node.outerHTML); } catch (e) {}
            try { if (node && node.innerHTML != null) return String(node.innerHTML); } catch (e) {}
            return "";
        }, "serializeToString"),
    });
    def("XMLSerializer", XMLSerializer);

    // ── WebGL / 2D 类型 ───────────────────────────────────────────────────
    var WebGLRenderingContext = classFor("WebGLRenderingContext", function () {});
    var WebGL2RenderingContext = classFor("WebGL2RenderingContext", function () {});
    def("WebGLRenderingContext", WebGLRenderingContext);
    def("WebGL2RenderingContext", WebGL2RenderingContext);
    ["createProgram", "createShader", "shaderSource", "compileShader", "attachShader", "linkProgram", "useProgram", "getAttribLocation", "getUniformLocation", "enableVertexAttribArray", "vertexAttribPointer", "drawArrays", "drawElements", "clear", "clearColor", "viewport", "enable", "disable", "bindBuffer", "bufferData", "createBuffer", "getExtension", "deleteProgram", "deleteShader", "uniform1i", "uniform4fv", "uniformMatrix4fv"].forEach(function (n) {
        try { Object.defineProperty(WebGLRenderingContext.prototype, n, { configurable: true, enumerable: true, writable: true, value: native(function () { return n.indexOf("create") === 0 ? {} : undefined; }, n) }); } catch (e) {}
    });
    try {
        Object.defineProperty(WebGLRenderingContext.prototype, "getParameter", {
            configurable: true, enumerable: true, writable: true,
            value: native(function getParameter(p) {
                if (p === 37445) return "Google Inc. (NVIDIA)";
                if (p === 37446) return "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)";
                return 0;
            }, "getParameter"),
        });
        Object.defineProperty(WebGLRenderingContext.prototype, "getSupportedExtensions", { configurable: true, enumerable: true, writable: true, value: native(function () { return ["ANGLE_instanced_arrays", "EXT_blend_minmax", "WEBGL_debug_renderer_info"]; }, "getSupportedExtensions") });
        Object.defineProperty(WebGLRenderingContext.prototype, "getShaderPrecisionFormat", { configurable: true, enumerable: true, writable: true, value: native(function () { return { rangeMin: 127, rangeMax: 127, precision: 23 }; }, "getShaderPrecisionFormat") });
    } catch (e) {}

    var OffscreenCanvas = classFor("OffscreenCanvas", function (w, h) { this.width = w || 300; this.height = h || 150; });
    Object.defineProperty(OffscreenCanvas.prototype, "getContext", { configurable: true, enumerable: true, writable: true, value: native(function (t) { return t === "2d" ? (document.createElement("canvas").getContext("2d")) : null; }, "getContext") });
    def("OffscreenCanvas", OffscreenCanvas);
    var Path2D = classFor("Path2D", function () {});
    ["moveTo", "lineTo", "arc", "arcTo", "bezierCurveTo", "quadraticCurveTo", "rect", "closePath", "addPath", "ellipse"].forEach(function (n) {
        try { Object.defineProperty(Path2D.prototype, n, { configurable: true, enumerable: true, writable: true, value: native(function () {}, n) }); } catch (e) {}
    });
    def("Path2D", Path2D);
    var ImageData = classFor("ImageData", function (w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray((w | 0) * (h | 0) * 4); });
    def("ImageData", ImageData);
    var TextMetrics = classFor("TextMetrics", function () {});
    ["width", "actualBoundingBoxAscent", "actualBoundingBoxDescent", "actualBoundingBoxLeft", "actualBoundingBoxRight", "fontBoundingBoxAscent", "fontBoundingBoxDescent"].forEach(function (n) {
        try { Object.defineProperty(TextMetrics.prototype, n, { configurable: true, enumerable: true, get: native(function () { return 0; }, "get " + n) }); } catch (e) {}
    });
    def("TextMetrics", TextMetrics);
    var DOMMatrix = classFor("DOMMatrix", function (init) { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; });
    def("DOMMatrix", DOMMatrix);
})();
