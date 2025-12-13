import { TextInputField } from "SpectaclesUIKit.lspkg/Scripts/Components/TextInputField/TextInputField";
import { SprayController } from "./SprayController";
import { StencilHoverController } from "./StencilHoverController";

@component
export class ExampleGeminiImageGen extends BaseScriptComponent {
  @ui.separator
  @ui.group_start("Gemini API Config")
  @input
  @hint("Your Gemini API key")
  private apiKey: string = "";
  @input
  @hint("Gemini model for image generation")
  private model: string = "gemini-2.0-flash-exp";
  @ui.group_end

  @ui.separator
  @ui.group_start("Image Generation")
  @input
  private imgObject: SceneObject;
  @input
  @allowUndefined
  @hint("Loading texture/GIF to display while generating")
  private loadingTexture: Texture;
  @input
  @allowUndefined
  @hint("Text input field for stencil subject")
  private objectTypeInput: TextInputField;
  @input
  @hint("Default subject if text input is empty")
  private defaultSubject: string = "a cat";
  @ui.group_end

  @ui.separator
  @ui.group_start("Stencil System")
  @input
  @allowUndefined
  @hint("SprayController for setting mask pixel data")
  private sprayController: SprayController;

  @input
  @allowUndefined
  @hint("StencilHoverController for setting stencil texture")
  private stencilController: StencilHoverController;

  @input
  @allowUndefined
  @hint("Mesh to apply the stencil mask to (for preview)")
  private stencilMesh: SceneObject;
  @ui.group_end

  private internetModule: InternetModule = require("LensStudio:InternetModule");
  private isGenerating: boolean = false;

  onAwake() {
  }

  generateImage(): void {
    if (this.isGenerating) {
      print("Already generating an image, please wait...");
      return;
    }

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
- Suitable for laser cutting or hand-cutting
- NO frame or border around the image - the subject should extend to the edges
- The stencil design should fill the entire canvas without any decorative frames`;
  }

  private showLoadingState(): void {
    if (this.loadingTexture) {
      this.imgObject.enabled = true;
      let imgComponent = this.imgObject.getComponent("Image");
      let imageMaterial = imgComponent.mainMaterial.clone();
      imgComponent.mainMaterial = imageMaterial;
      imgComponent.mainPass.baseTex = this.loadingTexture;
      print("Showing loading state...");
    }
  }

  private async callGeminiAPI(prompt: string): Promise<void> {
    print("=== CALLING GEMINI API ===");
    
    this.isGenerating = true;
    this.showLoadingState();

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
        this.isGenerating = false;
        return;
      }

      const result = await response.json();
      print("Response received, parsing...");

      this.handleGeminiResponse(result);

    } catch (error) {
      print("Fetch error: " + error);
      this.isGenerating = false;
    }
  }

  private handleGeminiResponse(result: any): void {
    try {
      const candidates = result.candidates;
      if (!candidates || candidates.length === 0) {
        print("No candidates in response");
        print("Full response: " + JSON.stringify(result));
        this.isGenerating = false;
        return;
      }

      const parts = candidates[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        print("No parts in response");
        this.isGenerating = false;
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
      this.isGenerating = false;

    } catch (error) {
      print("Error parsing response: " + error);
      this.isGenerating = false;
    }
  }

  private decodeAndDisplayImage(base64Data: string): void {
    print("[GeminiCall] Starting texture decode...");

    // First decode to get the texture dimensions
    Base64.decodeTextureAsync(
      base64Data,
      (texture) => {
        print("[GeminiCall] Texture decoded successfully: " + texture.getWidth() + "x" + texture.getHeight());

        // Display the texture in the UI
        this.imgObject.enabled = true;
        let imgComponent = this.imgObject.getComponent("Image");
        let imageMaterial = imgComponent.mainMaterial.clone();
        imgComponent.mainMaterial = imageMaterial;
        imgComponent.mainPass.baseTex = texture;
        print("[GeminiCall] Displayed in UI Image component");

        // Apply to stencil mesh for preview (if configured)
        this.applyStencilMask(texture);

        // Set texture on StencilHoverController for stencil instances and target material
        if (this.stencilController) {
          print("[GeminiCall] Calling stencilController.setStencilTexture...");
          this.stencilController.setStencilTexture(texture);
        } else {
          print("[GeminiCall] WARNING: No stencilController assigned!");
        }

        // Extract pixel data for stamping
        this.extractPixelData(base64Data, texture);

        this.isGenerating = false;
        print("[GeminiCall] Image processing complete!");
      },
      () => {
        print("[GeminiCall] ERROR: Failed to decode texture from base64 data.");
        this.isGenerating = false;
      }
    );
  }

  // Pixel extraction state
  private extractionSize: number = 256;

  /**
   * Extract pixel data from the decoded texture for CPU-side stamping.
   * Since Lens Studio doesn't provide direct texture pixel access,
   * we create an empty mask by default. The visual preview still shows the correct shape.
   */
  private extractPixelData(base64Data: string, originalTexture: Texture): void {
    if (!this.sprayController) {
      print("[GeminiCall] No SprayController assigned, skipping pixel data extraction");
      return;
    }

    const width = originalTexture.getWidth();
    const height = originalTexture.getHeight();
    this.extractionSize = Math.min(width, height, 256);

    print("[GeminiCall] Texture size: " + width + "x" + height + ", extraction size: " + this.extractionSize);

    // Since we can't easily read pixels from decoded textures in Lens Studio,
    // create a filled mask so stamping works. The stencil preview (shader-based)
    // shows the correct Gemini texture shape on the stencil plane.
    this.createFilledMask();
  }

  /**
   * Create a FILLED mask (all black = paint through) so stamping works.
   * This stamps a solid rectangle of the stencil size with the active color.
   * The visual preview shows the Gemini texture shape on the stencil plane.
   */
  private createFilledMask(): void {
    const size = this.extractionSize;
    const pixelData = new Uint8Array(size * size * 4);

    // Initialize as FILLED (all black = paint through)
    // This means the entire stencil area will be painted with the active color
    for (let i = 0; i < pixelData.length; i += 4) {
      pixelData[i] = 0;       // R = black = paint through
      pixelData[i + 1] = 0;   // G
      pixelData[i + 2] = 0;   // B
      pixelData[i + 3] = 255; // A
    }

    this.sprayController.setStencilMaskData(pixelData, size);
    print("[GeminiCall] Set FILLED stencil mask (" + size + "x" + size + ") - stamps solid rectangle with active color");
  }

  private applyStencilMask(texture: Texture): void {
    if (!this.stencilMesh) {
      print("No stencil mesh configured, skipping stencil mask application");
      return;
    }

    const renderMeshVisual = this.stencilMesh.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;

    if (!renderMeshVisual) {
      print("ExampleGeminiImageGen: No RenderMeshVisual found on stencil mesh");
      return;
    }

    const material = renderMeshVisual.mainMaterial;

    if (!material) {
      print("ExampleGeminiImageGen: No material found on stencil mesh");
      return;
    }

    // Try multiple property names to ensure compatibility
    material.mainPass.stencilTex = texture;
    material.mainPass.stencilMask = texture;
    material.mainPass.baseTex = texture;
    print("Stencil mask applied to stencilMesh (stencilTex, stencilMask, baseTex)");
  }

  /**
   * Get the SprayController reference (for external access)
   */
  getSprayController(): SprayController | null {
    return this.sprayController;
  }

  /**
   * Get the StencilController reference (for external access)
   */
  getStencilController(): StencilHoverController | null {
    return this.stencilController;
  }
}