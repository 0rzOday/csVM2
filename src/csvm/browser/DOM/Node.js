var Node = function Node(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(Node);
Object.defineProperty(Node.prototype,Symbol.toStringTag,{value:"Node",configurable:true});

/* #region AUTO:Node.prototype */
(function () {
    // --- 生成代码公共辅助 ---------------------------------------------------
    const __autoHit = new Set();

    // 加载时抓一份原生 apply。目标之后改 Function.prototype.apply / Reflect.apply，
    // 也影响不到包装层，免得它看到框架内部的调用
    const __autoApply = Reflect.apply;

    // 第三个参数是手写实现：传了就用它，不再造空壳、不再打 debugger。
    // 伪装（safefunction）和代理（proxy）对它照样生效，指纹和日志与生成的一致。
    function __autoFn(name, length, impl) {
        let fn;
        if (typeof impl === "function") {
            // 方法简写包一层：普通函数表达式自带 prototype / arguments / caller，
            // 而且能被 new；原生 getter 只有 length / name，也不能构造。
            // 包一层后形状与原生一致，this 照常透传。
            fn = { [name](...args) { return __autoApply(impl, this, args); } }[name];
        } else {
            fn = { [name]() {
                if (!__autoHit.has(name)) {
                    __autoHit.add(name);
                    debugger;
                }
            } }[name];
        }

        Object.defineProperty(fn, "name", {
            value: name,
            writable: false,
            enumerable: false,
            configurable: true,
        });

        Object.defineProperty(fn, "length", {
            value: length,
            writable: false,
            enumerable: false,
            configurable: true,
        });

        // 顺序不能反：先包代理再伪装。
        // 原生 Function.prototype.toString 对 Proxy 只会给 "function () { [native code] }"，
        // 所以伪装的文本必须登记在代理对象上，否则名字会丢。
        if (typeof csvm === "undefined") return fn;

        // 代理背后的原始函数也登记伪造源码：
        // Error.prepareStackTrace 的 CallSite.getFunction() 可能拿到它
        if (csvm.safefunction) csvm.safefunction(fn, name);

        const wrapped = csvm.proxy ? csvm.proxy(fn, name) : fn;
        return csvm.safefunction ? csvm.safefunction(wrapped, name) : wrapped;
    }
    // nodeType
    Object.defineProperty(Node.prototype, "nodeType", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nodeType", 0),
        set: undefined,
    });
    // nodeName
    Object.defineProperty(Node.prototype, "nodeName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nodeName", 0),
        set: undefined,
    });
    // baseURI
    Object.defineProperty(Node.prototype, "baseURI", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get baseURI", 0),
        set: undefined,
    });
    // isConnected
    Object.defineProperty(Node.prototype, "isConnected", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get isConnected", 0),
        set: undefined,
    });
    // ownerDocument
    Object.defineProperty(Node.prototype, "ownerDocument", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ownerDocument", 0),
        set: undefined,
    });
    // parentNode
    Object.defineProperty(Node.prototype, "parentNode", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get parentNode", 0,function(){
            // 已经手动实现✅
            var thisNode=csvm.memory.Dom.get(this);
            return thisNode ? thisNode.parent : null;
        }),
        set: undefined,
    });
    // parentElement
    Object.defineProperty(Node.prototype, "parentElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get parentElement", 0),
        set: undefined,
    });
    // childNodes
    Object.defineProperty(Node.prototype, "childNodes", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get childNodes", 0),
        set: undefined,
    });
    // firstChild
    Object.defineProperty(Node.prototype, "firstChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get firstChild", 0),
        set: undefined,
    });
    // lastChild
    Object.defineProperty(Node.prototype, "lastChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lastChild", 0),
        set: undefined,
    });
    // previousSibling
    Object.defineProperty(Node.prototype, "previousSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get previousSibling", 0),
        set: undefined,
    });
    // nextSibling
    Object.defineProperty(Node.prototype, "nextSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nextSibling", 0),
        set: undefined,
    });
    // nodeValue
    Object.defineProperty(Node.prototype, "nodeValue", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nodeValue", 0),
        set: __autoFn("set nodeValue", 1),
    });
    // textContent
    Object.defineProperty(Node.prototype, "textContent", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get textContent", 0),
        set: __autoFn("set textContent", 1),
    });
    // ELEMENT_NODE
    Object.defineProperty(Node.prototype, "ELEMENT_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 1,
    });
    // ATTRIBUTE_NODE
    Object.defineProperty(Node.prototype, "ATTRIBUTE_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 2,
    });
    // TEXT_NODE
    Object.defineProperty(Node.prototype, "TEXT_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 3,
    });
    // CDATA_SECTION_NODE
    Object.defineProperty(Node.prototype, "CDATA_SECTION_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 4,
    });
    // ENTITY_REFERENCE_NODE
    Object.defineProperty(Node.prototype, "ENTITY_REFERENCE_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 5,
    });
    // ENTITY_NODE
    Object.defineProperty(Node.prototype, "ENTITY_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 6,
    });
    // PROCESSING_INSTRUCTION_NODE
    Object.defineProperty(Node.prototype, "PROCESSING_INSTRUCTION_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 7,
    });
    // COMMENT_NODE
    Object.defineProperty(Node.prototype, "COMMENT_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 8,
    });
    // DOCUMENT_NODE
    Object.defineProperty(Node.prototype, "DOCUMENT_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 9,
    });
    // DOCUMENT_TYPE_NODE
    Object.defineProperty(Node.prototype, "DOCUMENT_TYPE_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 10,
    });
    // DOCUMENT_FRAGMENT_NODE
    Object.defineProperty(Node.prototype, "DOCUMENT_FRAGMENT_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 11,
    });
    // NOTATION_NODE
    Object.defineProperty(Node.prototype, "NOTATION_NODE", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 12,
    });
    // DOCUMENT_POSITION_DISCONNECTED
    Object.defineProperty(Node.prototype, "DOCUMENT_POSITION_DISCONNECTED", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 1,
    });
    // DOCUMENT_POSITION_PRECEDING
    Object.defineProperty(Node.prototype, "DOCUMENT_POSITION_PRECEDING", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 2,
    });
    // DOCUMENT_POSITION_FOLLOWING
    Object.defineProperty(Node.prototype, "DOCUMENT_POSITION_FOLLOWING", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 4,
    });
    // DOCUMENT_POSITION_CONTAINS
    Object.defineProperty(Node.prototype, "DOCUMENT_POSITION_CONTAINS", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 8,
    });
    // DOCUMENT_POSITION_CONTAINED_BY
    Object.defineProperty(Node.prototype, "DOCUMENT_POSITION_CONTAINED_BY", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 16,
    });
    // DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC
    Object.defineProperty(Node.prototype, "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: 32,
    });
    // appendChild
    Object.defineProperty(Node.prototype, "appendChild", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("appendChild", 1),
    });
    // cloneNode
    Object.defineProperty(Node.prototype, "cloneNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("cloneNode", 0),
    });
    // compareDocumentPosition
    Object.defineProperty(Node.prototype, "compareDocumentPosition", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("compareDocumentPosition", 1),
    });
    // contains
    Object.defineProperty(Node.prototype, "contains", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("contains", 1),
    });
    // getRootNode
    Object.defineProperty(Node.prototype, "getRootNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getRootNode", 0),
    });
    // hasChildNodes
    Object.defineProperty(Node.prototype, "hasChildNodes", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasChildNodes", 0),
    });
    // insertBefore
    Object.defineProperty(Node.prototype, "insertBefore", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertBefore", 2),
    });
    // isDefaultNamespace
    Object.defineProperty(Node.prototype, "isDefaultNamespace", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isDefaultNamespace", 1),
    });
    // isEqualNode
    Object.defineProperty(Node.prototype, "isEqualNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isEqualNode", 1),
    });
    // isSameNode
    Object.defineProperty(Node.prototype, "isSameNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isSameNode", 1),
    });
    // lookupNamespaceURI
    Object.defineProperty(Node.prototype, "lookupNamespaceURI", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("lookupNamespaceURI", 1),
    });
    // lookupPrefix
    Object.defineProperty(Node.prototype, "lookupPrefix", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("lookupPrefix", 1),
    });
    // normalize
    Object.defineProperty(Node.prototype, "normalize", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("normalize", 0),
    });
    // removeChild
    Object.defineProperty(Node.prototype, "removeChild", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeChild", 1,function(child){
            // 已经手动实现✅
            var thisNode=csvm.memory.Dom.get(this);
            // 先判断当前节点中要被删除的子节点存不存在
            var idx = thisNode.childNodes.indexOf(child);
            if (idx===-1){
                debugger;
                throw new Error("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.");
            }
            // 将childNodes移除
            thisNode.childNodes.splice(idx,1);
            var childNode=csvm.memory.Dom.get(child);
            if (childNode){
                childNode.parent=null;
            }
            return child;
        }),
    });
    // replaceChild
    Object.defineProperty(Node.prototype, "replaceChild", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceChild", 2),
    });
    // TODO constructor: Node.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Node.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Node",
    });
})();
/* #endregion AUTO:Node.prototype */

Node.prototype.__proto__=EventTarget.prototype;
Node=csvm.proxy(Node,"Node");