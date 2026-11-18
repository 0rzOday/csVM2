var HTMLButtonElement = function HTMLButtonElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLButtonElement);
Object.defineProperty(HTMLButtonElement.prototype,Symbol.toStringTag,{value:"HTMLButtonElement",configurable:true});
HTMLButtonElement.prototype.__proto__=HTMLElement.prototype;

// ---------------------------------------------------------------------------
// button 元素属性/方法
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
        Object.defineProperty(HTMLButtonElement.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }
    define("value", function () { return str(this, "value"); }, function (v) { var d = D(this); if (d) d.data.value = String(v); });
    define("type", function () { return (str(this, "type", "submit") || "submit").toLowerCase(); }, function (v) { var d = D(this); if (d) d.data.type = String(v).toLowerCase(); });
    define("name", function () { return str(this, "name"); }, function (v) { var d = D(this); if (d) { d.data.name = String(v); try { if (csvm.markDomChanged) csvm.markDomChanged(); } catch (e) {} } });
    define("disabled", function () { return has(this, "disabled"); }, function (v) { var d = D(this); if (!d) return; if (v) d.data.disabled = ""; else delete d.data.disabled; });
    define("autofocus", function () { return has(this, "autofocus"); }, function (v) { var d = D(this); if (!d) return; if (v) d.data.autofocus = ""; else delete d.data.autofocus; });
    define("form", function () {
        var n = this;
        for (var i = 0; i < 12 && n; i++) {
            var d = csvm.memory.domStore.get(n);
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
        Object.defineProperty(HTMLButtonElement.prototype, k, {
            configurable: true, enumerable: true, writable: true,
            value: csvm.safefunction(fn, k),
        });
    }
    method("checkValidity", function () { return true; });
    method("reportValidity", function () { return true; });
    method("setCustomValidity", function () {});
})();

// 注册 button 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("button", HTMLButtonElement);
