// import required modules
const WorldQueryModule = require("LensStudio:WorldQueryModule");
const SIK = require("SpectaclesInteractionKit.lspkg/SIK").SIK;
const InteractorTriggerType = require("SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor").InteractorTriggerType;

import { AppStateController, AppState } from "./AppStateController";

const EPSILON = 0.01;

enum RectangleState {
  WaitingForFirstCorner, // Waiting for first click
  Stretching,           // Stretching from first to second corner
  Completed            // Rectangle completed
}

/**
 * Script for creating a rectangle on a wall with two clicks
 * Version: 3.0.0 - Integrated with AppStateController
 * Uses WorldQueryModule to determine position on surface
 * Manages visual elements: gray background (ImageAnchor), 4 corner markers, and spawned icon planes
 * 
 * Algorithm: Direct corner assignment (NO SHIFTS, NO DOUBLING)
 * - First click IS bottomLeft corner (direct assignment)
 * - Second click IS topRight corner (direct assignment)
 * - Calculate bottomRight and topLeft from these two corners
 * - Use world distances between actual corners for rectangle dimensions
 * 
 * Performance optimizations:
 * - Threshold-based updates to skip recalculation when hand movement is minimal
 * - Cached normalized wall normal and coordinate system
 * - Removed debug logs for production performance
 * 
 * Note: ImageAnchor should have zero offset in Lens Studio Inspector
 */
@component
export class WallRectangleGizmo extends BaseScriptComponent {
  @input imageAnchor: SceneObject;
  
  @input topLeftCorner: SceneObject;
  @input topRightCorner: SceneObject;
  @input bottomRightCorner: SceneObject;
  @input bottomLeftCorner: SceneObject;
  
  @input bottomLeftIconPrefab: SceneObject;  // Prefab to spawn at first click (also used as preview)
  @input topRightIconPrefab: SceneObject;   // Prefab to spawn at second click (also used as preview)
  
  private hitTestSession: HitTestSession;
  private primaryInteractor;
  private state: RectangleState = RectangleState.WaitingForFirstCorner;
  
  // Rectangle corner points
  private firstCorner: vec3 | null = null;
  private secondCorner: vec3 | null = null;
  private wallNormal: vec3 | null = null;
  
  // Spawned icon objects (permanent copies)
  private spawnedBottomLeftIcon: SceneObject | null = null;
  private spawnedTopRightIcon: SceneObject | null = null;
  
  // Calculated corner positions (projected on plane)
  private bottomLeftFinalPosition: vec3 | null = null;
  private topRightFinalPosition: vec3 | null = null;
  
  // Transforms for managing
  private imageAnchorTransform: Transform;
  private topLeftTransform: Transform;
  private topRightTransform: Transform;
  private bottomRightTransform: Transform;
  private bottomLeftTransform: Transform;
  private rotMat = new mat3();
  
  // Preview transforms (for showing preview before clicking)
  private bottomLeftPreviewTransform: Transform | null = null;
  private topRightPreviewTransform: Transform | null = null;
  
  // Performance optimization: cached values and threshold-based updates
  private cachedWallNormal: vec3 | null = null;
  private cachedUpDirection: vec3 | null = null;
  private cachedRightDirection: vec3 | null = null;
  private lastSecondCorner: vec3 | null = null;
  private readonly UPDATE_THRESHOLD_SQUARED = 0.0001; // ~0.01 units movement threshold (squared for distanceSquared)

  onAwake() {
    // Create hit test session
    var options = HitTestSessionOptions.create();
    options.filter = true; // Filtering for more stable results
    this.hitTestSession = WorldQueryModule.createHitTestSessionWithOptions(options);
    
    // Get transforms
    this.imageAnchorTransform = this.imageAnchor.getTransform();
    this.topLeftTransform = this.topLeftCorner.getTransform();
    this.topRightTransform = this.topRightCorner.getTransform();
    this.bottomRightTransform = this.bottomRightCorner.getTransform();
    this.bottomLeftTransform = this.bottomLeftCorner.getTransform();
    
    // Initially hide all elements
    this.imageAnchor.enabled = false;
    this.topLeftCorner.enabled = false;
    this.topRightCorner.enabled = false;
    this.bottomRightCorner.enabled = false;
    this.bottomLeftCorner.enabled = false;
    
    // Setup preview objects (hide initially)
    if (this.bottomLeftIconPrefab) {
      this.bottomLeftIconPrefab.enabled = false;
      this.bottomLeftPreviewTransform = this.bottomLeftIconPrefab.getTransform();
    }
    if (this.topRightIconPrefab) {
      this.topRightIconPrefab.enabled = false;
      this.topRightPreviewTransform = this.topRightIconPrefab.getTransform();
    }
    
    // Create update event
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
  }

