var MutationObserver = function MutationObserver(callback) {
    if (typeof callback !== "function") {
        throw new TypeError("Failed to construct 'MutationObserver': The callback provided as parameter 1 is not a function.");
    }
    this._callback = callback;
    this._targets = [];
    this._records = [];
    this._scheduled = false;
};
csvm.safefunction(MutationObserver, "MutationObserver");

// ── MutationRecord / NodeList ───────────────────────────────────────────
// 真机 record 是 MutationRecord 实例（原型上的 getter、无自有键），
// addedNodes/removedNodes 是 NodeList。手写 DOM 之前直接传普通对象/数组，
// 挑战的 brand 检查（instanceof MutationRecord / [object MutationRecord]）会识破。
var __mrState = new WeakMap();
var MutationRecord = function MutationRecord(type, target, addedNodes, removedNodes, previousSibling, nextSibling, attributeName, attributeNamespace, oldValue) {
    if (!(this instanceof MutationRecord)) throw new TypeError("Illegal constructor");
    __mrState.set(this, {
        type: type, target: target,
        addedNodes: addedNodes || null, removedNodes: removedNodes || null,
        previousSibling: previousSibling || null, nextSibling: nextSibling || null,
        attributeName: attributeName || null, attributeNamespace: attributeNamespace || null,
        oldValue: oldValue === undefined ? null : oldValue,
    });
};
csvm.safefunction(MutationRecord, "MutationRecord");
Object.defineProperty(MutationRecord.prototype, Symbol.toStringTag, { value: "MutationRecord", configurable: true });
["type", "target", "addedNodes", "removedNodes", "previousSibling", "nextSibling",
 "attributeName", "attributeNamespace", "oldValue"].forEach(function (k) {
    Object.defineProperty(MutationRecord.prototype, k, {
        configurable: true, enumerable: true,
        get: function () { var s = __mrState.get(this); return s ? s[k] : null; },
    });
});



function __toMutationRecord(r) {
    if (!r || r instanceof MutationRecord) return r;
    return new MutationRecord(
        r.type, r.target,
        csvm.makeNodeList(r.addedNodes || []), csvm.makeNodeList(r.removedNodes || []),
        r.previousSibling || null, r.nextSibling || null,
        r.attributeName || null, r.attributeNamespace || null,
        r.oldValue === undefined ? null : r.oldValue
    );
}

// DOM 改动后由 Node/Element 调用：把记录分发给匹配的 observer，微任务里触发回调
csvm.moNotify = function (target, record) {
    // 所有通过 moNotify 通知的改动（append/remove/setAttribute/style…）都算一次 DOM 变更
    try { if (csvm.markDomChanged) csvm.markDomChanged(); } catch (e) {}
    record = __toMutationRecord(record);
    var list = csvm.memory.mo;
    if (!list || !list.length) return;
    var __log = csvm.memory.config && csvm.memory.config.moLog;
    for (var i = 0; i < list.length; i++) {
        var mo = list[i];
        var matched = false;
        for (var j = 0; j < mo._targets.length; j++) {
            var t = mo._targets[j], opts = t.options || {};
            if (t.target === target) { matched = true; break; }
            if (opts.subtree && target && csvm.memory.domStore) {
                var p = csvm.memory.domStore.get(target);
                while (p && p.parent) {
                    if (p.parent === t.target) { matched = true; break; }
                    p = csvm.memory.domStore.get(p.parent);
                }
                if (matched) break;
            }
        }
        if (__log) { try { console.log("[MO] notify type=" + (record && record.type) + " attr=" + (record && record.attributeName) + " matched=" + matched + " observers=" + list.length); } catch (e) {} }
        if (!matched) continue;
        mo._records.push(record);
        if (!mo._scheduled) {
            mo._scheduled = true;
            Promise.resolve().then(function () {
                mo._scheduled = false;
                var recs = mo._records;
                if (!recs.length) return;
                mo._records = [];
                if (__log) {
                    try {
                        var __d = recs.map(function (r) {
                            var tag = "-";
                            try { tag = (r.target && r.target.tagName) || (r.target && r.target.nodeName) || "-"; } catch (e) {}
                            var an = Array.prototype.slice.call(r.addedNodes || []).map(function (n) { try { return (n.tagName || n.nodeName) + "[" + (n.getAttribute ? Array.prototype.slice.call(n.attributes || []).map(function(a){return a.name;}).join(",") : "") + "]"; } catch (e) { return "?"; } });
                            return r.type + ":" + tag + (r.attributeName ? "." + r.attributeName : "") + "{add:" + an.join("|") + "}";
                        });
                        console.log("[MO] callback n=" + recs.length + " thisIsObserver=" + (mo && typeof mo.observe === "function") + " :: " + __d.join(" ; "));
                    } catch (e) {}
                }
                try { mo._callback.call(mo, recs, mo); }
                catch (e) { if (__log) { try { console.log("[MO] callback THREW: " + (e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : String(e))); } catch (_) {} } }
            });
        }
    }
};

/* #region AUTO:MutationObserver.prototype */
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
    // disconnect
    Object.defineProperty(MutationObserver.prototype, "disconnect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("disconnect", 0, function () {
            this._targets = [];
            this._records = [];
        }),
    });
    // observe
    Object.defineProperty(MutationObserver.prototype, "observe", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("observe", 2, function (target, options) {
            if (!target) {
                throw new TypeError("Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.");
            }
            var opts = options || {};
            var list = csvm.memory.mo || (csvm.memory.mo = []);
            for (var i = 0; i < this._targets.length; i++) {
                if (this._targets[i].target === target) { this._targets[i].options = opts; return; }
            }
            this._targets.push({ target: target, options: opts });
            if (list.indexOf(this) === -1) list.push(this);
            if (csvm.memory.config && csvm.memory.config.moLog) {
                try { console.log("[MO] observe target=" + (target && target.tagName) + " subtree=" + !!opts.subtree + " childList=" + !!opts.childList + " attrs=" + !!opts.attributes + " charData=" + !!opts.characterData); } catch (e) {}
            }
        }),
    });
    // takeRecords
    Object.defineProperty(MutationObserver.prototype, "takeRecords", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("takeRecords", 0, function () {
            var r = this._records;
            this._records = [];
            return r;
        }),
    });
    // TODO constructor: MutationObserver.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(MutationObserver.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "MutationObserver",
    });
})();
/* #endregion AUTO:MutationObserver.prototype */

Object.defineProperty(MutationObserver.prototype, "constructor", {
    value: MutationObserver, writable: true, enumerable: false, configurable: true
});
