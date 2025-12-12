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
exports.SyncRealtimeStore = void 0;
var __selfType = requireType("./SyncRealtimeStore");
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
const SyncEntity_1 = require("../Core/SyncEntity");
/**
 * Meant to be a very simple interface for a synced entity and its RealtimeStore.
 * It doesn’t do any behaviors on its own, so it can be used just for storing and retrieving synced values.
 */
let SyncRealtimeStore = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var SyncRealtimeStore = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.networkIdTypeString = this.networkIdTypeString;
            this.networkIdType = (0, NetworkIdType_1.networkIdFromString)(this.networkIdTypeString);
            this.customNetworkId = this.customNetworkId;
            this.ownershipTypeString = this.ownershipTypeString;
            this.shouldRequestOwnership = this.ownershipTypeString === "requestIfAvailable";
            this.syncEntity = new SyncEntity_1.SyncEntity(this, null, this.shouldRequestOwnership, null, new NetworkIdTools_1.NetworkIdOptions(this.networkIdType, this.customNetworkId));
            this.onStoreCreated = this.syncEntity.storeCallbacks.onStoreCreated;
            this.onStoreUpdated = this.syncEntity.storeCallbacks.onStoreUpdated;
            this.onStoreOwnershipUpdated = this.syncEntity.storeCallbacks.onStoreOwnershipUpdated;
            this.onStoreDeleted = this.syncEntity.storeCallbacks.onStoreDeleted;
            this.onSetupFinished = this.syncEntity.onSetupFinished;
            this.onOwnerUpdated = this.syncEntity.onOwnerUpdated;
        }
        __initialize() {
            super.__initialize();
            this.networkIdTypeString = this.networkIdTypeString;
            this.networkIdType = (0, NetworkIdType_1.networkIdFromString)(this.networkIdTypeString);
            this.customNetworkId = this.customNetworkId;
            this.ownershipTypeString = this.ownershipTypeString;
            this.shouldRequestOwnership = this.ownershipTypeString === "requestIfAvailable";
            this.syncEntity = new SyncEntity_1.SyncEntity(this, null, this.shouldRequestOwnership, null, new NetworkIdTools_1.NetworkIdOptions(this.networkIdType, this.customNetworkId));
            this.onStoreCreated = this.syncEntity.storeCallbacks.onStoreCreated;
            this.onStoreUpdated = this.syncEntity.storeCallbacks.onStoreUpdated;
            this.onStoreOwnershipUpdated = this.syncEntity.storeCallbacks.onStoreOwnershipUpdated;
            this.onStoreDeleted = this.syncEntity.storeCallbacks.onStoreDeleted;
            this.onSetupFinished = this.syncEntity.onSetupFinished;
            this.onOwnerUpdated = this.syncEntity.onOwnerUpdated;
        }
        /**
         * @returns True if the store is ready
         */
        isStoreReady() {
            return this.syncEntity.isSetupFinished;
        }
        /**
         * @returns The data store backing this entity
         */
        getStore() {
            return this.syncEntity.currentStore;
        }
        /**
         * @returns The store owner's user info
         */
        getStoreOwnerInfo() {
            return this.syncEntity.ownerInfo;
        }
        /**
         * @returns True if the current user can modify the store
         */
        canIModifyStore() {
            return this.syncEntity.canIModifyStore();
        }
        /**
         * @returns True if the store is owned by the current user
         */
        doIOwnStore() {
            return this.syncEntity.doIOwnStore();
        }
        /**
         * @returns True if the store is owned by any user
         */
        isStoreOwned() {
            return this.syncEntity.isStoreOwned();
        }
        /**
         * @param storageProperty - The storage property to add to the entity
         * @returns The storage property that was added
         */
        addStorageProperty(storageProperty) {
            return this.syncEntity.addStorageProperty(storageProperty);
        }
    };
    __setFunctionName(_classThis, "SyncRealtimeStore");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SyncRealtimeStore = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SyncRealtimeStore = _classThis;
})();
exports.SyncRealtimeStore = SyncRealtimeStore;
//# sourceMappingURL=SyncRealtimeStore.js.map