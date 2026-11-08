var HTMLButtonElement = function HTMLButtonElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLButtonElement);
Object.defineProperty(HTMLButtonElement.prototype,Symbol.toStringTag,{value:"HTMLButtonElement",configurable:true});
HTMLButtonElement.prototype.__proto__=HTMLElement.prototype;
HTMLButtonElement=csvm.proxy(HTMLButtonElement,"HTMLButtonElement");

// 注册 button 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("button", HTMLButtonElement);