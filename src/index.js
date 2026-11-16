const __vm2mod = require("vm2");
const fs = require("fs");
const path = require("path");
let acorn = null;
try { acorn = require("acorn"); } catch (e) { /* CSVM_DDA 实验用的可选依赖 */ }
let astring = null;
try { astring = require("astring"); } catch (e) { /* CSVM_DDA 实验用的可选依赖 */ }

// 原生 undetectable 对象（HTMLDDA），可选依赖：未编译时框架行为不变
let nativeDDA = null;
try {
    nativeDDA = require(path.resolve(__dirname, "..", "native", "dda", "build", "Release", "dda.node"));
} catch (e) {
    nativeDDA = null;
}
const parse5 = require("parse5");

const csvm = require(`${__dirname}/csvm/csvm.node.js`);

// 日志落盘的开关在框架内存里（csvm.memory.config.logFile），
// 框架加载完之后通过 api.getConfig() 读取，再初始化（见 setupLogFile）。

// 补环境代码（tools + browser + DOM）
const csvm_code = csvm.GetCode();

// ---------------------------------------------------------------------------
// VM 指令级观测（仅诊断用）
//
// 目标 VM 的解释器是运行时 eval 出来的（约 294KB），opcode 分派是
//   else if(_$cr===660){...}
// 这种链式结构。这里在 eval 源码进入沙箱前做定点替换，把观测代码塞进
// 关键指令内部。所有记录写到 globalThis.__vmWatch，宿主通过 api.getVmWatch()
// 取出。只有 installVmTrace()（CSVM_VM_TRACE / CSVM_OP269 / CSVM_GR660 /
// CSVM_VMWATCH）时才会安装，正常补环境跑不受影响。
//
// 观测点：
//   ap      opcode 75  _$ap=_$gg(_$e6[39])   —— 参数个数从哪来
//   fill    opcode 78  填充 _$gr 前后            —— 参数数组怎么被写
//   op660   opcode 660 _$az=_$gr[_$_W]        —— 取表项
//   op295   opcode 295 _$jj=_$az              —— 布尔化
//   op302   opcode 302 !_$jj?_$gU+=1:0        —— 条件跳转（分叉点）
// ---------------------------------------------------------------------------
const vmwatch_code = String.raw`
(function () {
    var __vmwInstalled = false;
    function __vmwDef(name, fn) {
        try { Object.defineProperty(globalThis, name, { value: fn, writable: true, enumerable: false, configurable: true }); } catch (e) {}
    }
    function __vmwInstall() {
        if (__vmwInstalled) return;
        __vmwInstalled = true;
        globalThis.__vmWatch = [];
        __vmwDef('__vmw', function (tag, obj) {
            try {
                if (!obj || typeof obj !== 'object') obj = { value: obj };
                if (globalThis.__vmWatch.length >= (globalThis.__CSVM_WATCH_CAP || 4000)) return;
                obj.tag = tag;
                globalThis.__vmWatch.push(obj);
            } catch (e) {}
        });
        __vmwDef('__vdesc', function (v) {
            try {
                if (v === undefined) return 'undefined';
                if (v === null) return 'null';
                var t = typeof v;
                if (t === 'string') return 'string(' + v.length + '):' + (v.length > 80 ? v.slice(0, 80) + '...' : v);
                if (t === 'number' || t === 'boolean' || t === 'bigint') return t + ':' + String(v);
                if (t === 'symbol') return 'symbol';
                if (t === 'function') return 'function';
                var tag = '[object]';
                try { tag = Object.prototype.toString.call(v); } catch (e) {}
                var len = '';
                try { if (typeof v.length === 'number') len = ' len=' + v.length; } catch (e) {}
                var ctor = '';
                try { ctor = (v.constructor && v.constructor.name) ? ' ctor=' + v.constructor.name : ''; } catch (e) {}
                return t + ':' + tag + len + ctor;
            } catch (e) { return 'desc-err:' + String(e && e.message); }
        });
        __vmwDef('__varr', function (a, n) {
            try {
                if (!Array.isArray(a)) return globalThis.__vdesc(a);
                var out = [];
                var lim = Math.min(a.length, n || 40);
                for (var i = 0; i < lim; i++) {
                    var v = a[i];
                    out.push(i + '=' + globalThis.__vdesc(v));
                }
                return '[' + out.join(', ') + ']';
            } catch (e) { return 'arr-err:' + String(e && e.message); }
        });
        // 指令环：状态全部在闭包里（绕开 vm2 eval 与框架 globalThis 不同的问题）。
        // eval 侧调用 globalThis.__admark(pc,op)，框架侧用 __adRecOn/__adRingGet 控制与读取。
        var __adRing = [];
        var __adRec = false;
        var __adLimit = 4000;
        var __adPos = 0;
        var __adFull = false;
        var __adIds = new WeakMap();
        var __adSeq = 0;
        // 字节码数组 id → 函数 hash（__fidOf），用于按 hash 定位函数、导出映射
        var __adIdHash = Object.create(null);
        __vmwDef('__adRecOn', function (n) { __adRec = true; __adLimit = n || 4000; __adRing.length = 0; __adPos = 0; __adFull = false; return true; });
        __vmwDef('__adOff', function () { __adRec = false; return true; });
        __vmwDef('__admark', function (pc, op, top, arr, o1, o2, o3, snap) {
            try { globalThis.__adPc = pc; globalThis.__adOp = op; } catch (e) {}
            try {
                if (arr && typeof arr === 'object') {
                    var __ida = 0;
                    __ida = __adIds.get(arr); if (!__ida) { __ida = ++__adSeq; __adIds.set(arr, __ida); }
                    try { if (!__adIdHash[__ida]) __adIdHash[__ida] = globalThis.__fidOf(arr); } catch (e) {}
                    globalThis.__adArrId = __ida;
                    // 函数入口处绑定「本次调用」的字节码数组 id（取第一条指令所在的数组）
                    try {
                        var __cs0 = globalThis.__callStack;
                        if (__cs0 && __cs0.length) {
                            var __t = __cs0[__cs0.length - 1];
                            if (__t && __t.id === 0) {
                                __t.id = __ida;
                                try { if (globalThis.__CSVM_FOCUS_MAP) globalThis.__vmw('entry', { h: __t.h, id: __ida, pc: __adPc }); } catch (e) {}
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {}
            try {
                if (globalThis.__adArrCap && arr && typeof arr === "object") {
                    var __id0 = 0;
                    try { __id0 = __adIds.get(arr); if (!__id0) { __id0 = ++__adSeq; __adIds.set(arr, __id0); } } catch (e) {}
                    if (!globalThis.__adArrCap[__id0]) globalThis.__adArrCap[__id0] = Array.prototype.slice.call(arr, 0, 80);
                }
            } catch (e) {}
            if (!__adRec) return;
            try {
                if (globalThis.__CSVM_FOCUS_MAP && globalThis.__hashOfArr) {
                    var __fh = globalThis.__hashOfArr(arr);
                    if (!globalThis.__CSVM_FOCUS_MAP[__fh]) return;
                }
            } catch (e) {}
            var id = 0;
            try { if (arr && typeof arr === 'object') { id = __adIds.get(arr); if (!id) { id = ++__adSeq; __adIds.set(arr, id); } } } catch (e) {}
            try { globalThis.__adArrId = id; } catch (e) {}
            var item = [pc, op, top, id, o1, o2, o3, snap];

            if (__adRing.length < __adLimit) { __adRing.push(item); }
            else { __adRing[__adPos] = item; __adPos = (__adPos + 1) % __adLimit; __adFull = true; }
        });
        __vmwDef('__adRingGet', function () {
            if (!__adFull) return JSON.stringify(__adRing);
            return JSON.stringify(__adRing.slice(__adPos).concat(__adRing.slice(0, __adPos)));
        });
        __vmwDef('__adIdHashGet', function () { try { return JSON.stringify(__adIdHash); } catch (e) { return '{}'; } });
        var __arrHashCache = (typeof WeakMap === 'function') ? new WeakMap() : null;
        __vmwDef('__hashOfArr', function (arr) {
            try {
                if (!__arrHashCache) return 0;
                var h = __arrHashCache.get(arr);
                if (h === undefined) { h = globalThis.__fidOf(arr); __arrHashCache.set(arr, h); }
                return h;
            } catch (e) { return 0; }
        });
        __vmwDef('__adRingLen', function () { return __adRing.length; });
        __vmwDef('__adRingTail', function (n) {
            try {
                n = n || 100;
                var out = __adFull ? __adRing.slice(__adPos).concat(__adRing.slice(0, __adPos)) : __adRing.slice();
                return out.slice(-n);
            } catch (e) { return null; }
        });
        // 寄存器文件识别：解释器 _$aD 的 _$dK[0] 就是 _$ij（寄存器/作用域表）。
        // CSVM_IJ_PROXY=1 时把 _$dK[0] 换成 Proxy，捕获所有写入（含解释器 store 之外的路径）。
        var __adDkSet = (typeof WeakSet === 'function') ? new WeakSet() : null;
        var __ijProxied = (typeof WeakSet === 'function') ? new WeakSet() : null;
        var __scopeSet = (typeof WeakSet === 'function') ? new WeakSet() : null;
        var __scopeArrSet = (typeof WeakSet === 'function') ? new WeakSet() : null;
        __vmwDef('__ijDesc', function (v) {            if (typeof v === 'string') return 's(' + v.length + '):' + (v.length > 200 ? v.slice(0, 200) + '~' : v);
            if (v === null) return 'null';
            var t = typeof v;
            if (t === 'object') return 'obj';
            return t + ':' + String(v);
        });
        __vmwDef('__fidOf', function (ik) {
            try {
                if (!ik || typeof ik.length !== 'number') return 0;
                var h = (ik.length * 2654435761) >>> 0;
                var n = ik.length;
                for (var i = 0; i < n && i < 48; i++) h = ((h * 31) + (ik[i] | 0)) >>> 0;
                for (var j = Math.max(0, n - 12); j < n; j++) h = ((h * 33) + (ik[j] | 0)) >>> 0;
                return h;
            } catch (e) { return 0; }
        });
        __vmwDef('__fpush', function (h, self) {
            try {
                var cs = (globalThis.__callStack = globalThis.__callStack || []);
                var caller = cs.length ? cs[cs.length - 1].h : 0;
                if (globalThis.__CSVM_FOCUS_MAP && (globalThis.__CSVM_FOCUS_MAP['*'] || globalThis.__CSVM_FOCUS_MAP[h] || globalThis.__CSVM_FOCUS_MAP[caller])) {
                    globalThis.__callN = (globalThis.__callN || 0) + 1;
                    if (globalThis.__callN <= 40000) {
                        var __task = null;
                        try { if (self && typeof self === 'object' && typeof self._$gS === 'number') __task = self._$gS; } catch (e0) {}
                        globalThis.__vmw('call', {
                            n: globalThis.__callN, callee: h, caller: caller,
                            pc: (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1),
                            depth: cs.length, task: __task
                        });
                    }
                }
                cs.push({ h: h, id: 0, self: self });
                if (cs.length > 40) cs.shift();
            } catch (e) {}
        });
        __vmwDef('__fpop', function () { try { globalThis.__callStack && globalThis.__callStack.pop(); } catch (e) {} });
        __vmwDef('__csStr', function (n) { try { return (globalThis.__callStack || []).slice(-(n || 6)).map(function (x) { return x.h; }).join('>'); } catch (e) { return ''; } });
        __vmwDef('__csTop', function () { try { var c = globalThis.__callStack; return (c && c.length) ? c[c.length - 1] : null; } catch (e) { return null; } });
        // 加密调用的结构特征：arg0=8 字节头、arg1=80~400 字节载荷、arg2=21 字节 nonce、arg3=1
        __vmwDef('__isEncodeCall', function (args) {
            try {
                if (!args || args.length < 3) return false;
                var a0 = args[0], a1 = args[1], a2 = args[2];
                return !!(a0 && typeof a0.length === 'number' && a0.length === 8 &&
                    a1 && typeof a1.length === 'number' && a1.length >= 80 && a1.length <= 400 &&
                    a2 && typeof a2.length === 'number' && a2.length === 21);
            } catch (e) { return false; }
        });
        __vmwDef('__fthis', function (T) {
            try {
                if (!globalThis.__CSVM_OBJDUMP) return;
                if (!T || typeof T.length !== 'number' || T.length < 8 || T.length > 40) return;
                var dump = [];
                for (var i = 0; i < T.length; i++) {
                    var ob = T[i], rec = {};
                    if (!ob || typeof ob !== 'object') { dump.push(String(ob)); continue; }
                    try {
                        for (var k in ob) {
                            var v = ob[k];
                            if (typeof v === 'string') rec[k] = v.slice(0, 60);
                            else if (v === null) rec[k] = null;
                            else if (typeof v === 'object') rec[k] = '[obj]';
                            else rec[k] = String(v);
                        }
                    } catch (e) { rec.__err = 1; }
                    dump.push(rec);
                }
                console.log('[OBJDUMP] ' + JSON.stringify(dump));
            } catch (e) {}
        });
        __vmwDef('__fargs', function (args, ctx) {
            try {
                if (!args) return;
                // 诊断：dump「对象数组」实参（序列化函数的输入）
                try {
                    if (globalThis.__CSVM_OBJDUMP) {
                        var __ao = args[0];
                        if (__ao && typeof __ao.length === 'number' && __ao.length >= 8 && __ao.length <= 40 && __ao[0] && typeof __ao[0] === 'object') {
                            var __dump = [];
                            for (var __oi = 0; __oi < __ao.length; __oi++) {
                                var __ob = __ao[__oi], __rec = {};
                                try {
                                    for (var __kk in __ob) {
                                        var __vv = __ob[__kk];
                                        if (typeof __vv === 'string') __rec[__kk] = __vv.slice(0, 60);
                                        else if (__vv === null) __rec[__kk] = null;
                                        else if (typeof __vv === 'object') __rec[__kk] = '[obj]';
                                        else __rec[__kk] = String(__vv);
                                    }
                                } catch (__e1) { __rec.__err = 'ERR'; }
                                __dump.push(__rec);
                            }
                            console.log('[OBJDUMP] ' + JSON.stringify(__dump));
                        }
                    }
                } catch (__e2) {}
                // 诊断：把加密前的载荷替换成外部给定的数组（验证「载荷内容」是不是唯一判据）
                try {
                    var __isEnc = globalThis.__isEncodeCall && globalThis.__isEncodeCall(args);
                    if (globalThis.__CSVM_PAYLOAD_PRINT && __isEnc) {
                        try {
                            var __pa = [], __src0 = args[1];
                            for (var __pj = 0; __pj < __src0.length && __pj < 2000; __pj++) __pa.push(__src0[__pj]);
                            console.log("[PAYLOAD] " + JSON.stringify(__pa));
                            if (globalThis.__CSVM_ENC_ARGS_PRINT) {
                                var __h0 = [], __n0 = [];
                                for (var __hi = 0; __hi < (args[0] ? args[0].length : 0); __hi++) __h0.push(args[0][__hi]);
                                for (var __ni = 0; __ni < (args[2] ? args[2].length : 0); __ni++) __n0.push(args[2][__ni]);
                                console.log("[ENC-ARGS] " + JSON.stringify({ h: __h0, n: __n0 }));
                            }
                        } catch (e9) {}
                    }
                    var __pp = globalThis.__CSVM_PAYLOAD;
                    var __ea = globalThis.__CSVM_ENC_ARGS;
                    if ((__pp || __ea) && __isEnc) {
                        var __a1 = args[1];
                        if (__ea) {
                            for (var __ei = 0; __ei < 3; __ei++) {
                                var __src = __ea[__ei], __dst = args[__ei];
                                if (__src && __dst && typeof __dst.length === 'number') {
                                    __dst.length = __src.length;
                                    for (var __ej = 0; __ej < __src.length; __ej++) __dst[__ej] = __src[__ej];
                                }
                            }
                            globalThis.__payPatched = (globalThis.__payPatched || 0) + 1;
                        } else if (__a1 && typeof __a1 === 'object' && typeof __a1.length === 'number') {
                            __a1.length = __pp.length;
                            for (var __pi = 0; __pi < __pp.length; __pi++) __a1[__pi] = __pp[__pi];
                            globalThis.__payPatched = (globalThis.__payPatched || 0) + 1;
                        }
                    }
                } catch (e8) {}
                // 全量入参 dump（只对指定 callee 生效，避免刷屏）
                try {
                    var __fm2 = globalThis.__CSVM_ARG_ALL;
                    if (__fm2) {
                        var __topA = globalThis.__csTop ? globalThis.__csTop() : null;
                        var __h = __topA ? __topA.h : 0;
                        var __shape = globalThis.__isEncodeCall && globalThis.__isEncodeCall(args);
                        if (__fm2[__h] || __fm2["*"] || (__fm2["enc"] && __shape)) {
                            globalThis.__aaN = (globalThis.__aaN || 0) + 1;
                            if (globalThis.__aaN <= 4000) {
                                var __list = [];
                                for (var ai2 = 0; ai2 < args.length && ai2 < 12; ai2++) {
                                    var a2 = args[ai2], at2 = typeof a2, d2;
                                    if (at2 === 'string') d2 = { t: 's', len: a2.length, v: a2.slice(0, 300) };
                                    else if (at2 === 'number' || at2 === 'boolean') d2 = { t: at2, v: String(a2) };
                                    else if (a2 === null) d2 = { t: 'null' };
                                    else if (at2 === 'object') {
                                        d2 = { t: 'o', tag: Object.prototype.toString.call(a2), len: a2.length };
                                        try {
                                            if (!(typeof a2.length === 'number' && a2.length > 0) && globalThis.__vsnapAll) d2.props = globalThis.__vsnapAll(a2);
                                        } catch (e5) {}
                                        try {
                                            var pv2 = [];
                                            for (var pi2 = 0; pi2 < Math.min(a2.length || 0, 60); pi2++) {
                                                var e2 = a2[pi2];
                                                pv2.push(globalThis.__vsnap ? globalThis.__vsnap(e2) : (typeof e2 === 'string' ? e2.slice(0, 60) : (typeof e2 === 'object' ? '[o]' : String(e2))));
                                            }
                                            d2.first = pv2;
                                        } catch (e6) {}
                                    } else d2 = { t: at2 };
                                    __list.push(d2);
                                }
                                globalThis.__vmw('argsAll', { n: globalThis.__aaN, callee: __h, cs: globalThis.__csStr ? globalThis.__csStr(5) : '', args: __list });
                            }
                        }
                    }
                } catch (e7) {}
                var hit = null;
                for (var i = 0; i < args.length; i++) {
                    var v = args[i];
                    if (typeof v === 'string' && v.length >= 20 && v.length <= 8000) { hit = { i: i, len: v.length, v: v.slice(0, 1200) }; break; }
                    if (Array.isArray(v) && v.length > 0) {
                        var s0 = v[0];
                        if (typeof s0 === 'string' && s0.length >= 20 && s0.length <= 8000) { hit = { i: i, arr: v.length, arr0len: s0.length, v: s0.slice(0, 1200) }; break; }
                        if (globalThis.__CSVM_ARG_ARR && v.length >= 20 && v.length <= 500) {
                            var fa = [];
                            for (var q = 0; q < Math.min(v.length, 10); q++) fa.push(typeof v[q] === 'string' ? v[q].slice(0, 40) : String(v[q]));
                            hit = { i: i, arr: v.length, arrFirst: fa };
                            break;
                        }
                    }
                }
                if (!hit) return;
                globalThis.__argN = (globalThis.__argN || 0) + 1;
                if (globalThis.__argN > 4000) return;
                hit.n = globalThis.__argN;
                hit.cp = (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1);
                hit.ca = globalThis.__adArrId || 0;
                hit.cs = globalThis.__csStr ? globalThis.__csStr(6) : '';
                var __top = globalThis.__csTop ? globalThis.__csTop() : null;
                hit.callee = __top ? __top.h : 0;
                globalThis.__vmw('arg', hit);
            } catch (e) {}
        });
        __vmwDef('__fpushv', function (arr, v) {
            try {
                if (globalThis.__CSVM_SCOPELOG && __scopeArrSet && arr && typeof arr === 'object' && __scopeArrSet.has(arr)) {
                    console.log('[PUSH0] v=' + globalThis.__vsnap(v) + ' arrlen=' + arr.length +
                        ' h=' + (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) +
                        ' pc=' + (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1));
                }
            } catch (e) {}
            return arr.push(v);
        });
        __vmwDef('__fc1m', function (obj, key, a, pc) {
            var fn, r;
            try { fn = obj[key]; } catch (e) {}
            try { r = fn.call(obj, a); }
            catch (e) { throw e; }
            try {
                if (globalThis.__CSVM_SCOPELOG && __scopeArrSet && obj && typeof obj === 'object' && __scopeArrSet.has(obj)) {
                    console.log('[PUSH1] k=' + String(key) + ' v=' + globalThis.__vsnap(a) + ' arrlen=' + (obj.length) +
                        ' h=' + (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) + ' pc=' + pc);
                }
            } catch (e3) {}
            return r;
        });
        __vmwDef('__gpush', function (scope, key) {
            var v;
            try { v = scope[key]; } catch (e) { return undefined; }
            try {
                if (globalThis.__CSVM_SCOPELOG && Array.isArray(v)) {
                    if (__scopeArrSet) __scopeArrSet.add(v);
                    if (v.length >= 2 && v.length <= 40) {
                        var s = [];
                        for (var i = 0; i < v.length && i < 40; i++) s.push(v[i]);
                        console.log('[GPUSH] k=' + String(key) + ' len=' + v.length + ' [' + s.join(',') + ']');
                    }
                }
            } catch (e2) {}
            return v;
        });
        __vmwDef('__fget2', function (obj, key, pc) {
            var v = obj[key];
            try {
                if (globalThis.__CSVM_GETLOG) {
                    var __isNav = (typeof globalThis.navigator === 'object' && obj === globalThis.navigator);
                    var __isWin = (obj === globalThis) || (typeof globalThis.window === 'object' && obj === globalThis.window);
                    var __isDoc = (typeof globalThis.document === 'object' && obj === globalThis.document);
                    if (__isNav || __isWin || __isDoc) {
                        var __hh2 = (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0);
                        console.log('[GET2] pc=' + pc + ' on=' + (__isNav ? 'nav' : (__isWin ? 'win' : 'doc')) + ' key=' + String(key) +
                            ' val=' + (globalThis.__vsnap ? globalThis.__vsnap(v) : String(v)) + ' h=' + __hh2);
                    }
                }
            } catch (e) {}
            return v;
        });
        __vmwDef('__fc0', function (obj, key, pc) {
            var fn, r;
            try { fn = obj[key]; } catch (e) {}
            try { r = fn.call(obj); } catch (e) { throw e; }
            try {
                if (globalThis.__CSVM_CALL0) {
                    globalThis.__c0N = (globalThis.__c0N || 0) + 1;
                    if (globalThis.__c0N <= 40000) {
                        var __h0 = (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0);
                        var __st0 = (globalThis.__cs2 || []).map(function (x) { return x.h; }).slice(-4).join('<');
                        console.log('[CALL0] pc=' + pc + ' h=' + __h0 + ' key=' + String(key) +
                            ' ret=' + (globalThis.__vsnap ? globalThis.__vsnap(r) : String(r)) + ' st=' + __st0);
                    }
                }
            } catch (e0) {}
            return r;
        });
        __vmwDef('__fccall', function (fn, a, b, pc) {
            var r;
            // 诊断：命中「置位调用」(bit24/bit27) 时，把调用方的整段字节码 dump 出来
            try {
                if (globalThis.__CSVM_BITDUMP && (a === 134217728 || a === 16777216 || a === 8388608 || a === 33554432)) {
                    var __ad = globalThis.__adArr;
                    var __dump = [];
                    if (__ad && typeof __ad.length === 'number') {
                        for (var __dj = 0; __dj < __ad.length && __dj < 1400; __dj++) __dump.push(__ad[__dj]);
                    }
                    var __hh = (globalThis.__hashOfArr ? globalThis.__hashOfArr(__ad) : 0);
                    var __sc = [];
                    try {
                        var __dk = (globalThis.__dkByHash || {})[__hh];
                        var __scope = __dk && __dk[2];
                        for (var __sk = 0; __sk < 14; __sk++) {
                            var __sv = __scope ? __scope[__sk] : undefined;
                            var __sd = (globalThis.__vsnap ? globalThis.__vsnap(__sv) : String(__sv));
                            try {
                                if (__sv && typeof __sv === 'object' && __sk >= 2) {
                                    var __parts = [];
                                    try { __parts.push('TAG=' + Object.prototype.toString.call(__sv)); } catch (__pe0) {}
                                    try { __parts.push('CTOR=' + (__sv.constructor && __sv.constructor.name)); } catch (__pe0b) {}
                                    try {
                                        var __ks = Object.keys(__sv);
                                        __parts.push('KEYS=' + __ks.slice(0, 16).join(','));
                                    } catch (__pe0c) {}
                                    ['nodeName', 'tagName', 'id', 'name', 'type', 'value', 'action', 'method', 'length', 'userAgent', 'platform', 'hardwareConcurrency', 'deviceMemory', 'maxTouchPoints', 'webdriver', 'language', 'languages', 'vendor'].forEach(function (__pn) {
                                        try { var __pv = __sv[__pn]; if (__pv !== undefined && (__pv === null || typeof __pv !== 'object')) __parts.push(__pn + '=' + String(__pv).slice(0, 80)); } catch (__pe) { __parts.push(__pn + '=ERR'); }
                                    });
                                    __sd += '{' + __parts.join(',') + '}';
                                }
                            } catch (__se) {}
                            __sc.push(__sk + '=' + __sd);
                        }
                    } catch (e1) { __sc.push('SCOPE-ERR'); }
                    var __rl = [];
                    try {
                        var __log = csvm.memory.reflectLog;
                        __rl.push('RLN=' + (__log ? __log.length : 'NONE') + '@' + Date.now());
                        if (__log && __log.length) {
                            var __kept = [];
                            for (var __ri = __log.length - 1; __ri >= 0 && __kept.length < 25; __ri--) {
                                var __e = __log[__ri];
                                if (!__e) continue;
                                var __ty = String(__e[1]);
                                if (String(__e[2]).charAt(0) === '_') continue;
                                if (__e[2] === 'getElementById' || __e[2] === 'getElementsByTagName') continue;
                                if (__ty === '[object Window]' && __e[2] !== 'document' && __e[2] !== 'navigator' &&
                                    __e[2] !== 'location' && __e[2] !== 'screen' && __e[2] !== 'history') continue;
                                __kept.push(__e[0] + ':' + __ty + '.' + __e[2] + '=' + String(__e[3]).slice(0, 50));
                            }
                            __rl = __kept.reverse();
                        }
                    } catch (e2r) {
                        __rl.push('ERR');
                    }
                    try {
                        var __nr2 = csvm.memory.navReads;
                        if (__nr2 && __nr2.length) __rl.push('NAV=' + __nr2.slice(-40).join(','));
                    } catch (e2n) {}
                    console.log('[BITDUMP] a=' + a + ' b=' + b + ' pc=' + pc +
                        ' READS=' + __rl.join(' || ') +
                        ' h=' + __hh +
                        ' adLen=' + (__ad && __ad.length) +
                        ' st=' + (globalThis.__cs2 || []).map(function (x) { return x.n + '@' + x.pc + '#' + x.h; }).join('<') +
                        ' SCOPE=' + __sc.join('|') +
                        ' AD=' + JSON.stringify(__dump));
                }
            } catch (e0) {}
            var __st = globalThis.__cs2 = globalThis.__cs2 || [];
            var __wantSt = !!(globalThis.__CSVM_CALL_LOG || globalThis.__CSVM_BITDUMP);
            if (__wantSt) __st.push({ n: String(fn && fn.name || '') || String(fn).slice(0, 40), pc: pc, h: (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) });
            try { r = fn(a, b); }
            catch (e) {
                try { if (globalThis.__CSVM_CALL_LOG) console.log('[CALL8-ERR] pc=' + pc + ' f=' + globalThis.__vsnap(fn) + ' err=' + e.message); } catch (e2) {}
                if (__wantSt) __st.pop();
                throw e;
            }
            try {
                if (globalThis.__CSVM_CALL_LOG) {
                    globalThis.__callLogN = (globalThis.__callLogN || 0) + 1;
                    if (globalThis.__callLogN <= 5000) {
                        console.log('[CALL8] pc=' + pc + ' h=' + (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) +
                            ' f=' + globalThis.__vsnap(fn) + ' src=' + String(fn).slice(0, 90) +
                            ' a=' + globalThis.__vsnap(a) + ' b=' + globalThis.__vsnap(b) + ' ret=' + globalThis.__vsnap(r) +
                            ' cs=' + (globalThis.__csStr ? globalThis.__csStr(8) : '') +
                            ' st=' + __st.map(function (x) { return x.n + '@' + x.pc + '#' + x.h; }).join('<'));
                    }
                }
            } catch (e3) {}
            if (__wantSt) __st.pop();
            return r;
        });
        __vmwDef('__fcmm', function (obj, key, a, b, pc) {
            var fn, r;
            try { fn = obj[key]; } catch (e) { }
            var __st = globalThis.__cs2 = globalThis.__cs2 || [];
            var __wantSt = !!(globalThis.__CSVM_CALL_LOG || globalThis.__CSVM_BITDUMP);
            if (__wantSt) __st.push({ n: String(key), pc: pc, h: (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) });
            try { r = fn.call(obj, a, b); }
            catch (e) {
                try { if (globalThis.__CSVM_CALL_LOG) console.log('[CALL9-ERR] pc=' + pc + ' k=' + String(key) + ' err=' + e.message); } catch (e2) {}
                if (__wantSt) __st.pop();
                throw e;
            }
            try {
                if (globalThis.__CSVM_CALL_LOG) {
                    globalThis.__callLogN = (globalThis.__callLogN || 0) + 1;
                    if (globalThis.__callLogN <= 5000) {
                        var extra = '';
                        try {
                            if (key === 'slice' && obj && typeof obj.length === 'number' && (b - a) <= 16) {
                                var seg = [];
                                for (var si = Number(a) | 0; si < (Number(b) | 0); si++) seg.push(obj[si]);
                                extra = ' srclen=' + obj.length + ' seg=[' + seg.join(',') + ']';
                            }
                        } catch (e4) {}
                        console.log('[CALL9] pc=' + pc + ' h=' + (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) +
                            ' k=' + String(key) + ' src=' + String(fn).slice(0, 80) +
                            ' a=' + globalThis.__vsnap(a) + ' b=' + globalThis.__vsnap(b) + ' ret=' + globalThis.__vsnap(r) + extra +
                            ' cs=' + (globalThis.__csStr ? globalThis.__csStr(8) : '') +
                            ' st=' + __st.map(function (x) { return x.n + '@' + x.pc + '#' + x.h; }).join('<'));
                    }
                }
            } catch (e3) {}
            if (__wantSt) __st.pop();
            return r;
        });
        __vmwDef('__vsnapAll', function (v) {
            try {
                if (!v || typeof v !== 'object') return globalThis.__vsnap(v);
                var out = [];
                var n = 0;
                for (var k in v) {
                    if (n++ >= 60) break;
                    var val; try { val = v[k]; } catch (e) { val = 'E'; }
                    var t = typeof val;
                    if (t === 'string') out.push(k + '=' + (val.length > 24 ? val.slice(0, 24) + '~' : val));
                    else if (t === 'number' || t === 'boolean') out.push(k + '=' + val);
                    else if (val === null) out.push(k + '=null');
                    else if (t === 'function') out.push(k + '=fn');
                    else if (t === 'undefined') out.push(k + '=u');
                    else out.push(k + '=o');
                }
                return '{' + out.join(',') + '}';
            } catch (e) { return 'ERR'; }
        });
        __vmwDef('__vsnap', function (v) {
            try {
                if (v === null) return 'null';
                var t = typeof v;
                if (t === 'string') return 's:' + (v.length > 40 ? v.slice(0, 40) + '~' : v);
                if (t === 'number' || t === 'boolean') return String(v);
                if (t === 'undefined') return 'u';
                if (t === 'function') return 'fn:' + (v.name || '');
                if (Array.isArray(v)) return 'arr[' + v.length + ']';
                if (t === 'object') {
                    var ks = [];
                    try { for (var k in v) { ks.push(k); if (ks.length >= 8) break; } } catch (e) {}
                    var parts = [];
                    for (var i = 0; i < ks.length; i++) {
                        var val;
                        try { val = v[ks[i]]; } catch (e) { val = 'ERR'; }
                        var tv = typeof val;
                        if (tv === 'string') parts.push(ks[i] + '=' + (val.length > 30 ? val.slice(0, 30) + '~' : val));
                        else if (tv === 'number' || tv === 'boolean') parts.push(ks[i] + '=' + String(val));
                        else if (val === null) parts.push(ks[i] + '=null');
                        else if (tv === 'object') parts.push(ks[i] + '=[obj]');
                        else parts.push(ks[i] + '=' + tv);
                    }
                    return '{' + parts.join(',') + '}';
                }
                return t;
            } catch (e) { return 'ERR'; }
        });
        __vmwDef('__vsnapDeep', function (v) {
            try {
                if (!Array.isArray(v)) return globalThis.__vsnap(v);
                if (globalThis.__CSVM_DUMP_TABLES && v.length > 40) {
                    var lim = Math.min(v.length, 400);
                    var out2 = [];
                    for (var t = 0; t < lim; t++) {
                        var ev = v[t], tv2 = typeof ev;
                        if (tv2 === 'string') out2.push(t + ':' + (ev.length > 20 ? ev.slice(0, 20) + '~' : ev));
                        else if (tv2 === 'number' || tv2 === 'boolean') out2.push(t + ':' + ev);
                        else out2.push(t + ':' + tv2);
                    }
                    return 'tab[' + v.length + ']{' + out2.join(' ') + '}';
                }
                if (v.length < 0 || v.length > 40) return 'arr[' + v.length + ']';
                if (v.length === 0) return 'arr[0]';
                var parts = [];
                for (var i = 0; i < v.length && i < 24; i++) {
                    var e = v[i];
                    if (e === null) { parts.push('null'); continue; }
                    if (typeof e !== 'object') { parts.push(globalThis.__vsnap(e)); continue; }
                    var ks = [];
                    try { for (var k in e) { ks.push(k); if (ks.length >= 6) break; } } catch (x) {}
                    var kv = [];
                    for (var j = 0; j < ks.length; j++) {
                        var val; try { val = e[ks[j]]; } catch (x2) { val = 'E'; }
                        var tv = typeof val;
                        if (tv === 'string') kv.push(ks[j] + '=' + (val.length > 18 ? val.slice(0, 18) + '~' : val));
                        else if (tv === 'number' || tv === 'boolean') kv.push(ks[j] + '=' + val);
                        else if (val === null) kv.push(ks[j] + '=null');
                        else if (typeof val === 'function') kv.push(ks[j] + '=fn');
                        else kv.push(ks[j] + '=o');
                    }
                    parts.push('{' + kv.join(',') + '}');
                }
                return 'arr[' + v.length + '][' + parts.join(' ') + ']';
            } catch (e) { return 'ERR'; }
        });
        __vmwDef('__snap10', function (arr, L, ls) {
            try {
                if (globalThis.__CSVM_FOCUS_MAP && globalThis.__hashOfArr) {
                    var hh = globalThis.__hashOfArr(arr);
                    if (!globalThis.__CSVM_FOCUS_MAP[hh]) return '';
                }
                var out = [];
                for (var i = 0; i < 10; i++) {
                    var vv = ls > i ? L[ls - 1 - i] : '';
                    out.push(globalThis.__CSVM_SNAPDEEP ? globalThis.__vsnapDeep(vv) : globalThis.__vsnap(vv));
                }
                return ls + ':' + out.join('|');
            } catch (e) { return ''; }
        });
        __vmwDef('__isLongPayload', function (v) {
            try {
                if (!Array.isArray(v) || v.length < 100 || v.length > 400 || v[0] !== 3) return false;
                // 必须包含 "www.fangdi.com.cn" 的字节序列，避免误伤字节码数组
                var url = [119, 119, 119, 46, 102, 97, 110, 103, 100, 105, 46, 99, 111, 109, 46, 99, 110];
                for (var i = 0; i + url.length <= v.length; i++) {
                    var ok = true;
                    for (var j = 0; j < url.length; j++) { if (v[i + j] !== url[j]) { ok = false; break; } }
                    if (ok) return true;
                }
                return false;
            } catch (e) { return false; }
        });
        __vmwDef('__fret', function (v, hV) {
            try {
                // 诊断：在「载荷刚序列化返回」时替换成外部载荷（验证绑定发生在哪一层）
                try {
                    var __pr = globalThis.__CSVM_PAYLOAD_AT_RET;
                    if (__pr && !globalThis.__CSVM_PAYLOAD_AT_RET_DONE && globalThis.__isLongPayload && globalThis.__isLongPayload(v)) {
                        v.length = __pr.length;
                        for (var __ri = 0; __ri < __pr.length; __ri++) v[__ri] = __pr[__ri];
                        globalThis.__CSVM_PAYLOAD_AT_RET_DONE = 1;
                        console.log("[PAYLOAD-AT-RET] replaced, len=" + v.length);
                    }
                } catch (__re) {}
                // 记录「字节码 hash → 指令环数组 id」映射：退出时 __adArrId 就是本函数的数组
                try {
                    var __top2 = globalThis.__csTop ? globalThis.__csTop() : null;
                    if (__top2 && __top2.h && __top2.id) {
                        globalThis.__fidSeq = globalThis.__fidSeq || {};
                        globalThis.__fidSeq[__top2.h] = __top2.id;
                    }
                } catch (e) {}
                var t = typeof v, rec = null;
                if (t === 'string') {
                    if (globalThis.__CSVM_ARGS_ALL) { if (v.length <= 300) rec = { len: v.length, v: v }; }
                    else if (v.length >= 20 && v.length <= 8000) rec = { len: v.length, v: v.slice(0, 1200) };
                } else if (globalThis.__CSVM_ARGS && Array.isArray(v) && v.length >= 20 && v.length <= 500) {
                    var fa = [];
                    for (var qi = 0; qi < Math.min(v.length, 12); qi++) fa.push(typeof v[qi] === 'string' ? v[qi].slice(0, 40) : String(v[qi]));
                    rec = { arr: v.length, first: fa, onlyArr: true };
                } else if (globalThis.__CSVM_ARGS_ALL && Array.isArray(v) && v.length < 20) {
                    var fa2 = [];
                    for (var qi2 = 0; qi2 < v.length; qi2++) fa2.push(typeof v[qi2] === 'string' ? v[qi2].slice(0, 40) : String(v[qi2]));
                    rec = { arr: v.length, first: fa2, onlyArr: true, small: true };
                } else if (globalThis.__CSVM_ARGS_ALL && (t === 'number' || t === 'boolean')) {
                    rec = { v: t + ':' + String(v) };
                } else if (globalThis.__CSVM_ARGS_ALL && v === null) {
                    rec = { v: 'null' };
                }
                if (!rec) return;
                // 长返回值（加密输出）：dump 这次调用的入参（可能是明文）
                if (t === 'string' && v.length >= 200) {
                    try {
                        rec.call = [];
                        var args = hV && hV[0];
                        if (args) for (var ai = 0; ai < args.length && ai < 6; ai++) {
                            var a = args[ai], at = typeof a, d;
                            if (at === 'string') d = { t: 's', len: a.length, v: a.slice(0, 400) };
                            else if (at === 'number' || at === 'boolean') d = { t: at, v: String(a) };
                            else if (a === null) d = { t: 'null' };
                            else if (at === 'object') {
                                d = { t: 'obj', tag: String(Object.prototype.toString.call(a)), len: a.length };
                                try {
                                    var pv = [];
                                    for (var pi = 0; pi < Math.min(a.length || 0, globalThis.__CSVM_CALL_FULL ? 260 : 8); pi++) {
                                        var e = a[pi];
                                        pv.push(typeof e === 'string' ? e.slice(0, 60) : (typeof e === 'object' ? '[o]' : String(e)));
                                    }
                                    d.first = pv;
                                } catch (e2) {}
                            } else d = { t: at };
                            rec.call.push(d);
                        }
                    } catch (e3) {}
                }
                if (t === 'string' && v.length >= 200) {
                    try { rec.ring = globalThis.__adRingTail ? globalThis.__adRingTail(globalThis.__CSVM_RING_N || 120) : null; } catch (e) {}
                    try { rec.fidSeq = globalThis.__fidSeq || null; } catch (e) {}
                }
                globalThis.__retN = (globalThis.__retN || 0) + 1;
                if (globalThis.__retN > 40000) return;
                rec.n = globalThis.__retN;
                rec.pc = (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1);
                rec.callee = (globalThis.__csTop && globalThis.__csTop()) ? globalThis.__csTop().h : 0;
                rec.cs = globalThis.__csStr ? globalThis.__csStr(5) : '';
                globalThis.__vmw('ret', rec);
            } catch (e) {}
        });
        __vmwDef('__fcat', function (a, b) {
            var r;
            try { r = a + b; } catch (e) { return a + b; }
            try {
                if (typeof r === 'string' && r.length >= 20 && r.length <= 6000) {
                    globalThis.__catN = (globalThis.__catN || 0) + 1;
                    if (globalThis.__catN <= 20000) {
                        globalThis.__vmw('cat', {
                            n: globalThis.__catN, len: r.length, v: r.slice(0, 800),
                            pc: (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1)
                        });
                    }
                }
            } catch (e) {}
            return r;
        });
        __vmwDef('__adDk', function (dK, ik) {
            try {
                // 记录「函数 hash → 本次调用的 _$dK」（用于反查作用域 _$g9，仅诊断开关下）
                try {
                    if (globalThis.__CSVM_BITDUMP && ik && typeof ik.length === 'number') {
                        var __ikh = globalThis.__hashOfArr ? globalThis.__hashOfArr(ik) : 0;
                        globalThis.__dkByHash = globalThis.__dkByHash || {};
                        globalThis.__dkByHash[__ikh] = dK;
                    }
                } catch (e00) {}
            } catch (e) {}
            try {
                // 登记作用域对象（_$dK[2] = _$g9）和局部作用域链（_$dK[1]），
                // 用于观察挑战往作用域里写入的数组（如载荷片段 [8,0]）
                try {
                    if (__scopeSet && dK) {
                        if (dK[2] && typeof dK[2] === 'object') __scopeSet.add(dK[2]);
                        if (dK[1] && typeof dK[1] === 'object' && typeof dK[1].length === 'number') {
                            for (var __si = 0; __si < dK[1].length; __si++) {
                                if (dK[1][__si] && typeof dK[1][__si] === 'object') __scopeSet.add(dK[1][__si]);
                            }
                        }
                    }
                } catch (e) {}
                var reg = dK && dK[0];
                if (!reg || typeof reg !== 'object') return;
                if (!globalThis.__CSVM_IJ_PROXY) return;
                if (__ijProxied.has(reg)) return;
                __ijProxied.add(reg);
                var px = new Proxy(reg, {
                    set: function (t, k, v) {
                        try {
                            globalThis.__ijwN = (globalThis.__ijwN || 0) + 1;
                            if (globalThis.__ijwN <= 8000) {
                                var rec = {
                                    k: String(k), n: globalThis.__ijwN,
                                    v: globalThis.__ijDesc ? globalThis.__ijDesc(v) : String(v),
                                    pc: (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1),
                                    op: (typeof globalThis.__adOp === 'number' ? globalThis.__adOp : -1)
                                };
                                if (typeof v === 'string' && v.length > 150) rec.snap = globalThis.__varr(t, 160);
                                globalThis.__vmw('ijw', rec);
                            }
                        } catch (e) {}
                        t[k] = v;
                        return true;
                    }
                });
                dK[0] = px;
            } catch (e) {}
        });
        __vmwDef('__fstore', function (obj, k, v) {
            try {
                // 观察作用域写入：整体赋值 + 元素写入
                try {
                    if (globalThis.__CSVM_SCOPELOG && __scopeSet && obj && typeof obj === 'object' && __scopeSet.has(obj)) {
                        if (Array.isArray(v) && v.length <= 40) {
                            var __sc = [];
                            for (var __scI = 0; __scI < v.length && __scI < 40; __scI++) __sc.push(v[__scI]);
                            if (__scopeArrSet) __scopeArrSet.add(v);
                            console.log('[SCOPEW] k=' + String(k) + ' len=' + v.length + ' [' + __sc.join(',') + ']');
                        }
                    }
                    if (globalThis.__CSVM_SCOPELOG && __scopeArrSet && obj && typeof obj === 'object' && __scopeArrSet.has(obj)) {
                        globalThis.__arrwN = (globalThis.__arrwN || 0) + 1;
                        if (globalThis.__arrwN <= 8000) {
                            var __av = (v === null) ? 'null' : (typeof v === 'string' ? 's:' + v.slice(0, 30) : String(v));
                            console.log('[ARRW] k=' + String(k) + ' v=' + __av +
                                ' h=' + (globalThis.__hashOfArr ? globalThis.__hashOfArr(globalThis.__adArr) : 0) +
                                ' pc=' + (typeof globalThis.__adPc === 'number' ? globalThis.__adPc : -1));
                        }
                    }
                } catch (__se) {}
                if (globalThis.__CSVM_STORE_ALL) {
                    var __logAll = false, __tv = typeof v;
                    if (__tv === 'string') __logAll = (v.length > 0 && v.length <= 400);
                    else if (__tv === 'number' || __tv === 'boolean') __logAll = true;
                    else if (v === null) __logAll = true;
                    if (__logAll) {
                        globalThis.__stAllN = (globalThis.__stAllN || 0) + 1;
                        if (globalThis.__stAllN <= 40000) {
                            globalThis.__vmw('st', {
                                k: String(k), n: globalThis.__stAllN, t: __tv,
                                v: (__tv === 'string' ? v : (v === null ? 'null' : __tv + ':' + String(v)))
                            });
                        }
                    }
                }
                if (__adDkSet && obj && __adDkSet.has(obj)) {
                    globalThis.__ijwN = (globalThis.__ijwN || 0) + 1;
                    if (globalThis.__ijwN <= 6000) {
                        var d;
                        if (typeof v === 'string') d = 's(' + v.length + '):' + (v.length > 200 ? v.slice(0, 200) + '~' : v);
                        else if (v === null) d = 'null';
                        else if (typeof v === 'object') d = 'obj';
                        else d = typeof v + ':' + String(v);
                        var rec = { k: String(k), n: globalThis.__ijwN, v: d };
                        // 长字符串写入寄存器（P 密文/明文候选）：附带整张寄存器表快照
                        if (typeof v === 'string' && v.length > 150) {
                            rec.snap = globalThis.__varr(obj, 140);
                        }
                        globalThis.__vmw('ijw', rec);
                    }
                } else if (typeof v === "string" && v.length > 150) {
                    globalThis.__vmw('store', { k: String(k), len: v.length, head: v.slice(0, 500) });
                }
            } catch (e) {}
            obj[k] = v;
            return v;
        });
        __vmwDef('__fim', function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            try { globalThis.__fimN = (globalThis.__fimN || 0) + 1; if (globalThis.__fimN <= 8) globalThis.__vmw('im-call', { n: globalThis.__fimN, a1: String(args[1]), a2: String(args[2]), a3: String(args[3]) }); } catch (e) {}
            return fn.apply(undefined, args);
        });
        __vmwDef('__fimLog', function (ls, L) {
            try {
                if (!L) return;
                for (var i = Math.max(0, ls - 2); i < ls; i++) {
                    var v = L[i];
                    if (typeof v === "string" && v.length > 80) {
                        globalThis.__vmw('im', { i: i, ls: ls, len: v.length, head: v.slice(0, 60) });
                    }
                }
            } catch (e) {}
        });
        __vmwDef('__fc1', function (fn, a) {
            var r;
            try { r = fn(a); }
            catch (e) { try { globalThis.__vmw('call1-err', { f: (fn && fn.name) || '?' }); } catch (e2) {} throw e; }
            try {
                var la = typeof a === "string" ? a.length : 0;
                var ro = typeof r === "string" ? r.length : -1;
                if (la > 80 || ro > 80) globalThis.__vmw('call1', { f: (fn && fn.name) || '?', al: la, ah: typeof a === "string" ? a.slice(0, 40) : typeof a, ro: ro, rh: typeof r === "string" ? r.slice(0, 40) : typeof r });
            } catch (e) {}
            return r;
        });
        __vmwDef('__fcN', function (fn, list) {
            var r;
            try { r = fn.apply(undefined, list); }
            catch (e) { try { globalThis.__vmw('callN-err', { f: (fn && fn.name) || '?' }); } catch (e2) {} throw e; }
            try {
                var la = 0, ah = "";
                for (var i = 0; i < list.length; i++) { var a = list[i]; if (typeof a === "string" && a.length > la) { la = a.length; ah = a.slice(0, 40); } }
                var ro = typeof r === "string" ? r.length : -1;
                if (la > 80 || ro > 80) globalThis.__vmw('callN', { f: (fn && fn.name) || '?', argc: list.length, al: la, ah: ah, ro: ro, rh: typeof r === "string" ? r.slice(0, 40) : typeof r });
            } catch (e) {}
            return r;
        });
        __vmwDef('__fc', function (fn, a, b) {
            var r;
            try { r = fn(a, b); }
            catch (e) { try { globalThis.__vmw('call-err', { f: (fn && fn.name) || '?', ea: String(a).slice(0, 30), eb: String(b).slice(0, 30) }); } catch (e2) {} throw e; }
            try {
                var la = Math.max(typeof a === "string" ? a.length : 0, typeof b === "string" ? b.length : 0);
                var ro = typeof r === "string" ? r.length : -1;
                if (la > 80 || ro > 80) {
                    globalThis.__vmw('call', { f: (fn && fn.name) || '?',
                        a0: typeof a === "string" ? a.slice(0, 50) : typeof a,
                        a1: typeof b === "string" ? b.slice(0, 50) : typeof b,
                        al: la, ro: ro,
                        rh: typeof r === "string" ? r.slice(0, 40) : typeof r });
                }
            } catch (e) {}
            return r;
        });
        var __hwCache = new WeakMap();
        __vmwDef('__wrapH', function (fn, k) {
            try {
                var w = __hwCache.get(fn);
                if (w) return w;
                w = new Proxy(fn, { apply: function (t, th, args) {
                    var r = Reflect.apply(t, th, args);
                    try { globalThis.__wrapN = (globalThis.__wrapN || 0) + 1; if (globalThis.__wrapN < 60) globalThis.__vmw('helper-call', { k: k, n: globalThis.__wrapN, alen: args.length, a0: String(args[0]).slice(0, 30) }); } catch (e) {}
                    try {
                        var la = 0, ha = "";
                        for (var i = 0; i < args.length; i++) {
                            var a = args[i];
                            if (typeof a === "string" && a.length > la) { la = a.length; ha = a.slice(0, 60); }
                        }
                        if (la > 80 || (typeof r === "string" && r.length > 80)) {
                            globalThis.__vmw('helper', { k: k, inLen: la, inHead: ha,
                                outLen: (typeof r === "string" ? r.length : -1),
                                outHead: (typeof r === "string" ? r.slice(0, 40) : typeof r) });
                        }
                    } catch (e) {}
                    return r;
                } });
                __hwCache.set(fn, w);
                return w;
            } catch (e) { return fn; }
        });
        if (globalThis.__CSVM_JOIN) {
            try {
                var __origJoin = Array.prototype.join;
                Array.prototype.join = function (sep) {
                    var r = __origJoin.call(this, sep);
                    try {
                        if (typeof r === 'string' && r.length >= 20 && r.length <= 8000) {
                            globalThis.__joinN = (globalThis.__joinN || 0) + 1;
                            if (globalThis.__joinN <= 4000) {
                                globalThis.__vmw('join', { n: globalThis.__joinN, len: r.length, arr: this.length, v: r.slice(0, 1500) });
                            }
                        }
                    } catch (e) {}
                    return r;
                };
            } catch (e) {}
        }
        // 明文载荷抓取：不依赖 VM 内部命名，直接观察「全数字、长度 80-400、含 URL」的数组
        if (globalThis.__CSVM_ARRHOOK) {
            try {
                var __origPush = Array.prototype.push;
                Array.prototype.push = function () {
                    var __r = __origPush.apply(this, arguments);
                    try {
                        var __L = this.length;
                        if (__L >= 80 && __L <= 400 && this[0] === 3) {
                            var __allNum = true;
                            for (var __i = 0; __i < __L; __i++) { if (typeof this[__i] !== 'number') { __allNum = false; break; } }
                            if (__allNum) {
                                var __s = '';
                                for (var __j = 0; __j < __L; __j++) __s += String.fromCharCode(this[__j] & 0xff);
                                if (__s.indexOf('www.fangdi.com.cn') !== -1) {
                                    globalThis.__arrHits = (globalThis.__arrHits || 0) + 1;
                                    if (globalThis.__arrHits <= 80) {
                                        var __arr = new Array(__L);
                                        for (var __k = 0; __k < __L; __k++) __arr[__k] = this[__k];
                                        globalThis.__vmw('arrhit', { n: globalThis.__arrHits, len: __L, v: __arr });
                                        globalThis.__lastPayload = __arr;
                                    }
                                }
                            }
                        }
                    } catch (__e) {}
                    return __r;
                };
            } catch (e) {}
        }
        globalThis.__vmw('mark', { note: 'vmwatch installed' });
        try { if (globalThis.__CSVM_RING) globalThis.__adRecOn(Math.max(globalThis.__CSVM_RING_CAP || 30000, globalThis.__CSVM_RING_N || 0)); } catch (e) {}
    }

    // 标识符每代 eval 都会重新随机（_$cr/_$gU/_$gr 只在同一份 eval 内一致），
    // 不能写死字符串；按 opcode 结构在运行时代码里现场发现名字。
    function __vmwNames(code) {
        var m = /if\(([A-Za-z_$][\w$]*)===660\)\{([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\[([A-Za-z_$][\w$]*)\];\}/.exec(code);
        if (!m) return null;
        var N = { op: m[1], az: m[2], gr: m[3], idx: m[4] };

        // 注意：installVmTrace 会先把 while(1){op=arr[pc++]; 改写成
        // while(1){op=arr[pc];...pc++;，所以这里的 ++ 必须可选
        var lre = /while\(1\)\{([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\[([A-Za-z_$][\w$]*)(?:\+\+)?\];/g;
        var lm, loops = [];
        while ((lm = lre.exec(code))) loops.push({ i: lm.index, op: lm[1], arr: lm[2], pc: lm[3] });
        for (var i = 0; i < loops.length; i++) if (loops[i].op === N.op) {
            N.pc = loops[i].pc; N.op = loops[i].op; N.arr = loops[i].arr;
            break;
        }
        if (!N.pc) return null;

        var jre = /else if\(([A-Za-z_$][\w$]*)===302\)\{\s*!\s*([A-Za-z_$][\w$]*)\s*\?\s*([A-Za-z_$][\w$]*)\+=1:0;\}/g;
        var jm;
        while ((jm = jre.exec(code))) {
            if (jm[1] === N.op && jm[3] === N.pc) { N.jj = jm[2]; N.j302 = jm.index; N.j302text = jm[0]; break; }
        }
        if (!N.jj) return null;

        var fre = /for\(([A-Za-z_$][\w$]*)=0;\1<([A-Za-z_$][\w$]*);\1\+\+ ?\)\{([A-Za-z_$][\w$]*)\[\1\]=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\);\}/;
        var fm = fre.exec(code);
        if (!fm) return null;
        N.fi = fm[1]; N.ap = fm[2]; N.gr2 = fm[3]; N.km = fm[4]; N.kj = fm[5];
        N.fillText = fm[0]; N.fillAt = fm.index;

        var are = /([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\[(\d+)\]\);/g;
        var am;
        while ((am = are.exec(code))) {
            if (am[1] === N.ap) { N.gg = am[2]; N.e6 = am[3]; N.e6i = am[4]; N.apText = am[0]; break; }
        }

        // opcode 180：_$ap = _$fa(_$kJ)  （_$fa 从字节码游标读变长整数）
        var fre2 = /([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\);/g;
        var fm2;
        while ((fm2 = fre2.exec(code))) {
            if (fm2[1] === N.ap && fm2[3] === N.kj) { N.fa = fm2[2]; N.ap180text = fm2[0]; break; }
        }

        // opcode 27：_$kJ = _$j0(_$hS, _$an)  （解密当前函数的字节码）
        var fre3 = /([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*)\);/g;
        var fm3;
        while ((fm3 = fre3.exec(code))) {
            if (fm3[1] === N.kj) { N.j0 = fm3[2]; N.hS = fm3[3]; N.an = fm3[4]; N.op27text = fm3[0]; break; }
        }
        // 从 _$j0 函数体里找出 _$f0（typed array 构造器）和 _$dG（4 字节打包）
        if (N.j0) {
            var ji = code.indexOf('function ' + N.j0 + '(');
            if (ji !== -1) {
                var seg = code.slice(ji, ji + 320);
                var nm0 = /new ([A-Za-z_$][\w$]*)\(/.exec(seg);
                if (nm0) N.f0 = nm0[1];
                var nm1 = /([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\)[,;]/.exec(seg);
                if (nm1) N.dG = nm1[2];
            }
        }

        var best = null;
        for (var k = 0; k < loops.length; k++) if (loops[k].i < N.fillAt) best = loops[k];
        N.pc2 = best ? best.pc : N.pc;
        N.op2 = best ? best.op : N.op;
        N.arr2 = best ? best.arr : N.arr;
        N.loops = loops;
        // 解释器入口函数：参数表里含 _$hS 的那个（_$fH(_$en,_$hS,_$bn,_$hj)）
        var loopPos = code.indexOf('while(1){' + N.op2 + '=' + N.arr2 + '[' + N.pc2 + '];');
        var fre4 = /function ([A-Za-z_$][\w$]*)\(([^)]*)\)\{/g, m4, cand = null;
        while ((m4 = fre4.exec(code))) {
            if (m4.index > loopPos) break;
            var ps = m4[2].split(',');
            if (ps.indexOf(N.hS) !== -1) cand = { name: m4[1], params: m4[2], text: m4[0] };
        }
        if (cand) { N.fH = cand.name; N.fHtext = cand.text; }

        // opcode 213 = return; 找到它属于哪个解释器（分叉点）
        for (var lj = 0; lj < loops.length; lj++) {
            var L213 = loops[lj];
            var t213 = 'else if(' + L213.op + '===213){return;}';
            if (code.indexOf(t213) !== -1) {
                N.op213text = t213; N.op213op = L213.op; N.pc213 = L213.pc;
                // 212 分支：CTX.PROP = EU，父解释器可能据此选下一跳
                var m212 = /===212\)\{([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*);\}/.exec(code);
                if (m212) { N.ctx = m212[1]; N.ctxProp = m212[2]; N.eu = m212[3]; }
                break;
            }
        }

        // opcode 417 的返回值决定 _$hS（43 字符串）；opcode 360 是它的来源 API 调用
        var m417 = /===417\)\{return ([A-Za-z_$][\w$]*)\[([A-Za-z_$][\w$]*)\[(\d+)\]\];\}/.exec(code);
        if (m417) N.an = m417[1];
        var m360 = /===360\)\{([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\[([A-Za-z_$][\w$]*)\[(\d+)\]\]\(([A-Za-z_$][\w$]*)\[(\d+)\]\);\}/.exec(code);
        if (m360 && m360[1] === N.an) {
            N.op360text = m360[0]; N.kr = m360[2]; N.b3 = m360[3]; N.b3i = m360[4];
            N.d7 = m360[5]; N.d7i = m360[6];
            N.op360assign = m360[0].slice('===360){'.length, -1);
        }
        return N;
    }

    // 通用「被解释函数包装器」定位：不依赖 _$aD/_$aT 等随机命名。
    //   结构：(H)[0]=arguments, ... F(CODE,0,CODE.FIELD.length,H) ... H[4] H[5]
    function __vmwPatchWrapperGeneric(code) {
        var m0 = /([A-Za-z_$][\w$]*)\[0\]=arguments,/.exec(code);
        if (!m0) { try { globalThis.__vmw('wrapper-miss', { why: 'no [0]=arguments' }); } catch (e) {} return code; }
        var H = m0[1];
        var __hook = '(globalThis.__CSVM_OBJDUMP&&this&&this.length>=8&&this.length<=40&&this[0]&&globalThis.__fthis)?globalThis.__fthis(this):0,';
        var __insAt = m0.index + m0[0].length;
        code = code.slice(0, __insAt) + __hook + code.slice(__insAt);
        var Hesc = H.replace(/\$/g, "\\$");
        var reCall = new RegExp("([A-Za-z_$][\\w$]*)\\(([A-Za-z_$][\\w$]*),0,\\2\\.([A-Za-z_$][\\w$]*)\\.length," + Hesc + "\\)", "g");
        var calls = [];
        var cm;
        while ((cm = reCall.exec(code))) calls.push({ idx: cm.index, text: cm[0], F: cm[1], CODE: cm[2], FIELD: cm[3] });
        if (!calls.length) { try { globalThis.__vmw('wrapper-miss', { why: 'no interpreter call', h: H }); } catch (e) {} return code; }
        try { globalThis.__vmw('wrapper-generic', { h: H, calls: calls.length, F: calls[0].F, code: calls[0].CODE, field: calls[0].FIELD }); } catch (e) {}
        // 从后往前替换，避免偏移
        for (var i = calls.length - 1; i >= 0; i--) {
            var c = calls[i];
            var rep;
            if (globalThis.__CSVM_RING || globalThis.__CSVM_ARG_ALL) {
                // 完整模式：需要调用栈 + 指令环
                rep = "globalThis.__fpush&&globalThis.__fpush(globalThis.__fidOf(" + c.CODE + "." + c.FIELD + "),this)," +
                    "globalThis.__fargs&&globalThis.__fargs(arguments," + c.CODE + ")," +
                    c.text + "," +
                    "globalThis.__fret&&globalThis.__fret(" + H + "[5]," + H + ")," +
                    "globalThis.__fpop&&globalThis.__fpop()";
            } else {
                // 轻量模式：内联廉价形状判断，只对「疑似加密调用」进钩子
                var guard = "(globalThis.__CSVM_ARG_ALL||(arguments.length>=3&&arguments[0]&&typeof arguments[0].length==='number'&&arguments[0].length===8&&arguments[2]&&typeof arguments[2].length==='number'&&arguments[2].length===21&&globalThis.__fargs))";
                rep = guard + "?globalThis.__fargs(arguments," + c.CODE + "):0," + c.text;
            }
            code = code.slice(0, c.idx) + rep + code.slice(c.idx + c.text.length);
        }
        return code;
    }

    function __vmwPatchReceiver(code) {
        if (code.indexOf('__fthis(this)') !== -1) return code;
        var m = /([A-Za-z_$][\w$]*)\[0\]=arguments,/.exec(code);
        if (!m) return code;
        var at = m.index + m[0].length;
        var hook = '(globalThis.__CSVM_OBJDUMP&&this&&this.length>=8&&this.length<=40&&this[0]&&globalThis.__fthis)?globalThis.__fthis(this):0,';
        return code.slice(0, at) + hook + code.slice(at);
    }

    function __vmwApply(code) {
        var N = __vmwNames(code);
        try { if (globalThis.__CSVM_OBJDUMP) code = __vmwPatchReceiver(code); } catch (e) {}
        if (!N) {
            try { globalThis.__vmw('names-null', { len: code.length, has660: code.indexOf('===660') }); } catch (e) {}
            // 通用兜底：不依赖随机命名，按结构定位「被解释函数包装器」并插入调用钩子
            try { if (globalThis.__CSVM_ARGS) code = __vmwPatchWrapperGeneric(code); } catch (e) { try { globalThis.__vmw('generic-err', { e: String(e && e.message || e) }); } catch (e2) {} }
            return code;
        }

        try {
            var nm = JSON.stringify({ op: N.op, az: N.az, gr: N.gr, idx: N.idx, pc: N.pc, jj: N.jj, ap: N.ap, gr2: N.gr2, pc2: N.pc2, gg: N.gg, e6: N.e6, e6i: N.e6i, an: N.an, op360: !!N.op360text, kr: N.kr, fH: N.fH });
            if (globalThis.__vmwNames !== nm) { globalThis.__vmwNames = nm; globalThis.__vmw('names', { names: nm }); }
        } catch (e) {}

        // _$ap 变化追踪：在 _$cR 解释器取指处插桩，只在 pc<=560 记录变化
        if (N.op2 && N.arr2 && N.pc2) {
            var loopPrefix = 'while(1){' + N.op2 + '=' + N.arr2 + '[' + N.pc2 + '];';
            var apProbe = loopPrefix + 'try{if(' + N.pc2 + '<=560){var __va=' + N.ap +
                ';if(__va!==globalThis.__apLast){globalThis.__apLast=__va;globalThis.__vmw(\'ap-set\',{pc:' + N.pc2 +
                ',ap:globalThis.__vdesc(__va)});}var __vk=' + N.kj +
                ';if(__vk!==globalThis.__kjLast){globalThis.__kjLast=__vk;globalThis.__vmw(\'kj-set\',{pc:' + N.pc2 +
                ',kj:globalThis.__vdesc(__vk),len:(__vk&&typeof __vk.length===\'number\')?__vk.length:\'-\'});}var __vh=' + N.hS +
                ';if(__vh!==globalThis.__hSLast){globalThis.__hSLast=__vh;globalThis.__vmw(\'hS-set\',{pc:' + N.pc2 +
                ',hS:globalThis.__vdesc(__vh),len:(__vh&&typeof __vh.length===\'number\')?__vh.length:\'-\',head:(Array.isArray(__vh)?globalThis.__varr(__vh,10):\'\')});}}}catch(e){}';
            if (code.indexOf(loopPrefix) !== -1) code = code.split(loopPrefix).join(apProbe);
        }

        // opcode 19：属性写入 —— 记录写入的长字符串（定位密文/明文存入哪张表）
        try {
            var stOld = '_$ae[_$_f]=_$dh';
            var cnt = code.split(stOld).length - 1;
            if (cnt) { code = code.split(stOld).join("globalThis.__fstore(_$ae,_$_f,_$dh)"); }
            globalThis.__vmw('store-patched', { cnt: cnt });
        } catch (e) {}

        // _$im：opcode >30 的通用调用分支
        try {
            var imOld = '_$im(_$ao,';
            if (code.indexOf(imOld) !== -1) {
                /* im patch disabled */
                var tail = ',_$dK[4]?_$aT=_$ct:_$aT+=_$hg)';
                var tailNew = ',globalThis.__fimLog&&globalThis.__fimLog(_$ls,_$_L),_$dK[4]?_$aT=_$ct:_$aT+=_$hg)';
                // 需要逗号分隔：把 tail 替换为 ",__fimLog(...),_$dK[4]?..."
                /* im tail disabled */
            }
        } catch (e) {}

        // opcode 12/14/27：1 参 / N 参调用
        try {
            var c12 = '_$dh=_$ae(_$_L[_$dh])';
            /* c12 disabled */
            var c27 = '_$dh=_$ae[_$_f](_$_L[_$dh])';
            /* c27 disabled */
            var c14 = '_$_L[_$ls++ ]=_$$L(_$ae[_$_f],_$_o)';
            /* c14 disabled */
        } catch (e) {}

        // opcode 8/25：二参函数调用 —— 记录目标/参数/返回（长字符串才记）
        try {
            var c8 = '_$dh=_$ae(_$_L[_$dh],_$_L[_$dh+1])';
            if (globalThis.__CSVM_CALL_LOG && code.indexOf(c8) !== -1) {
                code = code.split(c8).join('_$dh=globalThis.__fccall(_$ae,_$_L[_$dh],_$_L[_$dh+1],globalThis.__adPc)');
            }
            var c25 = '_$_L[_$ls++ ]=_$ae[_$_f](_$_L[_$dh],_$_L[_$dh+1])';
            if (globalThis.__CSVM_CALL_LOG && code.indexOf(c25) !== -1) {
                code = code.split(c25).join('_$_L[_$ls++ ]=globalThis.__fcmm(_$ae,_$_f,_$_L[_$dh],_$_L[_$dh+1],globalThis.__adPc)');
            }
            var c9 = '_$dh=_$ae[_$_f](_$_L[_$dh],_$_L[_$dh+1])';
            if (globalThis.__CSVM_CALL_LOG && code.indexOf(c9) !== -1) {
                code = code.split(c9).join('_$dh=globalThis.__fcmm(_$ae,_$_f,_$_L[_$dh],_$_L[_$dh+1],globalThis.__adPc)');
            }
            // opcode 55：push 作用域值 _$g9[key]（观察小数组来源）
            var c55 = '_$_L[_$ls++ ]=_$g9[_$ar[ ++_$aT]]';
            if (globalThis.__CSVM_SCOPELOG && code.indexOf(c55) !== -1) {
                code = code.split(c55).join('_$_L[_$ls++ ]=globalThis.__gpush(_$g9,_$ar[ ++_$aT])');
            }
            // opcode 27/51：1 参方法调用（push 走这里）
            var c27 = '_$dh=_$ae[_$_f](_$_L[_$dh])';
            if (globalThis.__CSVM_SCOPELOG && code.indexOf(c27) !== -1) {
                code = code.split(c27).join('_$dh=globalThis.__fc1m(_$ae,_$_f,_$_L[_$dh],globalThis.__adPc)');
            }
            var c51 = '_$_L[_$ls++ ]=_$ae[_$_f](_$_L[_$dh])';
            if (globalThis.__CSVM_SCOPELOG && code.indexOf(c51) !== -1) {
                code = code.split(c51).join('_$_L[_$ls++ ]=globalThis.__fc1m(_$ae,_$_f,_$_L[_$dh],globalThis.__adPc)');
            }
            // opcode 20：原生数组 push
            var c20 = '_$ae.push(_$dh)';
            if (globalThis.__CSVM_SCOPELOG && code.indexOf(c20) !== -1) {
                code = code.split(c20).join('globalThis.__fpushv(_$ae,_$dh)');
            }
            globalThis.__vmw('calls-patched', { c8: code.indexOf('globalThis.__fc(_$ae,') !== -1, c25: code.indexOf('__fc(_$ae[_$_f],') !== -1 });
        } catch (e) {}

        // 属性读取：对 navigator/window/document 的 get 记录 pc + 键 + 值
        try {
            if (globalThis.__CSVM_GETLOG) {
                var g39 = '_$dh=_$_L[ --_$ls],_$ae=_$_L[ --_$ls],_$_L[_$ls++ ]=_$ae[_$dh]';
                if (code.indexOf(g39) !== -1) code = code.split(g39).join('_$_L[_$ls++ ]=globalThis.__fget2(_$ae,_$dh,globalThis.__adPc)');
                var g37 = '_$dh=_$_L[ --_$ls],_$ae=_$_L[_$ls-1],_$ae[_$gb[_$ar[ ++_$aT]]]=_$dh';
                try { globalThis.__vmw('getlog-patched', { a: code.indexOf('__fget2') !== -1, b: code.indexOf(g37) !== -1 }); } catch (e0) {}
            }
        } catch (e) {}

        // 0 参调用：记录目标/返回（定位挑战用哪个「解码出的属性名」去读 navigator）
        try {
            if (globalThis.__CSVM_CALL0) {
                var c0a = '_$cp(),_$ae=_$ae[_$_f],_$_L[_$ls++ ]=_$ae()';
                if (code.indexOf(c0a) !== -1) code = code.split(c0a).join('_$_L[_$ls++ ]=globalThis.__fc0(_$ae,_$_f,globalThis.__adPc)');
                var c0b = '_$cp(),_$ae=_$ae[_$_f],_$dh=_$ae()';
                if (code.indexOf(c0b) !== -1) code = code.split(c0b).join('_$dh=globalThis.__fc0(_$ae,_$_f,globalThis.__adPc)');
                try { globalThis.__vmw('call0-patched', { a: code.indexOf('__fc0') !== -1 }); } catch (e0) {}
            }
        } catch (e) {}

        // 被解释函数入口/返回：记录长字符串入参与返回值（定位加密例程的明文输入）
        try {
            if (globalThis.__CSVM_ARGS) {
                var fargsOld = '_$hV[0]=arguments,_$hV[2]=_$ao,_$ao[0]=this,_$ao[1]=arguments,';
                if (code.indexOf(fargsOld) !== -1) {
                    code = code.split(fargsOld).join(fargsOld + '(globalThis.__CSVM_OBJDUMP&&this&&this.length>=8&&this.length<=40&&this[0]&&globalThis.__fthis)?globalThis.__fthis(this):0,');
                }
                var fretOld = '_$aD(_$aT,0,_$aT._$iK.length,_$hV),_$ib=_$hV[4],_$dh=_$hV[5],';
                if (code.indexOf(fretOld) !== -1) {
                    var __guard = "(globalThis.__CSVM_ARG_ALL||(arguments.length>=3&&arguments[0]&&typeof arguments[0].length==='number'&&arguments[0].length===8&&arguments[2]&&typeof arguments[2].length==='number'&&arguments[2].length===21&&globalThis.__fargs))";
                    var __rep = (globalThis.__CSVM_RING || globalThis.__CSVM_ARG_ALL)
                        ? 'globalThis.__fpush&&globalThis.__fpush(globalThis.__fidOf(_$aT._$iK),this),globalThis.__fargs&&globalThis.__fargs(arguments,_$aT),_$aD(_$aT,0,_$aT._$iK.length,_$hV),globalThis.__fret&&globalThis.__fret(_$hV[5],_$hV),globalThis.__fpop&&globalThis.__fpop(),_$ib=_$hV[4],_$dh=_$hV[5],'
                        : __guard + '?globalThis.__fargs(arguments,_$aT):0,_$aD(_$aT,0,_$aT._$iK.length,_$hV),_$ib=_$hV[4],_$dh=_$hV[5],';
                    code = code.split(fretOld).join(__rep);
                }
                globalThis.__vmw('args-patched', { a: code.indexOf('__fargs(arguments') !== -1, r: code.indexOf('__fret(') !== -1 });
                // 精确文本没命中时，用结构化的通用补丁兜底（跨实例）
                if (code.indexOf('__fargs(arguments') === -1) {
                    var __gb = __vmwPatchWrapperGeneric(code);
                    if (__gb !== code) code = __gb;
                }
            }
        } catch (e) {}

        // opcode 35/82：字符串拼接 —— 记录结果（定位 P 明文）
        try {
            if (globalThis.__CSVM_CONCAT) {
                var cc1 = '_$dh=_$_L[ --_$ls]+_$dh,_$_L[_$ls++ ]=_$dh';
                if (code.indexOf(cc1) !== -1) code = code.split(cc1).join('_$dh=globalThis.__fcat(_$_L[ --_$ls],_$dh),_$_L[_$ls++ ]=_$dh');
                var cc2 = '(_$dh=_$_L[ --_$ls],_$dh=_$_L[ --_$ls]+_$dh)';
                if (code.indexOf(cc2) !== -1) code = code.split(cc2).join('(_$dh=_$_L[ --_$ls],_$dh=globalThis.__fcat(_$_L[ --_$ls],_$dh))');
                globalThis.__vmw('concat-patched', { c1: code.indexOf('globalThis.__fcat') !== -1 });
            }
        } catch (e) {}

        // opcode 30：_$_L[_$ls++] = _$ij[operand] —— 取内置 helper；包一层记录入参/返回
        try {
            var op30 = '_$_L[_$ls++ ]=_$ij[_$ar[ ++_$aT]]';
            if (code.indexOf(op30) !== -1) {
                var op30r = '_$_L[_$ls++ ]=(function(__k){try{globalThis.__op30N=(globalThis.__op30N||0)+1;var __f=_$ij[__k];if(typeof __f==="function"){globalThis.__op30F=(globalThis.__op30F||0)+1;try{globalThis.__vmw("helper-wrap",{k:__k,name:String(__f.name||""),len:__f.length});}catch(e){}}try{if(__k===1)globalThis.__vmw("ij1",{t:typeof __f,len:(__f==null?-1:(typeof __f==="string"?__f.length:(typeof __f.length==="number"?__f.length:-1))),head:String(__f).slice(0,60)});}catch(e){}try{if(typeof __f==="string"&&__f.length>=90){globalThis.__op30sN=(globalThis.__op30sN||0)+1;if(globalThis.__op30sN<=3000)globalThis.__vmw("op30s",{k:__k,n:globalThis.__op30sN,len:__f.length,v:__f.slice(0,600),pc:(typeof globalThis.__adPc==="number"?globalThis.__adPc:-1)});}}catch(e){}if(typeof globalThis.__wrapH!=="function")globalThis.__op30NoH=(globalThis.__op30NoH||0)+1;return (typeof __f==="function"&&typeof globalThis.__wrapH==="function")?globalThis.__wrapH(__f,__k):__f;}catch(e){return _$ij[__k];}})(_$ar[ ++_$aT])';
                code = code.split(op30).join(op30r);
                try { globalThis.__vmw('op30-patched', { hits: 1 }); } catch (e) {}
            }
        } catch (e) {}

        // opcode 360：_$an = _$kr[方法](_$d7[键]) —— 43 字符串的真正来源
        if (N.op360text && N.kr && N.d7) {
            // 不能重复调用方法，保留原赋值，只在前后记录
            var r360b = '===360){' +
                'try{var __o=' + N.kr + ',__f=__o&&__o[' + N.b3 + '[' + N.b3i + ']],__k=' + N.d7 + '[' + N.d7i + '];' +
                'globalThis.__vmw(\'op360-pre\',{pc:' + N.pc2 + '-1,obj:globalThis.__vdesc(__o),method:globalThis.__vdesc(__f),' +
                'mname:(__f&&__f.name)||\'\',key:globalThis.__vdesc(__k),keyval:(typeof __k===\'string\'?__k:\'\')});}catch(e){}' +
                N.op360assign +
                'try{globalThis.__vmw(\'op360-post\',{pc:' + N.pc2 + '-1,an:globalThis.__vdesc(' + N.an + '),retval:(typeof ' +
                N.an + '===\'string\'?' + N.an + ':\'\')});}catch(e){}}';
            if (code.indexOf(N.op360text) !== -1) code = code.split(N.op360text).join(r360b);
        }

        // 解释器入口：记录 _$fH 每次被调用时传入的 pc / _$hS / 调用栈
        if (N.fH && N.fHtext) {
            var fhp = N.fHtext + 'try{globalThis.__vmw(\'fH\',{fn:' + JSON.stringify(N.fH) +
                ',en:globalThis.__vdesc(_$en),hS:globalThis.__vdesc(_$hS),len:(_$hS&&typeof _$hS.length===\'number\')?_$hS.length:\'-\',' +
                'stack:(function(){try{var st=new Error().stack||\'\';var ln=st.split(\'\\n\');return ln.slice(1,4).join(\' | \');}catch(e){return \'\';}})()});}catch(e){}';
            if (code.indexOf(N.fHtext) !== -1) code = code.split(N.fHtext).join(fhp);
        }

        // 全部解释器循环里追踪 _$hS 的变化（它可能在任意子程序里被赋值）
        if (N.loops && N.hS) {
            for (var li = 0; li < N.loops.length; li++) {
                var L = N.loops[li];
                if (L.pc === N.pc2) continue; // 主循环已带组合探针
                var lpre = 'while(1){' + L.op + '=' + L.arr + '[' + L.pc + '];';
                var lpr = lpre + 'try{var __vh2=' + N.hS +
                    ';if(__vh2!==globalThis.__hSLast){globalThis.__hSLast=__vh2;globalThis.__vmw(\'hS-set\',{where:' +
                    JSON.stringify(L.op) + ',pc:' + L.pc + ',hS:globalThis.__vdesc(__vh2),len:(__vh2&&typeof __vh2.length===\'number\')?__vh2.length:\'-\'});}}catch(e){}';
                if (code.indexOf(lpre) !== -1) code = code.split(lpre).join(lpr);
            }
        }

        // _\$aD 字节码解释器：真正的环境探测循环
        //   for(_$aT=_$hV;_$aT<_$ct;_$aT++ ){_$ib=_$ar[_$aT]; ... }
        // 之前的 trace 只覆盖 while(1){op=arr[pc++]} 形式，漏掉了这个解释器；
        // 分叉（qb_bridge vs navigator）就发生在这里的字节码条件跳转上。
        var adHead = 'function _$aD(_$ao,_$hV,_$ct,_$dK){';
        var adHeadP = adHead + 'try{if(globalThis.__adDk)globalThis.__adDk(_$dK,_$ao?_$ao._$iK:null);if(globalThis.__adOn){globalThis.__adCall=(globalThis.__adCall||0)+1;if(globalThis.__adLens){if(globalThis.__adLens.length<20000)globalThis.__adLens.push(_$ct-_$hV);globalThis.__adLensN=(globalThis.__adLensN||0)+(_$ct-_$hV);}}}catch(e){}';
        if (code.indexOf(adHead) !== -1) code = code.split(adHead).join(adHeadP);
        var adLoop = 'for(_$aT=_$hV;_$aT<_$ct;_$aT++ ){_$ib=_$ar[_$aT];';
        var adProbeLight = adLoop +
            'try{globalThis.__adPc=_$aT;globalThis.__adOp=_$ib;globalThis.__adArr=_$ar;}catch(e){}';
        // 指令环快照非常重（每条指令都拼 10 个栈值字符串），只在需要时插入
        var adProbe = adProbeLight;
        if (globalThis.__CSVM_RING || globalThis.__adArrCap) {
            adProbe = adLoop +
                'try{globalThis.__adPc=_$aT;globalThis.__adOp=_$ib;globalThis.__adArr=_$ar;}catch(e){}' +
                'if(globalThis.__admark){var __tp=(function(v){if(v===null)return "null";var t=typeof v;if(t==="string")return "s:"+v.slice(0,40);if(t==="number"||t==="boolean")return String(v);if(t==="object")return "obj";return t;})(_$ls>0?_$_L[_$ls-1]:undefined);globalThis.__admark(_$aT,_$ib,__tp,_$ar,_$ar[_$aT+1],_$ar[_$aT+2],_$ar[_$aT+3],globalThis.__snap10?globalThis.__snap10(_$ar,_$_L,_$ls):(""));}' +
                'if(globalThis.__adOn){try{' +
                'if(!globalThis.__adCur){globalThis.__adCur=[];globalThis.__adN=0;globalThis.__adCall=0;globalThis.__adC=0;}' +
                'globalThis.__adN++;' +
                'var __ld,__lt=_$ls>0?_$_L[_$ls-1]:undefined;' +
                'if(__lt===null)__ld="null";else{var __tt=typeof __lt;' +
                'if(__tt==="string")__ld="s:"+(__lt.length>60?__lt.slice(0,60)+"~":__lt);' +
                'else if(__tt==="number"||__tt==="boolean")__ld=String(__lt);else __ld=__tt;}' +
                'globalThis.__adPc=_$aT;globalThis.__adOp=_$ib;globalThis.__adArr=_$ar;' + 'globalThis.__adCur.push([_$aT,_$ib,_$ls,__ld,globalThis.__adCall]);' +
                'if(globalThis.__adCur.length>20000)globalThis.__adCur.splice(0,10000);' +
                '}catch(e){}}';
        }
        if (code.indexOf(adLoop) !== -1) code = code.split(adLoop).join(adProbe);

        // 字符串解码函数入口：记录当前 VM pc + 输入串 + 最近的 _$aD 指令尾
        [['function _$f_(', 'f_'], ['function _$d6(', 'd6'], ['function _$gO(', 'gO'], ['function _$$b(', '$b']].forEach(function (pair) {
            var st = code.indexOf(pair[0]);
            if (st === -1) return;
            var op2 = code.indexOf('{', st);
            if (op2 === -1) return;
            var sg = code.slice(st, op2);
            var pm = /\(([A-Za-z_$][\w$]*)\)/.exec(sg);
            if (!pm) return;
            var pn = pm[1];
            var pr = 'try{globalThis.__adC=(globalThis.__adC||0)+1;if(globalThis.__adC>320&&globalThis.__adOn)globalThis.__adOn=false;if(globalThis.__vmw)globalThis.__vmw("dec",{fn:' + JSON.stringify(pair[1]) +
                ',pc:(typeof globalThis.__curPc==="undefined"?null:globalThis.__curPc),stack:(new Error()).stack.split(String.fromCharCode(10)).slice(1,7).join(String.fromCharCode(124,32)),inV:globalThis.__vdesc(' + pn + ')' +
                ',adPc:(globalThis.__adPc===undefined?"U":globalThis.__adPc),adN:(globalThis.__adN||0),adCall:(globalThis.__adCall||0),adTail:(globalThis.__adCur?globalThis.__adCur.slice(-36):null)' +
                ',adDelta:(function(){try{if(!globalThis.__adCur)return null;var __d=globalThis.__adCur.slice();globalThis.__adCur.length=0;if((globalThis.__adC<10||globalThis.__adC>30)&&(globalThis.__adC<140||globalThis.__adC>300))return null;if(__d.length>6000)__d=__d.slice(-6000);return __d;}catch(e){return null;}})()});}catch(e){}';
            code = code.split(sg + '{').join(sg + '{' + pr);
        });

        // 分叉后要进入的两个函数（本挑战的随机名）：记录入口调用栈
        [['function _$cf(', 'cf'], ['function _$js(', 'js']].forEach(function (pair) {
            var pat = pair[0];
            var tag = pair[1];
            var start = code.indexOf(pat);
            if (start === -1) return;
            // 函数签名 = 从 function 到参数列表后的第一个 {
            var open = code.indexOf('{', start);
            if (open === -1) return;
            var sig = code.slice(start, open);
            var head = sig + '{';
            var params = /\(([^)]*)\)/.exec(sig);
            var pnames = params ? params[1].split(',').filter(Boolean) : [];
            var probe = 'try{if(globalThis.__vmw){globalThis.__vmw(' + JSON.stringify(tag) + ',{stack:(new Error()).stack.split(String.fromCharCode(10)).slice(1,7).join(" | ")';
            pnames.forEach(function (p) { probe += ',' + JSON.stringify(p) + ':globalThis.__vdesc(' + p.trim() + ')'; });
            probe += ',t:(typeof globalThis.__curT==="undefined"?null:globalThis.__curT)});}}catch(e){}';
            code = code.split(head).join(head + probe);
        });

        // BatteryManager 分支（本挑战 opcode 168）
        var battPat = 'if(_$cp[_$_1[49]]){_$js(11,_$cp[_$_1[49]]);}else if(_$cp[_$jI()]){_$cp[_$jI()]()[_$_6[56]](_$hV);}else{return;}';
        if (code.indexOf(battPat) !== -1) {
            var battRep = 'try{if(globalThis.__vmw){globalThis.__vmw("batt",{cp:globalThis.__vdesc(_$cp),k1:globalThis.__vdesc(_$_1&&_$_1[49]),v1:globalThis.__vdesc(_$cp&&_$cp[_$_1[49]]),has1:!!(_$cp&&_$cp[_$_1[49]]),k2:(function(){try{return globalThis.__vdesc(_$jI());}catch(e){return "err:"+e.message;}})(),k3:globalThis.__vdesc(_$_6&&_$_6[56]),has2:!!(_$cp&&_$cp[_$jI()])});}}catch(e){}' + battPat;
            code = code.split(battPat).join(battRep);
        }

        // getBattery().then(_$hV) 的回调入口
        var hvPat = 'function _$hV(){var _$j9=[11];';
        if (code.indexOf(hvPat) !== -1) {
            code = code.split(hvPat).join(hvPat + 'try{if(globalThis.__vmw)globalThis.__vmw("hV",{stack:(new Error()).stack.split(String.fromCharCode(10)).slice(1,6).join(" | "),jsT:typeof _$js,argsN:(arguments&&arguments.length)});}catch(e){}');
        }
        var hvBody = 'Array.prototype.push.apply(_$j9,arguments);return _$js.apply(this,_$j9);}';
        if (code.indexOf(hvBody) !== -1) {
            code = code.split(hvBody).join('try{Array.prototype.push.apply(_$j9,arguments);}catch(e5){try{if(globalThis.__vmw)globalThis.__vmw("hV-pusherr",{err:String(e5&&e5.stack||e5)});}catch(e6){}throw e5;}try{if(globalThis.__vmw)globalThis.__vmw("hV-2",{n:_$j9.length});}catch(e4){}try{var __r=_$js.apply(this,_$j9);try{if(globalThis.__vmw)globalThis.__vmw("hV-called",{r:globalThis.__vdesc(__r),jsHas:(String(_$js).indexOf("__vmw")!==-1)});}catch(e3){}return __r;}catch(e){try{if(globalThis.__vmw)globalThis.__vmw("hV-err",{err:String(e&&e.stack||e)});}catch(e2){}throw e;}}');
        }

        // opcode 213：分叉点的 return，记录返回时的 JS 调用栈
        if (N.op213text) {
            var r213 = 'else if(' + N.op213op + '===213){try{var __st=(new Error()).stack||"";' +
                'globalThis.__vmw("op213",{pc:' + N.pc213 + '-1,stack:__st.split(String.fromCharCode(10)).slice(1,10).join(" | ")' +
                ',args:(typeof _$dK==="undefined"?"-":[0,1,2,3,4,5,6,7].map(function(i){try{return globalThis.__vdesc(_$dK[i]);}catch(e){return "e";}}).join(","))' +
                (N.ctx && N.eu ? ',ctx:globalThis.__vdesc(' + N.ctx + '),prop:' + JSON.stringify(N.ctxProp) +
                    ',ctxProp:globalThis.__vdesc(' + N.ctx + '&&' + N.ctx + '[' + JSON.stringify(N.ctxProp) + ']),eu:globalThis.__vdesc(' + N.eu + ')' : '') +
                '});}catch(e){}return;}';
            if (code.indexOf(N.op213text) !== -1) code = code.split(N.op213text).join(r213);
        }

        // opcode 27：解密当前函数字节码 _$kJ = _$j0(_$hS, _$an)
        if (N.op27text && N.hS) {
            var r27 = 'try{globalThis.__vmw(\'op27-pre\',{pc:' + N.pc2 + '-1,hS:globalThis.__vdesc(' + N.hS +
                '),hSlen:(' + N.hS + '&&typeof ' + N.hS + '.length===\'number\')?' + N.hS + '.length:\'-\',' +
                'an:globalThis.__vdesc(' + N.an + '),anAll:(function(){try{return JSON.stringify(' + N.an + ');}catch(e){return \'err\';}})(),hSall:(function(){try{return JSON.stringify(' + N.hS + ');}catch(e){return \'err\';}})(),e12:globalThis.__vdesc(' + N.e6 + '?' + N.e6 +
                '[12]:undefined),elen:(' + N.e6 + '&&' + N.e6 + '.length)||0,e6all:(function(){try{return JSON.stringify(' +
                N.e6 + ');}catch(e){return \'err\';}})(),f0:' + JSON.stringify(N.f0 || '') + ',f0name:(function(){try{return ' +
                (N.f0 ? 'typeof ' + N.f0 + ' + "/" + (' + N.f0 + '&&' + N.f0 + '.name)' : '"-"') +
                ';}catch(e){return \'err:\'+e.message;}})(),f0len:(function(){try{var t=new ' + (N.f0 || 'Array') +
                '(24);return t.length+\'/\'+Object.prototype.toString.call(t);}catch(e){return \'err:\'+e.message;}})(),dglen:(function(){try{var t=' +
                (N.dG || 'Array') + '(' + N.hS + ');return t.length+\'/\'+Object.prototype.toString.call(t);}catch(e){return \'err:\'+e.message;}})()});}catch(e){}' + N.op27text +
                'try{globalThis.__vmw(\'op27\',{pc:' + N.pc2 + '-1,kJlen:(' + N.kj + '&&typeof ' + N.kj +
                '.length===\'number\')?' + N.kj + '.length:\'-\',kJ:globalThis.__vdesc(' + N.kj + ')});}catch(e){}';
            if (code.indexOf(N.op27text) !== -1) code = code.split(N.op27text).join(r27);
        }

        // opcode 180：_$ap = _$fa(_$kJ)，记录赋值前后和游标
        if (N.ap180text && N.fa) {
            var r180 = 'try{globalThis.__vmw(\'op180-pre\',{pc:' + N.pc2 + '-1,kj:globalThis.__vdesc(' + N.kj +
                '),hW:(' + N.kj + '&&typeof ' + N.kj + '._$hW===\'number\')?' + N.kj + '._$hW:\'-\'});}catch(e){}' +
                N.ap180text +
                'try{globalThis.__vmw(\'op180\',{pc:' + N.pc2 + '-1,ap:globalThis.__vdesc(' + N.ap +
                '),hW:(' + N.kj + '&&typeof ' + N.kj + '._$hW===\'number\')?' + N.kj + '._$hW:\'-\'});}catch(e){}';
            if (code.indexOf(N.ap180text) !== -1) code = code.split(N.ap180text).join(r180);
        }

        // opcode 660：读 _$gr[idx]
        var t660 = 'if(' + N.op + '===660){' + N.az + '=' + N.gr + '[' + N.idx + '];}';
        var r660 = 'if(' + N.op + '===660){try{globalThis.__vmw(\'op660\',{pc:' + N.pc + '-1,idx:' + N.idx +
            ',glen:(' + N.gr + '&&typeof ' + N.gr + '.length===\'number\')?' + N.gr + '.length:\'-\',' +
            'garr:globalThis.__varr(' + N.gr + ',40),val:globalThis.__vdesc(' + N.gr + '[' + N.idx + '])});}catch(e){}' +
            N.az + '=' + N.gr + '[' + N.idx + '];' +
            'try{globalThis.__vmw(\'op660-post\',{pc:' + N.pc + '-1,idx:' + N.idx +
            ',val:globalThis.__vdesc(' + N.az + ')});}catch(e){}}';
        if (code.indexOf(t660) !== -1) code = code.split(t660).join(r660);

        // opcode 78：填充 _$gr 前后
        var rfill = 'try{globalThis.__vmw(\'fill-pre\',{pc:' + N.pc2 + '-1,ap:' + N.ap +
            ',glen:(' + N.gr2 + '&&typeof ' + N.gr2 + '.length===\'number\')?' + N.gr2 + '.length:\'-\',' +
            'garr:globalThis.__varr(' + N.gr2 + ',20)});}catch(e){}' +
            N.fillText +
            'try{globalThis.__vmw(\'fill\',{pc:' + N.pc2 + '-1,ap:' + N.ap +
            ',glen:' + N.gr2 + '.length,garr:globalThis.__varr(' + N.gr2 + ',40)});}catch(e){}';
        if (code.indexOf(N.fillText) !== -1) code = code.split(N.fillText).join(rfill);

        // opcode 75：ap 的来源（解码后帧号/参数个数）
        if (N.apText) {
            var rap = 'try{globalThis.__vmw(\'ap\',{pc:' + N.pc2 + '-1,ap:' + N.ap +
                ',tok:globalThis.__vdesc(' + N.e6 + '?' + N.e6 + '[' + N.e6i + ']:undefined),' +
                'decoder:' + JSON.stringify(N.gg) + ',table:' + JSON.stringify(N.e6) + '});}catch(e){}' + N.apText;
            if (code.indexOf(N.apText) !== -1) code = code.split(N.apText).join(rap);
        }

        // opcode 295：jj = az
        var t295 = 'else{' + N.jj + '=' + N.az + ';}';
        var r295 = 'else{try{globalThis.__vmw(\'op295-pre\',{pc:' + N.pc + '-1,az:globalThis.__vdesc(' + N.az +
            '),jj:globalThis.__vdesc(' + N.jj + ')});}catch(e){}' + N.jj + '=' + N.az +
            ';try{globalThis.__vmw(\'op295\',{pc:' + N.pc + '-1,az:globalThis.__vdesc(' + N.az +
            '),jj:globalThis.__vdesc(' + N.jj + '),truthy:!!' + N.jj + '});}catch(e){}}';
        if (code.indexOf(t295) !== -1) code = code.split(t295).join(r295);

        // opcode 302：依赖 jj 的条件跳转
        var r302 = 'else if(' + N.op + '===302){try{globalThis.__vmw(\'op302\',{pc:' + N.pc + '-1,jj:globalThis.__vdesc(' + N.jj +
            '),truthy:!!' + N.jj + ',skip:!' + N.jj + '});}catch(e){} !' + N.jj + '?' + N.pc + '+=1:0;}';
        if (code.indexOf(N.j302text) !== -1) code = code.split(N.j302text).join(r302);

        return code;
    }

    csvm.installVmWatch = __vmwInstall;
    csvm.applyVmWatch = function (code) {
        try {
            if (globalThis.__CSVM_APPLYVM_LOG) { try { console.log("[APPLYVM-LOG] apply len=" + code.length); } catch (e0) {} }
            __vmwInstall();
            globalThis.__vmw('apply', { len: code.length });
            var __out = __vmwApply(code);
            globalThis.__vmw('applied', { len: __out.length, changed: __out !== code, hasAd: __out.indexOf('__adPc')>=0, hasDec: __out.indexOf('"dec"')>=0 });
            return __out;
        } catch (e) {
            try { globalThis.__vmw('apply-err', { err: String(e && e.message || e) }); } catch (e2) {}
            return code;
        }
    };
    csvm.vmWatchDump = function () {
        try { globalThis.__vmw && globalThis.__vmw('op30n', { n: (globalThis.__op30N || 0), wrapN: (globalThis.__wrapN || 0), fn: (globalThis.__op30F || 0), noH: (globalThis.__op30NoH || 0) }); } catch (e) {}
        try { globalThis.__vmw && globalThis.__vmw('fimN', { n: (globalThis.__fimN || 0) }); } catch (e) {}
        try { globalThis.__vmw && globalThis.__vmw('adcaps', { has: typeof globalThis.__adArrCap, caps: globalThis.__adArrCap || null }); } catch (e) {}
        try { return JSON.stringify(globalThis.__vmWatch || []); } catch (e) { return '[]'; }
    };
})();
`;

