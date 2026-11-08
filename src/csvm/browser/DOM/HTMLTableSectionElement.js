var HTMLTableSectionElement = function HTMLTableSectionElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLTableSectionElement);
Object.defineProperty(HTMLTableSectionElement.prototype,Symbol.toStringTag,{value:"HTMLTableSectionElement",configurable:true});
HTMLTableSectionElement.prototype.__proto__=HTMLElement.prototype;
HTMLTableSectionElement=csvm.proxy(HTMLTableSectionElement,"HTMLTableSectionElement");

// thead / tbody / tfoot 共用这个接口
csvm.registerElement("thead", HTMLTableSectionElement);
csvm.registerElement("tbody", HTMLTableSectionElement);
csvm.registerElement("tfoot", HTMLTableSectionElement);
