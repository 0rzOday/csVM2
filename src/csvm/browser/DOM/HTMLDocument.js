var HTMLDocument=function HTMLDocument(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLDocument);
Object.defineProperty(HTMLDocument.prototype,Symbol.toStringTag,{value:"HTMLDocument",configurable:true});
HTMLDocument.prototype.__proto__=Document.prototype;
HTMLDocument=csvm.proxy(HTMLDocument,"HTMLDocument");