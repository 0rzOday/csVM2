window = this;
window.name="";
// 诊断：确定性 Math.random（固定种子 PRNG），用于跨运行/跨模式逐字节对比 P
try {
    if (typeof __CSVM_RAND_SEED !== "undefined") {
        var __rs = (Number(__CSVM_RAND_SEED) || 1) >>> 0;
        Math.random = csvm.safefunction(function random() {
            __rs = (__rs + 0x6D2B79F5) >>> 0;
            var t = __rs;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }, "random");
    }
    if (typeof __CSVM_FIXED_TIME !== "undefined") {
        var __ft = Number(__CSVM_FIXED_TIME) || 1794656000000;
        try { Date.now = csvm.safefunction(function now() { return __ft; }, "now"); } catch (e) {}
        try {
            var __RD = Date;
            var __FDate = function Date() {
                if (!arguments.length) return new __RD(__ft);
                return new (Function.prototype.bind.apply(__RD, [null].concat(Array.prototype.slice.call(arguments))))();
            };
            __FDate.now = Date.now;
            __FDate.parse = __RD.parse;
            __FDate.UTC = __RD.UTC;
            __FDate.prototype = __RD.prototype;
            csvm.safefunction(__FDate, "Date");
            window.Date = __FDate;
        } catch (e) {}
    }
} catch (e) {}
var Window = function Window() {
    throw new TypeError("Illegal constructor");
};
Object.defineProperty(Window.prototype, Symbol.toStringTag, {
    value: "Window",
    configurable: true
});
csvm.safefunction(Window, "Window");

// 真机：TEMPORARY / PERSISTENT 在 Window.prototype 上（不是 window 自有），
// data 描述符：writable:false、enumerable:true、configurable:false，值 0 / 1
Object.defineProperty(Window.prototype, "TEMPORARY", {
    value: 0, writable: false, enumerable: true, configurable: false
});
Object.defineProperty(Window.prototype, "PERSISTENT", {
    value: 1, writable: false, enumerable: true, configurable: false
});
////////////
// 属性 localStorage 等由自动导出脚本生成，
// 定时器：真机是异步任务队列，这里改成入队；页面脚本跑完后由宿主调用 csvm.runTimers 排空。
// 注意：不能同步执行回调——瑞数的后续步骤（删 enable_、重写 P）依赖 setTimeout(0) 的先后顺序。
csvm.memory.timers = csvm.memory.timers || { seq: 0, list: [] };
function __timerSchedule(fn, delay, args, interval) {
    var d = Number(delay) || 0;
    if (d < 0) d = 0;
    var id = ++csvm.memory.timers.seq;
    // Chrome 对 setTimeout 有最小钳制：0ms 约 1ms；setInterval 最小 4ms
    var realD = interval ? (d < 4 ? 4 : d) : (d > 0 ? d : 1);
    csvm.memory.timers.list.push({
        id: id,
        fn: fn,
        args: args || [],
        delay: d,
        due: Date.now() + realD,
        interval: interval ? d : 0,
    });
    return id;
}
window.setTimeout = {
    setTimeout(fn, delay) {
        return __timerSchedule(fn, delay, Array.prototype.slice.call(arguments, 2), false);
    }
}.setTimeout; csvm.safefunction(window.setTimeout);
Object.defineProperty(window.setTimeout, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
window.setInterval = {
    setInterval(fn, delay) {
        return __timerSchedule(fn, delay, Array.prototype.slice.call(arguments, 2), true);
    }
}.setInterval; csvm.safefunction(window.setInterval);
Object.defineProperty(window.setInterval, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
window.clearInterval = {
    clearInterval(id) {
        var list = csvm.memory.timers.list;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) { list.splice(i, 1); break; }
        }
    }
}.clearInterval; csvm.safefunction(window.clearInterval, "clearInterval");
Object.defineProperty(window.clearInterval, "length", {
    value: 0, writable: false, enumerable: false, configurable: true
});
window.clearTimeout = {
    clearTimeout(id) {
        var list = csvm.memory.timers.list;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) { list.splice(i, 1); break; }
        }
    }
}.clearTimeout; csvm.safefunction(window.clearTimeout, "clearTimeout");
Object.defineProperty(window.clearTimeout, "length", {
    value: 0, writable: false, enumerable: false, configurable: true
});