  onUpdate() {
    // Check if we're in Drawing mode - if so, don't process rectangle creation
    const appState = AppStateController.getInstance();
    if (appState && appState.isDrawing()) {
      // In drawing mode - don't create new rectangles
      return;
    }
    
    this.primaryInteractor = SIK.InteractionManager.getTargetingInteractors().shift();
    
    if (!this.primaryInteractor || !this.primaryInteractor.isActive() || !this.primaryInteractor.isTargeting()) {
      // If no active interactor, hide preview
      if (this.state === RectangleState.Stretching) {
        this.imageAnchor.enabled = false;
        this.topLeftCorner.enabled = false;
        this.topRightCorner.enabled = false;
        this.bottomRightCorner.enabled = false;
        this.bottomLeftCorner.enabled = false;
      }
      return;
    }

    // Perform hit test from hand to surface
    const rayStart = this.primaryInteractor.startPoint;
    const rayEnd = this.primaryInteractor.endPoint;
    
    this.hitTestSession.hitTest(rayStart, rayEnd, this.onHitTestResult.bind(this));
    
    // Check pinch for fixing points
    this.handlePinchInput();
  }

  private handlePinchInput() {
    if (!this.primaryInteractor) return;
    
    const triggerStarted = 
      this.primaryInteractor.previousTrigger === InteractorTriggerType.None &&
      this.primaryInteractor.currentTrigger !== InteractorTriggerType.None;
    
    const triggerEnded = 
      this.primaryInteractor.previousTrigger !== InteractorTriggerType.None &&
      this.primaryInteractor.currentTrigger === InteractorTriggerType.None;

    if (triggerStarted) {
      // Pinch started - fix point
      if (this.state === RectangleState.WaitingForFirstCorner && this.firstCorner) {
        // Fix first point - hide preview, spawn permanent icon after corner calculation
        this.state = RectangleState.Stretching;
        if (this.bottomLeftIconPrefab) {
          this.bottomLeftIconPrefab.enabled = false; // Hide preview
        }
        // Clear cache when starting new rectangle
        this.cachedWallNormal = null;
        this.cachedUpDirection = null;
        this.cachedRightDirection = null;
        this.lastSecondCorner = null;
      } else if (this.state === RectangleState.Stretching && this.secondCorner && this.bottomLeftFinalPosition) {
        // Fix second point - hide preview, spawn both permanent icons now that we have calculated positions
        this.state = RectangleState.Completed;
        if (this.topRightIconPrefab) {
          this.topRightIconPrefab.enabled = false; // Hide preview
        }
        if (this.bottomLeftFinalPosition) {
          this.spawnBottomLeftIcon(this.bottomLeftFinalPosition, this.wallNormal);
        }
        if (this.topRightFinalPosition) {
          this.spawnTopRightIcon(this.topRightFinalPosition, this.wallNormal);
        }
        // Ensure all corners remain visible after completion
        this.topLeftCorner.enabled = true;
        this.topRightCorner.enabled = true;
        this.bottomRightCorner.enabled = true;
        this.bottomLeftCorner.enabled = true;
        // Clear cache when rectangle is completed
        this.lastSecondCorner = null;
        
        // SWITCH TO DRAWING MODE - rectangle is ready for drawing!
        const appState = AppStateController.getInstance();
        if (appState) {
          appState.switchToDrawingMode();
          print("Rectangle completed! Switched to Drawing mode.");
        }
      }
      // REMOVED: No longer create new rectangle when in Completed state
      // User must explicitly switch back to CreatingRectangle mode to create new rectangle
    }
  }

