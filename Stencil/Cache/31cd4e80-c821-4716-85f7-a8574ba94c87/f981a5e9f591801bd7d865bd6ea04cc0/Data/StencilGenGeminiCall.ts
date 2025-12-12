import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import { TextInputField } from "SpectaclesUIKit.lspkg/Scripts/Components/TextInputField/TextInputField";
import { SnapCloudRequirements } from "./SnapCloudRequirements";

@component
export class ExampleGeminiImageGen extends BaseScriptComponent {
  @ui.separator
  @ui.group_start("Edge Function Config")
  @input
  private snapCloudRequirements: SnapCloudRequirements;
  @input
  @hint("Name of the edge function")
  private functionName: string = "generate-image";
  @ui.group_end

  @ui.separator
  @ui.group_start("Image Generation")
  @input
  private imgObject: SceneObject;
  @input
  @allowUndefined
  @hint("Text input field for object category/type")
  private objectTypeInput: TextInputField;
  @input
  @widget(new TextAreaWidget())
  @hint("Base prompt - object type will be appended")
  private basePrompt: string = "Generate a high quality image of a";
  @input
  @allowUndefined
  @hint("RectangleButton to trigger image generation")
  private generateButton: RectangleButton;
  @ui.group_end

  private internetModule: InternetModule = require("LensStudio:InternetModule");

  onAwake() {
    // this.setupButton();
    this.testEdgeFunction();
  }
  onStarted(){
    this.testEdgeFunction();
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
  testEdgeFunction(): void {
    const testPrompt = "Generate a high quality image of a red apple";
    print("Testing with prompt: " + testPrompt);
    this.callEdgeFunction(testPrompt);
  }

  generateImage(): void {
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

  private callEdgeFunction(prompt: string): void {
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

    const headers: { [key: string]: string } = {};
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

    this.internetModule.performHttpRequest(request, (response: RemoteServiceHttpResponse) => {
      this.handleResponse(response);
    });
  }

  private handleResponse(response: RemoteServiceHttpResponse): void {
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
      } else if (result.text) {
        print("Received text response: " + result.text);
      } else {
        print("No image or text in response");
      }
    } catch (e) {
      print("Failed to parse response: " + e);
    }
  }

  private decodeAndDisplayImage(base64Data: string): void {
    this.imgObject.enabled = true;

    Base64.decodeTextureAsync(
      base64Data,
      (texture) => {
        let imgComponent = this.imgObject.getComponent("Image");
        let imageMaterial = imgComponent.mainMaterial.clone();
        imgComponent.mainMaterial = imageMaterial;
        imgComponent.mainPass.baseTex = texture;
        print("Image generated and displayed successfully");
      },
      () => {
        print("Failed to decode texture from base64 data.");
      }
    );
  }
}