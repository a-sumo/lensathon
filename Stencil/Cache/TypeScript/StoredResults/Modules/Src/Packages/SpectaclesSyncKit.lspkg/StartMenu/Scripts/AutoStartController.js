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
exports.AutoStartController = exports.AutoStartControllerComponent = void 0;
var __selfType = requireType("./AutoStartController");
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
const Singleton_1 = require("SpectaclesInteractionKit.lspkg/Decorators/Singleton");
const SessionController_1 = require("../../Core/SessionController");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
const ErrorMessageController_1 = require("./ErrorMessageController");
const TAG = "AutoStartController";
// Retry configuration constants for server-side connection errors
const INITIAL_RETRY_DELAY = 5.0; // seconds - starting delay between retry attempts
const BACKOFF_MULTIPLIER = 2.0; // multiplier - exponential backoff factor (1s → 2s → 4s → 8s...)
const MAX_RETRY_DELAY = 30.0; // seconds - maximum delay between retry attempts
const MAX_RETRIES = 5; // count - maximum number of retry attempts before giving up
// Fast retry configuration for internet connectivity checks (local API, no server risk)
const INTERNET_CHECK_RETRY_DELAY = 0.5; // seconds - fast retry interval for internet checks
/**
 * Component that manages auto-start configuration
 */
let AutoStartControllerComponent = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var AutoStartControllerComponent = _classThis = class extends _classSuper {
        constructor() {
            super();
        }
        __initialize() {
            super.__initialize();
        }
        onAwake() {
            // Register this component with the singleton controller
            AutoStartController.getInstance().registerComponent(this);
        }
    };
    __setFunctionName(_classThis, "AutoStartControllerComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AutoStartControllerComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AutoStartControllerComponent = _classThis;
})();
exports.AutoStartControllerComponent = AutoStartControllerComponent;
/**
 * Singleton that handles auto-start logic with retry mechanisms
 */
