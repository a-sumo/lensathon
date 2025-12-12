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
exports.SetEnabledIfOwner = void 0;
var __selfType = requireType("./SetEnabledIfOwner");
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
/**
 * Enables or disables groups of SceneObjects whenever ownership of the SyncEntity changes.
 * When the SyncEntity becomes owned by the local user, the objects in nonOwnerObjects become disabled, and
 * objects in ownerObjects become enabled.
 * When the SyncEntity becomes not owned by the local user, the objects in ownerObjects become disabled, and
 * objects in nonOwnerObjects become enabled.
 */
let SetEnabledIfOwner = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var SetEnabledIfOwner = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.targetTypeString = this.targetTypeString;
            this.syncEntityScript = this.syncEntityScript;
            this.ownerObjects = this.ownerObjects;
            this.nonOwnerObjects = this.nonOwnerObjects;
        }
        __initialize() {
            super.__initialize();
            this.targetTypeString = this.targetTypeString;
            this.syncEntityScript = this.syncEntityScript;
            this.ownerObjects = this.ownerObjects;
            this.nonOwnerObjects = this.nonOwnerObjects;
        }
        onAwake() {
            this.createEvent("OnStartEvent").bind(() => this.init());
        }
        /**
         * Sets the enabled state of all objects in the array.
         * @param objects - The array of SceneObjects.
         * @param enabled - The enabled state to set.
         */
        setAllEnabled(objects, enabled) {
            for (let i = 0; i < objects.length; i++) {
                objects[i].enabled = enabled;
            }
        }
        /**
         * Updates the enabled state of the owner and non-owner objects based on the ownership of the target.
         * @param ownerInfo - Information about the owner.
         */
        updateOwner(ownerInfo) {
            const isOwner = SessionController_1.SessionController.getInstance().isLocalUserConnection(ownerInfo);
            if (isOwner) {
                this.setAllEnabled(this.nonOwnerObjects, false);
                this.setAllEnabled(this.ownerObjects, true);
            }
            else {
                this.setAllEnabled(this.ownerObjects, false);
                this.setAllEnabled(this.nonOwnerObjects, true);
            }
        }
        /**
         * Initializes the component by setting up the appropriate event listeners and updating the ownership state.
         */
        init() {
            switch (this.targetTypeString) {
                case "SyncEntity":
                    this.syncEntity = SyncEntity_1.SyncEntity.getSyncEntityOnComponent(this.syncEntityScript);
                    this.syncEntity.onOwnerUpdated.add(this.updateOwner);
                    this.updateOwner(this.syncEntity.ownerInfo);
                    break;
                case "NetworkRoot":
                    this.networkRoot = (0, NetworkUtils_1.findNetworkRoot)(this.getSceneObject());
                    if (this.networkRoot) {
                        this.updateOwner(this.networkRoot.ownerInfo);
                    }
                    break;
            }
        }
    };
    __setFunctionName(_classThis, "SetEnabledIfOwner");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SetEnabledIfOwner = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SetEnabledIfOwner = _classThis;
})();
exports.SetEnabledIfOwner = SetEnabledIfOwner;
//# sourceMappingURL=SetEnabledIfOwner.js.map