// crypto：真机是 Crypto 实例（own keys 为空，方法在原型上）
function Crypto() { throw new TypeError("Illegal constructor"); }
csvm.safefunction(Crypto, "Crypto");
Object.defineProperty(Crypto.prototype, Symbol.toStringTag, {
    value: "Crypto", configurable: true
});
Object.defineProperty(Crypto.prototype, "getRandomValues", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function getRandomValues(arr) {
        if (!arr || typeof arr.length !== "number") {
            throw new TypeError("Failed to execute 'getRandomValues' on 'Crypto': parameter 1 is not of type 'ArrayBufferView'.");
        }
        // 真机语义：填充的是类型数组的「底层字节」，而不是每个元素的数值。
        // 对 Uint8Array 二者等价；对 Uint16/Float64 等必须按字节填。
        try {
            if (arr.buffer && typeof arr.byteOffset === "number" && typeof arr.byteLength === "number") {
                var bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
                for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
                return arr;
            }
        } catch (e) {}
        for (var j = 0; j < arr.length; j++) {
            arr[j] = Math.floor(Math.random() * 256);
        }
        return arr;
    }, "getRandomValues")
});
Object.defineProperty(Crypto.prototype, "randomUUID", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function randomUUID() {
        function hex(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16); return s; }
        return hex(8) + "-" + hex(4) + "-4" + hex(3) + "-" + ((8 + Math.floor(Math.random() * 4)).toString(16)) + hex(3) + "-" + hex(12);
    }, "randomUUID")
});
var crypto = Object.create(Crypto.prototype);
window.crypto = csvm.proxy(crypto, "crypto");

// performance：真机是 Performance 实例；最小可用实现，now() 单调递增
csvm.memory.t0 = csvm.memory.t0 || Date.now();
var performance = {};
Object.defineProperty(performance, Symbol.toStringTag, { value: "Performance", configurable: true });
Object.defineProperty(performance, "timeOrigin", {
    configurable: true, enumerable: true,
    get: csvm.safefunction(function () { return csvm.memory.t0; }, "get timeOrigin")
});
performance.now = csvm.safefunction(function now() {
    if (typeof __CSVM_FIXED_TIME !== "undefined") return 1234.5;
    // 真机是高精度浮点（微秒级、非整数）。用毫秒整数 + 亚毫秒余量模拟。
    try {
        csvm.memory.pnFrac = ((csvm.memory.pnFrac || 0) + 0.137) % 1;
    } catch (e) {}
    return (Date.now() - csvm.memory.t0) + (csvm.memory.pnFrac || 0);
}, "now");
performance.getEntries = csvm.safefunction(function getEntries() { return []; }, "getEntries");
performance.getEntriesByType = csvm.safefunction(function getEntriesByType() { return []; }, "getEntriesByType");
performance.getEntriesByName = csvm.safefunction(function getEntriesByName() { return []; }, "getEntriesByName");
performance.mark = csvm.safefunction(function mark() {}, "mark");
performance.measure = csvm.safefunction(function measure() {}, "measure");
performance.clearMarks = csvm.safefunction(function clearMarks() {}, "clearMarks");
performance.clearMeasures = csvm.safefunction(function clearMeasures() {}, "clearMeasures");
performance.toJSON = csvm.safefunction(function toJSON() { return { timeOrigin: csvm.memory.t0 }; }, "toJSON");
// 真机 performance.constructor.name === "Performance"
function Performance() { throw new TypeError("Illegal constructor"); }
csvm.safefunction(Performance, "Performance");
Object.defineProperty(Performance.prototype, Symbol.toStringTag, { value: "Performance", configurable: true });
Object.defineProperty(Performance.prototype, "constructor", {
    value: Performance, writable: true, enumerable: false, configurable: true
});
try { performance.__proto__ = Performance.prototype; } catch (e) {}
Object.defineProperty(window, "Performance", {
    value: Performance, writable: true, enumerable: true, configurable: true
});
window.performance = csvm.proxy(performance, "performance");

