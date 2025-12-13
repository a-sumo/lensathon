import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { Switch } from "SpectaclesUIKit.lspkg/Scripts/Components/Switch/Switch";

/**
 * ============================================================================
 * STENCIL SYSTEM DOCUMENTATION
 * ============================================================================
 *
 * OVERVIEW:
 * This system allows users to place multiple stencil masks and spray paint
 * through them. Each stencil is an independent instance that can be positioned
 * and will mask the spray paint.
 *
 * KEY CONCEPTS:
 *
 * 1. STENCIL INSTANCE
 *    - Each stencil is instantiated from a prefab
 *    - Has its own SceneObject, transform, material, and texture
 *    - Stores UV position (center) and UV scale relative to target plane
 *    - Can be placed (fixed position) or hovering (following cursor)
 *
 * 2. ACTIVE STENCIL
 *    - Only ONE stencil is "active" at a time
 *    - The active stencil is used for masking spray paint
 *    - When a new stencil is placed, it becomes the active one
 *
 * 3. PAINT LAYERING
 *    - Paint is stored in paintTex (managed by SprayController)
 *    - Each spray cycle adds paint ON TOP of existing paint
 *    - Existing paint is PERMANENT and never affected by stencil movement
 *    - Only NEW spray is masked by the active stencil
 *
 * FLOW:
 *
 *   [Stencil Tool ON]
 *         │
 *         ▼
 *   ┌─────────────┐
 *   │ Instantiate │──── New stencil plane from prefab
 *   │ New Stencil │
 *   └─────────────┘
 *         │
 *         ▼
 *   ┌─────────────┐
 *   │   HOVER     │──── Stencil follows cursor (semi-transparent)
 *   │   STATE     │     Preview shows where stencil will be placed
 *   └─────────────┘
 *         │
 *         ▼ (User clicks)
 *   ┌─────────────┐
 *   │   PLACED    │──── Stencil locked in position (full alpha)
 *   │   STATE     │     Becomes ACTIVE MASK for spray
 *   └─────────────┘
 *         │
 *         ▼ (Auto-switch to spray)
 *   ┌─────────────┐
 *   │   SPRAY     │──── Paint through active stencil mask
 *   │   MODE      │     Paint accumulates in paintTex
 *   └─────────────┘
 *         │
 *         ▼ (User activates stencil tool again)
 *   ┌─────────────┐
 *   │ Instantiate │──── NEW stencil (old one stays visible but inactive)
 *   │ New Stencil │     Repeat cycle...
 *   └─────────────┘
 *
 * PUBLIC API:
 *
 *   activate()          - Start stencil placement (creates new instance)
 *   deactivate()        - Stop stencil interaction
 *   reset()             - Clear all stencils and paint
 *   hideAllStencils()   - Hide all stencil plane visuals
 *   showAllStencils()   - Show all stencil plane visuals
 *   setStencilTexture() - Set the mask texture for new stencils
 *   getActiveStencil()  - Get current active stencil info
 *
 * SHADER INPUTS:
 *
 *   stencilCenter (vec2)      - UV position of active stencil
 *   stencilScale (vec2)       - UV scale of active stencil
 *   currentStencil (texture)  - Mask texture of active stencil
 *   paintTex (texture)        - Accumulated paint (permanent)
 *
 * ============================================================================
 */

export enum StencilState {
  Idle,       // Not active, waiting for activation
  Hovering,   // Active, stencil following cursor
  Placed      // Confirmed, stencil is now active mask
}

/**
 * Represents a single stencil instance
 */
interface StencilInstance {
  sceneObject: SceneObject;
  transform: Transform;
  material: Material;
  texture: Texture | null;
  center: vec2;
  scale: vec2;
  isPlaced: boolean;
  placementIndex: number;
  borderChild: SceneObject | null;
}

@component
export class StencilHoverController extends BaseScriptComponent {
  @ui.group_start("Stencil Prefab")
  @input
  @hint("Prefab for stencil plane - will be instantiated for each stencil")
  stencilPlanePrefab: ObjectPrefab;
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

  // Target plane references
  private targetPlaneTransform: Transform | null = null;
  private targetMaterial: Material | null = null;

  // Collider plane (this object)
  private colliderTransform: Transform | null = null;

  private interactable: Interactable | null = null;

  // Stencil instances
  private stencilInstances: StencilInstance[] = [];
  private currentStencil: StencilInstance | null = null;
  private activeStencil: StencilInstance | null = null;
  private placementCounter: number = 0;

  // Z-offset per stencil to avoid z-fighting
  private readonly STENCIL_Z_OFFSET: number = 0.005;

  // Current stencil texture (used for new instances)
  private currentStencilTexture: Texture | null = null;

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
    this.setupTargetPlane();

