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
exports.ErrorMessageController = exports.ErrorMessageControllerComponent = exports.ErrorType = exports.TWEEN_DURATION_MILLISECONDS = void 0;
var __selfType = requireType("./ErrorMessageController");
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
const LSTween_1 = require("LSTween.lspkg/LSTween");
const Easing_1 = require("LSTween.lspkg/TweenJS/Easing");
const Singleton_1 = require("SpectaclesInteractionKit.lspkg/Decorators/Singleton");
const WorldCameraFinderProvider_1 = require("SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
const TAG = "ErrorMessageController";
// Constants for error display timing
exports.TWEEN_DURATION_MILLISECONDS = 300;
var ErrorType;
(function (ErrorType) {
    ErrorType["NoInternet"] = "no_internet";
    ErrorType["ConnectionFailed"] = "connection_failed";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
/**
 * Component that manages error message configuration and scene object references
 */
let ErrorMessageControllerComponent = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var ErrorMessageControllerComponent = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.noInternetErrorObject = this.noInternetErrorObject;
            this.connectionFailedErrorObject = this.connectionFailedErrorObject;
            this.errorDisplayContainer = this.errorDisplayContainer;
            this.defaultDistanceFromUser = this.defaultDistanceFromUser;
        }
        __initialize() {
            super.__initialize();
            this.noInternetErrorObject = this.noInternetErrorObject;
            this.connectionFailedErrorObject = this.connectionFailedErrorObject;
            this.errorDisplayContainer = this.errorDisplayContainer;
            this.defaultDistanceFromUser = this.defaultDistanceFromUser;
        }
        onAwake() {
            // Register this component with the singleton controller
            ErrorMessageController.getInstance().registerComponent(this);
        }
        getNoInternetErrorObject() {
            return this.noInternetErrorObject;
        }
        getConnectionFailedErrorObject() {
            return this.connectionFailedErrorObject;
        }
        getErrorDisplayContainer() {
            return this.errorDisplayContainer;
        }
        getDefaultDistanceFromUser() {
            return this.defaultDistanceFromUser;
        }
    };
    __setFunctionName(_classThis, "ErrorMessageControllerComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ErrorMessageControllerComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ErrorMessageControllerComponent = _classThis;
})();
exports.ErrorMessageControllerComponent = ErrorMessageControllerComponent;
/**
 * Singleton that handles error message logic and state management
 */
