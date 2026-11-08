var HTMLTitleElement = function HTMLTitleElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLTitleElement);
Object.defineProperty(HTMLTitleElement.prototype,Symbol.toStringTag,{value:"HTMLTitleElement",configurable:true});
HTMLTitleElement.prototype.__proto__=HTMLElement.prototype;
HTMLTitleElement=csvm.proxy(HTMLTitleElement,"HTMLTitleElement");

// 注册 title 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("title", HTMLTitleElement);