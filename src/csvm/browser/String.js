String.prototype.charCodeAt = csvm.safefunction(
    csvm.proxy(String.prototype.charCodeAt, "charCodeAt"),
    "charCodeAt"
);
