// plugin/auto_complete_plugin/Analysis.js
//
// 只负责把“一条快照记录”解析成一段可插入框架的 JS 代码。
// JSON 遍历、目标文件、区域标记、写入由 main.js 负责。
//
// 用法：
//   const { parse, HELPERS } = require("./Analysis");
//   const body = records.map((item) => parse(item, "Node.prototype")).join("\n");
//   const code = `(function () {\n${HELPERS}\n${body}\n})();`;

"use strict";

const KINDS = ["function_", "constant_", "accessor_"];

// "Symbol(Symbol.toStringTag)" -> "Symbol.toStringTag"
const SYMBOL_EXPR = {};
for (const name of Object.getOwnPropertyNames(Symbol)) {
    if (typeof Symbol[name] === "symbol") {
        SYMBOL_EXPR[Symbol[name].toString()] = `Symbol.${name}`;
    }
}

// 生成代码共用的辅助函数，main.js 在每个生成块前放一次
const HELPERS = `    // --- 生成代码公共辅助 ---------------------------------------------------
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
    }`;

function keyExpr(name, keyType) {
    if (keyType === "symbol") {
        const expr = SYMBOL_EXPR[name];
        if (!expr) throw new Error(`无法还原 symbol: ${name}`);
        return expr;
    }
    return JSON.stringify(name);
}

// 对象字面量里的 key，一律用计算属性：
//   ["after"], [Symbol.toStringTag]
// 这样 "__proto__" 这种键也不会触发原型 setter。
function entryKeyExpr(key) {
    if (key.startsWith("Symbol(")) {
        const expr = SYMBOL_EXPR[key];
        if (!expr) throw new Error(`无法还原 symbol 键: ${key}`);
        return `[${expr}]`;
    }
    return `[${JSON.stringify(key)}]`;
}

// 把快照里的编码值还原成一段 JS 表达式
function valueExpr(v) {
    if (v === null) return "null";

    if (typeof v !== "object") {
        if (v === undefined) return "undefined";
        if (typeof v === "symbol") throw new Error(`symbol 值需要手动处理: ${v.toString()}`);
        if (typeof v === "bigint") return `BigInt(${JSON.stringify(v.toString())})`;
        return JSON.stringify(v);
    }

    if (v.type === "undefined") return "undefined";
    if (v.type === "bigint") return `BigInt(${JSON.stringify(v.value)})`;
    if (v.type === "symbol") throw new Error(`symbol 值需要手动处理: ${v.text}`);
    if (v.type === "function") return `__autoFn(${JSON.stringify(v.name)}, ${v.length})`;

    if (v.type === "object") {
        if (!v.entries) throw new Error(`对象值需要手动处理: ${v.tag}`);

        const lines = Object.entries(v.entries).map(
            ([k, vv]) => `        ${entryKeyExpr(k)}: ${valueExpr(vv)},`
        );

        if (v.proto === "null") {
            return `Object.assign(Object.create(null), {\n${lines.join("\n")}\n    })`;
        }
        return `{\n${lines.join("\n")}\n    }`;
    }

    // 旧 schema / 未知结构：按原值输出
    return JSON.stringify(v);
}

function parse(item, targetExpr = "target") {
    if (typeof item === "string") item = JSON.parse(item);

    const kind = KINDS.find((k) => k in item);
    if (!kind) throw new Error(`未知条目: ${JSON.stringify(item)}`);

    const [name, d] = Object.entries(item[kind])[0];
    const key = keyExpr(name, item.keyType);
    const label = item.keyType === "symbol" ? `${name} (symbol)` : name;

    // accessor
    if (kind === "accessor_") {
        const get = d.get ? `__autoFn(${JSON.stringify(d.get.name)}, ${d.get.length})` : "undefined";
        const set = d.set ? `__autoFn(${JSON.stringify(d.set.name)}, ${d.set.length})` : "undefined";

        return [
            `    // ${label}`,
            `    Object.defineProperty(${targetExpr}, ${key}, {`,
            `        configurable: ${d.configurable},`,
            `        enumerable: ${d.enumerable},`,
            `        get: ${get},`,
            `        set: ${set},`,
            `    });`,
        ].join("\n");
    }

    // constant / 普通 data
    if (kind === "constant_") {
        if (d.value && typeof d.value === "object" && d.value.manual === true) {
            return `    // TODO manual: ${label} (${d.value.tag})`;
        }
        if (d.value && typeof d.value === "object" && d.value.type === "symbol") {
            return `    // TODO manual: ${label} (${d.value.text})`;
        }

        return [
            `    // ${label}`,
            `    Object.defineProperty(${targetExpr}, ${key}, {`,
            `        configurable: ${d.configurable},`,
            `        enumerable: ${d.enumerable},`,
            `        writable: ${d.writable},`,
            `        value: ${valueExpr(d.value)},`,
            `    });`,
        ].join("\n");
    }

    // function_
    if (name === "constructor") {
        return `    // TODO constructor: ${targetExpr}.constructor 需要手动指向接口对象`;
    }

    return [
        `    // ${label}`,
        `    Object.defineProperty(${targetExpr}, ${key}, {`,
        `        configurable: ${d.configurable},`,
        `        enumerable: ${d.enumerable},`,
        `        writable: ${d.writable},`,
        `        value: __autoFn(${JSON.stringify(d.value.name)}, ${d.value.length}),`,
        `    });`,
    ].join("\n");
}

module.exports = {
    parse,
    keyExpr,
    valueExpr,
    HELPERS,
};
