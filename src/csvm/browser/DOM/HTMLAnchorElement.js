var HTMLAnchorElement = function HTMLAnchorElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLAnchorElement);
Object.defineProperty(HTMLAnchorElement.prototype,Symbol.toStringTag,{value:"HTMLAnchorElement",configurable:true});
HTMLAnchorElement.prototype.__proto__=HTMLElement.prototype;
HTMLAnchorElement=csvm.proxy(HTMLAnchorElement,"HTMLAnchorElement");

// 注册 a 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("a", HTMLAnchorElement);