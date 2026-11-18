const fs=require("fs");
const dom_code=require(`${__dirname}/DOM/Dom.node.js`);

// 纯手写 DOM 后端：按固定顺序把环境模块拼成一段代码，在沙箱里执行。
function GetCode(){
    var code="";
    // 顺序不能乱：父接口必须先于子接口加载
    //code += fs.readFileSync(`${__dirname}/String.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/EventTarget.js`,"utf8") + "\r\n";
    // DOM 集合类型（NodeList / HTMLCollection / NamedNodeMap / DOMTokenList / …）
    code += fs.readFileSync(`${__dirname}/Collections.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/WindowProperties.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/window.js`,"utf8") + "\r\n"; 
    code += fs.readFileSync(`${__dirname}/Storage.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/history.js`,"utf8") + "\r\n"; 
    code += fs.readFileSync(`${__dirname}/location.js`,"utf8") + "\r\n"; 
    
    code += fs.readFileSync(`${__dirname}/screen.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/indexedDB.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/DOMParser.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/navigator.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/DeprecatedStorageQuota.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/BatteryManager.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/XMLHttpRequest.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/Request.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/MutationObserver.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/DOM/NetworkInformation.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/WebSocket.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/CanvasRenderingContext2D.js`,"utf8") + "\r\n";
    // CSSStyleDeclaration 供 Element/HTMLElement 的 style getter 使用
    code += fs.readFileSync(`${__dirname}/CSSStyleDeclaration.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/XPath.js`,"utf8") + "\r\n";

    code += dom_code.GetCode();
    // HTMLCanvasElement 继承 HTMLElement，必须放在 dom_code 之后
    code += fs.readFileSync(`${__dirname}/HTMLCanvasElement.js`,"utf8") + "\r\n";

    code += fs.readFileSync(`${__dirname}/document.js`,"utf8") + "\r\n";
    // 加载页面dom
    code += fs.readFileSync(`${__dirname}/page.js`,"utf8") + "\r\n";
    // 标准 Web API 补齐（与真机对照的缺失接口）
    code += fs.readFileSync(`${__dirname}/WebAPIs.js`,"utf8") + "\r\n";
    if (process.env.CSVM_REFLECT_TRACE === "1") code += fs.readFileSync(`${__dirname}/reflect_trace.js`,"utf8") + "\r\n";
    if (process.env.CSVM_RAND_TRACE === "1") code += fs.readFileSync(`${__dirname}/random_trace.js`,"utf8") + "\r\n";
    if (process.env.CSVM_PUSH_TRACE === "1") code += fs.readFileSync(`${__dirname}/push_trace.js`,"utf8") + "\r\n";
    if (process.env.CSVM_TASK_TRACE === "1") code += fs.readFileSync(`${__dirname}/task_trace.js`,"utf8") + "\r\n";
    if (process.env.CSVM_PAY_MUT) code += fs.readFileSync(`${__dirname}/payload_mutate.js`,"utf8") + "\r\n";
    if (process.env.CSVM_PAY_REPLACE || process.env.CSVM_PAY_REPLACE_FILE) code += fs.readFileSync(`${__dirname}/payload_replace.js`,"utf8") + "\r\n";
    if (process.env.CSVM_PAY_CAP === "1") code += fs.readFileSync(`${__dirname}/payload_capture.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/dom_trace.js`,"utf8") + "\r\n";
    return code;
};
module.exports={
    GetCode
};