var csvm = {};
// 框架运行内存
csvm.memory = {
    config:{
        print:true,
        // 默认关闭代理：window 必须和 globalThis 是同一个对象。
        // 调试时改成 true 可以看到 GET/SET 日志，但 window !== globalThis 是代理的代价，见 ISSUE-005。
        proxy: (typeof __CSVM_NO_PROXY__ !== "undefined" && __CSVM_NO_PROXY__) ? false : true,
        // 调试器 / util.inspect 给对象生成描述时会读 symbol 和 toString，
        // 那不是目标的行为；开着可以过滤掉这类噪音
        ignoreInspect:true,
        // 日志里是否显示框架加载阶段的记录（phase === "init"）
        // 关掉之后只看到目标代码产生的日志
        printInit:true,
        // 启动模式：
        //   false -> 执行 src/code.js（单文件模式，默认）
        //   true  -> 从 scriptHtmlPath 读取 HTML，按文档顺序执行所有内联 <script>
        runScripts:true,
        // runScripts 为 true 时读取的 HTML 路径（相对项目根目录）
        // 运行时用 CSVM_SCRIPT_HTML 指定；本包不内置任何目标页面
        scriptHtmlPath:"",
        // 外链 <script src> 的本地查找目录（相对项目根目录）
        // 按 src 的相对路径 / 文件名在该目录下找同名 .js，找不到再递归搜
        externalScriptDir:"src",
        // 运行时同步输出：每条日志立即打印一行，不用等目标跑完/报错
        // 调试死循环时用这个；关掉则恢复成只在 showlog() 里出表格
        stream:true,
        // 同步输出是否包含框架加载期（phase === "init"）的日志
        streamInit:false,
        // 运行结束后是否再打印一次汇总表格
        table:true,
        // 是否把 stdout / stderr 同时写入日志文件
        logFile:true,
        // 日志目录（相对项目根目录）；文件名自动用 run-<时间>.log
        logDir:"logs",
        // 内存里最多保留多少条日志（供最后表格用），超出后丢弃最旧的
        // 防止目标死循环时日志数组把内存吃爆
        maxKeep:5000,
    }
}; // 默认关闭代理；print 只在 proxy 开启时产生日志
// 当前阶段："init" 框架加载期，"target" 目标代码运行期
// 由 index.js 在目标和框架之间切换，日志表里会分开展示
csvm.memory.phase = "init";
// 保存创建的 DOM 元素
csvm.memory.Dom=new WeakMap();
// 将已经写好的Element层的原型全部建立一份空的元素放入Elements
// 用 null 原型：否则 tag 叫 "constructor" / "toString" 时会命中 Object.prototype，
// 查到的不是工厂而是内置函数（createElement("constructor") 在浏览器里是合法的）
csvm.memory.Elements=Object.create(null)
csvm.memory.listeners={
}
csvm.memory.cookie="";
// cookie jar：name -> value（只存 name=value，不存 path/expires/Secure 等属性）
csvm.memory.cookies=Object.create(null);
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
    var P = csvm.memory.Proto;
    if (P) return P;

    P = csvm.memory.Proto = {
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
    csvm.memory.Elements[tag] = function(){
        return Object.create(proto);
    };
};

csvm.DomGenerator=function DomGenerator(tag,data,parent){
    var nodeType=nodeTypeOf(tag);
    var P=ensureProto();
    var el;

    if (nodeType===1){
        var factory=csvm.memory.Elements[tag];
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

    csvm.memory.Dom.set(
        el,{
            tag:tag,
            nodeType:nodeType,
            data:data || {},
            parent:parent || null,
            childNodes:[]
        }
    );
    if (parent){
        csvm.memory.Dom.get(parent)["childNodes"].push(el);
    };
    return el;
}
// 运行时按目标 HTML 重建 document 子树。
// tree 形如 { tag:"#document", children:[{tag:"html",attrs:{},children:[...]}, ...] }，
// 由宿主侧 parse5 解析 HTML 后传入。重建后 documentElement/head/body/
// getElementById/getElementsByTagName 这些 getter 都是按 childNodes 动态查找的，会自动跟着变。
csvm.rebuildDom = function (tree) {
    var docNode = csvm.memory.Dom.get(document);
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

csvm.memory.Storage=new WeakMap();


