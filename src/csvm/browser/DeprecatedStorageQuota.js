// DeprecatedStorageQuota 是 [NoInterfaceObject]：Chrome 没有 window.DeprecatedStorageQuota，
// 只通过 navigator.webkitPersistentStorage / webkitTemporaryStorage 暴露实例。
// 先做最小占位：普通对象原型 + Symbol.toStringTag，queryUsageAndQuota / requestQuota
// 等目标真正调用时再补。
try { csvm.memory.dsqUndef = globalThis.__CSVM_DSQ_UNDEF === true; delete globalThis.__CSVM_DSQ_UNDEF; } catch (e) {}
var DeprecatedStorageQuotaProto = {};

Object.defineProperty(DeprecatedStorageQuotaProto, Symbol.toStringTag, {
    value: "DeprecatedStorageQuota",
    writable: false,
    enumerable: false,
    configurable: true
});

// 真机两个 getter 返回同一个实例：
// navigator.webkitPersistentStorage === navigator.webkitTemporaryStorage
// 真机方法：queryUsageAndQuota(usageCallback, errorCallback)
//           requestQuota(newQuota, successCallback, errorCallback)
// 先给真实值，并打标记看目标是否真的调用
// 真机语义（Chrome 157，https 页面实测）：
//   queryUsageAndQuota(cb) 的回调是**异步**的，参数 (usage=0, quota=10737418240)
//   requestQuota(n, cb)    同样是异步回调
// 我们之前是同步回调 + 1GB —— 这正是挑战自检「webkitPersistentStorage 是否伪造」
// 会命中的点：同步回调 = 明显的补环境特征（会置 tamper 位 bit24）。
// 真机方法做 brand check：用错误的 this 调用会抛 TypeError（WebIDL Illegal invocation）
function __dsqLog(msg){ try { if (typeof __CSVM_DSQ_TRACE !== "undefined" && __CSVM_DSQ_TRACE) console.log("[DSQ-T] " + msg); } catch(e){} }
function __dsqThis(self) {
    if (self !== csvm.memory.webkitStorageQuota) {
        throw new TypeError("Illegal invocation");
    }
}

function __dsqAsync(fn) {
    try {
        if (typeof setTimeout === "function") setTimeout(fn, 0);
        else if (typeof queueMicrotask === "function") queueMicrotask(fn);
        else Promise.resolve().then(fn);
    } catch (e) { try { Promise.resolve().then(fn); } catch (e2) {} }
}

Object.defineProperty(DeprecatedStorageQuotaProto, "queryUsageAndQuota", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: { queryUsageAndQuota(usageCallback, errorCallback) {
        __dsqLog("queryUsageAndQuota args=" + arguments.length);
        __dsqThis(this);
        // WebIDL 参数校验（真机实测消息）
        if (arguments.length < 1) {
            throw new TypeError("Failed to execute 'queryUsageAndQuota' on 'DeprecatedStorageQuota': 1 argument required, but only 0 present.");
        }
        if (typeof usageCallback !== "function") {
            throw new TypeError("Failed to execute 'queryUsageAndQuota' on 'DeprecatedStorageQuota': parameter 1 is not of type 'Function'.");
        }
        if (errorCallback !== undefined && typeof errorCallback !== "function") {
            throw new TypeError("Failed to execute 'queryUsageAndQuota' on 'DeprecatedStorageQuota': parameter 2 is not of type 'Function'.");
        }
        __dsqAsync(function () {
            try {
                if (typeof usageCallback === "function") usageCallback(0, 10737418240);
            } catch (e) {
                try { if (typeof errorCallback === "function") errorCallback(e); } catch (e2) {}
            }
        });
    } }.queryUsageAndQuota
});
csvm.safefunction(DeprecatedStorageQuotaProto.queryUsageAndQuota, "queryUsageAndQuota");
// 真机 length 是 1（WebIDL 只算第一个必填参数）
try { Object.defineProperty(DeprecatedStorageQuotaProto.queryUsageAndQuota, "length", { value: 1, writable: false, enumerable: false, configurable: true }); } catch (e) {}

Object.defineProperty(DeprecatedStorageQuotaProto, "requestQuota", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: { requestQuota(newQuota, successCallback, errorCallback) {
        __dsqLog("requestQuota args=" + arguments.length);
        __dsqThis(this);
        if (arguments.length < 1) {
            throw new TypeError("Failed to execute 'requestQuota' on 'DeprecatedStorageQuota': 1 argument required, but only 0 present.");
        }
        if (successCallback !== undefined && typeof successCallback !== "function") {
            throw new TypeError("Failed to execute 'requestQuota' on 'DeprecatedStorageQuota': parameter 2 is not of type 'Function'.");
        }
        if (errorCallback !== undefined && typeof errorCallback !== "function") {
            throw new TypeError("Failed to execute 'requestQuota' on 'DeprecatedStorageQuota': parameter 3 is not of type 'Function'.");
        }
        __dsqAsync(function () {
            try {
                if (typeof successCallback === "function") successCallback(Number(newQuota) || 0);
            } catch (e) {
                try { if (typeof errorCallback === "function") errorCallback(e); } catch (e2) {}
            }
        });
    } }.requestQuota
});
csvm.safefunction(DeprecatedStorageQuotaProto.requestQuota, "requestQuota");
try { Object.defineProperty(DeprecatedStorageQuotaProto.requestQuota, "length", { value: 1, writable: false, enumerable: false, configurable: true }); } catch (e) {}

// 原型是普通对象，没有自有 constructor，instance.constructor 会继承 Object，和真机一致
var __dsqInst = Object.create(DeprecatedStorageQuotaProto);
csvm.memory.webkitStorageQuota = __dsqInst;

// navigator.js 里这两个 getter 是空壳（configurable:true），这里覆盖成从内存读同一个实例
// 注意：必须做 brand check —— navigator.js 的 ban_parent 在这一步之后被本文件覆盖，
// 真机 getter 用错误 receiver 调用会抛 Illegal invocation，挑战会据此判伪。
function __dsqBrandNav(self) {
    if (!(self instanceof Navigator)) throw new TypeError("Illegal invocation");
}

Object.defineProperty(Navigator.prototype, "webkitPersistentStorage", {
    get: csvm.safefunction(function () {
        __dsqBrandNav(this);
        if (csvm.memory.dsqUndef === true) return undefined;
        return csvm.memory.webkitStorageQuota;
    }, "get webkitPersistentStorage"),
    set: undefined,
    enumerable: true,
    configurable: true
});

Object.defineProperty(Navigator.prototype, "webkitTemporaryStorage", {
    get: csvm.safefunction(function () {
        __dsqBrandNav(this);
        if (csvm.memory.dsqUndef === true) return undefined;
        return csvm.memory.webkitStorageQuota;
    }, "get webkitTemporaryStorage"),
    set: undefined,
    enumerable: true,
    configurable: true
});
