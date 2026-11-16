// 诊断：记录 String.fromCharCode 的大调用（P 生成阶段的明文/密钥候选）
(function () {
    var W = (typeof window !== "undefined") ? window : globalThis;
    var ON = W.__CSVM_FCC === true;
    try { delete W.__CSVM_FCC; } catch (e) {}
    if (!ON) return;
    var orig = String.fromCharCode;
    var seq = 0;
    var wrapped = function () {
        var n = arguments.length;
        var out;
        if (n >= 16) {
            try {
                var s = orig.apply(null, Array.prototype.slice.call(arguments, 0, 512));
                console.log("[FCC]" + (seq++) + "|" + n + "|" + String(s).slice(0, 200).replace(/[\r\n]/g, " "));
            } catch (e) {}
        }
        return orig.apply(String, arguments);
    };
    try { if (typeof csvm !== "undefined" && csvm.safefunction) csvm.safefunction(wrapped, "fromCharCode"); } catch (e) {}
    try { Object.defineProperty(String, "fromCharCode", { value: wrapped, writable: true, enumerable: false, configurable: true }); } catch (e) {}
    console.log("[FCC] hook installed");
})();