// ---------------------------------------------------------------------------
// 框架整段包进 IIFE 执行
//
// 顶层 var / function 声明会变成函数局部，不再挂到沙箱全局对象（= window）上。
// 目标会挨个 Reflect.ownKeys(window) + getOwnPropertyDescriptor，之前能看到
// csvm、proxy、htmlParse、nodeTypeOf 以及 page.js 的 n###_* 节点变量。
//
// 目标代码不能跟着包进来：它内部用间接 eval 跑解码后的代码，eval 只看得到全局变量。
// 顶层 var（_$wb 这类）一旦变成闭包局部，eval 里就 ReferenceError。
// 所以拆成两段执行：框架在 IIFE 里，目标在全局作用域。
// ---------------------------------------------------------------------------

// 接口对象。描述符按 Chrome 实测：writable:true / enumerable:false / configurable:true。
// WindowProperties 浏览器里不存在（连原型链上都没有），不挂。
const EXPOSE = [
    "DOMParser", "Document", "Element", "EventTarget", "History", "IDBFactory",
    "Event", "CustomEvent", "UIEvent", "MouseEvent", "PointerEvent", "WheelEvent", "KeyboardEvent", "FocusEvent", "InputEvent", "CompositionEvent", "TouchEvent", "DragEvent", "ProgressEvent", "SubmitEvent", "ErrorEvent", "MessageEvent", "StorageEvent", "HashChangeEvent", "PopStateEvent", "BeforeUnloadEvent", "PageTransitionEvent", "TextEvent", "TransitionEvent", "XPathExpression", "XPathResult",
    "Location", "Navigator", "Node", "Screen", "Storage", "Window", "DOMRect", "DOMRectReadOnly", "DOMImplementation",
    "XMLHttpRequest", "XMLHttpRequestEventTarget", "Request", "MutationObserver", "MutationRecord", "NodeList", "NetworkInformation", "WebSocket", "BatteryManager", "CanvasRenderingContext2D", "HTMLCanvasElement", "CSSStyleDeclaration",
    "Plugin", "PluginArray", "MimeType", "MimeTypeArray", "BarProp",
    "HTMLElement", "HTMLDocument",
    "HTMLMediaElement", "HTMLAudioElement", "HTMLVideoElement",
    "HTMLAnchorElement", "HTMLBodyElement", "HTMLButtonElement", "HTMLDivElement",
    "HTMLFormElement", "HTMLHeadElement", "HTMLHtmlElement", "HTMLImageElement",
    "HTMLInputElement", "HTMLLIElement", "HTMLLinkElement", "HTMLMetaElement",
    "HTMLOptionElement", "HTMLParagraphElement", "HTMLScriptElement", "HTMLSelectElement",
    "HTMLSpanElement", "HTMLTableCellElement", "HTMLTableElement", "HTMLTableRowElement",
    "HTMLTableSectionElement", "HTMLTitleElement", "HTMLUListElement",
    "HTMLStyleElement", "HTMLTextAreaElement", "HTMLLabelElement", "HTMLFieldSetElement",
    "HTMLOutputElement", "HTMLDataListElement", "HTMLTemplateElement", "HTMLSlotElement",
    "Text", "Comment", "CharacterData", "Attr",
];