// requestAnimationFrame / cancelAnimationFrame / queueMicrotask
// 瑞数会用它们做异步调度；缺失会导致回调顺序/分支与真机不同。
csvm.memory.t0 = csvm.memory.t0 || Date.now();
window.requestAnimationFrame = {
    requestAnimationFrame(cb) {
        if (typeof cb !== "function") {
            throw new TypeError("Failed to execute 'requestAnimationFrame' on 'Window': The callback provided as parameter 1 is not a function.");
        }
        return __timerSchedule(function () {
            cb(Date.now() - csvm.memory.t0);
        }, 16, [], false);
    }
}.requestAnimationFrame; csvm.safefunction(window.requestAnimationFrame, "requestAnimationFrame");
Object.defineProperty(window.requestAnimationFrame, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
window.cancelAnimationFrame = {
    cancelAnimationFrame(id) {
        var list = csvm.memory.timers.list;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) { list.splice(i, 1); break; }
        }
    }
}.cancelAnimationFrame; csvm.safefunction(window.cancelAnimationFrame, "cancelAnimationFrame");
Object.defineProperty(window.cancelAnimationFrame, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
window.queueMicrotask = {
    queueMicrotask(cb) {
        if (typeof cb !== "function") {
            throw new TypeError("Failed to execute 'queueMicrotask' on 'Window': The callback provided as parameter 1 is not a function.");
        }
        Promise.resolve().then(function () { cb(); });
    }
}.queueMicrotask; csvm.safefunction(window.queueMicrotask, "queueMicrotask");
Object.defineProperty(window.queueMicrotask, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});

