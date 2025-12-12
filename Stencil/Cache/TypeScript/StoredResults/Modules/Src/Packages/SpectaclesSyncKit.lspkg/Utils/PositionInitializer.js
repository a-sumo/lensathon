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
exports.PositionInitializer = void 0;
var __selfType = requireType("./PositionInitializer");
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
const SessionController_1 = require("../Core/SessionController");
let PositionInitializer = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var PositionInitializer = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.positionInFrontOfCamera = this.positionInFrontOfCamera;
            this.shouldFaceCamera = this.shouldFaceCamera;
            this.triggerOnlyForFirstPlayer = this.triggerOnlyForFirstPlayer;
        }
        __initialize() {
            super.__initialize();
            this.positionInFrontOfCamera = this.positionInFrontOfCamera;
            this.shouldFaceCamera = this.shouldFaceCamera;
            this.triggerOnlyForFirstPlayer = this.triggerOnlyForFirstPlayer;
        }
        onAwake() {
            this.createEvent("OnStartEvent").bind(() => this.onStart());
        }
        onStart() {
            if (this.triggerOnlyForFirstPlayer && !SessionController_1.SessionController.getInstance().getIsConnectionFirstJoiner()) {
                return;
            }
            this.worldCamera = WorldCameraFinderProvider_1.default.getInstance();
            this.objectTransform = this.sceneObject.getTransform();
            this.setObjectPosition();
        }
        setObjectPosition() {
            const head = this.worldCamera.getTransform().getWorldPosition();
            const right = this.worldCamera.getTransform().right;
            right.y = 0;
            const posX = right.normalize().uniformScale(this.positionInFrontOfCamera.x);
            const up = vec3.up();
            const posY = up.normalize().uniformScale(this.positionInFrontOfCamera.y);
            const forward = this.worldCamera.getTransform().forward;
            forward.y = 0;
            const posZ = forward.normalize().uniformScale(this.positionInFrontOfCamera.z);
            const pos = posX.add(posY).add(posZ);
            this.objectTransform.setWorldPosition(head.add(pos));
            if (this.shouldFaceCamera) {
                this.objectTransform.setWorldRotation(quat.lookAt(pos.uniformScale(-1), vec3.up()));
            }
        }
    };
    __setFunctionName(_classThis, "PositionInitializer");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PositionInitializer = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PositionInitializer = _classThis;
})();
exports.PositionInitializer = PositionInitializer;
//# sourceMappingURL=PositionInitializer.js.map