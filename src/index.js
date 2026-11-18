const __vm2mod = require("vm2");
const fs = require("fs");
const path = require("path");
let acorn = null;
try { acorn = require("acorn"); } catch (e) { /* CSVM_DDA 实验用的可选依赖 */ }
let astring = null;
try { astring = require("astring"); } catch (e) { /* CSVM_DDA 实验用的可选依赖 */ }

// 原生 undetectable 对象（HTMLDDA），可选依赖：未编译时框架行为不变
let nativeDDA = null;
try {
    nativeDDA = require(path.resolve(__dirname, "..", "native", "dda", "build", "Release", "dda.node"));
} catch (e) {
    nativeDDA = null;
}
const parse5 = require("parse5");

const csvm = require(`${__dirname}/csvm/csvm.node.js`);

// 日志落盘的开关在框架内存里（csvm.memory.config.writeLogFile），
// 框架加载完之后通过 api.getConfig() 读取，再初始化（见 setupLogFile）。

// 补环境代码（tools + browser + DOM）
const csvm_code = csvm.GetCode();

// ---------------------------------------------------------------------------

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
    "Event", "CustomEvent", "UIEvent", "MouseEvent", "PointerEvent", "WheelEvent", "KeyboardEvent", "FocusEvent", "InputEvent", "CompositionEvent", "TouchEvent", "DragEvent", "ProgressEvent", "SubmitEvent", "ErrorEvent", "MessageEvent", "StorageEvent", "HashChangeEvent", "PopStateEvent", "BeforeUnloadEvent", "PageTransitionEvent", "TextEvent", "TransitionEvent", "XPathExpression", "XPathResult",
    "Location", "Navigator", "Node", "Screen", "Storage", "Window", "DOMRect", "DOMRectReadOnly", "DOMImplementation",
    "XMLHttpRequest", "XMLHttpRequestEventTarget", "Request", "MutationObserver", "MutationRecord", "NodeList", "NetworkInformation", "WebSocket", "BatteryManager", "CanvasRenderingContext2D", "HTMLCanvasElement", "CSSStyleDeclaration",
    "Plugin", "PluginArray", "MimeType", "MimeTypeArray", "BarProp",
    "HTMLElement", "HTMLDocument",
    "HTMLMediaElement", "HTMLAudioElement", "HTMLVideoElement",
    "HTMLAnchorElement", "HTMLBodyElement", "HTMLButtonElement", "HTMLDivElement",
    "HTMLFormElement", "HTMLHeadElement", "HTMLHtmlElement", "HTMLImageElement",
    "HTMLInputElement", "HTMLLIElement", "HTMLLinkElement", "HTMLMetaElement",
    "HTMLOptionElement", "HTMLParagraphElement", "HTMLScriptElement", "HTMLSelectElement",
    "HTMLSpanElement", "HTMLTableCellElement", "HTMLTableElement", "HTMLTableRowElement",
    "HTMLTableSectionElement", "HTMLTitleElement", "HTMLUListElement",
    "HTMLStyleElement", "HTMLTextAreaElement", "HTMLLabelElement", "HTMLFieldSetElement",
    "HTMLOutputElement", "HTMLDataListElement", "HTMLTemplateElement", "HTMLSlotElement",
    "Text", "Comment", "CharacterData", "Attr",
];

// jsdom 后端下这些接口由 jsdom 自己提供，缺失的名字跳过（typeof 不抛 ReferenceError）
// 原生身份修复：接口构造函数在模块末尾被 csvm.proxy() 包成 Proxy 后才暴露到 window，
// 但 X.prototype.constructor 仍指向被包之前的原函数。真机上恒有
//   el.constructor === window.HTMLDivElement
//   window.HTMLElement.prototype.constructor === window.HTMLElement
// 挑战的原生性自检会读这一层，
// 所以在所有暴露完成后，统一把 prototype.constructor 回指到 window 上实际暴露的对象。
const constructor_code =
    "(function(){var L=" + JSON.stringify(EXPOSE) + ";" +
    "for(var i=0;i<L.length;i++){var n=L[i];try{" +
    "var C=window[n];if(typeof C!=='function'||!C.prototype)continue;" +
    "var d=Object.getOwnPropertyDescriptor(C.prototype,'constructor');" +
    "if(!d||d.value!==C||d.writable!==true||d.enumerable!==false||d.configurable!==true){" +
    "Object.defineProperty(C.prototype,'constructor',{value:C,writable:true,enumerable:false,configurable:true});}" +
    "}catch(e){}}})();";

const expose_code = EXPOSE.map(function (name) {
    return `try { if (typeof ${name} !== "undefined") Object.defineProperty(window, ${JSON.stringify(name)}, ` +
        `{ value: ${name}, writable: true, enumerable: false, configurable: true }); } catch (e) {}`;
}).join("\r\n") + "\r\n" + constructor_code + (process.env.CSVM_NO_REQUEST === "1" ? "\r\ntry { if (typeof window.Request !== \"undefined\") delete window.Request; } catch (e) {}" : "") +
    (process.env.CSVM_NO_FETCH === "1" ? "\r\ntry { if (typeof window.fetch !== \"undefined\") delete window.fetch; } catch (e) {}" : "");

// window 全局描述符对齐真机：
//   document / location / history / navigator / screen / indexedDB /
//   localStorage / sessionStorage / name 都是 window 自有 accessor。
// document / location 是 configurable:false，其余 configurable:true。
const singleton_code = [
    "var __document_ref = document;",
    "var __navigator_ref = navigator;",
    "var __localStorage_ref = localStorage;",
    "var __sessionStorage_ref = sessionStorage;",
    "csvm.memory.windowName = window.name || \"\";",
    // __fwLoc 仅供 OP269 诊断使用；默认不建，避免在 window 上留下可枚举之外的宿主标记
    (process.env.CSVM_OP269 === "1"
        ? "try { Object.defineProperty(globalThis, \"__fwLoc\", { value: location, enumerable: false, configurable: true }); } catch (e) {}"
        : ""),
    "Object.defineProperty(window, \"document\", {",
    "    get: csvm.safefunction(function () { return __document_ref; }, \"get document\"),",
    "    enumerable: true, configurable: false",
    "});",
    "Object.defineProperty(window, \"location\", {",
    "    get: csvm.safefunction(function () { return location; }, \"get location\"),",
    "    set: csvm.safefunction(function (value) { location.href = value; }, \"set location\"),",
    "    enumerable: true, configurable: false",
    "});",
    "Object.defineProperty(window, \"history\", {",
    "    get: csvm.safefunction(function () { return history; }, \"get history\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"navigator\", {",
    "    get: csvm.safefunction(function () { return __navigator_ref; }, \"get navigator\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"screen\", {",
    "    get: csvm.safefunction(function () { return screen; }, \"get screen\"),",
    "    set: csvm.safefunction(function (value) { screen = value; }, \"set screen\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"indexedDB\", {",
    "    get: csvm.safefunction(function () { return indexedDB; }, \"get indexedDB\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"localStorage\", {",
    "    get: csvm.safefunction(function () { return __localStorage_ref; }, \"get localStorage\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"sessionStorage\", {",
    "    get: csvm.safefunction(function () { return __sessionStorage_ref; }, \"get sessionStorage\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"name\", {",
    "    get: csvm.safefunction(function () { return csvm.memory.windowName; }, \"get name\"),",
    "    set: csvm.safefunction(function (value) { csvm.memory.windowName = String(value); }, \"set name\"),",
    "    enumerable: true, configurable: true",
    "});",
    // vm2 内建描述符对齐（Error 的 configurable:false，改不了，跳过）
    "[\"Function\", \"Proxy\", \"eval\", \"console\"].forEach(function (name) {",
    "    var d = Object.getOwnPropertyDescriptor(window, name);",
    "    if (d && d.configurable) {",
    "        d.enumerable = false;",
    "        Object.defineProperty(window, name, d);",
    "    }",
    "});",
    "try { delete window.SharedArrayBuffer; } catch (e) {}",
].join("\r\n");

// vm2 会往沙箱全局塞一批宿主侧的名字，浏览器里没有。
// 这几个 configurable 都是 true，可以删；删完沙箱照常工作。
// VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL 是 configurable:false，
// 删不掉，Proxy 的 ownKeys 又不允许漏掉非配置自有属性，只能留着。
const cleanup_code = ["Buffer", "global", "GLOBAL", "root", "VMError"].map(function (name) {
    return `delete window[${JSON.stringify(name)}];`;
}).join("\r\n");

// 按文档顺序收集页面 <script>：内联返回文本，外链返回 src，交给执行阶段按序解析。
// 文本来自 parse5 的 text 节点，和浏览器执行时看到的源码一致；
// 不要格式化，否则自校验类脚本（如阿里 WAF / 瑞数）会失效。
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

            const type = (attrs.type || "").toLowerCase();
            const isJs = type === "" || type === "text/javascript" ||
                type === "application/javascript";

            if (!isJs) {
                console.warn(`跳过非 JS 脚本: ${attrs.src || "inline"} type=${attrs.type}`);
            } else if (attrs.src) {
                scripts.push({ kind: "external", src: attrs.src, attrs: attrs });
            } else {
                const text = (node.childNodes || []).map(function (c) {
                    return c.value || "";
                }).join("");
                if (text) scripts.push({ kind: "inline", text: text, attrs: attrs });
            }
        }

        // <template> 的子节点挂在 content 上，不在 childNodes 里
        if (node.content) walk(node.content);
        for (const child of node.childNodes || []) walk(child);
    })(doc);

    return scripts;
}

