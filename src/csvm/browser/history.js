var history={};
var History = function History(){
    throw new TypeError("Illegal constructor");
};csvm.safefunction(History);
Object.defineProperty(History.prototype,Symbol.toStringTag,{value:"History",configurable:true});
history.__proto__=History.prototype;
//////////////
History.prototype.back = {
    back() {
        debugger;
    }
}.back; csvm.safefunction(History.prototype.back, "back");
//////////////
history=csvm.proxy(history);
History=csvm.proxy(History);