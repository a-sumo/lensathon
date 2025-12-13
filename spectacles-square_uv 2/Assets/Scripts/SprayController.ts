import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { Switch } from "SpectaclesUIKit.lspkg/Scripts/Components/Switch/Switch";

@component
export class SprayController extends BaseScriptComponent {
  @input
  targetPlane: SceneObject;

  @input
  @allowUndefined
  spraySwitch: Switch;

  @input
  @widget(new SliderWidget(0.01, 0.2, 0.01))
  sprayRadius: number = 0.05;

  @input
  sprayColor: vec4 = new vec4(1.0, 0.0, 0.0, 1.0);

  @input
  paintTextureSize: number = 256;

  private targetMaterial: Material | null = null;
  private targetPlaneTransform: Transform | null = null;
  private interactable: Interactable | null = null;

  private _isActive: boolean = false;
  private _isHovering: boolean = false;
  private _isSpraying: boolean = false;
  private currentUV: vec2 = new vec2(0.5, 0.5);

  // Paint texture (CPU-side pixel buffer)
  private paintTexture: Texture | null = null;
  private paintData: Uint8Array | null = null;
  private textureProvider: ProceduralTextureProvider | null = null;
  private paintDirty: boolean = false;

  onAwake() {
    print("[SprayController] onAwake");
    this.createPaintTexture();
    this.setupTargetPlane();
    this.createEvent("OnStartEvent").bind(() => {
      this.setupInteractable();
      this.setupSwitch();
    });

    // Update loop - sync paint buffer to texture
    this.createEvent("UpdateEvent").bind(() => {
      if (this.paintDirty && this.textureProvider && this.paintData) {
        const size = this.paintTextureSize;
        this.textureProvider.setPixels(0, 0, size, size, this.paintData);
        this.paintDirty = false;
      }
    });
  }

  private createPaintTexture(): void {
    const size = this.paintTextureSize;

    // Create procedural texture (returns Texture, access provider via .control)
    this.paintTexture = ProceduralTextureProvider.createWithFormat(size, size, TextureFormat.RGBA8Unorm);
    this.textureProvider = this.paintTexture.control as ProceduralTextureProvider;

    // Create pixel data buffer (RGBA)
    this.paintData = new Uint8Array(size * size * 4);

    // Initialize to transparent
    for (let i = 0; i < this.paintData.length; i += 4) {
      this.paintData[i] = 0;
      this.paintData[i + 1] = 0;
      this.paintData[i + 2] = 0;
      this.paintData[i + 3] = 0;
    }

    this.textureProvider.setPixels(0, 0, size, size, this.paintData);
    print("[SprayController] Created paint texture " + size + "x" + size);
  }

  private setupSwitch(): void {
    if (!this.spraySwitch) {
      print("[SprayController] No spray switch assigned");
      return;
    }
    this.spraySwitch.onValueChange.add((value: number) => {
      this.onSwitchStateChanged(value);
    });
    if (this.spraySwitch.isOn) {
      this.activate();
    }
  }

  private setupTargetPlane(): void {
    if (!this.targetPlane) {
      print("[SprayController] No target plane assigned!");
      return;
    }
    this.targetPlaneTransform = this.targetPlane.getTransform();
    const mesh = this.targetPlane.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (mesh) {
      this.targetMaterial = mesh.mainMaterial;
      this.updateAspectRatio();

      // Assign paint texture to material
      if (this.paintTexture && this.targetMaterial) {
        this.targetMaterial.mainPass.paintTex = this.paintTexture;
        print("[SprayController] Assigned paint texture to material");
      }
    }
  }

  private updateAspectRatio(): void {
    if (!this.targetMaterial || !this.targetPlaneTransform) return;
    const scale = this.targetPlaneTransform.getWorldScale();
    this.targetMaterial.mainPass.aspectRatio = new vec2(scale.x / scale.y, scale.y / scale.x);
  }

  private setupInteractable(): void {
    this.interactable = this.sceneObject.getComponent(Interactable.getTypeName()) as Interactable;
    if (!this.interactable) {
      print("[SprayController] No Interactable found on this object!");
      return;
    }

    this.interactable.onHoverEnter.add((e: InteractorEvent) => {
      this._isHovering = true;
      this.onHover(e);
    });

    this.interactable.onHoverUpdate.add((e: InteractorEvent) => {
      this.onHover(e);
    });

    this.interactable.onHoverExit.add(() => {
      this._isHovering = false;
      this.updateMaterial();
    });

    this.interactable.onTriggerStart.add(() => {
      if (this._isActive) {
        this._isSpraying = true;
        this.paintAt(this.currentUV);
      }
      this.updateMaterial();
    });

    this.interactable.onTriggerEnd.add(() => {
      this._isSpraying = false;
      this.updateMaterial();
    });
  }

