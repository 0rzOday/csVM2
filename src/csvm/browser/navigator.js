navigator = {};

var Navigator = function Navigator() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Navigator);
Object.defineProperty(Navigator.prototype, Symbol.toStringTag, { value: "Navigator", configurable: true });


/* #region AUTO:Navigator.prototype */
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
    // vendorSub
    Object.defineProperty(Navigator.prototype, "vendorSub", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get vendorSub", 0),
        set: undefined,
    });
    // productSub
    Object.defineProperty(Navigator.prototype, "productSub", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get productSub", 0),
        set: undefined,
    });
    // vendor
    Object.defineProperty(Navigator.prototype, "vendor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get vendor", 0),
        set: undefined,
    });
    // maxTouchPoints
    Object.defineProperty(Navigator.prototype, "maxTouchPoints", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get maxTouchPoints", 0),
        set: undefined,
    });
    // scheduling
    Object.defineProperty(Navigator.prototype, "scheduling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scheduling", 0),
        set: undefined,
    });
    // userActivation
    Object.defineProperty(Navigator.prototype, "userActivation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get userActivation", 0),
        set: undefined,
    });
    // geolocation
    Object.defineProperty(Navigator.prototype, "geolocation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get geolocation", 0),
        set: undefined,
    });
    // doNotTrack
    Object.defineProperty(Navigator.prototype, "doNotTrack", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get doNotTrack", 0),
        set: undefined,
    });
    // webkitTemporaryStorage
    Object.defineProperty(Navigator.prototype, "webkitTemporaryStorage", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitTemporaryStorage", 0),
        set: undefined,
    });
    // webkitPersistentStorage
    Object.defineProperty(Navigator.prototype, "webkitPersistentStorage", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitPersistentStorage", 0),
        set: undefined,
    });
    // windowControlsOverlay
    Object.defineProperty(Navigator.prototype, "windowControlsOverlay", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get windowControlsOverlay", 0),
        set: undefined,
    });
    // hardwareConcurrency
    Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get hardwareConcurrency", 0),
        set: undefined,
    });
    // cookieEnabled
    Object.defineProperty(Navigator.prototype, "cookieEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get cookieEnabled", 0),
        set: undefined,
    });
    // appCodeName
    Object.defineProperty(Navigator.prototype, "appCodeName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get appCodeName", 0),
        set: undefined,
    });
    // appName
    Object.defineProperty(Navigator.prototype, "appName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get appName", 0),
        set: undefined,
    });
    // appVersion
    Object.defineProperty(Navigator.prototype, "appVersion", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get appVersion", 0),
        set: undefined,
    });
    // platform
    Object.defineProperty(Navigator.prototype, "platform", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get platform", 0),
        set: undefined,
    });
    // product
    Object.defineProperty(Navigator.prototype, "product", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get product", 0),
        set: undefined,
    });
    // userAgent
    Object.defineProperty(Navigator.prototype, "userAgent", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get userAgent", 0, function () {
            return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";
        }),
        set: undefined,
    });
    // language
    Object.defineProperty(Navigator.prototype, "language", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get language", 0, function () {
            return "zh-CN";
        }),
        set: undefined,
    });
    // languages
    Object.defineProperty(Navigator.prototype, "languages", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get languages", 0, function () {
            return ['zh-CN', 'zh']
        }),
        set: undefined,
    });
    // onLine
    Object.defineProperty(Navigator.prototype, "onLine", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onLine", 0),
        set: undefined,
    });
    // webdriver
    Object.defineProperty(Navigator.prototype, "webdriver", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webdriver", 0 ,function(){
            return false;
        }),
        set: undefined,
    });
    // pdfViewerEnabled
    Object.defineProperty(Navigator.prototype, "pdfViewerEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get pdfViewerEnabled", 0),
        set: undefined,
    });
    // connection
    Object.defineProperty(Navigator.prototype, "connection", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get connection", 0),
        set: undefined,
    });
    // getGamepads
    Object.defineProperty(Navigator.prototype, "getGamepads", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getGamepads", 0),
    });
    // javaEnabled
    Object.defineProperty(Navigator.prototype, "javaEnabled", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("javaEnabled", 0),
    });
    // sendBeacon
    Object.defineProperty(Navigator.prototype, "sendBeacon", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("sendBeacon", 1),
    });
    // vibrate
    Object.defineProperty(Navigator.prototype, "vibrate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("vibrate", 1),
    });
    // TODO constructor: Navigator.prototype.constructor 需要手动指向接口对象
    // ink
    Object.defineProperty(Navigator.prototype, "ink", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ink", 0),
        set: undefined,
    });
    // mediaCapabilities
    Object.defineProperty(Navigator.prototype, "mediaCapabilities", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get mediaCapabilities", 0),
        set: undefined,
    });
    // permissions
    Object.defineProperty(Navigator.prototype, "permissions", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get permissions", 0),
        set: undefined,
    });
    // mediaSession
    Object.defineProperty(Navigator.prototype, "mediaSession", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get mediaSession", 0),
        set: undefined,
    });
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Navigator.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Navigator",
    });
})();
/* #endregion AUTO:Navigator.prototype */


csvm.ban_parent(Navigator, "Illegal invocation");

navigator.__proto__ = Navigator.prototype;
navigator = csvm.proxy(navigator, "navigator");

Navigator = csvm.proxy(Navigator, "Navigator");