// 宿主在页面脚本执行完后调用：按入队顺序执行 delay <= maxDelay 的 setTimeout 回调。
// interval 暂不执行，避免死循环；返回执行数量。
csvm.runTimers = function (maxCount, maxDelay) {
    var list = csvm.memory.timers.list;
    var limit = maxCount || 300;
    var maxD = maxDelay == null ? 100 : maxDelay;
    var ran = 0;
    for (var guard = 0; guard < limit; guard++) {
        var idx = -1;
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (t.delay > maxD) continue;
            if (t.due > Date.now()) continue;   // 还没到期，模拟浏览器事件循环
            idx = i;
            break;
        }
        if (idx === -1) break;
        var timer = list.splice(idx, 1)[0];
        try {
            if (typeof timer.fn === "function") timer.fn.apply(window, timer.args);
            else if (typeof timer.fn === "string") eval(timer.fn);
        } catch (e) {
            try { console.log("[TIMER-ERR] " + (e && e.message ? e.message : e)); } catch (_) {}
        }
        // setInterval：重新入队，下一次到期再执行
        if (timer.interval) {
            timer.due = Date.now() + (timer.interval < 4 ? 4 : timer.interval);
            list.push(timer);
        }
        // Chrome 在每个定时器任务结束后清空微任务；同步执行多个回调时要手动分界
        try { if (typeof csvm.flushMicrotasks === "function") csvm.flushMicrotasks(); } catch (_) {}
        ran++;
    }
    return ran;
};
window.fetch = {
    fetch(input) {
        // TODO: 真机 fetch 返回 Promise<Response>，这里先空实现
        debugger;
    }
}.fetch;
csvm.safefunction(window.fetch, "fetch");
// 真机 Chrome: fetch.length 是 1
Object.defineProperty(window.fetch, "length", {
    value: 1, writable: false, enumerable: false, configurable: true
});
// 谷歌浏览器特有：webkitRequestFileSystem(type, size, successCallback, errorCallback)
// 真机 length 3（errorCallback 可选），window 上是 enumerable:true 的 data 属性
window.webkitRequestFileSystem = {
    webkitRequestFileSystem(type, size, successCallback) {
        debugger;
    }
}.webkitRequestFileSystem;
csvm.safefunction(window.webkitRequestFileSystem, "webkitRequestFileSystem");
// 真机 window.chrome 是普通对象：own keys 只有 loadTimes / csi；
// chrome.runtime / webstore 都不存在；两个函数 name 为空、length 0。
function _chrome_loadTimes() {
    var now = Date.now() / 1000;
    return {
        requestTime: now - 0.5,
        startLoadTime: now - 0.4,
        commitLoadTime: now - 0.3,
        finishDocumentLoadTime: now - 0.1,
        finishLoadTime: now - 0.05,
        firstPaintTime: now - 0.2,
        firstPaintAfterLoadTime: 0,
        navigationType: "Other",
        wasFetchedViaSpdy: true,
        wasNpnNegotiated: true,
        npnNegotiatedProtocol: "h2",
        wasAlternateProtocolAvailable: false,
        connectionInfo: "h2"
    };
}
function _chrome_csi() {
    var now = Date.now() / 1000;
    return { startE: now - 0.5, onloadT: now, pageT: 0.5, tran: 15 };
}
[_chrome_loadTimes, _chrome_csi].forEach(function (fn) {
    Object.defineProperty(fn, "name", {
        value: "", writable: false, enumerable: false, configurable: true
    });
    csvm.safefunction(fn);
});

// chrome.app：真机 own keys = isInstalled, getDetails, getIsInstalled,
// installState, runningState, InstallState, RunningState（顺序一致）
var _chrome_app = {
    isInstalled: false,
    getDetails: function () { debugger; },
    getIsInstalled: function () { debugger; },
    installState: function () { debugger; },
    runningState: function () { debugger; },
    InstallState: { DISABLED: "disabled", INSTALLED: "installed", NOT_INSTALLED: "not_installed" },
    RunningState: { CANNOT_RUN: "cannot_run", READY_TO_RUN: "ready_to_run", RUNNING: "running" }
};
["getDetails", "getIsInstalled", "installState", "runningState"].forEach(function (k) {
    var fn = _chrome_app[k];
    Object.defineProperty(fn, "name", { value: k, writable: false, enumerable: false, configurable: true });
    csvm.safefunction(fn);
});

window.chrome = csvm.proxy({
    loadTimes: _chrome_loadTimes,
    csi: _chrome_csi,
    app: _chrome_app
}, "chrome");

// Notification：真机 typeof=function、length=1、permission="default"
function Notification(title) { debugger; }
csvm.safefunction(Notification, "Notification");
Object.defineProperty(Notification, "permission", {
    configurable: true,
    enumerable: true,
    get: csvm.safefunction(function () { return "default"; }, "get permission")
});
Object.defineProperty(Notification, "maxActions", {
    configurable: true,
    enumerable: true,
    writable: false,
    value: 2
});
Object.defineProperty(Notification, "requestPermission", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: csvm.safefunction(function () { return Promise.resolve("default"); }, "requestPermission")
});
Object.defineProperty(window, "Notification", {
    value: Notification, writable: true, enumerable: false, configurable: true
});

function DeviceOrientationEvent(type) { debugger; }
function DeviceMotionEvent(type) { debugger; }
csvm.safefunction(DeviceOrientationEvent, "DeviceOrientationEvent");
csvm.safefunction(DeviceMotionEvent, "DeviceMotionEvent");
Object.defineProperty(window, "DeviceOrientationEvent", {
    value: DeviceOrientationEvent, writable: true, enumerable: false, configurable: true
});
Object.defineProperty(window, "DeviceMotionEvent", {
    value: DeviceMotionEvent, writable: true, enumerable: false, configurable: true
});

