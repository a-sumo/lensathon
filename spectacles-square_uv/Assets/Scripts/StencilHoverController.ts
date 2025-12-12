import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";

@component
export class StencilHoverController extends BaseScriptComponent {
  @ui.group_start("Debug")
  @input
  @hint("Enable to use debug stencil texture instead of generated one")
  useDebugStencil: boolean = false;

  @input
  @allowUndefined
  @hint("Debug stencil texture to use when useDebugStencil is enabled")
  debugStencilTexture: Texture;
  @ui.group_end

  private material: Material | null = null;
  private meshTransform: Transform | null = null;
  private renderMeshVisual: RenderMeshVisual | null = null;
  private interactable: Interactable | null = null;

  onAwake() {
    this.setupMaterial();
    // Defer interactable setup to OnStartEvent (like ColorSampler does)
    this.createEvent("OnStartEvent").bind(() => {
      this.setupInteractable();
    });
  }

  private setupMaterial(): void {
    this.renderMeshVisual = this.sceneObject.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (!this.renderMeshVisual) return;

    this.material = this.renderMeshVisual.mainMaterial;
    if (!this.material) return;

    this.meshTransform = this.sceneObject.getTransform();

    // Calculate and set aspect ratio for the shader
    this.updateAspectRatio();

    // Apply debug stencil if enabled
    if (this.useDebugStencil && this.debugStencilTexture) {
      this.material.mainPass.stencilMask = this.debugStencilTexture;
    }
  }

  private setupInteractable(): void {
    this.interactable = this.sceneObject.getComponent(Interactable.getTypeName()) as Interactable;
    if (!this.interactable) return;

    this.interactable.onHoverEnter.add((event: InteractorEvent) => {
      this.onHover(event);
    });

    this.interactable.onHoverUpdate.add((event: InteractorEvent) => {
      this.onHover(event);
    });
  }

  private updateAspectRatio(): void {
    if (!this.material || !this.meshTransform) return;

    const worldScale = this.meshTransform.getWorldScale();
    const aspectRatio = worldScale.x / worldScale.y;
    // Material expects vec2 for aspectRatio (x = ratio, y = 1/ratio for convenience)
    this.material.mainPass.aspectRatio = new vec2(aspectRatio, 1.0 / aspectRatio);

  }

  private onHover(event: any): void {
    if (!this.material || !this.meshTransform) return;

    const hitInfo = event.interactor.targetHitInfo;
    if (!hitInfo) return;

    const localHitPos = hitInfo.localHitPosition;

    // Convert local position to UV coordinates (inverted)
    const u = 0.5 - localHitPos.x;
    const v = 0.5 - localHitPos.y;

    // Clamp to valid UV range
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));

    this.material.mainPass.stencilCenter = new vec2(clampedU, clampedV);
  }

  setStencilCenter(u: number, v: number): void {
    if (!this.material) return;
    this.material.mainPass.stencilCenter = new vec2(u, v);
  }

  setStencilMask(texture: Texture): void {
    if (!this.material) return;
    this.material.mainPass.stencilMask = texture;
  }

  recalculateAspectRatio(): void {
    this.updateAspectRatio();
  }
}
