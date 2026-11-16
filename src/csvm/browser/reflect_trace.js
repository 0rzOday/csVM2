// 反射调用追踪（仅 CSVM_REFLECT_TRACE=1 时由 browser.node.js 加载）
//
// 目的：挑战做环境探测时，除了读 DOM 方法/getter，还会用反射内建摸对象：
//   Object.getOwnPropertyNames / getOwnPropertyDescriptor / keys / getPrototypeOf
//   Reflect.ownKeys / getOwnPropertyDescriptor / getPrototypeOf
//   Object.prototype.hasOwnProperty / propertyIsEnumerable
// 现有 dom_trace 只包 DOM 原型上的方法/getter，看不到这一层。
//
// 做法：只包裹内建函数，不改挑战源码；用 safefunction 保持原生外观；
// 记录到 csvm.memory.reflectLog，由宿主侧 api.getReflectLog() 落盘。
// 只记录“挑战发起”的调用（栈里最近的非框架帧是挑战），框架自身调用丢弃。
(function () {
    var W = (typeof window !== "undefined") ? window : globalThis;
    var log = csvm.memory.reflectLog = [];
    var CAP = 100000;
    var inHook = false;

    function fromChallenge() {
        try {
            var st = String(new Error().stack || "");
            var lines = st.split(String.fromCharCode(10));
            // 0: Error, 1: fromChallenge, 2: 包装函数；从调用者开始判断
            for (var i = 3; i < lines.length; i++) {
                var l = lines[i];
                if (l.indexOf("框架:") !== -1 || l.indexOf("vm_proxy") !== -1) return false;
                if (l.indexOf("<anonymous>") !== -1 ||
                    l.indexOf("script[") !== -1 ||
                    l.indexOf("eval at") !== -1 ||
                    l.indexOf("外部脚本") !== -1) return true;
            }
            return false;
        } catch (e) { return false; }
    }

    function tagOf(o) {
        try {
            if (o === null) return "null";
            if (o === undefined) return "undefined";
            var t = typeof o;
            if (t === "function") return "fn:" + String(o.name || "");
            if (o === W) return "window";
            try { if (o === W.document) return "document"; } catch (e) {}
            try { if (o === W.navigator) return "navigator"; } catch (e) {}
            var tag;
            try { tag = Object.prototype.toString.call(o); } catch (e) { tag = "[?]"; }
            var nm = "";
            try { if (o && o.nodeType) nm = ":" + String(o.nodeName || o.nodeType); } catch (e) {}
            return tag + nm;
        } catch (e) { return "?"; }
    }
    function sumList(v) {
        try {
            if (v === null || v === undefined || typeof v.length !== "number") return String(v);
            var a = [];
            for (var i = 0; i < v.length && i < 10; i++) a.push(String(v[i]));
            return "n" + v.length + ":" + a.join(",");
        } catch (e) { return "ERR"; }
    }
    function sumDesc(d) {
        try {
            if (!d) return "none";
            var k = d.get ? "g" : (d.set ? "s" : "v");
            var g = "";
            if (d.get) {
                try {
                    g = "get:" + String(d.get.name || "") + ":" +
                        (Function.prototype.toString.call(d.get).indexOf("[native code]") >= 0 ? "N" : "J");
                } catch (e) { g = "get:ERR"; }
            }
            return k + "/e" + (d.enumerable ? 1 : 0) + "/c" + (d.configurable ? 1 : 0) +
                "/w" + (d.writable ? 1 : 0) + (g ? "/" + g : "");
        } catch (e) { return "ERR"; }
    }

    function push(op, target, prop, ret) {
        if (log.length >= CAP) { csvm.memory.reflectOverflow = true; return; }
        try { log.push([op, tagOf(target), prop === undefined ? "" : String(prop), String(ret)]); } catch (e) {}
    }

    function wrap(holder, name, op, summarize) {
        try {
            var orig = holder[name];
            if (typeof orig !== "function") return;
            var fn = function () {
                var a = arguments;
                var was = inHook;
                inHook = true;
                var out;
                try {
                    out = Reflect.apply(orig, this, a);
                } finally {
                    inHook = was;
                }
                if (!was && csvm.memory.config.reflectTrace && fromChallenge()) {
                    var r;
                    try { r = summarize(out); } catch (e) { r = "ERR"; }
                    push(op, a[0], a.length > 1 ? a[1] : undefined, r);
                }
                return out;
            };
            try { csvm.safefunction(fn, name); } catch (e) {}
            Object.defineProperty(holder, name, {
                value: fn, writable: true, enumerable: false, configurable: true,
            });
        } catch (e) {}
    }

    wrap(Object, "getOwnPropertyNames", "gopn", sumList);
    wrap(Object, "getOwnPropertySymbols", "gops", sumList);
    wrap(Object, "keys", "keys", sumList);
    wrap(Object, "getOwnPropertyDescriptor", "gopd", sumDesc);
    wrap(Object, "getOwnPropertyDescriptors", "gopds", sumList);
    wrap(Object, "getPrototypeOf", "gpo", tagOf);
    wrap(Object, "isExtensible", "ext", function (v) { return String(v); });
    wrap(Reflect, "ownKeys", "rown", sumList);
    wrap(Reflect, "getOwnPropertyDescriptor", "rgopd", sumDesc);
    wrap(Reflect, "getPrototypeOf", "rgpo", tagOf);
    wrap(Object.prototype, "hasOwnProperty", "hasOwn", function (v) { return String(v); });
    wrap(Object.prototype, "propertyIsEnumerable", "pie", function (v) { return String(v); });
})();
