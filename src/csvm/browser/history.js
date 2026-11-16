var history={};
var History = function History(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(History);
Object.defineProperty(History.prototype,Symbol.toStringTag,{value:"History",configurable:true});
history.__proto__=History.prototype;

/* #region AUTO:History.prototype */
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
    // length
    Object.defineProperty(History.prototype, "length", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get length", 0),
        set: undefined,
    });
    // scrollRestoration
    Object.defineProperty(History.prototype, "scrollRestoration", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollRestoration", 0),
        set: __autoFn("set scrollRestoration", 1),
    });
    // state
    Object.defineProperty(History.prototype, "state", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get state", 0),
        set: undefined,
    });
    // back
    Object.defineProperty(History.prototype, "back", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("back", 0),
    });
    // forward
    Object.defineProperty(History.prototype, "forward", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("forward", 0),
    });
    // go
    Object.defineProperty(History.prototype, "go", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("go", 0),
    });
    // pushState
    Object.defineProperty(History.prototype, "pushState", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("pushState", 2),
    });
    // replaceState
    Object.defineProperty(History.prototype, "replaceState", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceState", 2,function(state,unused){
            csvm.memory.historyState = state;
            return undefined;
        }),
    });
    // TODO constructor: History.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(History.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "History",
    });
})();
/* #endregion AUTO:History.prototype */

history=csvm.proxy(history);
History=csvm.proxy(History);