// jsdom 后端下这些接口由 jsdom 自己提供，缺失的名字跳过（typeof 不抛 ReferenceError）
// 原生身份修复：接口构造函数在模块末尾被 csvm.proxy() 包成 Proxy 后才暴露到 window，
// 但 X.prototype.constructor 仍指向被包之前的原函数。真机上恒有
//   el.constructor === window.HTMLDivElement
//   window.HTMLElement.prototype.constructor === window.HTMLElement
// 挑战的原生性自检会读这一层，
// 所以在所有暴露完成后，统一把 prototype.constructor 回指到 window 上实际暴露的对象。
const constructor_code =
    "(function(){var L=" + JSON.stringify(EXPOSE) + ";" +
    "for(var i=0;i<L.length;i++){var n=L[i];try{" +
    "var C=window[n];if(typeof C!=='function'||!C.prototype)continue;" +
    "var d=Object.getOwnPropertyDescriptor(C.prototype,'constructor');" +
    "if(!d||d.value!==C||d.writable!==true||d.enumerable!==false||d.configurable!==true){" +
    "Object.defineProperty(C.prototype,'constructor',{value:C,writable:true,enumerable:false,configurable:true});}" +
    "}catch(e){}}})();";

const expose_code = EXPOSE.map(function (name) {
    return `try { if (typeof ${name} !== "undefined") Object.defineProperty(window, ${JSON.stringify(name)}, ` +
        `{ value: ${name}, writable: true, enumerable: false, configurable: true }); } catch (e) {}`;
}).join("\r\n") + "\r\n" + constructor_code + (process.env.CSVM_NO_REQUEST === "1" ? "\r\ntry { if (typeof window.Request !== \"undefined\") delete window.Request; } catch (e) {}" : "") +
    (process.env.CSVM_NO_FETCH === "1" ? "\r\ntry { if (typeof window.fetch !== \"undefined\") delete window.fetch; } catch (e) {}" : "");

