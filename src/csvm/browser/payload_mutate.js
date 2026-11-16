// 载荷字节突变（仅 CSVM_PAY_MUT 时加载）
//
// 不改挑战源码，只在序列化器构造明文数组时（push 到 type-3 记录的第一个数据字节）
// 把一个字节换成另一个值。用于验证 type-3 的 data0 / data1 是否是服务端判据。
//   CSVM_PAY_MUT=67:0   → 把 type-3 的第一个数据字节 67 改成 0
(function () {
    var orig = Array.prototype.push;
    Array.prototype.push = new Proxy(orig, {
        apply: function (t, th, a) {
            try {
                var m = csvm.memory.config.payMut;
                // 明文载荷开头：push(3) → push(len) → push(data0)
                // 所以写 data0 时数组正好是 [3, len]
                if (m && th && th.length === 2 && th[0] === 3 &&
                    a.length === 1 && Number(a[0]) === m.from) {
                    a[0] = m.to;
                }
            } catch (e) {}
            return Reflect.apply(t, th, a);
        }
    });
})();