  private onHitTestResult(results: WorldQueryHitTestResult) {
    if (results === null) {
      // Wall not found - hide preview
      if (this.state === RectangleState.Stretching) {
        this.imageAnchor.enabled = false;
        this.topLeftCorner.enabled = false;
        this.topRightCorner.enabled = false;
        this.bottomRightCorner.enabled = false;
        this.bottomLeftCorner.enabled = false;
      }
      // Hide preview icons when no wall detected
      this.hidePreviewIcons();
      // In Completed state, keep all corners visible (don't hide them when wall not detected)
      // They will be hidden only when starting a new rectangle via resetRectangle()
      return;
    }

    const hitPosition = results.position;
    const hitNormal = results.normal;

    if (this.state === RectangleState.WaitingForFirstCorner) {
      // Save first point
      this.firstCorner = hitPosition;
      this.wallNormal = hitNormal;
      
      // Show preview of first icon at hit position
      this.updatePreviewIcon(hitPosition, hitNormal, true);
      
      // Show only first corner marker
      this.bottomLeftCorner.enabled = true;
      this.bottomLeftTransform.setWorldPosition(hitPosition);
      this.imageAnchor.enabled = false;
      
    } else if (this.state === RectangleState.Stretching) {
      // Performance optimization: skip update if position hasn't changed significantly
      if (this.lastSecondCorner && hitPosition.distanceSquared(this.lastSecondCorner) < this.UPDATE_THRESHOLD_SQUARED) {
        return;
      }
      
      // Update second point and show rectangle preview
      this.secondCorner = hitPosition;
      this.lastSecondCorner = hitPosition;
      
      // Show preview of second icon at hit position
      this.updatePreviewIcon(hitPosition, hitNormal, false);
      
      // Ensure both points are on same plane (normal check)
      if (this.wallNormal && Math.abs(this.wallNormal.dot(hitNormal.normalize()) - 1.0) > 0.1) {
        // Normals don't match - possibly different wall, hide
        this.imageAnchor.enabled = false;
        this.hidePreviewIcons();
        return;
      }
      
      // Update rectangle visualization
      this.updateRectangleVisualization();
      
    } else if (this.state === RectangleState.Completed) {
      // Rectangle completed - keep all corners visible, don't prepare for new rectangle
      // (User needs to switch back to CreatingRectangle mode to create new rectangle)
      this.bottomLeftCorner.enabled = true;
      this.topLeftCorner.enabled = true;
      this.topRightCorner.enabled = true;
      this.bottomRightCorner.enabled = true;
      
      // Hide preview icons in completed state
      if (this.bottomLeftIconPrefab) {
        this.bottomLeftIconPrefab.enabled = false;
      }
      if (this.topRightIconPrefab) {
        this.topRightIconPrefab.enabled = false;
      }
    }
  }

  /**
   * Resets rectangle state - removes old visual elements and clears data
   */
  private resetRectangle() {
    // Remove spawned icon objects
    if (this.spawnedBottomLeftIcon) {
      this.spawnedBottomLeftIcon.destroy();
      this.spawnedBottomLeftIcon = null;
    }
    if (this.spawnedTopRightIcon) {
      this.spawnedTopRightIcon.destroy();
      this.spawnedTopRightIcon = null;
    }
    
    // Clear second corner data (keep firstCorner for new rectangle)
    this.secondCorner = null;
    this.bottomLeftFinalPosition = null;
    this.topRightFinalPosition = null;
    this.lastSecondCorner = null;
    
    // Hide all visual elements except bottomLeftCorner (will be updated in onHitTestResult)
    this.imageAnchor.enabled = false;
    this.topLeftCorner.enabled = false;
    this.topRightCorner.enabled = false;
    this.bottomRightCorner.enabled = false;
    // Keep bottomLeftCorner enabled - it will be updated in onHitTestResult
    // Note: bottomLeftCorner should already be enabled from onHitTestResult in Completed state
    
    // Hide preview icons
    if (this.bottomLeftIconPrefab) {
      this.bottomLeftIconPrefab.enabled = false;
    }
    if (this.topRightIconPrefab) {
      this.topRightIconPrefab.enabled = false;
    }
  }
  