// window 全局描述符对齐真机：
//   document / location / history / navigator / screen / indexedDB /
//   localStorage / sessionStorage / name 都是 window 自有 accessor。
// document / location 是 configurable:false，其余 configurable:true。
const singleton_code = [
    "var __document_ref = document;",
    "var __navigator_ref = navigator;",
    "var __localStorage_ref = localStorage;",
    "var __sessionStorage_ref = sessionStorage;",
    "csvm.memory.windowName = window.name || \"\";",
    // __fwLoc 仅供 OP269 诊断使用；默认不建，避免在 window 上留下可枚举之外的宿主标记
    (process.env.CSVM_OP269 === "1"
        ? "try { Object.defineProperty(globalThis, \"__fwLoc\", { value: location, enumerable: false, configurable: true }); } catch (e) {}"
        : ""),
    "try { console.log(\"[LOC-SING] type=\" + (typeof location) + \" mem=\" + (typeof csvm.memory.location)); } catch (e) {}",
    "Object.defineProperty(window, \"document\", {",
    "    get: csvm.safefunction(function () { return __document_ref; }, \"get document\"),",
    "    enumerable: true, configurable: false",
    "});",
    "Object.defineProperty(window, \"location\", {",
    "    get: csvm.safefunction(function () { try { console.log(\"[LOC-GET] type=\" + (typeof location) + \" mem=\" + (typeof csvm.memory.location)); } catch (e) {} return location; }, \"get location\"),",
    "    set: csvm.safefunction(function (value) { console.log(\"[LOC-SET] \" + String(value)); location.href = value; }, \"set location\"),",
    "    enumerable: true, configurable: false",
    "});",
    "Object.defineProperty(window, \"history\", {",
    "    get: csvm.safefunction(function () { return history; }, \"get history\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"navigator\", {",
    "    get: csvm.safefunction(function () { return __navigator_ref; }, \"get navigator\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"screen\", {",
    "    get: csvm.safefunction(function () { return screen; }, \"get screen\"),",
    "    set: csvm.safefunction(function (value) { screen = value; }, \"set screen\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"indexedDB\", {",
    "    get: csvm.safefunction(function () { return indexedDB; }, \"get indexedDB\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"localStorage\", {",
    "    get: csvm.safefunction(function () { return __localStorage_ref; }, \"get localStorage\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"sessionStorage\", {",
    "    get: csvm.safefunction(function () { return __sessionStorage_ref; }, \"get sessionStorage\"),",
    "    enumerable: true, configurable: true",
    "});",
    "Object.defineProperty(window, \"name\", {",
    "    get: csvm.safefunction(function () { return csvm.memory.windowName; }, \"get name\"),",
    "    set: csvm.safefunction(function (value) { csvm.memory.windowName = String(value); }, \"set name\"),",
    "    enumerable: true, configurable: true",
    "});",
    // vm2 内建描述符对齐（Error 的 configurable:false，改不了，跳过）
    "[\"Function\", \"Proxy\", \"eval\", \"console\"].forEach(function (name) {",
    "    var d = Object.getOwnPropertyDescriptor(window, name);",
    "    if (d && d.configurable) {",
    "        d.enumerable = false;",
    "        Object.defineProperty(window, name, d);",
    "    }",
    "});",
    "try { delete window.SharedArrayBuffer; } catch (e) {}",
].join("\r\n");

// vm2 会往沙箱全局塞一批宿主侧的名字，浏览器里没有。
// 这几个 configurable 都是 true，可以删；删完沙箱照常工作。
// VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL 是 configurable:false，
// 删不掉，Proxy 的 ownKeys 又不允许漏掉非配置自有属性，只能留着。
const cleanup_code = ["Buffer", "global", "GLOBAL", "root", "VMError"].map(function (name) {
    return `delete window[${JSON.stringify(name)}];`;
}).join("\r\n");

// 按文档顺序收集页面 <script>：内联返回文本，外链返回 src，交给执行阶段按序解析。
// 文本来自 parse5 的 text 节点，和浏览器执行时看到的源码一致；
// 不要格式化，否则自校验类脚本（如阿里 WAF / 瑞数）会失效。
function collectPageScripts(htmlPath) {
    if (!fs.existsSync(htmlPath)) {
        throw new Error(`页面文件不存在: ${htmlPath}`);
    }

    const doc = parse5.parse(fs.readFileSync(htmlPath, "utf8"));
    const scripts = [];

    (function walk(node) {
        if (node.nodeName === "script") {
            const attrs = {};
            for (const a of node.attrs || []) attrs[a.name] = a.value;

            const type = (attrs.type || "").toLowerCase();
            const isJs = type === "" || type === "text/javascript" ||
                type === "application/javascript";

            if (!isJs) {
                console.warn(`跳过非 JS 脚本: ${attrs.src || "inline"} type=${attrs.type}`);
            } else if (attrs.src) {
                scripts.push({ kind: "external", src: attrs.src, attrs: attrs });
            } else {
                const text = (node.childNodes || []).map(function (c) {
                    return c.value || "";
                }).join("");
                if (text) scripts.push({ kind: "inline", text: text, attrs: attrs });
            }
        }

        // <template> 的子节点挂在 content 上，不在 childNodes 里
        if (node.content) walk(node.content);
        for (const child of node.childNodes || []) walk(child);
    })(doc);

    return scripts;
}

// parse5 节点 -> 传给沙箱 csvm.rebuildDom 的纯数据树。
// 元素: {tag, attrs, children}；文本/注释: {tag:"#text"/"#comment", text}；
// doctype: {tag:"#documentType", name, publicId, systemId}。
function toDomTree(node) {
    if (!node) return null;
    const name = node.nodeName;

    if (name === "#text") {
        return { tag: "#text", text: node.value || "" };
    }
    if (name === "#comment") {
        return { tag: "#comment", text: node.data || "" };
    }
    if (name === "#documentType") {
        return { tag: "#documentType", name: node.name, publicId: node.publicId, systemId: node.systemId };
    }

    const children = [];
    const pushChildren = function (list) {
        for (const c of list || []) {
            const t = toDomTree(c);
            if (t) children.push(t);
        }
    };
    pushChildren(node.childNodes);
    if (node.content) pushChildren(node.content.childNodes);

    if (name === "#document") {
        return { tag: "#document", children: children };
    }

    const attrs = {};
    for (const a of node.attrs || []) attrs[a.name] = a.value;
    return { tag: name, attrs: attrs, children: children };
}

