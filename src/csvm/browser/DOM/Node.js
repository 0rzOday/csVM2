var Node = function Node(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(Node);
Object.defineProperty(Node.prototype,Symbol.toStringTag,{value:"Node",configurable:true});

// textContent 递归收集（只取文本节点；注释不算）
function __textContentCollect(node, out) {
    var d = csvm.memory.domStore.get(node);
    if (!d) return;
    if (d.nodeType === 3) { out.push(d.data && d.data.text != null ? String(d.data.text) : ""); return; }
    if (d.nodeType === 1 || d.nodeType === 9 || d.nodeType === 11) {
        for (var i = 0; i < d.childNodes.length; i++) __textContentCollect(d.childNodes[i], out);
    }
}
function __textContentGet(node) {
    var d = csvm.memory.domStore.get(node);
    if (!d) return "";
    if (d.nodeType === 3 || d.nodeType === 8) return d.data && d.data.text != null ? String(d.data.text) : "";
    if (d.nodeType === 10) return null;
    var out = [];
    __textContentCollect(node, out);
    return out.join("");
}
function __textContentSet(node, value) {
    var d = csvm.memory.domStore.get(node);
    if (!d) return;
    var text = value == null ? "" : String(value);
    if (d.nodeType === 3 || d.nodeType === 8) { d.data = d.data || {}; d.data.text = text; return; }
    // 元素/文档：清空子节点，插入一个文本节点
    for (var i = 0; i < d.childNodes.length; i++) {
        var cd = csvm.memory.domStore.get(d.childNodes[i]);
        if (cd) cd.parent = null;
    }
    d.childNodes.length = 0;
    if (text !== "") {
        var tn = csvm.DomGenerator("#text", { text: text }, null);
        var tnd = csvm.memory.domStore.get(tn);
        tnd.parent = node;
        d.childNodes.push(tn);
    }
    try { if (csvm.moNotify) csvm.moNotify(node, { type: "childList", target: node, addedNodes: [], removedNodes: [], attributeName: null }); } catch (e) {}
}

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
        get: __autoFn("get nodeType", 0, function () {
            var d = csvm.memory.domStore.get(this);
            return d ? d.nodeType : undefined;
        }),
        set: undefined,
    });
    // nodeName
    Object.defineProperty(Node.prototype, "nodeName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nodeName", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d) return undefined;
            if (d.nodeType === 1) {
                var tag = d.tag || "";
                return /^[a-z][a-z0-9-]*$/.test(tag) ? tag.toUpperCase() : tag;
            }
            if (d.nodeType === 3) return "#text";
            if (d.nodeType === 8) return "#comment";
            if (d.nodeType === 9) return "#document";
            if (d.nodeType === 10) return (d.data && d.data.name) || "html";
            if (d.nodeType === 11) return "#document-fragment";
            return undefined;
        }),
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
        get: __autoFn("get ownerDocument", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d) return null;
            if (d.nodeType === 9) return null;
            try { return (typeof document !== "undefined") ? document : null; } catch (e) { return null; }
        }),
        set: undefined,
    });
    // parentNode
    Object.defineProperty(Node.prototype, "parentNode", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get parentNode", 0,function(){
            // 已经手动实现✅
            var thisNode=csvm.memory.domStore.get(this);
            return thisNode ? thisNode.parent : null;
        }),
        set: undefined,
    });
    // parentElement
    Object.defineProperty(Node.prototype, "parentElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get parentElement", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d || !d.parent) return null;
            var pd = csvm.memory.domStore.get(d.parent);
            return pd && pd.nodeType === 1 ? d.parent : null;
        }),
        set: undefined,
    });
    // childNodes
    Object.defineProperty(Node.prototype, "childNodes", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get childNodes", 0, function () {
            var self = this;
            return csvm.makeLiveNodeList(function () {
                var d = csvm.memory.domStore.get(self);
                return d ? d.childNodes : [];
            });
        }),
        set: undefined,
    });
    // firstChild
    Object.defineProperty(Node.prototype, "firstChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get firstChild", 0, function () {
            var d = csvm.memory.domStore.get(this);
            return d && d.childNodes.length ? d.childNodes[0] : null;
        }),
        set: undefined,
    });
    // lastChild
    Object.defineProperty(Node.prototype, "lastChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lastChild", 0, function () {
            var d = csvm.memory.domStore.get(this);
            return d && d.childNodes.length ? d.childNodes[d.childNodes.length - 1] : null;
        }),
        set: undefined,
    });
    // previousSibling
    Object.defineProperty(Node.prototype, "previousSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get previousSibling", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d || !d.parent) return null;
            var pd = csvm.memory.domStore.get(d.parent);
            if (!pd) return null;
            var i = pd.childNodes.indexOf(this);
            return i > 0 ? pd.childNodes[i - 1] : null;
        }),
        set: undefined,
    });
    // nextSibling
    Object.defineProperty(Node.prototype, "nextSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nextSibling", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d || !d.parent) return null;
            var pd = csvm.memory.domStore.get(d.parent);
            if (!pd) return null;
            var i = pd.childNodes.indexOf(this);
            return i !== -1 && i + 1 < pd.childNodes.length ? pd.childNodes[i + 1] : null;
        }),
        set: undefined,
    });
    // nodeValue
    Object.defineProperty(Node.prototype, "nodeValue", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nodeValue", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d) return null;
            if (d.nodeType === 3 || d.nodeType === 8) return d.data && d.data.text != null ? String(d.data.text) : "";
            if (d.nodeType === 2) return d.data && d.data.value != null ? String(d.data.value) : null;
            return null;
        }),
        set: __autoFn("set nodeValue", 1, function (v) {
            var d = csvm.memory.domStore.get(this);
            if (!d) return;
            if (d.nodeType === 3 || d.nodeType === 8) { d.data = d.data || {}; d.data.text = v == null ? "" : String(v); }
        }),
    });
    // textContent
    Object.defineProperty(Node.prototype, "textContent", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get textContent", 0, function () { return __textContentGet(this); }),
        set: __autoFn("set textContent", 1, function (v) { __textContentSet(this, v); }),
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
        value: __autoFn("appendChild", 1, function (child) {
            var self = csvm.memory.domStore.get(this);
            var c = csvm.memory.domStore.get(child);
            if (!self || !c) return child;
            try { if (csvm.memory.config && csvm.memory.config.moLog) console.log("[APPC] <" + (self.tag || "?") + "> <- <" + (c.tag || "?") + "> attr=" + (c.data ? Object.keys(c.data).join(",") : "")); } catch (e) {}
            // 先从旧父节点摘下来
            if (c.parent) {
                var pd = csvm.memory.domStore.get(c.parent);
                if (pd) {
                    var i = pd.childNodes.indexOf(child);
                    if (i !== -1) pd.childNodes.splice(i, 1);
                }
            }
            c.parent = this;
            self.childNodes.push(child);
            try { if (csvm.moNotify) csvm.moNotify(this, { type: "childList", target: this, addedNodes: [child], removedNodes: [], previousSibling: null, nextSibling: null, attributeName: null }); } catch (e) {}
            try { if (csvm.mirrorNamedForm) csvm.mirrorNamedForm(this); } catch (e) {}
            return child;
        }),
    });
    // cloneNode
    function __cloneNodeImpl(node, deep) {
        var d = csvm.memory.domStore.get(node);
        if (!d) return null;
        var data = {};
        if (d.data) { for (var k in d.data) { try { data[k] = d.data[k]; } catch (e) {} } }
        var el = csvm.DomGenerator(d.tag, data, null);
        var ed = csvm.memory.domStore.get(el);
        if (!ed) return el;
        if (deep && d.childNodes) {
            for (var i = 0; i < d.childNodes.length; i++) {
                var c = __cloneNodeImpl(d.childNodes[i], true);
                if (c) { var cd = csvm.memory.domStore.get(c); if (cd) cd.parent = el; ed.childNodes.push(c); }
            }
        }
        return el;
    }
    Object.defineProperty(Node.prototype, "cloneNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("cloneNode", 1, function (deep) { return __cloneNodeImpl(this, !!deep); }),
    });
    // compareDocumentPosition
    Object.defineProperty(Node.prototype, "compareDocumentPosition", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("compareDocumentPosition", 1, function (other) {
            if (other === this) return 0;
            function contains(a, b) {
                var n = b;
                while (n) { if (n === a) return true; n = n.parentNode; }
                return false;
            }
            if (contains(this, other)) return 20;  // FOLLOWING(4) | CONTAINED_BY(16)
            if (contains(other, this)) return 10;  // PRECEDING(2) | CONTAINS(8)
            return 4;
        }),
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
        value: __autoFn("getRootNode", 0, function (opts) {
            var n = this;
            for (var i = 0; i < 10000; i++) {
                var d = csvm.memory.domStore.get(n);
                if (!d) return n;
                // shadow root 的 host 属性存在时，composed 模式继续向上
                if (d.__mode && opts && opts.composed && d.host) { n = d.host; continue; }
                if (!d.parent) return n;
                n = d.parent;
            }
            return n;
        }),
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
        value: __autoFn("insertBefore", 2, function (child, ref) {
            var self = csvm.memory.domStore.get(this);
            var c = csvm.memory.domStore.get(child);
            if (!self || !c) return child;
            var idx;
            if (ref === null || ref === undefined) {
                idx = self.childNodes.length;
            } else {
                idx = self.childNodes.indexOf(ref);
                if (idx === -1) {
                    throw new Error("Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.");
                }
            }
            if (c.parent) {
                var pd = csvm.memory.domStore.get(c.parent);
                if (pd) {
                    var i = pd.childNodes.indexOf(child);
                    if (i !== -1) {
                        pd.childNodes.splice(i, 1);
                        // 同一个父节点内移动时，移除位置在插入点之前要修正索引
                        if (pd === self && i < idx) idx--;
                    }
                }
            }
            c.parent = this;
            self.childNodes.splice(idx, 0, child);
            try { if (csvm.moNotify) csvm.moNotify(this, { type: "childList", target: this, addedNodes: [child], removedNodes: [], previousSibling: self.childNodes[idx-1]||null, nextSibling: ref||null, attributeName: null }); } catch (e) {}
            try { if (csvm.mirrorNamedForm) csvm.mirrorNamedForm(this); } catch (e) {}
            return child;
        }),
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
        value: __autoFn("isEqualNode", 1, function (other) {
            function eq(a, b) {
                if (a === b) return true;
                if (!a || !b) return false;
                var da = csvm.memory.domStore.get(a), db = csvm.memory.domStore.get(b);
                if (!da || !db) return false;
                if (da.nodeType !== db.nodeType) return false;
                if (String(da.tag) !== String(db.tag)) return false;
                var ka = Object.keys(da.data || {}), kb = Object.keys(db.data || {});
                if (ka.length !== kb.length) return false;
                for (var i = 0; i < ka.length; i++) {
                    var k = ka[i];
                    if (String(da.data[k] == null ? "" : da.data[k]) !== String(db.data[k] == null ? "" : db.data[k])) return false;
                }
                var ca = da.childNodes || [], cb = db.childNodes || [];
                if (ca.length !== cb.length) return false;
                for (var j = 0; j < ca.length; j++) if (!eq(ca[j], cb[j])) return false;
                return true;
            }
            return eq(this, other);
        }),
    });
    // isSameNode
    Object.defineProperty(Node.prototype, "isSameNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isSameNode", 1, function (other) { return this === other; }),
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
        value: __autoFn("normalize", 0, function () {
            var d = csvm.memory.domStore.get(this);
            if (!d || !d.childNodes) return;
            var out = [];
            for (var i = 0; i < d.childNodes.length; i++) {
                var c = d.childNodes[i];
                var cd = csvm.memory.domStore.get(c);
                if (cd && cd.nodeType === 3) {
                    var prev = out.length ? csvm.memory.domStore.get(out[out.length - 1]) : null;
                    if (prev && prev.nodeType === 3) {
                        prev.data = prev.data || {};
                        prev.data.text = (prev.data.text != null ? prev.data.text : "") + (cd.data && cd.data.text != null ? cd.data.text : "");
                        continue;
                    }
                    if (cd.data && cd.data.text === "") continue;
                }
                out.push(c);
            }
            d.childNodes.length = 0;
            for (var j = 0; j < out.length; j++) d.childNodes.push(out[j]);
            for (var k = 0; k < d.childNodes.length; k++) {
                try { var nd = csvm.memory.domStore.get(d.childNodes[k]); if (nd && nd.nodeType === 1) Node.prototype.normalize.call(d.childNodes[k]); } catch (e) {}
            }
        }),
    });
    // removeChild
    Object.defineProperty(Node.prototype, "removeChild", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeChild", 1,function(child){
            // 已经手动实现✅
            var thisNode=csvm.memory.domStore.get(this);
            // 先判断当前节点中要被删除的子节点存不存在
            var idx = thisNode.childNodes.indexOf(child);
            if (idx===-1){
                debugger;
                throw new Error("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.");
            }
            // 将childNodes移除
            thisNode.childNodes.splice(idx,1);
            try { if (csvm.moNotify) csvm.moNotify(this, { type: "childList", target: this, addedNodes: [], removedNodes: [child], previousSibling: null, nextSibling: null, attributeName: null }); } catch (e) {}
            var childNode=csvm.memory.domStore.get(child);
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
        value: __autoFn("replaceChild", 2, function (newChild, oldChild) {
            var d = csvm.memory.domStore.get(this);
            if (!d || !d.childNodes) return oldChild;
            var idx = -1;
            for (var i = 0; i < d.childNodes.length; i++) { if (d.childNodes[i] === oldChild) { idx = i; break; } }
            if (idx === -1) return oldChild;
            var od = csvm.memory.domStore.get(oldChild);
            if (od) od.parent = null;
            var nd = csvm.memory.domStore.get(newChild);
            if (nd) nd.parent = this;
            d.childNodes[idx] = newChild;
            try { if (csvm.mirrorNamedForm) csvm.mirrorNamedForm(this); } catch (e) {}
            return oldChild;
        }),
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
// ---------------------------------------------------------------------------
// CharacterData / Text / Comment
// 之前 text 节点直接用 Node.prototype，没有 data/length 等 CharacterData 属性，
// 导致 document.createTextNode(x).data 为 undefined（真机是文本内容）。
// ---------------------------------------------------------------------------
var CharacterData = function CharacterData(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(CharacterData, "CharacterData");
Object.defineProperty(CharacterData.prototype, Symbol.toStringTag, { value: "CharacterData", configurable: true });
CharacterData.prototype.__proto__ = Node.prototype;
(function () {
    function dget(self) { return csvm.memory.domStore.get(self); }
    function txt(self) { var d = dget(self); return d && d.data && d.data.text != null ? String(d.data.text) : ""; }
    Object.defineProperty(CharacterData.prototype, "data", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () { return txt(this); }, "get data"),
        set: csvm.safefunction(function (v) { var d = dget(this); if (d) { d.data = d.data || {}; d.data.text = v == null ? "" : String(v); } }, "set data"),
    });
    Object.defineProperty(CharacterData.prototype, "length", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () { return txt(this).length; }, "get length"),
    });
    ["appendData", "insertData", "deleteData", "replaceData"].forEach(function (n) {
        Object.defineProperty(CharacterData.prototype, n, {
            configurable: true, enumerable: true, writable: true,
            value: csvm.safefunction(function () {
                var d = dget(this);
                if (!d) return;
                d.data = d.data || {};
                var cur = d.data.text != null ? String(d.data.text) : "";
                var a = Array.prototype.slice.call(arguments);
                if (n === "appendData") cur = cur + String(a[0] == null ? "" : a[0]);
                else if (n === "insertData") {
                    var off = Math.max(0, Math.min(cur.length, Number(a[0]) || 0));
                    cur = cur.slice(0, off) + String(a[1] == null ? "" : a[1]) + cur.slice(off);
                } else if (n === "deleteData") {
                    var o2 = Math.max(0, Math.min(cur.length, Number(a[0]) || 0));
                    cur = cur.slice(0, o2) + cur.slice(o2 + Math.max(0, Number(a[1]) || 0));
                } else {
                    var o3 = Math.max(0, Math.min(cur.length, Number(a[0]) || 0));
                    cur = cur.slice(0, o3) + String(a[2] == null ? "" : a[2]) + cur.slice(o3 + Math.max(0, Number(a[1]) || 0));
                }
                d.data.text = cur;
            }, n),
        });
    });
    Object.defineProperty(CharacterData.prototype, "substringData", {
        configurable: true, enumerable: true, writable: true,
        value: csvm.safefunction(function (off, count) {
            var s = txt(this);
            var o = Math.max(0, Number(off) || 0);
            return s.slice(o, o + Math.max(0, Number(count) || 0));
        }, "substringData"),
    });
})();
var Text = function Text(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Text, "Text");
Object.defineProperty(Text.prototype, Symbol.toStringTag, { value: "Text", configurable: true });
Text.prototype.__proto__ = CharacterData.prototype;
// Text.splitText：在 offset 处把文本节点一分为二，返回后半段并插入原位置之后
Object.defineProperty(Text.prototype, "splitText", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function (offset) {
        var d = csvm.memory.domStore.get(this);
        if (!d) return null;
        d.data = d.data || {};
        var s = d.data.text != null ? String(d.data.text) : "";
        var off = Math.max(0, Math.min(s.length, Number(offset) || 0));
        d.data.text = s.slice(0, off);
        var rest = s.slice(off);
        var doc = (typeof document !== "undefined") ? document : null;
        var node = doc && doc.createTextNode ? doc.createTextNode(rest) : null;
        if (!node) return null;
        var parent = d.parent;
        if (parent) {
            var pd = csvm.memory.domStore.get(parent);
            if (pd) {
                var idx = pd.childNodes.indexOf(this);
                var nd = csvm.memory.domStore.get(node);
                if (nd) nd.parent = parent;
                if (idx === -1) pd.childNodes.push(node);
                else pd.childNodes.splice(idx + 1, 0, node);
            }
        }
        return node;
    }, "splitText"),
});
var Comment = function Comment(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Comment, "Comment");
Object.defineProperty(Comment.prototype, Symbol.toStringTag, { value: "Comment", configurable: true });
Comment.prototype.__proto__ = CharacterData.prototype;