// parse5 节点 -> 传给沙箱 csvm.rebuildDom 的纯数据树。
// 元素: {tag, attrs, children}；文本/注释: {tag:"#text"/"#comment", text}；
// doctype: {tag:"#documentType", name, publicId, systemId}。
function toDomTree(node) {
    if (!node) return null;
    const name = node.nodeName;

    if (name === "#text") {
        return { tag: "#text", text: node.value || "" };
    }
    if (name === "#comment") {
        return { tag: "#comment", text: node.data || "" };
    }
    if (name === "#documentType") {
        return { tag: "#documentType", name: node.name, publicId: node.publicId, systemId: node.systemId };
    }

    const children = [];
    const pushChildren = function (list) {
        for (const c of list || []) {
            const t = toDomTree(c);
            if (t) children.push(t);
        }
    };
    pushChildren(node.childNodes);
    if (node.content) pushChildren(node.content.childNodes);

    if (name === "#document") {
        return { tag: "#document", children: children };
    }

    const attrs = {};
    for (const a of node.attrs || []) attrs[a.name] = a.value;
    return { tag: name, attrs: attrs, children: children };
}

// 给页面脚本（非 eval）里的 VM 解释器循环插入同样的指令 trace。
// 瑞数有两层 VM：外层 8WwVut...js 里是递归解释器 _$cA，内层是 eval 出来的。
// 只追踪 eval 会漏掉外层分支。
// 外链脚本定位：先按完整相对路径找，再按文件名找，最后在目录下递归按文件名兜底。
function resolveExternalScript(src, scriptDir) {
    let clean = String(src).split("#")[0].split("?")[0];
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(clean)) {
        try { clean = new URL(clean).pathname; } catch (e) { /* keep */ }
    }

    const rel = clean.replace(/^\/+/, "");
    const base = path.basename(rel);
    const candidates = [
        path.join(scriptDir, rel),
        path.join(scriptDir, base),
    ];

    for (const file of candidates) {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            return { file: file, text: fs.readFileSync(file, "utf8") };
        }
    }

    try {
        const entries = fs.readdirSync(scriptDir, { recursive: true, withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name === base) {
                const file = path.join(entry.parentPath || entry.path, entry.name);
                return { file: file, text: fs.readFileSync(file, "utf8") };
            }
        }
    } catch (e) {}

    return null;
}

function setupLogFile(config) {
    if (!config.writeLogFile || process.env.CSVM_LOG_DISABLE === "1") {
        return null;
    }

    const logDir = path.resolve(__dirname, "..", config.logDir || "logs");
    fs.mkdirSync(logDir, { recursive: true });

    const logFilePath = process.env.CSVM_LOG_FILE ||
        path.join(logDir, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);

    const logFd = fs.openSync(logFilePath, "w");
    fs.writeSync(
        logFd,
        `# CSVM run ${new Date().toISOString()}\n` +
        `# cwd: ${process.cwd()}\n` +
        `# scriptHtmlPath: ${config.pageHtmlPath || ""}\n` +
        `# 阶段: framework=框架加载期, challenge=挑战执行期\n` +
        `# 类型: GET=读属性 SET=写属性 HAS=in CALL=函数调用 DESC=Object.getOwnPropertyDescriptor\n` +
        `#       PROTO=Object.getPrototypeOf KEYS=Reflect.ownKeys DEF=defineProperty DEL=delete\n`
    );

    const tee = function (chunk) {
        try { fs.writeSync(logFd, chunk); } catch (e) { /* 落盘失败不影响目标 */ }
    };

    // 直接 console.log 的行（[COOKIE-P]/[EVENTS] 等）要先 flush 聚合中的日志，
    // 否则顺序会颠倒。__flushingLog 防止 flush 自己再次触发。
    let __flushingLog = false;
    function __flushPending() {
        if (__flushingLog) return;
        __flushingLog = true;
        try { if (typeof api !== "undefined" && api && api.flushLog) api.flushLog(); } catch (e) {}
        __flushingLog = false;
    }

    const stdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = function (chunk, encoding, callback) {
        __flushPending();
        tee(chunk);
        return stdoutWrite(chunk, encoding, callback);
    };

    const stderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = function (chunk, encoding, callback) {
        __flushPending();
        tee(chunk);
        return stderrWrite(chunk, encoding, callback);
    };

    process.on("exit", function () {
        try { fs.closeSync(logFd); } catch (e) { /* ignore */ }
    });

    return logFilePath;
}

// [DDA] 语法树级重写：typeof / ! / 条件测试 / && / || 全部改成 __dda* helper，
// 让 document.all 替身在宿主 JS 层也表现为 HTMLDDA（typeof undefined、falsy）。
const __ddaOptions = {
    ecmaVersion: "latest",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowHashBang: true,
};
let __ddaStats = { parsed: 0, failed: 0, transformed: 0 };

function __ddaId(name) { return { type: "Identifier", name }; }
function __ddaArrow(expr) {
    return { type: "ArrowFunctionExpression", id: null, params: [], body: expr, expression: true, async: false, generator: false };
}
function __ddaCall(name, args) {
    return { type: "CallExpression", callee: __ddaId(name), arguments: args, optional: false };
}
const __ddaSkipKeys = { type: 1, start: 1, end: 1, loc: 1, range: 1 };
function __ddaWalk(node) {
    if (!node || typeof node.type !== "string") return node;
    for (const k in node) {
        if (__ddaSkipKeys[k]) continue;
        const v = node[k];
        if (Array.isArray(v)) {
            for (let i = 0; i < v.length; i++) {
                if (v[i] && typeof v[i].type === "string") v[i] = __ddaWalk(v[i]);
            }
        } else if (v && typeof v === "object" && typeof v.type === "string") {
            node[k] = __ddaWalk(v);
        }
    }
    switch (node.type) {
        case "UnaryExpression":
            if (node.operator === "typeof") return __ddaCall("__ddaT", [__ddaArrow(node.argument)]);
            if (node.operator === "!") return __ddaCall("__ddaNot", [__ddaArrow(node.argument)]);
            break;
        case "ConditionalExpression":
            node.test = __ddaCall("__ddaTruthy", [__ddaArrow(node.test)]);
            break;
        case "IfStatement":
        case "WhileStatement":
        case "DoWhileStatement":
            node.test = __ddaCall("__ddaTruthy", [__ddaArrow(node.test)]);
            break;
        case "ForStatement":
            if (node.test) node.test = __ddaCall("__ddaTruthy", [__ddaArrow(node.test)]);
            break;
        case "LogicalExpression":
            if (node.operator === "&&" || node.operator === "||") {
                return __ddaCall(node.operator === "&&" ? "__ddaAnd" : "__ddaOr", [
                    __ddaArrow(node.left),
                    __ddaArrow(node.right),
                ]);
            }
            break;
        default:
            break;
    }
    return node;
}
function __transformEvalCode(code) {
    if (!acorn || !astring) return code;
    if (typeof code !== "string" || code.length < 100) return code;
    let ast;
    try {
        ast = acorn.parse(code, __ddaOptions);
        __ddaStats.parsed++;
    } catch (e) {
        __ddaStats.failed++;
        return code;
    }
    try {
        __ddaWalk(ast);
        const out = astring.generate(ast);
        __ddaStats.transformed++;
        return out;
    } catch (e) {
        __ddaStats.failed++;
        return code;
    }
}

const __sandbox = { console };
// 让沙箱能把 Node 的微任务队列同步清空（模拟 Chrome 每个任务结束后的 microtask checkpoint）
__sandbox.__flushMicrotasks = function () {
    try { if (typeof process._tickCallback === "function") process._tickCallback(); } catch (e) {}
};
if (process.env.CSVM_NO_PROXY === "1") __sandbox.__CSVM_NO_PROXY__ = true;
if (process.env.CSVM_DOM_TRACE === "1") __sandbox.__CSVM_DOM_TRACE = true;
if (process.env.CSVM_NAMED_TRACE === "1") __sandbox.__CSVM_NAMED_TRACE = true;
if (process.env.CSVM_DSQ_TRACE === "1") __sandbox.__CSVM_DSQ_TRACE = true;
if (process.env.CSVM_RAND_SEED) __sandbox.__CSVM_RAND_SEED = Number(process.env.CSVM_RAND_SEED) || 1;
if (process.env.CSVM_FIXED_TIME) __sandbox.__CSVM_FIXED_TIME = Number(process.env.CSVM_FIXED_TIME) || 1794656000000;
if (process.env.CSVM_DSQ_UNDEF === "1") __sandbox.__CSVM_DSQ_UNDEF = true;
if (process.env.CSVM_NO_FETCH === "1") __sandbox.__CSVM_NO_FETCH = true;
if (process.env.CSVM_UA_OVERRIDE) __sandbox.__CSVM_UA_OVERRIDE = process.env.CSVM_UA_OVERRIDE;
if (process.env.CSVM_PLATFORM_OVERRIDE) __sandbox.__CSVM_PLATFORM_OVERRIDE = process.env.CSVM_PLATFORM_OVERRIDE;
if (process.env.CSVM_FCC === "1") __sandbox.__CSVM_FCC = true;
// 原生性补丁对照实验（显式开启才会生效）
if (process.env.CSVM_DDA_DEBUG === "1") __sandbox.__CSVM_DDA_DEBUG = true;
if (process.env.CSVM_DDA) __sandbox.__transformEval = __transformEvalCode;
if (nativeDDA) __sandbox.__makeDDA = nativeDDA.makeDDA;

