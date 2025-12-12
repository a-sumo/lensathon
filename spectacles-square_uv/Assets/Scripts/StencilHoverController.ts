import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";

@component
export class StencilHoverController extends BaseScriptComponent {
  @ui.group_start("Stencil Plane")
  @input
  @hint("The movable stencil plane with cutout material")
  stencilPlane: SceneObject;
  @ui.group_end

  @ui.group_start("Target Plane")
  @input
  @hint("The target plane with stencil compositing material")
  targetPlane: SceneObject;

  @input
  @hint("Preview alpha during hover")
  previewAlpha: number = 0.5;

  @input
  @hint("Full alpha when placed")
  placedAlpha: number = 1.0;
  @ui.group_end

  @ui.group_start("Debug")
  @input
  useDebugStencil: boolean = false;

  @input
  @allowUndefined
  debugStencilTexture: Texture;
  @ui.group_end

  // Stencil plane (cutout material)
  private stencilPlaneTransform: Transform | null = null;
  private stencilPlaneMaterial: Material | null = null;

  // Target plane (stencil compositing material)
  private targetPlaneTransform: Transform | null = null;
  private targetMaterial: Material | null = null;

  // Collider plane (this object)
  private colliderTransform: Transform | null = null;

  private interactable: Interactable | null = null;
  private isHovering: boolean = false;

  onAwake() {
    this.colliderTransform = this.sceneObject.getTransform();
    this.setupStencilPlane();
    this.setupTargetPlane();
    this.createEvent("OnStartEvent").bind(() => {
      this.setupInteractable();
    });
  }

  private setupStencilPlane(): void {
    if (!this.stencilPlane) return;

    this.stencilPlaneTransform = this.stencilPlane.getTransform();

    const renderMesh = this.stencilPlane.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (renderMesh) {
      this.stencilPlaneMaterial = renderMesh.mainMaterial;
    }

    if (this.useDebugStencil && this.debugStencilTexture && this.stencilPlaneMaterial) {
      this.stencilPlaneMaterial.mainPass.baseTex = this.debugStencilTexture;
    }

    this.stencilPlane.enabled = false;
  }

  private setupTargetPlane(): void {
    if (!this.targetPlane) return;

    this.targetPlaneTransform = this.targetPlane.getTransform();

    const renderMesh = this.targetPlane.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (renderMesh) {
      this.targetMaterial = renderMesh.mainMaterial;
    }

    this.updateTargetAspectRatio();

    // Set initial preview alpha
    if (this.targetMaterial) {
      this.setTargetAlpha(0);
    }
  }

  private setupInteractable(): void {
    this.interactable = this.sceneObject.getComponent(Interactable.getTypeName()) as Interactable;
    if (!this.interactable) return;

    this.interactable.onHoverEnter.add((event: InteractorEvent) => {
      this.isHovering = true;
      if (this.stencilPlane) {
        this.stencilPlane.enabled = true;
      }
      this.setTargetAlpha(this.previewAlpha);
      this.onHover(event);
    });

    this.interactable.onHoverUpdate.add((event: InteractorEvent) => {
      this.onHover(event);
    });

    this.interactable.onHoverExit.add(() => {
      this.isHovering = false;
      if (this.stencilPlane) {
        this.stencilPlane.enabled = false;
      }
      this.setTargetAlpha(0);
    });

    this.interactable.onTriggerStart.add((event: InteractorEvent) => {
      if (this.isHovering) {
        this.confirmPlacement();
      }
    });
  }

  private updateTargetAspectRatio(): void {
    if (!this.targetMaterial || !this.targetPlaneTransform) return;

    const worldScale = this.targetPlaneTransform.getWorldScale();
    const aspectRatio = worldScale.x / worldScale.y;
    this.targetMaterial.mainPass.aspectRatio = new vec2(aspectRatio, 1.0 / aspectRatio);
  }

  private onHover(event: any): void {
    const hitInfo = event.interactor.targetHitInfo;
    if (!hitInfo || !hitInfo.hit) return;

    const worldHitPos = hitInfo.hit.position;

    // Move stencil plane to hover position
    if (this.stencilPlaneTransform && this.colliderTransform) {
      this.stencilPlaneTransform.setWorldPosition(worldHitPos);
      this.stencilPlaneTransform.setWorldRotation(this.colliderTransform.getWorldRotation());
    }

    // Calculate stencil center in target plane's UV space
    if (this.targetMaterial && this.targetPlaneTransform && this.stencilPlaneTransform) {
      const stencilWorldPos = this.stencilPlaneTransform.getWorldPosition();
      const targetInverse = this.targetPlaneTransform.getInvertedWorldTransform();
      const localPosInTarget = targetInverse.multiplyPoint(stencilWorldPos);

      // Convert to UV (inverted)
      const u = 0.5 - localPosInTarget.x;
      const v = 0.5 - localPosInTarget.y;

      const clampedU = Math.max(0, Math.min(1, u));
      const clampedV = Math.max(0, Math.min(1, v));

      // Update target material's stencil center for preview
      this.targetMaterial.mainPass.stencilCenter = new vec2(clampedU, clampedV);
    }
  }

  private confirmPlacement(): void {
    this.setTargetAlpha(this.placedAlpha);
  }

  private setTargetAlpha(alpha: number): void {
    if (!this.targetMaterial) return;

    const currentColor = this.targetMaterial.mainPass.tintColor;
    if (currentColor) {
      this.targetMaterial.mainPass.tintColor = new vec4(currentColor.r, currentColor.g, currentColor.b, alpha);
    }
  }

  // Public: Set stencil texture on stencil plane
  setStencilTexture(texture: Texture): void {
    if (this.stencilPlaneMaterial) {
      this.stencilPlaneMaterial.mainPass.baseTex = texture;
    }
    if (this.targetMaterial) {
      this.targetMaterial.mainPass.stencilMask = texture;
    }
  }

  // Public: Set tint color on target
  setTargetColor(color: vec4): void {
    if (this.targetMaterial) {
      this.targetMaterial.mainPass.tintColor = color;
    }
  }
}
