## CS补环境框架

### 开发进度 
#### -----2026/10/31，确定基本骨架，和原型链大致的流程
#### -----2026/10/31，发现属性和真实浏览器之间存在差异，规划了自动生成脚本插入浏览器后自动提取某对象中own的属性的特征指纹导出到文件夹中后续通过框架代码自动生成插入对应文件中，规划了document的dom方法的补法和EventTarget下的定时器和监听器的一些补发
#### -----2026/11/05，safefunction 改用 WeakMap 存放伪造源码，去掉自有 symbol 泄漏、name 可写、Function.prototype.toString 可 new 三类指纹
#### -----2026/11/05，proxy 的 apply trap 重写（不再字符串拼接返回值、抛错也留痕、状态看异常而非真假），get trap 过滤调试器 inspect 产生的 symbol / toString 噪音
#### -----2026/11/05，日志按阶段区分：init（框架加载）/ target（目标代码），加载期噪音默认不显示
#### -----2026/11/05，自动补齐插件迁到 plugin/auto_complete_plugin，__autoFn 支持第三参数在生成区里 inline 手写实现
#### -----2026/11/05，新增 plugin/analysis_dom_plugin：dom.html → page.json → page.js，把真实页面解析成运行时 DOM 对象树（782 元素 / 1247 文本 / 1 注释 / 1 doctype，共 2032 节点）
#### -----2026/11/05，21 个 HTMLXxxElement 接口的自引用原型 bug 修复并统一用 registerElement 注册；目标代码换成瑞数真实载荷，当前阻塞在 getElementById 返回 null
#### -----2026/11/06，getElementsByTagName 重写（Element / Document）：从"返回单个节点"改为"遍历后代收集数组"，修掉 `data.tag` 取错、根节点不自带、返回值类型三处问题
#### -----2026/11/06，innerHTML 第一版：解析 → 节点数组 → 原子替换 → 序列化四段式；覆盖注释与纯文本，其余 `debugger`；getter 同步实现；注释内容与 page.js 静态树统一存 `data.text`
#### -----2026/11/06，目标链路：getElementById / localStorage / window.top 已可用；当前阻塞在 location.href 未实现；`window['']` 确认为误报
#### -----2026/11/07，框架整体包 IIFE + 目标两段式执行（间接 eval 只能看全局）：框架期 window 自有键 121，csvm / proxy / htmlParse 等泄漏 0；vm2 的 Buffer / global / GLOBAL / root / VMError 已清
#### -----2026/11/07，page.js 生成器同步输出 IIFE，2031 个 n###_* 节点变量不再挂到 window
#### -----2026/11/07，日志修正：GET 用 Reflect.has 判断属性存在性（假值不再误标「未定义」）、空串显示 `""`、location.href 去字面引号
#### -----2026/11/07，新增 vm_native_text.js：统一修复 vm2 内建函数 toString 丢名字（eval / Function / Proxy），exposed 列表兼作全局泄漏检测
#### -----2026/11/07，目标跑通：exit 0、0 报错、3131 行日志，document.cookie 正常读写并生成 T
#### -----2026/11/08，补齐 navigator.plugins 接口族（Plugin / PluginArray / MimeType / MimeTypeArray）：WeakMap 内部槽、真机身份语义（plugins[x] 稳定 / plugin[y] 每次现造 / mimeTypes 按 type 去重）、Symbol.iterator 与 Chrome 对齐
#### -----2026/11/08，新增 addPlugin(config) 宿主侧 API：追加带自定义 MimeTypes 的插件，lazy / eager 两种 mimeTypes 初始化顺序都同步；目标回归 exit 0、0 报错、日志 3150 条左右（目标有随机分支）
#### -----2026/11/08，修 __autoFn 手写 impl 的函数形状：方法简写包一层 + 加载时抓原生 apply + 原始函数 safefunction；13 个文件 / 44 处 getter、method 的 own keys 与原生一致，Plugin mime 访问器、history.back、setTimeout / setInterval 的真实源码泄漏一并修掉；生成器 plugin/auto_complete_plugin/Analysis.js 的 HELPERS 模板同步为同一实现
#### -----2026/11/08，记录待办与指纹：Plugin mime 索引描述符（需 Proxy，后改为 data，见下条）、MimeTypeArray 构造函数名、EXPOSE 缺 4 个接口、pdfViewerEnabled 空壳、location.toString / valueOf 空壳
#### -----2026/11/08，Plugin 索引 / 名字属性从访问器改成 data 描述符（writable:false、enumerable 索引 true / 名字 false、configurable:true），索引与名字各存一个 MimeType 实例；item() / namedItem() 仍每次现造。剩余差异：同一属性重复读返回同一对象（真机 false）、delete 仍返回 true（真机 false）
#### -----2026/11/08，window 身份修正：config.proxy 默认改为 false（默认 window === globalThis）；window.top / window.window 改成 Chrome 同款自有只读 accessor（get-only、e:true、c:false），getter 闭包 window_ref 避免自递归；WindowProperties.prototype 删除自有 constructor（真机从 EventTarget.prototype 继承）。self / parent / frames 仍缺失，本次未补
#### -----2026/11/08，按最小化原则移除 navigator.plugins / mimeTypes 运行时实现：删除 Plugin / PluginArray / MimeType / MimeTypeArray、addPlugin、PluginData 及相关加载与访问器；保留 window 身份修正，md 仅留记录。目标回归 exit 0、0 报错
#### -----2026/11/10，目标切到阿里 WAF `acw_sc__v2` 挑战页；发现 vm2 会给每个 `catch(e)` 注入 `e=VM2_INTERNAL_STATE...handleException(e);`，目标拿 `xXRQBR.toString()` 源码算自校验必然失败并卡在 `while(!![])`。在 `vm_safefunction.js` 的 `toString` 出口剥离注入段（本目标 4 处，19,160 → 18,872 字符，与原始函数源码逐字符一致），保留 vm2
#### -----2026/11/10，新增整页脚本模式：`config.runScripts` + `config.scriptHtmlPath`，`index.js` 用 parse5 按文档顺序取内联 `<script>` 文本，在同一个 VM 里依次执行；script[0] 的 `var arg1` / `reload` 可被 script[1] 直接使用
#### -----2026/11/10，日志支持运行时同步输出：`stream` / `streamInit` / `table` / `maxKeep` 四个开关；`log()` 入缓冲后立即打印单行（带对象、属性、值、状态），`_writing` 防止格式化触发代理递归；缓冲上限 5000 条，超出丢弃并计数；原 `showlog()` 汇总表格保留
#### -----2026/11/10，补 `navigator.webdriver = false`（Navigator.prototype getter，ban_parent 保证原型直读抛 Illegal invocation）、`document.referrer = ""`、`document.location`（document 实例自有 accessor，get 返回 `csvm.memory.location`，e:true / c:false）
#### -----2026/11/10，查清 `acw_tc` / `aliyungf_tc` 是服务端 `Set-Cookie` 下发的 HttpOnly cookie，`acw_sc__v2` 才是页面 JS 计算后写入；`document.cookie` 在真机看不到 HttpOnly 项。框架目前仍是单字符串 `csvm.memory.cookie`（整串替换），尚无 cookie jar / HttpOnly 区分
#### -----2026/11/10，在自建阿里 WAF 测试站完成 2 次请求端到端验证：挑战页取当次 `renderData` + `acw_tc` → 框架算 `acw_sc__v2` → 带 `acw_tc + acw_sc__v2` 复请求，返回 `{"success":true}`；`acw_sc__v2` 前缀 `1234cf0d46-` 稳定，尾部随时间变化
#### -----2026/11/10，当前工作区为调试配置：`proxy:true`、`runScripts:true`；正式回归前应按需改回 `false`

> 注：2026/11/08 的 Plugin / MimeType 运行时实现已在同日移除，相关进度条目保留为历史记录；当前代码不包含 `navigator.plugins` / `navigator.mimeTypes`。

### 文档

| 文档 | 内容 |
|---|---|
| [进度记录.md](进度记录.md) | 按天记录的详细进度、当前状态、待办和已知风险 |
| [已知问题.md](已知问题.md) | 当前差异、未实现项、工具链约束，按 ISSUE-ID 追溯 |
| [plugin/auto_complete_plugin/采集设计.md](plugin/auto_complete_plugin/采集设计.md) | 浏览器原型采集与代码生成插件的设计与踩坑 |
| [plugin/analysis_dom_plugin/解析设计.md](plugin/analysis_dom_plugin/解析设计.md) | HTML 解析成运行时 DOM 的方案、数据格式和坑 |

### 目录

```
src/                    框架与目标代码
  csvm/tools/           运行时工具（safefunction / proxy / print / memory）
  csvm/browser/         浏览器接口补全（window / document / DOM/*Element）
  code.js               目标代码（瑞数载荷）
plugin/
  auto_complete_plugin/ 原型采集 + 框架代码生成
  analysis_dom_plugin/  HTML -> DOM 对象树
```
