const fs = require("node:fs");
const path = require("node:path");
const parse5=require("parse5");

const HTML_PATH = path.join(__dirname,"..","..","src","dom.html");
const OUT_PATH = path.join(__dirname,"page.json");

// parse5 节点 -> 我们的形状
//   元素     : { tag, attrs, children }
//   文本     : { tag: "#text",     text }
//   注释     : { tag: "#comment",  text }
//   doctype  : { tag: "#documentType", name, publicId, systemId }
//   文档根   : { tag: "#document", children }
// 约定的判别方式：tag 以 "#" 开头的是非元素节点，其余是真实标签名
function toNode(n){
    if (n.nodeName === "#text") {
        return n.value ? { tag: "#text", text: n.value } : null;
    }

    if (n.nodeName === "#comment") {
        return { tag: "#comment", text: n.data };
    }

    if (n.nodeName === "#documentType") {
        return {
            tag: "#documentType",
            name: n.name,
            publicId: n.publicId,
            systemId: n.systemId,
        };
    }

    // 文档根，没有 tagName
    if (!n.tagName) {
        return { tag: "#document", children: toChildren(n.childNodes) };
    }

    const attrs = {};
    for (const a of n.attrs || []) {
        attrs[a.name] = a.value;
    }

    // <template> 的子节点挂在 content 上，不在 childNodes 里
    const kids = n.tagName === "template" && n.content ? n.content.childNodes : n.childNodes;

    return {
        tag: n.tagName,
        attrs: attrs,
        children: toChildren(kids),
    };
}

function toChildren(list){
    const out = [];
    for (const item of list || []) {
        const node = toNode(item);
        if (node) out.push(node);
    }
    return out;
}

const tree = toNode(parse5.parse(fs.readFileSync(HTML_PATH,"utf8")));
fs.writeFileSync(OUT_PATH, JSON.stringify(tree, null, 2), "utf8");

// ---- 自检：数量、标签分布、关键元素 ----
let elements = 0;
let texts = 0;
let comments = 0;
let doctype = null;
let meta = null;
const byTag = Object.create(null);

(function walk(node){
    const tag = node.tag;

    if (tag[0] !== "#") {
        elements++;
        byTag[tag] = (byTag[tag] || 0) + 1;
        if (tag === "meta" && node.attrs.id === "9DhefwqGPrzGxEp9hPaoag") {
            meta = node;
        }
    } else if (tag === "#text") {
        texts++;
    } else if (tag === "#comment") {
        comments++;
    } else if (tag === "#documentType") {
        doctype = node;
    }

    for (const child of node.children || []) walk(child);
})(tree);

const top = (tree.children || []).map(n => n.tag);

console.log("元素:", elements, "| 文本:", texts, "| 注释:", comments);
console.log("doctype:", doctype ? doctype.name : "没有");
console.log("#document 子节点:", JSON.stringify(top));
console.log("标签分布:", Object.entries(byTag).sort((a,b) => b[1]-a[1]).slice(0,8));
console.log("目标 meta.content 长度:", meta ? meta.attrs.content.length : "未找到");
console.log("已写入:", OUT_PATH);
