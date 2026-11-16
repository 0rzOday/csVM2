// XPathExpression / XPathResult / createNSResolver
//
// 瑞数 VM 会执行 document.createExpression('//html', null).evaluate(...) 之类的探测：
//   真机返回 XPathExpression 对象，框架原来（存根）返回 undefined，
//   导致后续 `_doc` / `Event` 的原生性检查整段被跳过。
var XPathResult = function XPathResult() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(XPathResult, "XPathResult");
Object.defineProperty(XPathResult.prototype, Symbol.toStringTag, { value: "XPathResult", configurable: true });
var __XPR = {
    ANY_TYPE: 0, NUMBER_TYPE: 1, STRING_TYPE: 2, BOOLEAN_TYPE: 3,
    UNORDERED_NODE_ITERATOR_TYPE: 4, ORDERED_NODE_ITERATOR_TYPE: 5,
    UNORDERED_NODE_SNAPSHOT_TYPE: 6, ORDERED_NODE_SNAPSHOT_TYPE: 7,
    ANY_UNORDERED_NODE_TYPE: 8, FIRST_ORDERED_NODE_TYPE: 9,
};
for (var __xk in __XPR) Object.defineProperty(XPathResult, __xk, { value: __XPR[__xk], enumerable: true, configurable: false });

function __makeXPathResult(nodes) {
    nodes = nodes || [];
    var i = 0;
    var r = Object.create(XPathResult.prototype);
    var st = {
        resultType: XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
        numberValue: NaN, stringValue: "", booleanValue: false,
        singleNodeValue: nodes[0] || null, snapshotLength: nodes.length,
        invalidIteratorState: false,
    };
    for (var k in st) (function (key) {
        Object.defineProperty(r, key, { configurable: true, enumerable: true, get: function () { return st[key]; } });
    })(k);
    r.iterateNext = csvm.safefunction({ iterateNext() { return i < nodes.length ? nodes[i++] : null; } }.iterateNext, "iterateNext");
    r.snapshotItem = csvm.safefunction({ snapshotItem(n) { n = +n; return nodes[n] !== undefined ? nodes[n] : null; } }.snapshotItem, "snapshotItem");
    return r;
}
csvm.makeXPathResult = __makeXPathResult;

var XPathExpression = function XPathExpression() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(XPathExpression, "XPathExpression");
Object.defineProperty(XPathExpression.prototype, Symbol.toStringTag, { value: "XPathExpression", configurable: true });
XPathExpression.prototype.evaluate = csvm.safefunction({ evaluate(contextNode, type, result) {
    // 极简实现：只服务 '//html' 这类探测，返回 documentElement
    var doc = (contextNode && contextNode.ownerDocument) || contextNode || globalThis.document;
    var nodes = [];
    try {
        var de = (doc && (doc.documentElement || (doc.ownerDocument && doc.ownerDocument.documentElement)));
        if (de) nodes.push(de);
    } catch (e) {}
    return __makeXPathResult(nodes);
} }.evaluate, "evaluate");
csvm.safefunction(XPathExpression, "XPathExpression");

csvm.makeXPathExpression = function (expression) {
    var e = Object.create(XPathExpression.prototype);
    Object.defineProperty(e, "__expr", { value: String(expression), configurable: true });
    return e;
};
