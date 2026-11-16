// 调试器 / util.inspect 给对象生成描述时会读 symbol 和 toString，
// 这类读取不是目标的行为，记进来只会污染日志。
// 排查这类键时把 csvm.memory.config.ignoreInspect 置为 false 即可看到。
function is_inspect_read(property) {
    return typeof property === "symbol" || property === "toString";
}

// vm2 注入到全局的内部状态键，真机不存在；对 window 隐藏（vm2 内部通过真实全局对象访问，不受影响）
var __HIDDEN_KEYS = Object.create(null);
__HIDDEN_KEYS["VM2_INTERNAL_STATE_DO_NOT_USE_OR_PROGRAM_WILL_FAIL"] = true;

// 反射 trace：只记录挑战对代理对象的 get / in / 描述符 / ownKeys / 原型读取。
// 由 reflect_trace.js 创建 csvm.memory.reflectLog，开关是 csvm.memory.config.reflectTrace。
var __rtIn = false;
function __rtSum(v) {
    if (v === null) return "null";
    var t = typeof v;
    if (t === "undefined") return "undef";
    if (t === "string") return "s:" + v.slice(0, 40);
    if (t === "number" || t === "boolean") return t + ":" + v;
    if (t === "function") return "fn:" + String(v.name || "");
    try {
        var tag = Object.prototype.toString.call(v);
        var len = (v && typeof v.length === "number") ? ":len" + v.length : "";
        return tag + len;
    } catch (e) { return "obj"; }
}
function __rt(op, obj, prop, ret) {
    if (__rtIn || !csvm.memory.config.reflectTrace) return;
    var log = csvm.memory.reflectLog;
    if (!log) return;
    if (log.length >= 100000) { csvm.memory.reflectOverflow = true; return; }
    __rtIn = true;
    try {
        var t;
        if (obj === null) t = "null";
        else if (obj === undefined) t = "undefined";
        else {
            t = Object.prototype.toString.call(obj);
            try { if (obj.nodeType) t += ":" + String(obj.nodeName || obj.nodeType); } catch (e) {}
        }
        log.push([op, t, prop === undefined ? "" : String(prop), __rtSum(ret)]);
    } catch (e) {} finally { __rtIn = false; }
}

