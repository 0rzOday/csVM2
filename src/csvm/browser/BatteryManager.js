var BatteryManager = function BatteryManager() {
    throw new TypeError("Illegal constructor");
};
csvm.safefunction(BatteryManager, "BatteryManager");

// 实例原型链
BatteryManager.prototype.__proto__ = EventTarget.prototype;
// 构造器链
BatteryManager.__proto__ = EventTarget;

/* #region AUTO:BatteryManager.prototype */
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
    // charging
    Object.defineProperty(BatteryManager.prototype, "charging", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get charging", 0,function(){
            return true
        }),
        set: undefined,
    });
    // chargingTime
    Object.defineProperty(BatteryManager.prototype, "chargingTime", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get chargingTime", 0, function(){
            return 0;
        }),
        set: undefined,
    });
    // dischargingTime
    Object.defineProperty(BatteryManager.prototype, "dischargingTime", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get dischargingTime", 0, function(){
            return Infinity;
        }),
        set: undefined,
    });
    // level
    Object.defineProperty(BatteryManager.prototype, "level", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get level", 0, function(){
            return 1;
        }),
        set: undefined,
    });
    // onchargingchange
    Object.defineProperty(BatteryManager.prototype, "onchargingchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onchargingchange", 0),
        set: __autoFn("set onchargingchange", 1),
    });
    // onchargingtimechange
    Object.defineProperty(BatteryManager.prototype, "onchargingtimechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onchargingtimechange", 0),
        set: __autoFn("set onchargingtimechange", 1),
    });
    // ondischargingtimechange
    Object.defineProperty(BatteryManager.prototype, "ondischargingtimechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondischargingtimechange", 0),
        set: __autoFn("set ondischargingtimechange", 1),
    });
    // onlevelchange
    Object.defineProperty(BatteryManager.prototype, "onlevelchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onlevelchange", 0),
        set: __autoFn("set onlevelchange", 1),
    });
    // TODO constructor: BatteryManager.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(BatteryManager.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "BatteryManager",
    });
})();
/* #endregion AUTO:BatteryManager.prototype */

// 真机 BatteryManager.prototype.constructor 指向构造器
Object.defineProperty(BatteryManager.prototype, "constructor", {
    value: BatteryManager, writable: true, enumerable: false, configurable: true
});

// 单例 + 固定值（真机两次 getBattery 解析到同一个实例）
csvm.memory.batteryManager = Object.create(BatteryManager.prototype);

BatteryManager = csvm.proxy(BatteryManager, "BatteryManager");
