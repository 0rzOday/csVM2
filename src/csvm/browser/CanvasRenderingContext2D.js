var CanvasRenderingContext2D = function CanvasRenderingContext2D(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(CanvasRenderingContext2D, "CanvasRenderingContext2D");

/* #region AUTO:CanvasRenderingContext2D.prototype */
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
    // canvas
    Object.defineProperty(CanvasRenderingContext2D.prototype, "canvas", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get canvas", 0),
        set: undefined,
    });
    // lang
    Object.defineProperty(CanvasRenderingContext2D.prototype, "lang", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lang", 0),
        set: __autoFn("set lang", 1),
    });
    // font
    Object.defineProperty(CanvasRenderingContext2D.prototype, "font", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get font", 0),
        set: __autoFn("set font", 1),
    });
    // textAlign
    Object.defineProperty(CanvasRenderingContext2D.prototype, "textAlign", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get textAlign", 0),
        set: __autoFn("set textAlign", 1),
    });
    // textBaseline
    Object.defineProperty(CanvasRenderingContext2D.prototype, "textBaseline", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get textBaseline", 0),
        set: __autoFn("set textBaseline", 1),
    });
    // direction
    Object.defineProperty(CanvasRenderingContext2D.prototype, "direction", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get direction", 0),
        set: __autoFn("set direction", 1),
    });
    // fontKerning
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fontKerning", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fontKerning", 0),
        set: __autoFn("set fontKerning", 1),
    });
    // fontStretch
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fontStretch", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fontStretch", 0),
        set: __autoFn("set fontStretch", 1),
    });
    // fontVariantCaps
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fontVariantCaps", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fontVariantCaps", 0),
        set: __autoFn("set fontVariantCaps", 1),
    });
    // letterSpacing
    Object.defineProperty(CanvasRenderingContext2D.prototype, "letterSpacing", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get letterSpacing", 0),
        set: __autoFn("set letterSpacing", 1),
    });
    // textRendering
    Object.defineProperty(CanvasRenderingContext2D.prototype, "textRendering", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get textRendering", 0),
        set: __autoFn("set textRendering", 1),
    });
    // wordSpacing
    Object.defineProperty(CanvasRenderingContext2D.prototype, "wordSpacing", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get wordSpacing", 0),
        set: __autoFn("set wordSpacing", 1),
    });
    // globalCompositeOperation
    Object.defineProperty(CanvasRenderingContext2D.prototype, "globalCompositeOperation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get globalCompositeOperation", 0),
        set: __autoFn("set globalCompositeOperation", 1),
    });
    // filter
    Object.defineProperty(CanvasRenderingContext2D.prototype, "filter", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get filter", 0),
        set: __autoFn("set filter", 1),
    });
    // imageSmoothingQuality
    Object.defineProperty(CanvasRenderingContext2D.prototype, "imageSmoothingQuality", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get imageSmoothingQuality", 0),
        set: __autoFn("set imageSmoothingQuality", 1),
    });
    // strokeStyle
    Object.defineProperty(CanvasRenderingContext2D.prototype, "strokeStyle", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get strokeStyle", 0),
        set: __autoFn("set strokeStyle", 1),
    });
    // fillStyle
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillStyle", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get fillStyle", 0),
        set: __autoFn("set fillStyle", 1),
    });
    // shadowColor
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowColor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get shadowColor", 0),
        set: __autoFn("set shadowColor", 1),
    });
    // lineCap
    Object.defineProperty(CanvasRenderingContext2D.prototype, "lineCap", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lineCap", 0),
        set: __autoFn("set lineCap", 1),
    });
    // lineJoin
    Object.defineProperty(CanvasRenderingContext2D.prototype, "lineJoin", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lineJoin", 0),
        set: __autoFn("set lineJoin", 1),
    });
    // globalAlpha
    Object.defineProperty(CanvasRenderingContext2D.prototype, "globalAlpha", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get globalAlpha", 0),
        set: __autoFn("set globalAlpha", 1),
    });
    // imageSmoothingEnabled
    Object.defineProperty(CanvasRenderingContext2D.prototype, "imageSmoothingEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get imageSmoothingEnabled", 0),
        set: __autoFn("set imageSmoothingEnabled", 1),
    });
    // shadowOffsetX
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowOffsetX", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get shadowOffsetX", 0),
        set: __autoFn("set shadowOffsetX", 1),
    });
    // shadowOffsetY
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowOffsetY", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get shadowOffsetY", 0),
        set: __autoFn("set shadowOffsetY", 1),
    });
    // shadowBlur
    Object.defineProperty(CanvasRenderingContext2D.prototype, "shadowBlur", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get shadowBlur", 0),
        set: __autoFn("set shadowBlur", 1),
    });
    // lineWidth
    Object.defineProperty(CanvasRenderingContext2D.prototype, "lineWidth", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lineWidth", 0),
        set: __autoFn("set lineWidth", 1),
    });
    // miterLimit
    Object.defineProperty(CanvasRenderingContext2D.prototype, "miterLimit", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get miterLimit", 0),
        set: __autoFn("set miterLimit", 1),
    });
    // lineDashOffset
    Object.defineProperty(CanvasRenderingContext2D.prototype, "lineDashOffset", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get lineDashOffset", 0),
        set: __autoFn("set lineDashOffset", 1),
    });
    // clip
    Object.defineProperty(CanvasRenderingContext2D.prototype, "clip", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("clip", 0),
    });
    // createConicGradient
    Object.defineProperty(CanvasRenderingContext2D.prototype, "createConicGradient", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createConicGradient", 3),
    });
    // createImageData
    Object.defineProperty(CanvasRenderingContext2D.prototype, "createImageData", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createImageData", 1),
    });
    // createLinearGradient
    Object.defineProperty(CanvasRenderingContext2D.prototype, "createLinearGradient", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createLinearGradient", 4),
    });
    // createPattern
    Object.defineProperty(CanvasRenderingContext2D.prototype, "createPattern", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createPattern", 2),
    });
    // createRadialGradient
    Object.defineProperty(CanvasRenderingContext2D.prototype, "createRadialGradient", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("createRadialGradient", 6),
    });
    // drawFocusIfNeeded
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawFocusIfNeeded", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("drawFocusIfNeeded", 1),
    });
    // drawImage
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawImage", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("drawImage", 3),
    });
    // fill
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fill", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("fill", 0),
    });
    // fillText
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillText", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("fillText", 3),
    });
    // getContextAttributes
    Object.defineProperty(CanvasRenderingContext2D.prototype, "getContextAttributes", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getContextAttributes", 0),
    });
    // getImageData
    Object.defineProperty(CanvasRenderingContext2D.prototype, "getImageData", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getImageData", 4),
    });
    // getLineDash
    Object.defineProperty(CanvasRenderingContext2D.prototype, "getLineDash", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getLineDash", 0),
    });
    // getTransform
    Object.defineProperty(CanvasRenderingContext2D.prototype, "getTransform", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getTransform", 0),
    });
    // isContextLost
    Object.defineProperty(CanvasRenderingContext2D.prototype, "isContextLost", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isContextLost", 0),
    });
    // isPointInPath
    Object.defineProperty(CanvasRenderingContext2D.prototype, "isPointInPath", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isPointInPath", 2),
    });
    // isPointInStroke
    Object.defineProperty(CanvasRenderingContext2D.prototype, "isPointInStroke", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("isPointInStroke", 2),
    });
    // measureText
    Object.defineProperty(CanvasRenderingContext2D.prototype, "measureText", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("measureText", 1),
    });
    // reset
    Object.defineProperty(CanvasRenderingContext2D.prototype, "reset", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("reset", 0),
    });
    // roundRect
    Object.defineProperty(CanvasRenderingContext2D.prototype, "roundRect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("roundRect", 4),
    });
    // setLineDash
    Object.defineProperty(CanvasRenderingContext2D.prototype, "setLineDash", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setLineDash", 1),
    });
    // strokeText
    Object.defineProperty(CanvasRenderingContext2D.prototype, "strokeText", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("strokeText", 3),
    });
    // arc
    Object.defineProperty(CanvasRenderingContext2D.prototype, "arc", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("arc", 5),
    });
    // arcTo
    Object.defineProperty(CanvasRenderingContext2D.prototype, "arcTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("arcTo", 5),
    });
    // beginPath
    Object.defineProperty(CanvasRenderingContext2D.prototype, "beginPath", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("beginPath", 0),
    });
    // bezierCurveTo
    Object.defineProperty(CanvasRenderingContext2D.prototype, "bezierCurveTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("bezierCurveTo", 6),
    });
    // clearRect
    Object.defineProperty(CanvasRenderingContext2D.prototype, "clearRect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("clearRect", 4),
    });
    // closePath
    Object.defineProperty(CanvasRenderingContext2D.prototype, "closePath", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("closePath", 0),
    });
    // ellipse
    Object.defineProperty(CanvasRenderingContext2D.prototype, "ellipse", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("ellipse", 7),
    });
    // fillRect
    Object.defineProperty(CanvasRenderingContext2D.prototype, "fillRect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("fillRect", 4),
    });
    // lineTo
    Object.defineProperty(CanvasRenderingContext2D.prototype, "lineTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("lineTo", 2),
    });
    // moveTo
    Object.defineProperty(CanvasRenderingContext2D.prototype, "moveTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("moveTo", 2),
    });
    // putImageData
    Object.defineProperty(CanvasRenderingContext2D.prototype, "putImageData", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("putImageData", 3),
    });
    // quadraticCurveTo
    Object.defineProperty(CanvasRenderingContext2D.prototype, "quadraticCurveTo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("quadraticCurveTo", 4),
    });
    // rect
    Object.defineProperty(CanvasRenderingContext2D.prototype, "rect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("rect", 4),
    });
    // resetTransform
    Object.defineProperty(CanvasRenderingContext2D.prototype, "resetTransform", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("resetTransform", 0),
    });
    // restore
    Object.defineProperty(CanvasRenderingContext2D.prototype, "restore", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("restore", 0),
    });
    // rotate
    Object.defineProperty(CanvasRenderingContext2D.prototype, "rotate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("rotate", 1),
    });
    // save
    Object.defineProperty(CanvasRenderingContext2D.prototype, "save", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("save", 0),
    });
    // scale
    Object.defineProperty(CanvasRenderingContext2D.prototype, "scale", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("scale", 2),
    });
    // setTransform
    Object.defineProperty(CanvasRenderingContext2D.prototype, "setTransform", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setTransform", 0),
    });
    // stroke
    Object.defineProperty(CanvasRenderingContext2D.prototype, "stroke", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("stroke", 0),
    });
    // strokeRect
    Object.defineProperty(CanvasRenderingContext2D.prototype, "strokeRect", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("strokeRect", 4),
    });
    // transform
    Object.defineProperty(CanvasRenderingContext2D.prototype, "transform", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("transform", 6),
    });
    // translate
    Object.defineProperty(CanvasRenderingContext2D.prototype, "translate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("translate", 2),
    });
    // TODO constructor: CanvasRenderingContext2D.prototype.constructor 需要手动指向接口对象
    // drawElementImage
    Object.defineProperty(CanvasRenderingContext2D.prototype, "drawElementImage", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("drawElementImage", 3),
    });
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(CanvasRenderingContext2D.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "CanvasRenderingContext2D",
    });
})();
/* #endregion AUTO:CanvasRenderingContext2D.prototype */

CanvasRenderingContext2D = csvm.proxy(CanvasRenderingContext2D, "CanvasRenderingContext2D");
