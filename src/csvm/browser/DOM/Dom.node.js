const fs=require("fs");
function GetCode(){
    var code="";
    // 顺序不能乱：父接口必须先于子接口加载
    code += fs.readFileSync(`${__dirname}/Node.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/Element.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLElement.js`,"utf8") + "\r\n";

    // 各标签接口（都继承 HTMLElement，彼此无依赖）
    code += fs.readFileSync(`${__dirname}/HTMLAnchorElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLBodyElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLButtonElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLDivElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLFormElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLHeadElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLHtmlElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLImageElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLInputElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLLIElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLLinkElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLMetaElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLOptionElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLParagraphElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLScriptElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLSelectElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLSpanElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLTableElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLTableRowElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLTableSectionElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLTableCellElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLTitleElement.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLUListElement.js`,"utf8") + "\r\n";

    code += fs.readFileSync(`${__dirname}/Document.js`,"utf8") + "\r\n";
    code += fs.readFileSync(`${__dirname}/HTMLDocument.js`,"utf8") + "\r\n";
    return code;
};
module.exports={
    GetCode
};
