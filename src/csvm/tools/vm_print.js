// 框架日志功能
csvm.print={};
// 日志功能记录调用类型，调用对象，调用的属性方法，调用得到的值，调用时间，调用状态
csvm.print.print_infor=function print_infor(type,object,property,value,time,state){
    this.type=type;
    this.phase=csvm.memory.phase;   // 记下这条日志产生在哪个阶段（init / target）
    this.object=object;
    this.property=property;
    this.value=value;
    this.time=time;
    this.state=state;
}
csvm.memory.print=[];
// 因缓冲上限被丢弃的条数，showlog 时提示
csvm.memory.printDropped=0;
// 防止「格式化日志里的值」触发代理 trap 又进来记日志，造成递归
csvm.print._writing=false;
csvm.print.log = function(value){

    // 如果没有开启打印功能，则直接返回
    if (!csvm.memory.config.print) return;

    var list=csvm.memory.print;
    list.push(value);

    // 缓冲上限：一次多丢一点，避免每条日志都执行 splice
    var maxKeep=csvm.memory.config.maxKeep||0;
    if (maxKeep>0 && list.length>maxKeep+500){
        var drop=list.length-maxKeep;
        list.splice(0,drop);
        csvm.memory.printDropped+=drop;
    }

    // 运行时同步输出：不等目标跑完、也不等报错
    if (!csvm.memory.config.stream || csvm.print._writing) return;
    // 默认只同步目标阶段的日志，框架加载期的噪音仍然只在最后表格里（可由 streamInit 打开）
    if (value.phase!=="target" && !csvm.memory.config.streamInit) return;

    csvm.print._writing=true;
    try{
        console.log(csvm.print.format_line(value));
    }catch(e){
        // 格式化失败不能把目标带崩
        try{ console.log("[LOG] 格式化失败: "+(e&&e.message)); }catch(_){}
    }finally{
        csvm.print._writing=false;
    }
};
// 截断文本，超长用 ... 结尾
csvm.print.cut=function(text,max){
    text=String(text);
    return text.length>max?text.slice(0,max-3)+"...":text;
};
// 类型缩写：vm_proxy 里的事件名太长，表格里用短码
csvm.print.short_type=function(type){
    var type_map={
        "[GET] (get)":"GET",
        "[SET] (set)":"SET",
        "[HAS] (has)":"HAS",
        "[GETOWNPROPERTYDESCRIPTOR] (getOwnPropertyDescriptor)":"GET_DESC",
        "[OWNKEYS] (ownKeys)":"OWN_KEYS",
        "[GETPROTOTYPEOF] (getPrototypeOf)":"GET_PROTO",
        "[APPLY] (apply)":"APPLY"
    };
    return type_map[type]||type;
};
// 把任意值转成短字符串，避免 console.table 单元格被对象内容撑爆
csvm.print.short_value=function(value,max){
    max=max||40;
    if (value===null) return "null";
    if (value===undefined) return "undefined";
    var value_type=typeof value;
    if (value_type==="string"){
        // 空串要能看出来：表格里空单元格和"没这一列"分不清
        if (value==="") return '""';
        return csvm.print.cut(value.replace(/\s+/g," "),max);
    }
    if (value_type==="number"||value_type==="boolean"||value_type==="bigint") return String(value);
    if (value_type==="symbol") return csvm.print.cut(value.toString(),max);
    if (value_type==="function") return csvm.print.cut("fn: "+(value.name||"anonymous"),max);
    if (Array.isArray(value)) return csvm.print.cut("[Array: "+value.length+"]",max);
    // 对象只保留短标签，例如 [Window] / [Location] / [Object]，不再展开属性
    try{
        return csvm.print.cut("["+Object.prototype.toString.call(value).slice(8,-1)+"]",max);
    }catch(e){
        return "[Object]";
    }
};
// 从 "2026年11月2日 下午2:29:41" 里只取 "2:29:41"，避免时间列太宽
csvm.print.short_time=function(value){
    var match=/(\d{1,2}:\d{2}:\d{2}(?:\s*[AP]M)?)/i.exec(String(value));
    return match?match[1]:String(value);
};
// 运行时同步输出用的单行格式
// 例：[3:15:42 PM] target GET [Window] navigator = [Navigator] | 成功
// 必须带上 object：同一个属性名可能是 document 的，也可能是 window 的
csvm.print.format_line=function(info){
    return "["+csvm.print.short_time(info.time)+"] "+
        info.phase+" "+
        csvm.print.short_type(info.type)+" "+
        csvm.print.short_value(info.object,30)+" "+
        csvm.print.short_value(info.property,60)+
        " = "+csvm.print.short_value(info.value,60)+
        " | "+info.state;
};
csvm.print.showlog = function(){
    // 保留原来的「跑完后输出汇总表格」功能；stream 只负责运行中同步打印
    // 不想看最后的表格时把 config.table 置 false
    if (csvm.memory.config.table===false) return;
    // console.table 的规则：对象 -> 每个 key 是一行；数组 -> 每个元素是一行。
    // 这里要把「一条日志」组装成一个对象放进数组，字段才会成为列。
    let console_table_array=[];
    // 先快照，避免下面格式化触发代理 get 时再往 csvm.memory.print 里追加
    let print_list=csvm.memory.print.slice();
    for (var print_infor_index=0;print_infor_index<print_list.length;print_infor_index++){
        let print_infor_value=print_list[print_infor_index];
        // 加载期的噪音默认不显示，csvm.memory.config.printInit 置 true 可打开
        if (!csvm.memory.config.printInit && print_infor_value.phase==="init") continue;
        console_table_array.push({
            "类型":csvm.print.cut(csvm.print.short_type(print_infor_value.type),10),
            "阶段":print_infor_value.phase,
            "对象":csvm.print.short_value(print_infor_value.object,35),
            // 属性名不截断，完整显示（必要时可改这里的上限）
            "属性":csvm.print.short_value(print_infor_value.property,50),
            "值":csvm.print.short_value(print_infor_value.value,25),
            "时间":csvm.print.cut(csvm.print.short_time(print_infor_value.time),8),
            "状态":csvm.print.cut(print_infor_value.state,6)
        });
    }
    console.table(console_table_array);

    // 死循环时日志会超过上限，明确提示被丢了多少，避免误以为日志完整
    if (csvm.memory.printDropped>0){
        console.log("[日志] 内存中仅保留最近 "+(csvm.memory.config.maxKeep||0)+
            " 条，已丢弃 "+csvm.memory.printDropped+" 条（运行中的同步日志不受影响）");
    }
};