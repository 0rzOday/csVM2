// EventTarget：事件相关接口的根原型
var EventTarget = function EventTarget() {

};


/* #region AUTO:EventTarget.prototype */
(function () {
    // --- 生成代码公共辅助 ---------------------------------------------------
    const __autoHit = new Set();

    // 加载时抓一份原生 apply。目标之后改 Function.prototype.apply / Reflect.apply，
    // 也影响不到包装层，免得它看到框架内部的调用
    const __autoApply = Reflect.apply;

    // 事件监听器存储：target -> { type -> [{listener, once}] }
    function __listenerStore() {
        if (!csvm.memory.eventListeners) csvm.memory.eventListeners = new WeakMap();
        return csvm.memory.eventListeners;
    }
    function __getRec(target) {
        const store = __listenerStore();
        let rec = store.get(target);
        if (!rec) {
            rec = Object.create(null);
            store.set(target, rec);
        }
        return rec;
    }
    function __invoke(rec, type, target, event) {
        const arr = rec[type];
        if (!arr || !arr.length) return 0;
        const copy = arr.slice();
        for (let i = 0; i < copy.length; i++) {
            const item = copy[i];
            if (item.once) {
                const idx = arr.indexOf(item);
                if (idx !== -1) arr.splice(idx, 1);
            }
            try {
                if (typeof item.listener === "function") item.listener.call(target, event);
                else if (item.listener && typeof item.listener.handleEvent === "function") item.listener.handleEvent(event);
            } catch (e) {
                try { console.log("[LISTENER-ERR] " + (e && e.message ? e.message : e)); } catch (_) {}
            }
        }
        return copy.length;
    }

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
    // addEventListener
    Object.defineProperty(EventTarget.prototype, "addEventListener", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("addEventListener", 2, function (type, listener, options) {
            if (!listener) return;
            const rec = __getRec(this);
            const key = String(type);
            let arr = rec[key];
            if (!arr) arr = rec[key] = [];
            const capture = options === true || !!(options && typeof options === "object" && options.capture);
            const once = !!(options && typeof options === "object" && options.once);
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].listener === listener && !!arr[i].capture === capture) return;
            }
            arr.push({ listener: listener, once: once, capture: capture });
        }),
    });
    // 按阶段调用某个节点上的监听器。captureOnly：true=只调捕获，false=只调冒泡，null=都调。
    function __invokePhase(node, key, event, captureOnly) {
        const rec = __getRec(node);
        const arr = rec[key];
        if (!arr || !arr.length) return 0;
        const copy = arr.slice();
        let n = 0;
        for (let i = 0; i < copy.length; i++) {
            const item = copy[i];
            if (captureOnly === true && !item.capture) continue;
            if (captureOnly === false && item.capture) continue;
            if (item.once) {
                const idx = arr.indexOf(item);
                if (idx !== -1) arr.splice(idx, 1);
            }
            try {
                if (typeof item.listener === "function") item.listener.call(node, event);
                else if (item.listener && typeof item.listener.handleEvent === "function") item.listener.handleEvent(event);
            } catch (e) {
                try { console.log("[LISTENER-ERR] " + (e && e.message ? e.message : e)); } catch (_) {}
            }
            n++;
            const st = (typeof __evState !== "undefined") ? __evState.get(event) : null;
            if (st ? st.stoppedImmediate : event.__stoppedImmediate) break;
        }
        return n;
    }
    // dispatchEvent：捕获 → 目标 → 冒泡
    Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("dispatchEvent", 1, function (event) {
            const key = String(event && event.type);
            const state = (typeof __evState !== "undefined") ? __evState.get(event) : null;
            const stopped = function () { return state ? !!state.stopped : !!event.__stopped; };
            const setPhase = function (v) { try { if (state) state.eventPhase = v; else event.eventPhase = v; } catch (e) {} };
            const setCur = function (v) { try { if (state) state.currentTarget = v; else event.currentTarget = v; } catch (e) {} };
            try {
                if (state) { if (!state.target) state.target = this; }
                else { event.target = event.target || this; }
            } catch (e) {}
            // 构建传播路径：target → … → 根
            const path = [this];
            let node = this;
            while (node) {
                const d = csvm.memory.domStore ? csvm.memory.domStore.get(node) : null;
                node = d && d.parent ? d.parent : null;
                if (node) path.push(node);
            }
            const bubbles = state ? !!state.bubbles : !!event.bubbles;
            // 捕获阶段：根 → target 的父节点
            for (let i = path.length - 1; i >= 1; i--) {
                if (stopped()) break;
                setPhase(1); setCur(path[i]);
                __invokePhase(path[i], key, event, true);
            }
            // 目标阶段：注册顺序（捕获/冒泡监听器都触发）
            if (!stopped()) {
                setPhase(2); setCur(this);
                __invokePhase(this, key, event, null);
            }
            // 冒泡阶段：父节点 → 根
            if (bubbles) {
                for (let j = 1; j < path.length && !stopped(); j++) {
                    setPhase(3); setCur(path[j]);
                    __invokePhase(path[j], key, event, false);
                }
            }
            setPhase(0); setCur(null);
            const prevented = state ? !!state.defaultPrevented : !!event.defaultPrevented;
            return !prevented;
        }),
    });
    // removeEventListener
    Object.defineProperty(EventTarget.prototype, "removeEventListener", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeEventListener", 2, function (type, listener) {
            const rec = __getRec(this);
            const arr = rec[String(type)];
            if (!arr) return;
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].listener === listener) { arr.splice(i, 1); return; }
            }
        }),
    });

    // 框架内部用：向 target 派发一个简单事件（load / DOMContentLoaded 等）
    csvm.fireEvent = function (target, type) {
        const key = String(type);
        const rec = __getRec(target);
        const ev = {
            type: key,
            target: target,
            currentTarget: target,
            bubbles: false,
            cancelable: false,
            defaultPrevented: false,
            preventDefault: function () { this.defaultPrevented = true; },
            stopPropagation: function () {},
            stopImmediatePropagation: function () {},
        };
        let n = __invoke(rec, key, target, ev);
        try {
            const h = target["on" + key];
            if (typeof h === "function") { h.call(target, ev); n++; }
        } catch (e) {}
        // 事件派发是一个独立任务，结束后清空微任务
        try { if (typeof csvm.flushMicrotasks === "function") csvm.flushMicrotasks(); } catch (_) {}
        return n;
    };
    // when
    Object.defineProperty(EventTarget.prototype, "when", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("when", 1),
    });
    // TODO constructor: EventTarget.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(EventTarget.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "EventTarget",
    });
})();
/* #endregion AUTO:EventTarget.prototype */


