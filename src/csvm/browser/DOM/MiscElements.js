// 其余 HTML 标签接口（真机/ jsdom 都有专用类，我们之前统一返回 HTMLElement）。
// 挑战会 createElement('style'/'textarea'/...) 并检查 constructor / 专用属性。
(function () {
    function mkCtor(name) {
        var C = function () { throw new TypeError("Illegal constructor"); };
        csvm.safefunction(C, name);
        Object.defineProperty(C.prototype, Symbol.toStringTag, { value: name, configurable: true });
        C.prototype.__proto__ = HTMLElement.prototype;
        return C;
    }
    function D(self) {
        var d = csvm.memory.domStore.get(self);
        if (!d) return null;
        if (!d.data) d.data = {};
        return d;
    }
    function has(self, k) { var d = D(self); return !!(d && Object.prototype.hasOwnProperty.call(d.data, k)); }
    function str(self, k, def) { var d = D(self); var v = d && d.data[k]; return v === undefined || v === null ? (def === undefined ? "" : def) : String(v); }
    function defineOn(C, k, getter, setter, name) {
        Object.defineProperty(C.prototype, k, {
            configurable: true, enumerable: true,
            get: csvm.safefunction(getter, "get " + (name || k)),
            set: setter ? csvm.safefunction(setter, "set " + (name || k)) : undefined,
        });
    }
    function setStr(k) { return function (v) { var d = D(this); if (d) d.data[k] = String(v); }; }
    function setBool(k) { return function (v) { var d = D(this); if (!d) return; if (v) d.data[k] = ""; else delete d.data[k]; }; }
    function methodOn(C, k, fn) {
        Object.defineProperty(C.prototype, k, {
            configurable: true, enumerable: true, writable: true,
            value: csvm.safefunction(fn, k),
        });
    }
    function formOf(self) {
        var n = self;
        for (var i = 0; i < 12 && n; i++) {
            var d = csvm.memory.domStore.get(n);
            if (d && d.tag === "form") return n;
            n = n.parentNode;
        }
        return null;
    }
    function valMethods(C) {
        methodOn(C, "checkValidity", function () { return true; });
        methodOn(C, "reportValidity", function () { return true; });
        methodOn(C, "setCustomValidity", function () {});
        defineOn(C, "willValidate", function () { return !has(this, "disabled"); });
        defineOn(C, "validationMessage", function () { return ""; });
        defineOn(C, "validity", function () { return { valid: true }; });
        defineOn(C, "labels", function () { return csvm.makeNodeList([]); });
        defineOn(C, "form", function () { return formOf(this); });
    }

    // ── HTMLStyleElement ──────────────────────────────────────────────────
    var HTMLStyleElement = mkCtor("HTMLStyleElement");
    defineOn(HTMLStyleElement, "media", function () { return str(this, "media"); }, setStr("media"));
    defineOn(HTMLStyleElement, "type", function () { return str(this, "type", "text/css"); }, setStr("type"));
    defineOn(HTMLStyleElement, "disabled", function () { return has(this, "disabled"); }, setBool("disabled"));
    defineOn(HTMLStyleElement, "sheet", function () {
        if (!csvm.memory.styleSheets) csvm.memory.styleSheets = new WeakMap();
        var css = "";
        try { css = String(this.textContent || ""); } catch (e) {}
        var s = csvm.memory.styleSheets.get(this);
        if (!s) {
            s = { cssRules: [], insertRule: function (rule, idx) { var i = idx === undefined ? this.cssRules.length : idx; this.cssRules.splice(i, 0, { cssText: String(rule) }); return i; }, deleteRule: function (i) { this.cssRules.splice(i, 1); }, ownerNode: this };
            try { Object.defineProperty(s, Symbol.toStringTag, { value: "CSSStyleSheet", configurable: true }); } catch (e) {}
            csvm.memory.styleSheets.set(this, s);
        }
        // 按当前文本重新解析（简单规则切分）
        var rules = [];
        String(css).replace(/([^{}]+)\{([^{}]*)\}/g, function (m, sel, body) {
            rules.push({ cssText: String(sel).trim() + " { " + String(body).trim() + " }", selectorText: String(sel).trim(), style: { cssText: String(body).trim() } });
            return m;
        });
        s.cssRules = rules;
        return s;
    });
    csvm.registerElement("style", HTMLStyleElement);
    if (typeof globalThis.HTMLStyleElement === "undefined") globalThis.HTMLStyleElement = HTMLStyleElement;

    // ── HTMLTextAreaElement ───────────────────────────────────────────────
    var HTMLTextAreaElement = mkCtor("HTMLTextAreaElement");
    defineOn(HTMLTextAreaElement, "type", function () { return "textarea"; });
    defineOn(HTMLTextAreaElement, "name", function () { return str(this, "name"); }, setStr("name"));
    defineOn(HTMLTextAreaElement, "value", function () {
        var d = D(this);
        var v = d && d.data.value;
        return v === undefined || v === null ? (this.textContent == null ? "" : String(this.textContent)) : String(v);
    }, setStr("value"));
    defineOn(HTMLTextAreaElement, "defaultValue", function () { return this.value; }, setStr("value"));
    defineOn(HTMLTextAreaElement, "textLength", function () { return String(this.value).length; });
    defineOn(HTMLTextAreaElement, "rows", function () { return parseInt(str(this, "rows", "2"), 10) || 2; }, setStr("rows"));
    defineOn(HTMLTextAreaElement, "cols", function () { return parseInt(str(this, "cols", "20"), 10) || 20; }, setStr("cols"));
    defineOn(HTMLTextAreaElement, "placeholder", function () { return str(this, "placeholder"); }, setStr("placeholder"));
    defineOn(HTMLTextAreaElement, "maxLength", function () { var n = parseInt(str(this, "maxlength", "-1"), 10); return isNaN(n) ? -1 : n; }, setStr("maxlength"));
    defineOn(HTMLTextAreaElement, "disabled", function () { return has(this, "disabled"); }, setBool("disabled"));
    defineOn(HTMLTextAreaElement, "readOnly", function () { return has(this, "readonly"); }, setBool("readonly"));
    defineOn(HTMLTextAreaElement, "required", function () { return has(this, "required"); }, setBool("required"));
    defineOn(HTMLTextAreaElement, "selectionStart", function () { return 0; }, function () {});
    defineOn(HTMLTextAreaElement, "selectionEnd", function () { return 0; }, function () {});
    defineOn(HTMLTextAreaElement, "selectionDirection", function () { return "none"; }, function () {});
    valMethods(HTMLTextAreaElement);
    methodOn(HTMLTextAreaElement, "select", function () {});
    methodOn(HTMLTextAreaElement, "setRangeText", function () {});
    methodOn(HTMLTextAreaElement, "setSelectionRange", function () {});
    csvm.registerElement("textarea", HTMLTextAreaElement);
    if (typeof globalThis.HTMLTextAreaElement === "undefined") globalThis.HTMLTextAreaElement = HTMLTextAreaElement;

    // ── HTMLLabelElement ──────────────────────────────────────────────────
    var HTMLLabelElement = mkCtor("HTMLLabelElement");
    defineOn(HTMLLabelElement, "htmlFor", function () { return str(this, "for"); }, setStr("for"));
    defineOn(HTMLLabelElement, "control", function () {
        var id = str(this, "for");
        try { if (id && document.getElementById) { var el = document.getElementById(id); if (el) return el; } } catch (e) {}
        try { var list = csvm.queryAll(this, "input, select, textarea, button"); return list.length ? list[0] : null; } catch (e) {}
        return null;
    });
    defineOn(HTMLLabelElement, "form", function () { return formOf(this); });
    csvm.registerElement("label", HTMLLabelElement);
    if (typeof globalThis.HTMLLabelElement === "undefined") globalThis.HTMLLabelElement = HTMLLabelElement;

    // ── HTMLFieldSetElement ───────────────────────────────────────────────
    var HTMLFieldSetElement = mkCtor("HTMLFieldSetElement");
    defineOn(HTMLFieldSetElement, "name", function () { return str(this, "name"); }, setStr("name"));
    defineOn(HTMLFieldSetElement, "disabled", function () { return has(this, "disabled"); }, setBool("disabled"));
    defineOn(HTMLFieldSetElement, "elements", function () {
        try { return csvm.makeHTMLCollection(csvm.queryAll(this, "input, select, textarea, button")); } catch (e) { return csvm.makeHTMLCollection([]); }
    });
    valMethods(HTMLFieldSetElement);
    csvm.registerElement("fieldset", HTMLFieldSetElement);
    if (typeof globalThis.HTMLFieldSetElement === "undefined") globalThis.HTMLFieldSetElement = HTMLFieldSetElement;

    // ── HTMLOutputElement ─────────────────────────────────────────────────
    var HTMLOutputElement = mkCtor("HTMLOutputElement");
    defineOn(HTMLOutputElement, "type", function () { return "output"; });
    defineOn(HTMLOutputElement, "name", function () { return str(this, "name"); }, setStr("name"));
    defineOn(HTMLOutputElement, "value", function () { return this.textContent == null ? "" : String(this.textContent); }, function (v) { this.textContent = String(v); });
    defineOn(HTMLOutputElement, "defaultValue", function () { return this.value; });
    defineOn(HTMLOutputElement, "htmlFor", function () { return str(this, "for"); }, setStr("for"));
    valMethods(HTMLOutputElement);
    csvm.registerElement("output", HTMLOutputElement);
    if (typeof globalThis.HTMLOutputElement === "undefined") globalThis.HTMLOutputElement = HTMLOutputElement;

    // ── HTMLDataListElement ───────────────────────────────────────────────
    var HTMLDataListElement = mkCtor("HTMLDataListElement");
    defineOn(HTMLDataListElement, "options", function () {
        try { return csvm.makeHTMLCollection(csvm.queryAll(this, "option")); } catch (e) { return csvm.makeHTMLCollection([]); }
    });
    csvm.registerElement("datalist", HTMLDataListElement);
    if (typeof globalThis.HTMLDataListElement === "undefined") globalThis.HTMLDataListElement = HTMLDataListElement;

    // ── HTMLTemplateElement ───────────────────────────────────────────────
    var HTMLTemplateElement = mkCtor("HTMLTemplateElement");
    defineOn(HTMLTemplateElement, "content", function () {
        if (!csvm.memory.templateContent) csvm.memory.templateContent = new WeakMap();
        var frag = csvm.memory.templateContent.get(this);
        if (!frag) {
            frag = csvm.DomGenerator("#document-fragment", {}, null);
            try { Object.defineProperty(frag, "ownerDocument", { get: function () { return document; }, configurable: true }); } catch (e) {}
            csvm.memory.templateContent.set(this, frag);
        }
        return frag;
    });
    // template.innerHTML 进 content 片段，而不是元素本身
    defineOn(HTMLTemplateElement, "innerHTML", function () {
        var d = csvm.memory.domStore.get(this.content);
        var out = [];
        if (d) for (var i = 0; i < d.childNodes.length; i++) serializeNodeInto(d.childNodes[i], out);
        return out.join("");
    }, function (v) {
        var frag = this.content;
        var d = csvm.memory.domStore.get(frag);
        if (!d) return;
        d.childNodes = [];
        var nodes = htmlParse(v === null ? "" : String(v));
        for (var i = 0; i < nodes.length; i++) {
            var nd = csvm.memory.domStore.get(nodes[i]);
            if (nd) nd.parent = frag;
            d.childNodes.push(nodes[i]);
        }
    });
    csvm.registerElement("template", HTMLTemplateElement);
    if (typeof globalThis.HTMLTemplateElement === "undefined") globalThis.HTMLTemplateElement = HTMLTemplateElement;

    // ── HTMLSlotElement ───────────────────────────────────────────────────
    var HTMLSlotElement = mkCtor("HTMLSlotElement");
    defineOn(HTMLSlotElement, "name", function () { return str(this, "name"); }, setStr("name"));
    methodOn(HTMLSlotElement, "assignedNodes", function () { return csvm.makeNodeList([]); });
    methodOn(HTMLSlotElement, "assignedElements", function () { return csvm.makeHTMLCollection([]); });
    csvm.registerElement("slot", HTMLSlotElement);
    if (typeof globalThis.HTMLSlotElement === "undefined") globalThis.HTMLSlotElement = HTMLSlotElement;
})();
