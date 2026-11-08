var HTMLSelectElement = function HTMLSelectElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLSelectElement);
Object.defineProperty(HTMLSelectElement.prototype,Symbol.toStringTag,{value:"HTMLSelectElement",configurable:true});
HTMLSelectElement.prototype.__proto__=HTMLElement.prototype;
HTMLSelectElement=csvm.proxy(HTMLSelectElement,"HTMLSelectElement");

// 注册 select 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("select", HTMLSelectElement);