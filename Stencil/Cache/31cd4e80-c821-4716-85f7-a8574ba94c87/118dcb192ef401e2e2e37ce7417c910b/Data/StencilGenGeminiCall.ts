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
    this.setupButton();
  }

  private setupButton() {
    if (this.generateButton) {
      this.generateButton.onTriggerUp.add(() => {
        print("Button pressed - generating image...");
        this.generateImage();
      });
      print("Generate button configured");
    } else {
      print("No button assigned - call generateImage() manually");
    }
  }

  generateImage(): void {
    // Get the object type from the text input field
    let objectType = "";
    if (this.objectTypeInput) {
      objectType = this.objectTypeInput.text || "";
    }

    if (objectType.trim() === "") {
      print("No object type specified - please enter a category");
      return;
    }

    // Build the full prompt
    const fullPrompt = `${this.basePrompt} ${objectType}`;
    print("Generating image with prompt: " + fullPrompt);

    this.callEdgeFunction(fullPrompt);
  }

  private callEdgeFunction(prompt: string): void {
    print("Calling edge function...");

    const endpoint = this.snapCloudRequirements.getFunctionsApiUrl() + this.functionName;

    const payload = {
      prompt: prompt
    };

    print("Endpoint: " + endpoint);
    print("Payload: " + JSON.stringify(payload));

    const request = RemoteServiceHttpRequest.create();
    request.url = endpoint;
    request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;

    const headers: { [key: string]: string } = {};
    const baseHeaders = this.snapCloudRequirements.getSupabaseHeaders();
    for (const key in baseHeaders) {
      headers[key] = baseHeaders[key];
    }
    headers["Content-Type"] = "application/json";
    request.headers = headers;
    request.body = JSON.stringify(payload);

    this.internetModule.performHttpRequest(request, (response: RemoteServiceHttpResponse) => {
      this.handleResponse(response);
    });
  }

  private handleResponse(response: RemoteServiceHttpResponse): void {
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