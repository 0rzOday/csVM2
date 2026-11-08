var HTMLUListElement = function HTMLUListElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLUListElement);
Object.defineProperty(HTMLUListElement.prototype,Symbol.toStringTag,{value:"HTMLUListElement",configurable:true});
HTMLUListElement.prototype.__proto__=HTMLElement.prototype;
HTMLUListElement=csvm.proxy(HTMLUListElement,"HTMLUListElement");

// 注册 ul 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("ul", HTMLUListElement);