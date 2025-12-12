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
exports.SetEnabledOnReady = void 0;
var __selfType = requireType("./SetEnabledOnReady");
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
const SessionController_1 = require("../../Core/SessionController");
const SyncEntity_1 = require("../../Core/SyncEntity");
/**
 * Enables or disables groups of SceneObjects based on the readiness of a SyncEntity, or
 * SessionController if SyncEntity is not set.
 * When this script first runs, if the SyncEntity or SessionController is not ready, objects in readyObjects
 * will be disabled, and objects in notReadyObjects will be enabled.
 * As soon as the SyncEntity or SessionController are ready (including when the script first runs),
 * objects in notReadyObjects will be disabled, and objects in readyObjects will be enabled.
 */
let SetEnabledOnReady = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var SetEnabledOnReady = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.targetTypeString = this.targetTypeString;
            this.syncEntityScript = this.syncEntityScript;
            this.readyObjects = this.readyObjects;
            this.notReadyObjects = this.notReadyObjects;
        }
        __initialize() {
            super.__initialize();
            this.targetTypeString = this.targetTypeString;
            this.syncEntityScript = this.syncEntityScript;
            this.readyObjects = this.readyObjects;
            this.notReadyObjects = this.notReadyObjects;
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
         * Updates the enabled state of the ready and not ready objects based on the readiness of the target.
         */
        updateReady() {
            const isReady = this.targetTypeString === "SyncEntity"
                ? this.syncEntity.isSetupFinished
                : SessionController_1.SessionController.getInstance().getIsReady();
            if (isReady) {
                this.setAllEnabled(this.notReadyObjects, false);
                this.setAllEnabled(this.readyObjects, true);
            }
            else {
                this.setAllEnabled(this.readyObjects, false);
                this.setAllEnabled(this.notReadyObjects, true);
            }
        }
        /**
         * Initializes the component by setting up the appropriate event listeners and updating the ready state.
         */
        init() {
            switch (this.targetTypeString) {
                case "SyncEntity":
                    this.syncEntity = SyncEntity_1.SyncEntity.getSyncEntityOnComponent(this.syncEntityScript);
                    this.syncEntity.onSetupFinished.add(() => this.updateReady());
                    this.updateReady();
                    break;
                case "NetworkRoot":
                    SessionController_1.SessionController.getInstance().notifyOnReady(() => this.updateReady());
                    this.updateReady();
                    break;
            }
        }
    };
    __setFunctionName(_classThis, "SetEnabledOnReady");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SetEnabledOnReady = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SetEnabledOnReady = _classThis;
})();
exports.SetEnabledOnReady = SetEnabledOnReady;
//# sourceMappingURL=SetEnabledOnReady.js.map