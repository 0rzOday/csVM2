var HTMLTableElement = function HTMLTableElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLTableElement);
Object.defineProperty(HTMLTableElement.prototype,Symbol.toStringTag,{value:"HTMLTableElement",configurable:true});
HTMLTableElement.prototype.__proto__=HTMLElement.prototype;
HTMLTableElement=csvm.proxy(HTMLTableElement,"HTMLTableElement");

// 注册 table 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("table", HTMLTableElement);