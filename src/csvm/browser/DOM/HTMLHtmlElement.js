var HTMLHtmlElement = function HTMLHtmlElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLHtmlElement);
Object.defineProperty(HTMLHtmlElement.prototype,Symbol.toStringTag,{value:"HTMLHtmlElement",configurable:true});
HTMLHtmlElement.prototype.__proto__=HTMLElement.prototype;
HTMLHtmlElement=csvm.proxy(HTMLHtmlElement,"HTMLHtmlElement");

// 注册 html 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("html", HTMLHtmlElement);