var HTMLElement = function HTMLElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLElement);
Object.defineProperty(HTMLElement.prototype,Symbol.toStringTag,{value:"HTMLElement",configurable:true});
HTMLElement.prototype.__proto__=Element.prototype;

// style：每个元素一个稳定的、与 style 属性联动的 CSSStyleDeclaration。
// 真机 `'MozAppearance' in document.documentElement.style` 为 false；缺失 style 会让
// 瑞数 VM 的 `in` 抛错，从而走进自动化检测分支。写入也要回写 style 属性并触发变异。
function __htmGetStyle() {
    try { return csvm.styleFor(this); } catch (e) { return undefined; }
}
var __htmGetStyleFn = { "get style"() { return __htmGetStyle.call(this); } }["get style"];
csvm.safefunction(__htmGetStyleFn, "get style");
Object.defineProperty(HTMLElement.prototype, "style", {
    configurable: true,
    enumerable: true,
    get: csvm.proxy ? csvm.proxy(__htmGetStyleFn, "get style") : __htmGetStyleFn,
    set: undefined,
});

// 布局偏移：纯代码环境无布局，与 jsdom 一致返回 0
["offsetWidth", "offsetHeight", "offsetTop", "offsetLeft"].forEach(function (name) {
    var getter = { ["get " + name]() { return 0; } }["get " + name];
    csvm.safefunction(getter, "get " + name);
    Object.defineProperty(HTMLElement.prototype, name, {
        configurable: true, enumerable: true, get: getter,
    });
});

// innerText / outerText：纯代码环境按 textContent 近似（真机受布局影响，
// 但简单内联文本结果一致）；挑战会读它做 DOM 指纹。
var __htmInnerTextGet = { "get innerText"() { return this.textContent; } }["get innerText"];
csvm.safefunction(__htmInnerTextGet, "get innerText");
var __htmInnerTextSet = { "set innerText"(v) { this.textContent = v; } }["set innerText"];
csvm.safefunction(__htmInnerTextSet, "set innerText");
Object.defineProperty(HTMLElement.prototype, "innerText", {
    configurable: true, enumerable: true, get: __htmInnerTextGet, set: __htmInnerTextSet,
});
var __htmOuterTextGet = { "get outerText"() { return this.textContent; } }["get outerText"];
csvm.safefunction(__htmOuterTextGet, "get outerText");
var __htmOuterTextSet = { "set outerText"(v) { this.textContent = v; } }["set outerText"];
csvm.safefunction(__htmOuterTextSet, "set outerText");
Object.defineProperty(HTMLElement.prototype, "outerText", {
    configurable: true, enumerable: true, get: __htmOuterTextGet, set: __htmOuterTextSet,
});

