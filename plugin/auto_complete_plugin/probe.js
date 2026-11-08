// 获取逻辑
((target) => {
    const value = [];
    const property_value_list = Reflect.ownKeys(target);

    // 非函数 data 值的序列化：原始值直接返回，普通对象浅展开，宿主对象只记 tag
    const valueInfo = (v) => {
        // 类型为函数获取返回描述
        if (typeof v === "function") {
            return { type: "function", name: v.name, length: v.length };
        }
        // 为null返回null
        if (v === null) return null;
        if (typeof v !== "object") {
            if (v === undefined) return { type: "undefined" };
            if (typeof v === "symbol") return { type: "symbol", text: v.toString() };
            if (typeof v === "bigint") return { type: "bigint", value: v.toString() };
            return v;
        }

        const proto = Object.getPrototypeOf(v);
        if (proto === null || proto === Object.prototype) {
            const entries = Object.create(null);
            for (const k of Reflect.ownKeys(v)) {
                const d = Object.getOwnPropertyDescriptor(v, k);
                if (!d) continue;

                const kk = typeof k === "symbol" ? k.toString() : k;
                if (!("value" in d)) {
                    entries[kk] = "<accessor>";
                    continue;
                }
                const vv = d.value;
                if (typeof vv === "function") {
                    entries[kk] = { type: "function", name: vv.name, length: vv.length };
                } else if (vv === undefined) {
                    entries[kk] = { type: "undefined" };
                } else if (typeof vv === "bigint") {
                    entries[kk] = { type: "bigint", value: vv.toString() };
                } else if (vv === null || typeof vv !== "object") {
                    entries[kk] = typeof vv === "symbol" ? vv.toString() : vv;
                } else {
                    entries[kk] = Object.prototype.toString.call(vv);
                }
            }

            return {
                type: "object",
                tag: Object.prototype.toString.call(v),
                proto: proto === null ? "null" : "Object.prototype",
                entries,
            };
        }

        return { type: "object", tag: Object.prototype.toString.call(v), manual: true };
    };
    // 遍历所有描述

    for (const key in property_value_list) {
        const k = property_value_list[key];
        const keyName = typeof k === "symbol" ? k.toString() : k;
        const keyType = typeof k === "symbol" ? "symbol" : "string";
        const descript = Object.getOwnPropertyDescriptor(target, property_value_list[key]);
        // 拿不到描述直接跳过
        if (!descript) { continue };
        // 通过value属性区分accessor和方法
        if ("value" in descript) {
            // 常量和函数都有value需要独立判断
            if (typeof descript.value === "function") {
                // 记录函数
                const function_ = {
                    function_: {
                        [keyName]: {
                            "configurable": descript["configurable"],
                            "enumerable": descript["enumerable"],
                            "writable": descript["writable"],
                            "value": { "name": descript["value"]["name"], "length": descript["value"]["length"] },
                        }
                    },
                    keyType: keyType
                }
                value.push(function_);
            } else {
                // 记录常量 / 对象值
                const constant_ = {
                    constant_: {
                        [keyName]: {
                            "configurable": descript["configurable"],
                            "enumerable": descript["enumerable"],
                            "writable": descript["writable"],
                            "value": valueInfo(descript["value"])
                        }
                    },
                    keyType: keyType
                }
                value.push(constant_);
            }
        } else {
            // accessor
            const accessor_ = {
                accessor_: {
                    [keyName]: {
                        "configurable": descript["configurable"],
                        "enumerable": descript["enumerable"],
                        "get": descript["get"] ? { "name": descript["get"]["name"], "length": descript["get"]["length"] } : undefined,
                        "set": descript["set"] ? { "name": descript["set"]["name"], "length": descript["set"]["length"] } : undefined,
                    }
                },
                keyType: keyType
            }
            value.push(accessor_);
        }
    }
    return value;
})("__TARGET__");