var HTMLBodyElement = function HTMLBodyElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLBodyElement);
Object.defineProperty(HTMLBodyElement.prototype,Symbol.toStringTag,{value:"HTMLBodyElement",configurable:true});
HTMLBodyElement.prototype.__proto__=HTMLElement.prototype;
HTMLBodyElement=csvm.proxy(HTMLBodyElement,"HTMLBodyElement");

// 注册 body 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("body", HTMLBodyElement);