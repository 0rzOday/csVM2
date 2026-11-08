var indexedDB = {};

var IDBFactory = function IDBFactory(){
    
};csvm.safefunction(IDBFactory);
Object.defineProperty(IDBFactory.prototype,Symbol.toStringTag,{value:"IDBFactory",configurable:true});

indexedDB.__proto__=IDBFactory.prototype;
