var XMLHttpRequestEventTarget = function XMLHttpRequestEventTarget() {
    throw new TypeError("Illegal constructor");   // 真机 new 它会抛
};
csvm.safefunction(XMLHttpRequestEventTarget, "XMLHttpRequestEventTarget");

var XMLHttpRequest = function XMLHttpRequest() {
    // TODO: XMLHttpRequest 是可构造的，这里要返回实例对象
};
csvm.safefunction(XMLHttpRequest, "XMLHttpRequest");

// 实例原型链
XMLHttpRequestEventTarget.prototype.__proto__ = EventTarget.prototype;
XMLHttpRequest.prototype.__proto__ = XMLHttpRequestEventTarget.prototype;

// 构造器链
XMLHttpRequestEventTarget.__proto__ = EventTarget;
XMLHttpRequest.__proto__ = XMLHttpRequestEventTarget;

// toStringTag 放在最终原型上
Object.defineProperty(XMLHttpRequestEventTarget.prototype, Symbol.toStringTag, {
    value: "XMLHttpRequestEventTarget", configurable: true
});
Object.defineProperty(XMLHttpRequest.prototype, Symbol.toStringTag, {
    value: "XMLHttpRequest", configurable: true
});

// 挑战会对 XHR.prototype 的方法做存在性/原生性检查；补上真机有的一组方法。
// 纯代码环境不做真实网络请求，保持空实现（与其它 stub 一致）。
(function () {
    var methods = {
        open: 2, send: 0, abort: 0, setRequestHeader: 2, getResponseHeader: 1,
        getAllResponseHeaders: 0, overrideMimeType: 1,
    };
    Object.keys(methods).forEach(function (name) {
        var fn = { [name]() { } }[name];
        try { csvm.safefunction(fn, name); } catch (e) {}
        try { Object.defineProperty(fn, "length", { value: methods[name], configurable: true }); } catch (e) {}
        Object.defineProperty(XMLHttpRequest.prototype, name, {
            configurable: true, enumerable: true, writable: true, value: fn,
        });
    });
    // readyState：真机 open() 之后为 1（OPENED）
    var __xhrState = new WeakMap();
    Object.defineProperty(XMLHttpRequest.prototype, "readyState", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () { return __xhrState.get(this) || 0; }, "get readyState"),
    });
    function __xhrFire(x, type) {
        try {
            var ev = (typeof Event === "function") ? new Event(type) : { type: type, target: x, currentTarget: x };
            if (typeof x.dispatchEvent === "function") x.dispatchEvent(ev);
            else if (typeof x["on" + type] === "function") x["on" + type].call(x, ev);
        } catch (e) {}
    }
    var openFn = { open(method, url) { __xhrState.set(this, 1); __xhrFire(this, "readystatechange"); } }.open;
    csvm.safefunction(openFn, "open");
    try { Object.defineProperty(openFn, "length", { value: 2, configurable: true }); } catch (e) {}
    Object.defineProperty(XMLHttpRequest.prototype, "open", {
        configurable: true, enumerable: true, writable: true, value: openFn,
    });
    // send：真实网络是异步的，同步返回时 readyState 仍是 1（与 jsdom 一致），
    // 纯代码环境没有网络，因此不再同步推进到 4。
    var sendFn = { send() { } }.send;
    csvm.safefunction(sendFn, "send");
    Object.defineProperty(XMLHttpRequest.prototype, "send", {
        configurable: true, enumerable: true, writable: true, value: sendFn,
    });
    var simple = { status: 0, statusText: "", responseText: "", response: null, responseURL: "" };
    Object.keys(simple).forEach(function (n) {
        var val = simple[n];
        Object.defineProperty(XMLHttpRequest.prototype, n, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(function () { return val; }, "get " + n),
        });
    });
})();
XMLHttpRequest=csvm.proxy(XMLHttpRequest);
XMLHttpRequestEventTarget=csvm.proxy(XMLHttpRequestEventTarget);