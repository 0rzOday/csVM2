var HTMLFormElement = function HTMLFormElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLFormElement);
Object.defineProperty(HTMLFormElement.prototype,Symbol.toStringTag,{value:"HTMLFormElement",configurable:true});
HTMLFormElement.prototype.__proto__=HTMLElement.prototype;
HTMLFormElement=csvm.proxy(HTMLFormElement,"HTMLFormElement");

// 注册 form 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("form", HTMLFormElement);