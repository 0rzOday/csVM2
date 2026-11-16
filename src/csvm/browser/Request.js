var Request = function Request(input) {
    if (!new.target) {
        throw new TypeError("Failed to construct 'Request': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
    }
    if (arguments.length < 1) {
        throw new TypeError("Failed to construct 'Request': 1 argument required, but only 0 present.");
    }
    // TODO: 初始化 url / method / headers / signal 等
    // 第二个参数 init 用 arguments[1]，这样函数 length 保持真机的 1
    var init = arguments[1];
};
csvm.safefunction(Request, "Request");

// Request 没有父接口，原型默认指向 Object.prototype，不需要额外改链
Object.defineProperty(Request.prototype, Symbol.toStringTag, {
    value: "Request",
    configurable: true
});
