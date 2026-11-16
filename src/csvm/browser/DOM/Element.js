// DOMRect：纯代码环境没有布局引擎，矩形值全 0（与 jsdom 行为一致）；
// 但必须是真正的 DOMRect 实例（真机 getBoundingClientRect 返回它）。
var __rectState = new WeakMap();
var DOMRect = function DOMRect(x, y, w, h) {
    if (!(this instanceof DOMRect)) {
        throw new TypeError("Failed to construct 'DOMRect': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
    }
    __rectState.set(this, {
        x: Number(x) || 0, y: Number(y) || 0,
        width: Number(w) || 0, height: Number(h) || 0,
    });
};
csvm.safefunction(DOMRect, "DOMRect");
Object.defineProperty(DOMRect.prototype, Symbol.toStringTag, { value: "DOMRect", configurable: true });
["x", "y", "width", "height"].forEach(function (k) {
    Object.defineProperty(DOMRect.prototype, k, {
        configurable: true, enumerable: true,
        get: function () { var s = __rectState.get(this) || {}; return s[k] || 0; },
    });
});
[["top", function (s) { return s.y; }],
 ["right", function (s) { return s.x + s.width; }],
 ["bottom", function (s) { return s.y + s.height; }],
 ["left", function (s) { return s.x; }]].forEach(function (e) {
    Object.defineProperty(DOMRect.prototype, e[0], {
        configurable: true, enumerable: true,
        get: function () { var s = __rectState.get(this) || { x: 0, y: 0, width: 0, height: 0 }; return e[1](s); },
    });
});
Object.defineProperty(DOMRect.prototype, "toJSON", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function toJSON() {
        var s = __rectState.get(this) || { x: 0, y: 0, width: 0, height: 0 };
        return { x: s.x, y: s.y, width: s.width, height: s.height, top: s.y, right: s.x + s.width, bottom: s.y + s.height, left: s.x };
    }, "toJSON"),
});
Object.defineProperty(DOMRect, "fromRect", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function fromRect(r) {
        r = r || {};
        return new DOMRect(r.x, r.y, r.width, r.height);
    }, "fromRect"),
});

var Element = function Element() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Element);
Object.defineProperty(Element.prototype, Symbol.toStringTag, { value: "Element", configurable: true });

// 解析innerHtml插入的字符
function htmlEscapeText(s){
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/\u00a0/g, "&nbsp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function htmlEscapeAttr(s){
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/ /g, "&nbsp;")
        .replace(/"/g, "&quot;");
}
// HTML 序列化（innerHTML / outerHTML 的 getter 共用）
var __VOID_TAGS = {
    area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1,
    input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1,
};
function serializeNodeInto(node, out) {
    var d = csvm.memory.Dom.get(node);
    if (!d) return;
    var type = d.nodeType;
    if (type === 1) {
        var tag = String(d.tag || "");
        out.push("<" + tag);
        var data = d.data || {};
        for (var k in data) {
            if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
            out.push(" " + k + "=\"" + htmlEscapeAttr(data[k]) + "\"");
        }
        out.push(">");
        if (!__VOID_TAGS[tag.toLowerCase()]) {
            for (var i = 0; i < d.childNodes.length; i++) serializeNodeInto(d.childNodes[i], out);
            out.push("</" + tag + ">");
        }
    } else if (type === 3) {
        out.push(htmlEscapeText(d.data && d.data.text != null ? d.data.text : ""));
    } else if (type === 8) {
        out.push("<!--" + (d.data && d.data.text != null ? d.data.text : "") + "-->");
    } else if (type === 10) {
        var name = (d.data && d.data.name) || "html";
        var pub = d.data && d.data.publicId;
        var sys = d.data && d.data.systemId;
        if (pub) out.push("<!DOCTYPE " + name + " PUBLIC \"" + pub + "\"" + (sys ? " \"" + sys + "\"" : "") + ">");
        else if (sys) out.push("<!DOCTYPE " + name + " SYSTEM \"" + sys + "\">");
        else out.push("<!DOCTYPE " + name + ">");
    }
}
function serializeChildren(node) {
    var d = csvm.memory.Dom.get(node);
    var out = [];
    if (d) {
        for (var i = 0; i < d.childNodes.length; i++) serializeNodeInto(d.childNodes[i], out);
    }
    return out.join("");
}
function serializeSelf(node) {
    var out = [];
    serializeNodeInto(node, out);
    return out.join("");
}

