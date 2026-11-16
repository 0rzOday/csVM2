var screen={};
var Screen = function Screen(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(Screen);
Object.defineProperty(Screen.prototype,Symbol.toStringTag,{value:"Screen",configurable:true});
screen.__proto__=Screen.prototype;
Screen.prototype.__proto__=EventTarget.prototype;

// 真机 Screen.prototype accessor（匹配 Playwright 窗口 1280x720）
function __define_screen_value(name, value) {
    Object.defineProperty(Screen.prototype, name, {
        configurable: true,
        enumerable: true,
        get: csvm.safefunction(function () { return value; }, "get " + name),
        set: undefined
    });
}
__define_screen_value("width", 1280);
__define_screen_value("height", 720);
__define_screen_value("availWidth", 1280);
__define_screen_value("availHeight", 720);
__define_screen_value("colorDepth", 24);
__define_screen_value("pixelDepth", 24);
__define_screen_value("availLeft", 0);
__define_screen_value("availTop", 0);
__define_screen_value("isExtended", false);

var screenOrientation = { type: "landscape-primary", angle: 0 };
Object.defineProperty(screenOrientation, Symbol.toStringTag, {
    value: "ScreenOrientation", configurable: true
});
Object.defineProperty(Screen.prototype, "orientation", {
    configurable: true,
    enumerable: true,
    get: csvm.safefunction(function () { return screenOrientation; }, "get orientation"),
    set: undefined
});

csvm.memory.screenOnChange = null;
Object.defineProperty(Screen.prototype, "onchange", {
    configurable: true,
    enumerable: true,
    get: csvm.safefunction(function () { return csvm.memory.screenOnChange; }, "get onchange"),
    set: csvm.safefunction(function (value) { csvm.memory.screenOnChange = value; }, "set onchange")
});

screen=csvm.proxy(screen,"screen");
Screen=csvm.proxy(Screen,"Screen");