// window.localStorage 由 Window.prototype 上的 getter 提供（自动导出脚本生成）
////////////
// 实例链：window → Window.prototype → WindowProperties.prototype → EventTarget.prototype → Object.prototype
window.__proto__ = Window.prototype;
Window.prototype.__proto__ = WindowProperties.prototype;

// Window 命名属性访问（真机 named properties 语义）：
//   window[name] / name in window → 文档树里 id 或 name 匹配的 HTML 元素。
// 挑战自检会用「创建 form → 设 id → append → window[id]」判断环境是否被篡改。
try {
    // 索引：id/name → element。按 csvm.memory.domRevision 失效（DOM 改动会 +1）。
    function __namedBuild(doc) {
        var byId = Object.create(null), byName = Object.create(null);
        var all = null;
        try { all = doc.getElementsByTagName ? doc.getElementsByTagName("*") : null; } catch (e) {}
        if (all) {
            for (var i = 0; i < all.length; i++) {
                var el = all[i];
                if (!el) continue;
                var rec = csvm.memory.domStore ? csvm.memory.domStore.get(el) : null;
                var id = "", nm = "", tag = "";
                if (rec && rec.data) {
                    id = rec.data.id == null ? "" : String(rec.data.id);
                    nm = rec.data.name == null ? "" : String(rec.data.name);
                    tag = String(rec.tag || "").toUpperCase();
                } else {
                    // 兜底：非 DOM 记录对象（带属性的普通对象），只读一次，调用方已抑制日志
                    try {
                        id = el.id || "";
                        nm = el.getAttribute ? (el.getAttribute("name") || "") : "";
                        tag = String(el.tagName || "").toUpperCase();
                    } catch (e2) {}
                }
                if (id && !(id in byId)) byId[id] = el;
                // name 只在 img/form/iframe/embed/object 上参与窗口命名访问
                if (nm && !(nm in byName) &&
                    (tag === "IMG" || tag === "FORM" || tag === "IFRAME" || tag === "EMBED" || tag === "OBJECT")) {
                    byName[nm] = el;
                }
            }
        }
        return { v: csvm.memory.domRevision || 0, byId: byId, byName: byName };
    }
    function __namedInDoc(el, doc) {
        try {
            if (!doc) return false;
            var cur = el, guard = 0;
            while (cur && guard++ < 10000) {
                if (cur === doc) return true;
                var r = csvm.memory.domStore ? csvm.memory.domStore.get(cur) : null;
                if (!r || !r.parent) return false;
                cur = r.parent;
            }
            return false;
        } catch (e) { return true; }
    }
    function __namedValid(el, name, doc) {
        try {
            // 必须仍在文档里（移除后缓存不能命中）
            if (!__namedInDoc(el, doc)) return false;
            var rec = csvm.memory.domStore ? csvm.memory.domStore.get(el) : null;
            if (rec && rec.data) {
                if (String(rec.data.id || "") === name) return true;
                if (String(rec.data.name || "") === name) {
                    var tag = String(rec.tag || "").toUpperCase();
                    return tag === "IMG" || tag === "FORM" || tag === "IFRAME" || tag === "EMBED" || tag === "OBJECT";
                }
                return false;
            }
            if (String(el.id || "") === name) return true;
            if (el.getAttribute && String(el.getAttribute("name") || "") === name) return true;
            return false;
        } catch (e) { return false; }
    }
    csvm.memory.windowNamedGet = function (name) {
        // 解析器内部的 DOM 调用属于框架自身，不产生代理日志
        var __prevSuppress = csvm.memory.suppressLog;
        csvm.memory.suppressLog = true;
        try {
            if (typeof name !== "string" || !name) return undefined;
            var doc = (typeof document !== "undefined" && document) ? document : null;
            if (!doc) return undefined;
            var c = csvm.memory.__namedCache;
            var v = csvm.memory.domRevision || 0;
            if (!c || c.v !== v) {
                c = __namedBuild(doc);
                csvm.memory.__namedCache = c;
            }
            var el = c.byId[name] || c.byName[name];
            if (el && __namedValid(el, name, doc)) return el;
            // 命中失效（改名/移除）：重建一次
            c = __namedBuild(doc);
            csvm.memory.__namedCache = c;
            el = c.byId[name] || c.byName[name];
            if (el && __namedValid(el, name, doc)) return el;
            // 诊断：未命中时打印当前文档 id/name（默认关）
            try {
                if (typeof __CSVM_NAMED_TRACE !== "undefined" && __CSVM_NAMED_TRACE) {
                    var list2 = doc.getElementsByTagName ? doc.getElementsByTagName("*") : [], desc = [];
                    for (var q = 0; q < list2.length && q < 60; q++) {
                        var el2 = list2[q];
                        desc.push(String(el2.tagName || "?") + "#" + (el2.id || "") + "@" + (el2.getAttribute ? (el2.getAttribute("name") || "") : ""));
                    }
                    console.log("[NAMED-MISS] " + name + " tree=" + desc.join("|"));
                }
            } catch (e3) {}
            return undefined;
        } catch (e) { return undefined; }
        finally { csvm.memory.suppressLog = __prevSuppress; }
    };
} catch (e) {}