  /**
   * Updates preview icon position and rotation while hovering over wall
   */
  private updatePreviewIcon(position: vec3, normal: vec3, isFirstIcon: boolean) {
    const prefab = isFirstIcon ? this.bottomLeftIconPrefab : this.topRightIconPrefab;
    const transform = isFirstIcon ? this.bottomLeftPreviewTransform : this.topRightPreviewTransform;
    
    if (!prefab || !transform) return;
    
    // Calculate rotation for plane to face camera
    var lookDirection: vec3;
    if (1 - Math.abs(normal.normalize().dot(vec3.up())) < EPSILON) {
      lookDirection = vec3.forward();
    } else {
      lookDirection = normal.cross(vec3.up());
    }
    
    const toRotation = quat.lookAt(lookDirection, normal);
    
    // Update preview position and rotation
    prefab.enabled = true;
    transform.setWorldPosition(position);
    transform.setWorldRotation(toRotation);
  }
  
  /**
   * Hides preview icons when wall is not detected
   */
  private hidePreviewIcons() {
    if (this.bottomLeftIconPrefab && this.state === RectangleState.WaitingForFirstCorner) {
      this.bottomLeftIconPrefab.enabled = false;
    }
    if (this.topRightIconPrefab && this.state === RectangleState.Stretching) {
      this.topRightIconPrefab.enabled = false;
    }
  }
  
  /**
   * Spawns bottom-left icon plane at first click position
   */
  private spawnBottomLeftIcon(position: vec3, normal: vec3) {
    if (!this.bottomLeftIconPrefab) {
      print("Warning: bottomLeftIconPrefab not set");
      return;
    }

    // Calculate rotation for plane to face camera
    var lookDirection: vec3;
    if (1 - Math.abs(normal.normalize().dot(vec3.up())) < EPSILON) {
      lookDirection = vec3.forward();
    } else {
      lookDirection = normal.cross(vec3.up());
    }

    const toRotation = quat.lookAt(lookDirection, normal);
    
    // Get parent of prefab (or use null for scene root)
    let parent = this.bottomLeftIconPrefab.getParent();
    
    // Spawn new instance
    let newObject = parent ? parent.copyWholeHierarchy(this.bottomLeftIconPrefab) : this.bottomLeftIconPrefab.copyWholeHierarchy(this.bottomLeftIconPrefab);
    newObject.setParentPreserveWorldTransform(null);
    
    // Set position and rotation
    newObject.getTransform().setWorldPosition(position);
    newObject.getTransform().setWorldRotation(toRotation);
    
    // Store reference
    this.spawnedBottomLeftIcon = newObject;
  }

  /**
   * Spawns top-right icon plane at second click position
   */
  private spawnTopRightIcon(position: vec3, normal: vec3) {
    if (!this.topRightIconPrefab) {
      print("Warning: topRightIconPrefab not set");
      return;
    }

    // Calculate rotation for plane to face camera
    var lookDirection: vec3;
    if (1 - Math.abs(normal.normalize().dot(vec3.up())) < EPSILON) {
      lookDirection = vec3.forward();
    } else {
      lookDirection = normal.cross(vec3.up());
    }

    const toRotation = quat.lookAt(lookDirection, normal);
    
    // Get parent of prefab (or use null for scene root)
    let parent = this.topRightIconPrefab.getParent();
    
    // Spawn new instance
    let newObject = parent ? parent.copyWholeHierarchy(this.topRightIconPrefab) : this.topRightIconPrefab.copyWholeHierarchy(this.topRightIconPrefab);
    newObject.setParentPreserveWorldTransform(null);
    
    // Set position and rotation
    newObject.getTransform().setWorldPosition(position);
    newObject.getTransform().setWorldRotation(toRotation);
    
    // Store reference
    this.spawnedTopRightIcon = newObject;
  }

