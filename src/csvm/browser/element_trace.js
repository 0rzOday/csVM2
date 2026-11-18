// 元素属性读写监控（仅 CSVM_ELEM_TRACE=1 时加载）
//
// 对象代理只覆盖 window/document/navigator 等单例；元素的字段读取走原型上的
// accessor（getter/setter），不经过 Proxy 的 get 陷阱，所以默认日志里看不到
// `el.tagName` / `el.value` / `el.href` 这类访问。
//
// 这里在 DOM 原型上包装 accessor，把元素字段读写也纳入日志。默认关闭：
// 开启后会改变 accessor 的函数身份、并显著增加日志量，需先用载荷指纹确认
// 不影响接受性。
(function () {
    var wrappedSet = (typeof WeakSet === "function") ? new WeakSet() : null;

    function log(kind, self, key, val) {
        try {
            if (csvm.memory.suppressLog) return;
            if (csvm.memory.runPhase !== "challenge") return;
            if (typeof key !== "string") return;
            csvm.print.log(new csvm.print.print_infor(
                kind === "get" ? "[GET] (get)" : "[SET] (set)",
                self, key, val,
                new Date().toLocaleString(),
                "成功"
            ));
        } catch (e) {}
    }

    function wrapOne(proto, k, d) {
        if (d.get && wrappedSet && wrappedSet.has(d.get)) return;
        var ng = d.get, ns = d.set;
        if (typeof ng === "function") {
            ng = csvm.safefunction(function () {
                var r = d.get.call(this);
                log("get", this, k, r);
                return r;
            }, "get " + k);
            try { ng.__elemTrace = true; if (wrappedSet) wrappedSet.add(ng); } catch (e) {}
        }
        if (typeof ns === "function") {
            ns = csvm.safefunction(function (v) {
                var r = d.set.call(this, v);
                log("set", this, k, v);
                return r;
            }, "set " + k);
            try { ns.__elemTrace = true; if (wrappedSet) wrappedSet.add(ns); } catch (e) {}
        }
        try {
            Object.defineProperty(proto, k, {
                get: ng, set: ns,
                enumerable: d.enumerable, configurable: d.configurable,
            });
            wrappedCount++;
        } catch (e) {}
    }

    function wrapProto(proto) {
        if (!proto) return;
        var keys;
        try { keys = Object.getOwnPropertyNames(proto); } catch (e) { return; }
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (k === "constructor" || k.charAt(0) === "_") continue;
            var d;
            try { d = Object.getOwnPropertyDescriptor(proto, k); } catch (e) { continue; }
            if (!d || (!d.get && !d.set)) continue;
            wrapOne(proto, k, d);
        }
    }

    // 收集元素相关的构造器：Element / HTMLElement / HTMLXxxElement
    var wrappedCount = 0, protoCount = 0;
    var names = ["Element", "HTMLElement"], seen = Object.create(null);
    try {
        var all = Object.getOwnPropertyNames(globalThis);
        for (var i = 0; i < all.length; i++) {
            var n = all[i];
            if (/^HTML.*Element$/.test(n)) names.push(n);
        }
    } catch (e) {}
    for (var j = 0; j < names.length; j++) {
        var nm = names[j];
        if (seen[nm]) continue;
        seen[nm] = true;
        var C;
        try { C = globalThis[nm]; } catch (e) { continue; }
        if (typeof C !== "function" || !C.prototype) continue;
        protoCount++;
        wrapProto(C.prototype);
    }
    try { console.log("[ELEM-TRACE] installed protos=" + protoCount + " accessors=" + wrappedCount); } catch (e) {}
})();