// ---------- 基础选择器引擎（querySelector / matches / children） ----------
function __elChildren(el) {
    var d = csvm.memory.Dom.get(el), out = [];
    if (!d) return out;
    for (var i = 0; i < d.childNodes.length; i++) {
        var cd = csvm.memory.Dom.get(d.childNodes[i]);
        if (cd && cd.nodeType === 1) out.push(d.childNodes[i]);
    }
    return out;
}
function __elattr(el, name) {
    var d = csvm.memory.Dom.get(el);
    if (!d || !d.data) return null;
    var v = d.data[String(name).toLowerCase()];
    return v === undefined ? null : String(v);
}
function __classOf(el) {
    var c = __elattr(el, "class");
    return c ? c.split(/\s+/).filter(Boolean) : [];
}
// 单个简单选择器：tag / #id / .cls / [attr] / [attr="v"] / tag.cls#id / :pseudo
function __childIndex(el) {
    var d = csvm.memory.Dom.get(el);
    if (!d || !d.parent) return -1;
    var pd = csvm.memory.Dom.get(d.parent);
    if (!pd) return -1;
    var n = 0;
    for (var i = 0; i < pd.childNodes.length; i++) {
        var cd = csvm.memory.Dom.get(pd.childNodes[i]);
        if (cd && cd.nodeType === 1) { n++; if (pd.childNodes[i] === el) return n; }
    }
    return -1;
}
function __nthMatch(idx, expr) {
    var s = String(expr).replace(/\s+/g, "").toLowerCase();
    if (s === "odd") return idx % 2 === 1;
    if (s === "even") return idx % 2 === 0;
    var m = /^([+-]?\d*)n([+-]\d+)?$/.exec(s);
    if (m) {
        var a = m[1] === "" || m[1] === "+" ? 1 : (m[1] === "-" ? -1 : parseInt(m[1], 10));
        var b = m[2] ? parseInt(m[2], 10) : 0;
        if (a === 0) return idx === b;
        var n = (idx - b) / a;
        return n >= 0 && n === Math.floor(n);
    }
    return idx === parseInt(s, 10);
}
function __matchSimple(el, sel) {
    var d = csvm.memory.Dom.get(el);
    if (!d || d.nodeType !== 1) return false;
    var m = /^([a-zA-Z][\w-]*|\*)?(.*)$/.exec(sel);
    if (!m) return false;
    var tag = m[1];
    if (tag && tag !== "*" && String(d.tag).toLowerCase() !== tag.toLowerCase()) return false;
    var rest = m[2] || "";
    var re = /#([\w-]+)|\.([\w-]+)|\[\s*([\w:-]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]/g, mm;
    while ((mm = re.exec(rest))) {
        if (mm[1] !== undefined) { if (String(__elattr(el, "id") || "") !== mm[1]) return false; }
        else if (mm[2] !== undefined) { if (__classOf(el).indexOf(mm[2]) === -1) return false; }
        else if (mm[3] !== undefined) {
            var av = __elattr(el, mm[3]);
            if (av === null) return false;
            var op = mm[4], want = mm[5] !== undefined ? mm[5] : (mm[6] !== undefined ? mm[6] : mm[7]);
            if (op === "=" && av !== want) return false;
            if (op === "^=" && av.indexOf(want) !== 0) return false;
            if (op === "$=" && av.slice(-want.length) !== want) return false;
            if (op === "*=" && av.indexOf(want) === -1) return false;
            if (op === "~=" && av.split(/\s+/).indexOf(want) === -1) return false;
            if (op === "|=" && av !== want && av.indexOf(want + "-") !== 0) return false;
        }
    }
    // 伪类：:not() / :nth-child() / :first-child / :last-child / :root / :empty
    var pse = /:([\w-]+)(?:\(([^)]*)\))?/g, pm;
    while ((pm = pse.exec(rest))) {
        var name = pm[1].toLowerCase(), arg = pm[2];
        if (name === "not") { if (__matchSimple(el, String(arg).trim())) return false; }
        else if (name === "nth-child") { if (!__nthMatch(__childIndex(el), arg)) return false; }
        else if (name === "first-child") { if (__childIndex(el) !== 1) return false; }
        else if (name === "last-child") {
            var pd = d.parent ? csvm.memory.Dom.get(d.parent) : null;
            var cnt = pd ? pd.childNodes.filter(function (c) { var cd = csvm.memory.Dom.get(c); return cd && cd.nodeType === 1; }).length : 0;
            if (__childIndex(el) !== cnt) return false;
        }
        else if (name === "empty") {
            if (d.childNodes && d.childNodes.length) return false;
        }
    }
    return true;
}
function __walkElements(root, cb) {
    var d = csvm.memory.Dom.get(root);
    if (!d) return;
    for (var i = 0; i < d.childNodes.length; i++) {
        var child = d.childNodes[i], cd = csvm.memory.Dom.get(child);
        if (!cd) continue;
        if (cd.nodeType === 1) { if (cb(child) === true) return true; }
        if (__walkElements(child, cb) === true) return true;
    }
    return false;
}
// 解析一个选择器组：支持后代（空格）与子代（>）组合符
function __parseSelGroup(g) {
    var s = String(g).trim();
    var tokens = [], comb = " ", i = 0;
    while (i < s.length) {
        var c = s.charAt(i);
        if (/\s/.test(c)) { i++; continue; }
        if (c === ">") { comb = ">"; i++; continue; }
        var buf = "", depth = 0;
        while (i < s.length) {
            var ch = s.charAt(i);
            if (ch === "(") depth++;
            else if (ch === ")") depth--;
            if (depth === 0 && (/\s/.test(ch) || ch === ">")) break;
            buf += ch; i++;
        }
        if (buf) tokens.push({ sel: buf, comb: comb });
        comb = " ";
    }
    return tokens;
}
function __matchTokens(el, tokens, idx) {
    if (!__matchSimple(el, tokens[idx].sel)) return false;
    if (idx === 0) return true;
    var d = csvm.memory.Dom.get(el);
    var p = d && d.parent;
    if (tokens[idx].comb === ">") {
        var pd = p ? csvm.memory.Dom.get(p) : null;
        return !!(pd && pd.nodeType === 1 && __matchTokens(p, tokens, idx - 1));
    }
    while (p) {
        var pd2 = csvm.memory.Dom.get(p);
        if (!pd2) break;
        if (pd2.nodeType === 1 && __matchTokens(p, tokens, idx - 1)) return true;
        p = pd2.parent;
    }
    return false;
}
function __matchComplex(el, parts, idx) {
    if (!__matchSimple(el, parts[idx])) return false;
    if (idx === 0) return true;
    var d = csvm.memory.Dom.get(el);
    var p = d && d.parent;
    while (p) {
        var pd = csvm.memory.Dom.get(p);
        if (!pd) break;
        if (pd.nodeType === 1 && __matchComplex(p, parts, idx - 1)) return true;
        p = pd.parent;
    }
    return false;
}
function __queryAll(root, sel) {
    var groups = String(sel).split(",");
    var out = [], seen = [];
    for (var g = 0; g < groups.length; g++) {
        var tokens = __parseSelGroup(groups[g]);
        if (!tokens.length) continue;
        (function (tokens) {
            __walkElements(root, function (el) {
                if (seen.indexOf(el) === -1 && __matchTokens(el, tokens, tokens.length - 1)) { seen.push(el); out.push(el); }
                return false;
            });
        })(tokens);
    }
    // 保持文档顺序
    var order = [];
    __walkElements(root, function (el) { order.push(el); return false; });
    out.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    return out;
}
function __queryOne(root, sel) {
    var groups = String(sel).split(",");
    var best = null, order = [];
    __walkElements(root, function (el) { order.push(el); return false; });
    for (var g = 0; g < groups.length; g++) {
        var tokens = __parseSelGroup(groups[g]);
        if (!tokens.length) continue;
        var found = null;
        __walkElements(root, function (el) { if (__matchTokens(el, tokens, tokens.length - 1)) { found = el; return true; } return false; });
        if (found && (!best || order.indexOf(found) < order.indexOf(best))) best = found;
    }
    return best;
}
function __collection(arr) {
    return csvm.makeHTMLCollection(arr);
}csvm.queryAll = __queryAll;
csvm.queryOne = __queryOne;
csvm.collection = __collection;
csvm.elChildren = __elChildren;
csvm.matchSelector = __matchSimple;

// ---------- append / prepend / replaceChildren / before / after ----------
function __nodeFromArg(arg) {
    if (arg && typeof arg === "object" && csvm.memory.Dom.get(arg)) return arg;
    return csvm.DomGenerator("#text", { text: arg == null ? "" : String(arg) }, null);
}
function __insertInto(parent, nodes, ref) {
    var pd = csvm.memory.Dom.get(parent);
    if (!pd) return;
    var added = [];
    for (var i = 0; i < nodes.length; i++) {
        var n = __nodeFromArg(nodes[i]);
        var nd = csvm.memory.Dom.get(n);
        if (!nd) continue;
        if (nd.parent) {
            var op = csvm.memory.Dom.get(nd.parent);
            if (op) { var j = op.childNodes.indexOf(n); if (j !== -1) op.childNodes.splice(j, 1); }
        }
        nd.parent = parent;
        if (ref) {
            var k = pd.childNodes.indexOf(ref);
            if (k === -1) k = pd.childNodes.length;
            pd.childNodes.splice(k, 0, n);
        } else {
            pd.childNodes.push(n);
        }
        added.push(n);
    }
    try { if (csvm.moNotify && added.length) csvm.moNotify(parent, { type: "childList", target: parent, addedNodes: added, removedNodes: [], attributeName: null }); } catch (e) {}
}
function __replaceChildren(parent, nodes) {
    var pd = csvm.memory.Dom.get(parent);
    if (!pd) return;
    var removed = pd.childNodes.slice();
    for (var i = 0; i < pd.childNodes.length; i++) { var cd = csvm.memory.Dom.get(pd.childNodes[i]); if (cd) cd.parent = null; }
    pd.childNodes.length = 0;
    __insertInto(parent, nodes, null);
    try { if (csvm.moNotify) csvm.moNotify(parent, { type: "childList", target: parent, addedNodes: pd.childNodes.slice(), removedNodes: removed, attributeName: null }); } catch (e) {}
}



