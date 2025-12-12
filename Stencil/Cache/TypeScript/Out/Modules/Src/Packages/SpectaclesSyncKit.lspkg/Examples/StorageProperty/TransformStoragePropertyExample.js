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
exports.TransformStoragePropertyExample = void 0;
var __selfType = requireType("./TransformStoragePropertyExample");
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
const PropertyType_1 = require("../../Core/PropertyType");
const StorageProperty_1 = require("../../Core/StorageProperty");
const StoragePropertySet_1 = require("../../Core/StoragePropertySet");
const SyncEntity_1 = require("../../Core/SyncEntity");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
// The rotation speed of the circle to move the object in
const CIRCLE_ROTATION_SPEED = 1;
// The radius of the circle to move the object in
const CIRCLE_RADIUS_CM = 50;
// Maximum size of the object
const MAX_SIZE = 5;
let TransformStoragePropertyExample = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var TransformStoragePropertyExample = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.log = new SyncKitLogger_1.SyncKitLogger(TransformStoragePropertyExample.name);
            this.myPropTransform = StorageProperty_1.StorageProperty.forTransform(this, PropertyType_1.PropertyType.Location, PropertyType_1.PropertyType.Location, PropertyType_1.PropertyType.Location, 
            // Demonstrate how to apply smoothing
            {
                interpolationTarget: -0.25,
            });
            this.myStoragePropertySet = new StoragePropertySet_1.StoragePropertySet([this.myPropTransform]);
            this.syncEntity = new SyncEntity_1.SyncEntity(this, this.myStoragePropertySet, true);
        }
        __initialize() {
            super.__initialize();
            this.log = new SyncKitLogger_1.SyncKitLogger(TransformStoragePropertyExample.name);
            this.myPropTransform = StorageProperty_1.StorageProperty.forTransform(this, PropertyType_1.PropertyType.Location, PropertyType_1.PropertyType.Location, PropertyType_1.PropertyType.Location, 
            // Demonstrate how to apply smoothing
            {
                interpolationTarget: -0.25,
            });
            this.myStoragePropertySet = new StoragePropertySet_1.StoragePropertySet([this.myPropTransform]);
            this.syncEntity = new SyncEntity_1.SyncEntity(this, this.myStoragePropertySet, true);
        }
        onAwake() {
            // Demonstrate the effect of limiting the number of sends per second
            this.myPropTransform.sendsPerSecondLimit = 3;
            this.createEvent("UpdateEvent").bind(() => this.updateTransform());
        }
        updateTransform() {
            if (!this.syncEntity.doIOwnStore()) {
                this.log.i("Not the syncEntity owner, not changing anything.");
                return;
            }
            const angle = getTime() * CIRCLE_ROTATION_SPEED;
            const x = CIRCLE_RADIUS_CM * Math.cos(angle);
            const y = CIRCLE_RADIUS_CM * Math.sin(angle);
            this.sceneObject.getTransform().setLocalPosition(new vec3(x, y, 0));
            const rotation = quat.fromEulerVec(new vec3(0, 0, angle));
            this.sceneObject.getTransform().setLocalRotation(rotation);
            const size = vec3.one().uniformScale(getTime() % MAX_SIZE);
            this.sceneObject.getTransform().setLocalScale(size);
        }
    };
    __setFunctionName(_classThis, "TransformStoragePropertyExample");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransformStoragePropertyExample = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransformStoragePropertyExample = _classThis;
})();
exports.TransformStoragePropertyExample = TransformStoragePropertyExample;
//# sourceMappingURL=TransformStoragePropertyExample.js.map