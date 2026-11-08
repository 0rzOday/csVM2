const { VM, VMScript } = require("vm2");
const fs = require("fs");

const csvm = require(`${__dirname}/csvm/csvm.node.js`);

// 补环境代码（tools + browser + DOM）
const csvm_code = csvm.GetCode();
// 目标代码
const target_code = fs.readFileSync(`${__dirname}/code.js`, "utf8");

// ---------------------------------------------------------------------------
// 框架整段包进 IIFE 执行
//
// 顶层 var / function 声明会变成函数局部，不再挂到沙箱全局对象（= window）上。
// 目标会挨个 Reflect.ownKeys(window) + getOwnPropertyDescriptor，之前能看到
// csvm、proxy、htmlParse、nodeTypeOf 以及 page.js 的 n###_* 节点变量。
//
// 目标代码不能跟着包进来：它内部用间接 eval 跑解码后的代码，eval 只看得到全局变量。
// 顶层 var（_$wb 这类）一旦变成闭包局部，eval 里就 ReferenceError。
// 所以拆成两段执行：框架在 IIFE 里，目标在全局作用域。
// ---------------------------------------------------------------------------

// 接口对象。描述符按 Chrome 实测：writable:true / enumerable:false / configurable:true。
// WindowProperties 浏览器里不存在（连原型链上都没有），不挂。
const EXPOSE = [
    "DOMParser", "Document", "Element", "EventTarget", "History", "IDBFactory",
    "Location", "Navigator", "Node", "Screen", "Storage", "Window",
    "HTMLElement", "HTMLDocument",
    "HTMLAnchorElement", "HTMLBodyElement", "HTMLButtonElement", "HTMLDivElement",
    "HTMLFormElement", "HTMLHeadElement", "HTMLHtmlElement", "HTMLImageElement",
    "HTMLInputElement", "HTMLLIElement", "HTMLLinkElement", "HTMLMetaElement",
    "HTMLOptionElement", "HTMLParagraphElement", "HTMLScriptElement", "HTMLSelectElement",
    "HTMLSpanElement", "HTMLTableCellElement", "HTMLTableElement", "HTMLTableRowElement",
    "HTMLTableSectionElement", "HTMLTitleElement", "HTMLUListElement",
];

const expose_code = EXPOSE.map(function (name) {
    return `Object.defineProperty(window, ${JSON.stringify(name)}, ` +
        `{ value: ${name}, writable: true, enumerable: false, configurable: true });`;
}).join("\r\n");

// 这四个在各自文件里是 var 声明，包闭包后变局部。
// 和 document / navigator / localStorage 一样用赋值挂回去，保持同样的描述符。
const singleton_code = [
    "window.history = history;",
    "window.location = location;",
    "window.screen = screen;",
    "window.indexedDB = indexedDB;",
].join("\r\n");

// vm2 会往沙箱全局塞一批宿主侧的名字，浏览器里没有。
// 这几个 configurable 都是 true，可以删；删完沙箱照常工作。
// VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL 是 configurable:false，
// 删不掉，Proxy 的 ownKeys 又不允许漏掉非配置自有属性，只能留着。
const cleanup_code = ["Buffer", "global", "GLOBAL", "root", "VMError"].map(function (name) {
    return `delete window[${JSON.stringify(name)}];`;
}).join("\r\n");

const vm = new VM({
    sandbox: { console }
});

// 第一段：框架。返回值只有宿主能拿到，目标代码看不到。
const api = vm.run(new VMScript(
    "(function () {\r\n" +
    csvm_code + "\r\n" +
    expose_code + "\r\n" +
    singleton_code + "\r\n" +
    cleanup_code + "\r\n" +
    // 清理完 vm2 的全局后再扫一次：这次能覆盖上面 EXPOSE 挂上去的接口对象，
    // 顺序放在 cleanup 之后，Buffer / VMError 这些已经删了，不会被无谓地修一遍
    "csvm.nativeText.repairAll();\r\n" +
    "return {\r\n" +
    "    setPhase: function (p) { csvm.memory.phase = p; },\r\n" +
    "    showlog: function () { csvm.print.showlog(); },\r\n" +
    "    nativeText: function () { return csvm.nativeText.report(); }\r\n" +
    "};\r\n" +
    "})();",
    "框架"
));

// 中间切一次阶段：框架加载期的日志记成 init，目标代码的记成 target
api.setPhase("target");
debugger;

// 第二段：目标。在全局作用域执行，顶层 var 照旧成为 window 属性，间接 eval 才看得到。
try {
    vm.run(new VMScript(target_code, "调试中"));
} catch (e) {
    console.error("目标代码报错:", e);
} finally {
    api.showlog();
    debugger;
}

console.log("-------------------------------------------------------------🥱运行完毕🥱-------------------------------------------------------------");