// 运行时可选：
//   默认 vm2（历史实现，Proxy 沙箱）—— 用于对照/分析。
//   CSVM_RUNTIME=native 用 Node 原生 vm 的真实 V8 context（和 sdenv 同类），
//   不经过 vm2 的 Proxy 与代码改写，挑战的原生语义自检才能通过。
//   CSVM_DOM=jsdom 用 jsdom 作为 DOM 后端（配合原生 vm 的真实 V8 context）：
//   保留框架的 csvm/api/宿主流程，只把手写 DOM 换成 jsdom。需要 CSVM_SCRIPT_HTML。
const USE_NATIVE_VM = process.env.CSVM_RUNTIME === "native";
let VMScript, vm, vmRunner;
if (USE_NATIVE_VM) {
    const nvm = require("node:vm");
    const ctx = nvm.createContext(__sandbox);
    VMScript = function (code, label) { this.code = code; this.label = label; };
    vm = { run: function (s) { return nvm.runInContext(s.code, ctx, { filename: s.label || "anonymous" }); } };
    vmRunner = function (code, label) { return vm.run(new VMScript(code, label)); };
} else {
    VMScript = __vm2mod.VMScript;
    vm = new __vm2mod.VM({ sandbox: __sandbox });
    vmRunner = function (code, label) { return vm.run(new VMScript(code, label)); };
}

// 第一段：框架。返回值只有宿主能拿到，目标代码看不到。
// 诊断用的 VM 插桩代码已移除（保留变量以维持装配顺序）
const vmwatch_code = "";

