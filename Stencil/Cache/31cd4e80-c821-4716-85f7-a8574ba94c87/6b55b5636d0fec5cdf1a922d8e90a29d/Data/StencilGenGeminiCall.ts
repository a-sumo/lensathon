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
  }

  callEdgeFunction(): void {
    print("Calling edge function...");

    const endpoint = this.snapCloudRequirements.getFunctionsApiUrl() + this.functionName;

    // Simple hello world payload
    const payload = {
      name: "Spectacles"
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
    print("Response body: " + response.body);

    if (response.statusCode !== 200) {
      print("Error: HTTP " + response.statusCode);
      return;
    }

    try {
      const result = JSON.parse(response.body);
      print("Message from server: " + result.message);
    } catch (e) {
      print("Failed to parse response: " + e);
    }
  }

  // TODO: Uncomment when ready for image generation
  // private generateImage() {
  //   let objectType = "";
  //   if (this.objectTypeInput) {
  //     objectType = this.objectTypeInput.text || "";
  //   }
  //
  //   if (objectType.trim() === "") {
  //     print("No object type specified");
  //     return;
  //   }
  //
  //   const fullPrompt = `${this.basePrompt} ${objectType}`;
  //   print("Generating image with prompt: " + fullPrompt);
  //
  //   // Call edge function with prompt, get back base64 image
  //   // Then decode and display:
  //   // Base64.decodeTextureAsync(base64Data, (texture) => {
  //   //   let imgComponent = this.imgObject.getComponent("Image");
  //   //   let imageMaterial = imgComponent.mainMaterial.clone();
  //   //   imgComponent.mainMaterial = imageMaterial;
  //   //   imgComponent.mainPass.baseTex = texture;
  //   // }, () => { print("Failed to decode texture"); });
  // }
}