// 调试代理（csvm.memory.config.useProxy 为 false 时原样返回）
window = csvm.proxy(window, "window");
Window = csvm.proxy(Window, "Window");

// 顶层窗口身份（真机描述符）：
//   top / window      : own accessor，get-only，enumerable:true，configurable:false
//   self / parent/frames: own accessor，get+set，enumerable:true，configurable:true
// 值都指向 window 自身。
// 注意：vm2 的全局 getter receiver 不是 window 本身，brand check 留到 ISSUE-002 统一处理。
// getter 必须闭包引用 window_ref：window 标识符本身随后会变成这个 accessor，
// 在 getter 里再读 window 会无限递归。
var window_ref = window;
function _define_window_identity(name, withSetter, configurable) {
    var getter = csvm.safefunction(function () {
        return window_ref;
    }, "get " + name);

    var descriptor = {
        get: getter,
        enumerable: true,
        configurable: configurable
    };

    if (withSetter) {
        // 真机这几个是 [Replaceable]：赋值会把 accessor 换成 data 属性
        descriptor.set = csvm.safefunction(function (value) {
            Object.defineProperty(window, name, {
                value: value,
                writable: true,
                enumerable: true,
                configurable: true
            });
        }, "set " + name);
    }

    Object.defineProperty(window, name, descriptor);
}
_define_window_identity("top", false, false);
_define_window_identity("window", false, false);
_define_window_identity("self", true, true);
_define_window_identity("parent", true, true);
_define_window_identity("frames", true, true);

// 真机 window === globalThis。vm2 的 globalThis 原本指向真实全局对象，
// 而 window 是代理；把 globalThis 属性值指回同一个代理，标识符解析就一致了。
Object.defineProperty(window_ref, "globalThis", {
    value: window_ref,
    writable: true,
    enumerable: false,
    configurable: true,
});

// 真机：https 下 window.isSecureContext 为 true（挑战会把它放进指纹）
try {
    Object.defineProperty(window_ref, "isSecureContext", {
        configurable: true,
        enumerable: true,
        get: csvm.safefunction(function () { return true; }, "get isSecureContext"),
        set: undefined,
    });
} catch (e) {}

