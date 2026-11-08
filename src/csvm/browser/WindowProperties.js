// WindowProperties：Chrome 在 Window.prototype 和 EventTarget.prototype 之间插入的一层
// 依赖：必须先加载 EventTarget.js
var WindowProperties = function WindowProperties() {

};
Object.defineProperty(WindowProperties.prototype, Symbol.toStringTag, {
    value: "WindowProperties",
    configurable: true
});
csvm.safefunction(WindowProperties, "WindowProperties");

// WindowProperties 继承 EventTarget
WindowProperties.prototype.__proto__ = EventTarget.prototype;

// 真机 WindowProperties.prototype 没有自有 constructor（own names 为空），
// 它从 EventTarget.prototype 继承 constructor；函数默认自带的那个是多余的。
delete WindowProperties.prototype.constructor;
