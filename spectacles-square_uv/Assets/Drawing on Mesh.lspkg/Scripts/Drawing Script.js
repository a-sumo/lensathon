// Version: 5.3.0 (Vector projection UV - any orientation)
// Hybrid approach:
// - INPUT: SIK Interactable events (works on Spectacles)
// - DRAWING: Ortho Camera + ScreenTransform.anchors + Render Target (proven mechanism)
// - UV: Vector projection using plane's right/up vectors (works for diagonal planes!)
// - STATE: Only processes input when global.isDrawingMode() returns true
// REQUIRES: Interactable component on meshVis object!
// -----JS CODE-----

//@input Component.Camera camera;

//@input Asset.Texture cameraTex;

//@input Asset.Texture renderTarget;

// The plane to draw on - MUST have Interactable component!
//@input Component.RenderMeshVisual meshVis;

//@input SceneObject DrawingObjects;

//@input float drawingSize = 0.03 {"widget": "slider", "min": 0.001, "max": 1, "step": 0.001};

//@input Asset.Texture customizeTexture;
//@input bool aspectFromCustomizeTexture = true
//@input bool aspectFromRenderTarget = false

//@input Component.Text debugText

// SIK import
var Interactable = require("SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable").Interactable;

var drawingObjects;
var prevPointCoord = new vec2(0, 0);
var isDrawing = false;
var pointCoordThe = new vec2(0, 0);
var pointCoordX = 0;
var pointCoordY = 0;
var aspectRatio = 1.0;
var brushSize;
var visible = false;
var planeInteractable = null;

// Initialize on start
function onStart(eventData) {
    brushSize = script.drawingSize;
    
    // Get aspect ratio from texture
    var aspectTex = null;
    if (script.aspectFromCustomizeTexture && script.customizeTexture) {
        aspectTex = script.customizeTexture;
    } else if (script.aspectFromRenderTarget && script.renderTarget) {
        aspectTex = script.renderTarget;
    } else if (script.cameraTex) {
        aspectTex = script.cameraTex;
    }
    if (aspectTex && aspectTex.getWidth && aspectTex.getHeight && aspectTex.getWidth() !== 0) {
        aspectRatio = aspectTex.getHeight() / aspectTex.getWidth();
    } else {
        aspectRatio = 1.0;
    }

    drawingObjects = script.DrawingObjects.children;

    // Set brush texture for all drawing objects
    drawingObjects.forEach(function(current) {
        var imgComp = current.getComponent("Component.Image");
        if (imgComp) {
            imgComp.getMaterial(0).mainPass.baseTex = script.customizeTexture;
        }
    });

    // Create collider for meshVis if not exists
    var meshObj = script.meshVis.getSceneObject();
    var existingCollider = meshObj.getComponent("Physics.ColliderComponent");
    if (!existingCollider) {
        meshObj.createComponent("Physics.ColliderComponent");
        var meshShape = Shape.createMeshShape();
        meshShape.mesh = script.meshVis.mesh;
        meshObj.getComponent("Physics.ColliderComponent").shape = meshShape;
    }

    // Get Interactable component from meshVis object
    planeInteractable = meshObj.getComponent(Interactable.getTypeName());
    
    if (!planeInteractable) {
        print("ERROR: No Interactable component on meshVis! Please add one in Lens Studio.");
        if (script.debugText) {
            script.debugText.text = "ERROR: Add Interactable\nto drawing plane!";
        }
        return;
    }
    
    // Subscribe to Interactable events
    planeInteractable.onTriggerStart.add(onTriggerStart);
    planeInteractable.onTriggerUpdate.add(onTriggerUpdate);
    planeInteractable.onTriggerEnd.add(onTriggerEnd);
    planeInteractable.onHoverUpdate.add(onHoverUpdate);
    
    if (script.debugText) {
        script.debugText.text = "v5.3.0 Ready\nAny orientation OK!";
    }
    
    print("Drawing Script v5.3.0 initialized. Using vector projection (any orientation).");
}

// Convert world hit position to UV coordinates [0,1]
// Works for ANY plane orientation including diagonal!
function worldToUV(worldPos) {
    var planeTransform = script.meshVis.getSceneObject().getTransform();
    var planePos = planeTransform.getWorldPosition();
    var planeScale = planeTransform.getWorldScale();
    
    // Get plane's local axes in world space
    var planeRight = planeTransform.right;  // X axis (width)
    var planeUp = planeTransform.up;        // Y axis (height)
    
    // Vector from plane center to hit point
    var toHit = worldPos.sub(planePos);
    
    // Project onto plane's local axes and normalize by scale
    // This gives us coordinates in [-0.5, 0.5] range
    var localX = toHit.dot(planeRight) / planeScale.x;
    var localY = toHit.dot(planeUp) / planeScale.y;
    
    // Map from [-0.5, 0.5] to [0, 1]
    var u = localX + 0.5;
    var v = localY + 0.5;
    
    // Clamp to [0,1]
    return {
        u: Math.max(0.0, Math.min(1.0, u)),
        v: Math.max(0.0, Math.min(1.0, v))
    };
}

