var HTMLDivElement = function HTMLDivElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLDivElement);
Object.defineProperty(HTMLDivElement.prototype,Symbol.toStringTag,{value:"HTMLDivElement",configurable:true});
HTMLDivElement.prototype.__proto__=HTMLElement.prototype;
HTMLDivElement=csvm.proxy(HTMLDivElement,"HTMLDivElement");

// 注册 div 标签：csvm.registerElement 在注册时就把原型取一次，
// 之后每次创建元素不再读 HTMLDivElement.prototype，避免代理日志刷屏
csvm.registerElement("div", HTMLDivElement);
