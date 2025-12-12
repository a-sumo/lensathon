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
exports.StartModeController = exports.StartModeControllerComponent = exports.StartMode = void 0;
var __selfType = requireType("./StartModeController");
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
const AutoStartController_1 = require("./AutoStartController");
const ErrorMessageController_1 = require("./ErrorMessageController");
const TAG = "StartModeController";
var StartMode;
(function (StartMode) {
    StartMode["Menu"] = "START_MENU";
    StartMode["Multiplayer"] = "MULTIPLAYER";
    StartMode["Off"] = "OFF";
})(StartMode || (exports.StartMode = StartMode = {}));
/**
 * Component that manages start mode configuration
 */
let StartModeControllerComponent = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var StartModeControllerComponent = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.startMenu = this.startMenu;
            this.autoStartController = this.autoStartController;
        }
        __initialize() {
            super.__initialize();
            this.startMenu = this.startMenu;
            this.autoStartController = this.autoStartController;
        }
        onAwake() {
            this.createEvent("OnStartEvent").bind(() => this.onStart());
        }
        onStart() {
            // Register this component with the singleton controller
            StartModeController.getInstance().registerComponent(this);
        }
    };
    __setFunctionName(_classThis, "StartModeControllerComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StartModeControllerComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StartModeControllerComponent = _classThis;
})();
exports.StartModeControllerComponent = StartModeControllerComponent;
/**
 * Singleton that handles start mode logic and state management
 */
let StartModeController = (() => {
    let _classDecorators = [Singleton_1.Singleton];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var StartModeController = _classThis = class {
        constructor() {
            this.component = null;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
        }
        /**
         * Register the component instance with this singleton
         */
        registerComponent(component) {
            if (this.component !== null) {
                throw new Error("StartModeController: Attempted to register a second component. Only one StartModeControllerComponent should exist in the scene.");
            }
            this.component = component;
            this.log.i("StartModeController component registered");
            const sessionController = SessionController_1.SessionController.getInstance();
            const startMode = sessionController.getStartMode();
            this.log.i(`Start Mode Controller initialized with mode: ${startMode}`);
            // Check if started as multiplayer via launch params - this overrides the configured mode
            if (this.checkIfStartedAsMultiplayer()) {
                this.startMultiplayer();
                return;
            }
            // Handle the different auto-start modes
            switch (startMode) {
                case StartMode.Menu:
                    this.startWithMenu();
                    break;
                case StartMode.Multiplayer:
                    this.startMultiplayer();
                    break;
                case StartMode.Off:
                    this.log.i("Auto-start disabled.");
                    break;
            }
        }
        /**
         * Show the start menu
         */
        startWithMenu() {
            ErrorMessageController_1.ErrorMessageController.getInstance().hideAllErrors();
            this.log.i("Showing start menu");
            this.component.startMenu.show();
        }
        /**
         * Start without menu using AutoStartController for retry logic
         */
        startMultiplayer() {
            if (!this.component) {
                this.log.e("Component not registered");
                return;
            }
            this.log.i("Starting without menu - using AutoStartController for retry logic");
            this.component.startMenu.hide();
            // Set up the callback for the AutoStartController
            const autoStartController = AutoStartController_1.AutoStartController.getInstance();
            autoStartController.setStartMultiplayerCallback(() => {
                SessionController_1.SessionController.getInstance().init();
            });
            // Start multiplayer with retry logic
            autoStartController.startMultiplayerWithRetry();
        }
        /**
         * If the systemUI has requested that the lens launch directly into multiplayer mode,
         * immediately dismiss this menu and initialize the Spectacles Sync Kit.
         */
        checkIfStartedAsMultiplayer() {
            const shouldStartMultiplayer = global.launchParams.getBool("StartMultiplayer");
            this.log.i(`Lens started as multiplayer: ${shouldStartMultiplayer}`);
            return shouldStartMultiplayer;
        }
        /**
         * Get the current auto-start mode
         */
        getAutoStartMode() {
            const sessionController = SessionController_1.SessionController.getInstance();
            const startMode = sessionController.getStartMode();
            // If started as multiplayer via launch params, always behave like AutoStart mode
            if (this.checkIfStartedAsMultiplayer()) {
                return StartMode.Multiplayer;
            }
            return startMode;
        }
        /**
         * Check if the start mode should be shown based on current mode and conditions
         */
        shouldShowStartMenu() {
            const sessionController = SessionController_1.SessionController.getInstance();
            const startMode = sessionController.getStartMode();
            return startMode == StartMode.Menu;
        }
    };
    __setFunctionName(_classThis, "StartModeController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StartModeController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StartModeController = _classThis;
})();
exports.StartModeController = StartModeController;
// Export for JavaScript compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;
global.startMenuController = StartModeController.getInstance();
//# sourceMappingURL=StartModeController.js.map