let ErrorMessageController = (() => {
    let _classDecorators = [Singleton_1.Singleton];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ErrorMessageController = _classThis = class {
        constructor() {
            this.component = null;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
            this.activeErrors = new Map();
            // Animation settings
            this.alertScale = new vec3(32, 32, 32); // scale when fully visible
            this.worldCamera = WorldCameraFinderProvider_1.default.getInstance();
        }
        /**
         * Register the component instance with this singleton
         */
        registerComponent(component) {
            if (this.component !== null) {
                throw new Error("ErrorMessageController: Attempted to register a second component. Only one ErrorMessageControllerComponent should exist in the scene.");
            }
            this.component = component;
            this.log.i("ErrorMessageController component registered");
        }
        /**
         * Show an error message
         * @param errorType - The type of error to show
         * @param parentObject - Optional parent object to attach the error to. If null, appears in front of user
         * @param timeout - Optional timeout in seconds. If null or undefined, shows indefinitely
         */
        showError(errorType, parentObject, timeout) {
            this.log.i(`Showing error: ${errorType}`);
            // If this error is already showing, don't hide it or re-animate
            if (this.activeErrors.has(errorType)) {
                this.log.i(`Error ${errorType} is already showing, keeping it up`);
                return;
            }
            // Get the appropriate object
            const errorObject = this.getObjectForError(errorType);
            if (isNull(errorObject)) {
                this.log.e(`No object configured for error type: ${errorType}`);
                return;
            }
            // Hide all other existing errors before showing this one
            this.hideErrors();
            // Store the original parent for restoration later
            const originalParent = errorObject.getParent();
            // Position the error
            if (parentObject) {
                errorObject.setParent(parentObject);
                // Keep local position/rotation from the source object
            }
            else {
                // Use the error display container which has Headlock and Billboard components
                const errorContainer = this.component.getErrorDisplayContainer();
                if (errorContainer) {
                    errorObject.setParent(errorContainer);
                    // Reset to local origin since the container handles positioning
                    errorObject.getTransform().setLocalPosition(vec3.zero());
                    errorObject.getTransform().setLocalRotation(quat.quatIdentity());
                }
                else {
                    // Fallback to original positioning if container is not available
                    if (originalParent && this.component) {
                        errorObject.setParent(this.component.getSceneObject());
                    }
                    this.positionInFrontOfUser(errorObject);
                }
            }
            // Store reference
            this.activeErrors.set(errorType, errorObject);
            // Animate in
            this.animateErrorIn(errorObject);
            // Schedule auto-hide if timeout is specified
            if (timeout !== undefined && timeout !== null) {
                this.scheduleAutoHide(errorType, timeout);
            }
        }
        /**
         * Hide all currently visible error messages
         */
        hideErrors() {
            this.log.i("Hiding all errors");
            // Create a copy of the keys to avoid modification during iteration
            const errorTypes = Array.from(this.activeErrors.keys());
            for (const errorType of errorTypes) {
                const errorObject = this.activeErrors.get(errorType);
                if (errorObject) {
                    // Animate out and disable
                    this.animateErrorOut(errorObject, () => {
                        errorObject.enabled = false;
                    });
                    // Remove from tracking
                    this.activeErrors.delete(errorType);
                }
            }
        }
        /**
         * Hide all currently visible errors (alias for hideErrors)
         */
        hideAllErrors() {
            this.hideErrors();
        }
        /**
         * Check if a specific error is currently visible
         */
        isErrorVisible(errorType) {
            return this.activeErrors.has(errorType);
        }
        getObjectForError(errorType) {
            if (!this.component) {
                this.log.e("Component not registered");
                return null;
            }
            switch (errorType) {
                case ErrorType.NoInternet:
                    return this.component.getNoInternetErrorObject();
                case ErrorType.ConnectionFailed:
                    return this.component.getConnectionFailedErrorObject();
                default:
                    this.log.e(`Unknown error type: ${errorType}`);
                    return null;
            }
        }
        positionInFrontOfUser(errorObject) {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            const head = this.worldCamera.getTransform().getWorldPosition();
            const forward = this.worldCamera.getTransform().forward;
            forward.y = 0; // Keep on same vertical level as user
            const position = forward.normalize().uniformScale(-this.component.getDefaultDistanceFromUser());
            const errorTransform = errorObject.getTransform();
            errorTransform.setWorldPosition(head.add(position));
            errorTransform.setWorldRotation(quat.lookAt(position.uniformScale(-1), vec3.up()));
        }
        animateErrorIn(errorObject) {
            const errorTransform = errorObject.getTransform();
            // Start at scale 1 and animate to alert scale
            errorTransform.setLocalScale(vec3.one());
            errorObject.enabled = true;
            LSTween_1.LSTween.scaleToLocal(errorTransform, this.alertScale, exports.TWEEN_DURATION_MILLISECONDS)
                .easing(Easing_1.default.Cubic.InOut)
                .start();
        }
        animateErrorOut(errorObject, onComplete) {
            const errorTransform = errorObject.getTransform();
            LSTween_1.LSTween.scaleToLocal(errorTransform, vec3.zero(), exports.TWEEN_DURATION_MILLISECONDS)
                .easing(Easing_1.default.Cubic.InOut)
                .onComplete(() => {
                errorObject.enabled = false;
                onComplete();
            })
                .start();
        }
        scheduleAutoHide(errorType, timeout) {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            const delayEvent = this.component.createEvent("DelayedCallbackEvent");
            delayEvent.bind(() => {
                this.hideErrors();
            });
            delayEvent.reset(timeout);
        }
    };
    __setFunctionName(_classThis, "ErrorMessageController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ErrorMessageController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ErrorMessageController = _classThis;
})();
exports.ErrorMessageController = ErrorMessageController;
// Export for JavaScript compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;
global.errorMessageController = ErrorMessageController.getInstance();
//# sourceMappingURL=ErrorMessageController.js.map