function proxy(obj, name) {
    // 如果没有开启代理功能，则直接返回原对象
    if (!csvm.memory.config.proxy) return obj;

    var wrapped = new Proxy(obj, {
        // 监听get事件
        get(object, property, receiver) {
            if (typeof property === "string" && __HIDDEN_KEYS[property]) return undefined;
            var value = Reflect.get(...arguments);
            // Window 命名属性访问（真机 [LegacyUnforgeable]/named properties）：
            // window[name] 应能命中文档中 id 或 name 匹配的元素。
            // 挑战会用「创建 form → 设 id → append → window[id]」做自检，
            // 拿不到元素就置 tamper 位（任务 7 状态字节 9）。
            // 诊断：记录 navigator 的属性读取序列（定位挑战自检读的是哪个字段）
            if (name === "navigator" && typeof property === "string" && property.charAt(0) !== "_") {
                try {
                    var __nr = csvm.memory.navReads || (csvm.memory.navReads = []);
                    __nr[__nr.length] = property;
                    if (__nr.length > 300) __nr.splice(0, 150);
                } catch (e) {}
            }
            if (name === "window" && value === undefined && typeof property === "string") {
                try {
                    var __wn = csvm.memory.windowNamedGet;
                    if (typeof __wn === "function") {
                        var __nv = __wn(property);
                        if (__nv !== undefined) value = __nv;
                    }
                } catch (e) {}
            }
            __rt("pget", object, property, value);
            // 调试器 inspect 产生的读取：值照常返回，只是不记日志
            if (csvm.memory.config.ignoreInspect && is_inspect_read(property)) return value;
            // 有没有这个属性用 Reflect.has 判断（沿原型链查，不触发 getter）。
            // 不能再用值的真假：读到 "" / 0 / false / null 都是正常命中，
            // 和"属性不存在"是两回事，之前 window.name 的 "" 就被误报成未定义。
            var found = Reflect.has(object, property);
            csvm.print.log(new csvm.print.print_infor(
                "[GET] (get)",
                object,
                property,
                value === undefined ? "未定义" : value,
                new Date().toLocaleString(),
                found ? "成功" : "失败"
            )
            );
            if (!found){
                //debugger;
            }
            return value;
        },
        // 监听set事件
        set(object, property, value, receiver) {
            // 不带 receiver 调用：避免引擎在定义属性前向代理查询描述符
            // （那会额外触发一次 getOwnPropertyDescriptor，日志里看起来像"set 了却不存在"）
            
            var success = Reflect.set(object, property, value);
            __rt("pset", object, property, value);
            csvm.print.log(new csvm.print.print_infor(
                "[SET] (set)",
                object,
                property,
                value,
                new Date().toLocaleString(),
                success ? "成功" : "失败"
            ));
            if (!success){
                //debugger;
            }
            return success;
        },
        // 监听in事件
        has(object, property) {
            if (typeof property === "string" && __HIDDEN_KEYS[property]) return false;
            var result = Reflect.has(...arguments);
            if (!result && name === "window" && typeof property === "string") {
                try {
                    var __wn2 = csvm.memory.windowNamedGet;
                    if (typeof __wn2 === "function" && __wn2(property) !== undefined) return true;
                } catch (e) {}
            }
            __rt("pin", object, property, result);
            csvm.print.log(new csvm.print.print_infor(
                "[HAS] (has)",
                object,
                property,
                result,
                new Date().toLocaleString(),
                result ? "存在" : "不存在",
            ));
            if (!result){
                //debugger;
            }
            return result;
        },
        // 监听Object.getOwnPropertyDescriptor事件
        getOwnPropertyDescriptor(object, property) {
            if (typeof property === "string" && __HIDDEN_KEYS[property]) return undefined;
            const result = Reflect.getOwnPropertyDescriptor(...arguments);
            __rt("pgopd", object, property, result);
            csvm.print.log(new csvm.print.print_infor(
                "[GETOWNPROPERTYDESCRIPTOR] (getOwnPropertyDescriptor)",
                object,
                property,
                result,
                new Date().toLocaleString(),
                result ? "存在" : "不存在",
            ));
            return result;
        },
        // 监听Reflect.ownKeys事件该方法会返回object自己的属性数组
        ownKeys(object) {
            const result = Reflect.ownKeys(...arguments).filter(function (k) {
                return !(typeof k === "string" && __HIDDEN_KEYS[k]);
            });
            __rt("pownKeys", object, "", result);
            csvm.print.log(new csvm.print.print_infor(
                "[OWNKEYS] (ownKeys)",
                object,
                csvm.memory.config.print ? result.map(k => String(k)).join(",") : "",
                "长度: " + result.length,
                new Date().toLocaleString(),
                "",
            ));
            
            return result;
        },
        // 监听读取对象原型的事件
        getPrototypeOf(object) {
            const result = Reflect.getPrototypeOf(...arguments);
            __rt("pgpo", object, "", result);
            csvm.print.log(new csvm.print.print_infor(
                "[GETPROTOTYPEOF] (getPrototypeOf)",
                object,
                "getPrototypeOf",
                result,
                new Date().toLocaleString(),
                result ? "成功" : "失败",
            ));
            return result;
        },
        // 监听 Object.defineProperty / Reflect.defineProperty
        defineProperty(object, property, descriptor) {
            const result = Reflect.defineProperty(object, property, descriptor);
            csvm.print.log(new csvm.print.print_infor(
                "[DEFINE] (defineProperty)",
                object,
                property,
                descriptor,
                new Date().toLocaleString(),
                result ? "成功" : "失败",
            ));
            return result;
        },
        // 监听 delete 操作
        deleteProperty(object, property) {
            const result = Reflect.deleteProperty(object, property);
            csvm.print.log(new csvm.print.print_infor(
                "[DELETE] (deleteProperty)",
                object,
                property,
                result,
                new Date().toLocaleString(),
                result ? "成功" : "失败",
            ));
            return result;
        },
        apply(object, thisArg, argumentsList) {
            // 参数只取短描述：字符串拼接会对对象触发 ToPrimitive，
            // 那会调目标自己的 toString，既加噪音又可能抛错
            const args = csvm.memory.config.print
                ? argumentsList.map(k => csvm.print.short_value(k, 24)).join(", ")
                : "";
            let result;
            try {
                result = Reflect.apply(object, thisArg, argumentsList);
            } catch (e) {
                // 抛错也要留痕，否则日志里看不出这次调用发生过
                let desc;
                try {
                    desc = e && e.message ? (e.name || "Error") + ": " + e.message : csvm.print.short_value(e, 40);
                } catch (_) {
                    desc = "无法读取的异常";
                }
                csvm.print.log(new csvm.print.print_infor(
                    "[APPLY] (apply)",
                    object,
                    args,
                    "抛错: " + desc,
                    new Date().toLocaleString(),
                    "失败"
                ));
                throw e;
            }
            csvm.print.log(new csvm.print.print_infor(
                "[APPLY] (apply)",
                object,
                args,
                // 成功与否看有没有抛错，不看返回值真假：
                // 返回 undefined / 0 / "" / null 都是正常返回
                "返回: " + csvm.print.short_value(result, 24),
                new Date().toLocaleString(),
                "成功"
            ));
            return result;
        }

    });

    // 原生 Function.prototype.toString 对 Proxy 函数只给 "function () { [native code] }"，
    // 名字会丢。safefunction 的文本是按对象存的，所以必须对代理再登记一次，
    // 否则每个被 proxy 过的构造函数都会变成匿名。
    if (typeof obj === "function" && typeof csvm.safefunction === "function") {
        csvm.safefunction(wrapped, name || obj.name);
    }

    return wrapped;
}

// 挂到 csvm 上，供浏览器模块以 csvm.proxy(...) 调用
csvm.proxy = proxy;