// ---------------------------------------------------------------------------
// HTMLElement 的自有属性/方法（真机语义）
// 之前只有 8 个自有属性，而真机/ jsdom 有 100+（on* 事件处理器、dataset、
// dir/hidden/lang/tabIndex/title、click/focus/blur…）。挑战会枚举原型做自检。
// ---------------------------------------------------------------------------
(function () {
    function D(self) {
        var d = csvm.memory.domStore.get(self);
        if (!d) return null;
        if (!d.data) d.data = {};
        return d;
    }
    function has(self, k) { var d = D(self); return !!(d && Object.prototype.hasOwnProperty.call(d.data, k)); }
    function str(self, k, def) { var d = D(self); var v = d && d.data[k]; return v === undefined || v === null ? (def === undefined ? "" : def) : String(v); }
    function define(k, getter, setter, name) {
        Object.defineProperty(HTMLElement.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }
    function setStr(k) { return function (v) { var d = D(this); if (d) d.data[k] = String(v); }; }
    function setBool(k) { return function (v) { var d = D(this); if (!d) return; if (v) d.data[k] = ""; else delete d.data[k]; }; }

    // 事件处理器（on*）：真机是原型上的 accessor，默认 null
    var handlers = ["onabort","onauxclick","onbeforeinput","onbeforematch","onbeforetoggle","onblur","oncancel","oncanplay","oncanplaythrough","onchange","onclick","onclose","oncontextlost","oncontextmenu","oncontextrestored","oncopy","oncuechange","oncut","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onemptied","onended","onerror","onfocus","onformdata","ongotpointercapture","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onlostpointercapture","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup","onpaste","onpause","onplay","onplaying","onpointercancel","onpointerdown","onpointerenter","onpointerleave","onpointermove","onpointerout","onpointerover","onpointerrawupdate","onpointerup","onprogress","onratechange","onreset","onresize","onscroll","onscrollend","onsecuritypolicyviolation","onseeked","onseeking","onselect","onslotchange","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","ontouchcancel","ontouchend","ontouchmove","ontouchstart","onvolumechange","onwaiting","onwebkitanimationend","onwebkitanimationiteration","onwebkitanimationstart","onwebkittransitionend","onwheel"];
    handlers.forEach(function (name) {
        Object.defineProperty(HTMLElement.prototype, name, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(function () { var d = D(this); return (d && d.handlers && d.handlers[name]) || null; }, "get " + name),
            set: csvm.safefunction(function (v) { var d = D(this); if (!d) return; if (!d.handlers) d.handlers = {}; d.handlers[name] = typeof v === "function" ? v : null; }, "set " + name),
        });
    });

    define("dataset", function () { try { return csvm.makeDataset(this); } catch (e) { return {}; } });
    define("dir", function () { return str(this, "dir"); }, setStr("dir"));
    define("lang", function () { return str(this, "lang"); }, setStr("lang"));
    define("title", function () { return str(this, "title"); }, setStr("title"));
    define("nonce", function () { return str(this, "nonce"); }, setStr("nonce"));
    define("accessKey", function () { return str(this, "accesskey"); }, setStr("accesskey"));
    define("hidden", function () { return has(this, "hidden"); }, setBool("hidden"));
    define("draggable", function () { return has(this, "draggable"); }, setBool("draggable"));
    define("translate", function () { var d = D(this); return !(d && d.data && d.data.translate === "no"); }, function (v) { var d = D(this); if (!d) return; d.data.translate = v ? "yes" : "no"; });
    define("tabIndex", function () { var d = D(this); var n = parseInt(d && d.data.tabindex, 10); return isNaN(n) ? -1 : n; }, function (v) { var d = D(this); if (d) d.data.tabindex = String(Number(v) | 0); });
    define("offsetParent", function () { return null; });

    function method(k, fn) {
        Object.defineProperty(HTMLElement.prototype, k, {
            configurable: true, enumerable: true, writable: true,
            value: csvm.safefunction(fn, k),
        });
    }
    method("click", function () {});
    method("focus", function () { csvm.activeElement = this; });
    method("blur", function () { if (csvm.activeElement === this) csvm.activeElement = null; });
    method("attachInternals", function () {
        return { shadowRoot: null, form: null, willValidate: true,
                 checkValidity: function () { return true; },
                 reportValidity: function () { return true; },
                 setFormValue: function () {}, setValidity: function () {} };
    });
})();

HTMLElement=csvm.proxy(HTMLElement,"HTMLElement");

// ---------- HTMLMediaElement / HTMLAudioElement / HTMLVideoElement ----------
var HTMLMediaElement = function HTMLMediaElement() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLMediaElement, "HTMLMediaElement");
HTMLMediaElement.prototype.__proto__ = HTMLElement.prototype;
Object.defineProperty(HTMLMediaElement.prototype, Symbol.toStringTag, { value: "HTMLMediaElement", configurable: true });

function __canPlayType(type) {
    var t = String(type).toLowerCase();
    // Chrome 157 对挑战测试串的实际返回值
    if (t.indexOf("audio/ogg") === 0) return "probably";
    if (t.indexOf("audio/wav") === 0) return "probably";
    if (t.indexOf("audio/mpeg") === 0) return "probably";
    if (t.indexOf("audio/x-m4a") === 0 || t.indexOf("audio/aac") === 0) return "maybe";
    if (t.indexOf("video/mp4") === 0) {
        if (t.indexOf("avc1.42e01e") !== -1) return "probably";
        return "";
    }
    if (t.indexOf("video/webm") === 0) return "probably";
    if (t.indexOf("video/ogg") === 0) return "";
    if (t.indexOf("video/x-matroska") === 0) return "";
    return "";
}
var __canPlayTypeFn = { canPlayType(type) { return __canPlayType(type); } }.canPlayType;
csvm.safefunction(__canPlayTypeFn, "canPlayType");
Object.defineProperty(HTMLMediaElement.prototype, "canPlayType", {
    configurable: true, enumerable: true, writable: true, value: __canPlayTypeFn,
});

