var HTMLOptionElement = function HTMLOptionElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLOptionElement);
Object.defineProperty(HTMLOptionElement.prototype,Symbol.toStringTag,{value:"HTMLOptionElement",configurable:true});
HTMLOptionElement.prototype.__proto__=HTMLElement.prototype;
HTMLOptionElement=csvm.proxy(HTMLOptionElement,"HTMLOptionElement");

// ---------------------------------------------------------------------------
// option 元素属性（value 默认取文本，selected 反射）
// ---------------------------------------------------------------------------
(function () {
    function D(self) { var d = csvm.memory.domStore.get(self); if (!d) return null; if (!d.data) d.data = {}; return d; }
    function has(self, k) { var d = D(self); return !!(d && Object.prototype.hasOwnProperty.call(d.data, k)); }
    function str(self, k, def) { var d = D(self); var v = d && d.data[k]; return v === undefined || v === null ? (def === undefined ? "" : def) : String(v); }
    function define(k, getter, setter, name) {
        Object.defineProperty(HTMLOptionElement.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }
    define("value", function () {
        var v = str(this, "value", null);
        if (v !== null) return v;
        return this.textContent == null ? "" : String(this.textContent);
    }, function (v) { var d = D(this); if (d) d.data.value = String(v); });
    define("text", function () { return this.textContent == null ? "" : String(this.textContent); },
        function (v) { this.textContent = String(v); });
    define("label", function () { return str(this, "label", this.textContent == null ? "" : String(this.textContent)); },
        function (v) { var d = D(this); if (d) d.data.label = String(v); });
    define("selected", function () { return has(this, "selected"); },
        function (v) { var d = D(this); if (!d) return; if (v) d.data.selected = ""; else delete d.data.selected; });
    define("defaultSelected", function () { return has(this, "selected"); },
        function (v) { var d = D(this); if (!d) return; if (v) d.data.selected = ""; else delete d.data.selected; });
    define("disabled", function () { return has(this, "disabled"); },
        function (v) { var d = D(this); if (!d) return; if (v) d.data.disabled = ""; else delete d.data.disabled; });
    define("index", function () {
        var p = this.parentNode;
        if (!p) return 0;
        var opts = [];
        try { opts = csvm.queryAll(p, "option"); } catch (e) { opts = []; }
        for (var i = 0; i < opts.length; i++) if (opts[i] === this) return i;
        return 0;
    });
    define("form", function () {
        var n = this;
        for (var i = 0; i < 12 && n; i++) { var d = csvm.memory.domStore.get(n); if (d && d.tag === "form") return n; n = n.parentNode; }
        return null;
    });
})();

// 注册 option 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("option", HTMLOptionElement);
