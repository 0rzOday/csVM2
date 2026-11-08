const fs = require("fs");
const path = require("path");

const IN_PATH = path.join(__dirname, "page.json");
const OUT_PATH = path.join(__dirname, "..", "..", "src", "csvm", "browser", "page.js");

// 按 tag 取该节点的数据：
//   元素        -> attrs
//   文本/注释   -> { text }
//   doctype     -> { name, publicId, systemId }
function dataOf(node) {
    switch (node.tag) {
        case "#documentType":
            return { name: node.name, publicId: node.publicId, systemId: node.systemId };
        case "#text":
        case "#comment":
            return { text: node.text };
        case "#document":
            return {};
        default:
            return node.attrs || {};
    }
}

const tree = JSON.parse(fs.readFileSync(IN_PATH, "utf8"));

const lines = [];
let seq = 0;

// 变量名：n12_div / n30_text，稳定、可读、能 grep
function newVar(tag) {
    seq += 1;
    const name = tag[0] === "#" ? tag.slice(1) : tag;
    return "n" + seq + "_" + name;
}

function walk(node, parentVar) {
    // 根节点不创建：它就是框架里已有的 document
    if (node.tag === "#document") {
        for (const child of node.children || []) {
            walk(child, "document");
        }
        return;
    }

    const v = newVar(node.tag);

    lines.push(
        "var " + v + " = csvm.DomGenerator(" +
        JSON.stringify(node.tag) + ", " +
        JSON.stringify(dataOf(node)) + ", " +
        parentVar + ");"
    );

    // 先写自己，再递归子节点：父必须出现在子之前
    for (const child of node.children || []) {
        walk(child, v);
    }
}

walk(tree, "null");

const header = [
    "// 自动生成，请勿手改",
    "// 来源：src/dom.html",
    "// 生成：node plugin/analysis_dom_plugin/build_dom.js",
    "// 包一层 IIFE：2031 个 n###_* 变量留在函数作用域，不挂到 window 上被目标扫到",
    "(function () {",
    "",
].join("\r\n");

// 末尾闭合 IIFE：顶层 var 变函数局部，Reflect.ownKeys(window) 就扫不到这些节点变量了
fs.writeFileSync(OUT_PATH, header + lines.join("\r\n") + "\r\n})();\r\n", "utf8");

console.log("节点:", lines.length, "| 输出:", OUT_PATH);
