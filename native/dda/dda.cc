#include <node.h>
#include <v8.h>
#include <vector>

namespace dda {
using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::ObjectTemplate;
using v8::String;
using v8::Symbol;
using v8::TryCatch;
using v8::Value;

void CallDDA(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> ctx = isolate->GetCurrentContext();
    Local<Object> self = args.This();
    Local<Symbol> sym = Symbol::For(isolate, String::NewFromUtf8Literal(isolate, "nodejs.dda.call"));
    Local<Value> fnVal;
    if (self->Get(ctx, sym).ToLocal(&fnVal) && fnVal->IsFunction()) {
        Local<Function> fn = fnVal.As<Function>();
        int n = args.Length();
        std::vector<Local<Value>> argv;
        argv.reserve(n);
        for (int i = 0; i < n; i++) argv.push_back(args[i]);
        TryCatch tc(isolate);
        v8::MaybeLocal<Value> ret = fn->Call(ctx, self, n, n ? argv.data() : nullptr);
        if (!ret.IsEmpty()) {
            args.GetReturnValue().Set(ret.ToLocalChecked());
        } else if (tc.HasCaught()) {
            isolate->ThrowException(tc.Exception());
        }
        return;
    }
    args.GetReturnValue().SetUndefined();
}


void MakeDDA(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> ctx = isolate->GetEnteredOrMicrotaskContext();
    if (ctx.IsEmpty()) ctx = isolate->GetCurrentContext();
    if (ctx.IsEmpty()) {
        isolate->ThrowException(v8::Exception::Error(
            v8::String::NewFromUtf8Literal(isolate, "no context")));
        return;
    }
    Context::Scope scope(ctx);
    Local<ObjectTemplate> tpl = ObjectTemplate::New(isolate);
    tpl->SetInternalFieldCount(0);
    tpl->SetCallAsFunctionHandler(CallDDA);
    tpl->MarkAsUndetectable();
    Local<Object> obj = tpl->NewInstance(ctx).ToLocalChecked();
    args.GetReturnValue().Set(obj);
}

void Init(Local<Object> exports) {
    NODE_SET_METHOD(exports, "makeDDA", MakeDDA);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}
