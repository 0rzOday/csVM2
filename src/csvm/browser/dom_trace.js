// DOM 调用追踪（CSVM_DOM_TRACE=1）
//
// 在 default（手写 DOM）和 jsdom 两条链路上做同一件事：包装 DOM 原型上的
// 方法/getter/setter，按统一格式输出
//   [DT]n|M|Document.createElement|div|<返回值摘要>
//   [DT]n|G|Element.getAttribute|html,data-kantu|s:null
// 用于逐条 diff「挑战看到了什么」。
(function () {
    var W = (typeof window !== "undefined") ? window : globalThis;
    var ON = W.__CSVM_DOM_TRACE === true;
    try { delete W.__CSVM_DOM_TRACE; } catch (e) {}
    if (!ON) return;

    var seq = 0;
    function sh(v) {
        try {
            if (v === null) return "null";
            var t = typeof v;
            if (t === "undefined") return "undef";
            if (t === "string") { var s = v.replace(/\s+/g, " "); return "s:" + s.slice(0, 80); }
            if (t === "number" || t === "boolean") return t + ":" + v;
            if (t === "function") return "fn";
            var tn = "";
            try { tn = v.tagName || v.nodeName || ""; } catch (e) {}
            var tag = "";
            try { tag = Object.prototype.toString.call(v); } catch (e) {}
            return tn + tag;
        } catch (e) { return "?"; }
    }
    // 只记录「挑战代码」发起的调用：跳过框架内部对公共 getter 的复用。
    // default(vm2)：挑战帧形如 `eval at apply (...), <anonymous>:1:...`
    // jsdom：挑战由 vm.runInContext 执行，帧里是 <anonymous> / script[..] / 外部脚本
    // 框架自身代码的帧是 `框架:NNN:NN`。
    function fromChallenge(name) {
        var st = "";
        try { st = String(new Error().stack || ""); } catch (e) { return true; }
        var base = String(name || "").split(".").pop();
        var lines = st.split(String.fromCharCode(10));
        for (var i = 1; i < lines.length; i++) {
            var l = lines[i];
            // 跳过追踪器自身与包装帧（它们都在 框架: 里，且带方法名/Proxy/get/set/log）
            if (l.indexOf("框架:") !== -1 &&
                (l.indexOf(base) !== -1 || l.indexOf("log") !== -1 ||
                 l.indexOf("fromChallenge") !== -1 || l.indexOf("Proxy.") !== -1 ||
                 /at (get|set) /.test(l))) continue;
            if (l.indexOf("框架:") !== -1) return false;      // 框架内部调用
            return /<anonymous>:1:/.test(l)
                || l.indexOf("script[") !== -1
                || l.indexOf("外部脚本") !== -1
                || l.indexOf("r2mKa") !== -1;
        }
        return false;
    }
    function log(kind, name, args, ret) {
        if (!fromChallenge(name)) return;
        try {
            var extra = "";
            if (seq < 5) {
                var st = "";
                try { st = String(new Error().stack || ""); } catch (e) {}
                extra = " | " + st.split(String.fromCharCode(10)).slice(1, 4).join(" >> ");
            }
            console.log("[DT]" + (seq++) + "|" + kind + "|" + name + "|" + args + "|" + sh(ret) + extra);
        } catch (e) {}
    }
    function nativeFn(fn, name) {
        try { if (typeof csvm !== "undefined" && csvm.safefunction) csvm.safefunction(fn, name); } catch (e) {}
        try {
            Object.defineProperty(fn, "toString", {
                configurable: true, writable: true, enumerable: false,
                value: function () { return "function " + name + "() { [native code] }"; },
            });
        } catch (e) {}
        return fn;
    }
    function argsText(args) {
        var out = [];
        for (var i = 0; i < args.length && i < 4; i++) out.push(sh(args[i]));
        return out.join(",");
    }
    function wrap(proto, label, names) {
        if (!proto) return;
        names.forEach(function (n) {
            var d;
            try { d = Object.getOwnPropertyDescriptor(proto, n); } catch (e) { return; }
            if (!d) return;
            try {
                if (typeof d.value === "function") {
                    var orig = d.value;
                    var w = nativeFn(function () {
                        var a = argsText(arguments);
                        var r;
                        try { r = orig.apply(this, arguments); }
                        catch (e) { log("X", label + "." + n, a, "THROW:" + (e && e.message)); throw e; }
                        log("M", label + "." + n, a, r);
                        return r;
                    }, n);
                    Object.defineProperty(proto, n, {
                        configurable: d.configurable, enumerable: d.enumerable, writable: d.writable, value: w,
                    });
                } else if (typeof d.get === "function") {
                    var og = d.get;
                    var nd = {
                        configurable: d.configurable,
                        enumerable: d.enumerable,
                        get: nativeFn(function () {
                            var r;
                            try { r = og.call(this); }
                            catch (e) { log("X", label + "." + n, "", "THROW:" + (e && e.message)); throw e; }
                            log("G", label + "." + n, "", r);
                            return r;
                        }, "get " + n),
                    };
                    if (typeof d.set === "function") {
                        var os = d.set;
                        nd.set = nativeFn(function (v) {
                            log("S", label + "." + n, sh(v), "");
                            return os.call(this, v);
                        }, "set " + n);
                    }
                    Object.defineProperty(proto, n, nd);
                }
            } catch (e) {}
        });
    }

    // ── 方法 / 属性 ─────────────────────────────────────────────────────
    // own-DOM 模式下这些接口是 csvm_code 里的局部 var，不在 window 上；
    // jsdom 模式下它们是 window 的全局。两种都取到。
    // 注意：不能用 eval 取（框架给 eval 包了 Proxy，会变成全局作用域）
    function pick(fn) { try { return fn(); } catch (e) { return undefined; } }
    var CNode = pick(function () { return (typeof Node !== "undefined") ? Node : W.Node; });
    var CElement = pick(function () { return (typeof Element !== "undefined") ? Element : W.Element; });
    var CHTMLElement = pick(function () { return (typeof HTMLElement !== "undefined") ? HTMLElement : W.HTMLElement; });
    var CDocument = pick(function () { return (typeof Document !== "undefined") ? Document : W.Document; });
    var CMO = pick(function () { return (typeof MutationObserver !== "undefined") ? MutationObserver : W.MutationObserver; });
    var CCSS = pick(function () { return (typeof CSSStyleDeclaration !== "undefined") ? CSSStyleDeclaration : W.CSSStyleDeclaration; });
    var CCanvas = pick(function () { return (typeof HTMLCanvasElement !== "undefined") ? HTMLCanvasElement : W.HTMLCanvasElement; });
    var CCtx = pick(function () { return (typeof CanvasRenderingContext2D !== "undefined") ? CanvasRenderingContext2D : W.CanvasRenderingContext2D; });
    var CXHR = pick(function () { return (typeof XMLHttpRequest !== "undefined") ? XMLHttpRequest : W.XMLHttpRequest; });
    var CET = pick(function () { return (typeof EventTarget !== "undefined") ? EventTarget : W.EventTarget; });
    var CNav = pick(function () { return (typeof Navigator !== "undefined") ? Navigator : W.Navigator; });
    wrap(CNode && CNode.prototype, "Node", [
        "appendChild", "insertBefore", "removeChild", "replaceChild", "cloneNode",
        "contains", "hasChildNodes", "normalize",
    ]);
    wrap(CElement && CElement.prototype, "Element", [
        "setAttribute", "getAttribute", "hasAttribute", "removeAttribute",
        "getAttributeNames", "querySelector", "querySelectorAll", "matches", "closest",
        "append", "prepend", "before", "after", "replaceChildren",
        "getBoundingClientRect", "getClientRects", "getElementsByTagName",
        "getElementsByClassName", "insertAdjacentHTML",
        "innerHTML", "outerHTML", "textContent",
        "children", "childNodes", "attributes", "classList", "dataset",
        "firstElementChild", "lastElementChild", "childElementCount",
        "nextElementSibling", "previousElementSibling", "id", "className",
    ]);
    wrap(CHTMLElement && CHTMLElement.prototype, "HTMLElement", [
        "innerText", "outerText", "style", "offsetWidth", "offsetHeight",
        "offsetTop", "offsetLeft", "clientWidth", "clientHeight",
        "scrollWidth", "scrollHeight", "scrollTop", "scrollLeft",
    ]);
    wrap(CDocument && CDocument.prototype, "Document", [
        "createElement", "createElementNS", "createTextNode", "createComment",
        "createDocumentFragment", "createAttribute", "createEvent",
        "getElementById", "getElementsByTagName", "getElementsByClassName",
        "getElementsByName", "querySelector", "querySelectorAll",
        "write", "writeln", "open", "close", "hasFocus",
        "cookie", "referrer", "title", "readyState", "visibilityState", "hidden",
        "body", "head", "documentElement", "forms", "scripts", "images", "links",
        "anchors", "all", "defaultView", "location",
    ]);
    wrap(CMO && CMO.prototype, "MutationObserver", [
        "observe", "disconnect", "takeRecords",
    ]);
    wrap(CCSS && CCSS.prototype, "CSSStyleDeclaration", [
        "setProperty", "getPropertyValue", "removeProperty", "item",
        "cssText", "length",
    ]);
    wrap(CCanvas && CCanvas.prototype, "HTMLCanvasElement", [
        "getContext", "toDataURL", "toBlob", "width", "height",
    ]);
    wrap(CCtx && CCtx.prototype, "CanvasRenderingContext2D", [
        "measureText", "fillText", "strokeText", "fillRect", "clearRect",
        "getImageData", "putImageData", "fillStyle", "font", "textBaseline",
        "textAlign", "globalAlpha", "lineWidth", "drawImage",
    ]);
    wrap(CXHR && CXHR.prototype, "XMLHttpRequest", [
        "open", "send", "setRequestHeader", "abort", "getResponseHeader",
        "getAllResponseHeaders", "overrideMimeType",
    ]);
    wrap(CET && CET.prototype, "EventTarget", [
        "addEventListener", "removeEventListener", "dispatchEvent",
    ]);
    wrap(CNav && CNav.prototype, "Navigator", [
        "userAgent", "platform", "vendor", "languages", "webdriver",
        "hardwareConcurrency", "deviceMemory", "plugins", "mimeTypes",
        "userAgentData", "connection",
    ]);

    // window 上的函数
    try {
        if (typeof W.getComputedStyle === "function") {
            var ogcs = W.getComputedStyle;
            W.getComputedStyle = nativeFn(function () {
                var a = argsText(arguments);
                var r;
                try { r = ogcs.apply(this, arguments); }
                catch (e) { log("X", "window.getComputedStyle", a, "THROW:" + (e && e.message)); throw e; }
                log("M", "window.getComputedStyle", a, r);
                return r;
            }, "getComputedStyle");
        }
    } catch (e) {}

    console.log("[DT] trace installed");
})();
