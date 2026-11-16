// 在 default（手写 DOM）路径上叠加「原生性」补丁（对照实验）
//   CSVM_OWN_NAV_PATCH=1  给 Navigator.prototype 的所有 getter 挂自有原生 toString
//   CSVM_OWN_WIN_PATCH=1  给 window 内建函数挂自有原生 toString / 补 Chrome 接口
(function () {
    var W = (typeof window !== "undefined") ? window : globalThis;
    var nav = W.__CSVM_OWN_NAV === true;
    var win = W.__CSVM_OWN_WIN === true;
    var mode = W.__CSVM_OWN_NAV_MODE;
    try { delete W.__CSVM_OWN_NAV; } catch (e) {}
    try { delete W.__CSVM_OWN_WIN; } catch (e) {}
    try { delete W.__CSVM_OWN_NAV_MODE; } catch (e) {}
    if (mode) { try { csvm.memory.__ownNavMode = mode; } catch (e) {} }
    if (nav && typeof csvm.applyOwnNavigatorPatch === "function") {
        try { csvm.applyOwnNavigatorPatch(W); console.log("[OWNPATCH] navigator 原生性补丁已应用"); }
        catch (e) { console.log("[OWNPATCH] navigator 失败: " + (e && e.message)); }
    }
    if (win && typeof csvm.applyOwnWindowPatch === "function") {
        try { csvm.applyOwnWindowPatch(W); console.log("[OWNPATCH] window 原生性补丁已应用"); }
        catch (e) { console.log("[OWNPATCH] window 失败: " + (e && e.message)); }
    }
})();
