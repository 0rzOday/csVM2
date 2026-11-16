// Math.random / cookie 写入打点（仅 CSVM_RAND_TRACE=1 时由 browser.node.js 加载）
//
// 目的：报告里「加密 key/IV 可能来自 Math.random 流」只是假设，这里把它变成数字：
// 记录每次 Math.random 的序号和值，并在挑战写 cookie（P / enable_）时打标记，
// 就能对比 own-DOM 与 jsdom「到写 P 为止消耗了多少个随机数、值序列是否一致」。
//
// 只在诊断时加载；开关由宿主在挑战脚本执行前打开（csvm.memory.config.randomTrace），
// 不往 window 写任何全局。
(function () {
    if (csvm.memory.__randomTraceInstalled) return;
    csvm.memory.__randomTraceInstalled = true;
    var log = csvm.memory.randomLog = csvm.memory.randomLog || [];
    var CAP = 200000;
    var idx = 0;

    function on() { return csvm.memory.config.randomTrace === true; }
    function push(e) { if (log.length < CAP) log.push(e); }

    var orig = Math.random;
    Math.random = new Proxy(orig, {
        apply: function (t, th, a) {
            var v = Reflect.apply(t, th, a);
            if (on()) { idx++; push(["r", idx, v]); }
            return v;
        }
    });

    function markCookie(v) {
        if (!on()) return;
        var s = String(v);
        var kind = s.indexOf("UA1L1zGonajvP=") >= 0 ? "P" : (s.indexOf("enable_UA1L1zGonajv") >= 0 ? "E" : "C");
        push(["c", idx, kind, s.slice(0, 90)]);
    }

    // document.cookie 的 accessor 在原型链上；包 setter，写 P/enable_ 时打标记
    function wrapCookie(proto) {
        for (var p = proto; p; p = Object.getPrototypeOf(p)) {
            var d;
            try { d = Object.getOwnPropertyDescriptor(p, "cookie"); } catch (e) { continue; }
            if (d && d.set) {
                try {
                    Object.defineProperty(p, "cookie", {
                        get: d.get,
                        set: function (v) { markCookie(v); return d.set.call(this, v); },
                        enumerable: d.enumerable,
                        configurable: true,
                    });
                } catch (e) {}
                return;
            }
        }
    }
    try { if (typeof document !== "undefined" && document) wrapCookie(Object.getPrototypeOf(document)); } catch (e) {}
})();
