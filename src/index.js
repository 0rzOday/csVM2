const { VM, VMScript } = require("vm2");
const fs = require("fs");
const path = require("path");
const parse5 = require("parse5");

const csvm = require(`${__dirname}/csvm/csvm.node.js`);

// 补环境代码（tools + browser + DOM）
const csvm_code = csvm.GetCode();

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

// 按文档顺序收集页面内联 <script> 的原始文本。
// 取的是 parse5 解析后的 text 节点，和浏览器执行时看到的源码一致；
// 不要对文本做格式化，否则自校验类脚本（如阿里 WAF）会失效。
function collectPageScripts(htmlPath) {
    if (!fs.existsSync(htmlPath)) {
        throw new Error(`页面文件不存在: ${htmlPath}`);
    }

    const doc = parse5.parse(fs.readFileSync(htmlPath, "utf8"));
    const scripts = [];

    (function walk(node) {
        if (node.nodeName === "script") {
            const attrs = {};
            for (const a of node.attrs || []) attrs[a.name] = a.value;

            if (attrs.src) {
                // 外链脚本需要先下载，这里只处理内联脚本
                console.warn(`跳过外链脚本: ${attrs.src}`);
            } else {
                const type = (attrs.type || "").toLowerCase();
                const isJs = type === "" || type === "text/javascript" ||
                    type === "application/javascript";
                if (!isJs) {
                    console.warn(`跳过非 JS 脚本: type=${attrs.type}`);
                } else {
                    const text = (node.childNodes || []).map(function (c) {
                        return c.value || "";
                    }).join("");
                    if (text) scripts.push(text);
                }
            }
        }

        // <template> 的子节点挂在 content 上，不在 childNodes 里
        if (node.content) walk(node.content);
        for (const child of node.childNodes || []) walk(child);
    })(doc);

    return scripts;
}

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
    "    nativeText: function () { return csvm.nativeText.report(); },\r\n" +
    // 启动模式由框架内存里的 config 决定，宿主侧只读，不直接碰沙箱内部
    "    getConfig: function () {\r\n" +
    "        return {\r\n" +
    "            runScripts: !!csvm.memory.config.runScripts,\r\n" +
    "            scriptHtmlPath: csvm.memory.config.scriptHtmlPath\r\n" +
    "        };\r\n" +
    "    }\r\n" +
    "};\r\n" +
    "})();",
    "框架"
));

// 中间切一次阶段：框架加载期的日志记成 init，目标代码的记成 target
api.setPhase("target");
debugger;

// 第二段：启动模式由框架内存里的 config.runScripts 决定。
//   false -> 执行 src/code.js（单文件模式，默认）
//   true  -> 从 config.scriptHtmlPath 读取 HTML，按文档顺序执行所有内联 <script>
const config = api.getConfig();

try {
    if (config.runScripts) {
        const htmlPath = path.resolve(__dirname, "..", config.scriptHtmlPath);
        const scripts = collectPageScripts(htmlPath);
        console.log(`整页模式: ${config.scriptHtmlPath}，共 ${scripts.length} 个 <script>`);

        for (let i = 0; i < scripts.length; i++) {
            try {
                vm.run(new VMScript(scripts[i], `script[${i}]`));
            } catch (e) {
                // 浏览器里单个脚本抛错不会阻止后续脚本，这里保持一致
                console.error(`页面脚本 script[${i}] 报错:`, e);
            }
        }
    } else {
        // 目标代码在全局作用域执行，顶层 var 照旧成为 window 属性，间接 eval 才看得到。
        const target_code = fs.readFileSync(`${__dirname}/code.js`, "utf8");
        try {
            vm.run(new VMScript(target_code, "调试中"));
        } catch (e) {
            console.error("目标代码报错:", e);
        }
    }
} finally {
    api.showlog();
    debugger;
}

console.log("-------------------------------------------------------------🥱运行完毕🥱-------------------------------------------------------------");
