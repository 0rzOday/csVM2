var HTMLHeadElement = function HTMLHeadElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLHeadElement);
Object.defineProperty(HTMLHeadElement.prototype,Symbol.toStringTag,{value:"HTMLHeadElement",configurable:true});
HTMLHeadElement.prototype.__proto__=HTMLElement.prototype;
HTMLHeadElement=csvm.proxy(HTMLHeadElement,"HTMLHeadElement");

// 注册 head 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("head", HTMLHeadElement);