const api = vmRunner(
    "(function () {\r\n" +
    csvm_code + "\r\n" +
    expose_code + "\r\n" +
    singleton_code + "\r\n" +
    cleanup_code + "\r\n" +
    // 清理完 vm2 的全局后再扫一次：这次能覆盖上面 EXPOSE 挂上去的接口对象，
    // 顺序放在 cleanup 之后，Buffer / VMError 这些已经删了，不会被无谓地修一遍
    "csvm.nativeText.repairAll();\r\n" +
    "csvm.flushMicrotasks = globalThis.__flushMicrotasks;\r\n" +
    "try { delete globalThis.__flushMicrotasks; } catch (e) {}\r\n" +
    // 诊断：按 env 覆盖 navigator 的若干 getter（仅 own-DOM 路径）
    (process.env.CSVM_NAV_OVERRIDE ? (function () {
        try {
            var ov = JSON.parse(process.env.CSVM_NAV_OVERRIDE);
            var js = JSON.stringify(ov);
            return "(function(){var ov=" + js + ";function arrLike(n){var a={length:n,item:function(){return null;},namedItem:function(){return null;},refresh:function(){}};for(var i=0;i<n;i++)a[i]=null;return a;}" +
                "try{var NP=Navigator.prototype;Object.keys(ov).forEach(function(k){if(k.indexOf('__')===0||k==='pluginsLength'||k==='mimeTypesLength')return;try{var d=Object.getOwnPropertyDescriptor(NP,k);Object.defineProperty(NP,k,{configurable:true,enumerable:d?d.enumerable:true,get:csvm.safefunction(function(){return ov[k];},'get '+k)});}catch(e){}});" +
                "if(ov.pluginsLength!==undefined){Object.defineProperty(NP,'plugins',{configurable:true,enumerable:true,get:csvm.safefunction(function(){return arrLike(ov.pluginsLength);},'get plugins')});}" +
                "if(ov.mimeTypesLength!==undefined){Object.defineProperty(NP,'mimeTypes',{configurable:true,enumerable:true,get:csvm.safefunction(function(){return arrLike(ov.mimeTypesLength);},'get mimeTypes')});}" +
                "if(ov.__win){Object.keys(ov.__win).forEach(function(k){try{Object.defineProperty(window,k,{configurable:true,enumerable:true,get:csvm.safefunction(function(){return ov.__win[k];},'get '+k)});}catch(e){}});}" +
                "if(ov.__scr){Object.keys(ov.__scr).forEach(function(k){try{Object.defineProperty(Screen.prototype,k,{configurable:true,enumerable:true,get:csvm.safefunction(function(){return ov.__scr[k];},'get '+k)});}catch(e){}});}" +
                "if(ov.__docBodyNull){try{Object.defineProperty(Document.prototype,'body',{configurable:true,enumerable:true,get:csvm.safefunction(function(){return null;},'get body'),set:undefined});}catch(e){}}" +
                "if(ov.__noSel){try{var __empty=function(){return [];};Document.prototype.querySelectorAll=__empty;Element.prototype.querySelectorAll=__empty;Document.prototype.querySelector=function(){return null;};Element.prototype.querySelector=function(){return null;};Document.prototype.getElementsByTagName=__empty;Element.prototype.getElementsByTagName=__empty;Document.prototype.getElementsByClassName=__empty;Element.prototype.getElementsByClassName=__empty;Document.prototype.getElementById=function(){return null;};}catch(e){}}" +
                "if(ov.__noEvent){try{var __noop=function(){};EventTarget.prototype.addEventListener=__noop;EventTarget.prototype.removeEventListener=__noop;EventTarget.prototype.dispatchEvent=function(){return true;};}catch(e){}}" +
                "if(ov.__noMO){try{window.MutationObserver=function MutationObserver(){this.observe=function(){};this.disconnect=function(){};this.takeRecords=function(){return [];};};csvm.safefunction(window.MutationObserver,'MutationObserver');}catch(e){}}" +
                "if(ov.__treeTrim){try{var __tl=ov.__treeTrim==='meta'?document.getElementsByTagName('meta'):(ov.__treeTrim==='head'?(document.head?[document.head]:[]):[]);for(var __ti=__tl.length-1;__ti>=0;__ti--){var __tn=__tl[__ti];if(__tn&&__tn.parentNode)__tn.parentNode.removeChild(__tn);}}catch(e){}}" +
                "if(ov.__webglNull){try{var __gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t){if(String(t).indexOf('webgl')!==-1)return null;return __gc.apply(this,arguments);};}catch(e){}}" +
                "if(ov.__fontFixed){try{var __mt=CanvasRenderingContext2D.prototype.measureText;CanvasRenderingContext2D.prototype.measureText=function(t){var r=__mt.apply(this,arguments);try{r.width=0;}catch(e){return {width:0};}return r;};}catch(e){}}" +
                "if(ov.__canvasFixed){try{HTMLCanvasElement.prototype.toDataURL=function(){return 'data:image/png;base64,';};var __gi=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(x,y,w,h){w=w|0;h=h|0;return {width:w,height:h,data:new Uint8ClampedArray(w*h*4),colorSpace:'srgb'};};}catch(e){}}" +
                "}catch(e){}})();\r\n";
        } catch (e) { return ""; }
    })() : "") +
    vmwatch_code + "\r\n" +
    // 元素属性读写监控（默认关闭）。放在 IIFE 内部、expose 之后、return 之前，
    // 才能同时拿到 csvm 和 Element/HTMLElement 等构造器。
    (process.env.CSVM_ELEM_TRACE === "1"
        ? "try {\r\n" + fs.readFileSync(path.join(__dirname, "csvm", "browser", "element_trace.js"), "utf8") + "\r\n} catch (e) { console.error('[ELEM-TRACE] 安装失败:', e && e.message); }\r\n"
        : "") +
    "return {\r\n" +
    "    setPhase: function (p) { csvm.memory.runPhase = p; },\r\n" +
    "    setConfig: function (k, v) { csvm.memory.config[k] = v; },\r\n" +
    "    installNativeDDA: function () {\r\n" +
    "        var make = globalThis.__makeDDA;\r\n" +
    "        try { delete globalThis.__makeDDA; } catch (e) {}\r\n" +
    "        if (typeof make !== 'function') return false;\r\n" +
    "        var obj;\r\n" +
    "        try { obj = make(); } catch (e) { return false; }\r\n" +
    "        if (typeof obj !== 'undefined') return false;\r\n" +
    "        if (typeof csvm.decorateNativeAll === 'function') csvm.decorateNativeAll(obj);\r\n" +
    "        if (globalThis.__CSVM_DDA_DEBUG) try { console.log('[DDA-NATIVE-CHECK] typeof=' + (typeof obj) + ' bool=' + (!!obj) + ' eqUndef=' + (obj === undefined) + ' str=' + String(obj) + ' len=' + obj.length + ' ctor=' + (obj.constructor && obj.constructor.name) + ' inst=' + (typeof HTMLAllCollection === 'function' ? (obj instanceof HTMLAllCollection) : 'n/a')); } catch (e) {}\r\n" +
    "        if (globalThis.__CSVM_DDA_DEBUG) try { (function(){ var a=obj; function S(f){try{return String(f());}catch(e){return 'ERR:'+e.message;}} var o={typeof:typeof a,not:!a,eqU:a===undefined,neU:a!==undefined,eqN:a===null,looseN:a==null,looseU:a==undefined,str:S(function(){return String(a);}),tag:S(function(){return Object.prototype.toString.call(a);}),len:a.length,tags:(function(){var o=[];for(var i=0;i<a.length;i++){try{o.push(a[i]&&a[i].tagName);}catch(e){o.push('E');}}return o;})(),idx0:a[0]?a[0].tagName:null,item0:(typeof a.item==='function'&&a.item(0))?a.item(0).tagName:'noitem',keys:Object.keys(a).slice(0,12),own:Object.getOwnPropertyNames(a).slice(0,12),forin:(function(){var c=0;for(var k in a)c++;return c;})(),json:S(function(){return JSON.stringify(a);}),docAllSame:(document.all===a),ownDesc:!!Object.getOwnPropertyDescriptor(a,'0'),proto:a.constructor&&a.constructor.prototype===Object.getPrototypeOf(a)}; console.log('[DDA-FULL] '+JSON.stringify(o)); })(); } catch(e){ try{console.log('[DDA-FULL-ERR] '+e.message);}catch(_){} }\r\n" +
    "        csvm.memory.ddaObject = obj;\r\n" +
    "        csvm.memory.hasNativeDda = true;\r\n" +
    "        return true;\r\n" +
    "    },\r\n" +
    "    dumpWindowKeys: function () {\r\n" +
    "        try { return Reflect.ownKeys(globalThis).map(function (k) { return typeof k === 'symbol' ? String(k) : String(k); }); } catch (e) { return []; }\r\n" +
    "    },\r\n" +
    "    dumpTs: function () {\r\n" +
    "        try {\r\n" +
    "            var t = globalThis.$_ts;\r\n" +
    "            var out = {};\r\n" +
    "            if (t && (typeof t === 'object' || typeof t === 'function')) {\r\n" +
    "                Reflect.ownKeys(t).forEach(function (k) {\r\n" +
    "                    var v; try { v = t[k]; } catch (e) { out[String(k)] = 'THROW'; return; }\r\n" +
    "                    var tp = typeof v;\r\n" +
    "                    out[String(k)] = tp === 'function' ? 'function' : tp === 'object' ? (v === null ? 'null' : 'object') : String(v).slice(0, 300);\r\n" +
    "                });\r\n" +
    "            }\r\n" +
    "            return JSON.stringify(out);\r\n" +
    "        } catch (e) { return String(e); }\r\n" +
    "    },\r\n" +
    "    postSnapshot: function () {\r\n" +
    "        try {\r\n" +
    "            return JSON.stringify({\r\n" +
    "                docOwn: Object.getOwnPropertyNames(document),\r\n" +
    "                winEqGlobal: window === globalThis,\r\n" +
    "                selfEqWin: self === window,\r\n" +
    "                refDesc: (function () { var d = Object.getOwnPropertyDescriptor(document, 'referrer'); return d ? { get: !!d.get, en: d.enumerable, cf: d.configurable } : null; })(),\r\n" +
    "                cookie: document.cookie,\r\n" +
    "                allLen: (function () { try { return document.all.length; } catch (e) { return -1; } })(),\r\n" +
    "                allDda: (function () { try { var a = document.all; return { typeof: typeof a, not: !a, eqU: a === undefined, neU: a !== undefined, looseN: a == null, str: String(a), len: a.length, call0: (function(){ try { var r = a(0); return r ? (r.tagName || typeof r) : String(r); } catch(e){ return 'ERR:'+e.message; } })(), item0: (typeof a.item === 'function' && a.item(0)) ? a.item(0).tagName : 'noitem', tag: Object.prototype.toString.call(a) }; } catch (e) { return 'ERR:' + e.message; } })(),\r\n" +
    "                tsKeys: (function () { try { var t = globalThis.$_ts; return t ? Reflect.ownKeys(t).map(String) : null; } catch (e) { return String(e); } })(),\r\n" +
    "                atP: (function () { try { return csvm.memory.__pDump ? JSON.parse(csvm.memory.__pDump) : null; } catch (e) { return String(e); } })(),\r\n" +
    "                ctors: (function () {\r\n" +
    "                    try {\r\n" +
    "                        var n = function (x) { try { return x && x.constructor && x.constructor.name; } catch (e) { return 'ERR'; } };\r\n" +
    "                        return {\r\n" +
    "                            doc: n(document), nav: n(navigator), loc: n(location), hist: n(history), screen: n(screen),\r\n" +
    "                            ls: n(localStorage), body: n(document.body), head: n(document.head), all: n(document.all), conn: n(navigator.connection),\r\n" +
    "                            docProto: Object.getPrototypeOf(document) === HTMLDocument.prototype,\r\n" +
    "                            docIsHTMLDocument: document instanceof HTMLDocument,\r\n" +
    "                            docIsDocument: document instanceof Document,\r\n" +
    "                            docIsNode: document instanceof Node,\r\n" +
    "                            navIsNavigator: navigator instanceof Navigator,\r\n" +
    "                            locIsLocation: location instanceof Location,\r\n" +
    "                            histIsHistory: history instanceof History,\r\n" +
    "                            screenIsScreen: screen instanceof Screen,\r\n" +
    "                            lsIsStorage: localStorage instanceof Storage\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                protoKeys: (function () {\r\n" +
    "                    try {\r\n" +
    "                        var p = function (x) { try { return Object.getOwnPropertyNames(Object.getPrototypeOf(x)); } catch (e) { return 'ERR'; } };\r\n" +
    "                        return {\r\n" +
    "                            conn: p(navigator.connection),\r\n" +
    "                            wps: navigator.webkitPersistentStorage ? p(navigator.webkitPersistentStorage) : null,\r\n" +
    "                            storage: p(localStorage),\r\n" +
    "                            history: p(history),\r\n" +
    "                            location: p(location),\r\n" +
    "                            screen: p(screen),\r\n" +
    "                            nav: p(navigator)\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                ident: (function () {\r\n" +
    "                    try {\r\n" +
    "                        return {\r\n" +
    "                            locSame: document.location === window.location,\r\n" +
    "                            docSame: window.document === document,\r\n" +
    "                            navSame: window.navigator === navigator,\r\n" +
    "                            screenSame: window.screen === screen,\r\n" +
    "                            histSame: window.history === history,\r\n" +
    "                            lsSame: window.localStorage === localStorage,\r\n" +
    "                            selfDoc: self.document === document,\r\n" +
    "                            topDoc: top.document === document\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                bools: (function () {\r\n" +
    "                    try {\r\n" +
    "                        return {\r\n" +
    "                            cookieEnabled: navigator.cookieEnabled,\r\n" +
    "                            onLine: navigator.onLine,\r\n" +
    "                            pdf: navigator.pdfViewerEnabled,\r\n" +
    "                            secure: window.isSecureContext,\r\n" +
    "                            fullscreen: document.fullscreenEnabled,\r\n" +
    "                            focus: document.hasFocus(),\r\n" +
    "                            locks: Object.prototype.toString.call(navigator.locks),\r\n" +
    "                            pluginsLen: navigator.plugins ? navigator.plugins.length : -1,\r\n" +
    "                            mimesLen: navigator.mimeTypes ? navigator.mimeTypes.length : -1,\r\n" +
    "                            plugin0: navigator.plugins && navigator.plugins[0] ? navigator.plugins[0].name : null,\r\n" +
    "                            pluginsTag: Object.prototype.toString.call(navigator.plugins),\r\n" +
    "                            mime0: navigator.mimeTypes && navigator.mimeTypes[0] ? navigator.mimeTypes[0].type : null\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                globals: (function () {\r\n" +
    "                    try {\r\n" +
    "                        var out = [];\r\n" +
    "                        Reflect.ownKeys(window).forEach(function (k) {\r\n" +
    "                            if (typeof k !== 'string' || k.indexOf('_$') !== 0) return;\r\n" +
    "                            var v; try { v = window[k]; } catch (e) { out.push([k, 'THROW']); return; }\r\n" +
    "                            var t = typeof v;\r\n" +
    "                            if (t === 'string') out.push([k, 'str', v.length, v.slice(0, 160)]);\r\n" +
    "                            else if (t === 'function') out.push([k, 'fn']);\r\n" +
    "                            else if (t === 'object' && v) { try { out.push([k, 'obj', Array.isArray(v) ? ('arr:' + v.length) : Object.keys(v).slice(0, 24).join(',')]); } catch (e) { out.push([k, 'obj']); } }\r\n" +
    "                            else out.push([k, t]);\r\n" +
    "                        });\r\n" +
    "                        return out;\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                winKeys: (function () { try { return Reflect.ownKeys(window).map(String); } catch (e) { return String(e); } })()\r\n" +
    "            });\r\n" +
    "        } catch (e) { return String(e); }\r\n" +
    "    },\r\n" +
    "    snapshot: function () {\r\n" +
    "        try {\r\n" +
    "            var metas = document.getElementsByTagName('meta');\r\n" +
    "            var meta = metas.length > 1 ? metas[1] : metas[0];\r\n" +
    "            var tags = [];\r\n" +
    "            var all = document.getElementsByTagName('*');\r\n" +
    "            for (var i = 0; i < all.length; i++) tags.push(all[i].tagName);\r\n" +
    "            return JSON.stringify({\r\n" +
    "                allLen: (function () { try { return document.all.length; } catch (e) { return 'ERR:' + e.message; } })(),\r\n" +
    "                allDda: (function () { try { var a = document.all; return { typeof: typeof a, not: !a, eqU: a === undefined, neU: a !== undefined, looseN: a == null, str: String(a), len: a.length, call0: (function(){ try { var r = a(0); return r ? (r.tagName || typeof r) : String(r); } catch(e){ return 'ERR:'+e.message; } })(), item0: (typeof a.item === 'function' && a.item(0)) ? a.item(0).tagName : 'noitem', tag: Object.prototype.toString.call(a) }; } catch (e) { return 'ERR:' + e.message; } })(),\r\n" +
    "                tags: tags,\r\n" +
    "                scripts: document.getElementsByTagName('script').length,\r\n" +
    "                bodyChildren: document.body ? document.body.childNodes.length : -1,\r\n" +
    "                headChildren: document.head ? document.head.childNodes.length : -1,\r\n" +
    "                metaR: meta ? meta.getAttribute('r') : null,\r\n" +
    "                bodyFirstType: document.body && document.body.firstChild ? document.body.firstChild.nodeType : null,\r\n" +
    "                cookie: document.cookie,\r\n" +
    "                docOwn: (function () { try { return Object.getOwnPropertyNames(document); } catch (e) { return String(e); } })(),\r\n" +
    "                refInfo: (function () { try { var d = Object.getOwnPropertyDescriptor(document, 'referrer'); if (!d) return null; return { get: !!d.get, set: !!d.set, en: d.enumerable, cf: d.configurable, getName: d.get && d.get.name, protoHas: !!Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'referrer') }; } catch (e) { return String(e); } })(),\r\n" +
    "                ids: (function () { try { return { winEqGlobal: window === globalThis, selfEqWin: self === window, topEqWin: top === window, parentEqWin: parent === window, framesEqWin: frames === window, winWin: window.window === window }; } catch (e) { return String(e); } })(),\r\n" +
    "                html: document.documentElement && document.documentElement.outerHTML != null ? document.documentElement.outerHTML.slice(0, 4000) : null\r\n" +
    "            });\r\n" +
    "        } catch (e) { return JSON.stringify({ error: String(e) }); }\r\n" +
    "    },\r\n" +
    "    installEvalPatch: function () {\r\n" +
    "        var __origEval = eval;\r\n" +
    "        var __apply = Reflect.apply;\r\n" +
    "        var __transform = globalThis.__transformEval;\r\n" +
    "        try { delete globalThis.__transformEval; } catch (e) {}\r\n" +
    "        var __ddaIs = function (v) { return !!(v && v.__rsdda); };\r\n" +
    "        var __ddaT = function (fn) { var v; try { v = fn(); } catch (e) { if (e instanceof ReferenceError) v = undefined; else throw e; } return __ddaIs(v) ? 'undefined' : typeof v; };\r\n" +
    "        var __ddaNot = function (fn) { var v = fn(); return __ddaIs(v) ? true : !v; };\r\n" +
    "        var __ddaTruthy = function (fn) { var v = fn(); return __ddaIs(v) ? false : !!v; };\r\n" +
    "        var __ddaAnd = function (fa, fb) { var a = fa(); return (a && !__ddaIs(a)) ? fb() : a; };\r\n" +
    "        var __ddaOr = function (fa, fb) { var a = fa(); return (a && !__ddaIs(a)) ? a : fb(); };\r\n" +
    "        var __helpers = { __ddaT: __ddaT, __ddaNot: __ddaNot, __ddaTruthy: __ddaTruthy, __ddaAnd: __ddaAnd, __ddaOr: __ddaOr };\r\n" +
    "        for (var __k in __helpers) Object.defineProperty(globalThis, __k, { value: __helpers[__k], writable: true, enumerable: false, configurable: true });\r\n" +
    "        var __patch = function (code) {\r\n" +
    "            if (csvm.memory.config.ddaNoop) return code;\r\n" +
    "            if (csvm.memory.config.ddaComment) return code + '\\n//x';\r\n" +
    "            if (typeof __transform !== 'function') return code;\r\n" +
    "            try { return __transform(code); } catch (e) { return code; }\r\n" +
    "        };\r\n" +
    "        var __wrapped = new Proxy(__origEval, {\r\n" +
    "            apply: function (target, thisArg, args) {\r\n" +
    "                try {\r\n" +
    "                    if (args.length && typeof args[0] === 'string') args[0] = __patch(args[0]);\r\n" +
    "                } catch (e) {}\r\n" +
    "                return __apply(target, thisArg, args);\r\n" +
    "            }\r\n" +
    "        });\r\n" +
    "        csvm.safefunction(__wrapped, 'eval');\r\n" +
    "        Object.defineProperty(globalThis, 'eval', { value: __wrapped, writable: true, enumerable: false, configurable: true });\r\n" +
    "    },\r\n" +
    "    runTimers: function (n, d) { try { return typeof csvm.runTimers === 'function' ? csvm.runTimers(n, d) : 0; } catch (e) { return -1; } },\r\n" +
    "    installVmTrace: function () {\r\n" +
    "        if (typeof csvm.installVmWatch === 'function') csvm.installVmWatch();\r\n" +
    "        globalThis.__vmTraceOn = true;\r\n" +
    "        globalThis.__adOn = true;\r\n" +
    "        globalThis.__adCur = [];\r\n" +
    "        globalThis.__adN = 0;\r\n" +
    "        globalThis.__adCall = 0;\r\n" +
    "        globalThis.__adC = 0;\r\n" +
    "        globalThis.__vmTrace = [];\r\n" +
    "        globalThis.__vmDumped = false;\r\n" +
    "        globalThis.__vmtrace = null;\r\n" +
    "        globalThis.__vmpatch = 0;\r\n" +
    "        globalThis.__vmArrIds = new WeakMap();\r\n" +
    "        globalThis.__vmArrSeq = 0;\r\n" +
    "        globalThis.__op269 = [];\r\n" +
    "        try {\r\n" +
    "            if (typeof globalThis.setTimeout === 'function' && !globalThis.__tqWrapped) {\r\n" +
    "                globalThis.__tqWrapped = true;\r\n" +
    "                globalThis.__tqN = 0;\r\n" +
    "                var __ost = globalThis.setTimeout;\r\n" +
    "                var __wst = function (fn, d) {\r\n" +
    "                    if (typeof fn === 'function') {\r\n" +
    "                        var id = ++globalThis.__tqN;\r\n" +
    "                        try { if (globalThis.__vmw) globalThis.__vmw('timer-reg', { id: id, d: String(d), stack:(new Error()).stack.split(String.fromCharCode(10)).slice(1,6).join(String.fromCharCode(124,32)) }); } catch (e) {}\r\n" +
    "                        var w = function () { globalThis.__curT = id; try { if (globalThis.__vmw) globalThis.__vmw('timer-run', { id: id, d: String(d) }); } catch (e) {} try { return fn.apply(this, arguments); } finally { globalThis.__curT = null; } };\r\n" +
    "                        return __ost.call(globalThis, w, d);\r\n" +
    "                    }\r\n" +
    "                    return __ost.apply(globalThis, arguments);\r\n" +
    "                };\r\n" +
    "                try { csvm.safefunction(__wst, 'setTimeout'); } catch (e) {}\r\n" +
    "                try { Object.defineProperty(globalThis, 'setTimeout', { value: __wst, writable: true, enumerable: false, configurable: true }); } catch (e) {}\r\n" +
    "            }\r\n" +
    "        } catch (e) {}\r\n" +
    "        try {\r\n" +
    "            if (!globalThis.__dgWrapped) {\r\n" +
    "                globalThis.__dgWrapped = true;\r\n" +
    "                var __odg = Object.prototype.__defineGetter__;\r\n" +
    "                var __ods = Object.prototype.__defineSetter__;\r\n" +
    "                var __dgTag = function (o) {\r\n" +
    "                    try {\r\n" +
    "                        if (o === globalThis) return 'window';\r\n" +
    "                        if (o === globalThis.document) return 'document';\r\n" +
    "                        if (o === globalThis.navigator) return 'navigator';\r\n" +
    "                        return (o && o.constructor && o.constructor.name) || typeof o;\r\n" +
    "                    } catch (e) { return 'err'; }\r\n" +
    "                };\r\n" +
    "                if (typeof __odg === 'function') Object.prototype.__defineGetter__ = function (k, fn) {\r\n" +
    "                    try { if (globalThis.__vmw) globalThis.__vmw('dget', { k: String(k), tg: __dgTag(this) }); } catch (e) {}\r\n" +
    "                    return __odg.call(this, k, fn);\r\n" +
    "                };\r\n" +
    "                if (typeof __ods === 'function') Object.prototype.__defineSetter__ = function (k, fn) {\r\n" +
    "                    try { if (globalThis.__vmw) globalThis.__vmw('dset', { k: String(k), tg: __dgTag(this) }); } catch (e) {}\r\n" +
    "                    return __ods.call(this, k, fn);\r\n" +
    "                };\r\n" +
    "            }\r\n" +
    "        } catch (e) {}\r\n" +
    "        try {\r\n" +
    "            if (!globalThis.__dpWrapped) {\r\n" +
    "                globalThis.__dpWrapped = true;\r\n" +
    "                var __odp = Object.defineProperty;\r\n" +
    "                var __rdp = Reflect.defineProperty;\r\n" +
    "                var __dpTag = function (o) {\r\n" +
    "                    try {\r\n" +
    "                        if (o === globalThis) return 'window';\r\n" +
    "                        if (o === globalThis.document) return 'document';\r\n" +
    "                        if (o === globalThis.navigator) return 'navigator';\r\n" +
    "                        if (o === globalThis.location) return 'location';\r\n" +
    "                        var c = o && o.constructor && o.constructor.name;\r\n" +
    "                        if (c === 'Window' || c === 'Document' || c === 'Navigator' || c === 'Location' || c === 'HTMLDocument') return 'proto:' + c;\r\n" +
    "                    } catch (e) {}\r\n" +
    "                    return '';\r\n" +
    "                };\r\n" +
    "                var __dpLog = function (o, k, d, ok, err) {\r\n" +
    "                    try {\r\n" +
    "                        if (!globalThis.__vmw) return;\r\n" +
    "                        var tag = __dpTag(o);\r\n" +
    "                        if (!tag && ok) return;\r\n" +
    "                        globalThis.__vmw('dp', { tag: tag, k: String(k), get: !!(d && d.get), set: !!(d && d.set), v: d && typeof d.value, en: d && d.enumerable, cf: d && d.configurable, ok: ok ? 1 : 0, err: err || '' });\r\n" +
    "                    } catch (e) {}\r\n" +
    "                };\r\n" +
    "                try {\r\n" +
    "                    __odp(Object, 'defineProperty', { value: function (o, k, d) {\r\n" +
    "                        try { var r = __odp(o, k, d); __dpLog(o, k, d, 1); return r; }\r\n" +
    "                        catch (e) { __dpLog(o, k, d, 0, String(e && e.message)); throw e; }\r\n" +
    "                    }, writable: true, enumerable: false, configurable: true });\r\n" +
    "                } catch (e) {}\r\n" +
    "                try {\r\n" +
    "                    __odp(Reflect, 'defineProperty', { value: function (o, k, d) {\r\n" +
    "                        try { var r = __rdp(o, k, d); __dpLog(o, k, d, 1); return r; }\r\n" +
    "                        catch (e) { __dpLog(o, k, d, 0, String(e && e.message)); throw e; }\r\n" +
    "                    }, writable: true, enumerable: false, configurable: true });\r\n" +
    "                } catch (e) {}\r\n" +
    "            }\r\n" +
    "        } catch (e) {}\r\n" +
    "        globalThis.__tsSnap = function () {\r\n" +
    "            try {\r\n" +
    "                var t = globalThis.$_ts;\r\n" +
    "                if (!t) return 'none';\r\n" +
    "                var o = {}, ks = Object.keys(t);\r\n" +
    "                for (var i = 0; i < ks.length; i++) {\r\n" +
    "                    var v; try { v = t[ks[i]]; } catch (e) { o[ks[i]] = 'THROW'; continue; }\r\n" +
    "                    var tp = typeof v;\r\n" +
    "                    o[ks[i]] = tp === 'function' ? 'fn' : (tp === 'object' && v !== null) ? ('obj' + (v.length !== undefined ? ' len=' + v.length : '')) : String(v).slice(0, 60);\r\n" +
    "                }\r\n" +
    "                return JSON.stringify(o);\r\n" +
    "            } catch (e) { return 'err:' + (e && e.message); }\r\n" +
    "        };\r\n" +
    "        var __oj = Array.prototype.join;\r\n" +
    "        Array.prototype.join = new Proxy(__oj, { apply: function (t, th, args) {\r\n" +
    "            var r = Reflect.apply(t, th, args);\r\n" +
    "            try {\r\n" +
    "                if (typeof r === 'string' && r.indexOf('https:') === 0 && !globalThis.__vmDumped) {\r\n" +
    "                    globalThis.__vmDumped = true;\r\n" +
    "                    // 先存一版 https 时刻的快照，但不停止录制：后面 CSVM_JOIN_SEQ\n" +
    "                    // 会在第 40 次挑战 join 时覆盖成更晚的快照\r\n" +
    "                    globalThis.__vmtrace = JSON.stringify({ head: r.slice(0, 60), trace: globalThis.__vmTrace.slice() });\r\n" +
    "                }\r\n" +
    "            } catch (e) {}\r\n" +
    "            return r;\r\n" +
    "        } });\r\n" +
    "        var __origEval = eval;\r\n" +
    "        var __wrapped = new Proxy(__origEval, { apply: function (t, th, args) {\r\n" +
    "            try {\r\n" +
    "                if (args.length && typeof args[0] === 'string' && args[0].length > 10000) {\r\n" +
    "                    try { if (typeof globalThis.__vmw === 'function') { var __h=0, __cs=args[0]; for (var __ci=0; __ci<__cs.length; __ci++) __h=(__h*31+__cs.charCodeAt(__ci))|0; globalThis.__vmw('eval-src',{cdLen:(globalThis.$_ts&&typeof globalThis.$_ts.cd==='string')?globalThis.$_ts.cd.length:-1,aebiInfo:(function(){try{var a=globalThis.$_ts.aebi,o=[];for(var i=0;i<a.length;i++){var v=a[i],s=typeof v;if(v&&typeof v.length==='number'){var h=0;try{for(var j=0;j<v.length;j++)h=(h*31+((typeof v[j]==='number')?v[j]:String(v[j]).charCodeAt(0)))|0;}catch(e){}s+=':'+v.length+':h'+h;}else{s+=':'+String(v).slice(0,30);}o.push(s);}return o.join('|');}catch(e){return 'err:'+e.message;}})(),scjLen:(globalThis.$_ts&&globalThis.$_ts.scj&&typeof globalThis.$_ts.scj.length==='number')?globalThis.$_ts.scj.length:-1,aebiLen:(globalThis.$_ts&&globalThis.$_ts.aebi&&typeof globalThis.$_ts.aebi.length==='number')?globalThis.$_ts.aebi.length:-1,cdH:(function(){try{var c=globalThis.$_ts&&globalThis.$_ts.cd;if(typeof c!=='string')return -1;var h=0;for(var i=0;i<c.length;i++)h=(h*31+c.charCodeAt(i))|0;return h;}catch(e){return -2;}})(),n:(globalThis.__evalN=(globalThis.__evalN||0)+1),len:__cs.length,h:__h,head:__cs.slice(0,80)}); } } catch (e) {}\r\n" +
    "                    if (!globalThis.__vmsrc) globalThis.__vmsrc = args[0];\r\n" +
    "                    var __re = /while\\(1\\)\\{([A-Za-z_$][\\w$]*)=([A-Za-z_$][\\w$]*)\\[([A-Za-z_$][\\w$]*)\\+\\+\\];/g;\r\n" +
    "                    var __n = 0;\r\n" +
    "                    args[0] = args[0].replace(__re, function (m, op, arr, pc) {\r\n" +
    "                        __n++;\r\n" +
    "                        return 'while(1){' + op + '=' + arr + '[' + pc + '];if(globalThis.__vmTraceOn){try{var __ai=globalThis.__vmArrIds.get(' + arr + ');if(__ai===undefined){__ai=++globalThis.__vmArrSeq;globalThis.__vmArrIds.set(' + arr + ',__ai);}globalThis.__vmTrace.push([' + pc + ',' + op + ',__ai,' + JSON.stringify(pc) + ']);globalThis.__curPc=' + pc + ';if(globalThis.__vmTrace.length>20000)globalThis.__vmTrace.splice(0,10000);}catch(e){}}if(' + pc + '===363){try{console.log(\"[CR363] cH=\"+String(_$cH)+\" gt=\"+String(_$gt));}catch(e){}}' + pc + '++;';\r\n" +
    "                    });\r\n" +
    "                    globalThis.__vmpatch = __n;\r\n" +
    "                    if (globalThis.__CSVM_FB_TRACE) {\r\n" +
    "                        try {\r\n" +
    "                            args[0] = args[0].replace('function _$fb(_$ao,_$hV){', 'function _$fb(_$ao,_$hV){try{if(_$hV&&_$hV.length<=8)console.log(\"[FB] pc=\"+globalThis.__adPc+\" retN=\"+globalThis.__retN+\" cs=\"+(globalThis.__csStr?globalThis.__csStr(8):\"\")+\" data=\"+JSON.stringify(_$hV)+\" stack=\"+String(new Error().stack).slice(0,260));}catch(e){}');\r\n" +
    "                        } catch (e) {}\r\n" +
    "                    }\r\n" +
    "                    if (csvm.memory.config.op269) {\r\n" +
    "                        var __old = 'else if(_$$z===269){_$dY=_$cc[_$iW[32]];}';\r\n" +
    "                        var __new = 'else if(_$$z===269){try{_$dY=_$cc[_$iW[32]];var __d=Object.getOwnPropertyDescriptor(window,\"location\");globalThis.__op269.push({ok:1,obj:String(_$cc),key:String(_$iW[32]),val:String(_$dY),same:_$cc===window,winLoc:String(window.location),globLoc:String(location),hasLoc:(\"location\" in _$cc),fwLoc:(typeof __fwLoc!==\"undefined\"?String(__fwLoc):\"NO\"),sameFw:(window.location===__fwLoc),desc:__d?{get:typeof __d.get,set:typeof __d.set,cf:__d.configurable}:null});}catch(e){globalThis.__op269.push({ok:0,obj:String(_$cc),key:String(_$iW[32]),err:String(e&&e.message),same:_$cc===window,winLoc:String(window.location),globLoc:String(location),hasLoc:(\"location\" in _$cc)});throw e;}}';\r\n" +
    "                        if (args[0].indexOf(__old) !== -1) args[0] = args[0].split(__old).join(__new);\r\n" +
    "                    }\r\n" +
    "                    if (csvm.memory.config.gr660 && typeof csvm.applyVmWatch === 'function') {\r\n" +
    "                        args[0] = csvm.applyVmWatch(args[0]);\r\n" +
    "                    }\r\n" +
    "                }\r\n" +
    "            } catch (e) {}\r\n" +
    "            try { if (args.length && typeof args[0] === 'string' && args[0].length > 1000 && csvm.memory.__srcUrl) args[0] = args[0] + String.fromCharCode(10) + csvm.memory.__srcUrl; } catch (e) {} " +
    "            var __er = Reflect.apply(t, th, args); " +
    "            try { if (typeof globalThis.__vmw === 'function') globalThis.__vmw('eval-ret', { t: typeof __er, v: (__er && typeof __er === 'object') ? ('obj:' + Object.prototype.toString.call(__er)) : String(__er).slice(0, 120) }); } catch (e) {}\r\n" +
    "            return __er;\r\n" +
    "        } });\r\n" +
    "        csvm.safefunction(__wrapped, 'eval');\r\n" +
    "        Object.defineProperty(globalThis, 'eval', { value: __wrapped, writable: true, enumerable: false, configurable: true });\r\n" +
    "    },\r\n" +
    "    getVmTrace: function () { return globalThis.__vmtrace || null; },\r\n" +
    "    getVmTraceFull: function () { try { return JSON.stringify({ head: 'full', trace: (globalThis.__vmTrace || []).slice() }); } catch (e) { return '[]'; } },\r\n" +
    "    getOp269: function () { return JSON.stringify(globalThis.__op269 || []); },\r\n" +
    "    getVmWatch: function () { return typeof csvm.vmWatchDump === 'function' ? csvm.vmWatchDump() : '[]'; },\r\n" +
    "    rebuildDomFromTree: function (tree) { try { return typeof csvm.rebuildDom === 'function' ? csvm.rebuildDom(tree) : 0; } catch (e) { return 'err:' + (e && e.message); } },\r\n" +
    "    setSrcUrl: function (u) { try { csvm.memory.__srcUrl = String(u); return true; } catch (e) { return false; } },\r\n" +
    "    getReflectLog: function () { try { return JSON.stringify(csvm.memory.reflectLog || []); } catch (e) { return '[]'; } },\r\n" +
    "    getRandomLog: function () { try { return JSON.stringify(csvm.memory.randomLog || []); } catch (e) { return '[]'; } },\r\n" +
    "    getAdRing: function () { try { return globalThis.__adRingGet ? globalThis.__adRingGet() : '[]'; } catch (e) { return '[]'; } },\r\n" +
    "    getTask9Info: function () {\r\n" +
    "        try {\r\n" +
    "            var t = csvm.memory.task9; if (!t) return 'null';\r\n" +
    "            function call(f) { try { var r = f(); return { t: typeof r, v: JSON.stringify(r).slice(0, 600), s: String(r).slice(0, 300) }; } catch (e) { return { err: String(e && e.message) }; } }\r\n" +
    "            var o = { keys: Object.keys(t), h7: call(t._$h7), bO: call(t._$bO), h7src: String(t._$h7).slice(0, 400), bOsrc: String(t._$bO).slice(0, 400) };\r\n" +
    "            return JSON.stringify(o);\r\n" +
    "        } catch (e) { return 'ERR:' + e.message; }\r\n" +
    "    },\r\n" +
    "    getVmSrc: function () { return globalThis.__vmsrc || null; },\r\n" +
    "    getVmPatch: function () { return globalThis.__vmpatch || 0; },\r\n" +
    "    fireEvent: function (type) { try { return typeof csvm.fireEvent === 'function' ? (csvm.fireEvent(window, type) + csvm.fireEvent(document, type)) : 0; } catch (e) { return -1; } },\r\n" +
    "    showlog: function () { csvm.print.showlog(); },\r\n" +
    "    flushLog: function () { try { csvm.print.flushStream(); } catch (e) {} },\r\n" +
    "    nativeText: function () { return csvm.nativeText.report(); },\r\n" +
    // 启动模式由框架内存里的 config 决定，宿主侧只读，不直接碰沙箱内部
    "    seedCookie: function (name, value) { try { csvm.memory.cookieJar[String(name)] = String(value); var out = []; for (var k in csvm.memory.cookieJar) out.push(k + '=' + csvm.memory.cookieJar[k]); csvm.memory.cookieHeader = out.join('; '); return true; } catch (e) { return false; } },\r\n" +
    "    getConfig: function () {\r\n" +
    "        return {\r\n" +
    "            pageMode: !!csvm.memory.config.pageMode,\r\n" +
    "            pageHtmlPath: csvm.memory.config.pageHtmlPath,\r\n" +
    "            externalScriptDir: csvm.memory.config.externalScriptDir,\r\n" +
    "            writeLogFile: !!csvm.memory.config.writeLogFile,\r\n" +
    "            logDir: csvm.memory.config.logDir\r\n" +
    "        };\r\n" +
    "    }\r\n" +
    "};\r\n" +
    "})();",
    "框架"
);

