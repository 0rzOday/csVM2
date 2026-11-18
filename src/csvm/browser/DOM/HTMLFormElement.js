var HTMLFormElement = function HTMLFormElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLFormElement);
Object.defineProperty(HTMLFormElement.prototype,Symbol.toStringTag,{value:"HTMLFormElement",configurable:true});
HTMLFormElement.prototype.__proto__=HTMLElement.prototype;

// 真机 form.action：set 存绝对 URL，get 返回绝对 URL；没有 action 时返回当前文档 URL
Object.defineProperty(HTMLFormElement.prototype, "action", {
    configurable: true,
    enumerable: true,
    get: csvm.safefunction(function () {
        var d = csvm.memory.domStore.get(this);
        var raw = d && d.data ? d.data.action : undefined;
        var base = __anchorBase();
        if (raw === undefined || raw === null || raw === "") raw = base;
        return __anchorParse(String(raw), base).href;
    }, "get action"),
    set: csvm.safefunction(function (value) {
        var d = csvm.memory.domStore.get(this);
        if (!d) return;
        d.data = d.data || {};
        d.data.action = __anchorParse(String(value), __anchorBase()).href;
    }, "set action")
});

// name：真机是反射 content 属性
if (!Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, "name")) {
    Object.defineProperty(HTMLFormElement.prototype, "name", {
        configurable: true, enumerable: true,
        get: csvm.safefunction(function () {
            var d = csvm.memory.domStore.get(this);
            return (d && d.data && d.data.name != null) ? String(d.data.name) : "";
        }, "get name"),
        set: csvm.safefunction(function (v) {
            var d = csvm.memory.domStore.get(this);
            if (!d) return;
            d.data = d.data || {};
            d.data.name = String(v);
            try { if (csvm.markDomChanged) csvm.markDomChanged(); } catch (e) {}
        }, "set name"),
    });
}

// 真机 form 支持按控件的 id/name 直接取值（form.username）。
//
// 关键：HTMLFormElement 的命名 getter 带 [LegacyOverrideBuiltIns] —— 同名子元素
// 会**覆盖**原型上的内建属性（action / id / textContent / length / …）。
// 瑞数的自检就靠这个：塞入 name=action/textContent/id 的 input，期望
// form.action / form.textContent / form.id 返回这些 input（而不是原生值）。
// 返回原生值 = 环境被判定为伪造。
csvm.mirrorNamedForm = function (form) {
    var d = csvm.memory.domStore.get(form);
    if (!d || d.tag !== "form") return;
    var all = [];
    try { all = csvm.queryAll(form, "input, select, textarea, button, object, output, fieldset"); } catch (e) { return; }
    // 先清掉上一轮镜像（控件被移除/改名时不能留脏属性）
    var prev = d.__mirrorNames || [];
    for (var p = 0; p < prev.length; p++) {
        try { delete form[prev[p]]; } catch (e) {}
    }
    var mine = [];
    var seen = Object.create(null);
    for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var ed = csvm.memory.domStore.get(el);
        if (!ed) continue;
        var names = [];
        if (ed.data && ed.data.name != null && ed.data.name !== "") names.push(String(ed.data.name));
        if (ed.data && ed.data.id != null && ed.data.id !== "") names.push(String(ed.data.id));
        for (var n = 0; n < names.length; n++) {
            var nm = names[n];
            if (seen[nm]) continue;
            seen[nm] = true;
            try {
                (function (node) {
                    Object.defineProperty(form, nm, {
                        configurable: true, enumerable: false,
                        get: function () { return node; },
                        set: undefined,
                    });
                })(el);
                mine.push(nm);
            } catch (e) {}
        }
    }
    d.__mirrorNames = mine;
};

HTMLFormElement=csvm.proxy(HTMLFormElement,"HTMLFormElement");

// elements / length / submit / reset
Object.defineProperty(HTMLFormElement.prototype, "elements", {
    configurable: true, enumerable: true,
    get: csvm.safefunction(function () {
        var self = this, out = [];
        ["input", "select", "textarea", "button", "fieldset", "object", "output"].forEach(function (t) {
            out = out.concat(csvm.queryAll(self, t));
        });
        return csvm.collection(out);
    }, "get elements"),
    set: undefined,
});
Object.defineProperty(HTMLFormElement.prototype, "length", {
    configurable: true, enumerable: true,
    get: csvm.safefunction(function () {
        var self = this, n = 0;
        ["input", "select", "textarea", "button"].forEach(function (t) { n += csvm.queryAll(self, t).length; });
        return n;
    }, "get length"),
    set: undefined,
});
["submit", "reset", "requestSubmit"].forEach(function (name) {
    Object.defineProperty(HTMLFormElement.prototype, name, {
        configurable: true, enumerable: true, writable: true,
        value: csvm.safefunction({ [name]() { return undefined; } }[name], name),
    });
});
["checkValidity", "reportValidity"].forEach(function (name) {
    Object.defineProperty(HTMLFormElement.prototype, name, {
        configurable: true, enumerable: true, writable: true,
        value: csvm.safefunction({ [name]() {
            var els = null;
            try { els = this.elements; } catch (e) {}
            if (!els) return true;
            var ok = true;
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (!el) continue;
                var d = csvm.memory.domStore.get(el);
                var tag = d && String(d.tag).toLowerCase();
                if (tag === "input" && typeof csvm.inputValidity === "function") {
                    if (!csvm.inputValidity(el).valid) ok = false;
                } else if (typeof el.checkValidity === "function") {
                    try { if (!el.checkValidity()) ok = false; } catch (e) {}
                }
            }
            return ok;
        } }[name], name),
    });
});


// 真机 form 的反射属性（之前缺失，挑战自检会读）
(function () {
    function D(self) { var d = csvm.memory.domStore.get(self); if (!d) return null; if (!d.data) d.data = {}; return d; }
    function has(self, k) { var d = D(self); return !!(d && Object.prototype.hasOwnProperty.call(d.data, k)); }
    function str(self, k, def) { var d = D(self); var v = d && d.data[k]; return v === undefined || v === null ? (def === undefined ? "" : def) : String(v); }
    function define(k, getter, setter, name) {
        Object.defineProperty(HTMLFormElement.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }
    define("method", function () { return (str(this, "method", "get") || "get").toLowerCase(); },
        function (v) { var d = D(this); if (d) d.data.method = String(v).toLowerCase(); });
    define("enctype", function () { return str(this, "enctype", "application/x-www-form-urlencoded"); },
        function (v) { var d = D(this); if (d) d.data.enctype = String(v); });
    define("target", function () { return str(this, "target"); },
        function (v) { var d = D(this); if (d) d.data.target = String(v); });
    define("acceptCharset", function () { return str(this, "accept-charset"); },
        function (v) { var d = D(this); if (d) d.data["accept-charset"] = String(v); });
    define("noValidate", function () { return has(this, "novalidate"); },
        function (v) { var d = D(this); if (!d) return; if (v) d.data.novalidate = ""; else delete d.data.novalidate; });
    define("autocomplete", function () { return str(this, "autocomplete", "on"); },
        function (v) { var d = D(this); if (d) d.data.autocomplete = String(v); });
})();

// 注册 form 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("form", HTMLFormElement);