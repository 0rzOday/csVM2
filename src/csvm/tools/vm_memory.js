var csvm = {};
// 框架运行内存
//
// config 命名说明（全部只在沙箱内使用；宿主侧通过 api.getConfig() 读取其中 5 项）：
//   日志相关
//     captureLog           是否记录访问日志（代理陷阱是否产生记录）
//     liveLog              是否把日志实时输出到控制台/日志文件
//     liveLogDuringInit    实时日志是否包含框架加载阶段
//     logFrameworkPhase    日志里是否记录框架加载阶段
//     summaryTable         运行结束是否打印汇总表格
//     writeLogFile         是否把 stdout / stderr 落盘
//     logDir               日志目录（相对项目根）
//     maxLogRecords        内存中最多保留多少条日志
//   代理/行为
//     useProxy             是否启用对象代理（window/document/… 的访问日志来源）
//     ignoreInspectReads   忽略调试器 / util.inspect 产生的 symbol / toString 读取
//   启动
//     pageMode             true=按 HTML 执行页面脚本；false=执行 src/code.js
//     pageHtmlPath         pageMode 时读取的 HTML 路径（相对项目根）
//     externalScriptDir    外链 <script src> 的本地查找目录
csvm.memory = {
    config:{
        captureLog:true,
        // 默认开启代理：window/document/navigator… 的访问日志都来自这里。
        // 关掉代理后 window === globalThis，见 ISSUE-005。
        useProxy: (typeof __CSVM_NO_PROXY__ !== "undefined" && __CSVM_NO_PROXY__) ? false : true,
        // 调试器 / util.inspect 生成对象描述时会读 symbol 和 toString，过滤掉这类噪音
        ignoreInspectReads:true,
        // 日志里是否记录框架加载阶段的记录（runPhase === "framework"）
        logFrameworkPhase:true,
        // 启动模式：true=页面模式（执行 HTML 里的 <script>），false=单文件模式
        pageMode:true,
        // 未设置 CSVM_SCRIPT_HTML 时，宿主会回落到 诊断/input/412.html
        pageHtmlPath:"",
        // 外链 <script src> 的本地查找目录（相对项目根）
        externalScriptDir:"src",
        // 运行中实时输出日志（调试死循环时有用；关掉则只在结束时出表格）
        liveLog:true,
        // 实时输出是否包含框架加载阶段（runPhase === "framework"）
        liveLogDuringInit:false,
        // 运行结束后是否打印汇总表格
        summaryTable:true,
        // 是否把 stdout / stderr 同时写入日志文件
        writeLogFile:true,
        // 日志目录（相对项目根）；文件名自动用 run-<时间>.log
        logDir:"logs",
        // 内存中最多保留多少条日志（供最后表格用），超出丢弃最旧的
        maxLogRecords:5000,
    }
};
// 当前阶段："framework" 框架加载期，"challenge" 目标代码运行期
// 由 index.js 在目标和框架之间切换，日志表里会分开展示
csvm.memory.runPhase = "framework";
// 保存创建的 DOM 元素
csvm.memory.domStore=new WeakMap();
// DOM 改动版本号：窗口命名属性（window[id]/window[name]）缓存据此失效。
// 任何结构/属性改动都应该调用 csvm.markDomChanged()。
csvm.memory.domRevision = 0;
csvm.markDomChanged = function () {
    try { csvm.memory.domRevision = (csvm.memory.domRevision || 0) + 1; } catch (e) {}
};
// 将已经写好的Element层的原型全部建立一份空的元素放入Elements
// 用 null 原型：否则 tag 叫 "constructor" / "toString" 时会命中 Object.prototype，
// 查到的不是工厂而是内置函数（createElement("constructor") 在浏览器里是合法的）
csvm.memory.elementFactories=Object.create(null)
// 事件监听器：target -> { type -> [{listener, once}] }
csvm.memory.eventListeners=new WeakMap()
csvm.memory.cookieHeader="";
// cookie jar：name -> value（只存 name=value，不存 path/expires/Secure 等属性）
csvm.memory.cookieJar=Object.create(null);
function nodeTypeOf(tag){
    if (tag === "#text")            return 3;
    if (tag === "#comment")         return 8;
    if (tag === "#document")        return 9;
    if (tag === "#documentType")    return 10;
    if (tag === "#document-fragment") return 11;
    return 1;   // 元素
}
// 各节点类型的原型缓存：只读一次，之后全是引用。
// 直接写 Node.prototype 的话，每建一个节点都会走一次代理 get trap，日志会被撑爆
function ensureProto(){
    var P = csvm.memory.protoCache;
    if (P) return P;

    P = csvm.memory.protoCache = {
        node:         Node.prototype,
        element:      HTMLElement.prototype,
        document:     typeof Document     !== "undefined" ? Document.prototype     : Node.prototype,
        text:         typeof Text         !== "undefined" ? Text.prototype         : Node.prototype,
        comment:      typeof Comment      !== "undefined" ? Comment.prototype      : Node.prototype,
        documentType: typeof DocumentType !== "undefined" ? DocumentType.prototype : Node.prototype,
        fragment:     typeof DocumentFragment !== "undefined" ? DocumentFragment.prototype : Node.prototype,
    };
    return P;
}

