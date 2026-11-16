// DOM 集合类型：NodeList / HTMLCollection / NamedNodeMap / DOMTokenList /
// DOMStringMap / StyleSheetList。
//
// 纯代码环境下这些集合以前直接返回普通 Array/Object，品牌检查
// （Object.prototype.toString / instanceof / constructor.name）会和真机对不上。
// 这里按真机形态实现：品牌在原型上、索引是自有属性、自有键为空。

// ── NodeList ────────────────────────────────────────────────────────────
function __indexed(obj, arr) {
    for (var i = 0; i < arr.length; i++) {
        (function (idx) {
            Object.defineProperty(obj, String(idx), {
                configurable: true, enumerable: true,
                get: function () { return arr[idx]; },
            });
        })(i);
    }
}
function __collectionCtor(name) {
    var C = function () { throw new TypeError("Illegal constructor"); };
    csvm.safefunction(C, name);
    Object.defineProperty(C.prototype, Symbol.toStringTag, { value: name, configurable: true });
    Object.defineProperty(C.prototype, "item", {
        configurable: true, enumerable: true, writable: true,
        value: csvm.safefunction(function item(i) {
            var a = this.__arr || [];
            i = Number(i) | 0;
            return i >= 0 && i < a.length ? a[i] : null;
        }, "item"),
    });
    Object.defineProperty(C.prototype, "length", {
        configurable: true, enumerable: true,
        get: function () { return (this.__arr || []).length; },
    });
    return C;
}
var NodeList = __collectionCtor("NodeList");
function __makeCollection(C, arr) {
    var a = Array.prototype.slice.call(arr || []);
    var o = Object.create(C.prototype);
    Object.defineProperty(o, "__arr", { value: a, configurable: true, writable: true, enumerable: false });
    __indexed(o, a);
    // 真机 HTMLCollection 支持按 id/name 直接取值（document.forms.__xxx、forms.username）
    for (var i = 0; i < a.length; i++) {
        var el = a[i], nm = null;
        try { nm = el.id || el.name || (el.getAttribute && el.getAttribute("name")); } catch (e) {}
        if (!nm || (nm in C.prototype) || /^\d+$/.test(nm)) continue;
        try {
            (function (node) {
                Object.defineProperty(o, nm, {
                    configurable: true, enumerable: false,
                    get: function () { return node; },
                });
            })(el);
        } catch (e) {}
    }
    return o;
}
csvm.makeNodeList = function (arr) { return __makeCollection(NodeList, arr); };

// ── 活集合 ─────────────────────────────────────────────────────────────
// 真机 HTMLCollection（children / getElementsBy*）是活的：持有引用后再改 DOM，
// length / 索引会跟着变。这里用 Proxy 把读取转发给一个取数函数。
function __makeLiveCollection(C, fn) {
    var target = Object.create(C.prototype);
    function arr() { try { return Array.prototype.slice.call(fn() || []); } catch (e) { return []; } }
    return new Proxy(target, {
        get: function (t, k, r) {
            if (k === "__arr") return arr();
            if (typeof k === "string" && /^\d+$/.test(k)) return arr()[Number(k)];
            return Reflect.get(t, k, r);
        },
        has: function (t, k) {
            if (typeof k === "string" && /^\d+$/.test(k)) return Number(k) < arr().length;
            return Reflect.has(t, k);
        },
        ownKeys: function (t) {
            var a = arr(), ks = [];
            for (var i = 0; i < a.length; i++) ks.push(String(i));
            return ks;
        },
        getOwnPropertyDescriptor: function (t, k) {
            if (typeof k === "string" && /^\d+$/.test(k)) {
                var a = arr();
                if (Number(k) < a.length) return { value: a[Number(k)], enumerable: true, configurable: true, writable: false };
            }
            return Reflect.getOwnPropertyDescriptor(t, k);
        },
    });
}
csvm.makeLiveHTMLCollection = function (fn) { return __makeLiveCollection(HTMLCollection, fn); };
csvm.makeLiveNodeList = function (fn) { return __makeLiveCollection(NodeList, fn); };

