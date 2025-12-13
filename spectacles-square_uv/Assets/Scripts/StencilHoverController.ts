import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { SwitchToggleGroup } from "SpectaclesUIKit.lspkg/Scripts/Components/Toggle/SwitchToggleGroup";
import { Switch } from "SpectaclesUIKit.lspkg/Scripts/Components/Switch/Switch";

export enum StencilState {
  Idle,       // Not active, waiting for toggle ON
  Hovering,   // Active, stencil following cursor
  Placed      // Confirmed, color applied
}

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
  @hint("Preview alpha during hover (0-1)")
  previewAlpha: number = 0.5;
  @ui.group_end

  @ui.group_start("Toggle")
  @input
  @allowUndefined
  @hint("The spray switch to activate on placement (turns off stencil)")
  spraySwitch: Switch;
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

  // State
  private _state: StencilState = StencilState.Idle;
  private _isActive: boolean = false;
  private _isHoveringCollider: boolean = false;

  // Callback for when placement is confirmed
  public onPlacementConfirmed: (() => void) | null = null;

  get state(): StencilState {
    return this._state;
  }

  get isActive(): boolean {
    return this._isActive;
  }

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
      this.stencilPlaneMaterial.mainPass.stencilTex = this.debugStencilTexture;
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

    // Set initial state - hidden
    this.setTargetPreviewAlpha(0);
  }

  private setupInteractable(): void {
    this.interactable = this.sceneObject.getComponent(Interactable.getTypeName()) as Interactable;
    if (!this.interactable) return;

    this.interactable.onHoverEnter.add((event: InteractorEvent) => {
      this._isHoveringCollider = true;
      if (this._isActive && this._state === StencilState.Idle) {
        this.enterHoverState();
      }
      if (this._state === StencilState.Hovering) {
        this.onHover(event);
      }
    });

    this.interactable.onHoverUpdate.add((event: InteractorEvent) => {
      if (this._state === StencilState.Hovering) {
        this.onHover(event);
      }
    });

    this.interactable.onHoverExit.add(() => {
      this._isHoveringCollider = false;
      if (this._state === StencilState.Hovering) {
        this.exitHoverState();
      }
    });

    this.interactable.onTriggerStart.add((event: InteractorEvent) => {
      if (this._state === StencilState.Hovering) {
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

  private enterHoverState(): void {
    this._state = StencilState.Hovering;

    if (this.stencilPlane) {
      this.stencilPlane.enabled = true;
    }

    // Set stencil plane to preview mode (semi-transparent white)
    this.setStencilPlanePreview(true);

    // Show preview on target
    this.setTargetPreviewAlpha(this.previewAlpha);
  }

  private exitHoverState(): void {
    // Only exit if we haven't placed yet
    if (this._state !== StencilState.Hovering) return;

    this._state = StencilState.Idle;

    if (this.stencilPlane) {
      this.stencilPlane.enabled = false;
    }

    // Hide preview on target
    this.setTargetPreviewAlpha(0);
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
    this._state = StencilState.Placed;

    // Set stencil plane to solid mode (full black/white)
    this.setStencilPlanePreview(false);

    // Set target to full alpha
    this.setTargetPreviewAlpha(1.0);

    // Hide stencil plane after placement
    if (this.stencilPlane) {
      this.stencilPlane.enabled = false;
    }

    // Deactivate interaction
    this._isActive = false;

    // Deactivate the stencil toggle
    this.deactivateStencilToggle();

    // Notify callback
    if (this.onPlacementConfirmed) {
      this.onPlacementConfirmed();
    }
  }

  private deactivateStencilToggle(): void {
    if (!this.spraySwitch) return;

    // Turn ON the spray switch, which will turn OFF stencil via toggle group
    this.spraySwitch.toggle(true);
  }

  private setStencilPlanePreview(isPreview: boolean): void {
    if (!this.stencilPlaneMaterial) return;

    // previewMode: 1.0 = preview (semi-transparent), 0.0 = solid
    this.stencilPlaneMaterial.mainPass.previewMode = isPreview ? 1.0 : 0.0;
    this.stencilPlaneMaterial.mainPass.previewAlpha = this.previewAlpha;
  }

  private setTargetPreviewAlpha(alpha: number): void {
    if (!this.targetMaterial) return;
    this.targetMaterial.mainPass.previewAlpha = alpha;
  }

  // Public: Activate stencil interaction (call from toggle button ON)
  activate(): void {
    if (this._state === StencilState.Placed) {
      // Reset if already placed
      this.reset();
    }

    this._isActive = true;
    this._state = StencilState.Idle;

    // If already hovering over collider, enter hover state
    if (this._isHoveringCollider) {
      this.enterHoverState();
    }
  }

  // Public: Deactivate stencil interaction (call from toggle button OFF)
  deactivate(): void {
    this._isActive = false;

    if (this._state === StencilState.Hovering) {
      this.exitHoverState();
    }

    this._state = StencilState.Idle;
  }

  // Public: Reset to initial state
  reset(): void {
    this._state = StencilState.Idle;
    this._isActive = false;

    if (this.stencilPlane) {
      this.stencilPlane.enabled = false;
    }

    this.setTargetPreviewAlpha(0);
  }

  // Public: Set stencil texture on both planes
  setStencilTexture(texture: Texture): void {
    if (this.stencilPlaneMaterial) {
      this.stencilPlaneMaterial.mainPass.stencilTex = texture;
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

  // Public: Handle stencil switch state change
  // Called from Switch's onValueChanged callback
  // value 0 = off, value 1 = on
  onSwitchStateChanged(value: number): void {
    if (value === 1) {
      this.activate();
    } else {
      this.deactivate();
    }
  }
}