Object.defineProperty(EventTarget.prototype, Symbol.toStringTag, {
    value: "EventTarget",
    configurable: true
});

csvm.safefunction(EventTarget, "EventTarget");
// 调试代理（csvm.memory.config.useProxy 为 false 时原样返回）
EventTarget = csvm.proxy(EventTarget, "EventTarget");

// ---------- Event / CustomEvent / UIEvent / ... ----------
// 真机：事件属性都在原型上（实例自有键只有 isTrusted），并且有一整套事件子类。
// 手写 DOM 之前把属性挂在实例自有键上、且只有 Event/CustomEvent，品牌与属性面都对不上。
var __evState = new WeakMap();
function __evS(e) { return __evState.get(e) || {}; }
function __evAccessor(name, get, set) {
    var d = { configurable: true, enumerable: true };
    d.get = { ["get " + name]() { return get.call(this); } }["get " + name];
    try { csvm.safefunction(d.get, "get " + name); } catch (e) {}
    if (set) {
        d.set = { ["set " + name](v) { return set.call(this, v); } }["set " + name];
        try { csvm.safefunction(d.set, "set " + name); } catch (e) {}
    }
    return d;
}
function __defEv(proto, name, get, set) {
    try { Object.defineProperty(proto, name, __evAccessor(name, get, set)); } catch (e) {}
}

