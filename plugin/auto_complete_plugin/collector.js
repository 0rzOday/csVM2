const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
// 采集目标，字符串形式：Node.prototype / Element.prototype / document / window ...
// 原型采集建议用有头浏览器；headless 的 UA、插件等与真实环境不同
const HEADLESS = process.env.PROBE_HEADLESS === "1";

async function AutoComplete(target) {
    const probePath = path.join(__dirname, "probe.js");
    const code = fs.readFileSync(probePath, "utf8");

    if (!code.includes("__TARGET__")) {
        throw new Error(
            "probe.js 中没有找到 __TARGET__ 占位符，请把末尾的 Element.prototype 改成 __TARGET__"
        );
    }

    // 兼容 ("__TARGET__") 和 (__TARGET__) 两种写法
    const runCode = code
        .replaceAll('"__TARGET__"', target)
        .replaceAll("'__TARGET__'", target)
        .replaceAll("__TARGET__", target);

    let browser;
    try {
        browser = await chromium.launch({
            channel: "chrome",
            headless: HEADLESS,
        });

        const page = await browser.newPage();
        const value = await page.evaluate(runCode);
        const json_value=JSON.stringify(value, null, 2)
        fs.writeFileSync(`${__dirname}/AutoResult/${target}.json`,json_value,"utf8");
        return value;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports={
  AutoComplete
}
