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
exports.ExampleGeminiImageGen = void 0;
var __selfType = requireType("./StencilGenGeminiCall");
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
let ExampleGeminiImageGen = (() => {
    let _classDecorators = [component];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BaseScriptComponent;
    var ExampleGeminiImageGen = _classThis = class extends _classSuper {
        constructor() {
            super();
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.imgObject = this.imgObject;
            this.objectTypeInput = this.objectTypeInput;
            this.basePrompt = this.basePrompt;
            this.generateButton = this.generateButton;
            this.internetModule = require("LensStudio:InternetModule");
        }
        __initialize() {
            super.__initialize();
            this.snapCloudRequirements = this.snapCloudRequirements;
            this.functionName = this.functionName;
            this.imgObject = this.imgObject;
            this.objectTypeInput = this.objectTypeInput;
            this.basePrompt = this.basePrompt;
            this.generateButton = this.generateButton;
            this.internetModule = require("LensStudio:InternetModule");
        }
        onAwake() {
            // this.setupButton();
        }
        //   private setupButton() {
        //     if (this.generateButton) {
        //       this.generateButton.onTriggerUp.add(() => {
        //         print("Button pressed - testing with hardcoded prompt...");
        //         // Test with hardcoded prompt first
        //         this.testEdgeFunction();
        //       });
        //       print("Generate button configured");
        //     } else {
        //       print("No button assigned - call testEdgeFunction() manually");
        //     }
        //   }
        // Test function with hardcoded prompt
        testEdgeFunction() {
            const testPrompt = "Generate a high quality image of a red apple";
            print("Testing with prompt: " + testPrompt);
            this.callEdgeFunction(testPrompt);
        }
        generateImage() {
            let objectType = "";
            if (this.objectTypeInput) {
                objectType = this.objectTypeInput.text || "";
            }
            if (objectType.trim() === "") {
                print("No object type specified - please enter a category");
                return;
            }
            const fullPrompt = `${this.basePrompt} ${objectType}`;
            print("Generating image with prompt: " + fullPrompt);
            this.callEdgeFunction(fullPrompt);
        }
        callEdgeFunction(prompt) {
            print("=== CALLING EDGE FUNCTION ===");
            const endpoint = this.snapCloudRequirements.getFunctionsApiUrl() + this.functionName;
            const payload = {
                prompt: prompt
            };
            const bodyString = JSON.stringify(payload);
            print("Endpoint: " + endpoint);
            print("Payload object: " + JSON.stringify(payload));
            print("Body string: " + bodyString);
            print("Body string length: " + bodyString.length);
            const request = RemoteServiceHttpRequest.create();
            request.url = endpoint;
            request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
            const headers = {};
            const baseHeaders = this.snapCloudRequirements.getSupabaseHeaders();
            for (const key in baseHeaders) {
                headers[key] = baseHeaders[key];
                print("Header: " + key + " = " + baseHeaders[key]);
            }
            headers["Content-Type"] = "application/json";
            request.headers = headers;
            // Set body
            request.body = bodyString;
            print("Request body set to: " + request.body);
            this.internetModule.performHttpRequest(request, (response) => {
                this.handleResponse(response);
            });
        }
        handleResponse(response) {
            print("=== RESPONSE ===");
            print("Response status: " + response.statusCode);
            if (response.statusCode !== 200) {
                print("Error: HTTP " + response.statusCode);
                print("Response body: " + response.body);
                return;
            }
            try {
                const result = JSON.parse(response.body);
                if (result.error) {
                    print("Server error: " + result.error);
                    return;
                }
                if (result.image) {
                    print("Received image, decoding...");
                    this.decodeAndDisplayImage(result.image);
                }
                else if (result.text) {
                    print("Received text response: " + result.text);
                }
                else {
                    print("No image or text in response");
                }
            }
            catch (e) {
                print("Failed to parse response: " + e);
            }
        }
        decodeAndDisplayImage(base64Data) {
            this.imgObject.enabled = true;
            Base64.decodeTextureAsync(base64Data, (texture) => {
                let imgComponent = this.imgObject.getComponent("Image");
                let imageMaterial = imgComponent.mainMaterial.clone();
                imgComponent.mainMaterial = imageMaterial;
                imgComponent.mainPass.baseTex = texture;
                print("Image generated and displayed successfully");
            }, () => {
                print("Failed to decode texture from base64 data.");
            });
        }
    };
    __setFunctionName(_classThis, "ExampleGeminiImageGen");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ExampleGeminiImageGen = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ExampleGeminiImageGen = _classThis;
})();
exports.ExampleGeminiImageGen = ExampleGeminiImageGen;
//# sourceMappingURL=StencilGenGeminiCall.js.map