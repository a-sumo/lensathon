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
  mockStencilRadius: number = 0.15;

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

  private updateMaterial(): void {
    if (!this.targetMaterial) return;

    const pass = this.targetMaterial.mainPass;
    pass.sprayUV = this.currentUV;
    pass.sprayRadius = this.sprayRadius;
    pass.sprayColor = this.sprayColor;
    pass.sprayActive = (this._isActive && this._isHovering) ? 1.0 : 0.0;
    pass.spraying = this._isSpraying ? 1.0 : 0.0;
    pass.mockRadius = this.mockStencilRadius;
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
}
