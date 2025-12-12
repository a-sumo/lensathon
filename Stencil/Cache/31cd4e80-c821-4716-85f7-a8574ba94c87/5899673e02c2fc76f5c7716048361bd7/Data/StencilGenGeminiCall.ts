import { Gemini } from "RemoteServiceGateway.lspkg/HostedExternal/Gemini"
import { GeminiTypes } from "RemoteServiceGateway.lspkg/HostedExternal/GeminiTypes"
import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import { TextInputField } from "SpectaclesUIKit.lspkg/Scripts/Components/TextInputField/TextInputField";

@component
export class ExampleGeminiImageGen extends BaseScriptComponent {
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

  onAwake() {
    this.setupButton();
  }

  private setupButton() {
    if (this.generateButton) {
      this.generateButton.onTriggerUp.add(() => {
        print("Button pressed - generating image...");
        this.generateImageExample();
      });
      print("Generate button configured");
    } else {
      print("No button assigned - call generateImageExample() manually");
    }
  }

  generateImageExample() {
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

    this.imgObject.enabled = true;
    let request: GeminiTypes.Models.GenerateContentRequest = {
      model: "gemini-2.0-flash-preview-image-generation",
      type: "generateContent",
      body: {
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
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
                print("Image generated successfully");
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
      });
  }
}