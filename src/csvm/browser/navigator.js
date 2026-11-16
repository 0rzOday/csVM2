navigator = {};

var Navigator = function Navigator() {
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(Navigator);
Object.defineProperty(Navigator.prototype, Symbol.toStringTag, { value: "Navigator", configurable: true });

// userAgent / appVersion 统一版本：appVersion = userAgent 去掉 Mozilla/
var __navigatorUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36";
try { if (typeof __CSVM_UA_OVERRIDE !== "undefined" && __CSVM_UA_OVERRIDE) __navigatorUA = String(__CSVM_UA_OVERRIDE); } catch (e) {}
var __navigatorPlatform = "Win32";
try { if (typeof __CSVM_PLATFORM_OVERRIDE !== "undefined" && __CSVM_PLATFORM_OVERRIDE) __navigatorPlatform = String(__CSVM_PLATFORM_OVERRIDE); } catch (e) {}

// ---------- Plugin / PluginArray / MimeType / MimeTypeArray ----------
var Plugin = function Plugin() { throw new TypeError("Illegal constructor"); };
var PluginArray = function PluginArray() { throw new TypeError("Illegal constructor"); };
var MimeType = function MimeType() { throw new TypeError("Illegal constructor"); };
var MimeTypeArray = function MimeTypeArray() { throw new TypeError("Illegal constructor"); };
csvm.safefunction(Plugin, "Plugin");
csvm.safefunction(PluginArray, "PluginArray");
csvm.safefunction(MimeType, "MimeType");
csvm.safefunction(MimeTypeArray, "MimeTypeArray");

var __pluginData = new WeakMap();
var __mimeData = new WeakMap();

function __mkMime(type, suffixes, description) {
    var m = Object.create(MimeType.prototype);
    __mimeData.set(m, { type: type, suffixes: suffixes, description: description, enabledPlugin: null });
    return m;
}
function __mkPlugin(name, filename, description, mimes) {
    var p = Object.create(Plugin.prototype);
    __pluginData.set(p, { name: name, filename: filename, description: description, mimes: mimes });
    for (var i = 0; i < mimes.length; i++) {
        Object.defineProperty(p, String(i), { value: mimes[i], enumerable: true, configurable: true, writable: false });
        var md = __mimeData.get(mimes[i]);
        if (md) md.enabledPlugin = p;
    }
    return p;
}
function __indexedCount(obj) {
    var n = 0;
    for (var k in obj) { if (/^\d+$/.test(k)) n++; }
    return n;
}
function __safefn(fn, name) {
    try {
        Object.defineProperty(fn, "name", { value: name, configurable: true });
    } catch (e) {}
    if (csvm.safefunction) csvm.safefunction(fn, name);
    return fn;
}

// Plugin.prototype
["name", "filename", "description"].forEach(function (field) {
    var getter = __safefn(function () { var d = __pluginData.get(this); return d ? d[field] : undefined; }, "get " + field);
    Object.defineProperty(Plugin.prototype, field, { configurable: true, enumerable: true, get: getter, set: undefined });
});
Object.defineProperty(Plugin.prototype, "length", {
    configurable: true,
    enumerable: true,
    get: __safefn(function () { var d = __pluginData.get(this); return d ? d.mimes.length : 0; }, "get length"),
    set: undefined,
});
Plugin.prototype.item = __safefn(function (i) {
    var d = __pluginData.get(this);
    if (!d) return null;
    i = Number(i) | 0;
    return i >= 0 && i < d.mimes.length ? d.mimes[i] : null;
}, "item");
Plugin.prototype.namedItem = __safefn(function (n) {
    var d = __pluginData.get(this);
    if (!d) return null;
    for (var i = 0; i < d.mimes.length; i++) if (d.mimes[i].type === String(n)) return d.mimes[i];
    return null;
}, "namedItem");
Object.defineProperty(Plugin.prototype, "constructor", { value: Plugin, writable: true, enumerable: false, configurable: true });
try { Object.defineProperty(Plugin.prototype, Symbol.toStringTag, { value: "Plugin", configurable: true }); } catch (e) {}

// MimeType.prototype
["type", "suffixes", "description", "enabledPlugin"].forEach(function (field) {
    var getter = __safefn(function () { var d = __mimeData.get(this); return d ? d[field] : undefined; }, "get " + field);
    Object.defineProperty(MimeType.prototype, field, { configurable: true, enumerable: true, get: getter, set: undefined });
});
Object.defineProperty(MimeType.prototype, "constructor", { value: MimeType, writable: true, enumerable: false, configurable: true });
try { Object.defineProperty(MimeType.prototype, Symbol.toStringTag, { value: "MimeType", configurable: true }); } catch (e) {}

// PluginArray.prototype
Object.defineProperty(PluginArray.prototype, "length", {
    configurable: true,
    enumerable: true,
    get: __safefn(function () { return __indexedCount(this); }, "get length"),
    set: undefined,
});
PluginArray.prototype.item = __safefn(function (i) {
    var arr = this;
    i = Number(i) | 0;
    return i >= 0 && i < __indexedCount(arr) ? arr[String(i)] : null;
}, "item");
PluginArray.prototype.namedItem = __safefn(function (n) {
    var name = String(n);
    for (var k in this) {
        if (/^\d+$/.test(k)) {
            var p = this[k];
            if (p && p.name === name) return p;
        }
    }
    return null;
}, "namedItem");
PluginArray.prototype.refresh = __safefn(function () {}, "refresh");
Object.defineProperty(PluginArray.prototype, "constructor", { value: PluginArray, writable: true, enumerable: false, configurable: true });
try { Object.defineProperty(PluginArray.prototype, Symbol.toStringTag, { value: "PluginArray", configurable: true }); } catch (e) {}

// MimeTypeArray.prototype
Object.defineProperty(MimeTypeArray.prototype, "length", {
    configurable: true,
    enumerable: true,
    get: __safefn(function () { return __indexedCount(this); }, "get length"),
    set: undefined,
});
MimeTypeArray.prototype.item = __safefn(function (i) {
    var arr = this;
    i = Number(i) | 0;
    return i >= 0 && i < __indexedCount(arr) ? arr[String(i)] : null;
}, "item");
MimeTypeArray.prototype.namedItem = __safefn(function (n) {
    var type = String(n);
    for (var k in this) {
        if (/^\d+$/.test(k)) {
            var m = this[k];
            if (m && m.type === type) return m;
        }
    }
    return null;
}, "namedItem");
Object.defineProperty(MimeTypeArray.prototype, "constructor", { value: MimeTypeArray, writable: true, enumerable: false, configurable: true });
try { Object.defineProperty(MimeTypeArray.prototype, Symbol.toStringTag, { value: "MimeTypeArray", configurable: true }); } catch (e) {}

var __pluginSet = (function () {
    var names = ["PDF Viewer", "Chrome PDF Viewer", "Chromium PDF Viewer", "Microsoft Edge PDF Viewer", "WebKit built-in PDF"];
    var plugins = [];
    var first = null;
    for (var i = 0; i < names.length; i++) {
        var mimes = [
            __mkMime("application/pdf", "pdf", "Portable Document Format"),
            __mkMime("text/pdf", "pdf", "Portable Document Format")
        ];
        var p = __mkPlugin(names[i], "internal-pdf-viewer", "Portable Document Format", mimes);
        if (!first) first = p;
        plugins.push(p);
    }
    var globalMimes = [
        __mkMime("application/pdf", "pdf", "Portable Document Format"),
        __mkMime("text/pdf", "pdf", "Portable Document Format")
    ];
    for (var j = 0; j < globalMimes.length; j++) __mimeData.get(globalMimes[j]).enabledPlugin = first;
    return { plugins: plugins, mimes: globalMimes };
})();
var __pluginArray = Object.create(PluginArray.prototype);
for (var __pi = 0; __pi < __pluginSet.plugins.length; __pi++) {
    Object.defineProperty(__pluginArray, String(__pi), { value: __pluginSet.plugins[__pi], enumerable: true, configurable: true, writable: false });
}
var __mimeArray = Object.create(MimeTypeArray.prototype);
for (var __mi = 0; __mi < __pluginSet.mimes.length; __mi++) {
    Object.defineProperty(__mimeArray, String(__mi), { value: __pluginSet.mimes[__mi], enumerable: true, configurable: true, writable: false });
}

/* #region AUTO:Navigator.prototype */
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
    // maxTouchPoints
    Object.defineProperty(Navigator.prototype, "maxTouchPoints", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get maxTouchPoints", 0),
        set: undefined,
    });
    // scheduling
    Object.defineProperty(Navigator.prototype, "scheduling", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get scheduling", 0),
        set: undefined,
    });
    // userActivation
    Object.defineProperty(Navigator.prototype, "userActivation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get userActivation", 0),
        set: undefined,
    });
    // geolocation
    Object.defineProperty(Navigator.prototype, "geolocation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get geolocation", 0),
        set: undefined,
    });
    // ink
    Object.defineProperty(Navigator.prototype, "ink", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get ink", 0),
        set: undefined,
    });
    // doNotTrack
    Object.defineProperty(Navigator.prototype, "doNotTrack", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get doNotTrack", 0, function () { return null; }),
        set: undefined,
    });
    // mediaCapabilities
    Object.defineProperty(Navigator.prototype, "mediaCapabilities", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get mediaCapabilities", 0),
        set: undefined,
    });
    // permissions
    Object.defineProperty(Navigator.prototype, "permissions", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get permissions", 0),
        set: undefined,
    });
    // webkitTemporaryStorage
    Object.defineProperty(Navigator.prototype, "webkitTemporaryStorage", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitTemporaryStorage", 0),
        set: undefined,
    });
    // webkitPersistentStorage
    Object.defineProperty(Navigator.prototype, "webkitPersistentStorage", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webkitPersistentStorage", 0, function(){
            return
        }),
        set: undefined,
    });
    // windowControlsOverlay
    Object.defineProperty(Navigator.prototype, "windowControlsOverlay", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get windowControlsOverlay", 0),
        set: undefined,
    });
    // hardwareConcurrency
    Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get hardwareConcurrency", 0),
        set: undefined,
    });
    // cookieEnabled
    Object.defineProperty(Navigator.prototype, "cookieEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get cookieEnabled", 0, function () { return true; }),
        set: undefined,
    });
    // appCodeName
    Object.defineProperty(Navigator.prototype, "appCodeName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get appCodeName", 0, function () { return "Mozilla"; }),
        set: undefined,
    });
    // appName
    Object.defineProperty(Navigator.prototype, "appName", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get appName", 0, function () { return "Netscape"; }),
        set: undefined,
    });
    // appVersion
    Object.defineProperty(Navigator.prototype, "appVersion", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get appVersion", 0,function(){
            return __navigatorUA.replace(/^Mozilla\//, "");
        }),
        set: undefined,
    });
    // platform
    Object.defineProperty(Navigator.prototype, "platform", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get platform", 0, function(){
            return __navigatorPlatform;
        }),
        set: undefined,
    });
    // product
    Object.defineProperty(Navigator.prototype, "product", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get product", 0, function () { return "Gecko"; }),
        set: undefined,
    });
    // productSub
    Object.defineProperty(Navigator.prototype, "productSub", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get productSub", 0, function () { return "20030107"; }),
        set: undefined,
    });
    // userAgent
    Object.defineProperty(Navigator.prototype, "userAgent", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get userAgent", 0, function () {
            return __navigatorUA;
        }),
        set: undefined,
    });
    // vendor
    Object.defineProperty(Navigator.prototype, "vendor", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get vendor", 0),
        set: undefined,
    });
    // vendorSub
    Object.defineProperty(Navigator.prototype, "vendorSub", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get vendorSub", 0, function () { return ""; }),
        set: undefined,
    });
    // language
    Object.defineProperty(Navigator.prototype, "language", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get language", 0, function () {
            return "zh-CN";
        }),
        set: undefined,
    });
    // languages（真机 zh-CN 环境返回 ["zh-CN"]，且同一数组实例）
    var __languages = ['zh-CN'];
    Object.defineProperty(Navigator.prototype, "languages", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get languages", 0, function () {
            return __languages
        }),
        set: undefined,
    });
    // onLine
    Object.defineProperty(Navigator.prototype, "onLine", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get onLine", 0, function () { return true; }),
        set: undefined,
    });
    // webdriver
    Object.defineProperty(Navigator.prototype, "webdriver", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get webdriver", 0, function(){
            return false;
        }),
        set: undefined,
    });
    // plugins
    Object.defineProperty(Navigator.prototype, "plugins", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get plugins", 0, function () { return __pluginArray; }),
        set: undefined,
    });
    // mimeTypes
    Object.defineProperty(Navigator.prototype, "mimeTypes", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get mimeTypes", 0, function () { return __mimeArray; }),
        set: undefined,
    });
    // pdfViewerEnabled
    Object.defineProperty(Navigator.prototype, "pdfViewerEnabled", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get pdfViewerEnabled", 0, function () { return true; }),
        set: undefined,
    });
    // connection
    Object.defineProperty(Navigator.prototype, "connection", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get connection", 0, function(){
            return csvm.memory.connection;
        }),
        set: undefined,
    });
    // getGamepads
    Object.defineProperty(Navigator.prototype, "getGamepads", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getGamepads", 0),
    });
    // javaEnabled
    Object.defineProperty(Navigator.prototype, "javaEnabled", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("javaEnabled", 0),
    });
    // sendBeacon
    Object.defineProperty(Navigator.prototype, "sendBeacon", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("sendBeacon", 1),
    });
    // vibrate
    Object.defineProperty(Navigator.prototype, "vibrate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("vibrate", 1),
    });
    // mediaSession
    Object.defineProperty(Navigator.prototype, "mediaSession", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get mediaSession", 0),
        set: undefined,
    });
    // TODO constructor: Navigator.prototype.constructor 需要手动指向接口对象
    // cpuPerformance
    Object.defineProperty(Navigator.prototype, "cpuPerformance", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get cpuPerformance", 0, function () { return 0; }),
        set: undefined,
    });
    // bluetooth
    Object.defineProperty(Navigator.prototype, "bluetooth", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get bluetooth", 0),
        set: undefined,
    });
    // clipboard
    Object.defineProperty(Navigator.prototype, "clipboard", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get clipboard", 0),
        set: undefined,
    });
    // credentials
    Object.defineProperty(Navigator.prototype, "credentials", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get credentials", 0),
        set: undefined,
    });
    // keyboard
    Object.defineProperty(Navigator.prototype, "keyboard", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get keyboard", 0),
        set: undefined,
    });
    // managed
    Object.defineProperty(Navigator.prototype, "managed", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get managed", 0),
        set: undefined,
    });
    // mediaDevices
    Object.defineProperty(Navigator.prototype, "mediaDevices", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get mediaDevices", 0),
        set: undefined,
    });
    // serviceWorker
    Object.defineProperty(Navigator.prototype, "serviceWorker", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get serviceWorker", 0),
        set: undefined,
    });
    // virtualKeyboard
    Object.defineProperty(Navigator.prototype, "virtualKeyboard", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get virtualKeyboard", 0),
        set: undefined,
    });
    // wakeLock
    Object.defineProperty(Navigator.prototype, "wakeLock", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get wakeLock", 0),
        set: undefined,
    });
    // deviceMemory
    Object.defineProperty(Navigator.prototype, "deviceMemory", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get deviceMemory", 0),
        set: undefined,
    });
    // userAgentData（NavigatorUAData：own keys 为空，属性都在原型上）
    var __uadRef = null;
    function __makeUserAgentData() {
        if (__uadRef) return __uadRef;
        var brands = [
            { brand: "Not-A.Brand", version: "99" },
            { brand: "Google Chrome", version: "157" },
            { brand: "Chromium", version: "157" }
        ];
        function NavigatorUAData() { throw new TypeError("Illegal constructor"); }
        Object.defineProperty(NavigatorUAData.prototype, Symbol.toStringTag, { value: "NavigatorUAData", configurable: true });
        Object.defineProperty(NavigatorUAData.prototype, "brands", {
            configurable: true, enumerable: true,
            get: __autoFn("get brands", 0, function () { return brands; })
        });
        Object.defineProperty(NavigatorUAData.prototype, "mobile", {
            configurable: true, enumerable: true,
            get: __autoFn("get mobile", 0, function () { return false; })
        });
        Object.defineProperty(NavigatorUAData.prototype, "platform", {
            configurable: true, enumerable: true,
            get: __autoFn("get platform", 0, function () { return "Windows"; })
        });
        Object.defineProperty(NavigatorUAData.prototype, "getHighEntropyValues", {
            configurable: true, enumerable: true, writable: true,
            value: __autoFn("getHighEntropyValues", 1, function () {
                var full = [
                    { brand: "Not-A.Brand", version: "99.0.0.0" },
                    { brand: "Google Chrome", version: "157.0.8103.78" },
                    { brand: "Chromium", version: "157.0.8103.78" }
                ];
                return Promise.resolve({
                    brands: brands, mobile: false, platform: "Windows",
                    architecture: "x86", bitness: "64", model: "",
                    platformVersion: "10.0", uaFullVersion: "157.0.8103.78",
                    fullVersionList: full, wow64: false
                });
            })
        });
        Object.defineProperty(NavigatorUAData.prototype, "toJSON", {
            configurable: true, enumerable: true, writable: true,
            value: __autoFn("toJSON", 0, function () {
                return { brands: brands, mobile: false, platform: "Windows" };
            })
        });
        csvm.safefunction(NavigatorUAData, "NavigatorUAData");
        __uadRef = Object.create(NavigatorUAData.prototype);
        return __uadRef;
    }
    Object.defineProperty(Navigator.prototype, "userAgentData", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get userAgentData", 0, function () {
            return __makeUserAgentData();
        }),
        set: undefined,
    });
    // locks（LockManager）
    var __lockManagerRef = null;
    function __makeLocks() {
        if (__lockManagerRef) return __lockManagerRef;
        var LM = function LockManager() { throw new TypeError("Illegal constructor"); };
        if (csvm.safefunction) csvm.safefunction(LM, "LockManager");
        var proto = LM.prototype;
        try { Object.defineProperty(proto, Symbol.toStringTag, { value: "LockManager", configurable: true }); } catch (e) {}
        proto.request = __autoFn("request", 1, function () { return Promise.resolve({ name: String(arguments[0]), mode: "exclusive" }); });
        proto.query = __autoFn("query", 1, function () { return Promise.resolve({ held: [], pending: [] }); });
        __lockManagerRef = Object.create(proto);
        return __lockManagerRef;
    }
    Object.defineProperty(Navigator.prototype, "locks", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get locks", 0, function () { return __makeLocks(); }),
        set: undefined,
    });
    // storage
    Object.defineProperty(Navigator.prototype, "storage", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get storage", 0),
        set: undefined,
    });
    // gpu
    Object.defineProperty(Navigator.prototype, "gpu", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get gpu", 0),
        set: undefined,
    });
    // login
    Object.defineProperty(Navigator.prototype, "login", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get login", 0),
        set: undefined,
    });
    // devicePosture
    Object.defineProperty(Navigator.prototype, "devicePosture", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get devicePosture", 0),
        set: undefined,
    });
    // hid
    Object.defineProperty(Navigator.prototype, "hid", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get hid", 0),
        set: undefined,
    });
    // presentation
    Object.defineProperty(Navigator.prototype, "presentation", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get presentation", 0),
        set: undefined,
    });
    // serial
    Object.defineProperty(Navigator.prototype, "serial", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get serial", 0),
        set: undefined,
    });
    // usb
    Object.defineProperty(Navigator.prototype, "usb", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get usb", 0),
        set: undefined,
    });
    // xr
    Object.defineProperty(Navigator.prototype, "xr", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get xr", 0),
        set: undefined,
    });
    // storageBuckets
    Object.defineProperty(Navigator.prototype, "storageBuckets", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get storageBuckets", 0),
        set: undefined,
    });
    // canShare
    Object.defineProperty(Navigator.prototype, "canShare", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("canShare", 0),
    });
    // share
    Object.defineProperty(Navigator.prototype, "share", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("share", 0),
    });
    // clearAppBadge
    Object.defineProperty(Navigator.prototype, "clearAppBadge", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("clearAppBadge", 0),
    });
    // getBattery
    Object.defineProperty(Navigator.prototype, "getBattery", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getBattery", 0, function getBattery() {
            return Promise.resolve(csvm.memory.batteryManager);
        }),
    });
    // getUserMedia
    Object.defineProperty(Navigator.prototype, "getUserMedia", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getUserMedia", 3),
    });
    // requestMIDIAccess
    Object.defineProperty(Navigator.prototype, "requestMIDIAccess", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestMIDIAccess", 0),
    });
    // requestMediaKeySystemAccess
    Object.defineProperty(Navigator.prototype, "requestMediaKeySystemAccess", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("requestMediaKeySystemAccess", 2),
    });
    // setAppBadge
    Object.defineProperty(Navigator.prototype, "setAppBadge", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setAppBadge", 0),
    });
    // webkitGetUserMedia
    Object.defineProperty(Navigator.prototype, "webkitGetUserMedia", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("webkitGetUserMedia", 3),
    });
    // getInstalledRelatedApps
    Object.defineProperty(Navigator.prototype, "getInstalledRelatedApps", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getInstalledRelatedApps", 0),
    });
    // registerProtocolHandler
    Object.defineProperty(Navigator.prototype, "registerProtocolHandler", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("registerProtocolHandler", 2),
    });
    // unregisterProtocolHandler
    Object.defineProperty(Navigator.prototype, "unregisterProtocolHandler", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("unregisterProtocolHandler", 2),
    });
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Navigator.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Navigator",
    });
})();
/* #endregion AUTO:Navigator.prototype */

