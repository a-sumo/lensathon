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
exports.SyncMaterials = void 0;
var __selfType = requireType("./SyncMaterials");
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
const NetworkIdTools_1 = require("../Core/NetworkIdTools");
const NetworkIdType_1 = require("../Core/NetworkIdType");
const StorageProperty_1 = require("../Core/StorageProperty");
const StoragePropertySet_1 = require("../Core/StoragePropertySet");
const StorageTypes_1 = require("../Core/StorageTypes");
const SyncEntity_1 = require("../Core/SyncEntity");
const SyncKitLogger_1 = require("../Utils/SyncKitLogger");
const TAG = "SyncMaterials";
/**
 * Synchronizes material properties across the network.
 * Add this to a SceneObject and assign the material you want synchronized in Main Material.
 * Add each property name you want synchronized to the Property Names list.
 * Any changes to these properties will be automatically synchronized across the network.
 */
let SyncMaterials = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var SyncMaterials = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.networkIdTypeString = this.networkIdTypeString;
            this.networkIdType = (0, NetworkIdType_1.networkIdFromString)(this.networkIdTypeString);
            this.customNetworkId = this.customNetworkId;
            this.autoClone = this.autoClone;
            this.mainMaterial = this.mainMaterial;
            this.propertyNames = this.propertyNames;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
            this.storageProps = new StoragePropertySet_1.StoragePropertySet();
            this.syncEntity = new SyncEntity_1.SyncEntity(this, this.storageProps, null, null, new NetworkIdTools_1.NetworkIdOptions(this.networkIdType, this.customNetworkId));
        }
        __initialize() {
            super.__initialize();
            this.networkIdTypeString = this.networkIdTypeString;
            this.networkIdType = (0, NetworkIdType_1.networkIdFromString)(this.networkIdTypeString);
            this.customNetworkId = this.customNetworkId;
            this.autoClone = this.autoClone;
            this.mainMaterial = this.mainMaterial;
            this.propertyNames = this.propertyNames;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
            this.storageProps = new StoragePropertySet_1.StoragePropertySet();
            this.syncEntity = new SyncEntity_1.SyncEntity(this, this.storageProps, null, null, new NetworkIdTools_1.NetworkIdOptions(this.networkIdType, this.customNetworkId));
        }
        onAwake() {
            if (!this.mainMaterial) {
                this.log.e("You need to set mainMaterial!");
                return;
            }
            if (this.autoClone) {
                this.newMat = this.mainMaterial.clone();
                const visuals = this.getComponentsRecursive(this.getSceneObject(), "MaterialMeshVisual");
                for (let i = 0; i < visuals.length; i++) {
                    const materials = visuals[i].materials;
                    let needsToUpdateMaterials = false;
                    for (let j = 0; j < materials.length; j++) {
                        // If a material matches the one we cloned, we need to replace it with the new, cloned material
                        if (this.mainMaterial.isSame(materials[j])) {
                            materials[j] = this.newMat;
                            needsToUpdateMaterials = true;
                        }
                    }
                    // Our material list was provided as a copy, so if any materials were changed, we need to overwrite the visual's material list using our new version
                    if (needsToUpdateMaterials) {
                        visuals[i].materials = materials;
                    }
                }
            }
            else {
                this.newMat = this.mainMaterial;
            }
            const mainPass = this.newMat.mainPass;
            for (let i = 0; i < this.propertyNames.length; i++) {
                const propName = this.propertyNames[i];
                const propVal = mainPass[propName];
                const type = this.deduceStorageType(propVal);
                const newProp = StorageProperty_1.StorageProperty.forMaterialProperty(this.newMat, propName, type);
                this.storageProps.addProperty(newProp);
            }
        }
        deduceStorageType(propValue) {
            switch (typeof propValue) {
                case "number":
                    return StorageTypes_1.StorageTypes.float;
                case "boolean":
                    return StorageTypes_1.StorageTypes.bool;
                case "string":
                    return StorageTypes_1.StorageTypes.string;
                case "object":
                    if (propValue instanceof vec2) {
                        return StorageTypes_1.StorageTypes.vec2;
                    }
                    else if (propValue instanceof vec3) {
                        return StorageTypes_1.StorageTypes.vec3;
                    }
                    else if (propValue instanceof vec4) {
                        return StorageTypes_1.StorageTypes.vec4;
                    }
                    else if (propValue instanceof quat) {
                        return StorageTypes_1.StorageTypes.quat;
                    }
                    else if (propValue instanceof mat2) {
                        return StorageTypes_1.StorageTypes.mat2;
                    }
                    else if (propValue instanceof mat3) {
                        return StorageTypes_1.StorageTypes.mat3;
                    }
                    else if (propValue instanceof mat4) {
                        return StorageTypes_1.StorageTypes.mat4;
                    }
            }
        }
        /**
         * Returns a list of all Components of `componentType` found in the object and its descendents.
         * @param object - Object to search
         * @param componentType - Component type name to search for
         * @param results - Optional list to store results in
         * @returns An array of matching Components in `object` and descendants
         */
        getComponentsRecursive(object, componentType, results) {
            results = results || [];
            const components = object.getComponents(componentType);
            for (let i = 0; i < components.length; i++) {
                results.push(components[i]);
            }
            const childCount = object.getChildrenCount();
            for (let j = 0; j < childCount; j++) {
                this.getComponentsRecursive(object.getChild(j), componentType, results);
            }
            return results;
        }
    };
    __setFunctionName(_classThis, "SyncMaterials");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SyncMaterials = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SyncMaterials = _classThis;
})();
exports.SyncMaterials = SyncMaterials;
//# sourceMappingURL=SyncMaterials.js.map