;(()=>{
    "use strict";

    // 原生 toString 的引用：没伪装过的函数还走它
    const $toString = Function.prototype.toString;

    // 伪造的源码文本挂在 WeakMap 上，而不是往函数自身写：
    // 函数上不留任何自有 symbol，Reflect.ownKeys / getOwnPropertySymbols 与原生一致
    const fakeText = new WeakMap();

    // 方法简写取出：没有自有 prototype、不能 new，
    // 和原生 Function.prototype.toString 的形状一致
    const myToString = {
        toString() {
            if (typeof this === "function") {
                const text = fakeText.get(this);
                if (text !== undefined) return text;
            }
            return $toString.call(this);
        }
    }.toString;

    // 直接覆盖已有属性，不 delete：
    // 键顺序保持在原生位置（Function.prototype 上 toString 仍是最后一个字符串键）
    Object.defineProperty(Function.prototype, "toString", {
        "enumerable": false,
        "configurable": true,
        "writable": true,
        "value": myToString
    });
    Object.defineProperty(myToString, "name", {
        "enumerable": false,
        "configurable": true,
        "writable": false,
        "value": "toString"
    });
    fakeText.set(myToString, "function toString() { [native code] }");

    // 兼容两种执行方式：
    //   1) 拼接进 vm 沙箱执行：csvm 是外层闭包里 vm_memory.js 建的那个对象，直接复用。
    //      不能再写 globalThis.csvm —— 那会在 window 上凭空多出一个 csvm，目标会扫到。
    //   2) Node 里 require：没有外层 csvm，才挂到 globalThis 并作为模块导出
    const root = typeof globalThis !== "undefined" ? globalThis : this;
    const store = typeof csvm !== "undefined" ? csvm : (root.csvm = root.csvm || {});
    if (typeof module !== "undefined" && module.exports) module.exports = store;

    // 只登记源码文本，不往函数上写任何东西；
    // 传了 name 就用原生 descriptor 补上，不会把 writable 改成 true
    store.safefunction = (func, name) => {
        fakeText.set(func, `function ${name || func.name || ''}() { [native code] }`);
        if (name) {
            Object.defineProperty(func, "name", {
                "enumerable": false,
                "configurable": true,
                "writable": false,
                "value": name
            });
        }
        return func; // 支持 window.xxx = csvm.safefunction(fn) 的写法
    };
})();
