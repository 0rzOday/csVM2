var HTMLMetaElement = function HTMLMetaElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLMetaElement);
Object.defineProperty(HTMLMetaElement.prototype,Symbol.toStringTag,{value:"HTMLMetaElement",configurable:true});


/* #region AUTO:HTMLMetaElement.prototype */
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
    // name
    Object.defineProperty(HTMLMetaElement.prototype, "name", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get name", 0),
        set: __autoFn("set name", 1),
    });
    // httpEquiv
    Object.defineProperty(HTMLMetaElement.prototype, "httpEquiv", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get httpEquiv", 0),
        set: __autoFn("set httpEquiv", 1),
    });
    // content
    Object.defineProperty(HTMLMetaElement.prototype, "content", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get content", 0 ,function (){
            var thisNode=csvm.memory.Dom.get(this);
            if (thisNode){
                return thisNode["data"]["content"];
            }
            return "";
        }),
        set: __autoFn("set content", 1 ,function (value){
            var thisNode=csvm.memory.Dom.get(this);
            if (thisNode){
                thisNode["data"]["content"]=value;
            }
        }),
    });
    // media
    Object.defineProperty(HTMLMetaElement.prototype, "media", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get media", 0),
        set: __autoFn("set media", 1),
    });
    // scheme
    Object.defineProperty(HTMLMetaElement.prototype, "scheme", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scheme", 0),
        set: __autoFn("set scheme", 1),
    });
    // TODO constructor: HTMLMetaElement.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(HTMLMetaElement.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "HTMLMetaElement",
    });
})();
/* #endregion AUTO:HTMLMetaElement.prototype */


HTMLMetaElement.prototype.__proto__=HTMLElement.prototype;
HTMLMetaElement=csvm.proxy(HTMLMetaElement,"HTMLMetaElement");

// 注册 meta 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("meta", HTMLMetaElement);