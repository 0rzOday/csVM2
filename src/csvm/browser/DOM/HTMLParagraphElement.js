var HTMLParagraphElement = function HTMLParagraphElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLParagraphElement);
Object.defineProperty(HTMLParagraphElement.prototype,Symbol.toStringTag,{value:"HTMLParagraphElement",configurable:true});
HTMLParagraphElement.prototype.__proto__=HTMLElement.prototype;
HTMLParagraphElement=csvm.proxy(HTMLParagraphElement,"HTMLParagraphElement");

// 注册 p 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("p", HTMLParagraphElement);