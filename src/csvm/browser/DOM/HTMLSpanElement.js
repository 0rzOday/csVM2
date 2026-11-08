var HTMLSpanElement = function HTMLSpanElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLSpanElement);
Object.defineProperty(HTMLSpanElement.prototype,Symbol.toStringTag,{value:"HTMLSpanElement",configurable:true});
HTMLSpanElement.prototype.__proto__=HTMLElement.prototype;
HTMLSpanElement=csvm.proxy(HTMLSpanElement,"HTMLSpanElement");

// 注册 span 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("span", HTMLSpanElement);