// 明文载荷干净抓取（仅 CSVM_PAY_CAP=1 时加载）
//
// 只 patch Array.prototype.push，不改挑战源码。当某个数字数组被 push 成一份
// 完整的 TLV（末尾正好解析到 type 13）时，把它整份快照打印出来。
// 与 payload_replace.js 的区别：这里不替换任何内容，只观测。
(function () {
    var origPush = Array.prototype.push;
    var lastStr = null;
    Array.prototype.push = new Proxy(origPush, {
        apply: function (t, th, a) {
            var r = Reflect.apply(t, th, a);
            try {
                if (csvm.memory.config.payCap !== true) return r;
                if (!(th && typeof th.length === "number" && th.length >= 100 &&
                    th[0] === 3 && typeof th[1] === "number" && th[1] > 0 && th[1] < 200)) return r;
                var L = th.length, i = 0, ok = true;
                while (i < L) {
                    var ty = th[i], ln = th[i + 1];
                    if (typeof ty !== "number" || typeof ln !== "number" || i + 2 + ln > L) { ok = false; break; }
                    i += 2 + ln;
                }
                if (!ok || i !== L) return r;
                // 注意：不能用 cp.push()，否则会递归进本钩子（Array.prototype.push 已被替换）
                var cp = [];
                for (var j = 0; j < L; j++) cp[j] = th[j];
                var sj = cp.join(",");
                if (sj !== lastStr) {
                    lastStr = sj;
                    console.log("[PAYLOAD-CAP] " + JSON.stringify(cp));
                }
            } catch (e) {}
            return r;
        }
    });
})();
