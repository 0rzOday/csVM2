var HTMLScriptElement = function HTMLScriptElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLScriptElement);
Object.defineProperty(HTMLScriptElement.prototype,Symbol.toStringTag,{value:"HTMLScriptElement",configurable:true});
HTMLScriptElement.prototype.__proto__=HTMLElement.prototype;
HTMLScriptElement=csvm.proxy(HTMLScriptElement,"HTMLScriptElement");

// 注册 script 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("script", HTMLScriptElement);