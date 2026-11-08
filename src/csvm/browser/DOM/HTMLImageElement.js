var HTMLImageElement = function HTMLImageElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLImageElement);
Object.defineProperty(HTMLImageElement.prototype,Symbol.toStringTag,{value:"HTMLImageElement",configurable:true});
HTMLImageElement.prototype.__proto__=HTMLElement.prototype;
HTMLImageElement=csvm.proxy(HTMLImageElement,"HTMLImageElement");

// 注册 img 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("img", HTMLImageElement);