    if (this.useDebugStencil && this.debugStencilTexture) {
      this.currentStencilTexture = this.debugStencilTexture;
    }

    this.createEvent("OnStartEvent").bind(() => {
      this.setupInteractable();
    });
  }

  private setupTargetPlane(): void {
    if (!this.targetPlane) {
      print("[StencilHoverController] ERROR: No target plane assigned!");
      return;
    }

    this.targetPlaneTransform = this.targetPlane.getTransform();

    const renderMesh = this.targetPlane.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    if (renderMesh) {
      this.targetMaterial = renderMesh.mainMaterial;
    }

    this.updateTargetAspectRatio();
    this.setTargetPreviewAlpha(0);

    print("[StencilHoverController] Target plane setup complete");
  }

  private setupInteractable(): void {
    this.interactable = this.sceneObject.getComponent(Interactable.getTypeName()) as Interactable;
    if (!this.interactable) {
      print("[StencilHoverController] ERROR: No Interactable found!");
      return;
    }

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

    print("[StencilHoverController] Interactable setup complete");
  }

  private updateTargetAspectRatio(): void {
    if (!this.targetMaterial || !this.targetPlaneTransform) return;

    const worldScale = this.targetPlaneTransform.getWorldScale();
    const aspectRatio = worldScale.x / worldScale.y;
    this.targetMaterial.mainPass.aspectRatio = new vec2(aspectRatio, 1.0 / aspectRatio);
  }

  /**
   * Create a new stencil instance from the prefab
   */
  private createStencilInstance(): StencilInstance | null {
    if (!this.stencilPlanePrefab) {
      print("[StencilHoverController] ERROR: No stencil prefab assigned!");
      return null;
    }

    if (!this.targetPlane) {
      print("[StencilHoverController] ERROR: No target plane assigned!");
      return null;
    }

    // Instantiate under target plane's parent so it's in the same coordinate space
    const parentObject = this.targetPlane.getParent();
    const sceneObject = this.stencilPlanePrefab.instantiate(parentObject);
    if (!sceneObject) {
      print("[StencilHoverController] ERROR: Failed to instantiate stencil prefab!");
      return null;
    }

    const transform = sceneObject.getTransform();
    const renderMesh = sceneObject.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;

    if (!renderMesh) {
      print("[StencilHoverController] ERROR: Stencil prefab has no RenderMeshVisual!");
      sceneObject.destroy();
      return null;
    }

    const material = renderMesh.mainMaterial;

    // Find border child (first child of the stencil plane)
    let borderChild: SceneObject | null = null;
    if (sceneObject.getChildrenCount() > 0) {
      borderChild = sceneObject.getChild(0);
      // Hide border initially (during hover)
      borderChild.enabled = false;
    }

    // Align with target plane's transform initially
    if (this.targetPlaneTransform) {
      transform.setWorldRotation(this.targetPlaneTransform.getWorldRotation());
      transform.setWorldPosition(this.targetPlaneTransform.getWorldPosition());
    }

    const instance: StencilInstance = {
      sceneObject: sceneObject,
      transform: transform,
      material: material,
      texture: this.currentStencilTexture,
      center: new vec2(0.5, 0.5),
      scale: new vec2(0.3, 0.3),
      isPlaced: false,
      placementIndex: -1,
      borderChild: borderChild
    };

    // Apply current stencil texture
    if (this.currentStencilTexture && material) {
      material.mainPass.stencilTex = this.currentStencilTexture;
    }

    // Start hidden
    sceneObject.enabled = false;

    this.stencilInstances.push(instance);

    print("[StencilHoverController] Created stencil instance #" + this.stencilInstances.length);

    return instance;
  }

  private enterHoverState(): void {
    if (this._state === StencilState.Hovering) return; // Already hovering

    this._state = StencilState.Hovering;

    // Use existing currentStencil - created in activate()
    if (this.currentStencil) {
      this.currentStencil.sceneObject.enabled = true;
      this.setStencilInstancePreview(this.currentStencil, true);
    }

    // Show preview on target
    this.setTargetPreviewAlpha(this.previewAlpha);

    print("[StencilHoverController] Entered hover state");
  }

  private exitHoverState(): void {
    if (this._state !== StencilState.Hovering) return;

    this._state = StencilState.Idle;

    // Hide current stencil if not placed
    if (this.currentStencil && !this.currentStencil.isPlaced) {
      this.currentStencil.sceneObject.enabled = false;
    }

    // If we have an active (placed) stencil, keep preview alpha
    this.setTargetPreviewAlpha(this.activeStencil ? 1.0 : 0);

    print("[StencilHoverController] Exited hover state");
  }

  private onHover(event: any): void {
    const hitInfo = event.interactor.targetHitInfo;
    if (!hitInfo || !hitInfo.hit) return;
    if (!this.currentStencil || !this.targetPlaneTransform) return;

    const worldHitPos = hitInfo.hit.position;

    // Use target plane's transform for alignment (stencil should be parallel to target)
    const targetRotation = this.targetPlaneTransform.getWorldRotation();

    // Get target plane's forward direction (local Z axis - the plane's normal)
    const targetForward = targetRotation.multiplyVec3(vec3.forward());

    // Position stencil at hit point
    // Use offset based on next placement index to be in front of all placed stencils
    const hoverOffset = this.STENCIL_Z_OFFSET * (this.placementCounter + 0.5);
    const offsetPos = new vec3(
      worldHitPos.x + targetForward.x * hoverOffset,
      worldHitPos.y + targetForward.y * hoverOffset,
      worldHitPos.z + targetForward.z * hoverOffset
    );

    // Set stencil transform to match target plane orientation exactly
    this.currentStencil.transform.setWorldPosition(offsetPos);
    this.currentStencil.transform.setWorldRotation(targetRotation);

    // Ensure border is hidden during hover
    if (this.currentStencil.borderChild) {
      this.currentStencil.borderChild.enabled = false;
    }

    // Calculate stencil center and scale in target plane's UV space
    if (this.targetMaterial) {
      const stencilWorldPos = this.currentStencil.transform.getWorldPosition();
      const targetInverse = this.targetPlaneTransform.getInvertedWorldTransform();
      const localPosInTarget = targetInverse.multiplyPoint(stencilWorldPos);

      // Convert to UV (matching SprayController)
      const u = 0.5 + localPosInTarget.x;
      const v = 0.5 + localPosInTarget.y;

      const clampedU = Math.max(0, Math.min(1, u));
      const clampedV = Math.max(0, Math.min(1, v));

      // Calculate stencil scale relative to target
      const targetScale = this.targetPlaneTransform.getWorldScale();
      const stencilScale = this.currentStencil.transform.getWorldScale();
      const scaleX = stencilScale.x / targetScale.x;
      const scaleY = stencilScale.y / targetScale.y;

      // Store in instance
      this.currentStencil.center = new vec2(clampedU, clampedV);
      this.currentStencil.scale = new vec2(scaleX, scaleY);

      // Update shader with preview position
      this.targetMaterial.mainPass.stencilCenter = this.currentStencil.center;
      this.targetMaterial.mainPass.stencilScale = this.currentStencil.scale;
    }
  }

  private confirmPlacement(): void {
    if (!this.currentStencil || !this.targetPlaneTransform) return;

    this._state = StencilState.Placed;

    // Mark current stencil as placed and assign placement index
    this.currentStencil.isPlaced = true;
    this.currentStencil.placementIndex = this.placementCounter;
    this.placementCounter++;

    // Apply z-offset based on placement order to avoid z-fighting
    const targetRotation = this.targetPlaneTransform.getWorldRotation();
    const targetForward = targetRotation.multiplyVec3(vec3.forward());
    const zOffset = this.STENCIL_Z_OFFSET * this.currentStencil.placementIndex;
    const currentPos = this.currentStencil.transform.getWorldPosition();
    const offsetPos = new vec3(
      currentPos.x + targetForward.x * zOffset,
      currentPos.y + targetForward.y * zOffset,
      currentPos.z + targetForward.z * zOffset
    );
    this.currentStencil.transform.setWorldPosition(offsetPos);

    // Show border child now that stencil is placed
    if (this.currentStencil.borderChild) {
      this.currentStencil.borderChild.enabled = true;
    }

    // Set to solid mode (full alpha)
    this.setStencilInstancePreview(this.currentStencil, false);

    // This becomes the new active stencil for masking
    this.activeStencil = this.currentStencil;

    // Update shader with final position and texture for masking spray
    if (this.targetMaterial) {
      this.targetMaterial.mainPass.stencilCenter = this.activeStencil.center;
      this.targetMaterial.mainPass.stencilScale = this.activeStencil.scale;
      if (this.activeStencil.texture) {
        this.targetMaterial.mainPass.currentStencil = this.activeStencil.texture;
      }
      // Enable stencil masking
      this.targetMaterial.mainPass.stencilActive = 1.0;
    }

    // Set target to full alpha
    this.setTargetPreviewAlpha(1.0);

    // Clear current (will create new one on next activation)
    this.currentStencil = null;

    // Deactivate interaction
    this._isActive = false;

    // Switch to spray mode
    this.deactivateStencilToggle();

    // Notify callback
    if (this.onPlacementConfirmed) {
      this.onPlacementConfirmed();
    }

    print("[StencilHoverController] Stencil #" + this.activeStencil.placementIndex +
          " placed at UV: (" + this.activeStencil.center.x.toFixed(3) + ", " +
          this.activeStencil.center.y.toFixed(3) + ")");
  }

  private deactivateStencilToggle(): void {
    if (!this.spraySwitch) return;
    this.spraySwitch.toggle(true);
  }

  private setStencilInstancePreview(instance: StencilInstance, isPreview: boolean): void {
    if (!instance.material) return;

    instance.material.mainPass.previewMode = isPreview ? 1.0 : 0.0;
    instance.material.mainPass.previewAlpha = this.previewAlpha;
  }

  private setTargetPreviewAlpha(alpha: number): void {
    if (!this.targetMaterial) return;
    this.targetMaterial.mainPass.previewAlpha = alpha;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Activate stencil placement mode.
   * Creates a new stencil instance that will follow the cursor.
   */
  activate(): void {
    this._isActive = true;
    this._state = StencilState.Idle;

    // Clean up any existing unplaced stencil
    if (this.currentStencil && !this.currentStencil.isPlaced) {
      this.destroyStencilInstance(this.currentStencil);
      this.currentStencil = null;
    }

    // Create new stencil instance
    this.currentStencil = this.createStencilInstance();

    // If already hovering, enter hover state
    if (this._isHoveringCollider) {
      this.enterHoverState();
    }

    print("[StencilHoverController] Activated - ready to place stencil #" + this.stencilInstances.length);
  }

  /**
   * Deactivate stencil placement mode.
   */
  deactivate(): void {
    this._isActive = false;

    if (this._state === StencilState.Hovering) {
      this.exitHoverState();
    }

    // Destroy unplaced stencil
    if (this.currentStencil && !this.currentStencil.isPlaced) {
      this.destroyStencilInstance(this.currentStencil);
      this.currentStencil = null;
    }

    this._state = StencilState.Idle;

    print("[StencilHoverController] Deactivated");
  }

  /**
   * Destroy a stencil instance and remove from list
   */
  private destroyStencilInstance(instance: StencilInstance): void {
    const idx = this.stencilInstances.indexOf(instance);
    if (idx >= 0) {
      this.stencilInstances.splice(idx, 1);
    }
    if (instance.sceneObject) {
      instance.sceneObject.destroy();
    }
  }

  /**
   * Reset everything - destroy all stencil instances.
   */
  reset(): void {
    // Destroy all stencil instances
    for (const instance of this.stencilInstances) {
      if (instance.sceneObject) {
        instance.sceneObject.destroy();
      }
    }

    this.stencilInstances = [];
    this.currentStencil = null;
    this.activeStencil = null;
    this.placementCounter = 0;

    this._state = StencilState.Idle;
    this._isActive = false;

    // Disable stencil masking in shader
    if (this.targetMaterial) {
      this.targetMaterial.mainPass.stencilActive = 0.0;
    }

    this.setTargetPreviewAlpha(0);

    print("[StencilHoverController] Reset - all stencils destroyed");
  }

  /**
   * Hide all stencil plane visuals.
   * Useful for clean screenshots or changing views.
   */
  hideAllStencils(): void {
    for (const instance of this.stencilInstances) {
      instance.sceneObject.enabled = false;
    }
    print("[StencilHoverController] All stencils hidden");
  }

  /**
   * Show all placed stencil plane visuals.
   */
  showAllStencils(): void {
    for (const instance of this.stencilInstances) {
      if (instance.isPlaced) {
        instance.sceneObject.enabled = true;
      }
    }
    print("[StencilHoverController] All placed stencils shown");
  }

  /**
   * Set the stencil texture for new stencil instances.
   */
  setStencilTexture(texture: Texture): void {
    this.currentStencilTexture = texture;

    // Also update current stencil if hovering
    if (this.currentStencil && this.currentStencil.material) {
      this.currentStencil.texture = texture;
      this.currentStencil.material.mainPass.stencilTex = texture;
    }

    // Update target material's current stencil
    if (this.targetMaterial) {
      this.targetMaterial.mainPass.currentStencil = texture;
    }

    print("[StencilHoverController] Stencil texture updated");
  }

  /**
   * Get info about the currently active (placed) stencil.
   * Returns null if no stencil is active.
   */
  getActiveStencil(): { center: vec2; scale: vec2; texture: Texture | null } | null {
    if (!this.activeStencil) return null;

    return {
      center: this.activeStencil.center,
      scale: this.activeStencil.scale,
      texture: this.activeStencil.texture
    };
  }

  /**
   * Get the number of placed stencils.
   */
  getStencilCount(): number {
    return this.stencilInstances.filter(s => s.isPlaced).length;
  }

  /**
   * Handle stencil switch state change.
   * Called from Switch's onValueChanged callback.
   */
  onSwitchStateChanged(value: number): void {
    if (value === 1) {
      this.activate();
    } else {
      this.deactivate();
    }
  }
}
