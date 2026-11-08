// 该方法用于处理子继承父亲方法后，禁止直接调用或者获取父亲的方法只能通过子来获取
/*
parent : 父亲
error : 指定错误（获取父亲会抛出）
*/
csvm.ban_parent = function ban_parent(parent, error){
      var msg = error || "Illegal invocation";
      var brand = function(o){ return o instanceof parent; };
      // 加载时抓一份原生 apply：目标之后改 Function.prototype.apply / Reflect.apply
      // 也影响不到壳层，免得它看到框架内部的调用
      var nativeApply = Reflect.apply;

      // 统一的壳工厂：方法简写 + brand check + length/name + 伪装
      function wrap(impl, shellName){
          var holder = {
              [shellName](){
                  if (!brand(this)) throw new TypeError(msg);
                  return nativeApply(impl, this, arguments);
              }
          };
          var shell = holder[shellName];

          Object.defineProperty(shell, "length", {
              value: impl.length,
              writable: false, enumerable: false, configurable: true
          });
          csvm.safefunction(shell, shellName);
          return shell;
      }

      Object.getOwnPropertyNames(parent.prototype).forEach(function(name){
          // 忽略 constructor
          if (name === "constructor") return;
          // 获取父亲的属性或方法的描述
          var descriptor = Object.getOwnPropertyDescriptor(parent.prototype, name);

          // ---- 方法：原地替换 ----
          if (typeof descriptor.value === "function") {
              Object.defineProperty(parent.prototype, name, {
                  value: wrap(descriptor.value, name),
                  writable: true, enumerable: true, configurable: true
              });
          }
          // ---- 属性：包 getter/setter ----
          else if (descriptor.get || descriptor.set) {
              var desc = { enumerable: true, configurable: true };
              if (descriptor.get) desc.get = wrap(descriptor.get, "get " + name);
              if (descriptor.set) desc.set = wrap(descriptor.set, "set " + name);
              Object.defineProperty(parent.prototype, name, desc);
          }
          // ---- 常量：不处理 ----
      });
  };