// markup -> 节点数组（parent 全为 null）；null 表示解析器还没覆盖
// 约定：入参永远是原串，不做转义；转义只发生在序列化（getter）那一侧
// 实体反转义（真机解析 innerHTML 时会把 &amp; 等还原成字符）
function __unescapeHtml(s) {
    return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, function (m, e) {
        if (e.charAt(0) === "#") {
            var n = (e.charAt(1) === "x" || e.charAt(1) === "X") ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            try { return String.fromCodePoint(n); } catch (err) { return m; }
        }
        var map = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
        return map[e] !== undefined ? map[e] : m;
    });
}
try { if (typeof Attr !== "undefined") Attr.prototype.__proto__ = Node.prototype; } catch (e) {}
csvm.htmlParse = htmlParse;
// insertAdjacent* 统一入口：beforebegin / afterbegin / beforeend / afterend
function __insertAdjacent(el, pos, node) {
    var p = String(pos).toLowerCase();
    if (!node) return;
    if (p === "beforebegin") {
        if (el.parentNode) el.parentNode.insertBefore(node, el);
    } else if (p === "afterbegin") {
        el.insertBefore(node, el.firstChild || null);
    } else if (p === "beforeend") {
        el.appendChild(node);
    } else if (p === "afterend") {
        if (el.parentNode) el.parentNode.insertBefore(node, el.nextSibling || null);
    }
}
function htmlParse(s){    // 空串：浏览器结果是 0 个子节点，不能生成空文本节点
    if (s === "") return [];

    // 整个串是一段注释：data.text 只存两个定界符之间的内容
    var whole = /^<!--([\s\S]*?)-->$/.exec(s);
    if (whole) return [csvm.DomGenerator("#comment", { text: whole[1] }, null)];

    // 纯字符（不含标签）—— 可能是实体，简单处理
    if (s.indexOf("<") === -1) {
        return [csvm.DomGenerator("#text", { text: __unescapeHtml(s).replace(/\r\n?/g, "\n") }, null)];
    }

    // 通用 HTML 片段解析：标签 + 属性 + 文本 + 注释
    var out = [];
    var stack = [];   // { node, tag }
    function appendNode(node) {
        if (stack.length) {
            var parent = stack[stack.length - 1].node;
            var pd = csvm.memory.Dom.get(parent);
            var nd = csvm.memory.Dom.get(node);
            if (pd && nd) { nd.parent = parent; pd.childNodes.push(node); return; }
        }
        out.push(node);
    }
    function makeText(txt) {
        if (txt === "") return;
        appendNode(csvm.DomGenerator("#text", { text: __unescapeHtml(txt).replace(/\r\n?/g, "\n") }, null));
    }
    function parseAttrs(str) {
        var attrs = {};
        var re = /([a-zA-Z_:][\w:.\-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g, m;
        while ((m = re.exec(str))) {
            attrs[m[1].toLowerCase()] = __unescapeHtml(m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : "")));
        }
        return attrs;
    }
    var tagRe = /^<(\/?)([a-zA-Z][a-zA-Z0-9\-]*)((?:\s+[a-zA-Z_:][\w:.\-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/;

    var i = 0;
    while (i < s.length) {
        if (s.charAt(i) !== "<") {
            var lt = s.indexOf("<", i);
            var endT = lt === -1 ? s.length : lt;
            makeText(s.slice(i, endT));
            i = endT;
            continue;
        }
        var rest = s.slice(i);
        var cm = /^<!--([\s\S]*?)-->/.exec(rest);
        if (cm) {
            appendNode(csvm.DomGenerator("#comment", { text: cm[1] }, null));
            i += cm[0].length;
            continue;
        }
        var tm = tagRe.exec(rest);
        if (tm) {
            var closing = tm[1] === "/";
            var tagName = tm[2].toLowerCase();
            var selfClose = tm[4] === "/";
            if (closing) {
                for (var k = stack.length - 1; k >= 0; k--) {
                    if (stack[k].tag === tagName) { stack.length = k; break; }
                }
            } else {
                var attrs = parseAttrs(tm[3] || "");
                var node = csvm.DomGenerator(tagName, attrs, null);
                appendNode(node);
                if (!selfClose && !__VOID_TAGS[tagName]) stack.push({ node: node, tag: tagName });
            }
            i += tm[0].length;
            continue;
        }
        // 不是标签：把 '<' 当普通文本
        makeText("<");
        i += 1;
    }
    return out;
}
// 解析innerHtml插入的字符
/* #region AUTO:Element.prototype */
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
    // namespaceURI
    Object.defineProperty(Element.prototype, "namespaceURI", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get namespaceURI", 0, function () {
            var d = csvm.memory.Dom.get(this);
            if (!d || d.nodeType !== 1) return null;
            if (d.data && d.data.__ns !== undefined) return d.data.__ns;
            return "http://www.w3.org/1999/xhtml";
        }),
        set: undefined,
    });
    // prefix
    Object.defineProperty(Element.prototype, "prefix", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get prefix", 0, function () {
            var d = csvm.memory.Dom.get(this);
            return d && d.data && d.data.__prefix !== undefined ? d.data.__prefix : null;
        }),
        set: undefined,
    });
    // localName
    Object.defineProperty(Element.prototype, "localName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get localName", 0, function () {
            var d = csvm.memory.Dom.get(this);
            return d ? String(d.tag) : "";
        }),
        set: undefined,
    });
    // tagName
    Object.defineProperty(Element.prototype, "tagName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get tagName", 0, function () {
            var d = csvm.memory.Dom.get(this);
            if (!d || d.nodeType !== 1) return undefined;
            var tag = d.tag || "";
            // HTML 标签大写；SVG 这类保持原样（当前 page 里没有 SVG）
            return /^[a-z][a-z0-9-]*$/.test(tag) ? tag.toUpperCase() : tag;
        }),
        set: undefined,
    });
    // id
    Object.defineProperty(Element.prototype, "id", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get id", 0, function () {
            var d = csvm.memory.Dom.get(this);
            return d && d.data && d.data.id !== undefined ? String(d.data.id) : "";
        }),
        set: __autoFn("set id", 1, function (value) {
            var d = csvm.memory.Dom.get(this);
            if (!d) return;
            d.data = d.data || {};
            d.data.id = String(value);
        }),
    });
    // className
    Object.defineProperty(Element.prototype, "className", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get className", 0, function () {
            var d = csvm.memory.Dom.get(this);
            return d && d.data && d.data["class"] !== undefined ? String(d.data["class"]) : "";
        }),
        set: __autoFn("set className", 1, function (value) {
            var d = csvm.memory.Dom.get(this);
            if (!d) return;
            d.data = d.data || {};
            d.data["class"] = String(value);
        }),
    });
    // classList
    Object.defineProperty(Element.prototype, "classList", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get classList", 0, function () { return csvm.makeClassList(this); }),
        set: undefined,
    });
    // dataset
    Object.defineProperty(Element.prototype, "dataset", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get dataset", 0, function () { return csvm.makeDataset(this); }),
        set: undefined,
    });
    // slot
    Object.defineProperty(Element.prototype, "slot", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get slot", 0),
        set: __autoFn("set slot", 1),
    });
    // attributes
    Object.defineProperty(Element.prototype, "attributes", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get attributes", 0, function () {
            var d = csvm.memory.Dom.get(this);
            var arr = [];
            if (d && d.data) {
                var self = this;
                Object.keys(d.data).forEach(function (n) {
                    if (csvm.makeAttr) { arr.push(csvm.makeAttr(n, d.data[n], self)); return; }
                    arr.push({ name: n, localName: n, nodeName: n, prefix: null, namespaceURI: null,
                        specified: true, ownerElement: self,
                        value: d.data[n] == null ? "" : String(d.data[n]) });
                });
            }
            return csvm.makeNamedNodeMap(arr);
        }),
        set: undefined,
    });
    // shadowRoot
    Object.defineProperty(Element.prototype, "shadowRoot", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get shadowRoot", 0, function () {
            if (!csvm.memory.shadowRoots) csvm.memory.shadowRoots = new WeakMap();
            var r = csvm.memory.shadowRoots.get(this);
            if (!r) return null;
            var mode = r.mode !== undefined ? r.mode : (csvm.memory.Dom.get(r) || {}).__mode;
            return mode === "open" ? r : null;
        }),
        set: undefined,
    });
    // part
    Object.defineProperty(Element.prototype, "part", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get part", 0),
        set: __autoFn("set part", 1),
    });
    // assignedSlot
    Object.defineProperty(Element.prototype, "assignedSlot", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get assignedSlot", 0),
        set: undefined,
    });
    // innerHTML
    Object.defineProperty(Element.prototype, "innerHTML", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get innerHTML", 0, function () {
            return serializeChildren(this);
        }),
        set: __autoFn("set innerHTML", 1, function (val) {
            var d = csvm.memory.Dom.get(this);
            if (!d) return;
            try { if (csvm.memory.config && csvm.memory.config.moLog) console.log("[INNERHTML] <" + (d.tag || "?") + "> = " + String(val).slice(0, 120)); } catch (e) {}

            // 只有 null 转空串；undefined 按 String() 转成 "undefined"
            var result = htmlParse(val === null ? "" : String(val));
            if (result === null) return;      // 未覆盖：保持原样

            // 先切断旧直接子节点的 parent
            var __removed = d.childNodes.slice();
            for (var i = 0; i < d.childNodes.length; i++) {
                var cd = csvm.memory.Dom.get(d.childNodes[i]);
                if (cd) cd.parent = null;
            }
            d.childNodes.length = 0;

            // 再挂新节点
            for (var j = 0; j < result.length; j++) {
                csvm.memory.Dom.get(result[j]).parent = this;
                d.childNodes.push(result[j]);
            }
            try { if (csvm.moNotify) csvm.moNotify(this, { type: "childList", target: this, addedNodes: result, removedNodes: __removed, attributeName: null }); } catch (_e) {}
        }),
    });
    // outerHTML
    Object.defineProperty(Element.prototype, "outerHTML", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get outerHTML", 0, function () {
            return serializeSelf(this);
        }),
        set: __autoFn("set outerHTML", 1, function (val) {
            var d = csvm.memory.Dom.get(this);
            if (!d || !d.parent) return;
            var parent = d.parent;
            var pd = csvm.memory.Dom.get(parent);
            if (!pd) return;
            var nodes = htmlParse(val === null ? "" : String(val));
            if (nodes === null) return;
            var idx = pd.childNodes.indexOf(this);
            if (idx === -1) return;
            pd.childNodes.splice(idx, 1);
            d.parent = null;
            for (var i = 0; i < nodes.length; i++) {
                var nd = csvm.memory.Dom.get(nodes[i]);
                if (nd) nd.parent = parent;
                pd.childNodes.splice(idx + i, 0, nodes[i]);
            }
        }),
    });
    // scrollTop
    Object.defineProperty(Element.prototype, "scrollTop", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollTop", 0),
        set: __autoFn("set scrollTop", 1),
    });
    // scrollLeft
    Object.defineProperty(Element.prototype, "scrollLeft", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollLeft", 0),
        set: __autoFn("set scrollLeft", 1),
    });
    // scrollWidth
    Object.defineProperty(Element.prototype, "scrollWidth", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollWidth", 0),
        set: undefined,
    });
    // scrollHeight
    Object.defineProperty(Element.prototype, "scrollHeight", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollHeight", 0),
        set: undefined,
    });
    // clientTop
    Object.defineProperty(Element.prototype, "clientTop", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientTop", 0),
        set: undefined,
    });
    // clientLeft
    Object.defineProperty(Element.prototype, "clientLeft", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientLeft", 0),
        set: undefined,
    });
    // clientWidth
    Object.defineProperty(Element.prototype, "clientWidth", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientWidth", 0),
        set: undefined,
    });
    // clientHeight
    Object.defineProperty(Element.prototype, "clientHeight", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientHeight", 0),
        set: undefined,
    });
    // onbeforecopy
    Object.defineProperty(Element.prototype, "onbeforecopy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforecopy", 0),
        set: __autoFn("set onbeforecopy", 1),
    });
    // onbeforecut
    Object.defineProperty(Element.prototype, "onbeforecut", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforecut", 0),
        set: __autoFn("set onbeforecut", 1),
    });
    // onbeforepaste
    Object.defineProperty(Element.prototype, "onbeforepaste", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforepaste", 0),
        set: __autoFn("set onbeforepaste", 1),
    });
    // onsearch
    Object.defineProperty(Element.prototype, "onsearch", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onsearch", 0),
        set: __autoFn("set onsearch", 1),
    });
    // elementTiming
    Object.defineProperty(Element.prototype, "elementTiming", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get elementTiming", 0),
        set: __autoFn("set elementTiming", 1),
    });
    // customElementRegistry
    Object.defineProperty(Element.prototype, "customElementRegistry", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get customElementRegistry", 0),
        set: undefined,
    });
    // onfullscreenchange
    Object.defineProperty(Element.prototype, "onfullscreenchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfullscreenchange", 0),
        set: __autoFn("set onfullscreenchange", 1),
    });
    // onfullscreenerror
    Object.defineProperty(Element.prototype, "onfullscreenerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfullscreenerror", 0),
        set: __autoFn("set onfullscreenerror", 1),
    });
    // onwebkitfullscreenchange
    Object.defineProperty(Element.prototype, "onwebkitfullscreenchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitfullscreenchange", 0),
        set: __autoFn("set onwebkitfullscreenchange", 1),
    });
    // onwebkitfullscreenerror
    Object.defineProperty(Element.prototype, "onwebkitfullscreenerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitfullscreenerror", 0),
        set: __autoFn("set onwebkitfullscreenerror", 1),
    });
    // activeViewTransition
    Object.defineProperty(Element.prototype, "activeViewTransition", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get activeViewTransition", 0),
        set: undefined,
    });
    // role
    Object.defineProperty(Element.prototype, "role", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get role", 0),
        set: __autoFn("set role", 1),
    });
    // ariaAtomic
    Object.defineProperty(Element.prototype, "ariaAtomic", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaAtomic", 0),
        set: __autoFn("set ariaAtomic", 1),
    });
    // ariaAutoComplete
    Object.defineProperty(Element.prototype, "ariaAutoComplete", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaAutoComplete", 0),
        set: __autoFn("set ariaAutoComplete", 1),
    });
    // ariaBusy
    Object.defineProperty(Element.prototype, "ariaBusy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaBusy", 0),
        set: __autoFn("set ariaBusy", 1),
    });
    // ariaBrailleLabel
    Object.defineProperty(Element.prototype, "ariaBrailleLabel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaBrailleLabel", 0),
        set: __autoFn("set ariaBrailleLabel", 1),
    });
    // ariaBrailleRoleDescription
    Object.defineProperty(Element.prototype, "ariaBrailleRoleDescription", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaBrailleRoleDescription", 0),
        set: __autoFn("set ariaBrailleRoleDescription", 1),
    });
    // ariaChecked
    Object.defineProperty(Element.prototype, "ariaChecked", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaChecked", 0),
        set: __autoFn("set ariaChecked", 1),
    });
    // ariaColCount
    Object.defineProperty(Element.prototype, "ariaColCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColCount", 0),
        set: __autoFn("set ariaColCount", 1),
    });
    // ariaColIndex
    Object.defineProperty(Element.prototype, "ariaColIndex", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColIndex", 0),
        set: __autoFn("set ariaColIndex", 1),
    });
    // ariaColSpan
    Object.defineProperty(Element.prototype, "ariaColSpan", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColSpan", 0),
        set: __autoFn("set ariaColSpan", 1),
    });
    // ariaCurrent
    Object.defineProperty(Element.prototype, "ariaCurrent", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaCurrent", 0),
        set: __autoFn("set ariaCurrent", 1),
    });
    // ariaDescription
    Object.defineProperty(Element.prototype, "ariaDescription", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDescription", 0),
        set: __autoFn("set ariaDescription", 1),
    });
    // ariaDisabled
    Object.defineProperty(Element.prototype, "ariaDisabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDisabled", 0),
        set: __autoFn("set ariaDisabled", 1),
    });
    // ariaExpanded
    Object.defineProperty(Element.prototype, "ariaExpanded", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaExpanded", 0),
        set: __autoFn("set ariaExpanded", 1),
    });
    // ariaHasPopup
    Object.defineProperty(Element.prototype, "ariaHasPopup", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaHasPopup", 0),
        set: __autoFn("set ariaHasPopup", 1),
    });
    // ariaHidden
    Object.defineProperty(Element.prototype, "ariaHidden", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaHidden", 0),
        set: __autoFn("set ariaHidden", 1),
    });
    // ariaInvalid
    Object.defineProperty(Element.prototype, "ariaInvalid", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaInvalid", 0),
        set: __autoFn("set ariaInvalid", 1),
    });
    // ariaKeyShortcuts
    Object.defineProperty(Element.prototype, "ariaKeyShortcuts", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaKeyShortcuts", 0),
        set: __autoFn("set ariaKeyShortcuts", 1),
    });
    // ariaLabel
    Object.defineProperty(Element.prototype, "ariaLabel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLabel", 0),
        set: __autoFn("set ariaLabel", 1),
    });
    // ariaLevel
    Object.defineProperty(Element.prototype, "ariaLevel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLevel", 0),
        set: __autoFn("set ariaLevel", 1),
    });
    // ariaLive
    Object.defineProperty(Element.prototype, "ariaLive", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLive", 0),
        set: __autoFn("set ariaLive", 1),
    });
    // ariaModal
    Object.defineProperty(Element.prototype, "ariaModal", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaModal", 0),
        set: __autoFn("set ariaModal", 1),
    });
    // ariaMultiLine
    Object.defineProperty(Element.prototype, "ariaMultiLine", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaMultiLine", 0),
        set: __autoFn("set ariaMultiLine", 1),
    });
    // ariaMultiSelectable
    Object.defineProperty(Element.prototype, "ariaMultiSelectable", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaMultiSelectable", 0),
        set: __autoFn("set ariaMultiSelectable", 1),
    });
    // ariaOrientation
    Object.defineProperty(Element.prototype, "ariaOrientation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaOrientation", 0),
        set: __autoFn("set ariaOrientation", 1),
    });
    // ariaPlaceholder
    Object.defineProperty(Element.prototype, "ariaPlaceholder", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaPlaceholder", 0),
        set: __autoFn("set ariaPlaceholder", 1),
    });
    // ariaPosInSet
    Object.defineProperty(Element.prototype, "ariaPosInSet", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaPosInSet", 0),
        set: __autoFn("set ariaPosInSet", 1),
    });
    // ariaPressed
    Object.defineProperty(Element.prototype, "ariaPressed", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaPressed", 0),
        set: __autoFn("set ariaPressed", 1),
    });
    // ariaReadOnly
    Object.defineProperty(Element.prototype, "ariaReadOnly", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaReadOnly", 0),
        set: __autoFn("set ariaReadOnly", 1),
    });
    // ariaRelevant
    Object.defineProperty(Element.prototype, "ariaRelevant", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRelevant", 0),
        set: __autoFn("set ariaRelevant", 1),
    });
    // ariaRequired
    Object.defineProperty(Element.prototype, "ariaRequired", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRequired", 0),
        set: __autoFn("set ariaRequired", 1),
    });
    // ariaRoleDescription
    Object.defineProperty(Element.prototype, "ariaRoleDescription", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRoleDescription", 0),
        set: __autoFn("set ariaRoleDescription", 1),
    });
    // ariaRowCount
    Object.defineProperty(Element.prototype, "ariaRowCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowCount", 0),
        set: __autoFn("set ariaRowCount", 1),
    });
    // ariaRowIndex
    Object.defineProperty(Element.prototype, "ariaRowIndex", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowIndex", 0),
        set: __autoFn("set ariaRowIndex", 1),
    });
    // ariaRowSpan
    Object.defineProperty(Element.prototype, "ariaRowSpan", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowSpan", 0),
        set: __autoFn("set ariaRowSpan", 1),
    });
    // ariaSelected
    Object.defineProperty(Element.prototype, "ariaSelected", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaSelected", 0),
        set: __autoFn("set ariaSelected", 1),
    });
    // ariaSetSize
    Object.defineProperty(Element.prototype, "ariaSetSize", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaSetSize", 0),
        set: __autoFn("set ariaSetSize", 1),
    });
    // ariaSort
    Object.defineProperty(Element.prototype, "ariaSort", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaSort", 0),
        set: __autoFn("set ariaSort", 1),
    });
    // ariaValueMax
    Object.defineProperty(Element.prototype, "ariaValueMax", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueMax", 0),
        set: __autoFn("set ariaValueMax", 1),
    });
    // ariaValueMin
    Object.defineProperty(Element.prototype, "ariaValueMin", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueMin", 0),
        set: __autoFn("set ariaValueMin", 1),
    });
    // ariaValueNow
    Object.defineProperty(Element.prototype, "ariaValueNow", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueNow", 0),
        set: __autoFn("set ariaValueNow", 1),
    });
    // ariaValueText
    Object.defineProperty(Element.prototype, "ariaValueText", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueText", 0),
        set: __autoFn("set ariaValueText", 1),
    });
    // children
    Object.defineProperty(Element.prototype, "children", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get children", 0, function () {
            var self = this;
            return csvm.makeLiveHTMLCollection(function () { return __elChildren(self); });
        }),
        set: undefined,
    });
    // firstElementChild
    Object.defineProperty(Element.prototype, "firstElementChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get firstElementChild", 0, function () { var a = __elChildren(this); return a.length ? a[0] : null; }),
        set: undefined,
    });
    // lastElementChild
    Object.defineProperty(Element.prototype, "lastElementChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lastElementChild", 0, function () { var a = __elChildren(this); return a.length ? a[a.length - 1] : null; }),
        set: undefined,
    });
    // childElementCount
    Object.defineProperty(Element.prototype, "childElementCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get childElementCount", 0, function () { return __elChildren(this).length; }),
        set: undefined,
    });
    // previousElementSibling
    Object.defineProperty(Element.prototype, "previousElementSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get previousElementSibling", 0, function () { var d = csvm.memory.Dom.get(this); if (!d || !d.parent) return null; var a = __elChildren(d.parent); var i = a.indexOf(this); return i > 0 ? a[i - 1] : null; }),
        set: undefined,
    });
    // nextElementSibling
    Object.defineProperty(Element.prototype, "nextElementSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nextElementSibling", 0, function () { var d = csvm.memory.Dom.get(this); if (!d || !d.parent) return null; var a = __elChildren(d.parent); var i = a.indexOf(this); return i !== -1 && i + 1 < a.length ? a[i + 1] : null; }),
        set: undefined,
    });
    // after
    Object.defineProperty(Element.prototype, "after", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("after", 0, function () { var d = csvm.memory.Dom.get(this); if (!d || !d.parent) return; __insertInto(d.parent, Array.prototype.slice.call(arguments), d.nextSibling || null); }),
    });
    // animate
    Object.defineProperty(Element.prototype, "animate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("animate", 1),
    });
    // append
    Object.defineProperty(Element.prototype, "append", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("append", 0, function () { __insertInto(this, Array.prototype.slice.call(arguments), null); }),
    });
    // attachShadow
    Object.defineProperty(Element.prototype, "attachShadow", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("attachShadow", 1, function (init) {
            var mode = init && init.mode ? String(init.mode) : "open";
            if (!csvm.memory.shadowRoots) csvm.memory.shadowRoots = new WeakMap();
            var exist = csvm.memory.shadowRoots.get(this);
            if (exist) throw new Error("NotSupportedError: Shadow root cannot be created on a host which already hosts a shadow tree.");
            var root = csvm.DomGenerator("#document-fragment", { mode: mode }, null);
            var rd = csvm.memory.Dom.get(root);
            if (rd) { rd.host = this; rd.__mode = mode; }
            try { Object.defineProperty(root, "mode", { value: mode, enumerable: true, configurable: true }); } catch (e) {}
            try { Object.defineProperty(root, "host", { value: this, enumerable: true, configurable: true }); } catch (e) {}
            csvm.memory.shadowRoots.set(this, root);
            return root;
        }),
    });
    // before
    Object.defineProperty(Element.prototype, "before", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("before", 0, function () { var d = csvm.memory.Dom.get(this); if (!d || !d.parent) return; __insertInto(d.parent, Array.prototype.slice.call(arguments), this); }),
    });
    // checkVisibility
    Object.defineProperty(Element.prototype, "checkVisibility", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("checkVisibility", 0),
    });
    // closest
    Object.defineProperty(Element.prototype, "closest", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("closest", 1, function (sel) {
            var tokens = __parseSelGroup(String(sel));
            if (!tokens.length) return null;
            var e = this;
            while (e) {
                var d = csvm.memory.Dom.get(e);
                if (d && d.nodeType === 1 && __matchTokens(e, tokens, tokens.length - 1)) return e;
                e = d && d.parent;
            }
            return null;
        }),
    });
    // computedStyleMap
    Object.defineProperty(Element.prototype, "computedStyleMap", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("computedStyleMap", 0),
    });
    // getAnimations
    Object.defineProperty(Element.prototype, "getAnimations", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAnimations", 0),
    });
    // getAttribute
    Object.defineProperty(Element.prototype, "getAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttribute", 1, function (name) {
            var d = csvm.memory.Dom.get(this);
            if (!d || !d.data) return null;
            var key = String(name).toLowerCase();
            try { if (csvm.memory.config && csvm.memory.config.moLog && key !== "style") { if (key === "webdriver" && globalThis.__adRecOn) { try { globalThis.__adRecOn(2000); } catch (e) {} } console.log("[GETATTR] <" + (d.tag || "?") + "> " + key + " ring=" + (globalThis.__adRingGet ? globalThis.__adRingGet() : "-")); } } catch (_e) {}
            return Object.prototype.hasOwnProperty.call(d.data, key)
                ? String(d.data[key])
                : null;
        }),
    });
    // getAttributeNS
    Object.defineProperty(Element.prototype, "getAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNS", 2),
    });
    // getAttributeNames
    Object.defineProperty(Element.prototype, "getAttributeNames", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNames", 0, function () {
            var d = csvm.memory.Dom.get(this);
            return d && d.data ? Object.keys(d.data) : [];
        }),
    });
    // getAttributeNode
    Object.defineProperty(Element.prototype, "getAttributeNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNode", 1),
    });
    // getAttributeNodeNS
    Object.defineProperty(Element.prototype, "getAttributeNodeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNodeNS", 2),
    });
    // getBoundingClientRect
    // 纯代码环境没有布局引擎：与 jsdom 一致返回全 0 的 DOMRect（真机有布局值）。
    // 关键是要返回一个真正的 DOMRect 对象，而不是 undefined。
    Object.defineProperty(Element.prototype, "getBoundingClientRect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getBoundingClientRect", 0, function () {
            return new DOMRect(0, 0, 0, 0);
        }),
    });
    // getClientRects
    Object.defineProperty(Element.prototype, "getClientRects", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getClientRects", 0, function () {
            var arr = [new DOMRect(0, 0, 0, 0)];
            try { Object.defineProperty(arr, "item", { value: function (i) { return arr[i] || null; }, configurable: true, enumerable: false, writable: true }); } catch (e) {}
            return arr;
        }),
    });
    // 布局尺寸：纯代码环境没有布局引擎，与 jsdom 一致返回 0
    // （真机是实际像素值；挑战会读这些属性做 DOM 指纹，不能是 undefined）
    ["clientWidth", "clientHeight", "clientTop", "clientLeft",
     "scrollWidth", "scrollHeight"].forEach(function (name) {
        Object.defineProperty(Element.prototype, name, {
            configurable: true, enumerable: true,
            get: __autoFn("get " + name, 0, function () { return 0; }),
        });
    });
    ["scrollTop", "scrollLeft"].forEach(function (name) {
        Object.defineProperty(Element.prototype, name, {
            configurable: true, enumerable: true,
            get: __autoFn("get " + name, 0, function () { return 0; }),
            set: __autoFn("set " + name, 1, function (v) { return Number(v) || 0; }),
        });
    });
    // getElementsByClassName
    Object.defineProperty(Element.prototype, "getElementsByClassName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByClassName", 1, function (names) {
            var want = String(names).split(/\s+/).filter(Boolean);
            var self = this;
            return csvm.makeLiveHTMLCollection(function () {
                var out = [];
                __walkElements(self, function (el) {
                    var cls = __classOf(el);
                    for (var i = 0; i < want.length; i++) if (cls.indexOf(want[i]) === -1) return false;
                    out.push(el);
                    return false;
                });
                return out;
            });
        }),
    });
    // getElementsByTagName
    Object.defineProperty(Element.prototype, "getElementsByTagName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByTagName", 1, function (tagName) {
            var target = String(tagName).toLowerCase();
            var self = this;
            return csvm.makeLiveHTMLCollection(function () {
                var domTree = csvm.memory.Dom;
                var out = [];
                (function walk(node) {
                    var d = domTree.get(node);
                    if (!d) return;
                    for (var i = 0; i < d.childNodes.length; i++) {
                        var child = d.childNodes[i];
                        var cd = domTree.get(child);
                        if (cd && cd.nodeType === 1 && (target === "*" || String(cd.tag).toLowerCase() === target)) {
                            out.push(child);
                        }
                        walk(child);
                    }
                })(self);          // 从 childNodes 开始，天然不含 this
                return out;
            });
        }),
    });
    // getElementsByTagNameNS
    Object.defineProperty(Element.prototype, "getElementsByTagNameNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByTagNameNS", 2),
    });
    // getHTML
    Object.defineProperty(Element.prototype, "getHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getHTML", 0),
    });
    // hasAttribute
    Object.defineProperty(Element.prototype, "hasAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasAttribute", 1, function (name) {
            var d = csvm.memory.Dom.get(this);
            try { if (csvm.memory.config && csvm.memory.config.moLog) console.log("[HASATTR] <" + (d && d.tag || "?") + "> " + String(name).toLowerCase()); } catch (_e) {}
            return !!(d && d.data && Object.prototype.hasOwnProperty.call(d.data, String(name).toLowerCase()));
        }),
    });
    // hasAttributeNS
    Object.defineProperty(Element.prototype, "hasAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasAttributeNS", 2),
    });
    // hasAttributes
    Object.defineProperty(Element.prototype, "hasAttributes", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasAttributes", 0),
    });
    // hasPointerCapture
    Object.defineProperty(Element.prototype, "hasPointerCapture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasPointerCapture", 1),
    });
    // insertAdjacentElement
    Object.defineProperty(Element.prototype, "insertAdjacentElement", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertAdjacentElement", 2, function (pos, node) {
            __insertAdjacent(this, pos, node);
            return node;
        }),
    });
    // insertAdjacentHTML
    Object.defineProperty(Element.prototype, "insertAdjacentHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertAdjacentHTML", 2, function (pos, html) {
            var nodes = htmlParse(html === null ? "" : String(html));
            var p = String(pos).toLowerCase();
            for (var i = 0; i < nodes.length; i++) __insertAdjacent(this, p, nodes[i]);
        }),
    });
    // insertAdjacentText
    Object.defineProperty(Element.prototype, "insertAdjacentText", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertAdjacentText", 2, function (pos, text) {
            var d = csvm.memory.Dom.get(this);
            var doc = (d && d.ownerDocument) || (typeof document !== "undefined" ? document : null);
            var node = (doc && doc.createTextNode) ? doc.createTextNode(String(text)) : null;
            if (node) __insertAdjacent(this, pos, node);
        }),
    });
    // matches
    Object.defineProperty(Element.prototype, "matches", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("matches", 1, function (sel) { return __matchSimple(this, String(sel).trim()); }),
    });
    // moveBefore
    Object.defineProperty(Element.prototype, "moveBefore", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("moveBefore", 2),
    });
    // prepend
    Object.defineProperty(Element.prototype, "prepend", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("prepend", 0, function () { var d = csvm.memory.Dom.get(this); __insertInto(this, Array.prototype.slice.call(arguments), d && d.childNodes[0] ? d.childNodes[0] : null); }),
    });
    // querySelector
    Object.defineProperty(Element.prototype, "querySelector", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("querySelector", 1, function (sel) { return __queryOne(this, sel) || null; }),
    });
    // querySelectorAll
    Object.defineProperty(Element.prototype, "querySelectorAll", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("querySelectorAll", 1, function (sel) { return csvm.makeNodeList(__queryAll(this, sel)); }),
    });
    // releasePointerCapture
    Object.defineProperty(Element.prototype, "releasePointerCapture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("releasePointerCapture", 1),
    });
    // remove
    Object.defineProperty(Element.prototype, "remove", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("remove", 0),
    });
    // removeAttribute
    Object.defineProperty(Element.prototype, "removeAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeAttribute", 1, function (name) {
            var d = csvm.memory.Dom.get(this);
            var lname = String(name).toLowerCase();
            if (d && d.data) delete d.data[lname];
            try { if (lname === "style" && csvm.styleAttrChanged) csvm.styleAttrChanged(this, ""); } catch (_e) {}
            try { if (csvm.moNotify) csvm.moNotify(this, { type: "attributes", target: this, addedNodes: [], removedNodes: [], attributeName: String(name).toLowerCase(), oldValue: null }); } catch (_e) {}
        }),
    });
    // removeAttributeNS
    Object.defineProperty(Element.prototype, "removeAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeAttributeNS", 2),
    });
    // removeAttributeNode
    Object.defineProperty(Element.prototype, "removeAttributeNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeAttributeNode", 1),
    });
    // replaceChildren
    Object.defineProperty(Element.prototype, "replaceChildren", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceChildren", 0, function () { __replaceChildren(this, Array.prototype.slice.call(arguments)); }),
    });
    // replaceWith
    Object.defineProperty(Element.prototype, "replaceWith", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceWith", 0),
    });
    // requestFullscreen
    Object.defineProperty(Element.prototype, "requestFullscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestFullscreen", 0),
    });
    // requestPointerLock
    Object.defineProperty(Element.prototype, "requestPointerLock", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestPointerLock", 0),
    });
    // scroll
    Object.defineProperty(Element.prototype, "scroll", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scroll", 0),
    });
    // scrollBy
    Object.defineProperty(Element.prototype, "scrollBy", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollBy", 0),
    });
    // scrollIntoView
    Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollIntoView", 0),
    });
    // scrollIntoViewIfNeeded
    Object.defineProperty(Element.prototype, "scrollIntoViewIfNeeded", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollIntoViewIfNeeded", 0),
    });
    // scrollTo
    Object.defineProperty(Element.prototype, "scrollTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollTo", 0),
    });
    // setAttribute
    Object.defineProperty(Element.prototype, "setAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttribute", 2, function (name, value) {
            var d = csvm.memory.Dom.get(this);
            if (!d) return;
            d.data = d.data || {};
            var lname = String(name).toLowerCase();
            try { if (csvm.memory.config && csvm.memory.config.moLog) console.log("[SETATTR] <" + (d.tag || "?") + "> " + lname + "=" + String(value).slice(0, 60)); } catch (_e) {}
            d.data[lname] = String(value);
            try { if (lname === "style" && csvm.styleAttrChanged) csvm.styleAttrChanged(this, String(value)); } catch (_e) {}
            try { if (csvm.moNotify) csvm.moNotify(this, { type: "attributes", target: this, addedNodes: [], removedNodes: [], attributeName: String(name).toLowerCase(), oldValue: null }); } catch (_e) {}
        }),
    });
    // setAttributeNS
    Object.defineProperty(Element.prototype, "setAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttributeNS", 3),
    });
    // setAttributeNode
    Object.defineProperty(Element.prototype, "setAttributeNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttributeNode", 1),
    });
    // setAttributeNodeNS
    Object.defineProperty(Element.prototype, "setAttributeNodeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttributeNodeNS", 1),
    });
    // setHTMLUnsafe
    Object.defineProperty(Element.prototype, "setHTMLUnsafe", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setHTMLUnsafe", 1),
    });
    // setPointerCapture
    Object.defineProperty(Element.prototype, "setPointerCapture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setPointerCapture", 1),
    });
    // startViewTransition
    Object.defineProperty(Element.prototype, "startViewTransition", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("startViewTransition", 0),
    });
    // toggleAttribute
    Object.defineProperty(Element.prototype, "toggleAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("toggleAttribute", 1, function (name, force) {
            var d = csvm.memory.Dom.get(this);
            if (!d) return false;
            d.data = d.data || {};
            var lname = String(name).toLowerCase();
            var has = Object.prototype.hasOwnProperty.call(d.data, lname);
            var next = (force === undefined) ? !has : !!force;
            if (next) {
                if (!has) d.data[lname] = "";
            } else if (has) {
                delete d.data[lname];
            }
            if (next !== has) {
                try { if (csvm.moNotify) csvm.moNotify(this, { type: "attributes", target: this, addedNodes: [], removedNodes: [], attributeName: lname, oldValue: null }); } catch (_e) {}
            }
            return next;
        }),
    });
    // webkitMatchesSelector
    Object.defineProperty(Element.prototype, "webkitMatchesSelector", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitMatchesSelector", 1),
    });
    // webkitRequestFullScreen
    Object.defineProperty(Element.prototype, "webkitRequestFullScreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitRequestFullScreen", 0),
    });
    // webkitRequestFullscreen
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitRequestFullscreen", 0),
    });
    // currentCSSZoom
    Object.defineProperty(Element.prototype, "currentCSSZoom", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get currentCSSZoom", 0),
        set: undefined,
    });
    // ariaColIndexText
    Object.defineProperty(Element.prototype, "ariaColIndexText", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColIndexText", 0),
        set: __autoFn("set ariaColIndexText", 1),
    });
    // ariaRowIndexText
    Object.defineProperty(Element.prototype, "ariaRowIndexText", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowIndexText", 0),
        set: __autoFn("set ariaRowIndexText", 1),
    });
    // ariaActionsElements
    Object.defineProperty(Element.prototype, "ariaActionsElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaActionsElements", 0),
        set: __autoFn("set ariaActionsElements", 1),
    });
    // ariaActiveDescendantElement
    Object.defineProperty(Element.prototype, "ariaActiveDescendantElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaActiveDescendantElement", 0),
        set: __autoFn("set ariaActiveDescendantElement", 1),
    });
    // ariaControlsElements
    Object.defineProperty(Element.prototype, "ariaControlsElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaControlsElements", 0),
        set: __autoFn("set ariaControlsElements", 1),
    });
    // ariaDescribedByElements
    Object.defineProperty(Element.prototype, "ariaDescribedByElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDescribedByElements", 0),
        set: __autoFn("set ariaDescribedByElements", 1),
    });
    // ariaDetailsElements
    Object.defineProperty(Element.prototype, "ariaDetailsElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDetailsElements", 0),
        set: __autoFn("set ariaDetailsElements", 1),
    });
    // ariaErrorMessageElements
    Object.defineProperty(Element.prototype, "ariaErrorMessageElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaErrorMessageElements", 0),
        set: __autoFn("set ariaErrorMessageElements", 1),
    });
    // ariaFlowToElements
    Object.defineProperty(Element.prototype, "ariaFlowToElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaFlowToElements", 0),
        set: __autoFn("set ariaFlowToElements", 1),
    });
    // ariaLabelledByElements
    Object.defineProperty(Element.prototype, "ariaLabelledByElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLabelledByElements", 0),
        set: __autoFn("set ariaLabelledByElements", 1),
    });
    // ariaNotify
    Object.defineProperty(Element.prototype, "ariaNotify", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("ariaNotify", 1),
    });
    // pseudo
    Object.defineProperty(Element.prototype, "pseudo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("pseudo", 1),
    });
    // setHTML
    Object.defineProperty(Element.prototype, "setHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setHTML", 1),
    });
    // TODO constructor: Element.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Element.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Element",
    });
    // Symbol(Symbol.unscopables) (symbol)
    Object.defineProperty(Element.prototype, Symbol.unscopables, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: Object.assign(Object.create(null), {
            ["after"]: true,
            ["append"]: true,
            ["before"]: true,
            ["prepend"]: true,
            ["remove"]: true,
            ["replaceChildren"]: true,
            ["replaceWith"]: true,
            ["slot"]: true,
        }),
    });
})();
/* #endregion AUTO:Element.prototype */

Element.prototype.__proto__ = Node.prototype;
Element = csvm.proxy(Element, "Element");