// ---------- BarProp / 六个窗口栏 ----------
var BarProp = function BarProp() { throw new TypeError("Illegal constructor"); };
csvm.safefunction(BarProp, "BarProp");
Object.defineProperty(BarProp.prototype, "visible", {
    configurable: true,
    enumerable: true,
    get: csvm.safefunction(function () { return true; }, "get visible"),
    set: undefined,
});
Object.defineProperty(BarProp.prototype, "constructor", {
    value: BarProp,
    writable: true,
    enumerable: false,
    configurable: true,
});
try { Object.defineProperty(BarProp.prototype, Symbol.toStringTag, { value: "BarProp", configurable: true }); } catch (e) {}

["locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar"].forEach(function (name) {
    var bar = Object.create(BarProp.prototype);
    Object.defineProperty(window_ref, name, {
        configurable: true,
        enumerable: true,
        get: csvm.safefunction(function () { return bar; }, "get " + name),
        set: csvm.safefunction(function (value) {
            Object.defineProperty(window_ref, name, {
                value: value,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }, "set " + name),
    });
});

// 固定窗口尺寸 / 位置（匹配 Playwright Chrome 默认窗口 1280x720）
// 配套 screen：width 1280 / height 720 / availWidth 1280 / availHeight 720
// 真机描述符：window 实例自有 accessor，get+set，enumerable:true，configurable:true
csvm.memory.windowMetrics = {
    innerWidth: 1280,
    innerHeight: 720,
    outerWidth: 1296,
    outerHeight: 808,
    devicePixelRatio: 1.0000000298023224,
    screenX: 10,
    screenY: 10,
    scrollX: 0,
    scrollY: 0
};

function _define_window_metric(name, key) {
    key = key || name;
    Object.defineProperty(window, name, {
        get: csvm.safefunction(function () {
            return csvm.memory.windowMetrics[key];
        }, "get " + name),
        set: csvm.safefunction(function (value) {
            csvm.memory.windowMetrics[key] = value;
        }, "set " + name),
        enumerable: true,
        configurable: true
    });
}
_define_window_metric("innerWidth");
_define_window_metric("innerHeight");
_define_window_metric("outerWidth");
_define_window_metric("outerHeight");
_define_window_metric("devicePixelRatio");
_define_window_metric("screenX");
_define_window_metric("screenY");
_define_window_metric("scrollX");
_define_window_metric("scrollY");
// 别名跟随对应主属性
_define_window_metric("screenLeft", "screenX");
_define_window_metric("screenTop", "screenY");
_define_window_metric("pageXOffset", "scrollX");
_define_window_metric("pageYOffset", "scrollY");

// clientInformation 真机是 window 上返回 navigator 的 accessor
Object.defineProperty(window, "clientInformation", {
    get: csvm.safefunction(function () {
        return window_ref.navigator;
    }, "get clientInformation"),
    set: csvm.safefunction(function (value) {
        // 真机是 accessor；这里固定返回 navigator
    }, "set clientInformation"),
    enumerable: true,
    configurable: true
});

// 真机默认 locale 是 zh-CN；vm2/Node 默认可能是 zh-SG，会进 Intl 指纹，强制对齐
(function () {
    try {
        if (typeof Intl !== "undefined") {
            var wrapIntl = function (name) {
                var Orig = Intl[name];
                if (typeof Orig !== "function") return;
                Intl[name] = new Proxy(Orig, {
                    construct: function (t, args, nt) {
                        if (!args || !args.length || args[0] === undefined) args = ["zh-CN"];
                        return Reflect.construct(t, args, nt);
                    },
                    apply: function (t, th, args) {
                        if (!args || !args.length || args[0] === undefined) args = ["zh-CN"];
                        return Reflect.apply(t, th, args);
                    },
                });
            };
            wrapIntl("DateTimeFormat");
            wrapIntl("NumberFormat");
            wrapIntl("Collator");
        }
        ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"].forEach(function (m) {
            var orig = Date.prototype[m];
            Date.prototype[m] = new Proxy(orig, {
                apply: function (t, th, args) {
                    if (!args || !args.length || args[0] === undefined) args = ["zh-CN"];
                    return Reflect.apply(t, th, args);
                },
            });
        });
        if (typeof Number !== "undefined" && Number.prototype.toLocaleString) {
            var origNum = Number.prototype.toLocaleString;
            Number.prototype.toLocaleString = new Proxy(origNum, {
                apply: function (t, th, args) {
                    if (!args || !args.length || args[0] === undefined) args = ["zh-CN"];
                    return Reflect.apply(t, th, args);
                },
            });
        }
    } catch (e) {}
})();