var Event = function Event(type, init) {
    if (!(this instanceof Event)) {
        throw new TypeError("Failed to construct 'Event': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
    }
    var o = init || {};
    __evState.set(this, {
        type: type === undefined ? "" : String(type),
        bubbles: !!o.bubbles, cancelable: !!o.cancelable, composed: !!o.composed,
        target: null, currentTarget: null, eventPhase: 0,
        defaultPrevented: false, timeStamp: Date.now(),
        returnValue: true, cancelBubble: false,
        stopped: false, stoppedImmediate: false, init: o,
    });
    try {
        Object.defineProperty(this, "isTrusted", {
            value: false, writable: false, enumerable: true, configurable: true,
        });
    } catch (e) {}
};
Event.prototype = Object.create(Object.prototype);
Object.defineProperty(Event.prototype, "constructor", { value: Event, writable: true, configurable: true });
Object.defineProperty(Event.prototype, Symbol.toStringTag, { value: "Event", configurable: true });

__defEv(Event.prototype, "type", function () { return __evS(this).type; });
__defEv(Event.prototype, "target", function () { return __evS(this).target; },
    function (v) { var s = __evS(this); if (s) s.target = v; });
__defEv(Event.prototype, "currentTarget", function () { return __evS(this).currentTarget; },
    function (v) { var s = __evS(this); if (s) s.currentTarget = v; });
__defEv(Event.prototype, "srcElement", function () { return __evS(this).target; });
__defEv(Event.prototype, "eventPhase", function () { return __evS(this).eventPhase || 0; },
    function (v) { var s = __evS(this); if (s) s.eventPhase = Number(v) || 0; });
__defEv(Event.prototype, "bubbles", function () { return !!__evS(this).bubbles; });
__defEv(Event.prototype, "cancelable", function () { return !!__evS(this).cancelable; });
__defEv(Event.prototype, "defaultPrevented", function () { return !!__evS(this).defaultPrevented; });
__defEv(Event.prototype, "composed", function () { return !!__evS(this).composed; });
__defEv(Event.prototype, "timeStamp", function () { return __evS(this).timeStamp || 0; });
__defEv(Event.prototype, "returnValue",
    function () { var s = __evS(this); return s.returnValue !== false; },
    function (v) { var s = __evS(this); if (s) { s.returnValue = !!v; if (!v) s.defaultPrevented = true; } });
__defEv(Event.prototype, "cancelBubble",
    function () { return !!__evS(this).cancelBubble; },
    function (v) { var s = __evS(this); if (s) { s.cancelBubble = !!v; if (v) s.stopped = true; } });

[["NONE", 0], ["CAPTURING_PHASE", 1], ["AT_TARGET", 2], ["BUBBLING_PHASE", 3]].forEach(function (p) {
    try { Object.defineProperty(Event, p[0], { value: p[1], configurable: false, enumerable: true }); } catch (e) {}
    try { Object.defineProperty(Event.prototype, p[0], { value: p[1], configurable: true, enumerable: true }); } catch (e) {}
});

Event.prototype.preventDefault = {
    preventDefault() {
        var s = __evS(this);
        if (s && s.cancelable) { s.defaultPrevented = true; s.returnValue = false; }
    }
}.preventDefault;
Event.prototype.stopPropagation = {
    stopPropagation() { var s = __evS(this); if (s) s.stopped = true; }
}.stopPropagation;
Event.prototype.stopImmediatePropagation = {
    stopImmediatePropagation() { var s = __evS(this); if (s) { s.stopped = true; s.stoppedImmediate = true; } }
}.stopImmediatePropagation;
Event.prototype.composedPath = {
    composedPath() { return []; }
}.composedPath;
Event.prototype.initEvent = {
    initEvent(type, bubbles, cancelable) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to execute 'initEvent' on 'Event': 1 argument required, but only 0 present.");
        }
        var s = __evS(this);
        if (!s) return;
        s.type = String(type); s.bubbles = !!bubbles; s.cancelable = !!cancelable;
    }
}.initEvent;
["preventDefault", "stopPropagation", "stopImmediatePropagation", "composedPath", "initEvent"]
    .forEach(function (n) { try { csvm.safefunction(Event.prototype[n], n); } catch (e) {} });
