const fs=require("fs");
const dom_code=require(`${__dirname}/DOM/Dom.node.js`);

function GetCode(){
    var code="";
    // 顺序不能乱：父接口必须先于子接口加载
    //code += fs.readFileSync(`${__dirname}/String.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/EventTarget.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/WindowProperties.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/window.js`,"utf8") + "\r\n"; 
    code += fs.readFileSync(`${__dirname}/Storage.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/history.js`,"utf8") + "\r\n"; 
    code += fs.readFileSync(`${__dirname}/location.js`,"utf8") + "\r\n"; 
    
    code += fs.readFileSync(`${__dirname}/screen.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/indexedDB.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/DOMParser.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/navigator.js`,"utf8") + "\r\n";

    code += dom_code.GetCode();

    code += fs.readFileSync(`${__dirname}/document.js`,"utf8") + "\r\n"; 
    // 加载页面dom
    code += fs.readFileSync(`${__dirname}/page.js`,"utf8") + "\r\n";
    return code;
};
module.exports={
    GetCode
};