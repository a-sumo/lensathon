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
  @hint("Text input field for stencil subject")
  private objectTypeInput: TextInputField;
  @input
  @hint("Default subject if text input is empty")
  private defaultSubject: string = "a cat";
  @ui.group_end

  private internetModule: InternetModule = require("LensStudio:InternetModule");

  onAwake() {
  }

  generateImage(): void {
    let subject = this.defaultSubject;
    
    if (this.objectTypeInput && this.objectTypeInput.text && this.objectTypeInput.text.trim() !== "") {
      subject = this.objectTypeInput.text.trim();
    }

    const fullPrompt = this.buildStencilPrompt(subject);
    print("Generating stencil image with subject: " + subject);
    this.callGeminiAPI(fullPrompt);
  }

  private buildStencilPrompt(subject: string): string {
    return `Create a simple black and white stencil mask image. Black represents cutout areas (where paint passes through), white represents solid areas (blocking paint). 
Subject: ${subject}
Style requirements:
- Pure black (#000000) and pure white (#FFFFFF) only, no grayscale or gradients
- Bold, simplified shapes with clean edges
- Single-layer stencil design (all black areas must connect to the edges or float independently)
- High contrast silhouette style
- No fine details, textures, or halftones
- Suitable for laser cutting or hand-cutting`;
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
        print("Stencil image generated and displayed successfully!");
      },
      () => {
        print("Failed to decode texture from base64 data.");
      }
    );
  }
}