var WebSocket = function WebSocket(url) {
    if (!new.target) {
        throw new TypeError("Failed to construct 'WebSocket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
    }
    if (arguments.length < 1) {
        throw new TypeError("Failed to construct 'WebSocket': 1 argument required, but only 0 present.");
    }
    // 真机会校验 URL scheme，并把错误消息暴露给 JS（挑战会记录这条消息）
    var __raw = String(url);
    var __m = /^([a-zA-Z][a-zA-Z0-9+.\-]*):/.exec(__raw);
    var __scheme = __m ? __m[1].toLowerCase() : "";
    if (__scheme && __scheme !== "http" && __scheme !== "https" && __scheme !== "ws" && __scheme !== "wss") {
        var __msg = "Failed to construct 'WebSocket': The URL's scheme must be either 'http', 'https', 'ws', or 'wss'. '" + __scheme + "' is not allowed.";
        var __err = new Error(__msg);
        __err.name = "SyntaxError";
        try { __err.code = 12; } catch (e) {}
        throw __err;
    }
    // TODO: 初始化 url / protocols / readyState / 连接
};
csvm.safefunction(WebSocket, "WebSocket");

// 实例原型链
WebSocket.prototype.__proto__ = EventTarget.prototype;
// 构造器链
WebSocket.__proto__ = EventTarget;

// 构造器上的常量（prototype 上的常量由插件生成）
[["CONNECTING", 0], ["OPEN", 1], ["CLOSING", 2], ["CLOSED", 3]].forEach(function (pair) {
    Object.defineProperty(WebSocket, pair[0], {
        value: pair[1],
        writable: false,
        enumerable: true,
        configurable: false
    });
});

/* #region AUTO:WebSocket.prototype */
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
    // url
    Object.defineProperty(WebSocket.prototype, "url", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get url", 0),
        set: undefined,
    });
    // readyState
    Object.defineProperty(WebSocket.prototype, "readyState", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get readyState", 0),
        set: undefined,
    });
    // bufferedAmount
    Object.defineProperty(WebSocket.prototype, "bufferedAmount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get bufferedAmount", 0),
        set: undefined,
    });
    // onopen
    Object.defineProperty(WebSocket.prototype, "onopen", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onopen", 0),
        set: __autoFn("set onopen", 1),
    });
    // onerror
    Object.defineProperty(WebSocket.prototype, "onerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onerror", 0),
        set: __autoFn("set onerror", 1),
    });
    // onclose
    Object.defineProperty(WebSocket.prototype, "onclose", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onclose", 0),
        set: __autoFn("set onclose", 1),
    });
    // extensions
    Object.defineProperty(WebSocket.prototype, "extensions", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get extensions", 0),
        set: undefined,
    });
    // protocol
    Object.defineProperty(WebSocket.prototype, "protocol", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get protocol", 0),
        set: undefined,
    });
    // onmessage
    Object.defineProperty(WebSocket.prototype, "onmessage", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmessage", 0),
        set: __autoFn("set onmessage", 1),
    });
    // binaryType
    Object.defineProperty(WebSocket.prototype, "binaryType", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get binaryType", 0),
        set: __autoFn("set binaryType", 1),
    });
    // CONNECTING
    Object.defineProperty(WebSocket.prototype, "CONNECTING", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 0,
    });
    // OPEN
    Object.defineProperty(WebSocket.prototype, "OPEN", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 1,
    });
    // CLOSING
    Object.defineProperty(WebSocket.prototype, "CLOSING", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 2,
    });
    // CLOSED
    Object.defineProperty(WebSocket.prototype, "CLOSED", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 3,
    });
    // close
    Object.defineProperty(WebSocket.prototype, "close", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("close", 0),
    });
    // send
    Object.defineProperty(WebSocket.prototype, "send", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("send", 1),
    });
    // TODO constructor: WebSocket.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(WebSocket.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "WebSocket",
    });
})();
/* #endregion AUTO:WebSocket.prototype */

WebSocket = csvm.proxy(WebSocket, "WebSocket");
