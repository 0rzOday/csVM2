var HTMLSelectElement = function HTMLSelectElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLSelectElement);
Object.defineProperty(HTMLSelectElement.prototype,Symbol.toStringTag,{value:"HTMLSelectElement",configurable:true});
HTMLSelectElement.prototype.__proto__=HTMLElement.prototype;

// ---------------------------------------------------------------------------
// select 元素属性/方法
// ---------------------------------------------------------------------------
(function () {
    function D(self) {
        var d = csvm.memory.Dom.get(self);
        if (!d) return null;
        if (!d.data) d.data = {};
        return d;
    }
    function has(self, k) { var d = D(self); return !!(d && Object.prototype.hasOwnProperty.call(d.data, k)); }
    function str(self, k, def) { var d = D(self); var v = d && d.data[k]; return v === undefined || v === null ? (def === undefined ? "" : def) : String(v); }
    function optionsOf(self) {
        var list = [];
        try { list = csvm.queryAll(self, "option"); } catch (e) { list = []; }
        return list;
    }
    function define(k, getter, setter, name) {
        Object.defineProperty(HTMLSelectElement.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }
    define("options", function () { return csvm.makeHTMLCollection(optionsOf(this)); });
    define("length", function () { return optionsOf(this).length; }, function (v) { void v; });
    define("multiple", function () { return has(this, "multiple"); }, function (v) { var d = D(this); if (!d) return; if (v) d.data.multiple = ""; else delete d.data.multiple; });
    define("name", function () { return str(this, "name"); }, function (v) { var d = D(this); if (d) d.data.name = String(v); });
    define("size", function () { var d = D(this); var n = parseInt(d && d.data.size, 10); return isNaN(n) ? 0 : n; }, function (v) { var d = D(this); if (d) d.data.size = String(Number(v) | 0); });
    define("type", function () { return has(this, "multiple") ? "select-multiple" : "select-one"; });
    define("disabled", function () { return has(this, "disabled"); }, function (v) { var d = D(this); if (!d) return; if (v) d.data.disabled = ""; else delete d.data.disabled; });
    define("required", function () { return has(this, "required"); }, function (v) { var d = D(this); if (!d) return; if (v) d.data.required = ""; else delete d.data.required; });
    define("autofocus", function () { return has(this, "autofocus"); }, function (v) { var d = D(this); if (!d) return; if (v) d.data.autofocus = ""; else delete d.data.autofocus; });
    define("selectedIndex", function () {
        var opts = optionsOf(this);
        for (var i = 0; i < opts.length; i++) { var d = csvm.memory.Dom.get(opts[i]); if (d && d.data && Object.prototype.hasOwnProperty.call(d.data, "selected")) return i; }
        return opts.length ? 0 : -1;
    }, function (v) {
        var opts = optionsOf(this), idx = Number(v) | 0;
        for (var i = 0; i < opts.length; i++) {
            var d = csvm.memory.Dom.get(opts[i]);
            if (!d) continue;
            if (!d.data) d.data = {};
            if (i === idx) d.data.selected = ""; else delete d.data.selected;
        }
    });
    define("value", function () {
        var opts = optionsOf(this);
        if (!opts.length) return "";
        var idx = 0;
        for (var i = 0; i < opts.length; i++) { var d = csvm.memory.Dom.get(opts[i]); if (d && d.data && Object.prototype.hasOwnProperty.call(d.data, "selected")) { idx = i; break; } }
        var od = csvm.memory.Dom.get(opts[idx]);
        var v = od && od.data ? od.data.value : undefined;
        return v === undefined || v === null ? "" : String(v);
    }, function (v) {
        var opts = optionsOf(this);
        for (var i = 0; i < opts.length; i++) {
            var d = csvm.memory.Dom.get(opts[i]);
            if (!d) continue;
            if (!d.data) d.data = {};
            if (String(d.data.value === undefined ? "" : d.data.value) === String(v)) d.data.selected = ""; else delete d.data.selected;
        }
    });
    define("selectedOptions", function () {
        var opts = optionsOf(this), sel = [];
        for (var i = 0; i < opts.length; i++) { var d = csvm.memory.Dom.get(opts[i]); if (d && d.data && Object.prototype.hasOwnProperty.call(d.data, "selected")) sel.push(opts[i]); }
        return csvm.makeHTMLCollection(sel);
    });
    define("form", function () {
        var n = this;
        for (var i = 0; i < 12 && n; i++) {
            var d = csvm.memory.Dom.get(n);
            if (d && d.tag === "form") return n;
            n = n.parentNode;
        }
        return null;
    });
    define("labels", function () { return csvm.makeNodeList([]); });
    define("willValidate", function () { return !has(this, "disabled"); });
    define("validationMessage", function () { return ""; });
    define("validity", function () { return { valid: true }; });

    function method(k, fn) {
        Object.defineProperty(HTMLSelectElement.prototype, k, {
            configurable: true, enumerable: true, writable: true,
            value: csvm.safefunction(fn, k),
        });
    }
    method("item", function (i) { var o = optionsOf(this); i = Number(i) | 0; return i >= 0 && i < o.length ? o[i] : null; });
    method("namedItem", function (n) {
        var o = optionsOf(this);
        for (var i = 0; i < o.length; i++) { var d = csvm.memory.Dom.get(o[i]); if (d && d.data && (d.data.id === n || d.data.name === n)) return o[i]; }
        return null;
    });
    method("add", function (el) { try { if (this.appendChild) this.appendChild(el); } catch (e) {} });
    method("remove", function (i) { var o = optionsOf(this); i = Number(i) | 0; if (o[i] && o[i].parentNode) o[i].parentNode.removeChild(o[i]); });
    method("checkValidity", function () { return true; });
    method("reportValidity", function () { return true; });
    method("setCustomValidity", function () {});
})();

// 注册 select 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("select", HTMLSelectElement);
