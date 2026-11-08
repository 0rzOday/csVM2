var HTMLTableRowElement = function HTMLTableRowElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLTableRowElement);
Object.defineProperty(HTMLTableRowElement.prototype,Symbol.toStringTag,{value:"HTMLTableRowElement",configurable:true});
HTMLTableRowElement.prototype.__proto__=HTMLElement.prototype;
HTMLTableRowElement=csvm.proxy(HTMLTableRowElement,"HTMLTableRowElement");

// 注册 tr 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("tr", HTMLTableRowElement);