var HTMLOptionElement = function HTMLOptionElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLOptionElement);
Object.defineProperty(HTMLOptionElement.prototype,Symbol.toStringTag,{value:"HTMLOptionElement",configurable:true});
HTMLOptionElement.prototype.__proto__=HTMLElement.prototype;
HTMLOptionElement=csvm.proxy(HTMLOptionElement,"HTMLOptionElement");

// 注册 option 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("option", HTMLOptionElement);