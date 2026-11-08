// EventTarget：事件相关接口的根原型
var EventTarget = function EventTarget() {

};


/* #region AUTO:EventTarget.prototype */
(function () {
    // --- 生成代码公共辅助 ---------------------------------------------------
    const __autoHit = new Set();

    // 加载时抓一份原生 apply。目标之后改 Function.prototype.apply / Reflect.apply，
    // 也影响不到包装层，免得它看到框架内部的调用
    const __autoApply = Reflect.apply;

    // 第三个参数是手写实现：传了就用它，不再造空壳、不再打 debugger。
    // 伪装（safefunction）和代理（proxy）对它照样生效，指纹和日志与生成的一致。
    function __autoFn(name, length, impl) {
        let fn;
        if (typeof impl === "function") {
            // 方法简写包一层：普通函数表达式自带 prototype / arguments / caller，
            // 而且能被 new；原生 getter 只有 length / name，也不能构造。
            // 包一层后形状与原生一致，this 照常透传。
            fn = { [name](...args) { return __autoApply(impl, this, args); } }[name];
        } else {
            fn = { [name]() {
                if (!__autoHit.has(name)) {
                    __autoHit.add(name);
                    debugger;
                }
            } }[name];
        }

        Object.defineProperty(fn, "name", {
            value: name,
            writable: false,
            enumerable: false,
            configurable: true,
        });

        Object.defineProperty(fn, "length", {
            value: length,
            writable: false,
            enumerable: false,
            configurable: true,
        });

        // 顺序不能反：先包代理再伪装。
        // 原生 Function.prototype.toString 对 Proxy 只会给 "function () { [native code] }"，
        // 所以伪装的文本必须登记在代理对象上，否则名字会丢。
        if (typeof csvm === "undefined") return fn;

        // 代理背后的原始函数也登记伪造源码：
        // Error.prepareStackTrace 的 CallSite.getFunction() 可能拿到它
        if (csvm.safefunction) csvm.safefunction(fn, name);

        const wrapped = csvm.proxy ? csvm.proxy(fn, name) : fn;
        return csvm.safefunction ? csvm.safefunction(wrapped, name) : wrapped;
    }
    // addEventListener
    Object.defineProperty(EventTarget.prototype, "addEventListener", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("addEventListener", 2,function (type,listener){
            
        }),
    });
    // dispatchEvent
    Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("dispatchEvent", 1),
    });
    // removeEventListener
    Object.defineProperty(EventTarget.prototype, "removeEventListener", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeEventListener", 2),
    });
    // when
    Object.defineProperty(EventTarget.prototype, "when", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("when", 1),
    });
    // TODO constructor: EventTarget.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(EventTarget.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "EventTarget",
    });
})();
/* #endregion AUTO:EventTarget.prototype */


Object.defineProperty(EventTarget.prototype, Symbol.toStringTag, {
    value: "EventTarget",
    configurable: true
});

csvm.safefunction(EventTarget, "EventTarget");
// 调试代理（csvm.memory.config.proxy 为 false 时原样返回）
EventTarget = csvm.proxy(EventTarget, "EventTarget");
