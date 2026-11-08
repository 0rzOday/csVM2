var HTMLTableCellElement = function HTMLTableCellElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLTableCellElement);
Object.defineProperty(HTMLTableCellElement.prototype,Symbol.toStringTag,{value:"HTMLTableCellElement",configurable:true});
HTMLTableCellElement.prototype.__proto__=HTMLElement.prototype;
HTMLTableCellElement=csvm.proxy(HTMLTableCellElement,"HTMLTableCellElement");

// 注册 td 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("td", HTMLTableCellElement);