// 标签接口模块在文件末尾调用：
//   csvm.registerElement("div", HTMLDivElement);
// 原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement = function(tag, Ctor){
    var proto = Ctor.prototype;
    csvm.memory.elementFactories[tag] = function(){
        return Object.create(proto);
    };
};

csvm.DomGenerator=function DomGenerator(tag,data,parent){
    var nodeType=nodeTypeOf(tag);
    var P=ensureProto();
    var el;

    if (nodeType===1){
        var factory=csvm.memory.elementFactories[tag];
        // 工厂没登记，先拿 HTMLElement 顶着（浏览器对未知标签给的是 HTMLUnknownElement）
        el=factory?factory():Object.create(P.element);
    }else{
        el=Object.create(
            tag==="#text"          ? P.text :
            tag==="#comment"       ? P.comment :
            tag==="#documentType"  ? P.documentType :
            tag==="#document"      ? P.document :
            tag==="#document-fragment" ? P.fragment : P.node
        );
    }

    csvm.memory.domStore.set(
        el,{
            tag:tag,
            nodeType:nodeType,
            data:data || {},
            parent:parent || null,
            childNodes:[]
        }
    );
    if (parent){
        csvm.memory.domStore.get(parent)["childNodes"].push(el);
    };
    return el;
}
// 运行时按目标 HTML 重建 document 子树。
// tree 形如 { tag:"#document", children:[{tag:"html",attrs:{},children:[...]}, ...] }，
// 由宿主侧 parse5 解析 HTML 后传入。重建后 documentElement/head/body/
// getElementById/getElementsByTagName 这些 getter 都是按 childNodes 动态查找的，会自动跟着变。
csvm.rebuildDom = function (tree) {
    var docNode = csvm.memory.domStore.get(document);
    if (!docNode || !tree) return 0;
    docNode["childNodes"] = [];

    function make(node, parent) {
        if (!node || !node.tag) return;
        if (node.tag === "#document") {
            var kids = node.children || [];
            for (var k = 0; k < kids.length; k++) make(kids[k], parent);
            return;
        }
        var data;
        if (node.tag === "#text" || node.tag === "#comment") {
            data = { text: node.text == null ? "" : node.text };
        } else if (node.tag === "#documentType") {
            data = { name: node.name, publicId: node.publicId, systemId: node.systemId };
        } else {
            data = node.attrs || {};
        }
        var el = csvm.DomGenerator(node.tag, data, parent);
        var children = node.children || [];
        for (var i = 0; i < children.length; i++) make(children[i], el);
    }

    make(tree, document);
    return 1;
};
csvm.memory.historyState=null;

csvm.memory.storageRecords=new WeakMap();