let AutoStartController = (() => {
    let _classDecorators = [Singleton_1.Singleton];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AutoStartController = _classThis = class {
        constructor() {
            this.component = null;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
            this.retryCount = 0;
            this.retryTimeoutEvent = null;
            this.internetRetryTimeoutEvent = null;
            this.onStartMultiplayerCallback = null;
            this.currentRetryDelay = INITIAL_RETRY_DELAY;
        }
        /**
         * Register the component instance with this singleton
         */
        registerComponent(component) {
            if (this.component !== null) {
                throw new Error("AutoStartController: Attempted to register a second component. Only one AutoStartControllerComponent should exist in the scene.");
            }
            this.component = component;
            // Set up connection failure handling for auto-reconnection
            this.setupConnectionHandlers();
            this.log.i("AutoStartController component registered");
        }
        /**
         * Set up connection event handlers for auto-retry logic
         */
        setupConnectionHandlers() {
            // Subscribe to connection failures for auto-reconnection
            SessionController_1.SessionController.getInstance().onConnectionFailed.add((code, description) => {
                if (code !== "CancelledByUser") {
                    ErrorMessageController_1.ErrorMessageController.getInstance().showError(ErrorMessageController_1.ErrorType.ConnectionFailed); // Show indefinitely for auto-connect
                    this.log.w(`Connection failed (${code}): ${description}, attempting auto-reconnect`);
                    this.scheduleRetry();
                }
            });
            // Subscribe to successful connections to hide errors and reset retry state
            SessionController_1.SessionController.getInstance().onConnected.add(() => {
                ErrorMessageController_1.ErrorMessageController.getInstance().hideErrors();
                this.resetRetryState();
            });
        }
        /**
         * Set the callback function to be called when starting multiplayer
         */
        setStartMultiplayerCallback(callback) {
            this.onStartMultiplayerCallback = callback;
        }
        /**
         * Start multiplayer session directly with retry logic
         */
        startMultiplayerWithRetry() {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            this.startMultiplayerWithBackoff();
        }
        /**
         * Start multiplayer with internet connectivity check and backoff
         */
        startMultiplayerWithBackoff() {
            if (!global.deviceInfoSystem.isInternetAvailable()) {
                this.log.w("No internet available for auto-start, showing error and retrying quickly");
                ErrorMessageController_1.ErrorMessageController.getInstance().showError(ErrorMessageController_1.ErrorType.NoInternet); // Show indefinitely for auto-connect
                this.scheduleInternetRetry();
                return;
            }
            // Hide any existing errors before starting multiplayer
            ErrorMessageController_1.ErrorMessageController.getInstance().hideErrors();
            this.startMultiplayer();
        }
        /**
         * Start multiplayer session
         */
        startMultiplayer() {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            this.log.i("Starting multiplayer session via auto-start");
            this.resetRetryState();
            // Call the callback if set, otherwise default to SessionController.init()
            if (this.onStartMultiplayerCallback) {
                this.onStartMultiplayerCallback();
            }
            else {
                SessionController_1.SessionController.getInstance().init();
            }
        }
        /**
         * Schedule a retry attempt with exponential backoff
         */
        scheduleRetry() {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            if (this.retryCount >= MAX_RETRIES) {
                this.log.e(`Max retries (${MAX_RETRIES}) reached, showing connection failed error`);
                ErrorMessageController_1.ErrorMessageController.getInstance().showError(ErrorMessageController_1.ErrorType.ConnectionFailed); // Show indefinitely for auto-connect
                return;
            }
            this.retryCount++;
            this.log.i(`Scheduling retry ${this.retryCount}/${MAX_RETRIES} in ${this.currentRetryDelay} seconds`);
            // Clear any existing retry timeout
            if (this.retryTimeoutEvent) {
                this.component.removeEvent(this.retryTimeoutEvent);
            }
            // Schedule the retry
            this.retryTimeoutEvent = this.component.createEvent("DelayedCallbackEvent");
            this.retryTimeoutEvent.bind(() => {
                this.log.i(`Attempting retry ${this.retryCount}/${MAX_RETRIES}`);
                this.startMultiplayerWithBackoff();
            });
            this.retryTimeoutEvent.reset(this.currentRetryDelay);
            // Calculate next retry delay with exponential backoff
            this.currentRetryDelay = Math.min(this.currentRetryDelay * BACKOFF_MULTIPLIER, MAX_RETRY_DELAY);
        }
        /**
         * Schedule a fast retry for internet connectivity checks (500ms interval)
         */
        scheduleInternetRetry() {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            this.log.i(`Scheduling internet connectivity retry in ${INTERNET_CHECK_RETRY_DELAY} seconds`);
            // Clear any existing internet retry timeout
            if (this.internetRetryTimeoutEvent) {
                this.component.removeEvent(this.internetRetryTimeoutEvent);
            }
            // Schedule the fast internet retry
            this.internetRetryTimeoutEvent = this.component.createEvent("DelayedCallbackEvent");
            this.internetRetryTimeoutEvent.bind(() => {
                this.log.i("Checking internet connectivity again");
                this.startMultiplayerWithBackoff();
            });
            this.internetRetryTimeoutEvent.reset(INTERNET_CHECK_RETRY_DELAY);
        }
        /**
         * Reset retry state (called when connection succeeds)
         */
        resetRetryState() {
            this.retryCount = 0;
            this.currentRetryDelay = INITIAL_RETRY_DELAY;
            // Clear both retry timers
            if (this.retryTimeoutEvent && this.component) {
                this.component.removeEvent(this.retryTimeoutEvent);
                this.retryTimeoutEvent = null;
            }
            if (this.internetRetryTimeoutEvent && this.component) {
                this.component.removeEvent(this.internetRetryTimeoutEvent);
                this.internetRetryTimeoutEvent = null;
            }
        }
        /**
         * Check if currently retrying connections (either type)
         */
        isRetrying() {
            return this.retryCount > 0 || this.internetRetryTimeoutEvent !== null;
        }
        /**
         * Get current retry count
         */
        getRetryCount() {
            return this.retryCount;
        }
        /**
         * Stop any ongoing retry attempts
         */
        stopRetrying() {
            this.resetRetryState();
            ErrorMessageController_1.ErrorMessageController.getInstance().hideErrors();
        }
    };
    __setFunctionName(_classThis, "AutoStartController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AutoStartController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AutoStartController = _classThis;
})();
exports.AutoStartController = AutoStartController;
// Export for JavaScript compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;
global.autoStartController = AutoStartController.getInstance();
//# sourceMappingURL=AutoStartController.js.map