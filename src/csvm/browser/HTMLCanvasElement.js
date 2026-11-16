var HTMLCanvasElement=function HTMLCanvasElement(){
    throw new TypeError("Illegal constructor");
};
csvm.safefunction(HTMLCanvasElement,"HTMLCanvasElement");
HTMLCanvasElement.prototype.__proto__=HTMLElement.prototype;
HTMLCanvasElement.__proto__ = HTMLElement;

Object.defineProperty(HTMLCanvasElement.prototype, Symbol.toStringTag, {
    value: "HTMLCanvasElement",
    configurable: true
});

/* #region AUTO:HTMLCanvasElement.prototype */
(function () {
    // --- 生成代码公共辅助 ---------------------------------------------------
    const __autoHit = new Set();

    // 加载时抓一份原生 apply。目标之后改 Function.prototype.apply / Reflect.apply，
    // 也影响不到包装层，免得它看到框架内部的调用
    const __autoApply = Reflect.apply;

    // 每个 canvas 的尺寸与上下文（同一元素多次 getContext 返回同一对象）
    var __canvasMeta = new WeakMap();
    function __meta(el) {
        var m = __canvasMeta.get(el);
        if (!m) { m = { w: 300, h: 150, ctx2d: null }; __canvasMeta.set(el, m); }
        return m;
    }
    function __makeCtx2d(canvas) {
        var m = __meta(canvas);
        if (m.ctx2d) return m.ctx2d;
        var ctx = Object.create(CanvasRenderingContext2D.prototype);
        var st = Object.create(null);
        var defaults = {
            fillStyle: "#000000", strokeStyle: "#000000", textBaseline: "alphabetic",
            textAlign: "start", font: "10px sans-serif", lineWidth: 1, globalAlpha: 1,
            lineCap: "butt", lineJoin: "miter", miterLimit: 10, shadowBlur: 0,
            shadowColor: "rgba(0, 0, 0, 0)", shadowOffsetX: 0, shadowOffsetY: 0,
            globalCompositeOperation: "source-over", direction: "ltr", filter: "none",
            fontKerning: "auto", imageSmoothingEnabled: true, textRendering: "auto",
            letterSpacing: "0px", wordSpacing: "0px", lineDashOffset: 0,
        };
        for (var k in defaults) st[k] = defaults[k];
        Object.keys(defaults).forEach(function (k) {
            Object.defineProperty(ctx, k, {
                configurable: true, enumerable: true,
                get: function () { return st[k]; },
                set: function (v) { st[k] = v; },
            });
        });
        Object.defineProperty(ctx, "canvas", { configurable: true, enumerable: true, get: function () { return canvas; } });
        var mt = { measureText(text) {
            var t = String(text === undefined ? "undefined" : text);
            var w = t.length * 4.5;
            return {
                width: w, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2,
                actualBoundingBoxLeft: 0, actualBoundingBoxRight: w,
                fontBoundingBoxAscent: 8, fontBoundingBoxDescent: 2,
                alphabeticBaseline: 0, hangingBaseline: 8, ideographicBaseline: -2,
            };
        } }.measureText;
        csvm.safefunction(mt, "measureText");
        Object.defineProperty(ctx, "measureText", { configurable: true, enumerable: true, writable: true, value: csvm.proxy ? csvm.proxy(mt, "measureText") : mt });
        var gid = { getImageData(x, y, w, h) {
            w = Math.max(0, w | 0); h = Math.max(0, h | 0);
            return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4), colorSpace: "srgb" };
        } }.getImageData;
        csvm.safefunction(gid, "getImageData");
        Object.defineProperty(ctx, "getImageData", { configurable: true, enumerable: true, writable: true, value: csvm.proxy ? csvm.proxy(gid, "getImageData") : gid });
        m.ctx2d = ctx;
        return ctx;
    }
    csvm.makeCanvasContext2D = __makeCtx2d;

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
    // width
    Object.defineProperty(HTMLCanvasElement.prototype, "width", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get width", 0, function () { return __meta(this).w; }),
        set: __autoFn("set width", 1, function (v) { __meta(this).w = Number(v) >>> 0; }),
    });
    // height
    Object.defineProperty(HTMLCanvasElement.prototype, "height", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get height", 0, function () { return __meta(this).h; }),
        set: __autoFn("set height", 1, function (v) { __meta(this).h = Number(v) >>> 0; }),
    });
    // captureStream
    Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("captureStream", 0),
    });
    // getContext
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getContext", 1, function (type, attrs) {
            var t = String(type).toLowerCase();
            if (t === "2d") return __makeCtx2d(this);
            return null;
        }),
    });
    // toBlob
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("toBlob", 1, function (cb, type, quality) {
            if (typeof cb === "function") {
                var blob = { size: 1024, type: "image/png" };
                try { cb(blob); } catch (e) {}
            }
            return undefined;
        }),
    });
    // toDataURL
    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("toDataURL", 0, function (type, quality) {
            var t = type ? String(type) : "image/png";
            if (t === "image/png") {
                return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAGJJREFUeF7t0QEBAAAAgJD+r+4ICgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoG0PAAAB7F3R4AAAAASUVORK5CYII=";
            }
            return "data:" + t + ";base64,";
        }),
    });
    // transferControlToOffscreen
    Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("transferControlToOffscreen", 0),
    });
    // TODO constructor: HTMLCanvasElement.prototype.constructor 需要手动指向接口对象
    // content
    Object.defineProperty(HTMLCanvasElement.prototype, "content", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get content", 0),
        set: __autoFn("set content", 1),
    });
    // onpaint
    Object.defineProperty(HTMLCanvasElement.prototype, "onpaint", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onpaint", 0),
        set: __autoFn("set onpaint", 1),
    });
    // onelementgeometryupdate
    Object.defineProperty(HTMLCanvasElement.prototype, "onelementgeometryupdate", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onelementgeometryupdate", 0),
        set: __autoFn("set onelementgeometryupdate", 1),
    });
    // captureElementImage
    Object.defineProperty(HTMLCanvasElement.prototype, "captureElementImage", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("captureElementImage", 1),
    });
    // clearElementGeometry
    Object.defineProperty(HTMLCanvasElement.prototype, "clearElementGeometry", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("clearElementGeometry", 1),
    });
    // getElementImageDefaultSize
    Object.defineProperty(HTMLCanvasElement.prototype, "getElementImageDefaultSize", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementImageDefaultSize", 1),
    });
    // getElementTransform
    Object.defineProperty(HTMLCanvasElement.prototype, "getElementTransform", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getElementTransform", 1),
    });
    // requestPaint
    Object.defineProperty(HTMLCanvasElement.prototype, "requestPaint", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestPaint", 0),
    });
    // updateElementGeometry
    Object.defineProperty(HTMLCanvasElement.prototype, "updateElementGeometry", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("updateElementGeometry", 1),
    });
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(HTMLCanvasElement.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "HTMLCanvasElement",
    });
})();
/* #endregion AUTO:HTMLCanvasElement.prototype */

HTMLCanvasElement = csvm.proxy(HTMLCanvasElement, "HTMLCanvasElement");

// createElement("canvas") 必须返回带 getContext 的 HTMLCanvasElement
csvm.registerElement("canvas", HTMLCanvasElement);