  private updateRectangleVisualization() {
    if (!this.firstCorner || !this.secondCorner || !this.wallNormal) return;

    // Performance optimization: cache normalized wall normal and coordinate system
    // Recalculate only if wall normal changed (should be rare during stretching)
    const wallNormal = this.wallNormal.normalize();
    const normalChanged = !this.cachedWallNormal || 
      Math.abs(this.cachedWallNormal.dot(wallNormal) - 1.0) > EPSILON;
    
    if (normalChanged) {
      this.cachedWallNormal = wallNormal;
      
      // Vertical direction (projection of "up" vector onto wall plane)
      if (1 - Math.abs(wallNormal.dot(vec3.up())) < EPSILON) {
        // Wall is horizontal
        this.cachedUpDirection = vec3.forward();
      } else {
        this.cachedUpDirection = vec3.up().sub(wallNormal.uniformScale(vec3.up().dot(wallNormal))).normalize();
      }
      
      // Horizontal direction
      this.cachedRightDirection = this.cachedUpDirection.cross(wallNormal).normalize();
    }
    
    // Use cached coordinate system
    const upDirection = this.cachedUpDirection!;
    const rightDirection = this.cachedRightDirection!;

    // Project both points onto wall plane
    // Reference point for projection is the first corner
    // Use cached normalized normal
    const firstOnPlane = this.projectPointOntoPlane(this.firstCorner, this.cachedWallNormal!, this.firstCorner);
    const secondOnPlane = this.projectPointOntoPlane(this.secondCorner, this.cachedWallNormal!, this.firstCorner);

    // DIRECT CORNER ASSIGNMENT: clicks ARE corners, no interpretation needed
    // First click IS bottomLeft corner
    const bottomLeftFinal = firstOnPlane;
    
    // Second click IS topRight corner
    const topRightFinal = secondOnPlane;
    
    // Store calculated positions for icon spawning
    this.bottomLeftFinalPosition = bottomLeftFinal;
    this.topRightFinalPosition = topRightFinal;

    // Calculate vector from bottomLeft to topRight in wall coordinate system
    const delta = topRightFinal.sub(bottomLeftFinal);
    const widthComponent = delta.dot(rightDirection);   // Horizontal component (can be negative)
    const heightComponent = delta.dot(upDirection);     // Vertical component (can be negative)
    
    // Calculate remaining corners directly from bottomLeft and components
    // bottomRight = bottomLeft + widthComponent along rightDirection
    const bottomRightFinal = bottomLeftFinal.add(rightDirection.uniformScale(widthComponent));
    
    // topLeft = bottomLeft + heightComponent along upDirection
    const topLeftFinal = bottomLeftFinal.add(upDirection.uniformScale(heightComponent));
    
    // Calculate world distances between actual corners for rectangle dimensions
    const rectWidth = bottomLeftFinal.distance(bottomRightFinal);
    const rectHeight = bottomLeftFinal.distance(topLeftFinal);

    // Show all corners BEFORE setting positions to ensure they're visible
    this.topLeftCorner.enabled = true;
    this.topRightCorner.enabled = true;
    this.bottomRightCorner.enabled = true;
    this.bottomLeftCorner.enabled = true;
    
    // Set corner positions
    this.bottomLeftTransform.setWorldPosition(bottomLeftFinal);
    this.bottomRightTransform.setWorldPosition(bottomRightFinal);
    this.topLeftTransform.setWorldPosition(topLeftFinal);
    this.topRightTransform.setWorldPosition(topRightFinal);

    // Calculate center of rectangle (midpoint of diagonal)
    const center = bottomLeftFinal.add(topRightFinal).uniformScale(0.5);

    // Update gray background position and size
    this.imageAnchorTransform.setWorldPosition(center);
    this.imageAnchorTransform.setWorldScale(new vec3(rectWidth, rectHeight, 1));

    // Calculate rectangle rotation on the wall
    const rectRight = bottomRightFinal.sub(bottomLeftFinal).normalize();
    const rectUp = topLeftFinal.sub(bottomLeftFinal).normalize();
    const rectForward = rectRight.cross(rectUp).normalize();
    
    this.rotMat.column0 = rectRight;
    this.rotMat.column1 = rectUp;
    this.rotMat.column2 = rectForward;
    const rectRotation = quat.fromRotationMat(this.rotMat);
    this.imageAnchorTransform.setWorldRotation(rectRotation);
    
    // Show gray background
    this.imageAnchor.enabled = true;
  }

  /**
   * Projects a point onto a plane defined by normal and point on plane
   */
  private projectPointOntoPlane(point: vec3, planeNormal: vec3, planePoint: vec3): vec3 {
    const normalizedNormal = planeNormal.normalize();
    const pointToPlane = point.sub(planePoint);
    const distance = pointToPlane.dot(normalizedNormal);
    return point.sub(normalizedNormal.uniformScale(distance));
  }
}
