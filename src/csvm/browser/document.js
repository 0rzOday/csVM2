// document 实例
// Document 接口构造器定义在 DOM/Document.js（依赖 Node.js，必须先加载）
document={};

///////////////
// 属性（cookie / referrer / title 等）统一由自动导出脚本生成到 Document.prototype 上（getter/setter），
// 这里不再在实例上直接挂 data property，否则会遮蔽原型上的 accessor。

///////////////
document.__proto__=HTMLDocument.prototype;

document=csvm.proxy(document,"document");
csvm.memory.Dom.set(document, { tag: "#document", nodeType: 9, data: {}, parent: null, childNodes: [] });
