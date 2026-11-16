// 载荷数组构造打点（仅 CSVM_PUSH_TRACE=1 时加载）
//
// type-9 的 [8,0] vs [0] 是唯一剩下的结构性差异，但产生 8 的 helper 是间接调用，
// 普通 call 事件抓不到。这里直接看序列化器构造明文数组的那一下：
// 当 push/concat 的目标是一个“全是数字、长度 >= 30”的数组时，记录参数和调用栈。
(function () {
    var CAP = 2000;
    var n = 0;
    var ids = new WeakMap();
    var nextId = 1;
    function on() { return csvm.memory.config.pushTrace === true; }
    function numeric(a) {
        if (!a || typeof a.length !== "number" || a.length < 30) return false;
        for (var i = 0; i < a.length && i < 400; i++) {
            if (typeof a[i] !== "number") return false;
        }
        // 明文载荷的第一条记录是 type 3；用它把别的数字数组过滤掉
        if (a[0] !== 3 || typeof a[1] !== "number" || a[1] <= 0 || a[1] > 200) return false;
        return true;
    }
    function stack() {
        try {
            var lines = String(new Error().stack || "").split(String.fromCharCode(10));
            var out = [];
            for (var i = 1; i < lines.length && out.length < 20; i++) {
                var l = lines[i];
                if (l.indexOf("push_trace") !== -1) continue;
                out.push(l.trim());
            }
            return out.join(" >> ");
        } catch (e) { return ""; }
    }
    function head(a, count) {
        var s = [];
        for (var i = 0; i < a.length && i < count; i++) s.push(a[i]);
        return s.join(",");
    }
    function tail(a, count) {
        var s = [];
        for (var i = Math.max(0, a.length - count); i < a.length; i++) s.push(a[i]);
        return s.join(",");
    }
    function log(kind, a, args) {
        if (n++ >= CAP) return;
        var id = ids.get(a);
        if (!id) { id = nextId++; ids.set(a, id); }
        var a2 = [];
        for (var i = 0; i < args.length && i < 12; i++) {
            var v = args[i];
            if (Array.isArray(v)) {
                var inner = [];
                for (var j = 0; j < v.length && j < 12; j++) inner.push(v[j]);
                a2.push("arr[" + inner.join(",") + (v.length > 12 ? ",..." : "") + "]");
            } else a2.push(String(v));
        }
        console.log("[PUSH] id=" + id + " " + kind + " len=" + a.length + " head=[" + head(a, 6) + "] tail=[" + tail(a, 6) + "] args=" + a2.join(",") + " stack=" + stack());
    }
    function wrap(name) {
        var orig = Array.prototype[name];
        if (typeof orig !== "function") return;
        Array.prototype[name] = new Proxy(orig, {
            apply: function (t, th, args) {
                try {
                    if (on() && numeric(th)) log(name, th, args);
                } catch (e) {}
                return Reflect.apply(t, th, args);
            }
        });
    }
    wrap("push");
    wrap("unshift");
    wrap("concat");
})();