// DocumentFragment：ParentNode 接口（children / firstElementChild …）
// 之前 #document-fragment 直接落到 Node.prototype，content.children 是 undefined。
var DocumentFragment = function DocumentFragment(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(DocumentFragment, "DocumentFragment");
Object.defineProperty(DocumentFragment.prototype, Symbol.toStringTag, { value: "DocumentFragment", configurable: true });
DocumentFragment.prototype.__proto__ = Node.prototype;
(function () {
    function kids(self) {
        var d = csvm.memory.domStore.get(self), out = [];
        if (!d) return out;
        for (var i = 0; i < d.childNodes.length; i++) {
            var cd = csvm.memory.domStore.get(d.childNodes[i]);
            if (cd && cd.nodeType === 1) out.push(d.childNodes[i]);
        }
        return out;
    }
    Object.defineProperty(DocumentFragment.prototype, "children", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () {
            var self = this;
            return csvm.makeLiveHTMLCollection(function () { return kids(self); });
        }, "get children"),
    });
    Object.defineProperty(DocumentFragment.prototype, "childElementCount", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () { return kids(this).length; }, "get childElementCount"),
    });
    Object.defineProperty(DocumentFragment.prototype, "firstElementChild", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () { var a = kids(this); return a.length ? a[0] : null; }, "get firstElementChild"),
    });
    Object.defineProperty(DocumentFragment.prototype, "lastElementChild", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () { var a = kids(this); return a.length ? a[a.length - 1] : null; }, "get lastElementChild"),
    });
})();