// 给页面脚本（非 eval）里的 VM 解释器循环插入同样的指令 trace。
// 瑞数有两层 VM：外层 8WwVut...js 里是递归解释器 _$cA，内层是 eval 出来的。
// 只追踪 eval 会漏掉外层分支。
function patchVmTraceText(text) {
    try {
        const re = /while\(1\)\{([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\[([A-Za-z_$][\w$]*)\+\+\];/g;
        const pcOf = {};
        let mm;
        while ((mm = re.exec(text))) pcOf[mm[1]] = mm[3];
        text = text.replace(re, (m, op, arr, pc) => {
            return 'while(1){' + op + '=' + arr + '[' + pc + '];if(globalThis.__vmTraceOn){try{var __ai=globalThis.__vmArrIds.get(' + arr + ');if(__ai===undefined){__ai=++globalThis.__vmArrSeq;globalThis.__vmArrIds.set(' + arr + ',__ai);}globalThis.__vmTrace.push([' + pc + ',' + op + ',__ai,' + JSON.stringify(pc) + ']);globalThis.__curPc=' + pc + ';if(globalThis.__vmTrace.length>20000)globalThis.__vmTrace.splice(0,10000);}catch(e){}}' + pc + '++;';
        });
        // 外层 VM 的 opcode 1 = return：记录当时的 window.$_ts 快照
        for (const op of Object.keys(pcOf)) {
            const pc = pcOf[op];
            const pat = op + '===1){return;}';
            const rep = op + '===1){try{if(globalThis.__vmw)globalThis.__vmw("outer-ret",{pc:' + pc + '-1,ts:(globalThis.__tsSnap?globalThis.__tsSnap():"-"),keys:(function(){try{var n=Object.getOwnPropertyNames(globalThis),o=[];for(var i=0;i<n.length;i++){var k=n[i],d=null;try{d=Object.getOwnPropertyDescriptor(globalThis,k);}catch(e){}if(k.indexOf("$")!==-1||(d&&typeof d.get==="function"))o.push(k);}return o.join(",");}catch(e){return "err";}})()});}catch(e){}return;}';
            if (text.indexOf(pat) !== -1) text = text.split(pat).join(rep);
        }
        // 外层 LCG 种子 / 洗牌输入
        const gmPat = 'function _$gm(_$' + '$e){';
        if (text.indexOf(gmPat) !== -1) {
            text = text.split(gmPat).join(gmPat + 'try{if(globalThis.__vmw)globalThis.__vmw("gm",{seed:globalThis.__vdesc(_$' + '$e),stack:(new Error()).stack.split(String.fromCharCode(10)).slice(1,5).join(String.fromCharCode(124,32))});}catch(e){}');
        }
        const shPat = 'function _$' + '$s(_$kM,_$dZ){';
        if (text.indexOf(shPat) !== -1) {
            text = text.split(shPat).join(shPat + 'try{if(globalThis.__vmw)globalThis.__vmw("shuffle",{n:(_$kM&&_$kM.length)||-1,arr:globalThis.__varr(_$kM,12)});}catch(e){}');
        }

        // 外层递归求值器入口：记录 selector _$aI
        const cApat = 'function _$cA(_$aI,_$_A,_$jP){';
        const cArep = cApat + 'try{if(globalThis.__vmw){globalThis.__cAN=(globalThis.__cAN||0)+1;globalThis.__vmw("cA",{n:globalThis.__cAN,aI:globalThis.__vdesc(_$aI),A:globalThis.__vdesc(_$_A),jP:globalThis.__vdesc(_$jP)});}}catch(e){}';
        if (text.indexOf(cApat) !== -1) text = text.split(cApat).join(cArep);
        return text;
    } catch (e) { return text; }
}

// 外链脚本查找规则（不做映射表）：
//   src="/jhKGIvczkKbR/8WwVutQAyu6q.0515a6f.js"
//   1) <externalScriptDir>/jhKGIvczkKbR/8WwVutQAyu6q.0515a6f.js
//   2) <externalScriptDir>/8WwVutQAyu6q.0515a6f.js
//   3) 在 <externalScriptDir> 下递归找同名文件
// 找到后原样读取，不做格式化。
function resolveExternalScript(src, scriptDir) {
    let clean = String(src).split("#")[0].split("?")[0];
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(clean)) {
        try { clean = new URL(clean).pathname; } catch (e) { /* keep */ }
    }

    const rel = clean.replace(/^\/+/, "");
    const base = path.basename(rel);
    const candidates = [
        path.join(scriptDir, rel),
        path.join(scriptDir, base),
    ];

    for (const file of candidates) {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            return { file: file, text: fs.readFileSync(file, "utf8") };
        }
    }

    // 前两条都没命中时，递归按文件名兜底
    try {
        const entries = fs.readdirSync(scriptDir, { recursive: true, withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name === base) {
                const file = path.join(entry.parentPath || entry.path, entry.name);
                return { file: file, text: fs.readFileSync(file, "utf8") };
            }
        }
    } catch (e) {
        // 目录不存在或递归 API 不支持，忽略
    }

    return null;
}

// 日志落盘：stdout / stderr 同时写一份到 logs/run-<时间>.log。
// 开关由框架内存的 config.logFile 决定；用同步写，目标同步死循环时也能落盘。
// CSVM_LOG_DISABLE=1 可强制关闭；CSVM_LOG_FILE 可覆盖文件路径。
function setupLogFile(config) {
    if (!config.logFile || process.env.CSVM_LOG_DISABLE === "1") {
        return null;
    }

    const logDir = path.resolve(__dirname, "..", config.logDir || "logs");
    fs.mkdirSync(logDir, { recursive: true });

    const logFilePath = process.env.CSVM_LOG_FILE ||
        path.join(logDir, `run-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);

    const logFd = fs.openSync(logFilePath, "w");
    fs.writeSync(
        logFd,
        `# CSVM run ${new Date().toISOString()}\n` +
        `# cwd: ${process.cwd()}\n` +
        `# scriptHtmlPath: ${config.scriptHtmlPath || ""}\n`
    );

    const tee = function (chunk) {
        try { fs.writeSync(logFd, chunk); } catch (e) { /* 落盘失败不影响目标 */ }
    };

    const stdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = function (chunk, encoding, callback) {
        tee(chunk);
        return stdoutWrite(chunk, encoding, callback);
    };

    const stderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = function (chunk, encoding, callback) {
        tee(chunk);
        return stderrWrite(chunk, encoding, callback);
    };

    process.on("exit", function () {
        try { fs.closeSync(logFd); } catch (e) { /* ignore */ }
    });

    return logFilePath;
}

// [DDA] 语法树级重写：typeof / ! / 条件测试 / && / || 全部改成 __dda* helper，
// 让 document.all 替身在宿主 JS 层也表现为 HTMLDDA（typeof undefined、falsy）。
const __ddaOptions = {
    ecmaVersion: "latest",
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowHashBang: true,
};
let __ddaStats = { parsed: 0, failed: 0, transformed: 0 };

function __ddaId(name) { return { type: "Identifier", name }; }
function __ddaArrow(expr) {
    return { type: "ArrowFunctionExpression", id: null, params: [], body: expr, expression: true, async: false, generator: false };
}
function __ddaCall(name, args) {
    return { type: "CallExpression", callee: __ddaId(name), arguments: args, optional: false };
}
const __ddaSkipKeys = { type: 1, start: 1, end: 1, loc: 1, range: 1 };
function __ddaWalk(node) {
    if (!node || typeof node.type !== "string") return node;
    for (const k in node) {
        if (__ddaSkipKeys[k]) continue;
        const v = node[k];
        if (Array.isArray(v)) {
            for (let i = 0; i < v.length; i++) {
                if (v[i] && typeof v[i].type === "string") v[i] = __ddaWalk(v[i]);
            }
        } else if (v && typeof v === "object" && typeof v.type === "string") {
            node[k] = __ddaWalk(v);
        }
    }
    switch (node.type) {
        case "UnaryExpression":
            if (node.operator === "typeof") return __ddaCall("__ddaT", [__ddaArrow(node.argument)]);
            if (node.operator === "!") return __ddaCall("__ddaNot", [__ddaArrow(node.argument)]);
            break;
        case "ConditionalExpression":
            node.test = __ddaCall("__ddaTruthy", [__ddaArrow(node.test)]);
            break;
        case "IfStatement":
        case "WhileStatement":
        case "DoWhileStatement":
            node.test = __ddaCall("__ddaTruthy", [__ddaArrow(node.test)]);
            break;
        case "ForStatement":
            if (node.test) node.test = __ddaCall("__ddaTruthy", [__ddaArrow(node.test)]);
            break;
        case "LogicalExpression":
            if (node.operator === "&&" || node.operator === "||") {
                return __ddaCall(node.operator === "&&" ? "__ddaAnd" : "__ddaOr", [
                    __ddaArrow(node.left),
                    __ddaArrow(node.right),
                ]);
            }
            break;
        default:
            break;
    }
    return node;
}
function __transformEvalCode(code) {
    if (!acorn || !astring) return code;
    if (typeof code !== "string" || code.length < 100) return code;
    let ast;
    try {
        ast = acorn.parse(code, __ddaOptions);
        __ddaStats.parsed++;
    } catch (e) {
        __ddaStats.failed++;
        return code;
    }
    try {
        __ddaWalk(ast);
        const out = astring.generate(ast);
        __ddaStats.transformed++;
        return out;
    } catch (e) {
        __ddaStats.failed++;
        return code;
    }
}

if (process.env.CSVM_VMWATCH === "1") {
    process.on("unhandledRejection", function (e) {
        try { console.log("[UNHANDLED]", e && e.stack ? e.stack : String(e)); } catch (_) {}
    });
}

const __sandbox = { console };
// 让沙箱能把 Node 的微任务队列同步清空（模拟 Chrome 每个任务结束后的 microtask checkpoint）
__sandbox.__flushMicrotasks = function () {
    try { if (typeof process._tickCallback === "function") process._tickCallback(); } catch (e) {}
};
if (process.env.CSVM_NO_PROXY === "1") __sandbox.__CSVM_NO_PROXY__ = true;
if (process.env.CSVM_DOM_TRACE === "1") __sandbox.__CSVM_DOM_TRACE = true;
if (process.env.CSVM_NAMED_TRACE === "1") __sandbox.__CSVM_NAMED_TRACE = true;
if (process.env.CSVM_GETLOG === "1") __sandbox.__CSVM_GETLOG = true;
if (process.env.CSVM_DSQ_PROXY === "1") __sandbox.__CSVM_DSQ_PROXY = true;
if (process.env.CSVM_DSQ_TRACE === "1") __sandbox.__CSVM_DSQ_TRACE = true;
if (process.env.CSVM_AD_LENS === "1") { __sandbox.__adLens = []; __sandbox.__adLensN = 0; __sandbox.__adOn = true; }
if (process.env.CSVM_AD_ARR === "1") { __sandbox.__adArrCap = {}; __sandbox.__adOn = true; }
if (process.env.CSVM_IJ_PROXY === "1") __sandbox.__CSVM_IJ_PROXY = true;
if (process.env.CSVM_STORE_ALL === "1") { __sandbox.__CSVM_STORE_ALL = true; __sandbox.__CSVM_WATCH_CAP = 80000; }
if (process.env.CSVM_CONCAT === "1") { __sandbox.__CSVM_CONCAT = true; __sandbox.__CSVM_WATCH_CAP = 80000; }
if (process.env.CSVM_ARGS === "1") { __sandbox.__CSVM_ARGS = true; __sandbox.__CSVM_WATCH_CAP = 80000; }
if (process.env.CSVM_ARGS_ALL === "1") { __sandbox.__CSVM_ARGS = true; __sandbox.__CSVM_ARGS_ALL = true; __sandbox.__CSVM_WATCH_CAP = 120000; }
if (process.env.CSVM_CALL_FULL === "1") { __sandbox.__CSVM_ARGS = true; __sandbox.__CSVM_CALL_FULL = true; __sandbox.__CSVM_WATCH_CAP = 120000; }
if (process.env.CSVM_RING === "1") { __sandbox.__CSVM_RING = true; __sandbox.__CSVM_RING_N = parseInt(process.env.CSVM_RING_N || "120", 10) || 120; if (process.env.CSVM_RING_CAP) __sandbox.__CSVM_RING_CAP = parseInt(process.env.CSVM_RING_CAP, 10) || 30000; }
if (process.env.CSVM_FOCUS) {
    __sandbox.__CSVM_RING = true;
    __sandbox.__CSVM_RING_N = parseInt(process.env.CSVM_RING_N || "20000", 10) || 20000;
    __sandbox.__CSVM_RING_CAP = parseInt(process.env.CSVM_RING_CAP || "200000", 10) || 200000;
    const __fm = {};
    String(process.env.CSVM_FOCUS).split(",").forEach(function (x) { x = x.trim(); if (x) __fm[x] = 1; });
    __sandbox.__CSVM_FOCUS_MAP = __fm;
}
if (process.env.CSVM_ARG_ALL) {
    const __am = {};
    String(process.env.CSVM_ARG_ALL).split(",").forEach(function (x) { x = x.trim(); if (x) __am[x] = 1; });
    __sandbox.__CSVM_ARG_ALL = __am;
}
if (process.env.CSVM_PAYLOAD_FILE) {
    try {
        __sandbox.__CSVM_PAYLOAD = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", process.env.CSVM_PAYLOAD_FILE), "utf8"));
        __sandbox.__CSVM_PAYLOAD_CALLEE = parseInt(process.env.CSVM_PAYLOAD_CALLEE || "1253133412", 10);
        __sandbox.__CSVM_ARGS = true;
    } catch (e) { console.error("[PAYLOAD] 读取失败", e.message); }
}
if (process.env.CSVM_ENC_ARGS_FILE) {
    try {
        __sandbox.__CSVM_ENC_ARGS = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", process.env.CSVM_ENC_ARGS_FILE), "utf8"));
        __sandbox.__CSVM_ARGS = true;
    } catch (e) { console.error("[ENCARGS] 读取失败", e.message); }
}
if (process.env.CSVM_ARRHOOK === "1") { __sandbox.__CSVM_ARRHOOK = true; __sandbox.__CSVM_WATCH_CAP = 400000; }
if (process.env.CSVM_RAND_SEED) __sandbox.__CSVM_RAND_SEED = Number(process.env.CSVM_RAND_SEED) || 1;
if (process.env.CSVM_FIXED_TIME) __sandbox.__CSVM_FIXED_TIME = Number(process.env.CSVM_FIXED_TIME) || 1794656000000;
if (process.env.CSVM_PAYLOAD_PRINT === "1") { __sandbox.__CSVM_PAYLOAD_PRINT = true; __sandbox.__CSVM_ARGS = true; }
if (process.env.CSVM_ENC_ARGS_PRINT === "1") __sandbox.__CSVM_ENC_ARGS_PRINT = true;
if (process.env.CSVM_FB_TRACE === "1") __sandbox.__CSVM_FB_TRACE = true;
if (process.env.CSVM_SNAPDEEP === "1") __sandbox.__CSVM_SNAPDEEP = true;
if (process.env.CSVM_DUMP_TABLES === "1") { __sandbox.__CSVM_SNAPDEEP = true; __sandbox.__CSVM_DUMP_TABLES = true; }
// 探针开关不再写进沙箱：挑战会枚举 window 键，多一个 __CSVM_* 就会改变执行路径。
// 开关由宿主侧在构造 ENV_DUMP 代码时内联（见下面 typeof 条件）。
if (process.env.CSVM_CALL_LOG === "1") { __sandbox.__CSVM_CALL_LOG = true; __sandbox.__CSVM_WATCH_CAP = 32; }
if (process.env.CSVM_BITDUMP === "1") { __sandbox.__CSVM_BITDUMP = true; __sandbox.__CSVM_CALL_LOG = true; }
if (process.env.CSVM_CALL0 === "1") { __sandbox.__CSVM_CALL0 = true; __sandbox.__CSVM_CALL_LOG = true; }
if (process.env.CSVM_SCOPELOG === "1") __sandbox.__CSVM_SCOPELOG = true;
if (process.env.CSVM_SWAP_ONLY) __sandbox.__CSVM_SWAP_ONLY = process.env.CSVM_SWAP_ONLY;
if (process.env.CSVM_OBJDUMP === "1") { __sandbox.__CSVM_OBJDUMP = true; __sandbox.__CSVM_ARGS = true; }
if (process.env.CSVM_PAYLOAD_AT_RET_FILE) {
    try {
        __sandbox.__CSVM_PAYLOAD_AT_RET = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", process.env.CSVM_PAYLOAD_AT_RET_FILE), "utf8"));
        __sandbox.__CSVM_ARGS = true;
    } catch (e) { console.error("[ATRET] 读取失败", e.message); }
}
if (process.env.CSVM_ARG_ARR === "1") { __sandbox.__CSVM_ARGS = true; __sandbox.__CSVM_ARG_ARR = true; __sandbox.__CSVM_WATCH_CAP = 120000; }
if (process.env.CSVM_JOIN === "1") { __sandbox.__CSVM_JOIN = true; __sandbox.__CSVM_WATCH_CAP = 80000; }
if (process.env.CSVM_DSQ_UNDEF === "1") __sandbox.__CSVM_DSQ_UNDEF = true;
if (process.env.CSVM_NO_FETCH === "1") __sandbox.__CSVM_NO_FETCH = true;
if (process.env.CSVM_UA_OVERRIDE) __sandbox.__CSVM_UA_OVERRIDE = process.env.CSVM_UA_OVERRIDE;
if (process.env.CSVM_PLATFORM_OVERRIDE) __sandbox.__CSVM_PLATFORM_OVERRIDE = process.env.CSVM_PLATFORM_OVERRIDE;
if (process.env.CSVM_FCC === "1") __sandbox.__CSVM_FCC = true;
if (process.env.CSVM_P_DUMP === "1") __sandbox.__CSVM_P_STATE = true;
// 原生性补丁对照实验（显式开启才会生效）
if (process.env.CSVM_OWN_NAV_PATCH === "1") __sandbox.__CSVM_OWN_NAV = true;
if (process.env.CSVM_OWN_WIN_PATCH === "1") __sandbox.__CSVM_OWN_WIN = true;
if (process.env.CSVM_OWN_NAV_MODE) __sandbox.__CSVM_OWN_NAV_MODE = process.env.CSVM_OWN_NAV_MODE;
if (process.env.CSVM_DDA) __sandbox.__transformEval = __transformEvalCode;
if (nativeDDA) __sandbox.__makeDDA = nativeDDA.makeDDA;

// 运行时可选：
//   默认 vm2（历史实现，Proxy 沙箱）—— 用于对照/分析。
//   CSVM_RUNTIME=native 用 Node 原生 vm 的真实 V8 context（和 sdenv 同类），
//   不经过 vm2 的 Proxy 与代码改写，挑战的原生语义自检才能通过。
//   CSVM_DOM=jsdom 用 jsdom 作为 DOM 后端（配合原生 vm 的真实 V8 context）：
//   保留框架的 csvm/api/宿主流程，只把手写 DOM 换成 jsdom。需要 CSVM_SCRIPT_HTML。
const USE_NATIVE_VM = process.env.CSVM_RUNTIME === "native";
let VMScript, vm, vmRunner;
if (USE_NATIVE_VM) {
    const nvm = require("node:vm");
    const ctx = nvm.createContext(__sandbox);
    VMScript = function (code, label) { this.code = code; this.label = label; };
    vm = { run: function (s) { return nvm.runInContext(s.code, ctx, { filename: s.label || "anonymous" }); } };
    vmRunner = function (code, label) { return vm.run(new VMScript(code, label)); };
} else {
    VMScript = __vm2mod.VMScript;
    vm = new __vm2mod.VM({ sandbox: __sandbox });
    vmRunner = function (code, label) { return vm.run(new VMScript(code, label)); };
}

// 第一段：框架。返回值只有宿主能拿到，目标代码看不到。
const api = vmRunner(
    "(function () {\r\n" +
    csvm_code + "\r\n" +
    expose_code + "\r\n" +
    singleton_code + "\r\n" +
    cleanup_code + "\r\n" +
    // 清理完 vm2 的全局后再扫一次：这次能覆盖上面 EXPOSE 挂上去的接口对象，
    // 顺序放在 cleanup 之后，Buffer / VMError 这些已经删了，不会被无谓地修一遍
    "csvm.nativeText.repairAll();\r\n" +
    "csvm.flushMicrotasks = globalThis.__flushMicrotasks;\r\n" +
    "try { delete globalThis.__flushMicrotasks; } catch (e) {}\r\n" +
    // 诊断：按 env 覆盖 navigator 的若干 getter（仅 own-DOM 路径）
    (process.env.CSVM_NAV_OVERRIDE ? (function () {
        try {
            var ov = JSON.parse(process.env.CSVM_NAV_OVERRIDE);
            var js = JSON.stringify(ov);
            return "(function(){var ov=" + js + ";function arrLike(n){var a={length:n,item:function(){return null;},namedItem:function(){return null;},refresh:function(){}};for(var i=0;i<n;i++)a[i]=null;return a;}" +
                "try{var NP=Navigator.prototype;Object.keys(ov).forEach(function(k){if(k.indexOf('__')===0||k==='pluginsLength'||k==='mimeTypesLength')return;try{var d=Object.getOwnPropertyDescriptor(NP,k);Object.defineProperty(NP,k,{configurable:true,enumerable:d?d.enumerable:true,get:csvm.safefunction(function(){return ov[k];},'get '+k)});}catch(e){}});" +
                "if(ov.pluginsLength!==undefined){Object.defineProperty(NP,'plugins',{configurable:true,enumerable:true,get:csvm.safefunction(function(){return arrLike(ov.pluginsLength);},'get plugins')});}" +
                "if(ov.mimeTypesLength!==undefined){Object.defineProperty(NP,'mimeTypes',{configurable:true,enumerable:true,get:csvm.safefunction(function(){return arrLike(ov.mimeTypesLength);},'get mimeTypes')});}" +
                "if(ov.__win){Object.keys(ov.__win).forEach(function(k){try{Object.defineProperty(window,k,{configurable:true,enumerable:true,get:csvm.safefunction(function(){return ov.__win[k];},'get '+k)});}catch(e){}});}" +
                "if(ov.__scr){Object.keys(ov.__scr).forEach(function(k){try{Object.defineProperty(Screen.prototype,k,{configurable:true,enumerable:true,get:csvm.safefunction(function(){return ov.__scr[k];},'get '+k)});}catch(e){}});}" +
                "if(ov.__docBodyNull){try{Object.defineProperty(Document.prototype,'body',{configurable:true,enumerable:true,get:csvm.safefunction(function(){return null;},'get body'),set:undefined});}catch(e){}}" +
                "if(ov.__noSel){try{var __empty=function(){return [];};Document.prototype.querySelectorAll=__empty;Element.prototype.querySelectorAll=__empty;Document.prototype.querySelector=function(){return null;};Element.prototype.querySelector=function(){return null;};Document.prototype.getElementsByTagName=__empty;Element.prototype.getElementsByTagName=__empty;Document.prototype.getElementsByClassName=__empty;Element.prototype.getElementsByClassName=__empty;Document.prototype.getElementById=function(){return null;};}catch(e){}}" +
                "if(ov.__noEvent){try{var __noop=function(){};EventTarget.prototype.addEventListener=__noop;EventTarget.prototype.removeEventListener=__noop;EventTarget.prototype.dispatchEvent=function(){return true;};}catch(e){}}" +
                "if(ov.__noMO){try{window.MutationObserver=function MutationObserver(){this.observe=function(){};this.disconnect=function(){};this.takeRecords=function(){return [];};};csvm.safefunction(window.MutationObserver,'MutationObserver');}catch(e){}}" +
                "if(ov.__treeTrim){try{var __tl=ov.__treeTrim==='meta'?document.getElementsByTagName('meta'):(ov.__treeTrim==='head'?(document.head?[document.head]:[]):[]);for(var __ti=__tl.length-1;__ti>=0;__ti--){var __tn=__tl[__ti];if(__tn&&__tn.parentNode)__tn.parentNode.removeChild(__tn);}}catch(e){}}" +
                "if(ov.__webglNull){try{var __gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t){if(String(t).indexOf('webgl')!==-1)return null;return __gc.apply(this,arguments);};}catch(e){}}" +
                "if(ov.__fontFixed){try{var __mt=CanvasRenderingContext2D.prototype.measureText;CanvasRenderingContext2D.prototype.measureText=function(t){var r=__mt.apply(this,arguments);try{r.width=0;}catch(e){return {width:0};}return r;};}catch(e){}}" +
                "if(ov.__canvasFixed){try{HTMLCanvasElement.prototype.toDataURL=function(){return 'data:image/png;base64,';};var __gi=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(x,y,w,h){w=w|0;h=h|0;return {width:w,height:h,data:new Uint8ClampedArray(w*h*4),colorSpace:'srgb'};};}catch(e){}}" +
                "}catch(e){}})();\r\n";
        } catch (e) { return ""; }
    })() : "") +
    vmwatch_code + "\r\n" +
    "return {\r\n" +
    "    setPhase: function (p) { csvm.memory.phase = p; },\r\n" +
    "    setConfig: function (k, v) { csvm.memory.config[k] = v; },\r\n" +
    "    installNativeDDA: function () {\r\n" +
    "        var make = globalThis.__makeDDA;\r\n" +
    "        try { delete globalThis.__makeDDA; } catch (e) {}\r\n" +
    "        if (typeof make !== 'function') return false;\r\n" +
    "        var obj;\r\n" +
    "        try { obj = make(); } catch (e) { return false; }\r\n" +
    "        if (typeof obj !== 'undefined') return false;\r\n" +
    "        if (typeof csvm.decorateNativeAll === 'function') csvm.decorateNativeAll(obj);\r\n" +
    "        try { console.log('[DDA-NATIVE-CHECK] typeof=' + (typeof obj) + ' bool=' + (!!obj) + ' eqUndef=' + (obj === undefined) + ' str=' + String(obj) + ' len=' + obj.length + ' ctor=' + (obj.constructor && obj.constructor.name) + ' inst=' + (typeof HTMLAllCollection === 'function' ? (obj instanceof HTMLAllCollection) : 'n/a')); } catch (e) {}\r\n" +
    "        try { (function(){ var a=obj; function S(f){try{return String(f());}catch(e){return 'ERR:'+e.message;}} var o={typeof:typeof a,not:!a,eqU:a===undefined,neU:a!==undefined,eqN:a===null,looseN:a==null,looseU:a==undefined,str:S(function(){return String(a);}),tag:S(function(){return Object.prototype.toString.call(a);}),len:a.length,tags:(function(){var o=[];for(var i=0;i<a.length;i++){try{o.push(a[i]&&a[i].tagName);}catch(e){o.push('E');}}return o;})(),idx0:a[0]?a[0].tagName:null,item0:(typeof a.item==='function'&&a.item(0))?a.item(0).tagName:'noitem',keys:Object.keys(a).slice(0,12),own:Object.getOwnPropertyNames(a).slice(0,12),forin:(function(){var c=0;for(var k in a)c++;return c;})(),json:S(function(){return JSON.stringify(a);}),docAllSame:(document.all===a),ownDesc:!!Object.getOwnPropertyDescriptor(a,'0'),proto:a.constructor&&a.constructor.prototype===Object.getPrototypeOf(a)}; console.log('[DDA-FULL] '+JSON.stringify(o)); })(); } catch(e){ try{console.log('[DDA-FULL-ERR] '+e.message);}catch(_){} }\r\n" +
    "        csvm.memory.ddaObject = obj;\r\n" +
    "        csvm.memory.hasNativeDda = true;\r\n" +
    "        return true;\r\n" +
    "    },\r\n" +
    "    dumpWindowKeys: function () {\r\n" +
    "        try { return Reflect.ownKeys(globalThis).map(function (k) { return typeof k === 'symbol' ? String(k) : String(k); }); } catch (e) { return []; }\r\n" +
    "    },\r\n" +
    "    dumpTs: function () {\r\n" +
    "        try {\r\n" +
    "            var t = globalThis.$_ts;\r\n" +
    "            var out = {};\r\n" +
    "            if (t && (typeof t === 'object' || typeof t === 'function')) {\r\n" +
    "                Reflect.ownKeys(t).forEach(function (k) {\r\n" +
    "                    var v; try { v = t[k]; } catch (e) { out[String(k)] = 'THROW'; return; }\r\n" +
    "                    var tp = typeof v;\r\n" +
    "                    out[String(k)] = tp === 'function' ? 'function' : tp === 'object' ? (v === null ? 'null' : 'object') : String(v).slice(0, 300);\r\n" +
    "                });\r\n" +
    "            }\r\n" +
    "            return JSON.stringify(out);\r\n" +
    "        } catch (e) { return String(e); }\r\n" +
    "    },\r\n" +
    "    postSnapshot: function () {\r\n" +
    "        try {\r\n" +
    "            return JSON.stringify({\r\n" +
    "                docOwn: Object.getOwnPropertyNames(document),\r\n" +
    "                winEqGlobal: window === globalThis,\r\n" +
    "                selfEqWin: self === window,\r\n" +
    "                refDesc: (function () { var d = Object.getOwnPropertyDescriptor(document, 'referrer'); return d ? { get: !!d.get, en: d.enumerable, cf: d.configurable } : null; })(),\r\n" +
    "                cookie: document.cookie,\r\n" +
    "                allLen: (function () { try { return document.all.length; } catch (e) { return -1; } })(),\r\n" +
    "                allDda: (function () { try { var a = document.all; return { typeof: typeof a, not: !a, eqU: a === undefined, neU: a !== undefined, looseN: a == null, str: String(a), len: a.length, call0: (function(){ try { var r = a(0); return r ? (r.tagName || typeof r) : String(r); } catch(e){ return 'ERR:'+e.message; } })(), item0: (typeof a.item === 'function' && a.item(0)) ? a.item(0).tagName : 'noitem', tag: Object.prototype.toString.call(a) }; } catch (e) { return 'ERR:' + e.message; } })(),\r\n" +
    "                tsKeys: (function () { try { var t = globalThis.$_ts; return t ? Reflect.ownKeys(t).map(String) : null; } catch (e) { return String(e); } })(),\r\n" +
    "                atP: (function () { try { return csvm.memory.__pDump ? JSON.parse(csvm.memory.__pDump) : null; } catch (e) { return String(e); } })(),\r\n" +
    "                ctors: (function () {\r\n" +
    "                    try {\r\n" +
    "                        var n = function (x) { try { return x && x.constructor && x.constructor.name; } catch (e) { return 'ERR'; } };\r\n" +
    "                        return {\r\n" +
    "                            doc: n(document), nav: n(navigator), loc: n(location), hist: n(history), screen: n(screen),\r\n" +
    "                            ls: n(localStorage), body: n(document.body), head: n(document.head), all: n(document.all), conn: n(navigator.connection),\r\n" +
    "                            docProto: Object.getPrototypeOf(document) === HTMLDocument.prototype,\r\n" +
    "                            docIsHTMLDocument: document instanceof HTMLDocument,\r\n" +
    "                            docIsDocument: document instanceof Document,\r\n" +
    "                            docIsNode: document instanceof Node,\r\n" +
    "                            navIsNavigator: navigator instanceof Navigator,\r\n" +
    "                            locIsLocation: location instanceof Location,\r\n" +
    "                            histIsHistory: history instanceof History,\r\n" +
    "                            screenIsScreen: screen instanceof Screen,\r\n" +
    "                            lsIsStorage: localStorage instanceof Storage\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                protoKeys: (function () {\r\n" +
    "                    try {\r\n" +
    "                        var p = function (x) { try { return Object.getOwnPropertyNames(Object.getPrototypeOf(x)); } catch (e) { return 'ERR'; } };\r\n" +
    "                        return {\r\n" +
    "                            conn: p(navigator.connection),\r\n" +
    "                            wps: navigator.webkitPersistentStorage ? p(navigator.webkitPersistentStorage) : null,\r\n" +
    "                            storage: p(localStorage),\r\n" +
    "                            history: p(history),\r\n" +
    "                            location: p(location),\r\n" +
    "                            screen: p(screen),\r\n" +
    "                            nav: p(navigator)\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                ident: (function () {\r\n" +
    "                    try {\r\n" +
    "                        return {\r\n" +
    "                            locSame: document.location === window.location,\r\n" +
    "                            docSame: window.document === document,\r\n" +
    "                            navSame: window.navigator === navigator,\r\n" +
    "                            screenSame: window.screen === screen,\r\n" +
    "                            histSame: window.history === history,\r\n" +
    "                            lsSame: window.localStorage === localStorage,\r\n" +
    "                            selfDoc: self.document === document,\r\n" +
    "                            topDoc: top.document === document\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                bools: (function () {\r\n" +
    "                    try {\r\n" +
    "                        return {\r\n" +
    "                            cookieEnabled: navigator.cookieEnabled,\r\n" +
    "                            onLine: navigator.onLine,\r\n" +
    "                            pdf: navigator.pdfViewerEnabled,\r\n" +
    "                            secure: window.isSecureContext,\r\n" +
    "                            fullscreen: document.fullscreenEnabled,\r\n" +
    "                            focus: document.hasFocus(),\r\n" +
    "                            locks: Object.prototype.toString.call(navigator.locks),\r\n" +
    "                            pluginsLen: navigator.plugins ? navigator.plugins.length : -1,\r\n" +
    "                            mimesLen: navigator.mimeTypes ? navigator.mimeTypes.length : -1,\r\n" +
    "                            plugin0: navigator.plugins && navigator.plugins[0] ? navigator.plugins[0].name : null,\r\n" +
    "                            pluginsTag: Object.prototype.toString.call(navigator.plugins),\r\n" +
    "                            mime0: navigator.mimeTypes && navigator.mimeTypes[0] ? navigator.mimeTypes[0].type : null\r\n" +
    "                        };\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                globals: (function () {\r\n" +
    "                    try {\r\n" +
    "                        var out = [];\r\n" +
    "                        Reflect.ownKeys(window).forEach(function (k) {\r\n" +
    "                            if (typeof k !== 'string' || k.indexOf('_$') !== 0) return;\r\n" +
    "                            var v; try { v = window[k]; } catch (e) { out.push([k, 'THROW']); return; }\r\n" +
    "                            var t = typeof v;\r\n" +
    "                            if (t === 'string') out.push([k, 'str', v.length, v.slice(0, 160)]);\r\n" +
    "                            else if (t === 'function') out.push([k, 'fn']);\r\n" +
    "                            else if (t === 'object' && v) { try { out.push([k, 'obj', Array.isArray(v) ? ('arr:' + v.length) : Object.keys(v).slice(0, 24).join(',')]); } catch (e) { out.push([k, 'obj']); } }\r\n" +
    "                            else out.push([k, t]);\r\n" +
    "                        });\r\n" +
    "                        return out;\r\n" +
    "                    } catch (e) { return String(e); }\r\n" +
    "                })(),\r\n" +
    "                winKeys: (function () { try { return Reflect.ownKeys(window).map(String); } catch (e) { return String(e); } })()\r\n" +
    "            });\r\n" +
    "        } catch (e) { return String(e); }\r\n" +
    "    },\r\n" +
    "    snapshot: function () {\r\n" +
    "        try {\r\n" +
    "            var metas = document.getElementsByTagName('meta');\r\n" +
    "            var meta = metas.length > 1 ? metas[1] : metas[0];\r\n" +
    "            var tags = [];\r\n" +
    "            var all = document.getElementsByTagName('*');\r\n" +
    "            for (var i = 0; i < all.length; i++) tags.push(all[i].tagName);\r\n" +
    "            return JSON.stringify({\r\n" +
    "                allLen: (function () { try { return document.all.length; } catch (e) { return 'ERR:' + e.message; } })(),\r\n" +
    "                allDda: (function () { try { var a = document.all; return { typeof: typeof a, not: !a, eqU: a === undefined, neU: a !== undefined, looseN: a == null, str: String(a), len: a.length, call0: (function(){ try { var r = a(0); return r ? (r.tagName || typeof r) : String(r); } catch(e){ return 'ERR:'+e.message; } })(), item0: (typeof a.item === 'function' && a.item(0)) ? a.item(0).tagName : 'noitem', tag: Object.prototype.toString.call(a) }; } catch (e) { return 'ERR:' + e.message; } })(),\r\n" +
    "                tags: tags,\r\n" +
    "                scripts: document.getElementsByTagName('script').length,\r\n" +
    "                bodyChildren: document.body ? document.body.childNodes.length : -1,\r\n" +
    "                headChildren: document.head ? document.head.childNodes.length : -1,\r\n" +
    "                metaR: meta ? meta.getAttribute('r') : null,\r\n" +
    "                bodyFirstType: document.body && document.body.firstChild ? document.body.firstChild.nodeType : null,\r\n" +
    "                cookie: document.cookie,\r\n" +
    "                docOwn: (function () { try { return Object.getOwnPropertyNames(document); } catch (e) { return String(e); } })(),\r\n" +
    "                refInfo: (function () { try { var d = Object.getOwnPropertyDescriptor(document, 'referrer'); if (!d) return null; return { get: !!d.get, set: !!d.set, en: d.enumerable, cf: d.configurable, getName: d.get && d.get.name, protoHas: !!Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document), 'referrer') }; } catch (e) { return String(e); } })(),\r\n" +
    "                ids: (function () { try { return { winEqGlobal: window === globalThis, selfEqWin: self === window, topEqWin: top === window, parentEqWin: parent === window, framesEqWin: frames === window, winWin: window.window === window }; } catch (e) { return String(e); } })(),\r\n" +
    "                html: document.documentElement && document.documentElement.outerHTML != null ? document.documentElement.outerHTML.slice(0, 4000) : null\r\n" +
    "            });\r\n" +
    "        } catch (e) { return JSON.stringify({ error: String(e) }); }\r\n" +
    "    },\r\n" +
    "    installEvalPatch: function () {\r\n" +
    "        var __origEval = eval;\r\n" +
    "        var __apply = Reflect.apply;\r\n" +
    "        var __transform = globalThis.__transformEval;\r\n" +
    "        try { delete globalThis.__transformEval; } catch (e) {}\r\n" +
    "        var __ddaIs = function (v) { return !!(v && v.__rsdda); };\r\n" +
    "        var __ddaT = function (fn) { var v; try { v = fn(); } catch (e) { if (e instanceof ReferenceError) v = undefined; else throw e; } return __ddaIs(v) ? 'undefined' : typeof v; };\r\n" +
    "        var __ddaNot = function (fn) { var v = fn(); return __ddaIs(v) ? true : !v; };\r\n" +
    "        var __ddaTruthy = function (fn) { var v = fn(); return __ddaIs(v) ? false : !!v; };\r\n" +
    "        var __ddaAnd = function (fa, fb) { var a = fa(); return (a && !__ddaIs(a)) ? fb() : a; };\r\n" +
    "        var __ddaOr = function (fa, fb) { var a = fa(); return (a && !__ddaIs(a)) ? a : fb(); };\r\n" +
    "        var __helpers = { __ddaT: __ddaT, __ddaNot: __ddaNot, __ddaTruthy: __ddaTruthy, __ddaAnd: __ddaAnd, __ddaOr: __ddaOr };\r\n" +
    "        for (var __k in __helpers) Object.defineProperty(globalThis, __k, { value: __helpers[__k], writable: true, enumerable: false, configurable: true });\r\n" +
    "        var __patch = function (code) {\r\n" +
    "            if (csvm.memory.config.ddaNoop) return code;\r\n" +
    "            if (csvm.memory.config.ddaComment) return code + '\\n//x';\r\n" +
    "            if (typeof __transform !== 'function') return code;\r\n" +
    "            try { return __transform(code); } catch (e) { return code; }\r\n" +
    "        };\r\n" +
    "        var __wrapped = new Proxy(__origEval, {\r\n" +
    "            apply: function (target, thisArg, args) {\r\n" +
    "                try {\r\n" +
    "                    if (args.length && typeof args[0] === 'string') args[0] = __patch(args[0]);\r\n" +
    "                } catch (e) {}\r\n" +
    "                return __apply(target, thisArg, args);\r\n" +
    "            }\r\n" +
    "        });\r\n" +
    "        csvm.safefunction(__wrapped, 'eval');\r\n" +
    "        Object.defineProperty(globalThis, 'eval', { value: __wrapped, writable: true, enumerable: false, configurable: true });\r\n" +
    "    },\r\n" +
    "    runTimers: function (n, d) { try { return typeof csvm.runTimers === 'function' ? csvm.runTimers(n, d) : 0; } catch (e) { return -1; } },\r\n" +
    "    installVmTrace: function () {\r\n" +
    "        if (typeof csvm.installVmWatch === 'function') csvm.installVmWatch();\r\n" +
    "        globalThis.__vmTraceOn = true;\r\n" +
    "        globalThis.__adOn = true;\r\n" +
    "        globalThis.__adCur = [];\r\n" +
    "        globalThis.__adN = 0;\r\n" +
    "        globalThis.__adCall = 0;\r\n" +
    "        globalThis.__adC = 0;\r\n" +
    "        globalThis.__vmTrace = [];\r\n" +
    "        globalThis.__vmDumped = false;\r\n" +
    "        globalThis.__vmtrace = null;\r\n" +
    "        globalThis.__vmpatch = 0;\r\n" +
    "        globalThis.__vmArrIds = new WeakMap();\r\n" +
    "        globalThis.__vmArrSeq = 0;\r\n" +
    "        globalThis.__op269 = [];\r\n" +
    "        try {\r\n" +
    "            if (typeof globalThis.setTimeout === 'function' && !globalThis.__tqWrapped) {\r\n" +
    "                globalThis.__tqWrapped = true;\r\n" +
    "                globalThis.__tqN = 0;\r\n" +
    "                var __ost = globalThis.setTimeout;\r\n" +
    "                var __wst = function (fn, d) {\r\n" +
    "                    if (typeof fn === 'function') {\r\n" +
    "                        var id = ++globalThis.__tqN;\r\n" +
    "                        try { if (globalThis.__vmw) globalThis.__vmw('timer-reg', { id: id, d: String(d), stack:(new Error()).stack.split(String.fromCharCode(10)).slice(1,6).join(String.fromCharCode(124,32)) }); } catch (e) {}\r\n" +
    "                        var w = function () { globalThis.__curT = id; try { if (globalThis.__vmw) globalThis.__vmw('timer-run', { id: id, d: String(d) }); } catch (e) {} try { return fn.apply(this, arguments); } finally { globalThis.__curT = null; } };\r\n" +
    "                        return __ost.call(globalThis, w, d);\r\n" +
    "                    }\r\n" +
    "                    return __ost.apply(globalThis, arguments);\r\n" +
    "                };\r\n" +
    "                try { csvm.safefunction(__wst, 'setTimeout'); } catch (e) {}\r\n" +
    "                try { Object.defineProperty(globalThis, 'setTimeout', { value: __wst, writable: true, enumerable: false, configurable: true }); } catch (e) {}\r\n" +
    "            }\r\n" +
    "        } catch (e) {}\r\n" +
    "        try {\r\n" +
    "            if (!globalThis.__dgWrapped) {\r\n" +
    "                globalThis.__dgWrapped = true;\r\n" +
    "                var __odg = Object.prototype.__defineGetter__;\r\n" +
    "                var __ods = Object.prototype.__defineSetter__;\r\n" +
    "                var __dgTag = function (o) {\r\n" +
    "                    try {\r\n" +
    "                        if (o === globalThis) return 'window';\r\n" +
    "                        if (o === globalThis.document) return 'document';\r\n" +
    "                        if (o === globalThis.navigator) return 'navigator';\r\n" +
    "                        return (o && o.constructor && o.constructor.name) || typeof o;\r\n" +
    "                    } catch (e) { return 'err'; }\r\n" +
    "                };\r\n" +
    "                if (typeof __odg === 'function') Object.prototype.__defineGetter__ = function (k, fn) {\r\n" +
    "                    try { if (globalThis.__vmw) globalThis.__vmw('dget', { k: String(k), tg: __dgTag(this) }); } catch (e) {}\r\n" +
    "                    return __odg.call(this, k, fn);\r\n" +
    "                };\r\n" +
    "                if (typeof __ods === 'function') Object.prototype.__defineSetter__ = function (k, fn) {\r\n" +
    "                    try { if (globalThis.__vmw) globalThis.__vmw('dset', { k: String(k), tg: __dgTag(this) }); } catch (e) {}\r\n" +
    "                    return __ods.call(this, k, fn);\r\n" +
    "                };\r\n" +
    "            }\r\n" +
    "        } catch (e) {}\r\n" +
    "        try {\r\n" +
    "            if (!globalThis.__dpWrapped) {\r\n" +
    "                globalThis.__dpWrapped = true;\r\n" +
    "                var __odp = Object.defineProperty;\r\n" +
    "                var __rdp = Reflect.defineProperty;\r\n" +
    "                var __dpTag = function (o) {\r\n" +
    "                    try {\r\n" +
    "                        if (o === globalThis) return 'window';\r\n" +
    "                        if (o === globalThis.document) return 'document';\r\n" +
    "                        if (o === globalThis.navigator) return 'navigator';\r\n" +
    "                        if (o === globalThis.location) return 'location';\r\n" +
    "                        var c = o && o.constructor && o.constructor.name;\r\n" +
    "                        if (c === 'Window' || c === 'Document' || c === 'Navigator' || c === 'Location' || c === 'HTMLDocument') return 'proto:' + c;\r\n" +
    "                    } catch (e) {}\r\n" +
    "                    return '';\r\n" +
    "                };\r\n" +
    "                var __dpLog = function (o, k, d, ok, err) {\r\n" +
    "                    try {\r\n" +
    "                        if (!globalThis.__vmw) return;\r\n" +
    "                        var tag = __dpTag(o);\r\n" +
    "                        if (!tag && ok) return;\r\n" +
    "                        globalThis.__vmw('dp', { tag: tag, k: String(k), get: !!(d && d.get), set: !!(d && d.set), v: d && typeof d.value, en: d && d.enumerable, cf: d && d.configurable, ok: ok ? 1 : 0, err: err || '' });\r\n" +
    "                    } catch (e) {}\r\n" +
    "                };\r\n" +
    "                try {\r\n" +
    "                    __odp(Object, 'defineProperty', { value: function (o, k, d) {\r\n" +
    "                        try { var r = __odp(o, k, d); __dpLog(o, k, d, 1); return r; }\r\n" +
    "                        catch (e) { __dpLog(o, k, d, 0, String(e && e.message)); throw e; }\r\n" +
    "                    }, writable: true, enumerable: false, configurable: true });\r\n" +
    "                } catch (e) {}\r\n" +
    "                try {\r\n" +
    "                    __odp(Reflect, 'defineProperty', { value: function (o, k, d) {\r\n" +
    "                        try { var r = __rdp(o, k, d); __dpLog(o, k, d, 1); return r; }\r\n" +
    "                        catch (e) { __dpLog(o, k, d, 0, String(e && e.message)); throw e; }\r\n" +
    "                    }, writable: true, enumerable: false, configurable: true });\r\n" +
    "                } catch (e) {}\r\n" +
    "            }\r\n" +
    "        } catch (e) {}\r\n" +
    "        globalThis.__tsSnap = function () {\r\n" +
    "            try {\r\n" +
    "                var t = globalThis.$_ts;\r\n" +
    "                if (!t) return 'none';\r\n" +
    "                var o = {}, ks = Object.keys(t);\r\n" +
    "                for (var i = 0; i < ks.length; i++) {\r\n" +
    "                    var v; try { v = t[ks[i]]; } catch (e) { o[ks[i]] = 'THROW'; continue; }\r\n" +
    "                    var tp = typeof v;\r\n" +
    "                    o[ks[i]] = tp === 'function' ? 'fn' : (tp === 'object' && v !== null) ? ('obj' + (v.length !== undefined ? ' len=' + v.length : '')) : String(v).slice(0, 60);\r\n" +
    "                }\r\n" +
    "                return JSON.stringify(o);\r\n" +
    "            } catch (e) { return 'err:' + (e && e.message); }\r\n" +
    "        };\r\n" +
    "        var __oj = Array.prototype.join;\r\n" +
    "        Array.prototype.join = new Proxy(__oj, { apply: function (t, th, args) {\r\n" +
    "            var r = Reflect.apply(t, th, args);\r\n" +
    "            try {\r\n" +
    "                if (typeof r === 'string' && r.indexOf('https:') === 0 && !globalThis.__vmDumped) {\r\n" +
    "                    globalThis.__vmDumped = true;\r\n" +
    "                    // 先存一版 https 时刻的快照，但不停止录制：后面 CSVM_JOIN_SEQ\n" +
    "                    // 会在第 40 次挑战 join 时覆盖成更晚的快照\r\n" +
    "                    globalThis.__vmtrace = JSON.stringify({ head: r.slice(0, 60), trace: globalThis.__vmTrace.slice() });\r\n" +
    "                }\r\n" +
    "            } catch (e) {}\r\n" +
    "            return r;\r\n" +
    "        } });\r\n" +
    "        var __origEval = eval;\r\n" +
    "        var __wrapped = new Proxy(__origEval, { apply: function (t, th, args) {\r\n" +
    "            try {\r\n" +
    "                if (args.length && typeof args[0] === 'string' && args[0].length > 10000) {\r\n" +
    "                    try { if (typeof globalThis.__vmw === 'function') { var __h=0, __cs=args[0]; for (var __ci=0; __ci<__cs.length; __ci++) __h=(__h*31+__cs.charCodeAt(__ci))|0; globalThis.__vmw('eval-src',{cdLen:(globalThis.$_ts&&typeof globalThis.$_ts.cd==='string')?globalThis.$_ts.cd.length:-1,aebiInfo:(function(){try{var a=globalThis.$_ts.aebi,o=[];for(var i=0;i<a.length;i++){var v=a[i],s=typeof v;if(v&&typeof v.length==='number'){var h=0;try{for(var j=0;j<v.length;j++)h=(h*31+((typeof v[j]==='number')?v[j]:String(v[j]).charCodeAt(0)))|0;}catch(e){}s+=':'+v.length+':h'+h;}else{s+=':'+String(v).slice(0,30);}o.push(s);}return o.join('|');}catch(e){return 'err:'+e.message;}})(),scjLen:(globalThis.$_ts&&globalThis.$_ts.scj&&typeof globalThis.$_ts.scj.length==='number')?globalThis.$_ts.scj.length:-1,aebiLen:(globalThis.$_ts&&globalThis.$_ts.aebi&&typeof globalThis.$_ts.aebi.length==='number')?globalThis.$_ts.aebi.length:-1,cdH:(function(){try{var c=globalThis.$_ts&&globalThis.$_ts.cd;if(typeof c!=='string')return -1;var h=0;for(var i=0;i<c.length;i++)h=(h*31+c.charCodeAt(i))|0;return h;}catch(e){return -2;}})(),n:(globalThis.__evalN=(globalThis.__evalN||0)+1),len:__cs.length,h:__h,head:__cs.slice(0,80)}); } } catch (e) {}\r\n" +
    "                    if (!globalThis.__vmsrc) globalThis.__vmsrc = args[0];\r\n" +
    "                    var __re = /while\\(1\\)\\{([A-Za-z_$][\\w$]*)=([A-Za-z_$][\\w$]*)\\[([A-Za-z_$][\\w$]*)\\+\\+\\];/g;\r\n" +
    "                    var __n = 0;\r\n" +
    "                    args[0] = args[0].replace(__re, function (m, op, arr, pc) {\r\n" +
    "                        __n++;\r\n" +
    "                        return 'while(1){' + op + '=' + arr + '[' + pc + '];if(globalThis.__vmTraceOn){try{var __ai=globalThis.__vmArrIds.get(' + arr + ');if(__ai===undefined){__ai=++globalThis.__vmArrSeq;globalThis.__vmArrIds.set(' + arr + ',__ai);}globalThis.__vmTrace.push([' + pc + ',' + op + ',__ai,' + JSON.stringify(pc) + ']);globalThis.__curPc=' + pc + ';if(globalThis.__vmTrace.length>20000)globalThis.__vmTrace.splice(0,10000);}catch(e){}}if(' + pc + '===363){try{console.log(\"[CR363] cH=\"+String(_$cH)+\" gt=\"+String(_$gt));}catch(e){}}' + pc + '++;';\r\n" +
    "                    });\r\n" +
    "                    globalThis.__vmpatch = __n;\r\n" +
    "                    if (globalThis.__CSVM_FB_TRACE) {\r\n" +
    "                        try {\r\n" +
    "                            args[0] = args[0].replace('function _$fb(_$ao,_$hV){', 'function _$fb(_$ao,_$hV){try{if(_$hV&&_$hV.length<=8)console.log(\"[FB] pc=\"+globalThis.__adPc+\" retN=\"+globalThis.__retN+\" cs=\"+(globalThis.__csStr?globalThis.__csStr(8):\"\")+\" data=\"+JSON.stringify(_$hV)+\" stack=\"+String(new Error().stack).slice(0,260));}catch(e){}');\r\n" +
    "                        } catch (e) {}\r\n" +
    "                    }\r\n" +
    "                    if (csvm.memory.config.op269) {\r\n" +
    "                        var __old = 'else if(_$$z===269){_$dY=_$cc[_$iW[32]];}';\r\n" +
    "                        var __new = 'else if(_$$z===269){try{_$dY=_$cc[_$iW[32]];var __d=Object.getOwnPropertyDescriptor(window,\"location\");globalThis.__op269.push({ok:1,obj:String(_$cc),key:String(_$iW[32]),val:String(_$dY),same:_$cc===window,winLoc:String(window.location),globLoc:String(location),hasLoc:(\"location\" in _$cc),fwLoc:(typeof __fwLoc!==\"undefined\"?String(__fwLoc):\"NO\"),sameFw:(window.location===__fwLoc),desc:__d?{get:typeof __d.get,set:typeof __d.set,cf:__d.configurable}:null});}catch(e){globalThis.__op269.push({ok:0,obj:String(_$cc),key:String(_$iW[32]),err:String(e&&e.message),same:_$cc===window,winLoc:String(window.location),globLoc:String(location),hasLoc:(\"location\" in _$cc)});throw e;}}';\r\n" +
    "                        if (args[0].indexOf(__old) !== -1) args[0] = args[0].split(__old).join(__new);\r\n" +
    "                    }\r\n" +
    "                    if (csvm.memory.config.gr660 && typeof csvm.applyVmWatch === 'function') {\r\n" +
    "                        args[0] = csvm.applyVmWatch(args[0]);\r\n" +
    "                    }\r\n" +
    "                }\r\n" +
    "            } catch (e) {}\r\n" +
    "            try { if (args.length && typeof args[0] === 'string' && args[0].length > 1000 && csvm.memory.__srcUrl) args[0] = args[0] + String.fromCharCode(10) + csvm.memory.__srcUrl; } catch (e) {} " +
    "            var __er = Reflect.apply(t, th, args); " +
    "            try { if (typeof globalThis.__vmw === 'function') globalThis.__vmw('eval-ret', { t: typeof __er, v: (__er && typeof __er === 'object') ? ('obj:' + Object.prototype.toString.call(__er)) : String(__er).slice(0, 120) }); } catch (e) {}\r\n" +
    "            return __er;\r\n" +
    "        } });\r\n" +
    "        csvm.safefunction(__wrapped, 'eval');\r\n" +
    "        Object.defineProperty(globalThis, 'eval', { value: __wrapped, writable: true, enumerable: false, configurable: true });\r\n" +
    "    },\r\n" +
    "    getVmTrace: function () { return globalThis.__vmtrace || null; },\r\n" +
    "    getVmTraceFull: function () { try { return JSON.stringify({ head: 'full', trace: (globalThis.__vmTrace || []).slice() }); } catch (e) { return '[]'; } },\r\n" +
    "    getOp269: function () { return JSON.stringify(globalThis.__op269 || []); },\r\n" +
    "    getVmWatch: function () { return typeof csvm.vmWatchDump === 'function' ? csvm.vmWatchDump() : '[]'; },\r\n" +
    "    rebuildDomFromTree: function (tree) { try { return typeof csvm.rebuildDom === 'function' ? csvm.rebuildDom(tree) : 0; } catch (e) { return 'err:' + (e && e.message); } },\r\n" +
    "    setSrcUrl: function (u) { try { csvm.memory.__srcUrl = String(u); return true; } catch (e) { return false; } },\r\n" +
    "    getReflectLog: function () { try { return JSON.stringify(csvm.memory.reflectLog || []); } catch (e) { return '[]'; } },\r\n" +
    "    getRandomLog: function () { try { return JSON.stringify(csvm.memory.randomLog || []); } catch (e) { return '[]'; } },\r\n" +
    "    getAdRing: function () { try { return globalThis.__adRingGet ? globalThis.__adRingGet() : '[]'; } catch (e) { return '[]'; } },\r\n" +
    "    getAdIdHash: function () { try { return globalThis.__adIdHashGet ? globalThis.__adIdHashGet() : '{}'; } catch (e) { return '{}'; } },\r\n" +
    "    getTask9Info: function () {\r\n" +
    "        try {\r\n" +
    "            var t = csvm.memory.task9; if (!t) return 'null';\r\n" +
    "            function call(f) { try { var r = f(); return { t: typeof r, v: JSON.stringify(r).slice(0, 600), s: String(r).slice(0, 300) }; } catch (e) { return { err: String(e && e.message) }; } }\r\n" +
    "            var o = { keys: Object.keys(t), h7: call(t._$h7), bO: call(t._$bO), h7src: String(t._$h7).slice(0, 400), bOsrc: String(t._$bO).slice(0, 400) };\r\n" +
    "            return JSON.stringify(o);\r\n" +
    "        } catch (e) { return 'ERR:' + e.message; }\r\n" +
    "    },\r\n" +
    "    getVmSrc: function () { return globalThis.__vmsrc || null; },\r\n" +
    "    getVmPatch: function () { return globalThis.__vmpatch || 0; },\r\n" +
    "    fireEvent: function (type) { try { return typeof csvm.fireEvent === 'function' ? (csvm.fireEvent(window, type) + csvm.fireEvent(document, type)) : 0; } catch (e) { return -1; } },\r\n" +
    "    showlog: function () { csvm.print.showlog(); },\r\n" +
    "    nativeText: function () { return csvm.nativeText.report(); },\r\n" +
    // 启动模式由框架内存里的 config 决定，宿主侧只读，不直接碰沙箱内部
    "    seedCookie: function (name, value) { try { csvm.memory.cookies[String(name)] = String(value); var out = []; for (var k in csvm.memory.cookies) out.push(k + '=' + csvm.memory.cookies[k]); csvm.memory.cookie = out.join('; '); return true; } catch (e) { return false; } },\r\n" +
    "    getConfig: function () {\r\n" +
    "        return {\r\n" +
    "            runScripts: !!csvm.memory.config.runScripts,\r\n" +
    "            scriptHtmlPath: csvm.memory.config.scriptHtmlPath,\r\n" +
    "            externalScriptDir: csvm.memory.config.externalScriptDir,\r\n" +
    "            logFile: !!csvm.memory.config.logFile,\r\n" +
    "            logDir: csvm.memory.config.logDir\r\n" +
    "        };\r\n" +
    "    }\r\n" +
    "};\r\n" +
    "})();",
    "框架"
);

// 把 flush 能力收进 csvm（不留在 window 上被目标扫到），供 runTimers / fireEvent 使用
// 中间切一次阶段：框架加载期的日志记成 init，目标代码的记成 target
api.setPhase("target");
debugger;

// 宿主侧覆盖配置（不影响默认行为）：便于自动化跑指定挑战、静默模式
if (process.env.CSVM_SCRIPT_HTML) api.setConfig("scriptHtmlPath", process.env.CSVM_SCRIPT_HTML);
// 预置 cookie（name=value; name2=value2），挑战通常需要 O cookie 才能算出被服务端接受的 P
if (process.env.CSVM_COOKIE) {
    String(process.env.CSVM_COOKIE).split(";").forEach(function (pair) {
        var i = pair.indexOf("=");
        if (i <= 0) return;
        var n = pair.slice(0, i).trim();
        var v = pair.slice(i + 1).trim();
        if (n) { try { api.seedCookie(n, v); } catch (e) {} }
    });
}
if (process.env.CSVM_SCRIPT_DIR) api.setConfig("externalScriptDir", process.env.CSVM_SCRIPT_DIR);
if (process.env.CSVM_QUIET === "1") {
    api.setConfig("stream", false);
    api.setConfig("table", false);
    api.setConfig("logFile", false);
    api.setConfig("print", false);
}
if (process.env.CSVM_ELEM_LOG === "1") api.setConfig("elemLog", true);
if (process.env.CSVM_MO_LOG === "1") api.setConfig("moLog", true);
if (process.env.CSVM_P_DUMP === "1") api.setConfig("pDump", true);
if (process.env.CSVM_P_RING === "1") api.setConfig("pRing", true);
if (process.env.CSVM_OP269 === "1") api.setConfig("op269", true);
if (process.env.CSVM_GR660 === "1" || process.env.CSVM_VMWATCH === "1" || process.env.CSVM_APPLYVM === "1") api.setConfig("gr660", true);
// 轻量诊断路径：只装 eval 包装（applyVmWatch），不装 installVmTrace 的重型钩子
if (process.env.CSVM_APPLYVM === "1" && process.env.CSVM_DDA === undefined) {
    try { if (process.env.CSVM_EVAL_PATCH !== "0") api.installEvalPatch(); } catch (e) { console.error("[APPLYVM] installEvalPatch 失败:", e && e.message); }
    __sandbox.__CSVM_APPLYVM_LOG = true;
    try { vm.run(new VMScript("console.log('[APPLYVM] evalPatched=' + (typeof globalThis.__vmWatch) + ' evalStr=' + String(globalThis.eval).slice(0, 60))", "diag-applyvm")); } catch (e) {}
}
if (process.env.CSVM_VM_TRACE === "1" || process.env.CSVM_OP269 === "1" || process.env.CSVM_GR660 === "1" || process.env.CSVM_VMWATCH === "1") api.installVmTrace();

if (process.env.CSVM_ENV_PROBE === "1") {
    vm.run(new VMScript(
        "(function(){" +
        "var o={};function P(k,f){try{o[k]=f();}catch(e){o[k]='ERR:'+(e&&e.message);}}" +
        "P('screen',function(){return [screen.width,screen.height,screen.availWidth,screen.availHeight,screen.colorDepth,screen.pixelDepth];});" +
        "P('win',function(){return [outerWidth,outerHeight,innerWidth,innerHeight,screenX,screenY,devicePixelRatio];});" +
        "P('webdriver',function(){return navigator.webdriver;});" +
        "P('plugins',function(){return navigator.plugins.length;});" +
        "P('mimes',function(){return navigator.mimeTypes.length;});" +
        "P('vendor',function(){return navigator.vendor;});" +
        "P('platform',function(){return navigator.platform;});" +
        "P('languages',function(){return JSON.stringify(navigator.languages);});" +
        "P('hc',function(){return navigator.hardwareConcurrency;});" +
        "P('dm',function(){return navigator.deviceMemory;});" +
        "P('mtp',function(){return navigator.maxTouchPoints;});" +
        "P('chromeKeys',function(){return Object.keys(window.chrome||{});});" +
        "P('notification',function(){return typeof Notification!=='undefined'?Notification.permission:'noNotif';});" +
        "P('hidden',function(){return document.hidden;});" +
        "P('vis',function(){return document.visibilityState;});" +
        "P('orientation',function(){return screen.orientation&&screen.orientation.type;});" +
        "P('uaData',function(){return typeof navigator.userAgentData;});try{navigator.getBattery().then(function(b){console.log('[BATTPROBE] '+String(b)+' charging='+(b&&b.charging)+' level='+(b&&b.level));},function(e){console.log('[BATTPROBE-ERR] '+e);});}catch(e){console.log('[BATTPROBE-THROW] '+e);}P('navKeys',function(){var a=[];for(var k in navigator)a.push(k);return a.join(',');});P('docKeys',function(){var a=[];for(var k in document)a.push(k);return a.join(',');});P('winCount',function(){var n=0;for(var k in window)n++;return n;});P('ua',function(){return navigator.userAgent;});P('appVersion',function(){return navigator.appVersion;});P('appName',function(){return navigator.appName;});P('appCodeName',function(){return navigator.appCodeName;});P('product',function(){return navigator.product;});P('productSub',function(){return navigator.productSub;});P('cookieEnabled',function(){return navigator.cookieEnabled;});P('onLine',function(){return navigator.onLine;});P('pdfViewer',function(){return navigator.pdfViewerEnabled;});P('doNotTrack',function(){return navigator.doNotTrack;});P('conn',function(){var c=navigator.connection||{};return [c.effectiveType,c.rtt,c.downlink,c.saveData].join('|');});P('histLen',function(){return history.length;});P('histState',function(){return JSON.stringify(history.state);});P('lsLen',function(){return localStorage.length;});P('charset',function(){return document.characterSet;});P('contentType',function(){return document.contentType;});P('compatMode',function(){return document.compatMode;});P('readyState',function(){return document.readyState;});P('hasFocus',function(){return document.hasFocus();});P('referrer',function(){return document.referrer;});P('domain',function(){return document.domain;});P('docURL',function(){return document.URL;});P('docURI',function(){return document.documentURI;});P('title',function(){return document.title;});P('winName',function(){return window.name;});P('isSecure',function(){return window.isSecureContext;});P('opener',function(){return typeof window.opener;});P('frameElement',function(){return typeof window.frameElement;});P('winLength',function(){return window.length;});P('closed',function(){return window.closed;});P('tz',function(){return Intl.DateTimeFormat().resolvedOptions().timeZone;});P('locale',function(){return Intl.DateTimeFormat().resolvedOptions().locale;});P('cal',function(){return Intl.DateTimeFormat().resolvedOptions().calendar+'|'+Intl.DateTimeFormat().resolvedOptions().numberingSystem;});P('dtf',function(){return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai'}).format(0);});P('nf',function(){return new Intl.NumberFormat('zh-CN').format(1234567.89);});P('mmDark',function(){return matchMedia('(prefers-color-scheme: dark)').matches;});P('mmReduce',function(){return matchMedia('(prefers-reduced-motion: reduce)').matches;});P('mmFine',function(){return matchMedia('(any-pointer: fine)').matches;});P('cssGrid',function(){return typeof CSS!=='undefined'&&CSS.supports?CSS.supports('display','grid'):'-';});P('cryptoType',function(){return typeof crypto;}),P('storage',function(){return Object.prototype.toString.call(navigator.storage);});P('scrOri',function(){return screen.orientation?screen.orientation.type+'|'+screen.orientation.angle:'-';});P('navTypes',function(){var a=[];for(var k in navigator){var v;try{v=navigator[k];}catch(e){a.push(k+'=THROW');continue;}a.push(k+'='+((v!==null&&typeof v==='object')?Object.prototype.toString.call(v):typeof v));}return a.join(';');});P('desc',function(){function d(o,k){var a=null,b=null;try{var x=Object.getOwnPropertyDescriptor(o,k);if(x)a=[typeof x.get,typeof x.set,typeof x.value,x.enumerable,x.configurable].join(',');}catch(e){a='ERR';}try{var p=Object.getPrototypeOf(o);var y=p&&Object.getOwnPropertyDescriptor(p,k);if(y)b=[typeof y.get,typeof y.set,typeof y.value,y.enumerable,y.configurable].join(',');}catch(e){b='ERR';}return a+';'+b;}var out=[];var pairs=[['navigator','userAgent'],['navigator','plugins'],['navigator','mimeTypes'],['navigator','languages'],['navigator','webdriver'],['navigator','userAgentData'],['document','cookie'],['document','referrer'],['document','hidden'],['screen','width'],['window','innerWidth'],['window','chrome'],['window','location'],['window','opener'],['window','matchMedia']];for(var i=0;i<pairs.length;i++){var o=pairs[i][0]==='window'?window:(pairs[i][0]==='screen'?screen:(pairs[i][0]==='document'?document:navigator));out.push(pairs[i][0]+'.'+pairs[i][1]+'='+d(o,pairs[i][1]));}return out.join(';');});P('types',function(){return {crypto:typeof crypto,performance:typeof performance,getSelection:typeof getSelection,postMessage:typeof postMessage,navigation:typeof navigation,customElements:typeof customElements,scheduler:typeof scheduler,frameElement:typeof frameElement,Worker:typeof Worker,URL:typeof URL,TextEncoder:typeof TextEncoder,TextDecoder:typeof TextDecoder,Notification:typeof Notification,location:typeof location};});" +
        "console.log('[ENVPROBE] '+JSON.stringify(o));" +
        "})();",
        "诊断-envprobe"
    ));
}

// DOM 品牌/原生性自检探针（default 与 jsdom 两条链路对比用）
// 定义在这里、在 installNativeDDA 之后执行，保证 document.all 已就位
const runDomProbe = function () {
    const probeCode = "(function(){" +
        "var o={};function P(k,f){try{o[k]=f();}catch(e){o[k]='ERR:'+(e&&e.message);}}" +
        "function T(v){try{return Object.prototype.toString.call(v);}catch(e){return 'ERR';}}" +
        "var d=document,el=d.createElement('div'),ctx=null;" +
        "P('globals',function(){return "+("(function(){var L=[\"URL\",\"URLSearchParams\",\"TextEncoder\",\"TextDecoder\",\"AbortController\",\"AbortSignal\",\"Headers\",\"Request\",\"Response\",\"fetch\",\"MessageChannel\",\"MessagePort\",\"BroadcastChannel\",\"EventSource\",\"Worker\",\"SharedWorker\",\"ServiceWorker\",\"caches\",\"indexedDB\",\"customElements\",\"navigation\",\"scheduler\",\"getSelection\",\"postMessage\",\"structuredClone\",\"atob\",\"btoa\",\"Blob\",\"File\",\"FileReader\",\"FormData\",\"DOMParser\",\"XMLSerializer\",\"XMLHttpRequest\",\"WebSocket\",\"Notification\",\"matchMedia\",\"requestIdleCallback\",\"cancelIdleCallback\",\"requestAnimationFrame\",\"cancelAnimationFrame\",\"queueMicrotask\",\"performance\",\"crypto\",\"CSS\",\"CSSStyleSheet\",\"CSSRule\",\"Image\",\"Audio\",\"Option\",\"HTMLAllCollection\",\"DOMRect\",\"DOMException\",\"Range\",\"Selection\",\"getComputedStyle\",\"scroll\",\"scrollTo\",\"open\",\"close\",\"print\",\"alert\",\"confirm\",\"prompt\",\"focus\",\"blur\",\"speechSynthesis\",\"IntersectionObserver\",\"ResizeObserver\",\"PerformanceObserver\",\"ReportingObserver\",\"MutationObserver\",\"WebGLRenderingContext\",\"WebGL2RenderingContext\",\"OffscreenCanvas\",\"Path2D\",\"ImageData\",\"TextMetrics\",\"DOMMatrix\",\"reportError\",\"originAgentCluster\",\"trustedTypes\",\"cookieStore\",\"launchQueue\",\"showOpenFilePicker\",\"visualViewport\",\"chrome\",\"external\",\"clientInformation\",\"devicePixelRatio\",\"isSecureContext\",\"crossOriginIsolated\",\"name\",\"status\",\"closed\",\"opener\",\"parent\",\"top\",\"frames\",\"length\",\"self\",\"window\",\"document\",\"location\",\"history\",\"navigator\",\"screen\",\"localStorage\",\"sessionStorage\"];var o={};L.forEach(function(n){try{o[n]=typeof window[n];}catch(e){o[n]='ERR';}});return JSON.stringify(o);})()")+";});" +
        "P('probes',function(){var L=['SekiroClient','Hlclient','czInit','cz_flow','cz_info','genEvent6','get_drag_elements_id','wait_img_complete','imgValidationCodeLoad2','setB','odyNoClick','flow_new','goods_new','info_new','list_new','as_nav','xydata','ret_nodes','data','timeout','runtime','module','canvas','head','app','Name','productSub','__Zm9ybS5pZAo__','__Zm'];var o=[];L.forEach(function(n){var r=[];try{r.push('w:'+typeof window[n]);}catch(e){r.push('w:ERR');}try{r.push('n:'+typeof navigator[n]);}catch(e){r.push('n:ERR');}try{r.push('d:'+typeof document[n]);}catch(e){r.push('d:ERR');}o.push(n+'='+r.join('/'));});return o.join(';');});" +
        "P('perf',function(){" +
        "var o={};function T(k,f){try{o[k]=f();}catch(e){o[k]='ERR:'+(e&&e.message);}}" +
        "T('perfType',function(){return typeof performance;});" +
        "T('timeOrigin',function(){return typeof performance.timeOrigin+':'+String(performance.timeOrigin).slice(0,20);});" +
        "T('now',function(){return typeof performance.now()+':'+String(performance.now()).slice(0,10);});" +
        "T('getEntriesNav',function(){return performance.getEntriesByType?performance.getEntriesByType('navigation').length:'no';});" +
        "T('timing',function(){return performance.timing?Object.keys(performance.timing).length:'no';});" +
        "T('memory',function(){return performance.memory?Object.keys(performance.memory).join(','):'no';});" +
        "T('toJSON',function(){return performance.toJSON?JSON.stringify(Object.keys(performance.toJSON())).slice(0,120):'no';});" +
        "T('crypto',function(){return typeof crypto+'/'+(crypto.getRandomValues?'grv':'no')+'/'+(crypto.subtle?'subtle':'no')+'/randomUUID='+(typeof crypto.randomUUID);});" +
        "T('cryptoTag',function(){return Object.prototype.toString.call(crypto);});" +
        "return JSON.stringify(o);});" +
        "P('evSurface',function(){" +
        "var out={};" +
        "['Event','CustomEvent','UIEvent','MouseEvent','KeyboardEvent','TouchEvent','PointerEvent','FocusEvent','InputEvent','WheelEvent','CompositionEvent','DragEvent','ClipboardEvent','ProgressEvent','SubmitEvent','ErrorEvent','MessageEvent','StorageEvent','HashChangeEvent','PopStateEvent','BeforeUnloadEvent','PageTransitionEvent'].forEach(function(n){try{out[n]=typeof window[n];}catch(e){out[n]='ERR';}});" +
        "out.eventProto=Object.getOwnPropertyNames(Event.prototype).join(',');" +
        "var e=new Event('x');" +
        "out.inst=Object.getOwnPropertyNames(e).join(',');" +
        "['target','currentTarget','eventPhase','bubbles','cancelable','defaultPrevented','composed','timeStamp','isTrusted','returnValue','cancelBubble','type'].forEach(function(k){var v;try{v=typeof e[k]+':'+String(e[k]);}catch(x){v='THROW';}out['p_'+k]=v;});" +
        "return JSON.stringify(out);});" +
        "P('counts',function(){var all=d.getElementsByTagName('*');return JSON.stringify({all:all.length,forms:d.forms.length,scripts:d.scripts.length,inputs:d.getElementsByTagName('input').length,bodyKids:(d.body?d.body.childNodes.length:-1),tags:Array.prototype.map.call(all,function(e){return e.tagName;}).join(',')});});" +
        "P('docTag',function(){return T(d);});" +
        "P('docCtor',function(){return d.constructor&&d.constructor.name;});" +
        "P('docProtoSame',function(){return Object.getPrototypeOf(d)===HTMLDocument.prototype;});" +
        "P('docInst',function(){return [d instanceof HTMLDocument,d instanceof Document,d instanceof Node,d instanceof EventTarget].join(',');});" +
        "P('elTag',function(){return T(el);});" +
        "P('elCtor',function(){return el.constructor&&el.constructor.name;});" +
        "P('elProtoSame',function(){return Object.getPrototypeOf(el)===HTMLDivElement.prototype;});" +
        "P('elInst',function(){return [el instanceof HTMLDivElement,el instanceof HTMLElement,el instanceof Element,el instanceof Node,el instanceof EventTarget].join(',');});" +
        "P('bodyTag',function(){return T(d.body);});" +
        "P('styleTag',function(){return T(d.documentElement.style);});" +
        "P('styleCtor',function(){return d.documentElement.style.constructor&&d.documentElement.style.constructor.name;});" +
        "P('moTag',function(){var m=new MutationObserver(function(){});return T(m)+'|'+(m.constructor&&m.constructor.name);});" +
        "P('evTag',function(){var e=new Event('x');return T(e)+'|'+(e instanceof Event)+'|'+(e.constructor&&e.constructor.name);});" +
        "P('xhrTag',function(){var x=new XMLHttpRequest();return T(x)+'|'+(x.constructor&&x.constructor.name);});" +
        "P('canvasCtx',function(){var c=d.createElement('canvas');ctx=c.getContext('2d');return T(ctx)+'|'+(ctx&&ctx.constructor&&ctx.constructor.name);});" +
        "P('allTag',function(){return T(d.all);});" +
        "P('allCtor',function(){return d.all.constructor&&d.all.constructor.name;});" +
        "P('allInst',function(){try{return d.all instanceof HTMLAllCollection;}catch(e){return 'ERR';}});" +
        "P('createElemTS',function(){return String(d.createElement);});" +
        "P('getAttrTS',function(){return String(Element.prototype.getAttribute);});" +
        "P('appendTS',function(){return String(Node.prototype.appendChild);});" +
        "P('appendMethod',function(){return Node.prototype.appendChild.toString();});" +
        "P('xhrOpenTS',function(){return String(XMLHttpRequest.prototype.open);});" +
        "P('moObserveTS',function(){return String(MutationObserver.prototype.observe);});" +
        "P('createElemDesc',function(){var x=Object.getOwnPropertyDescriptor(Document.prototype,'createElement');return x?[typeof x.value,x.writable,x.enumerable,x.configurable].join(','):'none';});" +
        "P('fnTS',function(){var d=Object.getOwnPropertyDescriptor(Function.prototype,'toString');return [d?[typeof d.get,typeof d.value,d.enumerable,d.writable,d.configurable].join(','):'none',Function.prototype.toString.name,Function.prototype.toString.length].join('|');});" +
        "P('builtinTS',function(){return [String(setTimeout),String(eval),String(Event),String([].join),String(Object.prototype.toString),String(JSON.stringify),String(Map)].join(' ;; ');});" +
        "P('evOwn',function(){return Object.getOwnPropertyNames(Event).join(',');});" +
        "P('evProtoOwn',function(){return Object.getOwnPropertyNames(Event.prototype).slice(0,12).join(',');});" +
        "P('timeoutOwn',function(){return Object.getOwnPropertyNames(setTimeout).join(',');});" +
        "P('errStack',function(){var s=String(new Error('x').stack||'');return s.split('\\n').slice(0,3).join(' | ').slice(0,200);});" +
        "P('errCtor',function(){return [Error.name,Error.length,String(Error)].join('|');});" +
        "P('fnCtorTS',function(){return [String(Function),String(Array),String(Object),String(Reflect),String(Proxy)].join(' ;; ');});" +
        "P('gcs',function(){var x=d.createElement('div');x.style.fontFamily='mmllii';x.style.fontSize='114px';document.body&&document.body.appendChild(x);var s=getComputedStyle(x);return [T(s),s.constructor&&s.constructor.name,s.fontFamily,s.fontSize,s.getPropertyValue&&s.getPropertyValue('font-family'),getComputedStyle(x)===getComputedStyle(x)].join('|');});" +
        "P('rect',function(){var x=d.createElement('div');return [T(x.getBoundingClientRect()),x.offsetWidth,x.clientWidth,x.scrollWidth].join('|');});" +
        "P('styleMeta',function(){var x=d.createElement('div');x.style.color='red';x.style.fontFamily='mmllii';var k=Object.keys(x.style);return [k.length,x.style.length,x.style[0],T(x.style),x.getAttribute('style')].join('|');});" +
        "P('innerText',function(){var x=d.createElement('div');x.innerHTML='<span lang=\"zh\" style=\"font-family:mmllii;font-size:114px\">abc</span>';return [x.childNodes.length,x.textContent,x.innerText,T(x.firstChild)].join('|');});" +
        "P('brands',function(){" +
        "var d=document,x=d.createElement('div');x.innerHTML='<span>a</span><b>b</b>';d.body&&d.body.appendChild(x);" +
        "var f=d.createElement('form');f.id='ff';d.body&&d.body.appendChild(f);" +
        "function B(v){try{return Object.prototype.toString.call(v)+'|'+(v&&v.constructor&&v.constructor.name);}catch(e){return 'ERR';}}" +
        "return JSON.stringify({" +
        "childNodes:B(x.childNodes),children:B(x.children),qsa:B(x.querySelectorAll('span'))," +
        "getByTag:B(d.getElementsByTagName('div')),forms:B(d.forms),attrs:B(x.attributes)," +
        "classList:B(x.classList),dataset:B(x.dataset),styleSheets:B(d.styleSheets)," +
        "qsaLen:x.querySelectorAll('span').length,childLen:x.childNodes.length," +
        "firstChild:x.firstChild&&x.firstChild.nodeName,childrenLen:x.children.length" +
        "});});" +
        "P('createEv',function(){var o={};['Event','MouseEvent','TouchEvent','WheelEvent','TextEvent','TransitionEvent','ProgressEvent'].forEach(function(n){try{var e=document.createEvent(n);o[n]=Object.prototype.toString.call(e);}catch(e){o[n]='THROW:'+(e&&e.name);}});return JSON.stringify(o);});" +
        "P('selfcheck',function(){" +
        "var d=document,host=d.body||d.documentElement,o={};" +
        "function T(k,f){try{o[k]=f();}catch(e){o[k]='ERR:'+(e&&e.message);}}" +
        "var f=d.createElement('form');f.id='__Zm9ybS5pZAo__';f.name='__Zm9ybS5pZAo__';host.appendChild(f);" +
        "var u=d.createElement('input');u.id='username';u.name='username';f.appendChild(u);" +
        "var p=d.createElement('input');p.id='password';p.name='password';p.type='password';f.appendChild(p);" +
        "var x=d.createElement('div');x.id='innerText';host.appendChild(x);" +
        "T('byId',function(){return d.getElementById('__Zm9ybS5pZAo__')===f;});" +
        "T('byName',function(){return d.getElementsByName('__Zm9ybS5pZAo__').length;});" +
        "T('forms0',function(){return d.forms[0]===f;});" +
        "T('formsNamed',function(){return d.forms.namedItem('__Zm9ybS5pZAo__')===f;});" +
        "T('elementsLen',function(){return f.elements.length;});" +
        "T('elements0',function(){return f.elements[0]===u;});" +
        "T('elementsNamed',function(){return f.elements.namedItem('username')===u;});" +
        "T('formNamedProp',function(){return f.username===u;});" +
        "T('weirdId',function(){return d.getElementById('innerText')===x;});" +
        "T('formsById',function(){return d.forms['__Zm9ybS5pZAo__']===f;});" +
        "T('formsLen',function(){return d.forms.length;});" +
        "T('formsItem0',function(){return d.forms.item(0)===f;});" +
        "T('forms0Type',function(){return String(d.forms[0]);});" +
        "T('formsKeys',function(){return Object.keys(d.forms).slice(0,6).join(',');});" +
        "T('formsIndexIn',function(){return 0 in d.forms;});" +
        "T('getByNameType',function(){return typeof d.getElementsByName;});" +
        "return JSON.stringify(o);});" +
        "P('cookie',function(){return String(document.cookie).slice(0,200);});" +
        "P('cookieDesc',function(){var d=Object.getOwnPropertyDescriptor(Document.prototype,'cookie')||Object.getOwnPropertyDescriptor(document,'cookie');return d?[typeof d.get,typeof d.set,d.enumerable,d.configurable,String(d.get),String(d.set)].join('|').slice(0,300):'none';});" +
        "P('leaky',function(){" +
        "var out=[];" +
        "var names=['Event','CustomEvent','MutationObserver','XMLHttpRequest','Document','Node','HTMLElement','HTMLDivElement','HTMLCanvasElement','CSSStyleDeclaration','CanvasRenderingContext2D','Navigator','Location','Screen','Storage','History','Window','Image','Audio','Option','HTMLAllCollection']; " +
        "names.forEach(function(n){try{var f=window[n];if(typeof f!=='function')return;var k=Object.getOwnPropertyNames(f);if(k.indexOf('arguments')!==-1||k.indexOf('caller')!==-1)out.push(n);}catch(e){}});" +
        "var protos=[['Document',Document],['Element',Element],['Node',Node],['HTMLElement',HTMLElement],['Navigator',Navigator],['Screen',Screen],['HTMLCanvasElement',HTMLCanvasElement],['CSSStyleDeclaration',CSSStyleDeclaration]];" +
        "protos.forEach(function(p){try{var pr=p[1]&&p[1].prototype;if(!pr)return;Object.getOwnPropertyNames(pr).forEach(function(k){var d=Object.getOwnPropertyDescriptor(pr,k);var fn=d&&(d.value||d.get);if(typeof fn==='function'){var kk=Object.getOwnPropertyNames(fn);if(kk.indexOf('arguments')!==-1||kk.indexOf('caller')!==-1)out.push(p[0]+'.'+k);}});}catch(e){}});" +
        "return out.length?out.join(','):'clean';});" +
        "console.log('[DOMPROBE] '+JSON.stringify(o));return o;})()";
    try { vm.run(new VMScript(probeCode, "诊断-domprobe")); } catch (e) { console.error("[DOMPROBE] 失败:", e); }
};

// 记录挑战实际调用 Function.prototype.toString 的结果（诊断自我完整性校验）
if (process.env.CSVM_TOSTR_LOG === "1") {
    vm.run(new VMScript(
        "(function(){\r\n" +
        "  var ot = Function.prototype.toString;\r\n" +
        "  var recs = [];\r\n" +
        "  var w = new Proxy(ot, { apply: function (t, th, args) {\r\n" +
        "    var r; try { r = Reflect.apply(t, th, args); } catch (e) { r = 'ERR:' + (e && e.message); }\r\n" +
        "    try { var s = String(r); if (recs.length < 5000) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; recs.push([s.length, h, s.slice(0, 100)]); } } catch (e) {}\r\n" +
        "    return r; } });\r\n" +
        "  try { csvm.safefunction(w, 'toString'); } catch (e) {}\r\n" +
        "  Object.defineProperty(Function.prototype, 'toString', { value: w, writable: true, configurable: true, enumerable: false });\r\n" +
        "  globalThis.__tostrDump = function () { return JSON.stringify(recs); };\r\n" +
        "})();",
        "诊断-tostr"
    ));
}

if (process.env.CSVM_STYLE_PROBE === "1") {
    vm.run(new VMScript(
        "(function(){" +
        "var out={};function P(k,f){try{out[k]=f();}catch(e){out[k]='ERR:'+(e&&e.message);}}" +
        "P('docEl',function(){return document.documentElement?document.documentElement.tagName:'NODOCEL';});" +
        "P('body',function(){return document.body?document.body.tagName:'NOBODY';});" +
        "P('docElStyleType',function(){return typeof document.documentElement.style;});" +
        "P('bodyStyleType',function(){return document.body?typeof document.body.style:'NOBODY';});" +
        "P('styleTag',function(){return Object.prototype.toString.call(document.documentElement.style);});" +
        "P('mozIn',function(){return 'MozAppearance' in document.documentElement.style;});" +
        "P('webkitIn',function(){return 'webkitAppearance' in document.documentElement.style;});" +
        "P('appearanceIn',function(){return 'appearance' in document.documentElement.style;});" +
        "P('bgIn',function(){return 'backgroundColor' in document.documentElement.style;});" +
        "P('getComputed',function(){return typeof getComputedStyle;});" +
        "P('styleKeys',function(){return Object.getOwnPropertyNames(document.documentElement.style).slice(0,20).join(',');});" +
        "P('liveStyle',function(){var d=document.createElement('div');d.style.color='red';d.style.backgroundColor='blue';return d.getAttribute('style')+'|'+d.style.color+'|'+d.style.cssText;});" +
        "P('styleSetAttr',function(){var d=document.createElement('div');d.setAttribute('style','color: red; font-size: 12px');return d.style.color+'|'+d.style.fontSize+'|'+d.getAttribute('style');});" +
        "P('allLive',function(){var b=document.all.length;var d=document.createElement('div');document.body.appendChild(d);var a=document.all.length;var q=document.querySelectorAll('*').length;return 'allLen '+b+'->'+a+' qsaStar='+q+' allTypeof='+(typeof document.all)+' allIdx='+(document.all[0]?document.all[0].tagName:'none');});" +
        "P('formsLive',function(){var f=document.createElement('form');f.id='zz';f.action='/x';document.body.appendChild(f);var i=document.createElement('input');i.name='q';f.appendChild(i);return 'forms='+document.forms.length+' f0id='+(document.forms[0]?document.forms[0].id:'-')+' inputs='+document.forms[0].elements.length+' attr='+document.forms[0].getAttribute('action');});" +
        "P('docElProto',function(){return Object.getOwnPropertyNames(Object.getPrototypeOf(document.documentElement)).join(',');});" +
        "console.log('[STYLEPROBE] '+JSON.stringify(out));" +
        "})();",
        "诊断-styleprobe"
    ));
}

if (process.env.CSVM_SPLIT_LOG === "1") {
    vm.run(new VMScript(
        "(function () {\r\n" +
        "    var __osp = String.prototype.split;\r\n" +
        "    var __n = 0;\r\n" +
        "    String.prototype.split = new Proxy(__osp, { apply: function (t, th, args) {\r\n" +
        "        try {\r\n" +
        "            if (args.length && args[0] === '' && typeof th === 'string' && th.length >= 20 && th.length <= 140) {\r\n" +
        "                __n++;\r\n" +
        "                console.log('[SPLIT] ' + __n + '|' + th.length + '|' + th.slice(0, 120).replace(/[\\r\\n]/g, ' ') + '|TP:' + (globalThis.__vmTrace ? globalThis.__vmTrace.length : -1));\r\n" +
        "            }\r\n" +
        "        } catch (e) {}\r\n" +
        "        return Reflect.apply(t, th, args);\r\n" +
        "    } });\r\n" +
        "})();",
        "诊断-splitlog"
    ));
}

if (process.env.CSVM_JOIN_SEQ === "1") {
    vm.run(new VMScript(
        "(function () {\r\n" +
        "    var __oj = Array.prototype.join;\r\n" +
        "    var __n = 0;\r\n" +
        "    Array.prototype.join = new Proxy(__oj, { apply: function (t, th, args) {\r\n" +
        "        var r = Reflect.apply(t, th, args);\r\n" +
        "        try {\r\n" +
        "            if (typeof r === 'string' && Array.isArray(th)) {\r\n" +
        "                var __st = ''; try { __st = new Error().stack || ''; } catch (e) {}\r\n" +
        "                var __ln = __st.split('\\n');\r\n" +
        "                var __caller = '';\r\n" +
        "                for (var __i = 1; __i < __ln.length; __i++) {\r\n" +
        "                    if (__ln[__i].indexOf('Object.apply') !== -1) continue;\r\n" +
        "                    if (__ln[__i].indexOf('诊断-joinseq') !== -1) continue;\r\n" +
        "                    __caller = __ln[__i]; break;\r\n" +
        "                }\r\n" +
        "                if (__caller.indexOf('(框架:') !== -1) return r;\r\n" +
        "                __n++;\r\n" +
        "                if (__n === 40) { try { globalThis.__vmtrace = JSON.stringify({ head: 'join40:' + r.slice(0, 60), trace: (globalThis.__vmTrace || []).slice() }); } catch (e) {} }\r\n" +
        "                var __extra = __n <= 60 ? ('|STACK:' + __st.replace(/\\r?\\n/g, ' ~ ')) : '';\r\n" +
        "                console.log('[JSEQ] ' + __n + '|' + r.length + '|' + r.slice(0, 100).replace(/[\\r\\n]/g, ' ') + __extra);\r\n" +
        "            }\r\n" +
        "        } catch (e) {}\r\n" +
        "        return r;\r\n" +
        "    } });\r\n" +
        "})();",
        "诊断-joinseq"
    ));
}

if (process.env.CSVM_STR_LOG === "1") {
    vm.run(new VMScript(
        "(function () {\r\n" +
        "    var __oj = Array.prototype.join;\r\n" +
        "    Array.prototype.join = new Proxy(__oj, { apply: function (t, th, args) { var r = Reflect.apply(t, th, args); try { if (typeof r === 'string' && r.length >= 50 && r.length <= 90 && /[0-9]/.test(r) && /[A-Za-z]/.test(r) && /[._]/.test(r)) console.log('[STRLOG-JOIN] ' + r); } catch (e) {} try { if (typeof r === 'string' && r.length >= 50 && r.length <= 800 && (r.indexOf('gregory') !== -1 || r.indexOf('Asia/Shanghai') !== -1 || r.indexOf('_config') !== -1 || r.indexOf('Win32') !== -1)) { console.log('[STRLOG-ENV] len=' + r.length + ' full=' + r); } } catch (e) {} try { if (typeof r === 'string' && r.length >= 200 && r.length <= 400) { var ps = []; if (Array.isArray(th)) { for (var i = 0; i < Math.min(th.length, 20); i++) ps.push(String(th[i]).slice(0, 80)); } console.log('[STRLOG-LONG] len=' + r.length + ' n=' + (Array.isArray(th) ? th.length : -1) + ' full=' + r + ' parts=' + JSON.stringify(ps)); } } catch (e) {} return r; } });\r\n" +
        "    var __os = String.prototype.split;\r\n" +
        "    String.prototype.split = new Proxy(__os, { apply: function (t, th, args) { var r = Reflect.apply(t, th, args); try { if (typeof args[0] === 'string' && args[0].length >= 50 && args[0].length <= 90) console.log('[STRLOG-SPLIT] ' + args[0]); } catch (e) {} return r; } });\r\n" +
        "    var __of = String.fromCharCode;\r\n" +
        "    String.fromCharCode = new Proxy(__of, { apply: function (t, th, args) { var r = Reflect.apply(t, th, args); try { if (typeof r === 'string' && r.length >= 50 && r.length <= 90) console.log('[STRLOG-FCC] ' + r); } catch (e) {} return r; } });\r\n" +
        "})();",
        "诊断-strlog"
    ));
}

// [EXPERIMENT] 让 document.all 的 HTMLDDA 语义在瑞数 VM 里成立。
// 默认关闭，CSVM_DDA=1 打开；noop 只装 Proxy 不改代码，用于对照。
if (process.env.CSVM_DDA) {
    if (process.env.CSVM_DDA === "noop") api.setConfig("ddaNoop", true);
    if (process.env.CSVM_DDA === "comment") api.setConfig("ddaComment", true);
    api.setConfig("ddaFake", process.env.CSVM_DDA !== "nofake");
    if (process.env.CSVM_EVAL_PATCH !== "0") api.installEvalPatch();
}

// 原生 HTMLDDA（推荐路径）：扩展存在且未显式关闭时启用
if (nativeDDA && process.env.CSVM_DDA_NATIVE !== "0") {
    const ok = api.installNativeDDA();
    if (ok) console.log("[DDA-NATIVE] document.all -> 原生 undetectable 对象");
    else console.warn("[DDA-NATIVE] 安装失败（内部槽未保住）");
}
if (process.env.CSVM_P_RING === "1") { try { vm.run(new VMScript("console.log(\"[RING] arm=\"+(typeof globalThis.__adRecOn)+\" get=\"+(typeof globalThis.__adRingGet));if(globalThis.__adRecOn)globalThis.__adRecOn(50000)","diag-ring")); } catch (e) {} }
if (process.env.CSVM_DOM_PROBE === "1") runDomProbe();
if (process.env.CSVM_MO_PROBE === "1") {
    try {
        vm.run(new VMScript(
            "(function(){" +
            "var d=document,host=d.body||d.documentElement,out=[];" +
            "var mo=new MutationObserver(function(recs){" +
            "for(var i=0;i<recs.length;i++){var r=recs[i];out.push({tag:Object.prototype.toString.call(r),ctor:(r.constructor&&r.constructor.name),isMR:(typeof MutationRecord==='function')?(r instanceof MutationRecord):'n/a',type:r.type,attr:r.attributeName,add:(r.addedNodes?(r.addedNodes.length+'/'+Object.prototype.toString.call(r.addedNodes)):'none'),keys:Object.keys(r).join(','),own:Object.getOwnPropertyNames(r).slice(0,12).join(',')});}" +
            "console.log('[MOPROBE] '+JSON.stringify(out));});" +
            "mo.observe(host,{subtree:true,childList:true,attributes:true});" +
            "var x=d.createElement('div');x.setAttribute('data-x','1');host.appendChild(x);x.style.color='red';" +
            "var s=d.createElement('span');x.appendChild(s);" +
            "})();", "诊断-moprobe"));
    } catch (e) { console.error("[MOPROBE] 失败:", e); }
}

if (process.env.CSVM_DUMP_KEYS === "1") {
    try {
        const keys = api.dumpWindowKeys();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "window-keys.json"), JSON.stringify(keys, null, 2));
        console.log("[KEYS] window own keys:", keys.length);
    } catch (e) {
        console.error("[KEYS] 导出失败:", e);
    }
}

