// 整个明文载荷替换（仅 CSVM_PAY_REPLACE 时加载）
//
// 在序列化器把明文数组 push 完（长度达到最终值）后，把数组内容整体替换成外部载荷。
// 只 patch Array.prototype.push，不改挑战源码；加密入参（header/nonce）保持 own 的。
// 用途：判断 400 是否只由明文载荷决定。
(function () {
    var origPush = Array.prototype.push;
    Array.prototype.push = new Proxy(origPush, {
        apply: function (t, th, a) {
            var r = Reflect.apply(t, th, a);
            try {
                var B = csvm.memory.config.payReplace;
                if (B && th && typeof th.length === "number" && th.length >= 100 &&
                    th[0] === 3 && typeof th[1] === "number" && th[1] > 0 && th[1] < 200 &&
                    th.length !== B.length) {
                    // 第一次达到最终长度时替换；替换后 th.length === B.length，不会重复触发
                    var last = th.length;
                    var looksDone = true;
                    // 只有数组已经是一份完整 TLV（末尾能解析到 type 13）才替换
                    var i = 0;
                    while (i < last) {
                        var ty = th[i], ln = th[i + 1];
                        if (typeof ty !== "number" || typeof ln !== "number" || i + 2 + ln > last) { looksDone = false; break; }
                        i += 2 + ln;
                    }
                    if (looksDone && i === last) {
                        th.length = B.length;
                        for (var j = 0; j < B.length; j++) th[j] = B[j];
                    }
                }
            } catch (e) {}
            return r;
        }
    });
})();