// ── HTMLCollection ──────────────────────────────────────────────────────
var HTMLCollection = __collectionCtor("HTMLCollection");
Object.defineProperty(HTMLCollection.prototype, "namedItem", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function namedItem(name) {
        var a = this.__arr || [];
        for (var i = 0; i < a.length; i++) {
            var el = a[i];
            var id = null;
            try { id = el.id || (el.getAttribute && el.getAttribute("name")); } catch (e) {}
            if (id === String(name)) return el;
        }
        return null;
    }, "namedItem"),
});
csvm.makeHTMLCollection = function (arr) { return __makeCollection(HTMLCollection, arr); };

// ── Attr ────────────────────────────────────────────────────────────────
var Attr = function Attr() { throw new TypeError("Illegal constructor"); };
csvm.safefunction(Attr, "Attr");
Object.defineProperty(Attr.prototype, Symbol.toStringTag, { value: "Attr", configurable: true });
csvm.makeAttr = function (name, value, owner, ns) {
    var a = Object.create(Attr.prototype);
    try {
        Object.defineProperty(a, "name", { value: String(name), enumerable: true, configurable: true });
        Object.defineProperty(a, "localName", { value: String(name), enumerable: true, configurable: true });
        Object.defineProperty(a, "nodeName", { value: String(name), enumerable: true, configurable: true });
        Object.defineProperty(a, "prefix", { value: null, enumerable: true, configurable: true });
        Object.defineProperty(a, "namespaceURI", { value: ns || null, enumerable: true, configurable: true });
        Object.defineProperty(a, "specified", { value: true, enumerable: true, configurable: true });
        Object.defineProperty(a, "ownerElement", { value: owner || null, enumerable: true, configurable: true });
        Object.defineProperty(a, "nodeType", { value: 2, enumerable: true, configurable: true });
        Object.defineProperty(a, "value", { value: value == null ? "" : String(value), enumerable: true, writable: true, configurable: true });
        Object.defineProperty(a, "nodeValue", { value: value == null ? "" : String(value), enumerable: true, writable: true, configurable: true });
    } catch (e) {}
    return a;
};

// ── NamedNodeMap ────────────────────────────────────────────────────────
var NamedNodeMap = __collectionCtor("NamedNodeMap");
Object.defineProperty(NamedNodeMap.prototype, "getNamedItem", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function getNamedItem(n) {
        var a = this.__arr || [];
        for (var i = 0; i < a.length; i++) if (a[i] && a[i].name === String(n)) return a[i];
        return null;
    }, "getNamedItem"),
});
csvm.makeNamedNodeMap = function (arr) { return __makeCollection(NamedNodeMap, arr); };

