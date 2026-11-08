var HTMLLinkElement = function HTMLLinkElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLLinkElement);
Object.defineProperty(HTMLLinkElement.prototype,Symbol.toStringTag,{value:"HTMLLinkElement",configurable:true});
HTMLLinkElement.prototype.__proto__=HTMLElement.prototype;
HTMLLinkElement=csvm.proxy(HTMLLinkElement,"HTMLLinkElement");

// 注册 link 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("link", HTMLLinkElement);