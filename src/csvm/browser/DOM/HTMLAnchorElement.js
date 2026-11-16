var HTMLAnchorElement = function HTMLAnchorElement(){
    throw new TypeError("Illegal constructor");
}; csvm.safefunction(HTMLAnchorElement);
Object.defineProperty(HTMLAnchorElement.prototype,Symbol.toStringTag,{value:"HTMLAnchorElement",configurable:true});
HTMLAnchorElement.prototype.__proto__=HTMLElement.prototype;

// ---------------------------------------------------------------------------
// URLUtils：挑战会 a.href = "https://www.fangdi.com.cn/" 后读
// protocol / hostname / port / pathname
// ---------------------------------------------------------------------------
function __anchorAbsolute(url) {
    var m = /^([a-z][a-z0-9+.-]*:)\/\/([^\/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(url);
    if (!m) {
        return { href: url, protocol: "", host: "", hostname: "", port: "",
                 pathname: "", search: "", hash: "", origin: "", username: "", password: "" };
    }
    var protocol = m[1].toLowerCase();
    var authority = m[2];
    var pathname = m[3] || "/";
    var search = m[4] || "";
    var hash = m[5] || "";
    var at = authority.lastIndexOf("@");
    var userinfo = at !== -1 ? authority.slice(0, at) : "";
    var hostport = at !== -1 ? authority.slice(at + 1) : authority;
    var username = "", password = "";
    var uc = userinfo.indexOf(":");
    if (uc !== -1) { username = userinfo.slice(0, uc); password = userinfo.slice(uc + 1); }
    else username = userinfo;
    var hostname = hostport, port = "";
    var hm = /^(\[[^\]]+\]|[^:]*)(?::(\d*))?$/.exec(hostport);
    if (hm) { hostname = hm[1]; port = hm[2] || ""; }
    hostname = hostname.toLowerCase();
    var host = hostname + (port ? ":" + port : "");
    var origin = protocol + "//" + host;
    return { href: origin + pathname + search + hash, protocol: protocol, host: host,
             hostname: hostname, port: port, pathname: pathname, search: search,
             hash: hash, origin: origin, username: username, password: password };
}
function __anchorBase() {
    try { return location.href; } catch (e) { return "https://www.fangdi.com.cn/"; }
}
function __anchorParse(value, base) {
    value = String(value === undefined || value === null ? "" : value);
    if (value === "") return __anchorAbsolute("");
    var b = __anchorAbsolute(base || __anchorBase());
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return __anchorAbsolute(value);
    if (value.indexOf("//") === 0) return __anchorAbsolute(b.protocol + value);
    if (value.charAt(0) === "/") return __anchorAbsolute(b.origin + value);
    if (value.charAt(0) === "?") return __anchorAbsolute(b.origin + b.pathname + value);
    if (value.charAt(0) === "#") return __anchorAbsolute(b.origin + b.pathname + b.search + value);
    return __anchorAbsolute(b.origin + b.pathname.replace(/[^/]*$/, "") + value);
}
function __anchorData(self) {
    var d = csvm.memory.Dom.get(self);
    if (!d) return {};
    if (!d.data) d.data = {};
    return d.data;
}
function __anchorHrefOf(self) {
    var raw = __anchorData(self).href;
    if (raw === undefined || raw === null || raw === "") return "";
    return __anchorParse(String(raw), __anchorBase()).href;
}
function __anchorProp(name) {
    Object.defineProperty(HTMLAnchorElement.prototype, name, {
        configurable: true,
        enumerable: true,
        get: csvm.safefunction(function () {
            var raw = __anchorData(this).href;
            var parsed = __anchorParse(raw === undefined ? "" : String(raw), __anchorBase());
            return parsed[name];
        }, "get " + name),
        set: undefined
    });
}
Object.defineProperty(HTMLAnchorElement.prototype, "href", {
    configurable: true,
    enumerable: true,
    get: csvm.safefunction(function () { return __anchorHrefOf(this); }, "get href"),
    set: csvm.safefunction(function (value) {
        __anchorData(this).href = __anchorParse(String(value), __anchorBase()).href;
    }, "set href")
});
["protocol", "host", "hostname", "port", "pathname", "search", "hash", "origin", "username", "password"].forEach(__anchorProp);
Object.defineProperty(HTMLAnchorElement.prototype, "toString", {
    configurable: true, enumerable: true, writable: true,
    value: csvm.safefunction(function () { return __anchorHrefOf(this); }, "toString")
});

HTMLAnchorElement=csvm.proxy(HTMLAnchorElement,"HTMLAnchorElement");

// 注册 a 标签：原型在注册时取一次，避免每创建一个元素都走代理记日志
csvm.registerElement("a", HTMLAnchorElement);