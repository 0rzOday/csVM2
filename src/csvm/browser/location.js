var location={};
var Location = function Location(){

}; csvm.safefunction(Location);
Object.defineProperty(Location.prototype,Symbol.toStringTag,{value:"Location",configurable:true});


/* #region AUTO:location */
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
    // valueOf
    Object.defineProperty(location, "valueOf", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: __autoFn("valueOf", 0),
    });
    // ancestorOrigins
    Object.defineProperty(location, "ancestorOrigins", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get ancestorOrigins", 0),
        set: undefined,
    });
    // href
    Object.defineProperty(location, "href", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get href", 0 ,function(){
            // 值不含引号：目标拿它拼 URL / 和 origin 比对
            return "https://www.cde.org.cn/";
        }),
        set: __autoFn("set href", 1),
    });
    // origin
    Object.defineProperty(location, "origin", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get origin", 0),
        set: undefined,
    });
    // protocol
    Object.defineProperty(location, "protocol", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get protocol", 0),
        set: __autoFn("set protocol", 1),
    });
    // host
    Object.defineProperty(location, "host", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get host", 0),
        set: __autoFn("set host", 1),
    });
    // hostname
    Object.defineProperty(location, "hostname", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get hostname", 0),
        set: __autoFn("set hostname", 1),
    });
    // port
    Object.defineProperty(location, "port", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get port", 0),
        set: __autoFn("set port", 1),
    });
    // pathname
    Object.defineProperty(location, "pathname", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get pathname", 0),
        set: __autoFn("set pathname", 1),
    });
    // search
    Object.defineProperty(location, "search", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get search", 0),
        set: __autoFn("set search", 1),
    });
    // hash
    Object.defineProperty(location, "hash", {
        configurable: false,
        enumerable: true,
        get: __autoFn("get hash", 0),
        set: __autoFn("set hash", 1),
    });
    // assign
    Object.defineProperty(location, "assign", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: __autoFn("assign", 1),
    });
    // reload
    Object.defineProperty(location, "reload", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: __autoFn("reload", 0,function(){
            return undefined;
        }),
    });
    // replace
    Object.defineProperty(location, "replace", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: __autoFn("replace", 1),
    });
    // toString
    Object.defineProperty(location, "toString", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: __autoFn("toString", 0),
    });
    // Symbol(Symbol.toPrimitive) (symbol)
    Object.defineProperty(location, Symbol.toPrimitive, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: undefined,
    });
})();
/* #endregion AUTO:location */


location.__proto__=Location.prototype;
location=csvm.proxy(location,"location");
csvm.memory.location=location;