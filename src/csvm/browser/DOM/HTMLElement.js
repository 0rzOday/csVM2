var HTMLElement = function HTMLElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLElement);
Object.defineProperty(HTMLElement.prototype,Symbol.toStringTag,{value:"HTMLElement",configurable:true});
HTMLElement.prototype.__proto__=Element.prototype;
HTMLElement=csvm.proxy(HTMLElement,"HTMLElement");