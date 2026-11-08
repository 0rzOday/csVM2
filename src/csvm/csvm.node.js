const tools_code=require(`${__dirname}/tools/tools.node.js`);
const browser_code=require(`${__dirname}/browser/browser.node.js`);
function GetCode(){
    var code="";
    code += tools_code.GetCode() + "\r\n";
    code += browser_code.GetCode() + "\r\n";
    // 框架加载完自检一次原生函数源码：
    // vm2 的 eval / Function / Proxy 会丢名字，和真机对不上
    code += "\r\ncsvm.nativeText.repairAll();\r\n";
    return code;
};
module.exports={
    GetCode
};