if (process.env.CSVM_SNAPSHOT === "1") {
    try {
        const snap = api.snapshot();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "framework-snapshot.json"), snap);
        console.log("[SNAP]", snap.slice(0, 400));
    } catch (e) {
        console.error("[SNAP] 失败:", e);
    }
}

// 第二段：启动模式由框架内存里的 config.runScripts 决定。
//   false -> 执行 src/code.js（单文件模式，默认）
//   true  -> 从 config.scriptHtmlPath 读取 HTML，按文档顺序执行所有内联 <script>
const config = api.getConfig();

// 框架已加载完，按内存里的 logFile 开关决定是否把后续输出落到文件
const logFilePath = setupLogFile(config);
if (logFilePath) console.log(`日志文件: ${logFilePath}`);

(async function __main() {
try {
    if (config.runScripts) {
        if (!config.scriptHtmlPath) {
            console.error("[INPUT] 未指定目标页面。用 CSVM_SCRIPT_HTML=<相对项目根的 HTML 路径> 运行；" +
                "外链脚本默认在同目录或 CSVM_SCRIPT_DIR 指定的目录查找。");
            return;
        }
        const htmlPath = path.resolve(__dirname, "..", config.scriptHtmlPath);
        const scriptDir = path.resolve(__dirname, "..", config.externalScriptDir || "src");
        const entries = collectPageScripts(htmlPath);
        console.log(`整页模式: ${config.scriptHtmlPath}，共 ${entries.length} 个 <script>`);

        // 关键：document 不再用 page.js 的编译期快照，而是按同一份 HTML 重建。
        // 否则换挑战时会出现「脚本是新实例、DOM 是旧实例」，meta content 与
        // 字节码解密 key 不配对（见 诊断/进度-2026-11-13.md 第十一节）。
        try {
            const domTree = toDomTree(parse5.parse(fs.readFileSync(htmlPath, "utf8")));
            const rebuilt = api.rebuildDomFromTree(domTree);
            console.log(`[DOM] 按 HTML 重建 document: ${rebuilt === 1 ? "ok" : rebuilt}`);
        } catch (e) {
            console.error("[DOM] 重建失败，继续用 page.js 快照:", e);
        }

        // 诊断：在挑战执行前往文档里放一个 <script>（验证 document.scripts 是否参与自检）
        if (process.env.CSVM_INJECT_SCRIPT === "1") {
            try {
                vm.run(new VMScript("(function(){try{var d=document;var s=d.createElement('script');s.type='text/javascript';s.text='';var h=d.head||d.documentElement;h.appendChild(s);console.log('[DIAG-SCRIPT] scripts='+(d.scripts?d.scripts.length:'NO'));}catch(e){console.log('[DIAG-SCRIPT] ERR '+e.message);}})()", "diag-inject-script"));
            } catch (e) { console.error("[DIAG-SCRIPT] 失败:", e && e.message); }
        }

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            let text;
            let label;

            if (entry.kind === "inline") {
                text = entry.text;
                label = `script[${i}]`;
            } else {
                const resolved = resolveExternalScript(entry.src, scriptDir);
                if (!resolved) {
                    console.warn(`外部脚本未找到: ${entry.src}（查找目录: ${scriptDir}）`);
                    continue;
                }
                text = resolved.text;
                label = entry.src;
                console.log(
                    `外部脚本: ${entry.src} -> ` +
                    path.relative(path.resolve(__dirname, ".."), resolved.file) +
                    `（${text.length} 字符）`
                );
            }

            try {
                console.log(`执行 ${label}（${text.length} 字符）`);
                try {
                    const site = process.env.CSVM_SITE || "https://www.fangdi.com.cn/";
                    const srcUrl = entry.kind === "inline" ? site : new URL(entry.src, site).href;
                    api.setSrcUrl("//# sourceURL=" + srcUrl);
                } catch (e) {}
                try {
                    if (entry.kind !== "inline") {
                        const site = process.env.CSVM_SITE || "https://www.fangdi.com.cn/";
                        const srcUrl = new URL(entry.src, site).href;
                    }
                } catch (e) {}
                if (process.env.CSVM_VM_TRACE === "1") text = patchVmTraceText(text);
                if (process.env.CSVM_REFLECT_TRACE === "1") api.setConfig("reflectTrace", true);
                if (process.env.CSVM_RAND_TRACE === "1") api.setConfig("randomTrace", true);
                if (process.env.CSVM_PUSH_TRACE === "1") api.setConfig("pushTrace", true);
                if (process.env.CSVM_TASK_TRACE === "1") api.setConfig("taskTrace", true);
                if (process.env.CSVM_PAY_MUT) {
                    const mm = String(process.env.CSVM_PAY_MUT).split(":");
                    api.setConfig("payMut", { from: Number(mm[0]), to: Number(mm[1]) });
                }
                if (process.env.CSVM_PAY_CAP === "1") api.setConfig("payCap", true);
                if (process.env.CSVM_PAY_REPLACE || process.env.CSVM_PAY_REPLACE_FILE) {
                    try {
                        const file = process.env.CSVM_PAY_REPLACE_FILE
                            ? path.resolve(process.cwd(), process.env.CSVM_PAY_REPLACE_FILE)
                            : path.resolve(__dirname, "..", "logs", "diag", "det-B.json");
                        const B = JSON.parse(fs.readFileSync(file, "utf8"));
                        api.setConfig("payReplace", B);
                    } catch (e) { console.error("[PAY-REPLACE] 读取失败:", e && e.message); }
                }
                vm.run(new VMScript(text, label));
                // Chrome 在每个脚本任务结束后立刻清空微任务；Node 默认要等整段同步代码跑完。
                // 不手动 flush 的话，getBattery().then(...) 这类回调会排到 runTimers 之后。
                try { if (typeof process._tickCallback === "function") process._tickCallback(); } catch (e) {}
                // Chrome 在两个 <script> 任务之间还会执行到期的 0ms 定时器
                // （真机的 cf(311) 就排在 inline script[2] 之前）。
                try { api.runTimers(200, 0); } catch (e) {}
                try { if (typeof process._tickCallback === "function") process._tickCallback(); } catch (e) {}
            } catch (e) {
                // 浏览器里单个脚本抛错不会阻止后续脚本，这里保持一致
                console.error(`页面脚本 ${label} 报错:`, e);
            }
        }

        // 排空页面脚本安排的 setTimeout(0) 任务：瑞数会用它们分步删除 enable_、重写 P
        try {
            let ran = api.runTimers(300, 100);
            const dcl = api.fireEvent("DOMContentLoaded");
            ran += api.runTimers(300, 100);
            const load = api.fireEvent("load");
            ran += api.runTimers(500, 2000);
            console.log(`[EVENTS] DCL=${dcl} load=${load}; timers=${ran}`);
        } catch (e) {
            console.error("[EVENTS] 失败:", e);
        }
    } else {
        // 目标代码在全局作用域执行，顶层 var 照旧成为 window 属性，间接 eval 才看得到。
        const target_code = fs.readFileSync(`${__dirname}/code.js`, "utf8");
        try {
            if (process.env.CSVM_REFLECT_TRACE === "1") api.setConfig("reflectTrace", true);
            if (process.env.CSVM_RAND_TRACE === "1") api.setConfig("randomTrace", true);
            vm.run(new VMScript(target_code, "调试中"));
        } catch (e) {
            console.error("目标代码报错:", e);
        }
    }
} finally {
    api.showlog();
    debugger;
}

if (process.env.CSVM_POST_DUMP === "1") {
    try {
        const s = api.postSnapshot();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "framework-post.json"), s);
        console.log("[POST]", s);
    } catch (e) {
        console.error("[POST] 失败:", e);
    }
}

