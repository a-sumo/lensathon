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
exports.AutoStoragePropertyExample = void 0;
var __selfType = requireType("./AutoStoragePropertyExample");
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
let AutoStoragePropertyExample = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var AutoStoragePropertyExample = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.log = new SyncKitLogger_1.SyncKitLogger(AutoStoragePropertyExample.name);
            this.myInt = 0;
            this.myIntArray = [0];
            this.myFloat = Math.PI;
            this.myFloatArray = [Math.PI];
            this.myDouble = Math.PI;
            this.myDoubleArray = [Math.PI];
            this.myBool = false;
            this.myBoolArray = [false];
            this.myString = "Hello, World!";
            this.myStringArray = ["Hello, World!"];
            this.myVec2 = vec2.zero();
            this.myVec2Array = [vec2.zero()];
            this.myVec3 = vec3.zero();
            this.myVec3Array = [vec3.zero()];
            this.myVec4 = vec4.zero();
            this.myVec4Array = [vec4.zero()];
            this.myQuat = quat.quatIdentity();
            this.myQuatArray = [quat.quatIdentity()];
            this.myMat2 = mat2.zero();
            this.myMat2Array = [mat2.zero()];
            this.myMat3 = mat3.zero();
            this.myMat3Array = [mat3.zero()];
            this.myMat4 = mat4.zero();
            this.myMat4Array = [mat4.zero()];
            this.myPropInt = StorageProperty_1.StorageProperty.autoInt("myPropInt", () => this.myInt, (newValue) => (this.myInt = newValue));
            this.myPropIntArray = StorageProperty_1.StorageProperty.autoIntArray("myPropIntArray", () => this.myIntArray, (newValue) => (this.myIntArray = newValue));
            this.myPropString = StorageProperty_1.StorageProperty.autoString("myPropString", () => this.myString, (newValue) => (this.myString = newValue));
            this.myPropStringArray = StorageProperty_1.StorageProperty.autoStringArray("myPropStringArray", () => this.myStringArray, (newValue) => (this.myStringArray = newValue));
            this.myPropBool = StorageProperty_1.StorageProperty.autoBool("myPropBool", () => this.myBool, (newValue) => (this.myBool = newValue));
            this.myPropBoolArray = StorageProperty_1.StorageProperty.autoBoolArray("myPropBoolArray", () => this.myBoolArray, (newValue) => (this.myBoolArray = newValue));
            this.myPropFloat = StorageProperty_1.StorageProperty.autoFloat("myPropFloat", () => this.myFloat, (newValue) => (this.myFloat = newValue));
            this.myPropFloatArray = StorageProperty_1.StorageProperty.autoFloatArray("myPropFloatArray", () => this.myFloatArray, (newValue) => (this.myFloatArray = newValue));
            this.myPropDouble = StorageProperty_1.StorageProperty.autoDouble("myPropDouble", () => this.myDouble, (newValue) => (this.myDouble = newValue));
            this.myPropDoubleArray = StorageProperty_1.StorageProperty.autoDoubleArray("myPropDoubleArray", () => this.myDoubleArray, (newValue) => (this.myDoubleArray = newValue));
            this.myPropVec2 = StorageProperty_1.StorageProperty.autoVec2("myPropVec2", () => this.myVec2, (newValue) => (this.myVec2 = newValue));
            this.myPropVec2Array = StorageProperty_1.StorageProperty.autoVec2Array("myPropVec2Array", () => this.myVec2Array, (newValue) => (this.myVec2Array = newValue));
            this.myPropVec3 = StorageProperty_1.StorageProperty.autoVec3("myPropVec3", () => this.myVec3, (newValue) => (this.myVec3 = newValue));
            this.myPropVec3Array = StorageProperty_1.StorageProperty.autoVec3Array("myPropVec3Array", () => this.myVec3Array, (newValue) => (this.myVec3Array = newValue));
            this.myPropVec4 = StorageProperty_1.StorageProperty.autoVec4("myPropVec4", () => this.myVec4, (newValue) => (this.myVec4 = newValue));
            this.myPropVec4Array = StorageProperty_1.StorageProperty.autoVec4Array("myPropVec4Array", () => this.myVec4Array, (newValue) => (this.myVec4Array = newValue));
            this.myPropQuat = StorageProperty_1.StorageProperty.autoQuat("myPropQuat", () => this.myQuat, (newValue) => (this.myQuat = newValue));
            this.myPropQuatArray = StorageProperty_1.StorageProperty.autoQuatArray("myPropQuatArray", () => this.myQuatArray, (newValue) => (this.myQuatArray = newValue));
            this.myPropMat2 = StorageProperty_1.StorageProperty.autoMat2("myPropMat2", () => this.myMat2, (newValue) => (this.myMat2 = newValue));
            this.myPropMat2Array = StorageProperty_1.StorageProperty.autoMat2Array("myPropMat2Array", () => this.myMat2Array, (newValue) => (this.myMat2Array = newValue));
            this.myPropMat3 = StorageProperty_1.StorageProperty.autoMat3("myPropMat3", () => this.myMat3, (newValue) => (this.myMat3 = newValue));
            this.myPropMat3Array = StorageProperty_1.StorageProperty.autoMat3Array("myPropMat3Array", () => this.myMat3Array, (newValue) => (this.myMat3Array = newValue));
            this.myPropMat4 = StorageProperty_1.StorageProperty.autoMat4("myPropMat4", () => this.myMat4, (newValue) => (this.myMat4 = newValue));
            this.myPropMat4Array = StorageProperty_1.StorageProperty.autoMat4Array("myPropMat4Array", () => this.myMat4Array, (newValue) => (this.myMat4Array = newValue));
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
            this.log = new SyncKitLogger_1.SyncKitLogger(AutoStoragePropertyExample.name);
            this.myInt = 0;
            this.myIntArray = [0];
            this.myFloat = Math.PI;
            this.myFloatArray = [Math.PI];
            this.myDouble = Math.PI;
            this.myDoubleArray = [Math.PI];
            this.myBool = false;
            this.myBoolArray = [false];
            this.myString = "Hello, World!";
            this.myStringArray = ["Hello, World!"];
            this.myVec2 = vec2.zero();
            this.myVec2Array = [vec2.zero()];
            this.myVec3 = vec3.zero();
            this.myVec3Array = [vec3.zero()];
            this.myVec4 = vec4.zero();
            this.myVec4Array = [vec4.zero()];
            this.myQuat = quat.quatIdentity();
            this.myQuatArray = [quat.quatIdentity()];
            this.myMat2 = mat2.zero();
            this.myMat2Array = [mat2.zero()];
            this.myMat3 = mat3.zero();
            this.myMat3Array = [mat3.zero()];
            this.myMat4 = mat4.zero();
            this.myMat4Array = [mat4.zero()];
            this.myPropInt = StorageProperty_1.StorageProperty.autoInt("myPropInt", () => this.myInt, (newValue) => (this.myInt = newValue));
            this.myPropIntArray = StorageProperty_1.StorageProperty.autoIntArray("myPropIntArray", () => this.myIntArray, (newValue) => (this.myIntArray = newValue));
            this.myPropString = StorageProperty_1.StorageProperty.autoString("myPropString", () => this.myString, (newValue) => (this.myString = newValue));
            this.myPropStringArray = StorageProperty_1.StorageProperty.autoStringArray("myPropStringArray", () => this.myStringArray, (newValue) => (this.myStringArray = newValue));
            this.myPropBool = StorageProperty_1.StorageProperty.autoBool("myPropBool", () => this.myBool, (newValue) => (this.myBool = newValue));
            this.myPropBoolArray = StorageProperty_1.StorageProperty.autoBoolArray("myPropBoolArray", () => this.myBoolArray, (newValue) => (this.myBoolArray = newValue));
            this.myPropFloat = StorageProperty_1.StorageProperty.autoFloat("myPropFloat", () => this.myFloat, (newValue) => (this.myFloat = newValue));
            this.myPropFloatArray = StorageProperty_1.StorageProperty.autoFloatArray("myPropFloatArray", () => this.myFloatArray, (newValue) => (this.myFloatArray = newValue));
            this.myPropDouble = StorageProperty_1.StorageProperty.autoDouble("myPropDouble", () => this.myDouble, (newValue) => (this.myDouble = newValue));
            this.myPropDoubleArray = StorageProperty_1.StorageProperty.autoDoubleArray("myPropDoubleArray", () => this.myDoubleArray, (newValue) => (this.myDoubleArray = newValue));
            this.myPropVec2 = StorageProperty_1.StorageProperty.autoVec2("myPropVec2", () => this.myVec2, (newValue) => (this.myVec2 = newValue));
            this.myPropVec2Array = StorageProperty_1.StorageProperty.autoVec2Array("myPropVec2Array", () => this.myVec2Array, (newValue) => (this.myVec2Array = newValue));
            this.myPropVec3 = StorageProperty_1.StorageProperty.autoVec3("myPropVec3", () => this.myVec3, (newValue) => (this.myVec3 = newValue));
            this.myPropVec3Array = StorageProperty_1.StorageProperty.autoVec3Array("myPropVec3Array", () => this.myVec3Array, (newValue) => (this.myVec3Array = newValue));
            this.myPropVec4 = StorageProperty_1.StorageProperty.autoVec4("myPropVec4", () => this.myVec4, (newValue) => (this.myVec4 = newValue));
            this.myPropVec4Array = StorageProperty_1.StorageProperty.autoVec4Array("myPropVec4Array", () => this.myVec4Array, (newValue) => (this.myVec4Array = newValue));
            this.myPropQuat = StorageProperty_1.StorageProperty.autoQuat("myPropQuat", () => this.myQuat, (newValue) => (this.myQuat = newValue));
            this.myPropQuatArray = StorageProperty_1.StorageProperty.autoQuatArray("myPropQuatArray", () => this.myQuatArray, (newValue) => (this.myQuatArray = newValue));
            this.myPropMat2 = StorageProperty_1.StorageProperty.autoMat2("myPropMat2", () => this.myMat2, (newValue) => (this.myMat2 = newValue));
            this.myPropMat2Array = StorageProperty_1.StorageProperty.autoMat2Array("myPropMat2Array", () => this.myMat2Array, (newValue) => (this.myMat2Array = newValue));
            this.myPropMat3 = StorageProperty_1.StorageProperty.autoMat3("myPropMat3", () => this.myMat3, (newValue) => (this.myMat3 = newValue));
            this.myPropMat3Array = StorageProperty_1.StorageProperty.autoMat3Array("myPropMat3Array", () => this.myMat3Array, (newValue) => (this.myMat3Array = newValue));
            this.myPropMat4 = StorageProperty_1.StorageProperty.autoMat4("myPropMat4", () => this.myMat4, (newValue) => (this.myMat4 = newValue));
            this.myPropMat4Array = StorageProperty_1.StorageProperty.autoMat4Array("myPropMat4Array", () => this.myMat4Array, (newValue) => (this.myMat4Array = newValue));
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
                this.myInt = 1;
                this.myIntArray = [1, 2];
                this.myString = "Goodbye, World!";
                this.myStringArray = ["Goodbye, World!"];
                this.myBool = false;
                this.myBoolArray = [false];
                this.myFloat = Math.E;
                this.myFloatArray = [Math.E];
                this.myDouble = Math.E;
                this.myDoubleArray = [Math.E];
                this.myVec2 = new vec2(1, 2);
                this.myVec2Array = [new vec2(1, 2), new vec2(3, 4)];
                this.myVec3 = new vec3(1, 2, 3);
                this.myVec3Array = [new vec3(1, 2, 3), new vec3(4, 5, 6)];
                this.myVec4 = new vec4(1, 2, 3, 4);
                this.myVec4Array = [new vec4(1, 2, 3, 4), new vec4(5, 6, 7, 8)];
                this.myQuat = quat.fromEulerVec(new vec3(0, 0, 1));
                this.myQuatArray = [
                    quat.fromEulerVec(new vec3(0, 0, 1)),
                    quat.fromEulerVec(new vec3(0, 1, 0)),
                ];
                this.myMat2 = mat2.identity();
                this.myMat2Array = [mat2.identity(), mat2.identity()];
                this.myMat3 = mat3.identity();
                this.myMat3Array = [mat3.identity(), mat3.identity()];
                this.myMat4 = mat4.identity();
                this.myMat4Array = [mat4.identity(), mat4.identity()];
            }, TEN_SECONDS_MS);
        }
        onMyPropChanged(newValue, oldValue) {
            this.log.i(`My property changed from ${oldValue} to ${newValue}`);
        }
    };
    __setFunctionName(_classThis, "AutoStoragePropertyExample");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AutoStoragePropertyExample = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AutoStoragePropertyExample = _classThis;
})();
exports.AutoStoragePropertyExample = AutoStoragePropertyExample;
//# sourceMappingURL=AutoStoragePropertyExample.js.map