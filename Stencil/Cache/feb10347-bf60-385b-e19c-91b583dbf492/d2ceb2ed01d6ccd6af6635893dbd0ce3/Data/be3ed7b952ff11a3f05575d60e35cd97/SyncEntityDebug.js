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
exports.SyncEntityDebug = void 0;
var __selfType = requireType("./SyncEntityDebug");
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
const NetworkUtils_1 = require("../../Core/NetworkUtils");
const SessionController_1 = require("../../Core/SessionController");
const SyncEntity_1 = require("../../Core/SyncEntity");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
/**
 * Used to display helpful debugging information about a SyncEntity.
 */
let SyncEntityDebug = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var SyncEntityDebug = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.targetTypeString = this.targetTypeString;
            this.syncEntityScript = this.syncEntityScript;
            this.networkIdText = this.networkIdText;
            this.ownerDisplayNameText = this.ownerDisplayNameText;
            this.ownershipButton = this.ownershipButton;
            this.ownerIdText = this.ownerIdText;
            this.storagePropertyText = this.storagePropertyText;
            this.log = new SyncKitLogger_1.SyncKitLogger(SyncEntityDebug.name);
        }
        __initialize() {
            super.__initialize();
            this.targetTypeString = this.targetTypeString;
            this.syncEntityScript = this.syncEntityScript;
            this.networkIdText = this.networkIdText;
            this.ownerDisplayNameText = this.ownerDisplayNameText;
            this.ownershipButton = this.ownershipButton;
            this.ownerIdText = this.ownerIdText;
            this.storagePropertyText = this.storagePropertyText;
            this.log = new SyncKitLogger_1.SyncKitLogger(SyncEntityDebug.name);
        }
        onAwake() {
            // We use OnStartEvent to ensure that the SyncEntity has been fully initialized
            this.createEvent("OnStartEvent").bind(() => this.init());
        }
        /**
         * @param textComponent - The Text component to update
         * @param text - The text to set
         */
        textHelper(textComponent, text) {
            if (!isNull(textComponent)) {
                textComponent.text = String(text);
            }
        }
        /**
         * @param ownerInfo - The new owner info
         */
        updateOwnerText(ownerInfo) {
            this.textHelper(this.ownerIdText, "id: " + ((ownerInfo && ownerInfo.connectionId) || "<unowned>"));
            this.textHelper(this.ownerDisplayNameText, (ownerInfo && ownerInfo.displayName) || "<unowned>");
        }
        /**
         * @param networkId - The new network id
         */
        updateNetworkId(networkId) {
            this.textHelper(this.networkIdText, "id: " + networkId);
        }
        /**
         * @param object - The object to get the hierarchy path for
         * @returns The hierarchy path
         */
        getHierarchyPath(object) {
            const path = object.name;
            if (object.hasParent()) {
                return this.getHierarchyPath(object.getParent()) + "/" + path;
            }
            return path;
        }
        /**
         * @param lastKeyChanged - The last key changed
         */
        updateStorageText(lastKeyChanged) {
            if (!this.storagePropertyText) {
                return;
            }
            let txt = "";
            if (this.syncEntity && !this.syncEntity.destroyed && !isNull(this.syncEntity.localScript)) {
                txt += this.getHierarchyPath(this.syncEntity.localScript.getSceneObject()) + "\n";
            }
            txt += "----Storage----\n";
            const propertySet = this.syncEntity.propertySet;
            const allValues = {};
            const pendingValues = {};
            const currentOrPendingValues = {};
            if (this.syncEntity.currentStore) {
                const allKeys = this.syncEntity.currentStore.getAllKeys();
                for (let i = 0; i < allKeys.length; i++) {
                    const key = allKeys[i];
                    if (key === NetworkUtils_1.NETWORK_ID_KEY) {
                        continue;
                        // allValues[key] = syncEntity.currentStore.getString(key);
                    }
                    if (key === NetworkUtils_1.NETWORK_TYPE_KEY) {
                        allValues[key] = this.syncEntity.currentStore.getString(key);
                    }
                    allValues[key] = null;
                }
            }
            else {
                txt += "[No RealtimeStore connected]\n";
            }
            if (propertySet.storageProperties) {
                const keys = Object.keys(propertySet.storageProperties);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const prop = propertySet.storageProperties[key];
                    allValues[key] = prop.currentValue;
                    if (prop.pendingValue !== null && prop.pendingValue !== undefined) {
                        pendingValues[key] = prop.pendingValue;
                    }
                    if (prop.currentOrPendingValue !== null && prop.currentOrPendingValue !== undefined) {
                        currentOrPendingValues[key] = prop.currentOrPendingValue;
                    }
                }
            }
            const keys = Object.keys(allValues);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === lastKeyChanged) {
                    txt += "*";
                }
                const valueText = allValues[key] === null || allValues[key] === undefined ? "?" : allValues[key];
                txt += key + ": " + valueText;
                if (key in pendingValues) {
                    txt += "  [pen]: " + pendingValues[key];
                }
                if (key in currentOrPendingValues) {
                    txt += "  [cur/pen]: " + currentOrPendingValues[key];
                }
                txt += "\n";
            }
            this.textHelper(this.storagePropertyText, txt);
        }
        onOwnershipButtonPressed() {
            if (this.syncEntity.doIOwnStore()) {
                SessionController_1.SessionController.getInstance()
                    .getSession()
                    .clearRealtimeStoreOwnership(this.syncEntity.currentStore, () => {
                    this.log.i(`Ownership cleared for ${SessionController_1.SessionController.getInstance().getLocalUserName()}`);
                }, (error) => {
                    this.log.e("Error clearing ownership: " + error);
                });
            }
            else {
                SessionController_1.SessionController.getInstance()
                    .getSession()
                    .requestRealtimeStoreOwnership(this.syncEntity.currentStore, () => {
                    this.log.i(`Ownership gained for ${SessionController_1.SessionController.getInstance().getLocalUserName()}`);
                }, (error) => {
                    this.log.e("Error requesting ownership: " + error);
                });
            }
        }
        init() {
            switch (this.targetTypeString) {
                case "SyncEntity":
                    this.syncEntity = SyncEntity_1.SyncEntity.getSyncEntityOnComponent(this.syncEntityScript);
                    this.syncEntity.onOwnerUpdated.add((ownerInfo) => this.updateOwnerText(ownerInfo));
                    this.updateNetworkId(this.syncEntity.networkId);
                    this.updateOwnerText(this.syncEntity.ownerInfo);
                    this.updateStorageText(null);
                    this.syncEntity.notifyOnReady(() => {
                        this.updateNetworkId(this.syncEntity.networkId);
                        this.updateOwnerText(this.syncEntity.ownerInfo);
                        this.updateStorageText(null);
                        if (this.ownershipButton) {
                            this.ownershipButton.onButtonPinched.add(() => this.onOwnershipButtonPressed());
                        }
                    });
                    this.syncEntity.storeCallbacks.onStoreUpdated.add((_session, _store, key) => {
                        this.updateStorageText(key);
                    });
                    break;
                case "NetworkRoot":
                    this.networkRoot = (0, NetworkUtils_1.findNetworkRoot)(this.getSceneObject());
                    if (this.networkRoot) {
                        this.updateOwnerText(this.networkRoot.ownerInfo);
                        this.updateNetworkId(this.networkRoot.networkId);
                        if (this.storagePropertyText) {
                            this.storagePropertyText.getSceneObject().enabled = false;
                        }
                        if (this.ownershipButton) {
                            this.ownershipButton.getSceneObject().enabled = false;
                        }
                    }
                    break;
            }
        }
    };
    __setFunctionName(_classThis, "SyncEntityDebug");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SyncEntityDebug = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SyncEntityDebug = _classThis;
})();
exports.SyncEntityDebug = SyncEntityDebug;
//# sourceMappingURL=SyncEntityDebug.js.map