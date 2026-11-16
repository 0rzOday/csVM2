localStorage = {};
sessionStorage ={};
var Storage=function Storage(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(Storage);
Object.defineProperty(Storage.prototype,Symbol.toStringTag,{value:"Storage",configurable:true});

/* #region AUTO:Storage.prototype */
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
    // length
    Object.defineProperty(Storage.prototype, "length", {
        configurable: true,
        enumerable: true,
        get: __autoFn("get length", 0, function () {
            var s = csvm.memory.Storage.get(this);
            return s ? s.items.size : 0;
        }),
        set: undefined,
    });
    // clear
    Object.defineProperty(Storage.prototype, "clear", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("clear", 0, function () {
            var s = csvm.memory.Storage.get(this);
            if (s) s.items.clear();
        }),
    });
    // getItem
    Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("getItem", 1,function(key){
            var thisStorage=csvm.memory.Storage.get(this);
            var k = String(key);
            return thisStorage.items.has(k) ? thisStorage.items.get(k) : null;
        }),
    });
    // key
    Object.defineProperty(Storage.prototype, "key", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("key", 1, function (index) {
            var thisStorage = csvm.memory.Storage.get(this);
            if (!thisStorage) return null;
            var keys = Array.from(thisStorage.items.keys());
            var i = Number(index) | 0;
            return i >= 0 && i < keys.length ? keys[i] : null;
        }),
    });
    // removeItem
    Object.defineProperty(Storage.prototype, "removeItem", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("removeItem", 1,function(key){
            var thisStorage=csvm.memory.Storage.get(this);
            thisStorage.items.delete(String(key));
        }),
    });
    // setItem
    Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: __autoFn("setItem", 2,function(key,value){
            var thisStorage=csvm.memory.Storage.get(this);
            if (!thisStorage) return;
            thisStorage.items.set(String(key), String(value));
        }),
    });
    // TODO constructor: Storage.prototype.constructor 需要手动指向接口对象
    // Symbol(Symbol.toStringTag) (symbol)
    Object.defineProperty(Storage.prototype, Symbol.toStringTag, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: "Storage",
    });
})();
/* #endregion AUTO:Storage.prototype */

// Web Storage 的命名属性是「条目」，不是普通自有属性：
//   localStorage.___TS___ = "v"  →  length+1、key(0)==="___TS___"、getItem 能读到
//   removeItem("___TS___")       →  属性访问变回 undefined
// 之前直接 proxy 普通对象，命名属性只落成 own property，挑战用这套语义自检时会读到不同的值。
function __makeStorage() {
    var store = { items: new Map() };
    var target = {};
    Object.setPrototypeOf(target, Storage.prototype);
    function isItem(prop) { return typeof prop === "string" && store.items.has(prop); }
    function isProtoMember(prop) {
        if (typeof prop !== "string") return true;
        return prop in Storage.prototype;
    }
    var p = new Proxy(target, {
        get: function (t, prop, recv) {
            if (isItem(prop)) return store.items.get(prop);
            return Reflect.get(t, prop, recv);
        },
        set: function (t, prop, value, recv) {
            if (!isProtoMember(prop)) { store.items.set(String(prop), String(value)); return true; }
            return Reflect.set(t, prop, value, recv);
        },
        has: function (t, prop) {
            return isItem(prop) || Reflect.has(t, prop);
        },
        deleteProperty: function (t, prop) {
            if (isItem(prop)) { store.items.delete(prop); return true; }
            return Reflect.deleteProperty(t, prop);
        },
        ownKeys: function (t) {
            var ks = [];
            store.items.forEach(function (v, k) { ks.push(k); });
            return ks.concat(Reflect.ownKeys(t).filter(function (k) { return !isItem(k); }));
        },
        getOwnPropertyDescriptor: function (t, prop) {
            if (isItem(prop)) {
                return { value: store.items.get(prop), writable: true, enumerable: true, configurable: true };
            }
            return Reflect.getOwnPropertyDescriptor(t, prop);
        },
        defineProperty: function (t, prop, desc) {
            if (!isProtoMember(prop) && desc && ("value" in desc)) {
                store.items.set(String(prop), String(desc.value));
                return true;
            }
            return Reflect.defineProperty(t, prop, desc);
        },
    });
    return { store: store, proxy: p };
}

var __ls = __makeStorage();
var __ss = __makeStorage();
localStorage = csvm.proxy ? csvm.proxy(__ls.proxy, "localStorage") : __ls.proxy;
sessionStorage = csvm.proxy ? csvm.proxy(__ss.proxy, "sessionStorage") : __ss.proxy;
// 方法里的 this 可能是内层或外层代理，两个都登记
csvm.memory.Storage.set(__ls.proxy, __ls.store);
csvm.memory.Storage.set(localStorage, __ls.store);
csvm.memory.Storage.set(__ss.proxy, __ss.store);
csvm.memory.Storage.set(sessionStorage, __ss.store);
