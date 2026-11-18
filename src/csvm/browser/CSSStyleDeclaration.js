// CSSStyleDeclaration
//
// 真机 Chrome 的 CSSStyleDeclaration 对每个受支持的 CSS 属性名都返回 true
// (('backgroundColor' in el.style))，对不存在/其它厂商前缀（MozAppearance）返回 false。
// 瑞数 VM 用 ('MozAppearance' in document.documentElement.style) 做浏览器分支判断；
// 之前框架里 style 是 undefined，导致 in 抛错、VM 走进自动化检测分支。
//
// 下面的属性名列表直接取自真机 Chrome Object.keys(docEl.style)。
var __CSS_PROP_LIST = ["accentColor","additiveSymbols","alignContent","alignItems","alignSelf","alignmentBaseline","all","anchorName","anchorScope","animation","animationComposition","animationDelay","animationDirection","animationDuration","animationFillMode","animationIterationCount","animationName","animationPlayState","animationRange","animationRangeEnd","animationRangeStart","animationTimeline","animationTimingFunction","animationTrigger","appRegion","appearance","ascentOverride","aspectRatio","backdropFilter","backfaceVisibility","background","backgroundAttachment","backgroundBlendMode","backgroundClip","backgroundColor","backgroundImage","backgroundOrigin","backgroundPosition","backgroundPositionX","backgroundPositionY","backgroundRepeat","backgroundSize","basePalette","baselineShift","baselineSource","blockSize","border","borderBlock","borderBlockColor","borderBlockEnd","borderBlockEndColor","borderBlockEndStyle","borderBlockEndWidth","borderBlockStart","borderBlockStartColor","borderBlockStartStyle","borderBlockStartWidth","borderBlockStyle","borderBlockWidth","borderBottom","borderBottomColor","borderBottomLeftRadius","borderBottomRightRadius","borderBottomStyle","borderBottomWidth","borderCollapse","borderColor","borderEndEndRadius","borderEndStartRadius","borderImage","borderImageOutset","borderImageRepeat","borderImageSlice","borderImageSource","borderImageWidth","borderInline","borderInlineColor","borderInlineEnd","borderInlineEndColor","borderInlineEndStyle","borderInlineEndWidth","borderInlineStart","borderInlineStartColor","borderInlineStartStyle","borderInlineStartWidth","borderInlineStyle","borderInlineWidth","borderLeft","borderLeftColor","borderLeftStyle","borderLeftWidth","borderRadius","borderRight","borderRightColor","borderRightStyle","borderRightWidth","borderShape","borderSpacing","borderStartEndRadius","borderStartStartRadius","borderStyle","borderTop","borderTopColor","borderTopLeftRadius","borderTopRightRadius","borderTopStyle","borderTopWidth","borderWidth","bottom","boxDecorationBreak","boxShadow","boxSizing","breakAfter","breakBefore","breakInside","bufferedRendering","captionSide","caretAnimation","caretColor","caretShape","clear","clip","clipPath","clipRule","color","colorInterpolation","colorInterpolationFilters","colorRendering","colorScheme","columnCount","columnFill","columnGap","columnHeight","columnRule","columnRuleBreak","columnRuleColor","columnRuleInset","columnRuleInsetCap","columnRuleInsetCapEnd","columnRuleInsetCapStart","columnRuleInsetEnd","columnRuleInsetJunction","columnRuleInsetJunctionEnd","columnRuleInsetJunctionStart","columnRuleInsetStart","columnRuleStyle","columnRuleVisibilityItems","columnRuleWidth","columnSpan","columnWidth","columnWrap","columns","contain","containIntrinsicBlockSize","containIntrinsicHeight","containIntrinsicInlineSize","containIntrinsicSize","containIntrinsicWidth","container","containerName","containerType","content","contentVisibility","cornerBlockEndShape","cornerBlockStartShape","cornerBottomLeftShape","cornerBottomRightShape","cornerBottomShape","cornerEndEndShape","cornerEndStartShape","cornerInlineEndShape","cornerInlineStartShape","cornerLeftShape","cornerRightShape","cornerShape","cornerStartEndShape","cornerStartStartShape","cornerTopLeftShape","cornerTopRightShape","cornerTopShape","counterIncrement","counterReset","counterSet","cursor","cx","cy","d","descentOverride","direction","display","dominantBaseline","dynamicRangeLimit","emptyCells","fallback","fieldSizing","fill","fillOpacity","fillRule","filter","flex","flexBasis","flexDirection","flexFlow","flexGrow","flexLineCount","flexShrink","flexWrap","float","floodColor","floodOpacity","font","fontDisplay","fontFamily","fontFeatureSettings","fontKerning","fontLanguageOverride","fontOpticalSizing","fontPalette","fontSize","fontSizeAdjust","fontStretch","fontStyle","fontSynthesis","fontSynthesisSmallCaps","fontSynthesisStyle","fontSynthesisWeight","fontVariant","fontVariantAlternates","fontVariantCaps","fontVariantEastAsian","fontVariantEmoji","fontVariantLigatures","fontVariantNumeric","fontVariantPosition","fontVariationSettings","fontWeight","forcedColorAdjust","frameSizing","gap","grid","gridArea","gridAutoColumns","gridAutoFlow","gridAutoRows","gridColumn","gridColumnEnd","gridColumnGap","gridColumnStart","gridGap","gridRow","gridRowEnd","gridRowGap","gridRowStart","gridTemplate","gridTemplateAreas","gridTemplateColumns","gridTemplateRows","height","hyphenateCharacter","hyphenateLimitChars","hyphens","imageOrientation","imageRendering","inherits","initialLetter","initialValue","inlineSize","inset","insetBlock","insetBlockEnd","insetBlockStart","insetInline","insetInlineEnd","insetInlineStart","interactivity","interestDelay","interestDelayEnd","interestDelayStart","interpolateSize","isolation","justifyContent","justifyItems","justifySelf","left","letterSpacing","lightingColor","lineBreak","lineGapOverride","lineHeight","listStyle","listStyleImage","listStylePosition","listStyleType","margin","marginBlock","marginBlockEnd","marginBlockStart","marginBottom","marginInline","marginInlineEnd","marginInlineStart","marginLeft","marginRight","marginTop","marginTrim","marker","markerEnd","markerMid","markerStart","mask","maskClip","maskComposite","maskImage","maskMode","maskOrigin","maskPosition","maskRepeat","maskSize","maskType","mathDepth","mathShift","mathStyle","maxBlockSize","maxHeight","maxInlineSize","maxWidth","minBlockSize","minHeight","minInlineSize","minWidth","mixBlendMode","navigation","negative","objectFit","objectPosition","objectViewBox","offset","offsetAnchor","offsetDistance","offsetPath","offsetPosition","offsetRotate","opacity","order","orphans","outline","outlineColor","outlineOffset","outlineStyle","outlineWidth","overflow","overflowAnchor","overflowBlock","overflowClipMargin","overflowInline","overflowWrap","overflowX","overflowY","overlay","overrideColors","overscrollBehavior","overscrollBehaviorBlock","overscrollBehaviorInline","overscrollBehaviorX","overscrollBehaviorY","pad","padding","paddingBlock","paddingBlockEnd","paddingBlockStart","paddingBottom","paddingInline","paddingInlineEnd","paddingInlineStart","paddingLeft","paddingRight","paddingTop","page","pageBreakAfter","pageBreakBefore","pageBreakInside","pageMarginSafety","pageOrientation","paintOrder","perspective","perspectiveOrigin","placeContent","placeItems","placeSelf","pointerEvents","position","positionAnchor","positionArea","positionTry","positionTryFallbacks","positionTryOrder","positionVisibility","prefix","printColorAdjust","quotes","r","range","readingFlow","readingOrder","resize","result","right","rotate","rowGap","rowRule","rowRuleBreak","rowRuleColor","rowRuleInset","rowRuleInsetCap","rowRuleInsetCapEnd","rowRuleInsetCapStart","rowRuleInsetEnd","rowRuleInsetJunction","rowRuleInsetJunctionEnd","rowRuleInsetJunctionStart","rowRuleInsetStart","rowRuleStyle","rowRuleVisibilityItems","rowRuleWidth","rubyAlign","rubyOverhang","rubyPosition","rule","ruleBreak","ruleColor","ruleInset","ruleInsetCap","ruleInsetEnd","ruleInsetJunction","ruleInsetStart","ruleOverlap","ruleStyle","ruleVisibilityItems","ruleWidth","rx","ry","scale","scrollAxisLock","scrollBehavior","scrollInitialTarget","scrollMargin","scrollMarginBlock","scrollMarginBlockEnd","scrollMarginBlockStart","scrollMarginBottom","scrollMarginInline","scrollMarginInlineEnd","scrollMarginInlineStart","scrollMarginLeft","scrollMarginRight","scrollMarginTop","scrollMarkerGroup","scrollPadding","scrollPaddingBlock","scrollPaddingBlockEnd","scrollPaddingBlockStart","scrollPaddingBottom","scrollPaddingInline","scrollPaddingInlineEnd","scrollPaddingInlineStart","scrollPaddingLeft","scrollPaddingRight","scrollPaddingTop","scrollSnapAlign","scrollSnapStop","scrollSnapType","scrollTargetGroup","scrollTimeline","scrollTimelineAxis","scrollTimelineName","scrollbarColor","scrollbarGutter","scrollbarWidth","shapeImageThreshold","shapeMargin","shapeOutside","shapeRendering","size","sizeAdjust","speak","speakAs","src","stopColor","stopOpacity","stroke","strokeDasharray","strokeDashoffset","strokeLinecap","strokeLinejoin","strokeMiterlimit","strokeOpacity","strokeWidth","suffix","symbols","syntax","system","tabSize","tableLayout","textAlign","textAlignLast","textAnchor","textAutospace","textBox","textBoxEdge","textBoxTrim","textCombineUpright","textDecoration","textDecorationColor","textDecorationInset","textDecorationLine","textDecorationSkipInk","textDecorationStyle","textDecorationThickness","textEmphasis","textEmphasisColor","textEmphasisPosition","textEmphasisStyle","textFit","textIndent","textJustify","textOrientation","textOverflow","textRendering","textShadow","textSizeAdjust","textSpacingTrim","textTransform","textUnderlineOffset","textUnderlinePosition","textWrap","textWrapMode","textWrapStyle","timelineScope","timelineTrigger","timelineTriggerActivationRange","timelineTriggerActivationRangeEnd","timelineTriggerActivationRangeStart","timelineTriggerActiveRange","timelineTriggerActiveRangeEnd","timelineTriggerActiveRangeStart","timelineTriggerName","timelineTriggerSource","top","touchAction","transform","transformBox","transformOrigin","transformStyle","transition","transitionBehavior","transitionDelay","transitionDuration","transitionProperty","transitionTimingFunction","translate","triggerScope","types","unicodeBidi","unicodeRange","userSelect","vectorEffect","verticalAlign","viewTimeline","viewTimelineAxis","viewTimelineInset","viewTimelineName","viewTransitionClass","viewTransitionGroup","viewTransitionName","viewTransitionScope","visibility","webkitAlignContent","webkitAlignItems","webkitAlignSelf","webkitAnimation","webkitAnimationDelay","webkitAnimationDirection","webkitAnimationDuration","webkitAnimationFillMode","webkitAnimationIterationCount","webkitAnimationName","webkitAnimationPlayState","webkitAnimationTimingFunction","webkitAppRegion","webkitAppearance","webkitBackfaceVisibility","webkitBackgroundClip","webkitBackgroundOrigin","webkitBackgroundSize","webkitBorderAfter","webkitBorderAfterColor","webkitBorderAfterStyle","webkitBorderAfterWidth","webkitBorderBefore","webkitBorderBeforeColor","webkitBorderBeforeStyle","webkitBorderBeforeWidth","webkitBorderBottomLeftRadius","webkitBorderBottomRightRadius","webkitBorderEnd","webkitBorderEndColor","webkitBorderEndStyle","webkitBorderEndWidth","webkitBorderHorizontalSpacing","webkitBorderImage","webkitBorderRadius","webkitBorderStart","webkitBorderStartColor","webkitBorderStartStyle","webkitBorderStartWidth","webkitBorderTopLeftRadius","webkitBorderTopRightRadius","webkitBorderVerticalSpacing","webkitBoxAlign","webkitBoxDecorationBreak","webkitBoxDirection","webkitBoxFlex","webkitBoxOrdinalGroup","webkitBoxOrient","webkitBoxPack","webkitBoxReflect","webkitBoxShadow","webkitBoxSizing","webkitClipPath","webkitColumnBreakAfter","webkitColumnBreakBefore","webkitColumnBreakInside","webkitColumnCount","webkitColumnGap","webkitColumnRule","webkitColumnRuleColor","webkitColumnRuleStyle","webkitColumnRuleWidth","webkitColumnSpan","webkitColumnWidth","webkitColumns","webkitFilter","webkitFlex","webkitFlexBasis","webkitFlexDirection","webkitFlexFlow","webkitFlexGrow","webkitFlexShrink","webkitFlexWrap","webkitFontFeatureSettings","webkitFontSmoothing","webkitHyphenateCharacter","webkitJustifyContent","webkitLineBreak","webkitLineClamp","webkitLocale","webkitLogicalHeight","webkitLogicalWidth","webkitMarginAfter","webkitMarginBefore","webkitMarginEnd","webkitMarginStart","webkitMask","webkitMaskBoxImage","webkitMaskBoxImageOutset","webkitMaskBoxImageRepeat","webkitMaskBoxImageSlice","webkitMaskBoxImageSource","webkitMaskBoxImageWidth","webkitMaskClip","webkitMaskComposite","webkitMaskImage","webkitMaskOrigin","webkitMaskPosition","webkitMaskPositionX","webkitMaskPositionY","webkitMaskRepeat","webkitMaskSize","webkitMaxLogicalHeight","webkitMaxLogicalWidth","webkitMinLogicalHeight","webkitMinLogicalWidth","webkitOpacity","webkitOrder","webkitPaddingAfter","webkitPaddingBefore","webkitPaddingEnd","webkitPaddingStart","webkitPerspective","webkitPerspectiveOrigin","webkitPerspectiveOriginX","webkitPerspectiveOriginY","webkitPrintColorAdjust","webkitRtlOrdering","webkitRubyPosition","webkitShapeImageThreshold","webkitShapeMargin","webkitShapeOutside","webkitTapHighlightColor","webkitTextCombine","webkitTextDecorationsInEffect","webkitTextEmphasis","webkitTextEmphasisColor","webkitTextEmphasisPosition","webkitTextEmphasisStyle","webkitTextFillColor","webkitTextOrientation","webkitTextSecurity","webkitTextSizeAdjust","webkitTextStroke","webkitTextStrokeColor","webkitTextStrokeWidth","webkitTransform","webkitTransformOrigin","webkitTransformOriginX","webkitTransformOriginY","webkitTransformOriginZ","webkitTransformStyle","webkitTransition","webkitTransitionDelay","webkitTransitionDuration","webkitTransitionProperty","webkitTransitionTimingFunction","webkitUserDrag","webkitUserModify","webkitUserSelect","webkitWritingMode","whiteSpace","whiteSpaceCollapse","widows","width","willChange","windowDrag","wordBreak","wordSpacing","wordWrap","writingMode","x","y","zIndex","zoom"];
var __CSS_PROPS = Object.create(null);
for (var __i = 0; __i < __CSS_PROP_LIST.length; __i++) __CSS_PROPS[__CSS_PROP_LIST[__i]] = 1;

