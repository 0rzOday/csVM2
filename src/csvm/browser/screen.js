var screen={};
var Screen = function Screen(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(Screen);
Object.defineProperty(Screen.prototype,Symbol.toStringTag,{value:"Screen",configurable:true});
screen.__proto__=Screen.prototype;
Screen.prototype.__proto__=EventTarget.prototype;
screen=csvm.proxy(screen,"screen");
Screen=csvm.proxy(Screen,"Screen");