var HTMLAudioElement = function HTMLAudioElement() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLAudioElement, "HTMLAudioElement");
HTMLAudioElement.prototype.__proto__ = HTMLMediaElement.prototype;
Object.defineProperty(HTMLAudioElement.prototype, Symbol.toStringTag, { value: "HTMLAudioElement", configurable: true });

var HTMLVideoElement = function HTMLVideoElement() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLVideoElement, "HTMLVideoElement");
HTMLVideoElement.prototype.__proto__ = HTMLMediaElement.prototype;
Object.defineProperty(HTMLVideoElement.prototype, Symbol.toStringTag, { value: "HTMLVideoElement", configurable: true });

csvm.registerElement("audio", HTMLAudioElement);
csvm.registerElement("video", HTMLVideoElement);

// window.getComputedStyle：返回 CSSStyleDeclaration，并把元素的内联样式
// 展开成"计算值"（纯代码环境没有层叠，内联值即返回值，够挑战用）。
var __getComputedStyleFn = {
    getComputedStyle(el, pseudo) {
        var out = csvm.makeStyleDeclaration();
        function colorToRgb(v) {
            var s = String(v).trim();
            var m6 = /^#([0-9a-f]{6})$/i.exec(s);
            if (m6) { var n = parseInt(m6[1], 16); return "rgb(" + ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ")"; }
            var m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
            if (m3) { return "rgb(" + parseInt(m3[1] + m3[1], 16) + ", " + parseInt(m3[2] + m3[2], 16) + ", " + parseInt(m3[3] + m3[3], 16) + ")"; }
            var map = { red: "rgb(255, 0, 0)", green: "rgb(0, 128, 0)", blue: "rgb(0, 0, 255)", black: "rgb(0, 0, 0)", white: "rgb(255, 255, 255)", gray: "rgb(128, 128, 128)", grey: "rgb(128, 128, 128)", yellow: "rgb(255, 255, 0)", orange: "rgb(255, 165, 0)", purple: "rgb(128, 0, 128)", transparent: "rgba(0, 0, 0, 0)" };
            return map[s.toLowerCase()] !== undefined ? map[s.toLowerCase()] : s;
        }
        try {
            var d = csvm.memory.domStore && csvm.memory.domStore.get(el);
            var txt = (d && d.data && d.data.style) || "";
            if (txt) {
                String(txt).split(";").forEach(function (part) {
                    var i = part.indexOf(":");
                    if (i > 0) {
                        var n = part.slice(0, i).trim();
                        var v = part.slice(i + 1).trim();
                        if (n) { try { out.setProperty(n, /color$/i.test(n) ? colorToRgb(v) : v); } catch (e) {} }
                    }
                });
            }
        } catch (e) {}
        // 可继承属性：自身没有时沿祖先内联样式回溯（目前只处理 color）
        try {
            if (!out.getPropertyValue || !out.getPropertyValue("color")) {
                var nd = csvm.memory.domStore.get(el);
                var p = nd && nd.parent;
                while (p) {
                    var pdata = csvm.memory.domStore.get(p);
                    var pstyle = pdata && pdata.data && pdata.data.style;
                    if (pstyle) {
                        var mm = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(String(pstyle));
                        if (mm) { try { out.setProperty("color", colorToRgb(mm[1].trim())); } catch (e) {} break; }
                    }
                    p = pdata && pdata.parent;
                }
            }
        } catch (e) {}
        return out;
    },
}.getComputedStyle;
csvm.safefunction(__getComputedStyleFn, "getComputedStyle");
try {
    Object.defineProperty(globalThis, "getComputedStyle", {
        value: csvm.proxy ? csvm.proxy(__getComputedStyleFn, "getComputedStyle") : __getComputedStyleFn,
        writable: true, enumerable: true, configurable: true,
    });
} catch (e) {}