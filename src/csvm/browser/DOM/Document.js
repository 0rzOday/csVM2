var Document = function Document() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Document, "Document");
Object.defineProperty(Document.prototype, Symbol.toStringTag, { value: "Document", configurable: true });

/* #region AUTO:Document.prototype */
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
    // implementation
    Object.defineProperty(Document.prototype, "implementation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get implementation", 0),
        set: undefined,
    });
    // URL
    Object.defineProperty(Document.prototype, "URL", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get URL", 0),
        set: undefined,
    });
    // documentURI
    Object.defineProperty(Document.prototype, "documentURI", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get documentURI", 0),
        set: undefined,
    });
    // compatMode
    Object.defineProperty(Document.prototype, "compatMode", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get compatMode", 0),
        set: undefined,
    });
    // characterSet
    Object.defineProperty(Document.prototype, "characterSet", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get characterSet", 0, function () {
            return "UTF-8";
        }),
        set: undefined,
    });
    // charset
    Object.defineProperty(Document.prototype, "charset", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get charset", 0),
        set: undefined,
    });
    // inputEncoding
    Object.defineProperty(Document.prototype, "inputEncoding", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get inputEncoding", 0),
        set: undefined,
    });
    // contentType
    Object.defineProperty(Document.prototype, "contentType", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get contentType", 0),
        set: undefined,
    });
    // doctype
    Object.defineProperty(Document.prototype, "doctype", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get doctype", 0),
        set: undefined,
    });
    // documentElement
    Object.defineProperty(Document.prototype, "documentElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get documentElement", 0, function () {
            // 返回第一个nodeType为1也就是dom节点的node
            var thisNode = csvm.memory.Dom.get(this);
            if (!thisNode) return null;
            for (var i = 0; i < thisNode["childNodes"]["length"]; i++) {
                var cd = csvm.memory.Dom.get(thisNode.childNodes[i]);
                if (cd && cd.nodeType === 1) return thisNode.childNodes[i];
            }
            return null;
        }),
        set: undefined,
    });
    // xmlEncoding
    Object.defineProperty(Document.prototype, "xmlEncoding", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get xmlEncoding", 0),
        set: undefined,
    });
    // xmlVersion
    Object.defineProperty(Document.prototype, "xmlVersion", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get xmlVersion", 0),
        set: __autoFn("set xmlVersion", 1),
    });
    // xmlStandalone
    Object.defineProperty(Document.prototype, "xmlStandalone", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get xmlStandalone", 0),
        set: __autoFn("set xmlStandalone", 1),
    });
    // domain
    Object.defineProperty(Document.prototype, "domain", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get domain", 0),
        set: __autoFn("set domain", 1),
    });
    // referrer
    Object.defineProperty(Document.prototype, "referrer", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get referrer", 0),
        set: undefined,
    });
    // cookie
    Object.defineProperty(Document.prototype, "cookie", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get cookie", 0,function(){
            return csvm.memory.cookie;
        }),
        set: __autoFn("set cookie", 1,function(cookie){
            csvm.memory.cookie=cookie;
        }),
    });
    // lastModified
    Object.defineProperty(Document.prototype, "lastModified", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lastModified", 0),
        set: undefined,
    });
    // readyState
    Object.defineProperty(Document.prototype, "readyState", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get readyState", 0),
        set: undefined,
    });
    // title
    Object.defineProperty(Document.prototype, "title", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get title", 0),
        set: __autoFn("set title", 1),
    });
    // dir
    Object.defineProperty(Document.prototype, "dir", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get dir", 0),
        set: __autoFn("set dir", 1),
    });
    // body
    Object.defineProperty(Document.prototype, "body", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get body", 0),
        set: __autoFn("set body", 1),
    });
    // head
    Object.defineProperty(Document.prototype, "head", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get head", 0),
        set: undefined,
    });
    // images
    Object.defineProperty(Document.prototype, "images", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get images", 0),
        set: undefined,
    });
    // embeds
    Object.defineProperty(Document.prototype, "embeds", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get embeds", 0),
        set: undefined,
    });
    // plugins
    Object.defineProperty(Document.prototype, "plugins", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get plugins", 0),
        set: undefined,
    });
    // links
    Object.defineProperty(Document.prototype, "links", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get links", 0),
        set: undefined,
    });
    // forms
    Object.defineProperty(Document.prototype, "forms", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get forms", 0),
        set: undefined,
    });
    // scripts
    Object.defineProperty(Document.prototype, "scripts", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scripts", 0),
        set: undefined,
    });
    // currentScript
    Object.defineProperty(Document.prototype, "currentScript", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get currentScript", 0),
        set: undefined,
    });
    // defaultView
    Object.defineProperty(Document.prototype, "defaultView", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get defaultView", 0),
        set: undefined,
    });
    // designMode
    Object.defineProperty(Document.prototype, "designMode", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get designMode", 0),
        set: __autoFn("set designMode", 1),
    });
    // onreadystatechange
    Object.defineProperty(Document.prototype, "onreadystatechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onreadystatechange", 0),
        set: __autoFn("set onreadystatechange", 1),
    });
    // anchors
    Object.defineProperty(Document.prototype, "anchors", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get anchors", 0),
        set: undefined,
    });
    // applets
    Object.defineProperty(Document.prototype, "applets", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get applets", 0),
        set: undefined,
    });
    // fgColor
    Object.defineProperty(Document.prototype, "fgColor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fgColor", 0),
        set: __autoFn("set fgColor", 1),
    });
    // linkColor
    Object.defineProperty(Document.prototype, "linkColor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get linkColor", 0),
        set: __autoFn("set linkColor", 1),
    });
    // vlinkColor
    Object.defineProperty(Document.prototype, "vlinkColor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get vlinkColor", 0),
        set: __autoFn("set vlinkColor", 1),
    });
    // alinkColor
    Object.defineProperty(Document.prototype, "alinkColor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get alinkColor", 0),
        set: __autoFn("set alinkColor", 1),
    });
    // bgColor
    Object.defineProperty(Document.prototype, "bgColor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get bgColor", 0),
        set: __autoFn("set bgColor", 1),
    });
    // all
    Object.defineProperty(Document.prototype, "all", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get all", 0),
        set: undefined,
    });
    // scrollingElement
    Object.defineProperty(Document.prototype, "scrollingElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scrollingElement", 0),
        set: undefined,
    });
    // onpointerlockchange
    Object.defineProperty(Document.prototype, "onpointerlockchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerlockchange", 0),
        set: __autoFn("set onpointerlockchange", 1),
    });
    // onpointerlockerror
    Object.defineProperty(Document.prototype, "onpointerlockerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerlockerror", 0),
        set: __autoFn("set onpointerlockerror", 1),
    });
    // hidden
    Object.defineProperty(Document.prototype, "hidden", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get hidden", 0),
        set: undefined,
    });
    // visibilityState
    Object.defineProperty(Document.prototype, "visibilityState", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get visibilityState", 0),
        set: undefined,
    });
    // wasDiscarded
    Object.defineProperty(Document.prototype, "wasDiscarded", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get wasDiscarded", 0),
        set: undefined,
    });
    // prerendering
    Object.defineProperty(Document.prototype, "prerendering", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get prerendering", 0),
        set: undefined,
    });
    // featurePolicy
    Object.defineProperty(Document.prototype, "featurePolicy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get featurePolicy", 0),
        set: undefined,
    });
    // webkitVisibilityState
    Object.defineProperty(Document.prototype, "webkitVisibilityState", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitVisibilityState", 0),
        set: undefined,
    });
    // webkitHidden
    Object.defineProperty(Document.prototype, "webkitHidden", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitHidden", 0),
        set: undefined,
    });
    // onbeforecopy
    Object.defineProperty(Document.prototype, "onbeforecopy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforecopy", 0),
        set: __autoFn("set onbeforecopy", 1),
    });
    // onbeforecut
    Object.defineProperty(Document.prototype, "onbeforecut", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforecut", 0),
        set: __autoFn("set onbeforecut", 1),
    });
    // onbeforepaste
    Object.defineProperty(Document.prototype, "onbeforepaste", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforepaste", 0),
        set: __autoFn("set onbeforepaste", 1),
    });
    // onfreeze
    Object.defineProperty(Document.prototype, "onfreeze", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfreeze", 0),
        set: __autoFn("set onfreeze", 1),
    });
    // onprerenderingchange
    Object.defineProperty(Document.prototype, "onprerenderingchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onprerenderingchange", 0),
        set: __autoFn("set onprerenderingchange", 1),
    });
    // onresume
    Object.defineProperty(Document.prototype, "onresume", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onresume", 0),
        set: __autoFn("set onresume", 1),
    });
    // onsearch
    Object.defineProperty(Document.prototype, "onsearch", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onsearch", 0),
        set: __autoFn("set onsearch", 1),
    });
    // onvisibilitychange
    Object.defineProperty(Document.prototype, "onvisibilitychange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onvisibilitychange", 0),
        set: __autoFn("set onvisibilitychange", 1),
    });
    // timeline
    Object.defineProperty(Document.prototype, "timeline", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get timeline", 0),
        set: undefined,
    });
    // fullscreenEnabled
    Object.defineProperty(Document.prototype, "fullscreenEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fullscreenEnabled", 0),
        set: __autoFn("set fullscreenEnabled", 1),
    });
    // fullscreen
    Object.defineProperty(Document.prototype, "fullscreen", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fullscreen", 0),
        set: __autoFn("set fullscreen", 1),
    });
    // onfullscreenchange
    Object.defineProperty(Document.prototype, "onfullscreenchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfullscreenchange", 0),
        set: __autoFn("set onfullscreenchange", 1),
    });
    // onfullscreenerror
    Object.defineProperty(Document.prototype, "onfullscreenerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfullscreenerror", 0),
        set: __autoFn("set onfullscreenerror", 1),
    });
    // webkitIsFullScreen
    Object.defineProperty(Document.prototype, "webkitIsFullScreen", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitIsFullScreen", 0),
        set: undefined,
    });
    // webkitCurrentFullScreenElement
    Object.defineProperty(Document.prototype, "webkitCurrentFullScreenElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitCurrentFullScreenElement", 0),
        set: undefined,
    });
    // webkitFullscreenEnabled
    Object.defineProperty(Document.prototype, "webkitFullscreenEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitFullscreenEnabled", 0),
        set: undefined,
    });
    // webkitFullscreenElement
    Object.defineProperty(Document.prototype, "webkitFullscreenElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitFullscreenElement", 0),
        set: undefined,
    });
    // onwebkitfullscreenchange
    Object.defineProperty(Document.prototype, "onwebkitfullscreenchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitfullscreenchange", 0),
        set: __autoFn("set onwebkitfullscreenchange", 1),
    });
    // onwebkitfullscreenerror
    Object.defineProperty(Document.prototype, "onwebkitfullscreenerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitfullscreenerror", 0),
        set: __autoFn("set onwebkitfullscreenerror", 1),
    });
    // rootElement
    Object.defineProperty(Document.prototype, "rootElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get rootElement", 0),
        set: undefined,
    });
    // activeViewTransition
    Object.defineProperty(Document.prototype, "activeViewTransition", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get activeViewTransition", 0),
        set: undefined,
    });
    // pictureInPictureEnabled
    Object.defineProperty(Document.prototype, "pictureInPictureEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get pictureInPictureEnabled", 0),
        set: undefined,
    });
    // onabort
    Object.defineProperty(Document.prototype, "onabort", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onabort", 0),
        set: __autoFn("set onabort", 1),
    });
    // onbeforeinput
    Object.defineProperty(Document.prototype, "onbeforeinput", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforeinput", 0),
        set: __autoFn("set onbeforeinput", 1),
    });
    // onbeforematch
    Object.defineProperty(Document.prototype, "onbeforematch", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforematch", 0),
        set: __autoFn("set onbeforematch", 1),
    });
    // onbeforetoggle
    Object.defineProperty(Document.prototype, "onbeforetoggle", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforetoggle", 0),
        set: __autoFn("set onbeforetoggle", 1),
    });
    // onblur
    Object.defineProperty(Document.prototype, "onblur", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onblur", 0),
        set: __autoFn("set onblur", 1),
    });
    // oncancel
    Object.defineProperty(Document.prototype, "oncancel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncancel", 0),
        set: __autoFn("set oncancel", 1),
    });
    // oncanplay
    Object.defineProperty(Document.prototype, "oncanplay", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncanplay", 0),
        set: __autoFn("set oncanplay", 1),
    });
    // oncanplaythrough
    Object.defineProperty(Document.prototype, "oncanplaythrough", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncanplaythrough", 0),
        set: __autoFn("set oncanplaythrough", 1),
    });
    // onchange
    Object.defineProperty(Document.prototype, "onchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onchange", 0),
        set: __autoFn("set onchange", 1),
    });
    // onclick
    Object.defineProperty(Document.prototype, "onclick", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onclick", 0),
        set: __autoFn("set onclick", 1),
    });
    // onclose
    Object.defineProperty(Document.prototype, "onclose", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onclose", 0),
        set: __autoFn("set onclose", 1),
    });
    // oncommand
    Object.defineProperty(Document.prototype, "oncommand", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncommand", 0),
        set: __autoFn("set oncommand", 1),
    });
    // oncontentvisibilityautostatechange
    Object.defineProperty(Document.prototype, "oncontentvisibilityautostatechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncontentvisibilityautostatechange", 0),
        set: __autoFn("set oncontentvisibilityautostatechange", 1),
    });
    // oncontextlost
    Object.defineProperty(Document.prototype, "oncontextlost", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncontextlost", 0),
        set: __autoFn("set oncontextlost", 1),
    });
    // oncontextmenu
    Object.defineProperty(Document.prototype, "oncontextmenu", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncontextmenu", 0),
        set: __autoFn("set oncontextmenu", 1),
    });
    // oncontextrestored
    Object.defineProperty(Document.prototype, "oncontextrestored", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncontextrestored", 0),
        set: __autoFn("set oncontextrestored", 1),
    });
    // oncuechange
    Object.defineProperty(Document.prototype, "oncuechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncuechange", 0),
        set: __autoFn("set oncuechange", 1),
    });
    // ondblclick
    Object.defineProperty(Document.prototype, "ondblclick", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondblclick", 0),
        set: __autoFn("set ondblclick", 1),
    });
    // ondrag
    Object.defineProperty(Document.prototype, "ondrag", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondrag", 0),
        set: __autoFn("set ondrag", 1),
    });
    // ondragend
    Object.defineProperty(Document.prototype, "ondragend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondragend", 0),
        set: __autoFn("set ondragend", 1),
    });
    // ondragenter
    Object.defineProperty(Document.prototype, "ondragenter", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondragenter", 0),
        set: __autoFn("set ondragenter", 1),
    });
    // ondragleave
    Object.defineProperty(Document.prototype, "ondragleave", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondragleave", 0),
        set: __autoFn("set ondragleave", 1),
    });
    // ondragover
    Object.defineProperty(Document.prototype, "ondragover", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondragover", 0),
        set: __autoFn("set ondragover", 1),
    });
    // ondragstart
    Object.defineProperty(Document.prototype, "ondragstart", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondragstart", 0),
        set: __autoFn("set ondragstart", 1),
    });
    // ondrop
    Object.defineProperty(Document.prototype, "ondrop", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondrop", 0),
        set: __autoFn("set ondrop", 1),
    });
    // ondurationchange
    Object.defineProperty(Document.prototype, "ondurationchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ondurationchange", 0),
        set: __autoFn("set ondurationchange", 1),
    });
    // onemptied
    Object.defineProperty(Document.prototype, "onemptied", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onemptied", 0),
        set: __autoFn("set onemptied", 1),
    });
    // onended
    Object.defineProperty(Document.prototype, "onended", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onended", 0),
        set: __autoFn("set onended", 1),
    });
    // onerror
    Object.defineProperty(Document.prototype, "onerror", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onerror", 0),
        set: __autoFn("set onerror", 1),
    });
    // onfocus
    Object.defineProperty(Document.prototype, "onfocus", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onfocus", 0),
        set: __autoFn("set onfocus", 1),
    });
    // onformdata
    Object.defineProperty(Document.prototype, "onformdata", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onformdata", 0),
        set: __autoFn("set onformdata", 1),
    });
    // oninput
    Object.defineProperty(Document.prototype, "oninput", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oninput", 0),
        set: __autoFn("set oninput", 1),
    });
    // oninvalid
    Object.defineProperty(Document.prototype, "oninvalid", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oninvalid", 0),
        set: __autoFn("set oninvalid", 1),
    });
    // onkeydown
    Object.defineProperty(Document.prototype, "onkeydown", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onkeydown", 0),
        set: __autoFn("set onkeydown", 1),
    });
    // onkeypress
    Object.defineProperty(Document.prototype, "onkeypress", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onkeypress", 0),
        set: __autoFn("set onkeypress", 1),
    });
    // onkeyup
    Object.defineProperty(Document.prototype, "onkeyup", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onkeyup", 0),
        set: __autoFn("set onkeyup", 1),
    });
    // onload
    Object.defineProperty(Document.prototype, "onload", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onload", 0),
        set: __autoFn("set onload", 1),
    });
    // onloadeddata
    Object.defineProperty(Document.prototype, "onloadeddata", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onloadeddata", 0),
        set: __autoFn("set onloadeddata", 1),
    });
    // onloadedmetadata
    Object.defineProperty(Document.prototype, "onloadedmetadata", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onloadedmetadata", 0),
        set: __autoFn("set onloadedmetadata", 1),
    });
    // onloadstart
    Object.defineProperty(Document.prototype, "onloadstart", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onloadstart", 0),
        set: __autoFn("set onloadstart", 1),
    });
    // onmousedown
    Object.defineProperty(Document.prototype, "onmousedown", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmousedown", 0),
        set: __autoFn("set onmousedown", 1),
    });
    // onmouseenter
    Object.defineProperty(Document.prototype, "onmouseenter", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmouseenter", 0),
        set: __autoFn("set onmouseenter", 1),
    });
    // onmouseleave
    Object.defineProperty(Document.prototype, "onmouseleave", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmouseleave", 0),
        set: __autoFn("set onmouseleave", 1),
    });
    // onmousemove
    Object.defineProperty(Document.prototype, "onmousemove", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmousemove", 0),
        set: __autoFn("set onmousemove", 1),
    });
    // onmouseout
    Object.defineProperty(Document.prototype, "onmouseout", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmouseout", 0),
        set: __autoFn("set onmouseout", 1),
    });
    // onmouseover
    Object.defineProperty(Document.prototype, "onmouseover", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmouseover", 0),
        set: __autoFn("set onmouseover", 1),
    });
    // onmouseup
    Object.defineProperty(Document.prototype, "onmouseup", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmouseup", 0),
        set: __autoFn("set onmouseup", 1),
    });
    // onmousewheel
    Object.defineProperty(Document.prototype, "onmousewheel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onmousewheel", 0),
        set: __autoFn("set onmousewheel", 1),
    });
    // onpause
    Object.defineProperty(Document.prototype, "onpause", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpause", 0),
        set: __autoFn("set onpause", 1),
    });
    // onplay
    Object.defineProperty(Document.prototype, "onplay", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onplay", 0),
        set: __autoFn("set onplay", 1),
    });
    // onplaying
    Object.defineProperty(Document.prototype, "onplaying", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onplaying", 0),
        set: __autoFn("set onplaying", 1),
    });
    // onprogress
    Object.defineProperty(Document.prototype, "onprogress", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onprogress", 0),
        set: __autoFn("set onprogress", 1),
    });
    // onratechange
    Object.defineProperty(Document.prototype, "onratechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onratechange", 0),
        set: __autoFn("set onratechange", 1),
    });
    // onreset
    Object.defineProperty(Document.prototype, "onreset", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onreset", 0),
        set: __autoFn("set onreset", 1),
    });
    // onresize
    Object.defineProperty(Document.prototype, "onresize", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onresize", 0),
        set: __autoFn("set onresize", 1),
    });
    // onscroll
    Object.defineProperty(Document.prototype, "onscroll", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onscroll", 0),
        set: __autoFn("set onscroll", 1),
    });
    // onscrollend
    Object.defineProperty(Document.prototype, "onscrollend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onscrollend", 0),
        set: __autoFn("set onscrollend", 1),
    });
    // onsecuritypolicyviolation
    Object.defineProperty(Document.prototype, "onsecuritypolicyviolation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onsecuritypolicyviolation", 0),
        set: __autoFn("set onsecuritypolicyviolation", 1),
    });
    // onseeked
    Object.defineProperty(Document.prototype, "onseeked", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onseeked", 0),
        set: __autoFn("set onseeked", 1),
    });
    // onseeking
    Object.defineProperty(Document.prototype, "onseeking", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onseeking", 0),
        set: __autoFn("set onseeking", 1),
    });
    // onselect
    Object.defineProperty(Document.prototype, "onselect", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onselect", 0),
        set: __autoFn("set onselect", 1),
    });
    // onslotchange
    Object.defineProperty(Document.prototype, "onslotchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onslotchange", 0),
        set: __autoFn("set onslotchange", 1),
    });
    // onstalled
    Object.defineProperty(Document.prototype, "onstalled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onstalled", 0),
        set: __autoFn("set onstalled", 1),
    });
    // onsubmit
    Object.defineProperty(Document.prototype, "onsubmit", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onsubmit", 0),
        set: __autoFn("set onsubmit", 1),
    });
    // onsuspend
    Object.defineProperty(Document.prototype, "onsuspend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onsuspend", 0),
        set: __autoFn("set onsuspend", 1),
    });
    // ontimeupdate
    Object.defineProperty(Document.prototype, "ontimeupdate", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ontimeupdate", 0),
        set: __autoFn("set ontimeupdate", 1),
    });
    // ontoggle
    Object.defineProperty(Document.prototype, "ontoggle", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ontoggle", 0),
        set: __autoFn("set ontoggle", 1),
    });
    // onvolumechange
    Object.defineProperty(Document.prototype, "onvolumechange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onvolumechange", 0),
        set: __autoFn("set onvolumechange", 1),
    });
    // onwaiting
    Object.defineProperty(Document.prototype, "onwaiting", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwaiting", 0),
        set: __autoFn("set onwaiting", 1),
    });
    // onwebkitanimationend
    Object.defineProperty(Document.prototype, "onwebkitanimationend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitanimationend", 0),
        set: __autoFn("set onwebkitanimationend", 1),
    });
    // onwebkitanimationiteration
    Object.defineProperty(Document.prototype, "onwebkitanimationiteration", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitanimationiteration", 0),
        set: __autoFn("set onwebkitanimationiteration", 1),
    });
    // onwebkitanimationstart
    Object.defineProperty(Document.prototype, "onwebkitanimationstart", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkitanimationstart", 0),
        set: __autoFn("set onwebkitanimationstart", 1),
    });
    // onwebkittransitionend
    Object.defineProperty(Document.prototype, "onwebkittransitionend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwebkittransitionend", 0),
        set: __autoFn("set onwebkittransitionend", 1),
    });
    // onwheel
    Object.defineProperty(Document.prototype, "onwheel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onwheel", 0),
        set: __autoFn("set onwheel", 1),
    });
    // onauxclick
    Object.defineProperty(Document.prototype, "onauxclick", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onauxclick", 0),
        set: __autoFn("set onauxclick", 1),
    });
    // ongotpointercapture
    Object.defineProperty(Document.prototype, "ongotpointercapture", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ongotpointercapture", 0),
        set: __autoFn("set ongotpointercapture", 1),
    });
    // onlostpointercapture
    Object.defineProperty(Document.prototype, "onlostpointercapture", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onlostpointercapture", 0),
        set: __autoFn("set onlostpointercapture", 1),
    });
    // onpointerdown
    Object.defineProperty(Document.prototype, "onpointerdown", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerdown", 0),
        set: __autoFn("set onpointerdown", 1),
    });
    // onpointermove
    Object.defineProperty(Document.prototype, "onpointermove", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointermove", 0),
        set: __autoFn("set onpointermove", 1),
    });
    // onpointerup
    Object.defineProperty(Document.prototype, "onpointerup", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerup", 0),
        set: __autoFn("set onpointerup", 1),
    });
    // onpointercancel
    Object.defineProperty(Document.prototype, "onpointercancel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointercancel", 0),
        set: __autoFn("set onpointercancel", 1),
    });
    // onpointerover
    Object.defineProperty(Document.prototype, "onpointerover", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerover", 0),
        set: __autoFn("set onpointerover", 1),
    });
    // onpointerout
    Object.defineProperty(Document.prototype, "onpointerout", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerout", 0),
        set: __autoFn("set onpointerout", 1),
    });
    // onpointerenter
    Object.defineProperty(Document.prototype, "onpointerenter", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerenter", 0),
        set: __autoFn("set onpointerenter", 1),
    });
    // onpointerleave
    Object.defineProperty(Document.prototype, "onpointerleave", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpointerleave", 0),
        set: __autoFn("set onpointerleave", 1),
    });
    // onselectstart
    Object.defineProperty(Document.prototype, "onselectstart", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onselectstart", 0),
        set: __autoFn("set onselectstart", 1),
    });
    // onselectionchange
    Object.defineProperty(Document.prototype, "onselectionchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onselectionchange", 0),
        set: __autoFn("set onselectionchange", 1),
    });
    // onanimationcancel
    Object.defineProperty(Document.prototype, "onanimationcancel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onanimationcancel", 0),
        set: __autoFn("set onanimationcancel", 1),
    });
    // onanimationend
    Object.defineProperty(Document.prototype, "onanimationend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onanimationend", 0),
        set: __autoFn("set onanimationend", 1),
    });
    // onanimationiteration
    Object.defineProperty(Document.prototype, "onanimationiteration", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onanimationiteration", 0),
        set: __autoFn("set onanimationiteration", 1),
    });
    // onanimationstart
    Object.defineProperty(Document.prototype, "onanimationstart", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onanimationstart", 0),
        set: __autoFn("set onanimationstart", 1),
    });
    // ontransitionrun
    Object.defineProperty(Document.prototype, "ontransitionrun", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ontransitionrun", 0),
        set: __autoFn("set ontransitionrun", 1),
    });
    // ontransitionstart
    Object.defineProperty(Document.prototype, "ontransitionstart", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ontransitionstart", 0),
        set: __autoFn("set ontransitionstart", 1),
    });
    // ontransitionend
    Object.defineProperty(Document.prototype, "ontransitionend", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ontransitionend", 0),
        set: __autoFn("set ontransitionend", 1),
    });
    // ontransitioncancel
    Object.defineProperty(Document.prototype, "ontransitioncancel", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ontransitioncancel", 0),
        set: __autoFn("set ontransitioncancel", 1),
    });
    // onbeforexrselect
    Object.defineProperty(Document.prototype, "onbeforexrselect", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onbeforexrselect", 0),
        set: __autoFn("set onbeforexrselect", 1),
    });
    // oncopy
    Object.defineProperty(Document.prototype, "oncopy", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncopy", 0),
        set: __autoFn("set oncopy", 1),
    });
    // oncut
    Object.defineProperty(Document.prototype, "oncut", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get oncut", 0),
        set: __autoFn("set oncut", 1),
    });
    // onpaste
    Object.defineProperty(Document.prototype, "onpaste", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpaste", 0),
        set: __autoFn("set onpaste", 1),
    });
    // children
    Object.defineProperty(Document.prototype, "children", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get children", 0),
        set: undefined,
    });
    // firstElementChild
    Object.defineProperty(Document.prototype, "firstElementChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get firstElementChild", 0),
        set: undefined,
    });
    // lastElementChild
    Object.defineProperty(Document.prototype, "lastElementChild", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lastElementChild", 0),
        set: undefined,
    });
    // childElementCount
    Object.defineProperty(Document.prototype, "childElementCount", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get childElementCount", 0),
        set: undefined,
    });
    // activeElement
    Object.defineProperty(Document.prototype, "activeElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get activeElement", 0),
        set: undefined,
    });
    // styleSheets
    Object.defineProperty(Document.prototype, "styleSheets", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get styleSheets", 0),
        set: undefined,
    });
    // pointerLockElement
    Object.defineProperty(Document.prototype, "pointerLockElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get pointerLockElement", 0),
        set: undefined,
    });
    // fullscreenElement
    Object.defineProperty(Document.prototype, "fullscreenElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fullscreenElement", 0),
        set: __autoFn("set fullscreenElement", 1),
    });
    // adoptedStyleSheets
    Object.defineProperty(Document.prototype, "adoptedStyleSheets", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get adoptedStyleSheets", 0),
        set: __autoFn("set adoptedStyleSheets", 1),
    });
    // pictureInPictureElement
    Object.defineProperty(Document.prototype, "pictureInPictureElement", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get pictureInPictureElement", 0),
        set: undefined,
    });
    // customElementRegistry
    Object.defineProperty(Document.prototype, "customElementRegistry", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get customElementRegistry", 0),
        set: undefined,
    });
    // fonts
    Object.defineProperty(Document.prototype, "fonts", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fonts", 0),
        set: undefined,
    });
    // adoptNode
    Object.defineProperty(Document.prototype, "adoptNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("adoptNode", 1),
    });
    // append
    Object.defineProperty(Document.prototype, "append", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("append", 0),
    });
    // captureEvents
    Object.defineProperty(Document.prototype, "captureEvents", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("captureEvents", 0),
    });
    // caretPositionFromPoint
    Object.defineProperty(Document.prototype, "caretPositionFromPoint", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("caretPositionFromPoint", 2),
    });
    // caretRangeFromPoint
    Object.defineProperty(Document.prototype, "caretRangeFromPoint", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("caretRangeFromPoint", 0),
    });
    // clear
    Object.defineProperty(Document.prototype, "clear", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("clear", 0),
    });
    // close
    Object.defineProperty(Document.prototype, "close", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("close", 0),
    });
    // createAttribute
    Object.defineProperty(Document.prototype, "createAttribute", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createAttribute", 1),
    });
    // createAttributeNS
    Object.defineProperty(Document.prototype, "createAttributeNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createAttributeNS", 2),
    });
    // createCDATASection
    Object.defineProperty(Document.prototype, "createCDATASection", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createCDATASection", 1),
    });
    // createComment
    Object.defineProperty(Document.prototype, "createComment", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createComment", 1),
    });
    // createDocumentFragment
    Object.defineProperty(Document.prototype, "createDocumentFragment", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createDocumentFragment", 0),
    });
    // createElement
    Object.defineProperty(Document.prototype, "createElement", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createElement", 1, function (localName) {
            // 全部转为小写
            var localName = String(localName).toLowerCase();
            // 创建新node到csvm.memory.Dom
            const newNode = csvm.DomGenerator(localName, {}, null)
            return newNode;
        }),
    });
    // createElementNS
    Object.defineProperty(Document.prototype, "createElementNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createElementNS", 2),
    });
    // createEvent
    Object.defineProperty(Document.prototype, "createEvent", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createEvent", 1),
    });
    // createExpression
    Object.defineProperty(Document.prototype, "createExpression", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createExpression", 1),
    });
    // createNSResolver
    Object.defineProperty(Document.prototype, "createNSResolver", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createNSResolver", 1),
    });
    // createNodeIterator
    Object.defineProperty(Document.prototype, "createNodeIterator", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createNodeIterator", 1),
    });
    // createProcessingInstruction
    Object.defineProperty(Document.prototype, "createProcessingInstruction", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createProcessingInstruction", 2),
    });
    // createRange
    Object.defineProperty(Document.prototype, "createRange", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createRange", 0),
    });
    // createTextNode
    Object.defineProperty(Document.prototype, "createTextNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createTextNode", 1),
    });
    // createTreeWalker
    Object.defineProperty(Document.prototype, "createTreeWalker", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createTreeWalker", 1),
    });
    // elementFromPoint
    Object.defineProperty(Document.prototype, "elementFromPoint", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("elementFromPoint", 2),
    });
    // elementsFromPoint
    Object.defineProperty(Document.prototype, "elementsFromPoint", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("elementsFromPoint", 2),
    });
    // evaluate
    Object.defineProperty(Document.prototype, "evaluate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("evaluate", 2),
    });
    // execCommand
    Object.defineProperty(Document.prototype, "execCommand", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("execCommand", 1),
    });
    // exitFullscreen
    Object.defineProperty(Document.prototype, "exitFullscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("exitFullscreen", 0),
    });
    // exitPictureInPicture
    Object.defineProperty(Document.prototype, "exitPictureInPicture", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("exitPictureInPicture", 0),
    });
    // exitPointerLock
    Object.defineProperty(Document.prototype, "exitPointerLock", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("exitPointerLock", 0),
    });
    // getAnimations
    Object.defineProperty(Document.prototype, "getAnimations", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getAnimations", 0),
    });
    // getElementById
    Object.defineProperty(Document.prototype, "getElementById", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementById", 1, function (id) {
            // 已经手动实现✅
            function DfsFind(n, target) {
                const value = domTree.get(n);
                // 拿到指定数据返回
                if (value["nodeType"] === 1 && value["data"]["id"] === target) {
                    return n;                      // 返回元素本身
                }
                for (const v of value["childNodes"]) {
                    var found = DfsFind(v, target);
                    if (found) {
                        return found;
                    }
                }
                return null;
            }
            const domTree = csvm.memory.Dom;
            const val = DfsFind(document, id);
            return val;

        }),
    });
    // getElementsByClassName
    Object.defineProperty(Document.prototype, "getElementsByClassName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByClassName", 1),
    });
    // getElementsByName
    Object.defineProperty(Document.prototype, "getElementsByName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByName", 1),
    });
    // getElementsByTagName
    Object.defineProperty(Document.prototype, "getElementsByTagName", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByTagName", 1, function (tagName) {
            var target = String(tagName).toLowerCase();
            var domTree = csvm.memory.Dom;
            var out = [];

            // 从 document 的后代开始遍历：doctype / html 这类直属子节点也会被匹配到
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
            })(document);

            return out;
        }),
    });
    // getElementsByTagNameNS
    Object.defineProperty(Document.prototype, "getElementsByTagNameNS", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementsByTagNameNS", 2),
    });
    // getSelection
    Object.defineProperty(Document.prototype, "getSelection", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getSelection", 0),
    });
    // hasFocus
    Object.defineProperty(Document.prototype, "hasFocus", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasFocus", 0),
    });
    // hasStorageAccess
    Object.defineProperty(Document.prototype, "hasStorageAccess", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasStorageAccess", 0),
    });
    // hasUnpartitionedCookieAccess
    Object.defineProperty(Document.prototype, "hasUnpartitionedCookieAccess", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("hasUnpartitionedCookieAccess", 0),
    });
    // importNode
    Object.defineProperty(Document.prototype, "importNode", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("importNode", 1),
    });
    // moveBefore
    Object.defineProperty(Document.prototype, "moveBefore", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("moveBefore", 2),
    });
    // open
    Object.defineProperty(Document.prototype, "open", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("open", 0),
    });
    // prepend
    Object.defineProperty(Document.prototype, "prepend", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("prepend", 0),
    });
    // queryCommandEnabled
    Object.defineProperty(Document.prototype, "queryCommandEnabled", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("queryCommandEnabled", 1),
    });
    // queryCommandIndeterm
    Object.defineProperty(Document.prototype, "queryCommandIndeterm", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("queryCommandIndeterm", 1),
    });
    // queryCommandState
    Object.defineProperty(Document.prototype, "queryCommandState", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("queryCommandState", 1),
    });
    // queryCommandSupported
    Object.defineProperty(Document.prototype, "queryCommandSupported", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("queryCommandSupported", 1),
    });
    // queryCommandValue
    Object.defineProperty(Document.prototype, "queryCommandValue", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("queryCommandValue", 1),
    });
    // querySelector
    Object.defineProperty(Document.prototype, "querySelector", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("querySelector", 1),
    });
    // querySelectorAll
    Object.defineProperty(Document.prototype, "querySelectorAll", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("querySelectorAll", 1),
    });
    // releaseEvents
    Object.defineProperty(Document.prototype, "releaseEvents", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("releaseEvents", 0),
    });
    // replaceChildren
    Object.defineProperty(Document.prototype, "replaceChildren", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("replaceChildren", 0),
    });
    // requestStorageAccess
    Object.defineProperty(Document.prototype, "requestStorageAccess", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestStorageAccess", 0),
    });
    // startViewTransition
    Object.defineProperty(Document.prototype, "startViewTransition", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("startViewTransition", 0),
    });
    // webkitCancelFullScreen
    Object.defineProperty(Document.prototype, "webkitCancelFullScreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitCancelFullScreen", 0),
    });
    // webkitExitFullscreen
    Object.defineProperty(Document.prototype, "webkitExitFullscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitExitFullscreen", 0),
    });
    // write
    Object.defineProperty(Document.prototype, "write", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("write", 0),
    });
    // writeln
    Object.defineProperty(Document.prototype, "writeln", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("writeln", 0),
    });
    // TODO constructor: Document.prototype.constructor 需要手动指向接口对象
    // fragmentDirective
    Object.defineProperty(Document.prototype, "fragmentDirective", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fragmentDirective", 0),
        set: undefined,
    });
    // onscrollsnapchange
    Object.defineProperty(Document.prototype, "onscrollsnapchange", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onscrollsnapchange", 0),
        set: __autoFn("set onscrollsnapchange", 1),
    });
    // onscrollsnapchanging
    Object.defineProperty(Document.prototype, "onscrollsnapchanging", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onscrollsnapchanging", 0),
        set: __autoFn("set onscrollsnapchanging", 1),
    });
    // ariaNotify
    Object.defineProperty(Document.prototype, "ariaNotify", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("ariaNotify", 1),
    });
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Document.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Document",
    });
    // Symbol(Symbol.unscopables) (symbol)
    Object.defineProperty(Document.prototype, Symbol.unscopables, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: Object.assign(Object.create(null), {
            ["append"]: true,
            ["fullscreen"]: true,
            ["prepend"]: true,
            ["replaceChildren"]: true,
        }),
    });
})();
/* #endregion AUTO:Document.prototype */

Document.prototype.__proto__ = Node.prototype;
Document = csvm.proxy(Document, "Document");