// Draw brush strokes in ortho camera
function drawBrushStrokes() {
    var distance = prevPointCoord.distance(pointCoordThe);
    print("drawBrushStrokes: distance = " + distance.toFixed(3) + ", pointCoordThe = " + pointCoordThe.toString());
    
    if (distance < 0.4) {
        // Calculate half brush size for centering
        var halfBrushW = (brushSize * aspectRatio) * 0.5;
        var halfBrushH = brushSize * 0.5;
        
        print("drawBrushStrokes: drawing " + drawingObjects.length + " objects, brushSize=" + brushSize);
        
        for (var t = 0; t < 30 && t < drawingObjects.length; t++) {
            var lerpValue = vec2.lerp(prevPointCoord, pointCoordThe, t / 29);
            var screenTransform = drawingObjects[t].getComponent("Component.ScreenTransform");
            if (screenTransform) {
                // Center the brush on the point
                screenTransform.anchors = Rect.create(
                    lerpValue.x - halfBrushW,  // left
                    lerpValue.x + halfBrushW,  // right
                    lerpValue.y - halfBrushH,  // bottom
                    lerpValue.y + halfBrushH   // top
                );
            }
        }

        prevPointCoord = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
    } else {
        print("drawBrushStrokes: distance too large, resetting prevPointCoord");
        prevPointCoord = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
    }
    
    if (!visible) {
        print("drawBrushStrokes: enabling DrawingObjects");
        script.DrawingObjects.enabled = true;
        visible = true;
    }
}

// Process hit position from interactor
function processHitPosition(interactor) {
    var hitPos = interactor.targetHitPosition;
    
    if (!hitPos) {
        // Try targetHitInfo - convert local to world and use worldToUV
        var hitInfo = interactor.targetHitInfo;
        if (hitInfo && hitInfo.localHitPosition) {
            var localPos = hitInfo.localHitPosition;
            // Convert local position to world position
            var planeTransform = script.meshVis.getSceneObject().getTransform();
            var worldHitPos = planeTransform.getWorldTransform().multiplyPoint(localPos);
            
            var uvResult = worldToUV(worldHitPos);
            pointCoordX = uvResult.u;
            pointCoordY = uvResult.v;
            pointCoordThe = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
            return true;
        }
        return false;
    }
    
    var uvResult = worldToUV(hitPos);
    pointCoordX = uvResult.u;
    pointCoordY = uvResult.v;
    pointCoordThe = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
    
    return true;
}

// Check if app is in Drawing mode
function canDraw() {
    // global.isDrawingMode is set by AppStateController
    if (typeof global.isDrawingMode === "function") {
        var result = global.isDrawingMode();
        print("canDraw: global.isDrawingMode() = " + result);
        return result;
    }
    // If AppStateController not found, allow drawing (fallback)
    print("canDraw: no global.isDrawingMode, returning true");
    return true;
}

// Called when user starts pinching on the plane
function onTriggerStart(eventArgs) {
    print("onTriggerStart called!");
    
    // Only draw if in Drawing mode
    if (!canDraw()) {
        print("onTriggerStart: canDraw() returned false, skipping");
        if (script.debugText) {
            script.debugText.text = "Mode: Creating Rectangle\n(not drawing)";
        }
        return;
    }
    
    isDrawing = true;
    print("onTriggerStart: isDrawing = true");
    
    if (processHitPosition(eventArgs.interactor)) {
        // Reset previous point on new stroke
        prevPointCoord = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
        print("onTriggerStart: processHitPosition success, UV: " + pointCoordX.toFixed(2) + ", " + pointCoordY.toFixed(2));
    } else {
        print("onTriggerStart: processHitPosition FAILED");
    }
    
    if (script.debugText) {
        script.debugText.text = "DRAWING STARTED\nUV: " + pointCoordX.toFixed(2) + ", " + pointCoordY.toFixed(2);
    }
}

// Called every frame while pinching on the plane
function onTriggerUpdate(eventArgs) {
    if (!isDrawing || !canDraw()) return;
    
    if (processHitPosition(eventArgs.interactor)) {
        drawBrushStrokes();
        
        if (script.debugText) {
            script.debugText.text = 
                "DRAWING\n" +
                "UV: (" + pointCoordX.toFixed(2) + ", " + pointCoordY.toFixed(2) + ")\n" +
                "anchor: (" + (pointCoordX * 2 - 1).toFixed(2) + ", " + (pointCoordY * 2 - 1).toFixed(2) + ")";
        }
    }
}

// Called when user stops pinching
function onTriggerEnd(eventArgs) {
    isDrawing = false;
    
    if (script.debugText) {
        script.debugText.text = "DRAWING STOPPED\nPinch to draw!";
    }
}

// Called while hovering (not pinching) - for debug
function onHoverUpdate(eventArgs) {
    if (isDrawing) return;
    
    var drawingMode = canDraw();
    
    if (processHitPosition(eventArgs.interactor)) {
        if (script.debugText) {
            if (drawingMode) {
                script.debugText.text = 
                    "v5.3.0 DRAWING MODE\n" +
                    "UV: (" + pointCoordX.toFixed(2) + ", " + pointCoordY.toFixed(2) + ")\n" +
                    "Pinch to draw!";
            } else {
                script.debugText.text = 
                    "v5.3.0 CREATE MODE\n" +
                    "Creating rectangle...\n" +
                    "(drawing disabled)";
            }
        }
    }
}

// Bind start event
script.createEvent("OnStartEvent").bind(onStart);