// ── DOMTokenList（classList）────────────────────────────────────────────
var __tlState = new WeakMap();
var DOMTokenList = function DOMTokenList() { throw new TypeError("Illegal constructor"); };
csvm.safefunction(DOMTokenList, "DOMTokenList");
Object.defineProperty(DOMTokenList.prototype, Symbol.toStringTag, { value: "DOMTokenList", configurable: true });
Object.defineProperty(DOMTokenList.prototype, "length", {
    configurable: true, enumerable: true,
    get: function () { return (__tlState.get(this) || { tokens: [] }).tokens.length; },
});
Object.defineProperty(DOMTokenList.prototype, "value", {
    configurable: true, enumerable: true,
    get: function () { return (__tlState.get(this) || { tokens: [] }).tokens.join(" "); },
    set: function (v) { var s = __tlState.get(this); if (s) s.set(String(v)); },
});
["add", "remove", "toggle", "contains", "replace", "item", "toString", "forEach"].forEach(function (name) {
    Object.defineProperty(DOMTokenList.prototype, name, {
        configurable: true, enumerable: true, writable: true,
        value: csvm.safefunction(function () {
            var s = __tlState.get(this);
            var args = Array.prototype.slice.call(arguments);
            if (!s) return name === "contains" ? false : name === "item" ? null : undefined;
            switch (name) {
                case "contains": return s.tokens.indexOf(String(args[0])) !== -1;
                case "item": return s.tokens[Number(args[0]) | 0] || null;
                case "toString": return s.tokens.join(" ");
                case "toggle": {
                    var t = String(args[0]), has = s.tokens.indexOf(t) !== -1;
                    if (has) s.tokens.splice(s.tokens.indexOf(t), 1); else s.tokens.push(t);
                    s.sync(); return !has;
                }
                case "add": args.forEach(function (t) { t = String(t); if (s.tokens.indexOf(t) === -1) s.tokens.push(t); }); s.sync(); return undefined;
                case "remove": args.forEach(function (t) { t = String(t); var i = s.tokens.indexOf(t); if (i !== -1) s.tokens.splice(i, 1); }); s.sync(); return undefined;
                case "replace": {
                    var o = String(args[0]), n = String(args[1]), i2 = s.tokens.indexOf(o);
                    if (i2 !== -1) { if (n) s.tokens[i2] = n; else s.tokens.splice(i2, 1); s.sync(); return true; }
                    return false;
                }
                case "forEach": s.tokens.forEach(function (t, i) { args[0].call(args[1], t, i, this); }, this); return undefined;
            }
        }, name),
    });
});
csvm.makeClassList = function (el) {
    var o = Object.create(DOMTokenList.prototype);
    function read() { try { return String(el.getAttribute("class") || "").split(/\s+/).filter(Boolean); } catch (e) { return []; } }
    var s = {
        tokens: read(),
        set: function (v) { s.tokens = String(v).split(/\s+/).filter(Boolean); s.sync(); },
        sync: function () { try { el.setAttribute("class", s.tokens.join(" ")); } catch (e) {} },
    };
    __tlState.set(o, s);
    return o;
};

// ── DOMStringMap（dataset）──────────────────────────────────────────────
var __dsState = new WeakMap();
var DOMStringMap = function DOMStringMap() { throw new TypeError("Illegal constructor"); };
csvm.safefunction(DOMStringMap, "DOMStringMap");
Object.defineProperty(DOMStringMap.prototype, Symbol.toStringTag, { value: "DOMStringMap", configurable: true });
csvm.makeDataset = function (el) {
    var target = {};
    var handler = {
        get: function (t, k) {
            if (typeof k !== "string" || k === "constructor") return Reflect.get(t, k);
            var n = "data-" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
            var v = null;
            try { v = el.getAttribute(n); } catch (e) {}
            return v === null ? undefined : v;
        },
        set: function (t, k, v) {
            if (typeof k !== "string") { t[k] = v; return true; }
            var n = "data-" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
            try { el.setAttribute(n, String(v)); } catch (e) {}
            return true;
        },
        has: function (t, k) {
            if (typeof k !== "string" || k === "constructor") return k in t;
            try { return el.hasAttribute("data-" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); })); } catch (e) { return false; }
        },
        deleteProperty: function (t, k) {
            if (typeof k !== "string") return delete t[k];
            try { el.removeAttribute("data-" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); })); } catch (e) {}
            return true;
        },
        ownKeys: function (t) {
            var out = [];
            try {
                var names = el.getAttributeNames ? el.getAttributeNames() : [];
                for (var i = 0; i < names.length; i++) {
                    var n = names[i];
                    if (n.indexOf("data-") === 0) out.push(n.slice(5).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }));
                }
            } catch (e) {}
            return out;
        },
        getOwnPropertyDescriptor: function (t, k) {
            if (typeof k !== "string" || k === "constructor") return Reflect.getOwnPropertyDescriptor(t, k);
            var has = false;
            try { has = el.hasAttribute && el.hasAttribute("data-" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); })); } catch (e) {}
            if (!has) return undefined;
            return { value: handler.get(t, k), writable: true, enumerable: true, configurable: false };
        },
    };
    var p = new Proxy(target, handler);
    Object.setPrototypeOf(p, DOMStringMap.prototype);
    __dsState.set(p, el);
    return p;
};

// ── StyleSheetList ──────────────────────────────────────────────────────
var StyleSheetList = __collectionCtor("StyleSheetList");
csvm.makeStyleSheetList = function (arr) { return __makeCollection(StyleSheetList, arr || []); };
