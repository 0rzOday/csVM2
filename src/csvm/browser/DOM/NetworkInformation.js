var NetworkInformation = function NetworkInformation() {
    throw new TypeError("Illegal constructor");
};
csvm.safefunction(NetworkInformation, "NetworkInformation");

// 实例原型链
NetworkInformation.prototype.__proto__ = EventTarget.prototype;
// 构造器链
NetworkInformation.__proto__ = EventTarget;

/* #region AUTO:NetworkInformation.prototype */
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
    // onchange
    Object.defineProperty(NetworkInformation.prototype, "onchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onchange", 0),
        set: __autoFn("set onchange", 1),
    });
    // effectiveType
    Object.defineProperty(NetworkInformation.prototype, "effectiveType", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get effectiveType", 0,function(){
            return csvm.memory.connectionInfo["effectiveType"];
        }),
        set: undefined,
    });
    // rtt
    Object.defineProperty(NetworkInformation.prototype, "rtt", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get rtt", 0,function(){
            return csvm.memory.connectionInfo["rtt"];
        }),
        set: undefined,
    });
    // downlink
    Object.defineProperty(NetworkInformation.prototype, "downlink", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get downlink", 0,function(){
            return csvm.memory.connectionInfo["downlink"];
        }),
        set: undefined,
    });
    // saveData
    Object.defineProperty(NetworkInformation.prototype, "saveData", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get saveData", 0,function(){
            return csvm.memory.connectionInfo["saveData"];
        }),
        set: undefined,
    });
    // TODO constructor: NetworkInformation.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(NetworkInformation.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "NetworkInformation",
    });
})();
/* #endregion AUTO:NetworkInformation.prototype */
csvm.memory.connectionInfo = {
    effectiveType: "4g",
    rtt: 150,
    downlink: 1.45,
    saveData: false
};
csvm.memory.connection = Object.create(NetworkInformation.prototype);