csvm.safefunction(Event, "Event");
Event = csvm.proxy(Event, "Event");

// 事件子类：原型链 + 常见字段 getter（值取 init，缺省用默认值）
function __makeEventSub(name, base, fields) {
    var C = function (type, init) {
        if (!(this instanceof C)) {
            throw new TypeError("Failed to construct '" + name + "': Please use the 'new' operator.");
        }
        base.call(this, type, init);
    };
    C.prototype = Object.create(base.prototype);
    Object.defineProperty(C.prototype, "constructor", { value: C, writable: true, configurable: true });
    Object.defineProperty(C.prototype, Symbol.toStringTag, { value: name, configurable: true });
    try { Object.defineProperty(C, "name", { value: name, configurable: true }); } catch (e) {}
    Object.keys(fields || {}).forEach(function (f) {
        __defEv(C.prototype, f, function () {
            var s = __evS(this) || {};
            var o = s.init || {};
            return o[f] !== undefined ? o[f] : fields[f];
        });
    });
    try { csvm.safefunction(C, name); } catch (e) {}
    return csvm.proxy(C, name);
}

var CustomEvent = __makeEventSub("CustomEvent", Event, { detail: null });
var UIEvent = __makeEventSub("UIEvent", Event, { view: null, detail: 0, which: 0 });
var MouseEvent = __makeEventSub("MouseEvent", UIEvent, {
    screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0,
    ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
    button: 0, buttons: 0, relatedTarget: null, movementX: 0, movementY: 0,
});
var PointerEvent = __makeEventSub("PointerEvent", MouseEvent, {
    pointerId: 0, pointerType: "", isPrimary: false, pressure: 0, width: 1, height: 1,
});
var WheelEvent = __makeEventSub("WheelEvent", MouseEvent, { deltaX: 0, deltaY: 0, deltaZ: 0, deltaMode: 0 });
var KeyboardEvent = __makeEventSub("KeyboardEvent", UIEvent, {
    key: "", code: "", keyCode: 0, charCode: 0, location: 0,
    ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
    repeat: false, isComposing: false, which: 0,
});
var FocusEvent = __makeEventSub("FocusEvent", UIEvent, { relatedTarget: null });
var InputEvent = __makeEventSub("InputEvent", UIEvent, { data: null, inputType: "", isComposing: false });
var CompositionEvent = __makeEventSub("CompositionEvent", UIEvent, { data: "" });
var TouchEvent = __makeEventSub("TouchEvent", UIEvent, {
    touches: [], targetTouches: [], changedTouches: [],
    ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
});
var DragEvent = __makeEventSub("DragEvent", MouseEvent, { dataTransfer: null });
var ProgressEvent = __makeEventSub("ProgressEvent", Event, { lengthComputable: false, loaded: 0, total: 0 });
var SubmitEvent = __makeEventSub("SubmitEvent", Event, { submitter: null });
var ErrorEvent = __makeEventSub("ErrorEvent", Event, { message: "", filename: "", lineno: 0, colno: 0, error: null });
var MessageEvent = __makeEventSub("MessageEvent", Event, { data: null, origin: "", lastEventId: "", source: null, ports: [] });
var StorageEvent = __makeEventSub("StorageEvent", Event, { key: null, oldValue: null, newValue: null, url: "", storageArea: null });
var HashChangeEvent = __makeEventSub("HashChangeEvent", Event, { oldURL: "", newURL: "" });
var PopStateEvent = __makeEventSub("PopStateEvent", Event, { state: null });
var BeforeUnloadEvent = __makeEventSub("BeforeUnloadEvent", Event, {});
var PageTransitionEvent = __makeEventSub("PageTransitionEvent", Event, { persisted: false });
var TextEvent = __makeEventSub("TextEvent", Event, { data: "" });
var TransitionEvent = __makeEventSub("TransitionEvent", Event, { propertyName: "", elapsedTime: 0, pseudoElement: "" });