// 把 flush 能力收进 csvm（不留在 window 上被目标扫到），供 runTimers / fireEvent 使用
// 阶段切换放在目标脚本执行前（见下方 setupLogFile 之后），
// 这样环境安装/探针阶段的日志不会被误标成 challenge。

// 宿主侧覆盖配置（不影响默认行为）：便于自动化跑指定挑战、静默模式
if (process.env.CSVM_SCRIPT_HTML) api.setConfig("pageHtmlPath", process.env.CSVM_SCRIPT_HTML);
// 预置 cookie（name=value; name2=value2），挑战通常需要 O cookie 才能算出被服务端接受的 P
if (process.env.CSVM_COOKIE) {
    String(process.env.CSVM_COOKIE).split(";").forEach(function (pair) {
        var i = pair.indexOf("=");
        if (i <= 0) return;
        var n = pair.slice(0, i).trim();
        var v = pair.slice(i + 1).trim();
        if (n) { try { api.seedCookie(n, v); } catch (e) {} }
    });
}
if (process.env.CSVM_SCRIPT_DIR) api.setConfig("externalScriptDir", process.env.CSVM_SCRIPT_DIR);
if (process.env.CSVM_QUIET === "1") {
    api.setConfig("liveLog", false);
    api.setConfig("summaryTable", false);
    api.setConfig("writeLogFile", false);
    api.setConfig("captureLog", false);
}
// 只关掉跑完后的汇总表格，保留运行中的同步日志
if (process.env.CSVM_NO_TABLE === "1") api.setConfig("summaryTable", false);
if (process.env.CSVM_ELEM_LOG === "1") api.setConfig("elemLog", true);
if (process.env.CSVM_MO_LOG === "1") api.setConfig("moLog", true);
// [EXPERIMENT] 让 document.all 的 HTMLDDA 语义在瑞数 VM 里成立。
// 默认关闭，CSVM_DDA=1 打开；noop 只装 Proxy 不改代码，用于对照。
if (process.env.CSVM_DDA) {
    if (process.env.CSVM_DDA === "noop") api.setConfig("ddaNoop", true);
    if (process.env.CSVM_DDA === "comment") api.setConfig("ddaComment", true);
    api.setConfig("ddaFake", process.env.CSVM_DDA !== "nofake");
    if (process.env.CSVM_EVAL_PATCH !== "0") api.installEvalPatch();
}

