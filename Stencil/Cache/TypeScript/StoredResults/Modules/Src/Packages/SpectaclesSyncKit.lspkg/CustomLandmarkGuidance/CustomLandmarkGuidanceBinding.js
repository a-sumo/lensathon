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
exports.CustomLandmarkGuidanceBinding = void 0;
var __selfType = requireType("./CustomLandmarkGuidanceBinding");
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
const SessionController_1 = require("../Core/SessionController");
const SyncKitLogger_1 = require("../Utils/SyncKitLogger");
const GuidanceCopy_1 = require("./GuidanceCopy");
const SimplifiedLandmarkGuidance_1 = require("./SimplifiedLandmarkGuidance");
let CustomLandmarkGuidanceBinding = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var CustomLandmarkGuidanceBinding = _classThis = class extends _classSuper {
        constructor() {
            super();
            // Guidance
            this.guidanceRoot = this.guidanceRoot;
            this.guidanceText = this.guidanceText;
            this.arrow = this.arrow;
            // Troubleshooting
            this.troubleshootingRoot = this.troubleshootingRoot;
            this.titleText = this.titleText;
            this.bullet1Title = this.bullet1Title;
            this.bullet1Copy = this.bullet1Copy;
            this.bullet2Title = this.bullet2Title;
            this.bullet2Copy = this.bullet2Copy;
            this.bullet3Title = this.bullet3Title;
            this.bullet3Copy = this.bullet3Copy;
            this.bullet4Title = this.bullet4Title;
            this.bullet4Copy = this.bullet4Copy;
            this.keepLookingButton = this.keepLookingButton;
            // Success
            this.successRoot = this.successRoot;
            this.successText = this.successText;
            this.guidanceTimeoutMs = this.guidanceTimeoutMs;
            this.successVisibleMs = this.successVisibleMs;
            this.log = new SyncKitLogger_1.SyncKitLogger("CustomLandmarkGuidanceBinding");
            this.isLocatedFlag = false;
            this.lastHasLocation = null;
            this.lastIsLocated = null;
        }
        __initialize() {
            super.__initialize();
            // Guidance
            this.guidanceRoot = this.guidanceRoot;
            this.guidanceText = this.guidanceText;
            this.arrow = this.arrow;
            // Troubleshooting
            this.troubleshootingRoot = this.troubleshootingRoot;
            this.titleText = this.titleText;
            this.bullet1Title = this.bullet1Title;
            this.bullet1Copy = this.bullet1Copy;
            this.bullet2Title = this.bullet2Title;
            this.bullet2Copy = this.bullet2Copy;
            this.bullet3Title = this.bullet3Title;
            this.bullet3Copy = this.bullet3Copy;
            this.bullet4Title = this.bullet4Title;
            this.bullet4Copy = this.bullet4Copy;
            this.keepLookingButton = this.keepLookingButton;
            // Success
            this.successRoot = this.successRoot;
            this.successText = this.successText;
            this.guidanceTimeoutMs = this.guidanceTimeoutMs;
            this.successVisibleMs = this.successVisibleMs;
            this.log = new SyncKitLogger_1.SyncKitLogger("CustomLandmarkGuidanceBinding");
            this.isLocatedFlag = false;
            this.lastHasLocation = null;
            this.lastIsLocated = null;
        }
        onAwake() {
            // Start hidden
            this.hideAll();
            // Bind lifecycle events here so OnStart actually fires
            this.createEvent("OnStartEvent").bind(() => this.onStart());
            this.createEvent("OnDestroyEvent").bind(() => this.onDestroy());
        }
        onStart() {
            // Instantiate controller first
            this.controller = new SimplifiedLandmarkGuidance_1.SimplifiedLandmarkGuidanceController({
                guidanceRoot: this.guidanceRoot,
                guidanceText: this.guidanceText,
                arrow: this.arrow,
                troubleshootingRoot: this.troubleshootingRoot,
                titleText: this.titleText,
                bullet1Title: this.bullet1Title,
                bullet1Copy: this.bullet1Copy,
                bullet2Title: this.bullet2Title,
                bullet2Copy: this.bullet2Copy,
                bullet3Title: this.bullet3Title,
                bullet3Copy: this.bullet3Copy,
                bullet4Title: this.bullet4Title,
                bullet4Copy: this.bullet4Copy,
                keepLookingButton: this.keepLookingButton,
                successRoot: this.successRoot,
                successText: this.successText
            }, {
                copy: GuidanceCopy_1.DefaultGuidanceCopy,
                guidanceTimeoutMs: this.guidanceTimeoutMs,
                successVisibleMs: this.successVisibleMs,
                initialGuidanceHoldMs: 2000
            });
            // Initial start always transitions into guidance (controller enforces 2s hold)
            const { hasLocation, isLocated } = this.readLocatedInputs();
            this.lastHasLocation = hasLocation;
            this.lastIsLocated = isLocated;
            this.controller.start();
        }
        onDestroy() {
            this.controller.stop();
        }
        readLocatedInputs() {
            const session = SessionController_1.SessionController.getInstance();
            const locatedAt = (session.getLocatedAtComponent && session.getLocatedAtComponent());
            const hasLocation = !!(locatedAt && locatedAt.location !== null);
            const isLocated = this.isLocatedFlag;
            return { hasLocation, isLocated };
        }
        hideAll() {
            if (this.guidanceRoot)
                this.guidanceRoot.enabled = false;
            if (this.troubleshootingRoot)
                this.troubleshootingRoot.enabled = false;
            if (this.successRoot)
                this.successRoot.enabled = false;
        }
    };
    __setFunctionName(_classThis, "CustomLandmarkGuidanceBinding");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CustomLandmarkGuidanceBinding = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CustomLandmarkGuidanceBinding = _classThis;
})();
exports.CustomLandmarkGuidanceBinding = CustomLandmarkGuidanceBinding;
//# sourceMappingURL=CustomLandmarkGuidanceBinding.js.map