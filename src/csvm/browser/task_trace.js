// 异步任务对象打点（仅 CSVM_TASK_TRACE=1 时加载）
//
// 报告已确认载荷由 14 个任务对象驱动（{id, delay, 回调...}）。type-9 的数据
// [8,0] / [11,100,0,0,0] 很可能就是任务 9 的回调结果。
// 这里在任务对象被 push 进数组时识别它，并给它的回调套日志，记录调用参数/返回值。
(function () {
    var seen = new WeakSet();
    var n = 0;
    function on() { return csvm.memory.config.taskTrace === true; }
    function isTask(o) {
        if (!o || typeof o !== "object") return null;
        var keys;
        try { keys = Object.keys(o); } catch (e) { return null; }
        // captured-seq 的任务对象固定是这四个字段
        var hasId = false, fnKeys = [], desc = [];
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i], v;
            try { v = o[k]; } catch (e) { continue; }
            if (k === "_$gS") hasId = true;
            if (typeof v === "number") desc.push(k + "=" + v);
            else if (typeof v === "function") { fnKeys.push(k); desc.push(k + ":fn:" + (v.name || "")); }
            else desc.push(k + ":" + typeof v);
        }
        return (hasId && fnKeys.length) ? { idKey: "_$gS", fnKeys: fnKeys, keys: keys, desc: desc } : null;
    }
    function log(s) { if (n++ < 2000) console.log(s); }
    var orig = Array.prototype.push;
    Array.prototype.push = new Proxy(orig, {
        apply: function (t, th, args) {
            try {
                if (on()) {
                    for (var i = 0; i < args.length; i++) {
                        var o = args[i];
                        if (!o || typeof o !== "object" || seen.has(o)) continue;
                        var info = isTask(o);
                        if (!info) continue;
                        seen.add(o);
                        var id = o[info.idKey];
                        log("[TASK] id=" + id + " " + info.desc.join(" ") + " keys=" + info.keys.join(","));
                        if (id === 9) {
                            csvm.memory.task9 = o;
                            // 任务刚创建时闭包状态可能还可读，立刻试调一次
                            ["_$h7", "_$bO"].forEach(function (fk) {
                                try {
                                    var f = o[fk];
                                    if (typeof f !== "function") return;
                                    var r = f();
                                    log("[TASK9-NOW] " + fk + " t=" + typeof r + " v=" + JSON.stringify(r).slice(0, 400));
                                } catch (e) {
                                    log("[TASK9-NOW] " + fk + " ERR " + (e && e.message));
                                }
                            });
                        }
                        (function (obj, idk, fks) {
                            fks.forEach(function (k) {
                                var f = obj[k];
                                if (typeof f !== "function") return;
                                try {
                                    obj[k] = new Proxy(f, {
                                        apply: function (t2, th2, a2) {
                                            var r = Reflect.apply(t2, th2, a2);
                                            try {
                                                log("[TASK-CB] id=" + obj[idk] + " fn=" + k +
                                                    " args=" + JSON.stringify(a2).slice(0, 200) +
                                                    " ret=" + JSON.stringify(r).slice(0, 400));
                                            } catch (e) {}
                                            return r;
                                        }
                                    });
                                } catch (e) {}
                            });
                        })(o, info.idKey, info.fnKeys);
                    }
                }
            } catch (e) {}
            return Reflect.apply(t, th, args);
        }
    });
})();
