// 原生函数源码自检 / 修复
// vm2 沙箱里部分内建函数的 toString 会丢掉名字：
//   真机：function eval() { [native code] }
//   vm2 ：function ()     { [native code] }
// 目标只要比对一次源码就能看出环境被动过（瑞数的 _$a9 就是专门查 eval 的）。
// 这里在框架加载完统一扫一遍全局，把「自称原生但格式不对」的函数修回原样。
;(()=>{
    "use strict";

    // 兼容两种执行方式（拼接进 vm 沙箱 / Node 里 require）
    const root = typeof globalThis !== "undefined" ? globalThis : this;
    const store = typeof csvm !== "undefined" ? csvm : (root.csvm = root.csvm || {});
    if (typeof module !== "undefined" && module.exports) module.exports = store;

    // 取当前沙箱里的 Function.prototype.toString（可能已被 vm_safefunction 换过）
    const $toString = Function.prototype.toString;
    const NATIVE = "[native code]";

    function expectText(name) {
        return "function " + name + "() { " + NATIVE + " }";
    }

    // 只修「源码自称原生、但格式不对」的函数。
    // 源码是真的 JS 说明这是自己写的函数：伪造源码属于掩耳盗铃，
    // 单独记进 exposed，说明有东西泄漏到全局了，该去查闭包而不是遮。
    store.nativeText = {
        repairAll: function (target) {
            target = target || root;
            // 修复记录跨多次调用累加：加载完扫一次、清理完再扫一次，
            // 第二次能看到的东西更少，但「修过哪些」不该被覆盖掉
            const prev = (store.memory && store.memory.nativeText) || { repaired: [] };
            const repaired = new Set(prev.repaired || []);
            const exposed = [];

            let keys;
            try { keys = Reflect.ownKeys(target); } catch (e) { keys = []; }

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (typeof key !== "string") continue;   // symbol 属性上不会是函数值

                let value;
                try { value = target[key]; } catch (e) { continue; }   // getter 抛错就跳过
                if (typeof value !== "function") continue;

                let text;
                try { text = $toString.call(value); } catch (e) { continue; }

                // 真源码：不动，只记录
                if (text.indexOf(NATIVE) === -1) {
                    exposed.push(key);
                    continue;
                }
                // 已经是标准格式（重复调用时走这里）
                if (text === expectText(value.name || key)) continue;

                try {
                    store.safefunction(value, value.name || key);
                    repaired.add(key);
                } catch (e) {
                    // name 不可配置就跳过；源码文本已经由 safefunction 写进 WeakMap 了
                }
            }

            const report = { repaired: Array.from(repaired), exposed: exposed };
            if (store.memory) store.memory.nativeText = report;
            return report;
        },
        // 手动看结果：csvm.nativeText.report()
        report: function () {
            const r = (store.memory && store.memory.nativeText) || { repaired: [], exposed: [] };
            console.log("修复的原生函数:", r.repaired.length, r.repaired);
            console.log("泄漏源码的函数 :", r.exposed.length, r.exposed);
            return r;
        }
    };
})();
