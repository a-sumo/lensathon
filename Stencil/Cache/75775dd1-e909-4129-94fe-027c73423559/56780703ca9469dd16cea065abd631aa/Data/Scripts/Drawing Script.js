// Version: 5.0.0 (SIK input + Ortho Camera rendering)
// Hybrid approach:
// - INPUT: SIK Interactable events (works on Spectacles)
// - DRAWING: Ortho Camera + ScreenTransform.anchors + Render Target (proven mechanism)
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
        script.debugText.text = "v5.0.0 Ready\nPoint at plane...";
    }
    
    print("Drawing Script v5.0.0 initialized with Interactable + Ortho Camera");
}

// Convert world hit position to UV coordinates [0,1]
function worldToUV(worldPos) {
    var planeTransform = script.meshVis.getSceneObject().getTransform();
    var localPos = planeTransform.getInvertedWorldTransform().multiplyPoint(worldPos);
    
    // Unit Plane: local coords are [-0.5, +0.5], map to UV [0, 1]
    var u = localPos.x + 0.5;
    var v = 1.0 - (localPos.z + 0.5); // Invert Y axis
    
    // Clamp to [0,1]
    return {
        u: Math.max(0.0, Math.min(1.0, u)),
        v: Math.max(0.0, Math.min(1.0, v)),
        localX: localPos.x,
        localZ: localPos.z
    };
}

// Draw brush strokes in ortho camera
function drawBrushStrokes() {
    if (prevPointCoord.distance(pointCoordThe) < 0.4) {
        // Calculate half brush size for centering
        var halfBrushW = (brushSize * aspectRatio) * 0.5;
        var halfBrushH = brushSize * 0.5;
        
        for (var t = 0; t < 30; t++) {
            var lerpValue = vec2.lerp(prevPointCoord, pointCoordThe, t / 29);
            // Center the brush on the point
            drawingObjects[t].getComponent("Component.ScreenTransform").anchors = Rect.create(
                lerpValue.x - halfBrushW,  // left
                lerpValue.x + halfBrushW,  // right
                lerpValue.y - halfBrushH,  // bottom
                lerpValue.y + halfBrushH   // top
            );
        }

        prevPointCoord = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
    } else {
        prevPointCoord = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
    }
    
    if (!visible) {
        script.DrawingObjects.enabled = true;
        visible = true;
    }
}

// Process hit position from interactor
function processHitPosition(interactor) {
    var hitPos = interactor.targetHitPosition;
    
    if (!hitPos) {
        // Try targetHitInfo
        var hitInfo = interactor.targetHitInfo;
        if (hitInfo && hitInfo.localHitPosition) {
            var localPos = hitInfo.localHitPosition;
            pointCoordX = localPos.x + 0.5;
            pointCoordY = 1.0 - (localPos.z + 0.5);
            pointCoordX = Math.max(0.0, Math.min(1.0, pointCoordX));
            pointCoordY = Math.max(0.0, Math.min(1.0, pointCoordY));
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

// Called when user starts pinching on the plane
function onTriggerStart(eventArgs) {
    isDrawing = true;
    
    if (processHitPosition(eventArgs.interactor)) {
        // Reset previous point on new stroke
        prevPointCoord = new vec2(pointCoordX * 2 - 1, pointCoordY * 2 - 1);
    }
    
    if (script.debugText) {
        script.debugText.text = "DRAWING STARTED\nUV: " + pointCoordX.toFixed(2) + ", " + pointCoordY.toFixed(2);
    }
}

// Called every frame while pinching on the plane
function onTriggerUpdate(eventArgs) {
    if (!isDrawing) return;
    
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
    
    if (processHitPosition(eventArgs.interactor)) {
        if (script.debugText) {
            script.debugText.text = 
                "v5.0.0 HOVER\n" +
                "UV: (" + pointCoordX.toFixed(2) + ", " + pointCoordY.toFixed(2) + ")\n" +
                "Pinch to draw!";
        }
    }
}

// Bind start event
script.createEvent("OnStartEvent").bind(onStart);
