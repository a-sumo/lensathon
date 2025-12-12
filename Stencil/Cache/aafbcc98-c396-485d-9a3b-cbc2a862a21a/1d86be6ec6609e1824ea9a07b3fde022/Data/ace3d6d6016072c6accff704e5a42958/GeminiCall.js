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
var __selfType = requireType("./GeminiCall");
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
            this.apiKey = this.apiKey;
            this.model = this.model;
            this.imgObject = this.imgObject;
            this.objectTypeInput = this.objectTypeInput;
            this.basePrompt = this.basePrompt;
            this.generateButton = this.generateButton;
            this.internetModule = require("LensStudio:InternetModule");
        }
        __initialize() {
            super.__initialize();
            this.apiKey = this.apiKey;
            this.model = this.model;
            this.imgObject = this.imgObject;
            this.objectTypeInput = this.objectTypeInput;
            this.basePrompt = this.basePrompt;
            this.generateButton = this.generateButton;
            this.internetModule = require("LensStudio:InternetModule");
        }
        onAwake() {
            this.setupButton();
        }
        setupButton() {
            if (this.generateButton) {
                this.generateButton.onTriggerUp.add(() => {
                    print("Button pressed - generating image...");
                    this.generateImage();
                });
                print("Generate button configured");
            }
            else {
                print("No button assigned - calling test on start");
                this.testGenerateImage();
            }
        }
        // Test with hardcoded prompt
        testGenerateImage() {
            const testPrompt = "Create a picture of a red apple on a white background";
            print("Testing with prompt: " + testPrompt);
            this.callGeminiAPI(testPrompt);
        }
        generateImage() {
            let objectType = "";
            if (this.objectTypeInput) {
                objectType = this.objectTypeInput.text || "";
            }
            if (objectType.trim() === "") {
                print("No object type specified - using test prompt");
                this.testGenerateImage();
                return;
            }
            const fullPrompt = `${this.basePrompt} ${objectType}`;
            print("Generating image with prompt: " + fullPrompt);
            this.callGeminiAPI(fullPrompt);
        }
        async callGeminiAPI(prompt) {
            print("=== CALLING GEMINI API ===");
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            };
            print("Endpoint: " + endpoint);
            print("Prompt: " + prompt);
            try {
                const request = new Request(endpoint, {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                const response = await this.internetModule.fetch(request);
                print("Response status: " + response.status);
                if (response.status !== 200) {
                    const errorText = await response.text();
                    print("Error response: " + errorText);
                    return;
                }
                const result = await response.json();
                print("Response received, parsing...");
                this.handleGeminiResponse(result);
            }
            catch (error) {
                print("Fetch error: " + error);
            }
        }
        handleGeminiResponse(result) {
            try {
                const candidates = result.candidates;
                if (!candidates || candidates.length === 0) {
                    print("No candidates in response");
                    print("Full response: " + JSON.stringify(result));
                    return;
                }
                const parts = candidates[0]?.content?.parts;
                if (!parts || parts.length === 0) {
                    print("No parts in response");
                    return;
                }
                for (const part of parts) {
                    if (part.inlineData) {
                        print("Found image data, decoding...");
                        const base64Data = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType;
                        print("MimeType: " + mimeType);
                        this.decodeAndDisplayImage(base64Data);
                        return;
                    }
                    else if (part.text) {
                        print("Text response: " + part.text);
                    }
                }
                print("No image data found in response");
            }
            catch (error) {
                print("Error parsing response: " + error);
            }
        }
        decodeAndDisplayImage(base64Data) {
            this.imgObject.enabled = true;
            Base64.decodeTextureAsync(base64Data, (texture) => {
                let imgComponent = this.imgObject.getComponent("Image");
                let imageMaterial = imgComponent.mainMaterial.clone();
                imgComponent.mainMaterial = imageMaterial;
                imgComponent.mainPass.baseTex = texture;
                print("Image generated and displayed successfully!");
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
//# sourceMappingURL=GeminiCall.js.map