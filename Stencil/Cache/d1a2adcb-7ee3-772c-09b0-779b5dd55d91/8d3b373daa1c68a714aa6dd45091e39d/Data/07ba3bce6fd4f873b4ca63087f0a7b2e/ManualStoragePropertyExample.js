"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualStoragePropertyExample = void 0;
var __selfType = requireType("./ManualStoragePropertyExample");
function component(target) {
    target.getTypeName = function () { return __selfType; };
    if (target.prototype.hasOwnProperty("getTypeName"))
        return;
    Object.defineProperty(target.prototype, "getTypeName", {
        value: function () { return __selfType; },
        configurable: true,
        writable: true
    });
}
const StorageProperty_1 = require("../../Core/StorageProperty");
const StoragePropertySet_1 = require("../../Core/StoragePropertySet");
const SyncEntity_1 = require("../../Core/SyncEntity");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
const Timers_1 = require("../../Utils/Timers");
// 10 seconds in milliseconds
const TEN_SECONDS_MS = 10000;
let ManualStoragePropertyExample = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var ManualStoragePropertyExample = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.log = new SyncKitLogger_1.SyncKitLogger(ManualStoragePropertyExample.name);
            this.myPropInt = StorageProperty_1.StorageProperty.manualInt("myPropInt", 0);
            this.myPropIntArray = StorageProperty_1.StorageProperty.manualIntArray("myPropIntArray", [0]);
            this.myPropString = StorageProperty_1.StorageProperty.manualString("myPropString", "Hello, World!");
            this.myPropStringArray = StorageProperty_1.StorageProperty.manualStringArray("myPropStringArray", ["Hello, World!"]);
            this.myPropBool = StorageProperty_1.StorageProperty.manualBool("myPropBool", true);
            this.myPropBoolArray = StorageProperty_1.StorageProperty.manualBoolArray("myPropBoolArray", [
                true,
            ]);
            this.myPropFloat = StorageProperty_1.StorageProperty.manualFloat("myPropFloat", Math.PI);
            this.myPropFloatArray = StorageProperty_1.StorageProperty.manualFloatArray("myPropFloatArray", [Math.PI]);
            this.myPropDouble = StorageProperty_1.StorageProperty.manualDouble("myPropDouble", Math.PI);
            this.myPropDoubleArray = StorageProperty_1.StorageProperty.manualDoubleArray("myPropDoubleArray", [Math.PI]);
            this.myPropVec2 = StorageProperty_1.StorageProperty.manualVec2("myPropVec2", vec2.zero());
            this.myPropVec2Array = StorageProperty_1.StorageProperty.manualVec2Array("myPropVec2Array", [
                vec2.zero(),
            ]);
            this.myPropVec3 = StorageProperty_1.StorageProperty.manualVec3("myPropVec3", vec3.zero());
            this.myPropVec3Array = StorageProperty_1.StorageProperty.manualVec3Array("myPropVec3Array", [
                vec3.zero(),
            ]);
            this.myPropVec4 = StorageProperty_1.StorageProperty.manualVec4("myPropVec4", vec4.zero());
            this.myPropVec4Array = StorageProperty_1.StorageProperty.manualVec4Array("myPropVec4Array", [
                vec4.zero(),
            ]);
            this.myPropQuat = StorageProperty_1.StorageProperty.manualQuat("myPropQuat", quat.quatIdentity());
            this.myPropQuatArray = StorageProperty_1.StorageProperty.manualQuatArray("myPropQuatArray", [
                quat.quatIdentity(),
            ]);
            this.myPropMat2 = StorageProperty_1.StorageProperty.manualMat2("myPropMat2", mat2.zero());
            this.myPropMat2Array = StorageProperty_1.StorageProperty.manualMat2Array("myPropMat2Array", [
                mat2.zero(),
            ]);
            this.myPropMat3 = StorageProperty_1.StorageProperty.manualMat3("myPropMat3", mat3.zero());
            this.myPropMat3Array = StorageProperty_1.StorageProperty.manualMat3Array("myPropMat3Array", [
                mat3.zero(),
            ]);
            this.myPropMat4 = StorageProperty_1.StorageProperty.manualMat4("myPropMat4", mat4.zero());
            this.myPropMat4Array = StorageProperty_1.StorageProperty.manualMat4Array("myPropMat4Array", [
                mat4.zero(),
            ]);
            this.myStoragePropertySet = new StoragePropertySet_1.StoragePropertySet([
                this.myPropInt,
                this.myPropIntArray,
                this.myPropString,
                this.myPropStringArray,
                this.myPropBool,
                this.myPropBoolArray,
                this.myPropFloat,
                this.myPropFloatArray,
                this.myPropDouble,
                this.myPropDoubleArray,
                this.myPropVec2,
                this.myPropVec2Array,
                this.myPropVec3,
                this.myPropVec3Array,
                this.myPropVec4,
                this.myPropVec4Array,
                this.myPropQuat,
                this.myPropQuatArray,
                this.myPropMat2,
                this.myPropMat2Array,
                this.myPropMat3,
                this.myPropMat3Array,
                this.myPropMat4,
                this.myPropMat4Array,
            ]);
            this.syncEntity = new SyncEntity_1.SyncEntity(this, this.myStoragePropertySet, true);
        }
        __initialize() {
            super.__initialize();
            this.log = new SyncKitLogger_1.SyncKitLogger(ManualStoragePropertyExample.name);
            this.myPropInt = StorageProperty_1.StorageProperty.manualInt("myPropInt", 0);
            this.myPropIntArray = StorageProperty_1.StorageProperty.manualIntArray("myPropIntArray", [0]);
            this.myPropString = StorageProperty_1.StorageProperty.manualString("myPropString", "Hello, World!");
            this.myPropStringArray = StorageProperty_1.StorageProperty.manualStringArray("myPropStringArray", ["Hello, World!"]);
            this.myPropBool = StorageProperty_1.StorageProperty.manualBool("myPropBool", true);
            this.myPropBoolArray = StorageProperty_1.StorageProperty.manualBoolArray("myPropBoolArray", [
                true,
            ]);
            this.myPropFloat = StorageProperty_1.StorageProperty.manualFloat("myPropFloat", Math.PI);
            this.myPropFloatArray = StorageProperty_1.StorageProperty.manualFloatArray("myPropFloatArray", [Math.PI]);
            this.myPropDouble = StorageProperty_1.StorageProperty.manualDouble("myPropDouble", Math.PI);
            this.myPropDoubleArray = StorageProperty_1.StorageProperty.manualDoubleArray("myPropDoubleArray", [Math.PI]);
            this.myPropVec2 = StorageProperty_1.StorageProperty.manualVec2("myPropVec2", vec2.zero());
            this.myPropVec2Array = StorageProperty_1.StorageProperty.manualVec2Array("myPropVec2Array", [
                vec2.zero(),
            ]);
            this.myPropVec3 = StorageProperty_1.StorageProperty.manualVec3("myPropVec3", vec3.zero());
            this.myPropVec3Array = StorageProperty_1.StorageProperty.manualVec3Array("myPropVec3Array", [
                vec3.zero(),
            ]);
            this.myPropVec4 = StorageProperty_1.StorageProperty.manualVec4("myPropVec4", vec4.zero());
            this.myPropVec4Array = StorageProperty_1.StorageProperty.manualVec4Array("myPropVec4Array", [
                vec4.zero(),
            ]);
            this.myPropQuat = StorageProperty_1.StorageProperty.manualQuat("myPropQuat", quat.quatIdentity());
            this.myPropQuatArray = StorageProperty_1.StorageProperty.manualQuatArray("myPropQuatArray", [
                quat.quatIdentity(),
            ]);
            this.myPropMat2 = StorageProperty_1.StorageProperty.manualMat2("myPropMat2", mat2.zero());
            this.myPropMat2Array = StorageProperty_1.StorageProperty.manualMat2Array("myPropMat2Array", [
                mat2.zero(),
            ]);
            this.myPropMat3 = StorageProperty_1.StorageProperty.manualMat3("myPropMat3", mat3.zero());
            this.myPropMat3Array = StorageProperty_1.StorageProperty.manualMat3Array("myPropMat3Array", [
                mat3.zero(),
            ]);
            this.myPropMat4 = StorageProperty_1.StorageProperty.manualMat4("myPropMat4", mat4.zero());
            this.myPropMat4Array = StorageProperty_1.StorageProperty.manualMat4Array("myPropMat4Array", [
                mat4.zero(),
            ]);
            this.myStoragePropertySet = new StoragePropertySet_1.StoragePropertySet([
                this.myPropInt,
                this.myPropIntArray,
                this.myPropString,
                this.myPropStringArray,
                this.myPropBool,
                this.myPropBoolArray,
                this.myPropFloat,
                this.myPropFloatArray,
                this.myPropDouble,
                this.myPropDoubleArray,
                this.myPropVec2,
                this.myPropVec2Array,
                this.myPropVec3,
                this.myPropVec3Array,
                this.myPropVec4,
                this.myPropVec4Array,
                this.myPropQuat,
                this.myPropQuatArray,
                this.myPropMat2,
                this.myPropMat2Array,
                this.myPropMat3,
                this.myPropMat3Array,
                this.myPropMat4,
                this.myPropMat4Array,
            ]);
            this.syncEntity = new SyncEntity_1.SyncEntity(this, this.myStoragePropertySet, true);
        }
        onAwake() {
            Object.values(this.myStoragePropertySet.storageProperties).forEach((property) => {
                // Can subscribe to changes at any time
                property.onAnyChange.add((newValue, oldValue) => this.onMyPropChanged(newValue, oldValue));
            });
            this.syncEntity.notifyOnReady(() => this.onReady());
        }
        onReady() {
            Object.values(this.myStoragePropertySet.storageProperties).forEach((property) => {
                // Wait until onReady before printing values
                this.log.i(`My property ${property.key} value starts as ${property.currentOrPendingValue}`);
            });
            // After some time, change the value of the properties once to demonstrate how changing them works
            (0, Timers_1.setTimeout)(this, () => {
                if (!this.syncEntity.doIOwnStore()) {
                    this.log.i("Not the syncEntity owner, not changing properties.");
                    return;
                }
                this.myPropInt.setPendingValue(1);
                this.myPropIntArray.setPendingValue([1, 2]);
                this.myPropString.setPendingValue("Goodbye, World!");
                this.myPropStringArray.setPendingValue(["Goodbye, World!"]);
                this.myPropBool.setPendingValue(false);
                this.myPropBoolArray.setPendingValue([false]);
                this.myPropFloat.setPendingValue(Math.E);
                this.myPropFloatArray.setPendingValue([Math.E]);
                this.myPropDouble.setPendingValue(Math.E);
                this.myPropDoubleArray.setPendingValue([Math.E]);
                this.myPropVec2.setPendingValue(new vec2(1, 2));
                this.myPropVec2Array.setPendingValue([new vec2(1, 2), new vec2(3, 4)]);
                this.myPropVec3.setPendingValue(new vec3(1, 2, 3));
                this.myPropVec3Array.setPendingValue([
                    new vec3(1, 2, 3),
                    new vec3(4, 5, 6),
                ]);
                this.myPropVec4.setPendingValue(new vec4(1, 2, 3, 4));
                this.myPropVec4Array.setPendingValue([
                    new vec4(1, 2, 3, 4),
                    new vec4(5, 6, 7, 8),
                ]);
                this.myPropQuat.setPendingValue(quat.fromEulerVec(new vec3(0, 0, 1)));
                this.myPropQuatArray.setPendingValue([
                    quat.fromEulerVec(new vec3(0, 0, 1)),
                    quat.fromEulerVec(new vec3(0, 1, 0)),
                ]);
                this.myPropMat2.setPendingValue(mat2.identity());
                this.myPropMat2Array.setPendingValue([mat2.identity(), mat2.identity()]);
                this.myPropMat3.setPendingValue(mat3.identity());
                this.myPropMat3Array.setPendingValue([mat3.identity(), mat3.identity()]);
                this.myPropMat4.setPendingValue(mat4.identity());
                this.myPropMat4Array.setPendingValue([mat4.identity(), mat4.identity()]);
            }, TEN_SECONDS_MS);
        }
        onMyPropChanged(newValue, oldValue) {
            this.log.i(`My property changed from ${oldValue} to ${newValue}`);
        }
    };
    __setFunctionName(_classThis, "ManualStoragePropertyExample");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ManualStoragePropertyExample = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ManualStoragePropertyExample = _classThis;
})();
exports.ManualStoragePropertyExample = ManualStoragePropertyExample;
//# sourceMappingURL=ManualStoragePropertyExample.js.map