// 缺失的标准 window 属性（对齐真机）
(function () {
    function __def(name, value, enumerable) {
        Object.defineProperty(window, name, {
            value: value, writable: true, enumerable: !!enumerable, configurable: true
        });
    }
    function __defAcc(name, getter, setter, enumerable) {
        Object.defineProperty(window, name, {
            configurable: true,
            enumerable: !!enumerable,
            get: csvm.safefunction(getter, "get " + name),
            set: setter ? csvm.safefunction(setter, "set " + name) : undefined
        });
    }
    __defAcc("opener", function () { return null; }, function () {}, true);
    __defAcc("frameElement", function () { return null; }, null, true);
    __defAcc("closed", function () { return false; }, null, true);
    __defAcc("length", function () { return 0; }, function () {}, true);
    (function () {
        var storedName = "";
        try { storedName = window.name || ""; } catch (e) {}
        __defAcc("name", function () { return storedName; }, function (v) { storedName = String(v); }, true);
    })();

    function MediaQueryList(media, matches) {
        this.media = media;
        this.matches = matches;
        this.onchange = null;
        this._listeners = [];
    }
    MediaQueryList.prototype.addEventListener = function (type, fn) {
        if (type === "change" && typeof fn === "function") this._listeners.push(fn);
    };
    MediaQueryList.prototype.removeEventListener = function (type, fn) {
        if (type !== "change") return;
        var i = this._listeners.indexOf(fn);
        if (i !== -1) this._listeners.splice(i, 1);
    };
    MediaQueryList.prototype.addListener = MediaQueryList.prototype.addEventListener;
    MediaQueryList.prototype.removeListener = MediaQueryList.prototype.removeEventListener;
    MediaQueryList.prototype.dispatchEvent = function () { return true; };
    csvm.safefunction(MediaQueryList, "MediaQueryList");
    Object.defineProperty(MediaQueryList.prototype, Symbol.toStringTag, {
        value: "MediaQueryList", configurable: true
    });
    Object.defineProperty(MediaQueryList.prototype, "constructor", {
        value: MediaQueryList, writable: true, enumerable: false, configurable: true
    });

    var __mmCache = Object.create(null);
    window.matchMedia = {
        matchMedia(media) {
            var q = String(media).replace(/\s+/g, "").toLowerCase();
            if (!__mmCache[q]) {
                var m = false;
                if (q.indexOf("prefers-color-scheme:light") !== -1) m = true;
                else if (q.indexOf("prefers-color-scheme:dark") !== -1) m = false;
                else if (q.indexOf("prefers-reduced-motion:reduce") !== -1) m = false;
                else if (q.indexOf("any-pointer:fine") !== -1) m = true;
                else if (q.indexOf("pointer:fine") !== -1) m = true;
                else if (q.indexOf("hover:hover") !== -1) m = true;
                __mmCache[q] = new MediaQueryList(String(media), m);
            }
            return __mmCache[q];
        }
    }.matchMedia;
    csvm.safefunction(window.matchMedia, "matchMedia");
    Object.defineProperty(window.matchMedia, "length", {
        value: 1, writable: false, enumerable: false, configurable: true
    });
    Object.defineProperty(window, "MediaQueryList", {
        value: MediaQueryList, writable: true, enumerable: true, configurable: true
    });
})();
