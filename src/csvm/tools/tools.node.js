const fs=require("fs");
function GetCode(){
    var code="";
    // 每个文件后加分隔符，避免 "}" 和下一文件的 "function" 粘连成语法错误
    code += fs.readFileSync(`${__dirname}/vm_memory.js`,"utf8") + ";\r\n";
    code += fs.readFileSync(`${__dirname}/vm_print.js`,"utf8") + ";\r\n";
    code += fs.readFileSync(`${__dirname}/vm_proxy.js`,"utf8") + ";\r\n";
    code += fs.readFileSync(`${__dirname}/vm_safefunction.js`,"utf8") + ";\r\n";
    // 必须排在 safefunction 之后：修复原生函数源码要用到 csvm.safefunction
    code += fs.readFileSync(`${__dirname}/vm_native_text.js`,"utf8") + ";\r\n";
    code += fs.readFileSync(`${__dirname}/vm_ban_parent.js`,"utf8") + ";\r\n";
    return code;
};
module.exports={
    GetCode
};