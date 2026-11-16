// 验证原生 undetectable 对象：Node 里和 vm2 沙箱里都应满足 HTMLDDA 语义
const path = require("path");

let dda;
try {
    dda = require(path.resolve(__dirname, "build", "Release", "dda.node"));
} catch (e) {
    console.error("扩展未编译：先按 README.md 安装工具链并执行 npx node-gyp rebuild");
    console.error(e.message);
    process.exit(2);
}

function probe(label, make) {
    const o = make();
    const out = {
        typeof: typeof o,
        not: !o,
        bool: Boolean(o),
        strictUndefined: o === undefined,
        notUndefined: o !== undefined,
        string: String(o),
    };
    // 属性必须仍可用
    o.__mark = 1;
    out.prop = o.__mark;
    Object.defineProperty(o, "length", { value: 3, configurable: true });
    out.length = o.length;
    console.log(label, JSON.stringify(out));
    return out;
}

// 1) 宿主编译单元里直接调用
const direct = probe("direct ", () => dda.makeDDA());

// 2) vm2 沙箱里调用：重点看 typeof 是否仍是 "undefined"（桥不能包 Proxy）
let vm2ok = false;
try {
    const { VM } = require("vm2");
    const vm = new VM({ sandbox: { makeDDA: dda.makeDDA } });
    const res = vm.run(`
        (function () {
            var o = makeDDA();
            o.__mark = 1;
            Object.defineProperty(o, "length", { value: 3, configurable: true });
            return JSON.stringify({
                typeof: typeof o,
                not: !o,
                bool: Boolean(o),
                strictUndefined: o === undefined,
                notUndefined: o !== undefined,
                string: String(o),
                prop: o.__mark,
                length: o.length
            });
        })()
    `);
    console.log("vm2    ", res);
    const r = JSON.parse(res);
    vm2ok = r.typeof === "undefined" && r.not === true && r.strictUndefined === false && r.prop === 1 && r.length === 3;
} catch (e) {
    console.error("vm2 测试出错:", e.message);
}

const directOk =
    direct.typeof === "undefined" &&
    direct.not === true &&
    direct.strictUndefined === false &&
    direct.prop === 1 &&
    direct.length === 3;

console.log("\n结果：直接调用", directOk ? "OK" : "FAIL", "| vm2", vm2ok ? "OK" : "FAIL");
process.exit(directOk && vm2ok ? 0 : 1);
