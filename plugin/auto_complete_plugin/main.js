const fs = require("node:fs");
const path = require("node:path");

const { parse, HELPERS } = require("./Analysis");
const { AutoComplete } = require("./collector");

// 目标原型（生成代码里的表达式）
const TARGET = "document";

// 目标文件
const TARGET_FILE_PATH = path.join(
    __dirname,
    "..",
    "..",
    "src",
    "csvm",
    "browser",
    //"DOM",
    "document.js"
);

// 首次插入用的占位符
const PLACEHOLDER = "/*补齐占位*/";

// 之后幂等替换用的区域标记
const START = `/* #region AUTO:${TARGET} */`;
const END = `/* #endregion AUTO:${TARGET} */`;

// 与 collector.js 的输出保持一致
const JSON_FILE = path.join(__dirname, "AutoResult", `${TARGET}.json`);

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureSnapshot() {
    if (!fs.existsSync(JSON_FILE)) {
        console.log(`未找到快照 ${JSON_FILE}，开始采集...`);
        await AutoComplete(TARGET);
    }

    if (!fs.existsSync(JSON_FILE)) {
        throw new Error(`采集失败，快照仍不存在: ${JSON_FILE}`);
    }
}

async function main() {
    await ensureSnapshot();

    const records = JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
    console.log(`读取快照 ${records.length} 条`);

    const body = records.map((item) => parse(item, TARGET)).join("\r\n");
    const todoCount = (body.match(/\/\/ TODO/g) || []).length;

    const block = [
        START,
        "(function () {",
        HELPERS,
        body,
        "})();",
        END,
    ].join("\r\n");

    // 只编译，不执行；语法错误会在这里暴露
    new Function(block);

    let source = fs.readFileSync(TARGET_FILE_PATH, "utf8");
    const region = new RegExp(`${escapeRegExp(START)}[\\s\\S]*?${escapeRegExp(END)}`);

    if (region.test(source)) {
        // 已有生成区域：整块替换
        source = source.replace(region, () => block);
    } else if (source.includes(PLACEHOLDER)) {
        // 第一次：占位符替换成区域
        source = source.replace(PLACEHOLDER, () => block);
    } else {
        throw new Error(
            `目标文件中既没有区域标记，也没有占位符 ${PLACEHOLDER}: ${TARGET_FILE_PATH}`
        );
    }

    fs.writeFileSync(TARGET_FILE_PATH, source, "utf8");

    console.log(`已写入 ${TARGET_FILE_PATH}`);
    console.log(`生成 ${records.length} 条，TODO/manual ${todoCount} 条`);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
