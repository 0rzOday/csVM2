var HTMLLIElement = function HTMLLIElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLLIElement);
Object.defineProperty(HTMLLIElement.prototype,Symbol.toStringTag,{value:"HTMLLIElement",configurable:true});
HTMLLIElement.prototype.__proto__=HTMLElement.prototype;
HTMLLIElement=csvm.proxy(HTMLLIElement,"HTMLLIElement");

// 注册 li 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("li", HTMLLIElement);