function __cssDashToCamel(name) {
    return String(name).replace(/^-/, "").replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
}
function __cssHas(name) {
    if (typeof name !== "string") return false;
    if (__CSS_PROPS[name] === 1) return true;
    if (name.indexOf("-") !== -1) {
        var camel = __cssDashToCamel(name);
        if (__CSS_PROPS[camel] === 1) return true;
    }
    return false;
}

var CSSStyleDeclaration = function CSSStyleDeclaration() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(CSSStyleDeclaration, "CSSStyleDeclaration");
Object.defineProperty(CSSStyleDeclaration.prototype, Symbol.toStringTag, { value: "CSSStyleDeclaration", configurable: true });

function __cssCamelToDash(k) {
    return String(k).replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); });
}
// 每个元素一个稳定的 CSSStyleDeclaration，并回写到元素的 style 属性（真机行为：
// span.style.color = "red" 会更新 <span style="color: red;">，并触发 attributes 变异）
var __styleMap = new WeakMap();
var __styleInternals = new WeakMap();

function __makeStyleDeclaration(el) {
    var store = Object.create(null);
    var order = [];
    var lastText = "";
    var parsing = false;

    function serialize() {
        var out = [];
        for (var i = 0; i < order.length; i++) out.push(__cssCamelToDash(order[i]) + ": " + store[order[i]] + ";");
        return out.join(" ");
    }
    function setVal(k, v) {
        if (store[k] === undefined) order.push(k);
        store[k] = String(v);
    }
    function delVal(k) {
        if (store[k] !== undefined) {
            delete store[k];
            var i = order.indexOf(k);
            if (i !== -1) order.splice(i, 1);
        }
    }
    function sync() {
        if (parsing) return;
        var text = serialize();
        if (text === lastText) return;
        var old = lastText;
        lastText = text;
        if (!el) return;
        try {
            var d = csvm.memory.domStore && csvm.memory.domStore.get(el);
            if (d && d.data) {
                if (text) d.data.style = text; else delete d.data.style;
            }
        } catch (e) {}
        try {
            if (csvm.moNotify) {
                csvm.moNotify(el, { type: "attributes", target: el, addedNodes: [], removedNodes: [], attributeName: "style", oldValue: old || null });
            }
        } catch (e) {}
    }
    function parseText(v) {
        parsing = true;
        for (var k in store) delete store[k];
        order.length = 0;
        String(v == null ? "" : v).split(";").forEach(function (decl) {
            var p = decl.split(":");
            if (p.length < 2) return;
            var k = __cssDashToCamel(p[0].trim());
            if (!k) return;
            setVal(k, p.slice(1).join(":").trim());
        });
        parsing = false;
        lastText = serialize();
    }

    var base = Object.create(CSSStyleDeclaration.prototype);
    Object.defineProperty(base, "cssText", {
        configurable: true, enumerable: true,
        get: function () { return serialize(); },
        set: function (v) { parseText(v); sync(); },
    });
    Object.defineProperty(base, "length", { configurable: true, enumerable: true, get: function () { return order.length; } });
    Object.defineProperty(base, "parentRule", { configurable: true, enumerable: true, get: function () { return null; } });

    function defMethod(name, len, impl) {
        var fn = { [name](...args) { return impl.apply(this, args); } }[name];
        Object.defineProperty(fn, "name", { value: name, configurable: true });
        Object.defineProperty(fn, "length", { value: len, configurable: true });
        Object.defineProperty(base, name, { configurable: true, enumerable: true, writable: true, value: csvm.safefunction(csvm.proxy ? csvm.proxy(fn, name) : fn, name) });
    }
    defMethod("getPropertyValue", 1, function (n) { var k = __cssDashToCamel(n); return store[k] !== undefined ? String(store[k]).replace(/\s*!important\s*$/, "") : ""; });
    defMethod("getPropertyPriority", 1, function (n) { var k = __cssDashToCamel(n); return store[k] !== undefined && /!important\s*$/.test(String(store[k])) ? "important" : ""; });
    defMethod("setProperty", 3, function (n, v, prio) {
        var k = __cssDashToCamel(n); if (!k) return;
        var val = String(v);
        if (prio && String(prio).toLowerCase() === "important") val += " !important";
        setVal(k, val); sync();
    });
    defMethod("removeProperty", 1, function (n) { var k = __cssDashToCamel(n); var old = store[k] !== undefined ? store[k] : ""; delVal(k); sync(); return old; });
    defMethod("item", 1, function (i) { i = +i; return order[i] !== undefined ? order[i] : ""; });
    Object.defineProperty(base, "cssFloat", {
        configurable: true, enumerable: true,
        get: function () { return store["cssFloat"] !== undefined ? store["cssFloat"] : ""; },
        set: function (v) { setVal("cssFloat", v); sync(); },
    });

    var proxy = new Proxy(base, {
        has: function (t, k) {
            if (typeof k !== "string") return k in t;
            if (__cssHas(k)) return true;
            return k in t;
        },
        get: function (t, k, r) {
            if (typeof k === "string") {
                // 真机 CSSStyleDeclaration 支持索引访问：style[0] -> 第一个已设置属性的 kebab 名
                if (/^\d+$/.test(k)) {
                    var idx = Number(k);
                    return idx >= 0 && idx < order.length ? __cssCamelToDash(order[idx]) : undefined;
                }
                if (store[k] !== undefined) return store[k];
                if (k.indexOf("-") === -1 && __CSS_PROPS[k] === 1) return "";
                if (k.indexOf("-") !== -1 && __cssHas(k)) { var c = __cssDashToCamel(k); return store[c] !== undefined ? store[c] : ""; }
            }
            return Reflect.get(t, k, r);
        },
        set: function (t, k, v) {
            if (typeof k === "string") {
                // 优先走原型上的 accessor（cssText / cssFloat 等），不能当成普通 CSS 属性存
                var d = Object.getOwnPropertyDescriptor(t, k);
                if (d && d.set) { d.set.call(t, v); return true; }
                if (/^\d+$/.test(k)) return true;
                var c = __cssDashToCamel(k); setVal(c || k, v); sync(); return true;
            }
            t[k] = v; return true;
        },
        ownKeys: function () {
            var keys = [];
            for (var i = 0; i < order.length; i++) keys.push(String(i));
            return keys.concat(__CSS_PROP_LIST);
        },
        getOwnPropertyDescriptor: function (t, k) {
            if (typeof k === "string" && /^\d+$/.test(k)) {
                var idx = Number(k);
                if (idx >= 0 && idx < order.length) {
                    return { value: __cssCamelToDash(order[idx]), writable: false, enumerable: true, configurable: true };
                }
            }
            if (typeof k === "string" && __CSS_PROPS[k] === 1) {
                return { value: store[k] !== undefined ? store[k] : "", writable: true, enumerable: true, configurable: true };
            }
            return Reflect.getOwnPropertyDescriptor(t, k);
        },
    });

    // 元素上已有 style 属性时初始化
    if (el) {
        try {
            var d0 = csvm.memory.domStore && csvm.memory.domStore.get(el);
            if (d0 && d0.data && d0.data.style) parseText(d0.data.style);
        } catch (e) {}
    }
    __styleInternals.set(proxy, { parse: parseText, sync: sync });
    return proxy;
}

// 取/建元素的 CSSStyleDeclaration（幂等）
csvm.styleFor = function (el) {
    if (!el) return __makeStyleDeclaration(null);
    var s = __styleMap.get(el);
    if (!s) { s = __makeStyleDeclaration(el); __styleMap.set(el, s); }
    return s;
};
// setAttribute('style', v) 时同步到已存在的 CSSStyleDeclaration
csvm.styleAttrChanged = function (el, val) {
    var s = __styleMap.get(el);
    if (!s) return;
    var it = __styleInternals.get(s);
    if (it) it.parse(val == null ? "" : String(val));
};
csvm.makeStyleDeclaration = function () { return __makeStyleDeclaration(null); };