if (process.env.CSVM_OP269 === "1") {
    try {
        const s = api.getOp269();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "fw-op269.json"), s);
        console.log("[OP269]", s.slice(0, 1500));
    } catch (e) {
        console.error("[OP269] 失败:", e);
    }
}

if (process.env.CSVM_VM_TRACE === "1") {
    try {
        const t = api.getVmTrace();
        const patch = api.getVmPatch();
        const src = api.getVmSrc();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        if (t) fs.writeFileSync(path.join(dir, "fw-vmtrace.json"), t);
        try {
            const full = api.getVmTraceFull();
            if (full) fs.writeFileSync(path.join(dir, "fw-vmtrace-full.json"), full);
        } catch (e) {}
        if (src) fs.writeFileSync(path.join(dir, "fw-eval.js"), src);
        console.log("[VMTRACE] patch=" + patch + " items=" + (t ? JSON.parse(t).trace.length : 0) + " src=" + (src ? src.length : 0));
    } catch (e) {
        console.error("[VMTRACE] 失败:", e);
    }
}
if (process.env.CSVM_GR660 === "1" || process.env.CSVM_VMWATCH === "1") {
    try {
        const s = api.getVmWatch();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "fw-vmwatch.json"), s);
        const arr = JSON.parse(s);
        const tags = {};
        for (const r of arr) tags[r.tag] = (tags[r.tag] || 0) + 1;
        console.log("[VMWATCH]", JSON.stringify(tags), "total=" + arr.length);
        for (const r of arr) {
            if (r.tag === 'op660' || r.tag === 'op295' || r.tag === 'op302' || r.tag === 'ap' || r.tag === 'fill-pre' || r.tag === 'fill') {
                console.log("[VMW " + r.tag + "] " + JSON.stringify(r));
            }
        }
        for (const r of arr) {
            if (r.tag === 'ijw') {
                const { snap, ...rest } = r;
                console.log("[IJW] " + JSON.stringify(rest) + (snap ? "  SNAP=" + snap : ""));
            }
        }
    } catch (e) {
        console.error("[VMWATCH] 失败:", e);
    }
}
if (process.env.CSVM_DUMP_TS === "1") {
    try {
        const s = api.dumpTs();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "framework-ts.json"), s);
        console.log("[TS]", s.slice(0, 1500));
    } catch (e) {
        console.error("[TS] 失败:", e);
    }
}

if (process.env.CSVM_DDA) console.log("[DDA] transform stats:", JSON.stringify(__ddaStats));
if (process.env.CSVM_TOSTR_LOG === "1") {
    try {
        const s = vm.run(new VMScript("globalThis.__tostrDump ? globalThis.__tostrDump() : '[]'", "诊断-tostrdump"));
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "fw-tostr.json"), s);
        console.log("[TOSTR] count=" + JSON.parse(s).length);
    } catch (e) { console.error("[TOSTR] 失败:", e); }
}
if (process.env.CSVM_AD_LENS === "1") {
    try {
        vm.run(new VMScript("console.log('[ADLENS] '+JSON.stringify({n:(globalThis.__adLens||[]).length,total:globalThis.__adLensN||0,lens:(globalThis.__adLens||[]).slice(0,500)}))", "诊断-adlens"));
    } catch (e) { console.error("[ADLENS] 失败:", e); }
}
if (process.env.CSVM_REFLECT_TRACE === "1") {
    try {
        const arr = JSON.parse(api.getReflectLog());
        const s = JSON.stringify(arr);
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        const backend = "own";
        const file = path.join(dir, `reflect-${backend}.json`);
        fs.writeFileSync(file, s);
        console.log("[RT] backend=" + backend + " records=" + arr.length);
    } catch (e) { console.error("[RT] 失败:", e && e.message); }
}

if (process.env.CSVM_RAND_TRACE === "1") {
    try {
        const arr = JSON.parse(api.getRandomLog());
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        const backend = "own";
        fs.writeFileSync(path.join(dir, `random-${backend}.json`), JSON.stringify(arr));
        console.log("[RAND] backend=" + backend + " records=" + arr.length);
    } catch (e) { console.error("[RAND] 失败:", e && e.message); }
}

if (process.env.CSVM_DSQ_DEBUG === "1") {
    try {
        const s = vm.run(new VMScript(`(function(){
            var o = {};
            function d(pr, k){ try{var x=Object.getOwnPropertyDescriptor(pr,k);if(!x)return 'none';return [typeof x.value, x.writable, x.enumerable, x.configurable, (typeof x.value==='function')?x.value.length:'-', (typeof x.value==='function')?x.value.name:'-'].join(',');}catch(e){return 'ERR';} }
            try {
                var dsq = navigator.webkitPersistentStorage;
                if (!dsq) return JSON.stringify({no:true});
                var pr = Object.getPrototypeOf(dsq);
                o.tag = Object.prototype.toString.call(dsq);
                o.protoTag = Object.prototype.toString.call(pr);
                o.keys = Object.keys(dsq).join(',');
                o.own = Object.getOwnPropertyNames(dsq).join(',');
                o.protoNames = Object.getOwnPropertyNames(pr).join(',');
                o.sameTT = (dsq === navigator.webkitTemporaryStorage);
                o.qDesc = d(pr, 'queryUsageAndQuota');
                o.rDesc = d(pr, 'requestQuota');
                o.qProto = (function(){ try { return Object.prototype.hasOwnProperty.call(pr.queryUsageAndQuota,'prototype'); } catch(e){ return 'ERR'; } })();
                o.qStr = (function(){ try { return Function.prototype.toString.call(pr.queryUsageAndQuota).slice(0,60); } catch(e){ return 'ERR'; } })();
                o.protoParentIsObject = (Object.getPrototypeOf(pr) === Object.prototype);
                o.ctorIsObject = (pr.constructor === Object);
                o.dsqCtor = String(dsq.constructor && dsq.constructor.name);
                o.instProtoIsPr = (Object.getPrototypeOf(dsq) === pr);
                var tagD = Object.getOwnPropertyDescriptor(pr, Symbol.toStringTag);
                o.tagDesc = tagD ? [String(tagD.value), tagD.writable, tagD.enumerable, tagD.configurable].join(',') : 'none';
                o.navGetterTag = (function(){ try { var g = Object.getOwnPropertyDescriptor(Navigator.prototype,'webkitPersistentStorage').get; return Object.prototype.toString.call(g); } catch(e){ return 'ERR'; } })();
            } catch(e) { o.err = String(e && e.message); }
            return JSON.stringify(o);
        })()`, "诊断-dsq"));
        console.log("[DSQ-DBG] " + s);
    } catch (e) { console.error("[DSQ-DBG] 失败:", e && e.message); }
}

if (process.env.CSVM_BRAND_DEBUG === "1") {
    // 原生 getter/方法的 brand check：拿 {} 当 receiver 应抛 TypeError
    try {
        const s = vm.run(new VMScript(`(function(){
            function t(proto, key, kind){
                try {
                    var d = Object.getOwnPropertyDescriptor(proto, key);
                    if (!d) return "NODESC";
                    var f = kind === "set" ? d.set : d.get;
                    if (typeof f !== "function") return "NOFN";
                    var r;
                    try { r = Reflect.apply(f, {}, kind === "set" ? ["x"] : []); }
                    catch (e) { return "THROW:" + e.name; }
                    return "NO-THROW:" + String(r).slice(0, 40);
                } catch (e) { return "ERR:" + e.name + ":" + e.message; }
            }
            function m(proto, key, args){
                try {
                    var f = proto[key];
                    if (typeof f !== "function") return "NOFN";
                    try { return "NO-THROW:" + String(f.apply({}, args || [])).slice(0, 40); }
                    catch (e) { return "THROW:" + e.name; }
                } catch (e) { return "ERR:" + e.name; }
            }
            var out = {};
            // Navigator.prototype 上每个 accessor 的 brand check
            var navBrand = {};
            try {
                Object.getOwnPropertyNames(Navigator.prototype).forEach(function (k) {
                    var d = Object.getOwnPropertyDescriptor(Navigator.prototype, k);
                    if (d && d.get && d.get !== t) navBrand[k] = t(Navigator.prototype, k, "get");
                });
            } catch (e) { navBrand.__err = String(e && e.message); }
            out.navBrandAll = navBrand;
            out.navOwnKeys = (function(){ try { return Object.getOwnPropertyNames(navigator).join(","); } catch(e){ return "ERR"; } })();
            out.dsqQ = (function(){
                try {
                    var dsq = navigator.webkitPersistentStorage;
                    if (!dsq) return "NOOBJ";
                    var pr = Object.getPrototypeOf(dsq);
                    var f = pr.queryUsageAndQuota;
                    if (typeof f !== "function") return "NOFN";
                    try { f.call({}, function(){}); return "NO-THROW"; }
                    catch (e) { return "THROW:" + e.name; }
                } catch (e) { return "ERR:" + e.name; }
            })();
            out.dsqR = (function(){
                try {
                    var dsq = navigator.webkitPersistentStorage;
                    if (!dsq) return "NOOBJ";
                    var pr = Object.getPrototypeOf(dsq);
                    var f = pr.requestQuota;
                    try { f.call({}, 1, function(){}); return "NO-THROW"; }
                    catch (e) { return "THROW:" + e.name; }
                } catch (e) { return "ERR:" + e.name; }
            })();
            out.navUA = t(Navigator.prototype, "userAgent", "get");
            out.navPlatform = t(Navigator.prototype, "platform", "get");
            out.navLang = t(Navigator.prototype, "language", "get");
            out.navWebdriver = t(Navigator.prototype, "webdriver", "get");
            out.docTitle = t(Document.prototype, "title", "get");
            out.docCookie = t(Document.prototype, "cookie", "get");
            out.elemId = t(Element.prototype, "id", "get");
            out.nodeType = t(Node.prototype, "nodeType", "get");
            out.inputValue = t(HTMLInputElement.prototype, "value", "get");
            out.formAction = t(HTMLFormElement.prototype, "action", "get");
            out.histLen = t(History.prototype, "length", "get");
            out.scrWidth = t(Screen.prototype, "width", "get");
            out.locHref = t(Location.prototype, "href", "get");
            out.storageGet = m(Storage.prototype, "getItem", ["a"]);
            out.elemGetAttr = m(Element.prototype, "getAttribute", ["a"]);
            out.nodeAppend = m(Node.prototype, "appendChild", [{}]);
            out.etAdd = m(EventTarget.prototype, "addEventListener", ["x", function(){}]);
            return JSON.stringify(out);
        })()`, "诊断-brand"));
        console.log("[BRAND] " + s);
    } catch (e) { console.error("[BRAND] 失败:", e && e.message); }
}

if (process.env.CSVM_NAMED_DEBUG === "1") {
    // Window 命名属性访问 + 对象身份自检（挑战的 form 自检就是这套）
    try {
        const s = vm.run(new VMScript(`(function(){
            function r(fn){ try { var v=fn(); return v===undefined?"u":(v===null?"null":String(v)); } catch(e){ return "ERR:"+(e&&e.message); } }
            var out={};
            var f=document.createElement('form'); f.id='__Zm9ybS5pZAo__';
            var host=document.body||document.documentElement;
            try{host.appendChild(f);out.appended=true;}catch(e){out.appended='ERR';}
            out.sameObj = (document.getElementById('__Zm9ybS5pZAo__')===f);
            out.winSame = (window['__Zm9ybS5pZAo__']===f);
            out.allSame = r(function(){ return document.all['__Zm9ybS5pZAo__']===f; });
            out.winTag = r(function(){ return window['__Zm9ybS5pZAo__']&&window['__Zm9ybS5pZAo__'].tagName; });
            out.idByGet = r(function(){ return document.getElementById('__Zm9ybS5pZAo__')&&document.getElementById('__Zm9ybS5pZAo__').tagName; });
            out.winIn = r(function(){ return ('__Zm9ybS5pZAo__' in window); });
            out.allLen = r(function(){ return document.all.length; });
            try{host.removeChild(f);}catch(e){}
            // 挑战的 DOM clobbering 自检：form.action / textContent / id 不能被同名子元素覆盖
            var g = document.createElement('form');
            g.id = '__Zm9ybS5pZAo__';
            g.action = 'https://ucenter.miit.gov.cn/login.jsp';
            var i1 = document.createElement('input'); i1.id='username'; i1.name='action'; i1.type='text';
            var i2 = document.createElement('input'); i2.id='password'; i2.name='textContent'; i2.type='text';
            var i3 = document.createElement('input'); i3.id='innerText'; i3.name='id'; i3.type='submit';
            g.appendChild(i1); g.appendChild(i2); g.appendChild(i3);
            try { host.appendChild(g); } catch(e) {}
            out.formAction = r(function(){ return String(g.action); });
            out.formActionIsInput = r(function(){ return g.action === i1; });
            out.formText = r(function(){ return String(g.textContent); });
            out.formTextIsInput = r(function(){ return g.textContent === i2; });
            out.formId = r(function(){ return String(g.id); });
            out.formIdIsInput = r(function(){ return g.id === i3; });
            out.formAttrAction = r(function(){ return String(g.getAttribute('action')); });
            out.formMethod = r(function(){ return String(g.method); });
            out.formElsLen = r(function(){ return g.elements.length; });
            out.formElAction = r(function(){ return String(g.elements['action'] && g.elements['action'].nodeName); });
            try{host.removeChild(g);}catch(e){}
            return JSON.stringify(out);
        })()`, "诊断-named"));
        console.log("[NAMED] " + s);
    } catch (e) { console.error("[NAMED] 失败:", e && e.message); }
}

if (process.env.CSVM_RING_DUMP === "1") {
    try {
        const s = api.getAdRing();
        const dir = path.resolve(__dirname, "..", "logs", "diag");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "fw-adring.json"), s);
        let n = 0; try { n = JSON.parse(s).length; } catch (e) {}
        try { fs.writeFileSync(path.join(dir, "fw-adring-hash.json"), api.getAdIdHash()); } catch (e) {}
        console.log("[ADRING] records=" + n);
    } catch (e) { console.error("[ADRING] 失败:", e && e.message); }
}

if (process.env.CSVM_TASK_TRACE === "1") {
    try { console.log("[TASK9] " + api.getTask9Info()); } catch (e) { console.error("[TASK9] 失败:", e && e.message); }
}