// 原生 HTMLDDA（推荐路径）：扩展存在且未显式关闭时启用
if (nativeDDA && process.env.CSVM_DDA_NATIVE !== "0") {
    const ok = api.installNativeDDA();
    if (ok) console.log("[DDA-NATIVE] document.all -> 原生 undetectable 对象");
    else console.warn("[DDA-NATIVE] 安装失败（内部槽未保住）");
}
// 没有显式指定页面时，默认使用框架根目录下 input/ 里的当前挑战：
//   412.html（页面）+ 同目录下的外链挑战 JS
// 这样日常运行只需要 `node src/index.js`，不用每次传路径。
if (!process.env.CSVM_SCRIPT_HTML) {
    const root = path.resolve(__dirname, "..");
    const inputDir = path.join(root, "input");
    const inputHtml = path.join(inputDir, "412.html");
    if (fs.existsSync(inputHtml)) {
        api.setConfig("pageHtmlPath", path.relative(root, inputHtml));
        if (!process.env.CSVM_SCRIPT_DIR) api.setConfig("externalScriptDir", path.relative(root, inputDir));
    }
}

// 第二段：启动模式由框架内存里的 config.pageMode 决定。
//   false -> 执行 src/code.js（单文件模式）
//   true  -> 从 config.pageHtmlPath 读取 HTML，按文档顺序执行所有内联 <script>
const config = api.getConfig();

