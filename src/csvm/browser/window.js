window = this;
window.name="";
var Window = function Window() {
    throw new TypeError("Illegal constructor");
};
Object.defineProperty(Window.prototype, Symbol.toStringTag, {
    value: "Window",
    configurable: true
});
csvm.safefunction(Window, "Window");
////////////
// 常量 PERSISTENT / TEMPORARY 和属性 localStorage 等由自动导出脚本生成，
// 不再手写 data property，避免 enumerable/writable/configurable 与原生不一致。
// TODO: 下面的定时器目前同步执行且返回值不完整，原生是异步执行并返回 number 类型的定时器 id
// 方法简写：和原生一样只有 length / name、没有 prototype、不能 new
window.setTimeout = {
    setTimeout(arg1, arg2) {
        typeof arg1==="function"?arg1():undefined;
        typeof arg1==="string"?eval(arg1):undefined;
        // 应当生成uuid并且保存到内存
        return 0;
    }
}.setTimeout; csvm.safefunction(window.setTimeout);
// 真机 setTimeout.length 是 1（timeout 是可选参数）
Object.defineProperty(window.setTimeout, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
window.setInterval = {
    setInterval(arg1, arg2) {
        typeof arg1==="function"?arg1():undefined;
        typeof arg1==="string"?eval(arg1):undefined;
    }
}.setInterval; csvm.safefunction(window.setInterval);
Object.defineProperty(window.setInterval, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
window.chrome=csvm.proxy(class chrome{});
window.DeviceOrientationEvent=function DeviceOrientationEvent(){debugger;};csvm.safefunction(window.DeviceOrientationEvent);
window.DeviceMotionEvent=function DeviceMotionEvent(){debugger;};csvm.safefunction(window.DeviceMotionEvent);

// window.localStorage 由 Window.prototype 上的 getter 提供（自动导出脚本生成）
////////////
// 实例链：window → Window.prototype → WindowProperties.prototype → EventTarget.prototype → Object.prototype
window.__proto__ = Window.prototype;
Window.prototype.__proto__ = WindowProperties.prototype;

// 调试代理（csvm.memory.config.proxy 为 false 时原样返回）
window = csvm.proxy(window, "window");
Window = csvm.proxy(Window, "Window");

// 顶层窗口身份：真机 window.top / window.window 是 window 自身的只读 accessor
// （get-only、enumerable:true、configurable:false）。
// self / parent / frames 目前缺失，本次不补；这里只修已实现但指向代理前对象的 top/window。
// 注意：vm2 的全局 getter receiver 不是 window 本身，brand check 留到 ISSUE-002 统一处理。
// getter 必须闭包引用 window_ref：window 标识符本身随后会变成这个 accessor，
// 在 getter 里再读 window 会无限递归。
var window_ref = window;
function _define_window_identity(name) {
    var getter = csvm.safefunction(function () {
        return window_ref;
    }, "get " + name);

    Object.defineProperty(window, name, {
        get: getter,
        enumerable: true,
        configurable: false
    });
}
_define_window_identity("top");
_define_window_identity("window");