// 对齐 Playwright Chrome 环境的 Navigator 值（写在 AUTO 区外，重跑生成器不会丢）
function __define_navigator_value(name, value) {
    Object.defineProperty(Navigator.prototype, name, {
        configurable: true,
        enumerable: true,
        get: csvm.safefunction(function () { return value; }, "get " + name),
        set: undefined
    });
}
__define_navigator_value("hardwareConcurrency", 16);
__define_navigator_value("deviceMemory", 16);
__define_navigator_value("vendor", "Google Inc.");
__define_navigator_value("maxTouchPoints", 10);


csvm.ban_parent(Navigator, "Illegal invocation");

navigator.__proto__ = Navigator.prototype;
navigator = csvm.proxy(navigator, "navigator");

Navigator = csvm.proxy(Navigator, "Navigator");

// 补齐真机存在、当前 getter 返回 undefined 的 Navigator 接口（先对齐 typeof/标签）
(function () {
    var tagOf = {
        scheduling: "Scheduling", userActivation: "UserActivation", geolocation: "Geolocation",
        ink: "Ink", mediaCapabilities: "MediaCapabilities", permissions: "Permissions",
        windowControlsOverlay: "WindowControlsOverlay", mediaSession: "MediaSession",
        bluetooth: "Bluetooth", clipboard: "Clipboard", credentials: "CredentialsContainer",
        keyboard: "Keyboard", managed: "NavigatorManagedData", mediaDevices: "MediaDevices",
        serviceWorker: "ServiceWorkerContainer", virtualKeyboard: "VirtualKeyboard",
        wakeLock: "WakeLock", storage: "StorageManager", gpu: "GPU", login: "NavigatorLogin",
        devicePosture: "DevicePosture", hid: "HID", presentation: "Presentation",
        serial: "Serial", usb: "USB", xr: "XRSystem", storageBuckets: "StorageBucketManager"
    };
    var cache = Object.create(null);
    function stub(n) {
        if (cache[n]) return cache[n];
        var o = {};
        try { Object.defineProperty(o, Symbol.toStringTag, { value: tagOf[n] || n, configurable: true }); } catch (e) {}
        cache[n] = o;
        return o;
    }
    function makeGetter(n) {
        var f = function () { return stub(n); };
        try { Object.defineProperty(f, "name", { value: "get " + n, writable: false, enumerable: false, configurable: true }); } catch (e) {}
        try { if (csvm.safefunction) csvm.safefunction(f, "get " + n); } catch (e) {}
        return f;
    }
    Object.keys(tagOf).forEach(function (n) {
        try {
            Object.defineProperty(Navigator.prototype, n, {
                configurable: true, enumerable: true, get: makeGetter(n), set: undefined
            });
        } catch (e) {}
    });
})();