// 框架已加载完，按内存里的 logFile 开关决定是否把后续输出落到文件
const logFilePath = setupLogFile(config);
if (logFilePath) console.log(`日志文件: ${logFilePath}`);

// 一切环境安装/探针完成，从这里开始才算目标（challenge）阶段
api.setPhase("challenge");

(async function __main() {
try {
    if (config.pageMode) {
        if (!config.pageHtmlPath) {
            console.error("[INPUT] 未指定目标页面。用 CSVM_SCRIPT_HTML=<相对项目根的 HTML 路径> 运行；" +
                "外链脚本默认在同目录或 CSVM_SCRIPT_DIR 指定的目录查找。");
            return;
        }
        const htmlPath = path.resolve(__dirname, "..", config.pageHtmlPath);
        const scriptDir = path.resolve(__dirname, "..", config.externalScriptDir || "src");
        const entries = collectPageScripts(htmlPath);
        console.log(`整页模式: ${config.pageHtmlPath}，共 ${entries.length} 个 <script>`);

        // 关键：document 不再用 page.js 的编译期快照，而是按同一份 HTML 重建。
        // 否则换挑战时会出现「脚本是新实例、DOM 是旧实例」，meta content 与
        // 字节码解密 key 不配对（见 诊断/进度-2026-11-13.md 第十一节）。
        try {
            const domTree = toDomTree(parse5.parse(fs.readFileSync(htmlPath, "utf8")));
            const rebuilt = api.rebuildDomFromTree(domTree);
            console.log(`[DOM] 按 HTML 重建 document: ${rebuilt === 1 ? "ok" : rebuilt}`);
        } catch (e) {
            console.error("[DOM] 重建失败，继续用 page.js 快照:", e);
        }

        // 诊断：在挑战执行前往文档里放一个 <script>（验证 document.scripts 是否参与自检）
        if (process.env.CSVM_INJECT_SCRIPT === "1") {
            try {
                vm.run(new VMScript("(function(){try{var d=document;var s=d.createElement('script');s.type='text/javascript';s.text='';var h=d.head||d.documentElement;h.appendChild(s);console.log('[DIAG-SCRIPT] scripts='+(d.scripts?d.scripts.length:'NO'));}catch(e){console.log('[DIAG-SCRIPT] ERR '+e.message);}})()", "diag-inject-script"));
            } catch (e) { console.error("[DIAG-SCRIPT] 失败:", e && e.message); }
        }

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            let text;
            let label;

            if (entry.kind === "inline") {
                text = entry.text;
                label = `script[${i}]`;
            } else {
                const resolved = resolveExternalScript(entry.src, scriptDir);
                if (!resolved) {
                    console.warn(`外部脚本未找到: ${entry.src}（查找目录: ${scriptDir}）`);
                    continue;
                }
                text = resolved.text;
                label = entry.src;
                console.log(
                    `外部脚本: ${entry.src} -> ` +
                    path.relative(path.resolve(__dirname, ".."), resolved.file) +
                    `（${text.length} 字符）`
                );
            }

            try {
                console.log(`执行 ${label}（${text.length} 字符）`);
                try {
                    const site = process.env.CSVM_SITE || "https://www.fangdi.com.cn/";
                    const srcUrl = entry.kind === "inline" ? site : new URL(entry.src, site).href;
                    api.setSrcUrl("//# sourceURL=" + srcUrl);
                } catch (e) {}
                try {
                    if (entry.kind !== "inline") {
                        const site = process.env.CSVM_SITE || "https://www.fangdi.com.cn/";
                        const srcUrl = new URL(entry.src, site).href;
                    }
                } catch (e) {}
                if (process.env.CSVM_REFLECT_TRACE === "1") api.setConfig("reflectTrace", true);
                if (process.env.CSVM_RAND_TRACE === "1") api.setConfig("randomTrace", true);
                if (process.env.CSVM_PUSH_TRACE === "1") api.setConfig("pushTrace", true);
                if (process.env.CSVM_TASK_TRACE === "1") api.setConfig("taskTrace", true);
                if (process.env.CSVM_PAY_MUT) {
                    const mm = String(process.env.CSVM_PAY_MUT).split(":");
                    api.setConfig("payMut", { from: Number(mm[0]), to: Number(mm[1]) });
                }
                if (process.env.CSVM_PAY_CAP === "1") api.setConfig("payCap", true);
                if (process.env.CSVM_PAY_REPLACE || process.env.CSVM_PAY_REPLACE_FILE) {
                    try {
                        const file = process.env.CSVM_PAY_REPLACE_FILE
                            ? path.resolve(process.cwd(), process.env.CSVM_PAY_REPLACE_FILE)
                            : path.resolve(__dirname, "..", "logs", "diag", "det-B.json");
                        const B = JSON.parse(fs.readFileSync(file, "utf8"));
                        api.setConfig("payReplace", B);
                    } catch (e) { console.error("[PAY-REPLACE] 读取失败:", e && e.message); }
                }
                vm.run(new VMScript(text, label));
                // Chrome 在每个脚本任务结束后立刻清空微任务；Node 默认要等整段同步代码跑完。
                // 不手动 flush 的话，getBattery().then(...) 这类回调会排到 runTimers 之后。
                try { if (typeof process._tickCallback === "function") process._tickCallback(); } catch (e) {}
                // Chrome 在两个 <script> 任务之间还会执行到期的 0ms 定时器
                // （真机的 cf(311) 就排在 inline script[2] 之前）。
                try { api.runTimers(200, 0); } catch (e) {}
                try { if (typeof process._tickCallback === "function") process._tickCallback(); } catch (e) {}
            } catch (e) {
                // 浏览器里单个脚本抛错不会阻止后续脚本，这里保持一致
                console.error(`页面脚本 ${label} 报错:`, e);
            }
        }

        // 排空页面脚本安排的 setTimeout(0) 任务：瑞数会用它们分步删除 enable_、重写 P
        try {
            let ran = api.runTimers(300, 100);
            const dcl = api.fireEvent("DOMContentLoaded");
            ran += api.runTimers(300, 100);
            const load = api.fireEvent("load");
            ran += api.runTimers(500, 2000);
            console.log(`[EVENTS] DCL=${dcl} load=${load}; timers=${ran}`);
        } catch (e) {
            console.error("[EVENTS] 失败:", e);
        }
    } else {
        // 目标代码在全局作用域执行，顶层 var 照旧成为 window 属性，间接 eval 才看得到。
        const target_code = fs.readFileSync(`${__dirname}/code.js`, "utf8");
        try {
            if (process.env.CSVM_REFLECT_TRACE === "1") api.setConfig("reflectTrace", true);
            if (process.env.CSVM_RAND_TRACE === "1") api.setConfig("randomTrace", true);
            vm.run(new VMScript(target_code, "调试中"));
        } catch (e) {
            console.error("目标代码报错:", e);
        }
    }
} finally {
    // 结束前把最后一条聚合行 flush 掉（否则会丢最后一段）
    try { api.flushLog(); } catch (e) {}
    api.showlog();
    debugger;
}

console.log("-------------------------------------------------------------🥱运行完毕🥱-------------------------------------------------------------");
})().catch(function (e) { console.error("[MAIN] 失败:", e); });