  private onHover(event: any): void {
    if (!this._isActive) return;
    const hit = event.interactor?.targetHitInfo?.hit;
    if (!hit || !this.targetPlaneTransform) return;

    const inv = this.targetPlaneTransform.getInvertedWorldTransform();
    const local = inv.multiplyPoint(hit.position);

    this.currentUV = new vec2(
      Math.max(0, Math.min(1, 0.5 + local.x)),
      Math.max(0, Math.min(1, 0.5 + local.y))
    );

    if (this._isSpraying) {
      this.paintAt(this.currentUV);
    }

    this.updateMaterial();
  }

  private paintAt(uv: vec2): void {
    if (!this.paintData) return;

    const size = this.paintTextureSize;
    const radiusPx = Math.max(1, Math.floor(this.sprayRadius * size));
    const centerX = Math.floor(uv.x * size);
    const centerY = Math.floor(uv.y * size);

    // Draw filled circle into buffer
    for (let dy = -radiusPx; dy <= radiusPx; dy++) {
      for (let dx = -radiusPx; dx <= radiusPx; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radiusPx) continue;

        const px = centerX + dx;
        const py = centerY + dy;
        if (px < 0 || px >= size || py < 0 || py >= size) continue;

        const idx = (py * size + px) * 4;

        // Soft falloff
        const falloff = 1.0 - (dist / radiusPx);
        const alpha = Math.floor(falloff * 255);

        // Max blend (paint accumulates)
        this.paintData[idx] = 255;
        this.paintData[idx + 1] = 255;
        this.paintData[idx + 2] = 255;
        this.paintData[idx + 3] = Math.max(this.paintData[idx + 3], alpha);
      }
    }

