var Element = function Element() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Element);
Object.defineProperty(Element.prototype, Symbol.toStringTag, { value: "Element", configurable: true });

// 解析innerHtml插入的字符
function htmlEscapeText(s){
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/\u00a0/g, "&nbsp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
// markup -> 节点数组（parent 全为 null）；null 表示解析器还没覆盖
// 约定：入参永远是原串，不做转义；转义只发生在序列化（getter）那一侧
function htmlParse(s){
    // 空串：浏览器结果是 0 个子节点，不能生成空文本节点
    if (s === "")return [];

    // 整个串是一段注释：data.text 只存两个定界符之间的内容
    var m = /^<!--([\s\S]*?)-->$/.exec(s);
    if (m){
        return [csvm.DomGenerator("#comment",{text:m[1]},null)];
    }

    // 纯字符（不含标签、不含实体）
    if (s.indexOf("<")===-1 && s.indexOf("&") === -1){
        return [csvm.DomGenerator("#text", {
            text: s.replace(/\r\n?/g, "\n")
        }, null)];
    }

    // 其他的实体比如div或者其他标签
    debugger;
    return null;
}
// 解析innerHtml插入的字符
/* #region AUTO:Element.prototype */
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
    // namespaceURI
    Object.defineProperty(Element.prototype, "namespaceURI", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get namespaceURI", 0),
        set: undefined,
    });
    // prefix
    Object.defineProperty(Element.prototype, "prefix", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get prefix", 0),
        set: undefined,
    });
    // localName
    Object.defineProperty(Element.prototype, "localName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get localName", 0),
        set: undefined,
    });
    // tagName
    Object.defineProperty(Element.prototype, "tagName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get tagName", 0),
        set: undefined,
    });
    // id
    Object.defineProperty(Element.prototype, "id", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get id", 0),
        set: __autoFn("set id", 1),
    });
    // className
    Object.defineProperty(Element.prototype, "className", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get className", 0),
        set: __autoFn("set className", 1),
    });
    // classList
    Object.defineProperty(Element.prototype, "classList", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get classList", 0),
        set: __autoFn("set classList", 1),
    });
    // slot
    Object.defineProperty(Element.prototype, "slot", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get slot", 0),
        set: __autoFn("set slot", 1),
    });
    // attributes
    Object.defineProperty(Element.prototype, "attributes", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get attributes", 0),
        set: undefined,
    });
    // shadowRoot
    Object.defineProperty(Element.prototype, "shadowRoot", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get shadowRoot", 0),
        set: undefined,
    });
    // part
    Object.defineProperty(Element.prototype, "part", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get part", 0),
        set: __autoFn("set part", 1),
    });
    // assignedSlot
    Object.defineProperty(Element.prototype, "assignedSlot", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get assignedSlot", 0),
        set: undefined,
    });
    // innerHTML
    Object.defineProperty(Element.prototype, "innerHTML", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get innerHTML", 0, function () {
            var d = csvm.memory.Dom.get(this);
            if (!d) return "";
            var s = "";
            for (var i = 0; i < d.childNodes.length; i++) {
                var cd = csvm.memory.Dom.get(d.childNodes[i]);
                if (!cd) continue;
                if (cd.nodeType === 8) s += "<!--" + cd.data.text + "-->";
                else if (cd.nodeType === 3) s += htmlEscapeText(cd.data.text);
                else debugger;          // 元素序列化还没补
            }
            debugger;
            return s;
        }),
        set: __autoFn("set innerHTML", 1, function (val) {
            var d = csvm.memory.Dom.get(this);
            if (!d) return;

            // 只有 null 转空串；undefined 按 String() 转成 "undefined"
            var result = htmlParse(val === null ? "" : String(val));
            if (result === null) return;      // 未覆盖：保持原样

            // 先切断旧直接子节点的 parent
            for (var i = 0; i < d.childNodes.length; i++) {
                var cd = csvm.memory.Dom.get(d.childNodes[i]);
                if (cd) cd.parent = null;
            }
            d.childNodes.length = 0;

            // 再挂新节点
            for (var j = 0; j < result.length; j++) {
                csvm.memory.Dom.get(result[j]).parent = this;
                d.childNodes.push(result[j]);
            }
            debugger;
        }),
    });
    // outerHTML
    Object.defineProperty(Element.prototype, "outerHTML", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get outerHTML", 0),
        set: __autoFn("set outerHTML", 1),
    });
    // scrollTop
    Object.defineProperty(Element.prototype, "scrollTop", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollTop", 0),
        set: __autoFn("set scrollTop", 1),
    });
    // scrollLeft
    Object.defineProperty(Element.prototype, "scrollLeft", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollLeft", 0),
        set: __autoFn("set scrollLeft", 1),
    });
    // scrollWidth
    Object.defineProperty(Element.prototype, "scrollWidth", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollWidth", 0),
        set: undefined,
    });
    // scrollHeight
    Object.defineProperty(Element.prototype, "scrollHeight", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollHeight", 0),
        set: undefined,
    });
    // clientTop
    Object.defineProperty(Element.prototype, "clientTop", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientTop", 0),
        set: undefined,
    });
    // clientLeft
    Object.defineProperty(Element.prototype, "clientLeft", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientLeft", 0),
        set: undefined,
    });
    // clientWidth
    Object.defineProperty(Element.prototype, "clientWidth", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientWidth", 0),
        set: undefined,
    });
    // clientHeight
    Object.defineProperty(Element.prototype, "clientHeight", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clientHeight", 0),
        set: undefined,
    });
    // onbeforecopy
    Object.defineProperty(Element.prototype, "onbeforecopy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforecopy", 0),
        set: __autoFn("set onbeforecopy", 1),
    });
    // onbeforecut
    Object.defineProperty(Element.prototype, "onbeforecut", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforecut", 0),
        set: __autoFn("set onbeforecut", 1),
    });
    // onbeforepaste
    Object.defineProperty(Element.prototype, "onbeforepaste", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforepaste", 0),
        set: __autoFn("set onbeforepaste", 1),
    });
    // onsearch
    Object.defineProperty(Element.prototype, "onsearch", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onsearch", 0),
        set: __autoFn("set onsearch", 1),
    });
    // elementTiming
    Object.defineProperty(Element.prototype, "elementTiming", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get elementTiming", 0),
        set: __autoFn("set elementTiming", 1),
    });
    // customElementRegistry
    Object.defineProperty(Element.prototype, "customElementRegistry", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get customElementRegistry", 0),
        set: undefined,
    });
    // onfullscreenchange
    Object.defineProperty(Element.prototype, "onfullscreenchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfullscreenchange", 0),
        set: __autoFn("set onfullscreenchange", 1),
    });
    // onfullscreenerror
    Object.defineProperty(Element.prototype, "onfullscreenerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfullscreenerror", 0),
        set: __autoFn("set onfullscreenerror", 1),
    });
    // onwebkitfullscreenchange
    Object.defineProperty(Element.prototype, "onwebkitfullscreenchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitfullscreenchange", 0),
        set: __autoFn("set onwebkitfullscreenchange", 1),
    });
    // onwebkitfullscreenerror
    Object.defineProperty(Element.prototype, "onwebkitfullscreenerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitfullscreenerror", 0),
        set: __autoFn("set onwebkitfullscreenerror", 1),
    });
    // activeViewTransition
    Object.defineProperty(Element.prototype, "activeViewTransition", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get activeViewTransition", 0),
        set: undefined,
    });
    // role
    Object.defineProperty(Element.prototype, "role", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get role", 0),
        set: __autoFn("set role", 1),
    });
    // ariaAtomic
    Object.defineProperty(Element.prototype, "ariaAtomic", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaAtomic", 0),
        set: __autoFn("set ariaAtomic", 1),
    });
    // ariaAutoComplete
    Object.defineProperty(Element.prototype, "ariaAutoComplete", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaAutoComplete", 0),
        set: __autoFn("set ariaAutoComplete", 1),
    });
    // ariaBusy
    Object.defineProperty(Element.prototype, "ariaBusy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaBusy", 0),
        set: __autoFn("set ariaBusy", 1),
    });
    // ariaBrailleLabel
    Object.defineProperty(Element.prototype, "ariaBrailleLabel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaBrailleLabel", 0),
        set: __autoFn("set ariaBrailleLabel", 1),
    });
    // ariaBrailleRoleDescription
    Object.defineProperty(Element.prototype, "ariaBrailleRoleDescription", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaBrailleRoleDescription", 0),
        set: __autoFn("set ariaBrailleRoleDescription", 1),
    });
    // ariaChecked
    Object.defineProperty(Element.prototype, "ariaChecked", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaChecked", 0),
        set: __autoFn("set ariaChecked", 1),
    });
    // ariaColCount
    Object.defineProperty(Element.prototype, "ariaColCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColCount", 0),
        set: __autoFn("set ariaColCount", 1),
    });
    // ariaColIndex
    Object.defineProperty(Element.prototype, "ariaColIndex", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColIndex", 0),
        set: __autoFn("set ariaColIndex", 1),
    });
    // ariaColSpan
    Object.defineProperty(Element.prototype, "ariaColSpan", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColSpan", 0),
        set: __autoFn("set ariaColSpan", 1),
    });
    // ariaCurrent
    Object.defineProperty(Element.prototype, "ariaCurrent", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaCurrent", 0),
        set: __autoFn("set ariaCurrent", 1),
    });
    // ariaDescription
    Object.defineProperty(Element.prototype, "ariaDescription", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDescription", 0),
        set: __autoFn("set ariaDescription", 1),
    });
    // ariaDisabled
    Object.defineProperty(Element.prototype, "ariaDisabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDisabled", 0),
        set: __autoFn("set ariaDisabled", 1),
    });
    // ariaExpanded
    Object.defineProperty(Element.prototype, "ariaExpanded", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaExpanded", 0),
        set: __autoFn("set ariaExpanded", 1),
    });
    // ariaHasPopup
    Object.defineProperty(Element.prototype, "ariaHasPopup", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaHasPopup", 0),
        set: __autoFn("set ariaHasPopup", 1),
    });
    // ariaHidden
    Object.defineProperty(Element.prototype, "ariaHidden", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaHidden", 0),
        set: __autoFn("set ariaHidden", 1),
    });
    // ariaInvalid
    Object.defineProperty(Element.prototype, "ariaInvalid", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaInvalid", 0),
        set: __autoFn("set ariaInvalid", 1),
    });
    // ariaKeyShortcuts
    Object.defineProperty(Element.prototype, "ariaKeyShortcuts", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaKeyShortcuts", 0),
        set: __autoFn("set ariaKeyShortcuts", 1),
    });
    // ariaLabel
    Object.defineProperty(Element.prototype, "ariaLabel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLabel", 0),
        set: __autoFn("set ariaLabel", 1),
    });
    // ariaLevel
    Object.defineProperty(Element.prototype, "ariaLevel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLevel", 0),
        set: __autoFn("set ariaLevel", 1),
    });
    // ariaLive
    Object.defineProperty(Element.prototype, "ariaLive", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLive", 0),
        set: __autoFn("set ariaLive", 1),
    });
    // ariaModal
    Object.defineProperty(Element.prototype, "ariaModal", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaModal", 0),
        set: __autoFn("set ariaModal", 1),
    });
    // ariaMultiLine
    Object.defineProperty(Element.prototype, "ariaMultiLine", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaMultiLine", 0),
        set: __autoFn("set ariaMultiLine", 1),
    });
    // ariaMultiSelectable
    Object.defineProperty(Element.prototype, "ariaMultiSelectable", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaMultiSelectable", 0),
        set: __autoFn("set ariaMultiSelectable", 1),
    });
    // ariaOrientation
    Object.defineProperty(Element.prototype, "ariaOrientation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaOrientation", 0),
        set: __autoFn("set ariaOrientation", 1),
    });
    // ariaPlaceholder
    Object.defineProperty(Element.prototype, "ariaPlaceholder", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaPlaceholder", 0),
        set: __autoFn("set ariaPlaceholder", 1),
    });
    // ariaPosInSet
    Object.defineProperty(Element.prototype, "ariaPosInSet", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaPosInSet", 0),
        set: __autoFn("set ariaPosInSet", 1),
    });
    // ariaPressed
    Object.defineProperty(Element.prototype, "ariaPressed", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaPressed", 0),
        set: __autoFn("set ariaPressed", 1),
    });
    // ariaReadOnly
    Object.defineProperty(Element.prototype, "ariaReadOnly", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaReadOnly", 0),
        set: __autoFn("set ariaReadOnly", 1),
    });
    // ariaRelevant
    Object.defineProperty(Element.prototype, "ariaRelevant", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRelevant", 0),
        set: __autoFn("set ariaRelevant", 1),
    });
    // ariaRequired
    Object.defineProperty(Element.prototype, "ariaRequired", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRequired", 0),
        set: __autoFn("set ariaRequired", 1),
    });
    // ariaRoleDescription
    Object.defineProperty(Element.prototype, "ariaRoleDescription", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRoleDescription", 0),
        set: __autoFn("set ariaRoleDescription", 1),
    });
    // ariaRowCount
    Object.defineProperty(Element.prototype, "ariaRowCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowCount", 0),
        set: __autoFn("set ariaRowCount", 1),
    });
    // ariaRowIndex
    Object.defineProperty(Element.prototype, "ariaRowIndex", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowIndex", 0),
        set: __autoFn("set ariaRowIndex", 1),
    });
    // ariaRowSpan
    Object.defineProperty(Element.prototype, "ariaRowSpan", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowSpan", 0),
        set: __autoFn("set ariaRowSpan", 1),
    });
    // ariaSelected
    Object.defineProperty(Element.prototype, "ariaSelected", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaSelected", 0),
        set: __autoFn("set ariaSelected", 1),
    });
    // ariaSetSize
    Object.defineProperty(Element.prototype, "ariaSetSize", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaSetSize", 0),
        set: __autoFn("set ariaSetSize", 1),
    });
    // ariaSort
    Object.defineProperty(Element.prototype, "ariaSort", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaSort", 0),
        set: __autoFn("set ariaSort", 1),
    });
    // ariaValueMax
    Object.defineProperty(Element.prototype, "ariaValueMax", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueMax", 0),
        set: __autoFn("set ariaValueMax", 1),
    });
    // ariaValueMin
    Object.defineProperty(Element.prototype, "ariaValueMin", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueMin", 0),
        set: __autoFn("set ariaValueMin", 1),
    });
    // ariaValueNow
    Object.defineProperty(Element.prototype, "ariaValueNow", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueNow", 0),
        set: __autoFn("set ariaValueNow", 1),
    });
    // ariaValueText
    Object.defineProperty(Element.prototype, "ariaValueText", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaValueText", 0),
        set: __autoFn("set ariaValueText", 1),
    });
    // children
    Object.defineProperty(Element.prototype, "children", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get children", 0),
        set: undefined,
    });
    // firstElementChild
    Object.defineProperty(Element.prototype, "firstElementChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get firstElementChild", 0),
        set: undefined,
    });
    // lastElementChild
    Object.defineProperty(Element.prototype, "lastElementChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lastElementChild", 0),
        set: undefined,
    });
    // childElementCount
    Object.defineProperty(Element.prototype, "childElementCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get childElementCount", 0),
        set: undefined,
    });
    // previousElementSibling
    Object.defineProperty(Element.prototype, "previousElementSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get previousElementSibling", 0),
        set: undefined,
    });
    // nextElementSibling
    Object.defineProperty(Element.prototype, "nextElementSibling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get nextElementSibling", 0),
        set: undefined,
    });
    // after
    Object.defineProperty(Element.prototype, "after", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("after", 0),
    });
    // animate
    Object.defineProperty(Element.prototype, "animate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("animate", 1),
    });
    // append
    Object.defineProperty(Element.prototype, "append", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("append", 0),
    });
    // attachShadow
    Object.defineProperty(Element.prototype, "attachShadow", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("attachShadow", 1),
    });
    // before
    Object.defineProperty(Element.prototype, "before", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("before", 0),
    });
    // checkVisibility
    Object.defineProperty(Element.prototype, "checkVisibility", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("checkVisibility", 0),
    });
    // closest
    Object.defineProperty(Element.prototype, "closest", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("closest", 1),
    });
    // computedStyleMap
    Object.defineProperty(Element.prototype, "computedStyleMap", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("computedStyleMap", 0),
    });
    // getAnimations
    Object.defineProperty(Element.prototype, "getAnimations", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAnimations", 0),
    });
    // getAttribute
    Object.defineProperty(Element.prototype, "getAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttribute", 1),
    });
    // getAttributeNS
    Object.defineProperty(Element.prototype, "getAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNS", 2),
    });
    // getAttributeNames
    Object.defineProperty(Element.prototype, "getAttributeNames", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNames", 0),
    });
    // getAttributeNode
    Object.defineProperty(Element.prototype, "getAttributeNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNode", 1),
    });
    // getAttributeNodeNS
    Object.defineProperty(Element.prototype, "getAttributeNodeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAttributeNodeNS", 2),
    });
    // getBoundingClientRect
    Object.defineProperty(Element.prototype, "getBoundingClientRect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getBoundingClientRect", 0),
    });
    // getClientRects
    Object.defineProperty(Element.prototype, "getClientRects", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getClientRects", 0),
    });
    // getElementsByClassName
    Object.defineProperty(Element.prototype, "getElementsByClassName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByClassName", 1),
    });
    // getElementsByTagName
    Object.defineProperty(Element.prototype, "getElementsByTagName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByTagName", 1, function (tagName) {
            var target = String(tagName).toLowerCase();
            var domTree = csvm.memory.Dom;
            var out = [];

            (function walk(node) {
                var d = domTree.get(node);
                if (!d) return;
                for (var i = 0; i < d.childNodes.length; i++) {
                    var child = d.childNodes[i];
                    var cd = domTree.get(child);
                    if (cd.nodeType === 1 && (target === "*" || cd.tag === target)) {
                        out.push(child);
                    }
                    walk(child);
                }
            })(this);          // 从 childNodes 开始，天然不含 this

            return out;
        }),
    });
    // getElementsByTagNameNS
    Object.defineProperty(Element.prototype, "getElementsByTagNameNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByTagNameNS", 2),
    });
    // getHTML
    Object.defineProperty(Element.prototype, "getHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getHTML", 0),
    });
    // hasAttribute
    Object.defineProperty(Element.prototype, "hasAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasAttribute", 1),
    });
    // hasAttributeNS
    Object.defineProperty(Element.prototype, "hasAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasAttributeNS", 2),
    });
    // hasAttributes
    Object.defineProperty(Element.prototype, "hasAttributes", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasAttributes", 0),
    });
    // hasPointerCapture
    Object.defineProperty(Element.prototype, "hasPointerCapture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasPointerCapture", 1),
    });
    // insertAdjacentElement
    Object.defineProperty(Element.prototype, "insertAdjacentElement", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertAdjacentElement", 2),
    });
    // insertAdjacentHTML
    Object.defineProperty(Element.prototype, "insertAdjacentHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertAdjacentHTML", 2),
    });
    // insertAdjacentText
    Object.defineProperty(Element.prototype, "insertAdjacentText", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("insertAdjacentText", 2),
    });
    // matches
    Object.defineProperty(Element.prototype, "matches", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("matches", 1),
    });
    // moveBefore
    Object.defineProperty(Element.prototype, "moveBefore", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("moveBefore", 2),
    });
    // prepend
    Object.defineProperty(Element.prototype, "prepend", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("prepend", 0),
    });
    // querySelector
    Object.defineProperty(Element.prototype, "querySelector", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("querySelector", 1),
    });
    // querySelectorAll
    Object.defineProperty(Element.prototype, "querySelectorAll", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("querySelectorAll", 1),
    });
    // releasePointerCapture
    Object.defineProperty(Element.prototype, "releasePointerCapture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("releasePointerCapture", 1),
    });
    // remove
    Object.defineProperty(Element.prototype, "remove", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("remove", 0),
    });
    // removeAttribute
    Object.defineProperty(Element.prototype, "removeAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeAttribute", 1),
    });
    // removeAttributeNS
    Object.defineProperty(Element.prototype, "removeAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeAttributeNS", 2),
    });
    // removeAttributeNode
    Object.defineProperty(Element.prototype, "removeAttributeNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeAttributeNode", 1),
    });
    // replaceChildren
    Object.defineProperty(Element.prototype, "replaceChildren", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceChildren", 0),
    });
    // replaceWith
    Object.defineProperty(Element.prototype, "replaceWith", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceWith", 0),
    });
    // requestFullscreen
    Object.defineProperty(Element.prototype, "requestFullscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestFullscreen", 0),
    });
    // requestPointerLock
    Object.defineProperty(Element.prototype, "requestPointerLock", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestPointerLock", 0),
    });
    // scroll
    Object.defineProperty(Element.prototype, "scroll", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scroll", 0),
    });
    // scrollBy
    Object.defineProperty(Element.prototype, "scrollBy", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollBy", 0),
    });
    // scrollIntoView
    Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollIntoView", 0),
    });
    // scrollIntoViewIfNeeded
    Object.defineProperty(Element.prototype, "scrollIntoViewIfNeeded", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollIntoViewIfNeeded", 0),
    });
    // scrollTo
    Object.defineProperty(Element.prototype, "scrollTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scrollTo", 0),
    });
    // setAttribute
    Object.defineProperty(Element.prototype, "setAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttribute", 2),
    });
    // setAttributeNS
    Object.defineProperty(Element.prototype, "setAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttributeNS", 3),
    });
    // setAttributeNode
    Object.defineProperty(Element.prototype, "setAttributeNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttributeNode", 1),
    });
    // setAttributeNodeNS
    Object.defineProperty(Element.prototype, "setAttributeNodeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAttributeNodeNS", 1),
    });
    // setHTMLUnsafe
    Object.defineProperty(Element.prototype, "setHTMLUnsafe", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setHTMLUnsafe", 1),
    });
    // setPointerCapture
    Object.defineProperty(Element.prototype, "setPointerCapture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setPointerCapture", 1),
    });
    // startViewTransition
    Object.defineProperty(Element.prototype, "startViewTransition", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("startViewTransition", 0),
    });
    // toggleAttribute
    Object.defineProperty(Element.prototype, "toggleAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("toggleAttribute", 1),
    });
    // webkitMatchesSelector
    Object.defineProperty(Element.prototype, "webkitMatchesSelector", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitMatchesSelector", 1),
    });
    // webkitRequestFullScreen
    Object.defineProperty(Element.prototype, "webkitRequestFullScreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitRequestFullScreen", 0),
    });
    // webkitRequestFullscreen
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitRequestFullscreen", 0),
    });
    // currentCSSZoom
    Object.defineProperty(Element.prototype, "currentCSSZoom", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get currentCSSZoom", 0),
        set: undefined,
    });
    // ariaColIndexText
    Object.defineProperty(Element.prototype, "ariaColIndexText", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaColIndexText", 0),
        set: __autoFn("set ariaColIndexText", 1),
    });
    // ariaRowIndexText
    Object.defineProperty(Element.prototype, "ariaRowIndexText", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaRowIndexText", 0),
        set: __autoFn("set ariaRowIndexText", 1),
    });
    // ariaActionsElements
    Object.defineProperty(Element.prototype, "ariaActionsElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaActionsElements", 0),
        set: __autoFn("set ariaActionsElements", 1),
    });
    // ariaActiveDescendantElement
    Object.defineProperty(Element.prototype, "ariaActiveDescendantElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaActiveDescendantElement", 0),
        set: __autoFn("set ariaActiveDescendantElement", 1),
    });
    // ariaControlsElements
    Object.defineProperty(Element.prototype, "ariaControlsElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaControlsElements", 0),
        set: __autoFn("set ariaControlsElements", 1),
    });
    // ariaDescribedByElements
    Object.defineProperty(Element.prototype, "ariaDescribedByElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDescribedByElements", 0),
        set: __autoFn("set ariaDescribedByElements", 1),
    });
    // ariaDetailsElements
    Object.defineProperty(Element.prototype, "ariaDetailsElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaDetailsElements", 0),
        set: __autoFn("set ariaDetailsElements", 1),
    });
    // ariaErrorMessageElements
    Object.defineProperty(Element.prototype, "ariaErrorMessageElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaErrorMessageElements", 0),
        set: __autoFn("set ariaErrorMessageElements", 1),
    });
    // ariaFlowToElements
    Object.defineProperty(Element.prototype, "ariaFlowToElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaFlowToElements", 0),
        set: __autoFn("set ariaFlowToElements", 1),
    });
    // ariaLabelledByElements
    Object.defineProperty(Element.prototype, "ariaLabelledByElements", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ariaLabelledByElements", 0),
        set: __autoFn("set ariaLabelledByElements", 1),
    });
    // ariaNotify
    Object.defineProperty(Element.prototype, "ariaNotify", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("ariaNotify", 1),
    });
    // pseudo
    Object.defineProperty(Element.prototype, "pseudo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("pseudo", 1),
    });
    // setHTML
    Object.defineProperty(Element.prototype, "setHTML", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setHTML", 1),
    });
    // TODO constructor: Element.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Element.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Element",
    });
    // Symbol(Symbol.unscopables) (symbol)
    Object.defineProperty(Element.prototype, Symbol.unscopables, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: Object.assign(Object.create(null), {
            ["after"]: true,
            ["append"]: true,
            ["before"]: true,
            ["prepend"]: true,
            ["remove"]: true,
            ["replaceChildren"]: true,
            ["replaceWith"]: true,
            ["slot"]: true,
        }),
    });
})();
/* #endregion AUTO:Element.prototype */

Element.prototype.__proto__ = Node.prototype;
Element = csvm.proxy(Element, "Element");