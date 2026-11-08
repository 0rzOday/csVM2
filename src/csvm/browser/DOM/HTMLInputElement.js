var HTMLInputElement = function HTMLInputElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLInputElement);
Object.defineProperty(HTMLInputElement.prototype,Symbol.toStringTag,{value:"HTMLInputElement",configurable:true});
HTMLInputElement.prototype.__proto__=HTMLElement.prototype;
HTMLInputElement=csvm.proxy(HTMLInputElement,"HTMLInputElement");

// 注册 input 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("input", HTMLInputElement);