import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import { TextInputField } from "SpectaclesUIKit.lspkg/Scripts/Components/TextInputField/TextInputField";

@component
export class ExampleGeminiImageGen extends BaseScriptComponent {
  @ui.separator
  @ui.group_start("Gemini API Config")
  @input
  @hint("Your Gemini API key")
  private apiKey: string = "";
  @input
  @hint("Gemini model for image generation")
  private model: string = "gemini-2.5-flash-image";
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
      print("No button assigned - calling test on start");
      this.testGenerateImage();
    }
  }

  // Test with hardcoded prompt
  testGenerateImage(): void {
    const testPrompt = "Create a picture of a red apple on a white background";
    print("Testing with prompt: " + testPrompt);
    this.callGeminiAPI(testPrompt);
  }

  generateImage(): void {
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

  private async callGeminiAPI(prompt: string): Promise<void> {
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

    } catch (error) {
      print("Fetch error: " + error);
    }
  }

  private handleGeminiResponse(result: any): void {
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
        } else if (part.text) {
          print("Text response: " + part.text);
        }
      }

      print("No image data found in response");

    } catch (error) {
      print("Error parsing response: " + error);
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
        print("Image generated and displayed successfully!");
      },
      () => {
        print("Failed to decode texture from base64 data.");
      }
    );
  }
}