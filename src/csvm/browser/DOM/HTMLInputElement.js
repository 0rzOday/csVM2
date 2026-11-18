var HTMLInputElement = function HTMLInputElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLInputElement);
Object.defineProperty(HTMLInputElement.prototype,Symbol.toStringTag,{value:"HTMLInputElement",configurable:true});
HTMLInputElement.prototype.__proto__=HTMLElement.prototype;

// ---------------------------------------------------------------------------
// input 元素属性/方法（真机语义的最小实现）
// 挑战的表单自检会读/调用 value/type/name/form/checkValidity/select/
// setRangeText/setSelectionRange/stepUp 等，之前这些全是 undefined。
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
    function setStr(self, k) {
        return function (v) { var d = D(self); if (d) d.data[k] = String(v); };
    }
    function num(self, k, def) { var d = D(self); var v = d && d.data[k]; var n = parseInt(v, 10); return isNaN(n) ? def : n; }
    function setNum(self, k) {
        return function (v) { var d = D(self); if (d) d.data[k] = String(Number(v) | 0); };
    }
    function boolProp(self, k) { return has(self, k); }
    function setBool(self, k) {
        return function (v) { var d = D(self); if (!d) return; if (v) d.data[k] = ""; else delete d.data[k]; };
    }
    function define(k, getter, setter, name) {
        Object.defineProperty(HTMLInputElement.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }

    define("type", function () { return (str(this, "type", "text") || "text").toLowerCase(); }, function (v) { var d = D(this); if (d) d.data.type = String(v).toLowerCase(); });
    define("name", function () { return str(this, "name"); }, function (v) { var d = D(this); if (d) { d.data.name = String(v); try { if (csvm.markDomChanged) csvm.markDomChanged(); } catch (e) {} } });
    define("value", function () { return str(this, "value"); }, setStr2("value"));
    define("defaultValue", function () { return str(this, "value"); }, setStr2("value"));
    define("placeholder", function () { return str(this, "placeholder"); }, setStr2("placeholder"));
    define("pattern", function () { return str(this, "pattern"); }, setStr2("pattern"));
    define("accept", function () { return str(this, "accept"); }, setStr2("accept"));
    define("alt", function () { return str(this, "alt"); }, setStr2("alt"));
    define("autocomplete", function () { return str(this, "autocomplete"); }, setStr2("autocomplete"));
    define("src", function () { return str(this, "src"); }, setStr2("src"));
    define("inputMode", function () { return str(this, "inputmode"); }, setStr2("inputmode"));
    define("dirName", function () { return str(this, "dirname"); }, setStr2("dirname"));
    define("formTarget", function () { return str(this, "formtarget"); }, setStr2("formtarget"));
    define("maxLength", function () { return num(this, "maxlength", -1); }, setNum2("maxlength"));
    define("minLength", function () { return num(this, "minlength", -1); }, setNum2("minlength"));
    define("size", function () { return num(this, "size", 20); }, setNum2("size"));
    define("height", function () { return num(this, "height", 0); }, setNum2("height"));
    define("width", function () { return num(this, "width", 0); }, setNum2("width"));
    define("min", function () { return str(this, "min"); }, setStr2("min"));
    define("max", function () { return str(this, "max"); }, setStr2("max"));
    define("step", function () { return str(this, "step"); }, setStr2("step"));
    define("checked", function () { return boolProp(this, "checked"); }, setBool2("checked"));
    define("defaultChecked", function () { return boolProp(this, "checked"); }, setBool2("checked"));
    define("disabled", function () { return boolProp(this, "disabled"); }, setBool2("disabled"));
    define("readOnly", function () { return boolProp(this, "readonly"); }, setBool2("readonly"));
    define("required", function () { return boolProp(this, "required"); }, setBool2("required"));
    define("multiple", function () { return boolProp(this, "multiple"); }, setBool2("multiple"));
    define("autofocus", function () { return boolProp(this, "autofocus"); }, setBool2("autofocus"));
    define("formNoValidate", function () { return boolProp(this, "formnovalidate"); }, setBool2("formnovalidate"));
    define("indeterminate", function () { var d = D(this); return !!(d && d.indeterminate); }, function (v) { var d = D(this); if (d) d.indeterminate = !!v; });
    define("list", function () { return null; });
    define("files", function () { return csvm.makeNodeList([]); }, function (v) { void v; });
    define("labels", function () { return csvm.makeNodeList([]); });
    define("selectionStart", function () { return 0; }, function (v) { void v; });
    define("selectionEnd", function () { return 0; }, function (v) { void v; });
    define("selectionDirection", function () { return "none"; }, function (v) { void v; });
    define("form", function () {
        var n = this;
        for (var i = 0; i < 12 && n; i++) {
            var d = csvm.memory.domStore.get(n);
            if (d && d.tag === "form") return n;
            n = n.parentNode;
        }
        return null;
    });
    define("willValidate", function () { return !boolProp(this, "disabled"); });
    define("validationMessage", function () { return __inputValidity(this).__message; });
    define("validity", function () { var v = __inputValidity(this); return v; });

    // 约束校验：按真机语义逐项计算，供 validity / checkValidity / form 聚合使用
    function __inputValidity(el) {
        var d = D(el);
        var data = (d && d.data) || {};
        var type = String(data.type || "text").toLowerCase();
        var value = data.value === undefined || data.value === null ? "" : String(data.value);
        var required = Object.prototype.hasOwnProperty.call(data, "required");
        var disabled = Object.prototype.hasOwnProperty.call(data, "disabled");
        var v = { valid: true, valueMissing: false, typeMismatch: false, patternMismatch: false,
                  tooLong: false, tooShort: false, rangeUnderflow: false, rangeOverflow: false,
                  stepMismatch: false, badInput: false, customError: !!data.customError, __message: "" };
        if (disabled) { v.__message = ""; return v; }
        var msg = "";
        if (type === "checkbox" || type === "radio") {
            if (required && !Object.prototype.hasOwnProperty.call(data, "checked")) { v.valueMissing = true; msg = "请勾选此框。"; }
        } else if (required && value === "") {
            v.valueMissing = true; msg = "请填写此字段。";
        }
        if (!v.valueMissing && value !== "") {
            if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { v.typeMismatch = true; msg = msg || "请在电子邮件地址中包括“@”。"; }
            if (type === "url" && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) { v.typeMismatch = true; msg = msg || "请输入网址。"; }
            var pattern = data.pattern;
            if (pattern && (type === "text" || type === "search" || type === "tel" || type === "url" || type === "email" || type === "password")) {
                try { if (!new RegExp("^(?:" + String(pattern) + ")$").test(value)) { v.patternMismatch = true; msg = msg || "请匹配要求的格式。"; } } catch (e) {}
            }
            var maxlen = parseInt(data.maxlength, 10), minlen = parseInt(data.minlength, 10);
            if (!isNaN(maxlen) && value.length > maxlen) { v.tooLong = true; msg = msg || "请缩短此文本。"; }
            if (!isNaN(minlen) && value.length < minlen) { v.tooShort = true; msg = msg || "请延长此文本。"; }
            if (type === "number" || type === "range") {
                var nv = Number(value);
                if (!isNaN(nv)) {
                    var min = parseFloat(data.min), max = parseFloat(data.max), step = parseFloat(data.step);
                    if (!isNaN(min) && nv < min) { v.rangeUnderflow = true; msg = msg || "值必须大于或等于 " + min + "。"; }
                    if (!isNaN(max) && nv > max) { v.rangeOverflow = true; msg = msg || "值必须小于或等于 " + max + "。"; }
                    if (!isNaN(step) && step > 0) {
                        var base = isNaN(min) ? 0 : min;
                        var q = (nv - base) / step;
                        if (Math.abs(q - Math.round(q)) > 1e-9) { v.stepMismatch = true; msg = msg || "请输入有效值。两个最接近的有效值分别为 " + (base + Math.floor(q) * step) + " 和 " + (base + Math.ceil(q) * step) + "。"; }
                    }
                }
            }
        }
        if (v.customError) msg = msg || String(data.customError);
        v.valid = !(v.valueMissing || v.typeMismatch || v.patternMismatch || v.tooLong || v.tooShort ||
                    v.rangeUnderflow || v.rangeOverflow || v.stepMismatch || v.badInput || v.customError);
        v.__message = v.valid ? "" : msg;
        return v;
    }
    csvm.inputValidity = __inputValidity;

    function setStr2(k) { return function (v) { var d = D(this); if (d) d.data[k] = String(v); }; }
    function setNum2(k) { return function (v) { var d = D(this); if (d) d.data[k] = String(Number(v) | 0); }; }
    function setBool2(k) { return function (v) { var d = D(this); if (!d) return; if (v) d.data[k] = ""; else delete d.data[k]; }; }

    // 方法
    function method(k, fn) {
        Object.defineProperty(HTMLInputElement.prototype, k, {
            configurable: true, enumerable: true, writable: true,
            value: csvm.safefunction(fn, k),
        });
    }
    method("checkValidity", function () { return __inputValidity(this).valid; });
    method("reportValidity", function () { return __inputValidity(this).valid; });
    method("setCustomValidity", function (msg) { var d = D(this); if (d) d.customError = String(msg || ""); });
    method("select", function () {});
    method("setRangeText", function () {});
    method("setSelectionRange", function () {});
    method("stepUp", function () {});
    method("stepDown", function () {});
    method("showPicker", function () {});
})();

// 注册 input 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("input", HTMLInputElement);