    // Mark dirty - update loop will sync to GPU
    this.paintDirty = true;
  }

  // Stencil mask pixel data for stamping
  private currentMaskData: Uint8Array | null = null;
  private currentMaskSize: number = 0;

  /**
   * Set the current stencil mask pixel data for stamping.
   * @param data RGBA pixel data of the stencil mask
   * @param size Width/height of the mask texture (assumes square)
   */
  setStencilMaskData(data: Uint8Array, size: number): void {
    this.currentMaskData = data;
    this.currentMaskSize = size;
    print("[SprayController] Stencil mask data set: " + size + "x" + size);
  }

  /**
   * Stamp a stencil mask onto the paint texture at the specified position.
   * Black areas in the mask (value < 0.5) will be painted with the current spray color.
   * If no mask data is set, stamps nothing (empty stencil).
   * @param center UV center position (0-1)
   * @param scale UV scale of the stencil
   * @param color Color to paint with (uses RGB, alpha for intensity)
   */
  stampStencil(center: vec2, scale: vec2, color: vec4): void {
    if (!this.paintData) {
      print("[SprayController] Cannot stamp: missing paint data");
      return;
    }

    // If no mask data, stamp nothing (empty stencil by default)
    if (!this.currentMaskData || this.currentMaskSize === 0) {
      print("[SprayController] No mask data - empty stencil, nothing to stamp");
      return;
    }

    const useMask = true;

    const size = this.paintTextureSize;
    const maskSize = this.currentMaskSize;

    // Calculate bounds in paint texture coordinates
    const halfScaleX = scale.x / 2;
    const halfScaleY = scale.y / 2;
    const minU = center.x - halfScaleX;
    const maxU = center.x + halfScaleX;
    const minV = center.y - halfScaleY;
    const maxV = center.y + halfScaleY;

    // Convert to pixel coordinates
    const minPx = Math.max(0, Math.floor(minU * size));
    const maxPx = Math.min(size - 1, Math.floor(maxU * size));
    const minPy = Math.max(0, Math.floor(minV * size));
    const maxPy = Math.min(size - 1, Math.floor(maxV * size));

    // Color as 0-255 values
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);
    const colorAlpha = color.a;

    // Iterate through the stencil bounds and stamp based on mask
    let pixelsStamped = 0;
    for (let py = minPy; py <= maxPy; py++) {
      for (let px = minPx; px <= maxPx; px++) {
        // Calculate UV within the stencil (0-1)
        const pixelU = px / size;
        const pixelV = py / size;
        const stencilU = (pixelU - minU) / scale.x;
        const stencilV = (pixelV - minV) / scale.y;

        // Sample mask at this position
        const maskX = Math.floor(stencilU * (maskSize - 1));
        const maskY = Math.floor(stencilV * (maskSize - 1));
        const maskIdx = (maskY * maskSize + maskX) * 4;

        // Get mask value (red channel, assuming grayscale)
        const maskValue = this.currentMaskData[maskIdx] / 255;

        // Black (0) = paint through, White (1) = blocked
        if (maskValue < 0.5) {
          const paintIdx = (py * size + px) * 4;
          const paintAlpha = Math.floor((1.0 - maskValue * 2) * colorAlpha * 255);
          this.paintData[paintIdx] = r;
          this.paintData[paintIdx + 1] = g;
          this.paintData[paintIdx + 2] = b;
          this.paintData[paintIdx + 3] = Math.max(this.paintData[paintIdx + 3], paintAlpha);
          pixelsStamped++;
        }
      }
    }

    this.paintDirty = true;
    print("[SprayController] Stamped stencil at UV: (" + center.x.toFixed(3) + ", " + center.y.toFixed(3) + ") - " + pixelsStamped + " pixels painted");
  }

  private updateMaterial(): void {
    if (!this.targetMaterial) return;

    const pass = this.targetMaterial.mainPass;
    pass.sprayUV = this.currentUV;
    pass.sprayRadius = this.sprayRadius;
    pass.sprayColor = this.sprayColor;
    pass.sprayActive = (this._isActive && this._isHovering) ? 1.0 : 0.0;
    pass.spraying = this._isSpraying ? 1.0 : 0.0;
  }

  clearPaint(): void {
    if (!this.paintData) return;
    for (let i = 0; i < this.paintData.length; i += 4) {
      this.paintData[i] = 0;
      this.paintData[i + 1] = 0;
      this.paintData[i + 2] = 0;
      this.paintData[i + 3] = 0;
    }
    this.paintDirty = true;
    print("[SprayController] Paint cleared");
  }

  activate(): void {
    this._isActive = true;
    this.updateMaterial();
  }

  deactivate(): void {
    this._isActive = false;
    this._isSpraying = false;
    this.updateMaterial();
  }

  onSwitchStateChanged(value: number): void {
    value === 1 ? this.activate() : this.deactivate();
  }

  /**
   * Get the current active color (same as spray color).
   */
  getSprayColor(): vec4 {
    return this.sprayColor;
  }

  /**
   * Get the current active color.
   */
  getActiveColor(): vec4 {
    return this.sprayColor;
  }

  /**
   * Set the active color for spraying and stamping.
   * @param color RGBA color (0-1 range)
   */
  setActiveColor(color: vec4): void {
    this.sprayColor = color;
    this.updateMaterial();
    print("[SprayController] Active color set to: (" +
      color.r.toFixed(2) + ", " + color.g.toFixed(2) + ", " +
      color.b.toFixed(2) + ", " + color.a.toFixed(2) + ")");
  }

  /**
   * Set the active color using RGB values (0-1 range).
   * @param r Red (0-1)
   * @param g Green (0-1)
   * @param b Blue (0-1)
   * @param a Alpha (0-1), defaults to 1
   */
  setActiveColorRGB(r: number, g: number, b: number, a: number = 1.0): void {
    this.setActiveColor(new vec4(r, g, b, a));
  }

  /**
   * Set the spray radius using a normalized value (0-1).
   * Maps 0-1 input to 0-0.5 actual radius.
   * @param normalizedValue Value between 0 and 1
   */
  setSprayRadiusNormalized(normalizedValue: number): void {
    // Clamp input to 0-1
    const clamped = Math.max(0, Math.min(1, normalizedValue));
    // Remap to 0-0.5
    this.sprayRadius = clamped * 0.5;
    this.updateMaterial();
    print("[SprayController] Spray radius set to: " + this.sprayRadius.toFixed(3) + " (normalized: " + clamped.toFixed(2) + ")");
  }

  /**
   * Get the current spray radius.
   */
  getSprayRadius(): number {
    return this.sprayRadius;
  }

  /**
   * Get the spray radius as a normalized value (0-1).
   */
  getSprayRadiusNormalized(): number {
    return this.sprayRadius / 0.5;
  }
}
