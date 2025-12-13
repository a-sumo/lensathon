import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractorEvent } from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent";
import { Switch } from "SpectaclesUIKit.lspkg/Scripts/Components/Switch/Switch";
import { SprayController } from "./SprayController";

/**
 * ============================================================================
 * STENCIL STAMP SYSTEM
 * ============================================================================
 *
 * OVERVIEW:
 * This system allows users to preview and stamp stencil shapes onto a paint
 * texture. When the user clicks, the stencil shape is stamped with the current
 * spray color and the stencil plane is destroyed.
 *
 * FLOW:
 *
 *   [Stencil Tool ON]
 *         │
 *         ▼
 *   ┌─────────────┐
 *   │ Instantiate │──── New stencil plane from prefab (preview)
 *   │ New Stencil │
 *   └─────────────┘
 *         │
 *         ▼
 *   ┌─────────────┐
 *   │   HOVER     │──── Stencil follows cursor (semi-transparent)
 *   │   STATE     │     Preview shows where stencil will be stamped
 *   └─────────────┘
 *         │
 *         ▼ (User clicks)
 *   ┌─────────────┐
 *   │   STAMP     │──── Stencil shape stamped onto paint texture
 *   │   & DELETE  │     Stencil plane destroyed, switch to spray mode
 *   └─────────────┘
 *
 * PUBLIC API:
 *
 *   activate()          - Start stencil placement (creates new preview)
 *   deactivate()        - Stop stencil interaction
 *   reset()             - Reset stamp counter
 *   setStencilTexture() - Set the mask texture for stencils
 *   getCurrentStencil() - Get current hovering stencil info
 *   getStampedCount()   - Get total number of stamps applied
 *
 * REQUIREMENTS:
 *   - SprayController must be assigned for stamping to work
 *   - SprayController.setStencilMaskData() must be called with pixel data
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

  @ui.group_start("Spray Controller")
  @input
  @allowUndefined
  @hint("Reference to SprayController for stamping stencils onto paint texture")
  sprayController: SprayController;

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

  // Active color for stamping (can be set independently of SprayController)
  private _activeColor: vec4 = new vec4(1.0, 0.0, 0.0, 1.0);
  private _useOwnColor: boolean = false; // If false, uses SprayController's color

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

    // Clone the material so each stencil instance has its own material for independent coloring
    const material = renderMesh.mainMaterial.clone();
    renderMesh.mainMaterial = material;

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

    // Apply current stencil texture - "map" is the property used by Stencil Border shader
    if (this.currentStencilTexture && material) {
      material.mainPass.map = this.currentStencilTexture;
      print("[StencilHoverController] Applied stencil texture to new instance (map property)");
    } else {
      print("[StencilHoverController] No stencil texture to apply to new instance");
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

    // Disable stencil preview
    this.setTargetPreviewAlpha(0);

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
    this.placementCounter++;

    const placementIdx = this.placementCounter;
    const center = this.currentStencil.center;
    const scale = this.currentStencil.scale;
    const color = this.getActiveColor();

    // Mark stencil as placed
    this.currentStencil.isPlaced = true;
    this.currentStencil.placementIndex = placementIdx;

    // Apply z-offset to avoid z-fighting with other stencils
    const targetRotation = this.targetPlaneTransform.getWorldRotation();
    const targetForward = targetRotation.multiplyVec3(vec3.forward());
    const zOffset = this.STENCIL_Z_OFFSET * placementIdx;
    const currentPos = this.currentStencil.transform.getWorldPosition();
    this.currentStencil.transform.setWorldPosition(new vec3(
      currentPos.x + targetForward.x * zOffset,
      currentPos.y + targetForward.y * zOffset,
      currentPos.z + targetForward.z * zOffset
    ));

    // Ensure the stencil texture and color are applied to the material
    // The Stencil Border shader uses "map" property for the texture
    // Try mainColor for tinting (common in Lens Studio shaders)
    if (this.currentStencil.material) {
      if (this.currentStencil.texture) {
        this.currentStencil.material.mainPass.map = this.currentStencil.texture;
      }
      // Try to apply color via mainColor (if shader supports it)
      this.currentStencil.material.mainPass.mainColor = color;
      this.currentStencil.material.mainPass.baseColor = color;
      this.currentStencil.material.mainPass.tintColor = color;
      print("[StencilHoverController] Applied stencil texture and color on placement: (" +
            color.r.toFixed(2) + ", " + color.g.toFixed(2) + ", " + color.b.toFixed(2) + ")");
    }

    // Show border child if exists
    if (this.currentStencil.borderChild) {
      this.currentStencil.borderChild.enabled = true;
    }

    // Keep stencil plane visible as the stamp (don't destroy!)
    this.currentStencil.sceneObject.enabled = true;

    print("[StencilHoverController] Placed stencil #" + placementIdx +
          " at UV: (" + center.x.toFixed(3) + ", " + center.y.toFixed(3) + ")" +
          " with color: (" + color.r.toFixed(2) + ", " + color.g.toFixed(2) + ", " + color.b.toFixed(2) + ")");

    // Clear current (will create new one on next activation)
    this.currentStencil = null;

    // Disable stencil preview in target shader
    if (this.targetMaterial) {
      this.targetMaterial.mainPass.stencilActive = 0.0;
    }
    this.setTargetPreviewAlpha(0);

    // Deactivate interaction
    this._isActive = false;
    this._state = StencilState.Idle;

    // Switch to spray mode
    this.deactivateStencilToggle();

    // Notify callback
    if (this.onPlacementConfirmed) {
      this.onPlacementConfirmed();
    }
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
   * Set the stencil texture for new stencil instances.
   */
  setStencilTexture(texture: Texture): void {
    this.currentStencilTexture = texture;
    print("[StencilHoverController] setStencilTexture called with texture: " + (texture ? "valid" : "null"));

    // Also update current stencil if hovering - use "map" property
    if (this.currentStencil && this.currentStencil.material) {
      this.currentStencil.texture = texture;
      this.currentStencil.material.mainPass.map = texture;
      print("[StencilHoverController] Updated current stencil instance material (map property)");
    } else {
      print("[StencilHoverController] No current stencil to update (will apply on next activation)");
    }

    // Update target material's current stencil for preview/compositing
    if (this.targetMaterial) {
      // Try multiple property names for target compositing material
      this.targetMaterial.mainPass.currentStencil = texture;
      this.targetMaterial.mainPass.stencilTex = texture;
      this.targetMaterial.mainPass.stencilMask = texture;
      print("[StencilHoverController] Updated target material with stencil texture");
    } else {
      print("[StencilHoverController] WARNING: No target material to update!");
    }
  }

  /**
   * Get info about the currently hovering stencil (before placement).
   * Returns null if no stencil is hovering.
   * Note: After placement, stencils are stamped and destroyed.
   */
  getCurrentStencil(): { center: vec2; scale: vec2; texture: Texture | null } | null {
    if (!this.currentStencil) return null;

    return {
      center: this.currentStencil.center,
      scale: this.currentStencil.scale,
      texture: this.currentStencil.texture
    };
  }

  /**
   * Get the total number of stencils that have been stamped.
   */
  getStampedCount(): number {
    return this.placementCounter;
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

  // ============================================================================
  // ACTIVE COLOR API
  // ============================================================================

  /**
   * Set the active color for stencil stamping.
   * This color will be used when placing stencils.
   * @param color RGBA color (0-1 range)
   */
  setActiveColor(color: vec4): void {
    this._activeColor = color;
    this._useOwnColor = true;
    print("[StencilHoverController] Active color set to: (" +
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
   * Get the current active color for stencil stamping.
   * Returns own color if set, otherwise SprayController's color.
   */
  getActiveColor(): vec4 {
    if (this._useOwnColor) {
      return this._activeColor;
    }
    if (this.sprayController) {
      return this.sprayController.getActiveColor();
    }
    return this._activeColor;
  }

  /**
   * Clear the custom active color and use SprayController's color instead.
   */
  clearActiveColor(): void {
    this._useOwnColor = false;
    print("[StencilHoverController] Using SprayController's color");
  }

  /**
   * Check if using custom active color or SprayController's color.
   */
  isUsingOwnColor(): boolean {
    return this._useOwnColor;
  }
}
