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
exports.DisplayStorageProperty = void 0;
var __selfType = requireType("./DisplayStorageProperty");
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
const SyncEntity_1 = require("../../Core/SyncEntity");
const SyncKitLogger_1 = require("../../Utils/SyncKitLogger");
const TAG = "DisplayStorageProperty";
/**
 * Displays a Storage Property value found on the specified Entity Target.
 * The Property Key should match the one being used by the storage property.
 */
let DisplayStorageProperty = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var DisplayStorageProperty = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.syncEntityScript = this.syncEntityScript;
            this.propertyKey = this.propertyKey;
            this.text = this.text;
            this.useFormat = this.useFormat;
            this.formatString = this.formatString;
            this.altText = this.altText;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
        }
        __initialize() {
            super.__initialize();
            this.syncEntityScript = this.syncEntityScript;
            this.propertyKey = this.propertyKey;
            this.text = this.text;
            this.useFormat = this.useFormat;
            this.formatString = this.formatString;
            this.altText = this.altText;
            this.log = new SyncKitLogger_1.SyncKitLogger(TAG);
        }
        onAwake() {
            this.createEvent("OnStartEvent").bind(() => this.init());
        }
        updateValue(newValue, oldValue) {
            let newText = "";
            if (newValue === undefined) {
                newText = this.altText;
            }
            else if (this.useFormat) {
                newText = this.formatString
                    .replace("{value}", String(newValue))
                    .replace("{prevValue}", String(oldValue));
            }
            else {
                newText = String(newValue);
            }
            this.text.text = newText;
        }
        init() {
            this.updateValue(undefined);
            this.syncEntity = SyncEntity_1.SyncEntity.getSyncEntityOnComponent(this.syncEntityScript);
            if (!this.syncEntity) {
                this.log.e("Could not find syncEntity!");
            }
            else {
                this.syncEntity.notifyOnReady(() => this.getProperty());
            }
        }
        getProperty() {
            const property = this.syncEntity.propertySet.getProperty(this.propertyKey);
            if (property) {
                this.updateValue(property.currentValue, null);
                property.onAnyChange.add((newValue, oldValue) => this.updateValue(newValue, oldValue));
            }
            else {
                this.log.e("Couldn't find property with key: " + this.propertyKey);
            }
        }
    };
    __setFunctionName(_classThis, "DisplayStorageProperty");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DisplayStorageProperty = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DisplayStorageProperty = _classThis;
})();
exports.DisplayStorageProperty = DisplayStorageProperty;
//# sourceMappingURL=DisplayStorageProperty.js.map