import { Gemini } from "RemoteServiceGateway.lspkg/HostedExternal/Gemini"
import { GeminiTypes } from "RemoteServiceGateway.lspkg/HostedExternal/GeminiTypes"
import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";

@component
export class ExampleGeminiImageGen extends BaseScriptComponent {
  @ui.separator
  @ui.group_start("Image Generation")
  @input
  private imgObject: SceneObject;
  @input
  @widget(new TextAreaWidget())
  private imageGenerationPrompt: string = "The future of augmented reality";
  @input
  @allowUndefined
  @hint("RectangleButton to trigger image generation")
  private generateButton: RectangleButton;
  @ui.group_end

  onAwake() {
  }
  generateImageExample() {
    this.imgObject.enabled = true;
    let request: GeminiTypes.Models.GenerateContentRequest = {
      model: "gemini-2.0-flash-preview-image-generation",
      type: "generateContent",
      body: {
        contents: [
          {
            parts: [
              {
                text: this.imageGenerationPrompt,
              },
            ],
            role: "user",
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
    };
    Gemini.models(request)
      .then((response) => {
        for (let part of response.candidates[0].content.parts) {
          if (part?.inlineData) {
            let b64Data = part.inlineData.data;
            Base64.decodeTextureAsync(
              b64Data,
              (texture) => {
                let imgComponent = this.imgObject.getComponent("Image");
                let imageMaterial = imgComponent.mainMaterial.clone();
                imgComponent.mainMaterial = imageMaterial;
                imgComponent.mainPass.baseTex = texture;
              },
              () => {
                print("Failed to decode texture from base64 data.");
              }
            );
          }
        }
      })
      .catch((error) => {
        print("Error while generating image: " + error);
        // this.textDisplay.text = "Error: " + error;
      });
  }
}