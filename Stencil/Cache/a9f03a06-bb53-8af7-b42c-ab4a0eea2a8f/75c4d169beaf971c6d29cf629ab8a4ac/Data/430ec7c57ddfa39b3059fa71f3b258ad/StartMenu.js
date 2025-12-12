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
exports.StartMenu = void 0;
var __selfType = requireType("./StartMenu");
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
const WorldCameraFinderProvider_1 = require("SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider");
const SessionController_1 = require("../../Core/SessionController");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
const ErrorMessageController_1 = require("./ErrorMessageController");
const StartModeController_1 = require("./StartModeController");
const TAG = "StartMenu";
const ERROR_DURATION_SECONDS = 4; // seconds
let StartMenu = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var StartMenu = _classThis = class extends _classSuper {
        __initialize() {
            super.__initialize();
            this.singlePlayerButton = this.singlePlayerButton;
            this.multiPlayerButton = this.multiPlayerButton;
            this.startMenuDistanceFromUser = this.startMenuDistanceFromUser;
            this.singlePlayerType = this.singlePlayerType;
            this.enableOnSingleplayerNodes = this.enableOnSingleplayerNodes;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
            this.worldCamera = WorldCameraFinderProvider_1.default.getInstance();
            this.startMenuTransform = this.sceneObject.getTransform();
            this.createEvent("OnStartEvent").bind(() => this.onStart());
        }
        constructor() {
            super();
            this.singlePlayerButton = this.singlePlayerButton;
            this.multiPlayerButton = this.multiPlayerButton;
            this.startMenuDistanceFromUser = this.startMenuDistanceFromUser;
            this.singlePlayerType = this.singlePlayerType;
            this.enableOnSingleplayerNodes = this.enableOnSingleplayerNodes;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
            this.worldCamera = WorldCameraFinderProvider_1.default.getInstance();
            this.startMenuTransform = this.sceneObject.getTransform();
            this.createEvent("OnStartEvent").bind(() => this.onStart());
        }
        onStart() {
            // Re-enable the start menu if the connection fails
            SessionController_1.SessionController.getInstance().onConnectionFailed.add((code, description) => {
                // Intentional cancellation and errors use the same callback, so we need to check the code
                if (code !== "CancelledByUser") {
                    this.log.w(`Connection failed (${code}): ${description}, showing error alert`);
                    ErrorMessageController_1.ErrorMessageController.getInstance().showError(ErrorMessageController_1.ErrorType.ConnectionFailed, this.getSceneObject(), ERROR_DURATION_SECONDS);
                }
                else {
                    this.log.i("Connection cancelled by user, not showing error alert");
                }
                // Only re-enable the start menu if we're in Menu mode
                // Auto-start mode handles failures with retries, not by showing the menu
                const controller = StartModeController_1.StartModeController.getInstance();
                if (controller.getAutoStartMode() === StartModeController_1.StartMode.Menu) {
                    this.getSceneObject().enabled = true;
                    this.setStartMenuInFrontOfUser();
                }
            });
            this.setStartMenuInFrontOfUser();
            // Connect to the new button events using BaseButton's onTriggerUp
            this.singlePlayerButton.onTriggerUp.add(() => this.onSinglePlayerPress());
            this.multiPlayerButton.onTriggerUp.add(() => this.onMultiPlayerPress());
        }
        /**
         * Handle multiplayer button press with internet connectivity check
         */
        onMultiPlayerPress() {
            this.log.i("Multiplayer button pressed");
            if (!global.deviceInfoSystem.isInternetAvailable()) {
                this.log.w("No internet available, showing alert");
                ErrorMessageController_1.ErrorMessageController.getInstance().showError(ErrorMessageController_1.ErrorType.NoInternet, this.getSceneObject(), ERROR_DURATION_SECONDS);
            }
            else {
                this.startMultiplayerSession();
            }
        }
        /**
         * Start the game in single player mode by hiding this menu.
         */
        onSinglePlayerPress() {
            switch (this.singlePlayerType) {
                case "mocked_online":
                    SessionController_1.SessionController.getInstance().prepareOfflineMode();
                    this.enableOnSingleplayerNodes.forEach((node) => {
                        node.enabled = true;
                    });
                    this.startMultiplayerSession();
                    break;
                case "manual":
                default:
                    this.enableOnSingleplayerNodes.forEach((node) => {
                        node.enabled = true;
                    });
                    this.getSceneObject().enabled = false;
                    break;
            }
        }
        /**
         * Start the session by initializing the Spectacles Sync Kit, and hiding this menu.
         */
        startMultiplayerSession() {
            this.log.i("Starting session");
            this.getSceneObject().enabled = false;
            SessionController_1.SessionController.getInstance().init();
        }
        /**
         * Public method to start multiplayer session (called by StartMenuController)
         */
        startMultiplayer() {
            this.startMultiplayerSession();
        }
        /**
         * Public method to show the start menu (called by StartMenuController)
         */
        show() {
            this.getSceneObject().enabled = true;
            this.setStartMenuInFrontOfUser();
        }
        /**
         * Public method to hide the start menu (called by StartMenuController)
         */
        hide() {
            this.getSceneObject().enabled = false;
        }
        setStartMenuInFrontOfUser() {
            const head = this.worldCamera.getTransform().getWorldPosition();
            const forward = this.worldCamera.getTransform().forward;
            forward.y = 0;
            const pos = forward.normalize().uniformScale(-this.startMenuDistanceFromUser);
            this.startMenuTransform.setWorldPosition(head.add(pos));
            this.startMenuTransform.setWorldRotation(quat.lookAt(pos.uniformScale(-1), vec3.up()));
        }
    };
    __setFunctionName(_classThis, "StartMenu");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StartMenu = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StartMenu = _classThis;
})();
exports.StartMenu = StartMenu;
//# sourceMappingURL=StartMenu.js.map