if (process.env.CSVM_ENV_DUMP === "1") {
    try {
        const code = `(function(){
            function safe(fn, d){ try { return fn(); } catch (e) { return "ERR:" + (e && e.message); } }
            function S(v){ return v === undefined ? "undefined" : (v === null ? "null" : String(v)); }
            var n = (typeof navigator !== "undefined") ? navigator : {};
            var s = (typeof screen !== "undefined") ? screen : {};
            var d = (typeof document !== "undefined") ? document : {};
            var l = (typeof location !== "undefined") ? location : {};
            var o = {
                "nav.userAgent": S(safe(function(){return n.userAgent;})),
                "nav.appVersion": S(safe(function(){return n.appVersion;})),
                "nav.appName": S(safe(function(){return n.appName;})),
                "nav.platform": S(safe(function(){return n.platform;})),
                "nav.vendor": S(safe(function(){return n.vendor;})),
                "nav.product": S(safe(function(){return n.product;})),
                "nav.productSub": S(safe(function(){return n.productSub;})),
                "nav.language": S(safe(function(){return n.language;})),
                "nav.languages": S(safe(function(){return JSON.stringify(n.languages);})),
                "nav.hardwareConcurrency": S(safe(function(){return n.hardwareConcurrency;})),
                "nav.deviceMemory": S(safe(function(){return n.deviceMemory;})),
                "nav.maxTouchPoints": S(safe(function(){return n.maxTouchPoints;})),
                "nav.cookieEnabled": S(safe(function(){return n.cookieEnabled;})),
                "nav.doNotTrack": S(safe(function(){return n.doNotTrack;})),
                "nav.onLine": S(safe(function(){return n.onLine;})),
                "nav.plugins.length": S(safe(function(){return n.plugins && n.plugins.length;})),
                "nav.mimeTypes.length": S(safe(function(){return n.mimeTypes && n.mimeTypes.length;})),
                "nav.connection.rtt": S(safe(function(){return n.connection && n.connection.rtt;})),
                "nav.connection.effectiveType": S(safe(function(){return n.connection && n.connection.effectiveType;})),
                "nav.uad.platform": S(safe(function(){return n.userAgentData && n.userAgentData.platform;})),
                "nav.uad.brands": S(safe(function(){return JSON.stringify(n.userAgentData && n.userAgentData.brands);})),
                "scr.width": S(safe(function(){return s.width;})),
                "scr.height": S(safe(function(){return s.height;})),
                "scr.availWidth": S(safe(function(){return s.availWidth;})),
                "scr.availHeight": S(safe(function(){return s.availHeight;})),
                "scr.colorDepth": S(safe(function(){return s.colorDepth;})),
                "scr.pixelDepth": S(safe(function(){return s.pixelDepth;})),
                "win.innerWidth": S(safe(function(){return innerWidth;})),
                "win.innerHeight": S(safe(function(){return innerHeight;})),
                "win.outerWidth": S(safe(function(){return outerWidth;})),
                "win.outerHeight": S(safe(function(){return outerHeight;})),
                "win.devicePixelRatio": S(safe(function(){return devicePixelRatio;})),
                "win.screenX": S(safe(function(){return screenX;})),
                "win.screenY": S(safe(function(){return screenY;})),
                "doc.characterSet": S(safe(function(){return d.characterSet;})),
                "doc.charset": S(safe(function(){return d.charset;})),
                "doc.contentType": S(safe(function(){return d.contentType;})),
                "doc.compatMode": S(safe(function(){return d.compatMode;})),
                "doc.readyState": S(safe(function(){return d.readyState;})),
                "doc.domain": S(safe(function(){return d.domain;})),
                "doc.referrer": S(safe(function(){return d.referrer;})),
                "doc.title": S(safe(function(){return d.title;})),
                "doc.URL": S(safe(function(){return d.URL;})),
                "doc.hidden": S(safe(function(){return d.hidden;})),
                "doc.visibilityState": S(safe(function(){return d.visibilityState;})),
                "doc.all.length": S(safe(function(){return d.all && d.all.length;})),
                "loc.href": S(safe(function(){return l.href;})),
                "loc.protocol": S(safe(function(){return l.protocol;})),
                "loc.host": S(safe(function(){return l.host;})),
                "tzOffset": S(safe(function(){return new Date(1794656000000).getTimezoneOffset();})),
                "intl": S(safe(function(){return Intl.DateTimeFormat().resolvedOptions().timeZone;})),
                "winKeys": S(safe(function(){var k=0;for(var x in window)k++;return k;})),
                "docKeys": S(safe(function(){var k=0;for(var x in document)k++;return k;})),
                "perf.now": S(safe(function(){return performance.now();})),
                "perf.timeOrigin": S(safe(function(){return performance.timeOrigin;})),
                "Date.now": S(safe(function(){return Date.now();}))
            };
            if (${process.env.CSVM_FORM_PROBE === "1"}) {
                o["formProbe"] = safe(function () {
                    var f = document.createElement("form");
                    var r = {};
                    r.ctor = f && f.constructor && f.constructor.name;
                    r.elementsLen = f && f.elements ? f.elements.length : "NO";
                    r.length = f ? f.length : "NO";
                    r.tagName = f && f.tagName;
                    r.nodeName = f && f.nodeName;
                    r.action = f && f.action;
                    r.idBefore = f && f.id;
                    f.id = "__Zm9ybS5pZAo__";
                    r.idAfter = f && f.id;
                    r.getAttr = f && f.getAttribute ? f.getAttribute("id") : "NO";
                    var host = document.body || document.documentElement;
                    try { host.appendChild(f); r.appended = true; } catch (e) { r.appended = "ERR:" + e.message; }
                    r.byId = (function(){ var x = document.getElementById("__Zm9ybS5pZAo__"); return x ? (x.tagName || "?") : null; })();
                    r.allName = (function(){ try { var x = document.all && document.all["__Zm9ybS5pZAo__"]; return x ? (x.tagName || "?") : null; } catch (e) { return "ERR"; } })();
                    r.allCall = (function(){ try { var x = document.all("__Zm9ybS5pZAo__"); return x ? (x.tagName || "?") : null; } catch (e) { return "ERR"; } })();
                    r.allLen = (function(){ try { return document.all.length; } catch (e) { return "ERR"; } })();
                    r.bodyChildren = document.body ? document.body.childNodes.length : "NO";
                    r.elementsAfter = (function(){ try { return f.elements.length; } catch (e) { return "ERR"; } })();
                    r.innerText = (function(){ try { return String(f.innerText); } catch (e) { return "ERR"; } })();
                    try { host.removeChild(f); } catch (e) {}
                    return JSON.stringify(r);
                });
            }
            if (${process.env.CSVM_PROTO_DUMP === "1"}) {
                o["domBehave4"] = safe(function () {
                    var out = {};
                    function sv(fn) { try { var v = fn(); return v === undefined ? "u" : (v === null ? "null" : String(v)); } catch (e) { return "ERR:" + (e && e.name) + ":" + (e && e.message); } }
                    // XHR 状态/事件
                    out.xhrState = sv(function () {
                        var x = new XMLHttpRequest(); var log = [];
                        x.addEventListener("readystatechange", function () { log.push(x.readyState); });
                        x.open("GET", "/x"); x.send();
                        return log.join(",") + "/" + x.readyState + "/" + x.status;
                    });
                    // MutationObserver 记录细节
                    out.moDetail = sv(function () {
                        var recs = [];
                        var mo = new MutationObserver(function (r) { for (var i = 0; i < r.length; i++) { var x = r[i]; recs.push(x.type + ":" + (x.target && x.target.nodeName) + ":" + (x.attributeName || "-") + ":" + (x.addedNodes ? x.addedNodes.length : "-")); } });
                        var host = document.createElement("div");
                        mo.observe(host, { childList: true, attributes: true, characterData: true, subtree: true });
                        host.appendChild(document.createElement("i"));
                        host.setAttribute("q", "1");
                        var tn = document.createTextNode("a");
                        host.appendChild(tn);
                        tn.data = "b";
                        mo.takeRecords();
                        mo.disconnect();
                        return recs.join("|");
                    });
                    // history
                    out.history = sv(function () {
                        var before = history.length;
                        history.pushState({ a: 1 }, "", "/p1");
                        var s1 = JSON.stringify(history.state);
                        history.replaceState({ b: 2 }, "", "/p2");
                        var s2 = JSON.stringify(history.state);
                        var after = history.length;
                        return before + "/" + after + "/" + s1 + "/" + s2 + "/" + location.pathname;
                    });
                    // 选择器进阶
                    var host = document.createElement("div");
                    sv(function () { host.innerHTML = "<ul><li>1</li><li>2</li><li>3</li></ul><p>p</p>"; });
                    out.selNth = sv(function () { return host.querySelector("li:nth-child(2)") ? host.querySelector("li:nth-child(2)").textContent : "null"; });
                    out.selNot = sv(function () { return host.querySelectorAll("li:not(:first-child)").length; });
                    out.selDesc = sv(function () { return host.querySelectorAll("ul > li").length; });
                    out.selComma = sv(function () { return host.querySelectorAll("li,p").length; });
                    // 属性边界
                    var e = document.createElement("div");
                    out.attrCase = sv(function () { e.setAttribute("DATA-X", "1"); return e.getAttribute("data-x") + "/" + e.getAttribute("DATA-X"); });
                    out.attrBool = sv(function () { var i = document.createElement("input"); i.setAttribute("disabled", ""); return i.disabled + "/" + i.getAttribute("disabled"); });
                    out.attrNames = sv(function () { e.setAttribute("a", "1"); e.setAttribute("b", "2"); return typeof e.getAttributeNames === "function" ? e.getAttributeNames().sort().join(",") : "NO"; });
                    out.toggleAttr = sv(function () { e.setAttribute("t", "1"); e.toggleAttribute("t"); var a = e.hasAttribute("t"); e.toggleAttribute("t"); return a + "/" + e.hasAttribute("t"); });
                    // 计算样式继承
                    out.computedInherit = sv(function () {
                        var p = document.createElement("div"); p.style.color = "blue";
                        var c = document.createElement("span"); p.appendChild(c);
                        var cs = getComputedStyle(c);
                        return cs.color + "/" + cs.getPropertyValue("color");
                    });
                    // void 元素 / innerHTML
                    out.voidEl = sv(function () { var d = document.createElement("div"); d.innerHTML = "<br><img src='x.png'><input>"; return d.childNodes.length + "/" + d.children.length + "/" + d.innerHTML; });
                    out.scriptText = sv(function () { var d = document.createElement("div"); d.innerHTML = "<script>var a=1<2;</script>"; return d.children.length + "/" + (d.children[0] ? d.children[0].textContent : "-"); });
                    // document 集合
                    out.docColl = sv(function () { return [document.forms.length, document.images.length, document.links.length, document.scripts.length, document.anchors.length, document.styleSheets.length].join("/"); });
                    out.scriptDbg = sv(function () {
                        var q = document.querySelectorAll ? document.querySelectorAll("script").length : "NOQ";
                        var t = document.getElementsByTagName ? document.getElementsByTagName("script").length : "NOT";
                        var c = document.currentScript ? (document.currentScript.tagName || "?") : "null";
                        var head = document.head ? document.head.childNodes.length : -1;
                        var html = document.documentElement ? document.documentElement.childNodes.length : -1;
                        return q + "/" + t + "/" + c + "/" + head + "/" + html + "/" + document.all.length;
                    });
                    // insertAdjacent*
                    out.insertAdjacent = sv(function () {
                        var d = document.createElement("div"); d.innerHTML = "<b>x</b>";
                        if (!d.insertAdjacentHTML) return "NO";
                        d.insertAdjacentHTML("beforeend", "<i>y</i>");
                        d.insertAdjacentHTML("afterbegin", "<u>z</u>");
                        return d.innerHTML;
                    });
                    out.outerHTMLSet = sv(function () { var d = document.createElement("div"); var c = document.createElement("b"); d.appendChild(c); if (!("outerHTML" in c)) return "NO"; c.outerHTML = "<i>q</i>"; return d.innerHTML; });
                    // createElementNS / 命名空间
                    out.ns = sv(function () { var el = document.createElementNS("http://www.w3.org/1999/xhtml", "div"); return (el ? el.namespaceURI + "/" + el.localName : "null"); });
                    // isEqualNode / isSameNode
                    out.equalNode = sv(function () { var a = document.createElement("p"); a.textContent = "x"; var b = document.createElement("p"); b.textContent = "x"; return a.isEqualNode ? (a.isEqualNode(b) + "/" + a.isSameNode(b)) : "NO"; });
                    // compareDocumentPosition
                    out.comparePos = sv(function () { var a = document.createElement("div"); var b = document.createElement("b"); a.appendChild(b); return typeof a.compareDocumentPosition === "function" ? a.compareDocumentPosition(b) : "NO"; });
                    // title / readyState / charset
                    out.docMeta = sv(function () { return document.title + "/" + document.readyState + "/" + document.characterSet + "/" + document.contentType + "/" + document.compatMode; });
                    // activeElement / focus
                    out.active = sv(function () { var i = document.createElement("input"); (document.body || document.documentElement).appendChild(i); i.focus(); var a = document.activeElement === i; i.blur(); return a + "/" + (document.activeElement ? document.activeElement.tagName : "null"); });
                    // CSS.supports / matchMedia
                    out.cssApi = sv(function () { return (typeof CSS !== "undefined" && CSS.supports) ? CSS.supports("display", "flex") : "NO"; });
                    out.matchMedia = sv(function () { var m = matchMedia("(min-width: 100px)"); return m ? (m.matches + "/" + m.media) : "NO"; });
                    return JSON.stringify(out);
                });
                o["domBehave5"] = safe(function () {
                    var out = {};
                    function sv(fn) { try { var v = fn(); return v === undefined ? "u" : (v === null ? "null" : String(v)); } catch (e) { return "ERR:" + (e && e.name) + ":" + (e && e.message); } }
                    // 事件对象面
                    out.evtProps = sv(function () {
                        var e = new Event("x", { bubbles: true, cancelable: true });
                        e.preventDefault();
                        return e.type + "/" + e.bubbles + "/" + e.cancelable + "/" + e.defaultPrevented + "/" + e.isTrusted + "/" + e.eventPhase;
                    });
                    out.evtCapture = sv(function () {
                        var log = [];
                        var p = document.createElement("div"), c = document.createElement("b");
                        p.appendChild(c);
                        p.addEventListener("e", function () { log.push("p-bubble"); });
                        p.addEventListener("e", function () { log.push("p-capture"); }, true);
                        c.addEventListener("e", function () { log.push("c"); });
                        c.dispatchEvent(new Event("e", { bubbles: true }));
                        return log.join(",");
                    });
                    out.evtOnce = sv(function () {
                        var n = 0, t = document.createElement("div");
                        t.addEventListener("o", function () { n++; }, { once: true });
                        t.dispatchEvent(new Event("o")); t.dispatchEvent(new Event("o"));
                        return n;
                    });
                    out.evtStop = sv(function () {
                        var log = [];
                        var p = document.createElement("div"), c = document.createElement("b");
                        p.appendChild(c);
                        p.addEventListener("s", function () { log.push("p"); });
                        c.addEventListener("s", function (ev) { log.push("c"); ev.stopPropagation(); });
                        c.dispatchEvent(new Event("s", { bubbles: true }));
                        return log.join(",");
                    });
                    out.customEvt = sv(function () {
                        var e = new CustomEvent("c", { detail: { a: 1 } });
                        return (e.detail ? e.detail.a : "NO") + "/" + e.type;
                    });
                    out.mouseEvt = sv(function () {
                        var e = new MouseEvent("m", { clientX: 5, clientY: 6, button: 1, buttons: 2 });
                        return e.clientX + "/" + e.clientY + "/" + e.button + "/" + e.buttons;
                    });
                    out.keyEvt = sv(function () {
                        var e = new KeyboardEvent("k", { key: "a", code: "KeyA", keyCode: 65 });
                        return e.key + "/" + e.code + "/" + e.keyCode;
                    });
                    out.evtTarget = sv(function () {
                        var seen = [], t = document.createElement("div");
                        t.addEventListener("t", function (ev) { seen.push(ev.target === t, ev.currentTarget === t); });
                        var r = t.dispatchEvent(new Event("t", { cancelable: true }));
                        return seen.join(",") + "/" + r;
                    });
                    // 表单校验
                    out.validity = sv(function () {
                        var i = document.createElement("input");
                        i.required = true; i.pattern = "[0-9]+"; i.value = "abc";
                        var v = i.validity;
                        return v.valueMissing + "/" + v.patternMismatch + "/" + v.valid + "/" + i.checkValidity() + "/" + (i.validationMessage ? "msg" : "empty");
                    });
                    out.validity2 = sv(function () {
                        var i = document.createElement("input");
                        i.type = "number"; i.min = "5"; i.max = "10"; i.step = "2"; i.value = "11";
                        var v = i.validity;
                        return v.rangeUnderflow + "/" + v.rangeOverflow + "/" + v.stepMismatch + "/" + v.valid;
                    });
                    out.formValidation = sv(function () {
                        var f = document.createElement("form");
                        var i = document.createElement("input"); i.required = true; i.name = "q";
                        f.appendChild(i);
                        return f.checkValidity() + "/" + f.noValidate + "/" + f.elements.length;
                    });
                    // 活集合 vs 静态 NodeList
                    var lc = document.createElement("div");
                    sv(function () { lc.innerHTML = "<i>1</i><i>2</i>"; });
                    out.collLive = sv(function () {
                        var ch = lc.children, cn = lc.childNodes;
                        var before = ch.length + "/" + cn.length;
                        lc.appendChild(document.createElement("i"));
                        return before + "/" + ch.length + "/" + cn.length;
                    });
                    out.nodeListStatic = sv(function () {
                        var nl = lc.querySelectorAll("i");
                        var before = nl.length;
                        lc.appendChild(document.createElement("i"));
                        return before + "/" + nl.length;
                    });
                    out.byClassLive = sv(function () {
                        var d = document.createElement("div"); d.innerHTML = "<i class='k'>1</i>";
                        var g = d.getElementsByClassName("k");
                        var before = g.length;
                        d.appendChild(document.createElement("i")).className = "k";
                        return before + "/" + g.length;
                    });
                    // Shadow DOM
                    out.shadow = sv(function () {
                        var h = document.createElement("div");
                        var sr = h.attachShadow ? h.attachShadow({ mode: "open" }) : null;
                        var root = h.getRootNode ? h.getRootNode() : null;
                        return (sr ? "SR:" + (sr.mode || "?") : "NO") + "/" + (h.shadowRoot ? "open" : "null") + "/" + (root === document ? "doc" : (root ? (root.nodeName || "?") : "null"));
                    });
                    // template / slot
                    out.template = sv(function () {
                        var t = document.createElement("template");
                        t.innerHTML = "<b>x</b>";
                        var c = t.content;
                        return (c ? c.childNodes.length : "NO") + "/" + (c && c.children ? c.children.length : "-") + "/" + t.childNodes.length;
                    });
                    out.slot = sv(function () {
                        var s = document.createElement("slot");
                        var n = s.assignedNodes ? s.assignedNodes() : null;
                        return n ? n.length : "NO";
                    });
                    // 样式表
                    out.styleSheet = sv(function () {
                        var st = document.createElement("style");
                        st.textContent = "a{color:red}";
                        (document.head || document.documentElement).appendChild(st);
                        var sh = st.sheet;
                        var r = sh ? (sh.cssRules ? sh.cssRules.length : "norules") : "NO";
                        try { if (st.parentNode) st.parentNode.removeChild(st); } catch (e) {}
                        return r + "/" + (typeof st.sheet);
                    });
                    // classList / dataset 边界
                    out.classListEdge = sv(function () {
                        var e = document.createElement("div");
                        e.className = "a b";
                        var r1 = e.classList.replace("a", "c");
                        e.classList.toggle("b", false);
                        e.classList.toggle("d", true);
                        return r1 + "/" + e.className;
                    });
                    out.datasetDel = sv(function () {
                        var e = document.createElement("div");
                        e.dataset.x = "1";
                        delete e.dataset.x;
                        return e.hasAttribute("data-x") + "/" + (e.dataset.x === undefined);
                    });
                    // closest 组合符
                    out.closestComb = sv(function () {
                        var d = document.createElement("div"), s = document.createElement("span");
                        d.appendChild(s);
                        var r = s.closest ? s.closest("div > span") : null;
                        return r === s ? "self" : (r ? "other" : "null");
                    });
                    // 滚动 API
                    out.scrollApi = sv(function () {
                        var e = document.createElement("div");
                        return [typeof e.scrollIntoView, typeof e.scrollTo, typeof e.scrollBy].join("/");
                    });
                    // Range / 片段
                    out.rangeApi = sv(function () {
                        var r = document.createRange ? document.createRange() : null;
                        return (r ? (typeof r.selectNodeContents) : "NO") + "/" + (document.createDocumentFragment ? "frag" : "NO");
                    });
                    // URL / URLSearchParams
                    out.urlApi = sv(function () {
                        var u = new URL("/a/b?x=1", "https://h.cn");
                        var p = new URLSearchParams(u.search);
                        return u.host + u.pathname + "/" + p.get("x");
                    });
                    // 文本节点操作
                    out.textOps = sv(function () {
                        var t = document.createTextNode("ab");
                        var d2 = document.createElement("div");
                        d2.appendChild(t);
                        var s2 = t.splitText ? t.splitText(1) : null;
                        return (s2 ? s2.data : "NO") + "/" + t.data + "/" + d2.childNodes.length;
                    });
                    return JSON.stringify(out);
                });
                o["domBehave6"] = safe(function () {
                    var out = {};
                    function sv(fn) { try { var v = fn(); return v === undefined ? "u" : (v === null ? "null" : String(v)); } catch (e) { return "ERR:" + (e && e.name) + ":" + (e && e.message); } }
                    // 构造函数身份：真机上 prototype.constructor 指回 window 上的接口对象
                    out.navCtor = sv(function () { return navigator.constructor === window.Navigator; });
                    out.navProtoCtor = sv(function () { return window.Navigator.prototype.constructor === window.Navigator; });
                    out.navInst = sv(function () { return navigator instanceof window.Navigator; });
                    out.docCtor = sv(function () { return document.constructor === window.HTMLDocument; });
                    out.docProtoCtor = sv(function () { return window.HTMLDocument.prototype.constructor === window.HTMLDocument; });
                    out.docBaseCtor = sv(function () { return window.Document.prototype.constructor === window.Document; });
                    out.elCtor = sv(function () { return document.createElement("div").constructor === window.HTMLDivElement; });
                    out.elProtoCtor = sv(function () { return window.HTMLDivElement.prototype.constructor === window.HTMLDivElement; });
                    out.htmlElProtoCtor = sv(function () { return window.HTMLElement.prototype.constructor === window.HTMLElement; });
                    out.elementProtoCtor = sv(function () { return window.Element.prototype.constructor === window.Element; });
                    out.nodeProtoCtor = sv(function () { return window.Node.prototype.constructor === window.Node; });
                    out.eventCtor = sv(function () { return new Event("x").constructor === window.Event; });
                    out.eventProtoCtor = sv(function () { return window.Event.prototype.constructor === window.Event; });
                    out.xhrCtor = sv(function () { return new XMLHttpRequest().constructor === window.XMLHttpRequest; });
                    out.screenCtor = sv(function () { return screen.constructor === window.Screen; });
                    out.historyCtor = sv(function () { return history.constructor === window.History; });
                    out.locationCtor = sv(function () { return location.constructor === window.Location; });
                    out.storageCtor = sv(function () { return localStorage.constructor === window.Storage; });
                    // instanceof 与原型链
                    out.elInstDiv = sv(function () { var e = document.createElement("div"); return e instanceof window.HTMLDivElement; });
                    out.elInstEl = sv(function () { var e = document.createElement("div"); return e instanceof window.Element; });
                    out.elInstNode = sv(function () { var e = document.createElement("div"); return e instanceof window.Node; });
                    out.elProto = sv(function () { var e = document.createElement("div"); return Object.getPrototypeOf(e) === window.HTMLDivElement.prototype; });
                    out.navProto = sv(function () { return Object.getPrototypeOf(navigator) === window.Navigator.prototype; });
                    // constructor 描述符形状（Chrome: writable:true / enumerable:false / configurable:true）
                    out.ctorDesc = sv(function () { var d = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "constructor"); return d ? (d.writable + "/" + d.enumerable + "/" + d.configurable) : "none"; });
                    // 原生函数源码（应全部命中 [native code]）
                    out.nativeToString = sv(function () {
                        var fns = [window.Navigator, window.HTMLDivElement, window.Event, window.XMLHttpRequest];
                        return fns.map(function (f) { try { return /\[native code\]/.test(Function.prototype.toString.call(f)); } catch (e) { return "ERR"; } }).join("/");
                    });
                    // 单例与 document 的引用一致性
                    out.defaultView = sv(function () { return document.defaultView === window; });
                    out.ownerDocView = sv(function () { return document.createElement("div").ownerDocument.defaultView === window; });
                    out.winSelf = sv(function () { return window.self === window; });
                    out.winTop = sv(function () { return window.top === window; });
                    out.winParent = sv(function () { return window.parent === window; });
                    out.winFrames = sv(function () { return window.frames === window; });
                    out.docNavSame = sv(function () { return window.document === document && window.navigator === navigator; });
                    // window 自身的原型链（反射 trace 显示挑战频繁 getPrototypeOf(window)）
                    out.winProtoIsWindow = sv(function () { return Object.getPrototypeOf(window) === window.Window.prototype; });
                    out.winInstWindow = sv(function () { return window instanceof window.Window; });
                    out.winProtoTag = sv(function () { return Object.prototype.toString.call(Object.getPrototypeOf(window)); });
                    out.winProtoCtor = sv(function () { var p = Object.getPrototypeOf(window); return p && p.constructor === window.Window; });
                    out.winObjectDesc = sv(function () { var d = Object.getOwnPropertyDescriptor(window, "Object"); return d ? (d.writable + "/" + d.enumerable + "/" + d.configurable) : "none"; });
                    out.docProtoTag = sv(function () { return Object.prototype.toString.call(Object.getPrototypeOf(document)); });
                    out.navProtoTag = sv(function () { return Object.prototype.toString.call(Object.getPrototypeOf(navigator)); });
                    // window 自有属性的描述符形状（挑战会成批 getOwnPropertyDescriptor(window, x)）
                    out.winDescs = sv(function () {
                        var names = Object.getOwnPropertyNames(window).sort();
                        var out = [];
                        for (var i = 0; i < names.length; i++) {
                            var d;
                            try { d = Object.getOwnPropertyDescriptor(window, names[i]); } catch (e) { out.push(names[i] + ":ERR"); continue; }
                            if (!d) { out.push(names[i] + ":none"); continue; }
                            var kind = d.get ? (d.set ? "gs" : "g") : "v";
                            out.push(names[i] + ":" + kind + (d.writable ? "1" : "") + (d.enumerable ? "e" : "-") + (d.configurable ? "c" : "-"));
                        }
                        return out.join(",");
                    });
                    out.chain = sv(function () {
                        function ch(o) {
                            var a = [];
                            for (var i = 0; i < 8 && o; i++) {
                                var tag = "";
                                try { tag = Object.prototype.toString.call(o); } catch (e) { tag = "?"; }
                                var cn = "";
                                try { cn = (o.constructor && o.constructor.name) || ""; } catch (e) {}
                                a.push(tag + "/" + cn);
                                o = Object.getPrototypeOf(o);
                            }
                            return a.join(">");
                        }
                        return JSON.stringify({
                            doc: ch(document), win: ch(window), nav: ch(navigator),
                            el: ch(document.createElement("div")), ev: ch(new Event("x")),
                        });
                    });
                    return JSON.stringify(out);
                });
                o["domBehave3"] = safe(function () {
                    var out = {};
                    function sv(fn) { try { var v = fn(); return v === undefined ? "u" : (v === null ? "null" : String(v)); } catch (e) { return "ERR:" + (e && e.name) + ":" + (e && e.message); } }
                    // document.all
                    out.allTypeof = sv(function () { return typeof document.all; });
                    out.allBool = sv(function () { return !!document.all; });
                    out.allEqNull = sv(function () { return document.all == null; });
                    out.allLen = sv(function () { return document.all.length; });
                    out.allItem0 = sv(function () { var a = document.all; return a && a.item ? (a.item(0) ? a.item(0).tagName : "null") : "NO"; });
                    out.allCall0 = sv(function () { try { var a = document.all; return a && typeof a === "function" ? (a(0) ? a(0).tagName : "null") : "NO"; } catch (e) { return "ERR"; } });
                    out.allTag = sv(function () { return Object.prototype.toString.call(document.all); });
                    // getElementById 边界
                    out.gidMissing = sv(function () { return document.getElementById("nope-xyz"); });
                    out.gidAfterRemove = sv(function () { var d = document.createElement("div"); d.id = "tmp-1"; document.body ? document.body.appendChild(d) : document.documentElement.appendChild(d); var r1 = !!document.getElementById("tmp-1"); d.parentNode.removeChild(d); var r2 = !!document.getElementById("tmp-1"); return r1 + "/" + r2; });
                    // 属性命名访问 / matches / closest
                    var e = document.createElement("div");
                    sv(function () { e.setAttribute("data-a", "1"); e.className = "cc"; });
                    out.attrsNamed = sv(function () { return e.attributes["data-a"] + "/" + (e.attributes.item(0) ? e.attributes.item(0).name : "null"); });
                    out.matches = sv(function () { return e.matches("div.cc") + "/" + e.matches("[data-a=1]"); });
                    out.closest = sv(function () { var p = document.createElement("section"); var c = document.createElement("b"); p.appendChild(c); return c.closest("section") === p; });
                    // createEvent 支持面
                    out.createEv = sv(function () {
                        var names = ["Event", "Events", "CustomEvent", "UIEvent", "MouseEvent", "KeyboardEvent", "TouchEvent", "WheelEvent"];
                        return names.map(function (n) { try { var ev = document.createEvent(n); return n + ":" + Object.prototype.toString.call(ev); } catch (e) { return n + ":THROW"; } }).join(",");
                    });
                    // cloneNode 细节
                    out.cloneDeep = sv(function () { var d = document.createElement("div"); d.setAttribute("k", "v"); d.innerHTML = "<b>t</b>"; var c = d.cloneNode(true); return c.getAttribute("k") + "/" + c.childNodes.length + "/" + (c.firstChild !== d.firstChild); });
                    out.cloneShallow = sv(function () { var d = document.createElement("div"); d.innerHTML = "<b>t</b>"; var c = d.cloneNode(false); return c.childNodes.length + "/" + c.tagName; });
                    // comment
                    out.comment = sv(function () { var c = document.createComment("hi"); return c.nodeType + "/" + c.data + "/" + c.nodeValue; });
                    // storage
                    out.storage = sv(function () { localStorage.setItem("k1", "v1"); var a = localStorage.getItem("k1"); var n = localStorage.length; localStorage.removeItem("k1"); return a + "/" + n + "/" + localStorage.getItem("k1"); });
                    // history / location
                    out.history = sv(function () { return typeof history.length + "/" + String(history.state); });
                    out.location = sv(function () { return [location.href, location.protocol, location.host, location.pathname, location.search, location.hash, location.origin].join("|"); });
                    // XPath
                    out.xpath = sv(function () { var r = document.evaluate("//html", document, null, 0, null); return r ? (r.snapshotLength + "/" + (r.singleNodeValue ? "node" : "null")) : "NO"; });
                    // DOMParser
                    out.domparser = sv(function () { var p = new DOMParser(); var doc = p.parseFromString("<div id='x'>y</div>", "text/html"); return doc ? (doc.getElementById("x") ? doc.getElementById("x").textContent : "no-el") : "NO"; });
                    // XHR
                    out.xhr = sv(function () { var x = new XMLHttpRequest(); x.open("GET", "/", false); return x.readyState + "/" + typeof x.send + "/" + typeof x.setRequestHeader; });
                    // canvas
                    out.canvas = sv(function () { var c = document.createElement("canvas"); c.width = 10; c.height = 10; var ctx = c.getContext("2d"); return (ctx ? "ctx" : "null") + "/" + c.width + "/" + c.height + "/" + (c.toDataURL ? String(c.toDataURL()).slice(0, 22) : "NO"); });
                    // MutationObserver
                    out.mo = sv(function () {
                        var recs = [];
                        var mo = new MutationObserver(function (r) { for (var i = 0; i < r.length; i++) recs.push(r[i].type); });
                        var host = document.createElement("div");
                        mo.observe(host, { childList: true, attributes: true });
                        var kid = document.createElement("i");
                        host.appendChild(kid);
                        host.setAttribute("a", "1");
                        mo.disconnect();
                        return recs.join(",");
                    });
                    return JSON.stringify(out);
                });
                o["domBehave2"] = safe(function () {
                    var out = {};
                    function sv(fn) { try { var v = fn(); return v === undefined ? "u" : (v === null ? "null" : String(v)); } catch (e) { return "ERR:" + (e && e.name); } }
                    // 活集合
                    var d = document.createElement("div");
                    sv(function () { d.innerHTML = "<p>1</p><p>2</p>"; });
                    out.liveBefore = sv(function () { return d.childNodes.length; });
                    var p3 = document.createElement("p");
                    sv(function () { d.appendChild(p3); });
                    out.liveAfter = sv(function () { return d.childNodes.length + "/" + d.getElementsByTagName("p").length; });
                    out.removeChild = sv(function () { d.removeChild(p3); return d.childNodes.length; });
                    out.insertBefore = sv(function () { var q = document.createElement("q"); d.insertBefore(q, d.firstChild); return d.firstChild.tagName; });
                    out.replaceChild = sv(function () { var r = document.createElement("r"); d.replaceChild(r, d.firstChild); return d.firstChild.tagName; });
                    // 属性 / classList / dataset
                    var e = document.createElement("div");
                    out.attr = sv(function () { e.setAttribute("data-a", "1"); e.setAttribute("title", "t"); e.removeAttribute("title"); return e.getAttribute("data-a") + "/" + e.hasAttribute("title") + "/" + e.attributes.length; });
                    out.className = sv(function () { e.className = "a b"; return e.className + "/" + e.classList.length + "/" + e.classList.contains("b"); });
                    out.classList = sv(function () { e.classList.add("c"); e.classList.toggle("a"); e.classList.remove("b"); return e.className; });
                    out.dataset = sv(function () { e.dataset.x = "9"; return e.getAttribute("data-x") + "/" + e.dataset.x; });
                    out.idReflect = sv(function () { e.id = "zz"; return e.getAttribute("id"); });
                    out.titleReflect = sv(function () { e.title = "tt"; return e.getAttribute("title"); });
                    // 文本节点
                    out.textNode = sv(function () { var t = document.createTextNode("hi"); var dd = document.createElement("div"); dd.appendChild(t); return t.nodeType + "/" + t.nodeValue + "/" + dd.textContent; });
                    out.nodeValueSet = sv(function () { var t = document.createTextNode("a"); t.nodeValue = "b"; return t.data; });
                    // 选择器
                    var s = document.createElement("div");
                    sv(function () { s.innerHTML = '<span class="x">a</span><span id="yy">b</span>'; });
                    out.selClass = sv(function () { return s.querySelector(".x") ? s.querySelector(".x").tagName : "null"; });
                    out.selAttr = sv(function () { return s.querySelector("[id=yy]") ? s.querySelector("[id=yy]").id : "null"; });
                    out.selFirst = sv(function () { return s.querySelector("span:first-child") ? s.querySelector("span:first-child").textContent : "null"; });
                    out.selDeep = sv(function () { return s.querySelectorAll("span").length; });
                    // 表单
                    var f = document.createElement("form");
                    var i1 = document.createElement("input"); i1.name = "u"; i1.value = "v";
                    var i2 = document.createElement("input"); i2.type = "checkbox"; i2.checked = true;
                    sv(function () { f.appendChild(i1); f.appendChild(i2); });
                    out.form = sv(function () { return f.elements.length + "/" + (f.elements[0] === i1) + "/" + (f.u === i1) + "/" + (i1.form === f); });
                    out.formNamed = sv(function () { return f.elements.namedItem ? (f.elements.namedItem("u") === i1) : "NO"; });
                    out.input = sv(function () { return i1.value + "/" + i1.type + "/" + i2.checked + "/" + i1.checkValidity(); });
                    var sel = document.createElement("select");
                    var o1 = document.createElement("option"); o1.value = "1"; o1.textContent = "one";
                    var o2 = document.createElement("option"); o2.value = "2"; o2.textContent = "two";
                    sv(function () { sel.appendChild(o1); sel.appendChild(o2); });
                    out.select = sv(function () { return sel.options.length + "/" + sel.selectedIndex + "/" + sel.value + "/" + sel.type; });
                    // 事件
                    out.event = sv(function () {
                        var log = [];
                        var t = document.createElement("div");
                        var h = function (ev) { log.push(ev.type + ":" + (ev.target === t) + ":" + ev.eventPhase); };
                        t.addEventListener("x", h);
                        var ev = document.createEvent("Event"); ev.initEvent("x", true, true);
                        t.dispatchEvent(ev);
                        t.removeEventListener("x", h);
                        return log.join(",") + "/" + ev.defaultPrevented + "/" + ev.bubbles;
                    });
                    out.customEvent = sv(function () { var c = new CustomEvent("y", { detail: 5 }); return c.type + "/" + c.detail; });
                    // 样式
                    var st = document.createElement("div");
                    out.style = sv(function () {
                        st.style.cssText = "color: red; font-size: 12px";
                        st.style.setProperty("margin-top", "3px", "important");
                        return st.style.cssText + "/" + st.style.getPropertyValue("font-size") + "/" + st.style.length;
                    });
                    out.computed = sv(function () { var cs = getComputedStyle(st); return cs.getPropertyValue("color") + "/" + cs.color; });
                    // innerHTML 往返
                    out.htmlRound = sv(function () { var h = document.createElement("div"); h.innerHTML = '<a href="/x" data-k="1">t&amp;t</a>'; return h.innerHTML; });
                    // fragment / import
                    out.fragment = sv(function () { var fr = document.createDocumentFragment(); var n = document.createElement("i"); fr.appendChild(n); return fr.nodeType + "/" + fr.childNodes.length; });
                    out.normalize = sv(function () { var nd = document.createElement("div"); nd.appendChild(document.createTextNode("a")); nd.appendChild(document.createTextNode("b")); nd.normalize(); return nd.childNodes.length + "/" + nd.textContent; });
                    out.root = sv(function () { return d.getRootNode() === document; });
                    out.compare = sv(function () { return typeof d.compareDocumentPosition; });
                    return JSON.stringify(out);
                });
                o["domBehave"] = safe(function () {
                    var out = {};
                    function sv(fn) { try { return fn(); } catch (e) { return "ERR:" + (e && e.message); } }
                    var d = document.createElement("div");
                    sv(function () { d.innerHTML = '<b id="bb">x</b><i>y</i>'; });
                    out.innerHTML = sv(function () { return d.innerHTML; });
                    out.outerHTML = sv(function () { return d.outerHTML; });
                    out.textContent = sv(function () { return d.textContent; });
                    out.childNodesLen = sv(function () { return d.childNodes.length; });
                    out.childrenLen = sv(function () { return d.children.length; });
                    out.child0 = sv(function () { return d.childNodes[0] && d.childNodes[0].nodeName; });
                    out.firstChild = sv(function () { return d.firstChild && d.firstChild.nodeName; });
                    out.lastChild = sv(function () { return d.lastChild && d.lastChild.nodeName; });
                    out.qs = sv(function () { var e = d.querySelector("b"); return e ? e.tagName : null; });
                    out.qsa = sv(function () { return d.querySelectorAll("b,i").length; });
                    out.gtn = sv(function () { return d.getElementsByTagName("b").length; });
                    out.gid = sv(function () { var e = d.querySelector("#bb"); return e ? e.id : null; });
                    out.contains = sv(function () { return d.contains(d.firstChild); });
                    out.clone = sv(function () { var c = d.cloneNode(true); return (c ? c.childNodes.length : "NO") + "/" + (c ? c.innerHTML : "NO"); });
                    var s = document.createElement("span");
                    sv(function () { s.style.color = "red"; });
                    out.cssText = sv(function () { return s.style.cssText; });
                    out.styleColor = sv(function () { return s.style.color; });
                    out.styleIn = sv(function () { return "MozAppearance" in s.style; });
                    out.attr = sv(function () { s.setAttribute("data-x", "1"); return s.getAttribute("data-x") + "/" + s.hasAttribute("data-x") + "/" + s.attributes.length; });
                    out.nodeType = sv(function () { return d.nodeType + "/" + (d.firstChild ? d.firstChild.nodeType : "-"); });
                    out.parent = sv(function () { return d.firstChild && d.firstChild.parentNode === d; });
                    out.ownerDoc = sv(function () { return d.ownerDocument === document; });
                    out.isConnected = sv(function () { return d.isConnected; });
                    out.tagCase = sv(function () { return document.createElement("DIV").tagName; });
                    out.textSet = sv(function () { var t = document.createElement("p"); t.textContent = "a<b"; return t.innerHTML + "|" + t.textContent; });
                    return JSON.stringify(out);
                });
                o["protoKeys"] = safe(function () {
                    function keys(name) {
                        try { var C = globalThis[name]; if (typeof C !== "function") return name + ":NO"; return name + ":" + Object.getOwnPropertyNames(C.prototype).sort().join(","); } catch (e) { return name + ":ERR"; }
                    }
                    return ["Document", "Element", "HTMLElement", "Node", "HTMLFormElement", "HTMLInputElement", "HTMLSelectElement", "EventTarget"].map(keys).join(" || ");
                });
                o["ctrlProbe2"] = safe(function () {
                    var tags = ["textarea", "option", "fieldset", "label", "output", "datalist", "template", "slot", "canvas", "img", "a", "script", "meta", "link", "style", "table", "tr", "td"];
                    var r = {};
                    tags.forEach(function (t) {
                        try {
                            var el = document.createElement(t);
                            r[t] = (el && el.constructor && el.constructor.name) + "|" + (el ? (typeof el.textContent + "/" + typeof el.innerHTML) : "NO");
                        } catch (e) { r[t] = "ERR"; }
                    });
                    return JSON.stringify(r);
                });
            }
            return JSON.stringify(o);
        })()`;
        const s = vm.run(new VMScript(code, "diag-envdump"));
        console.log("[ENV] " + s);
    } catch (e) { console.error("[ENV] 失败:", e && e.message); }
}
console.log("-------------------------------------------------------------🥱运行完毕🥱-------------------------------------------------------------");
})().catch(function (e) { console.error("[MAIN] 失败:", e); });
