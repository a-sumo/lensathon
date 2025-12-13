// Version: 0.1.0 (PlanePointerDebug)
// Purpose: Move a pointer over a 3D plane and display normalized UV (0..1)
// Notes: Uses Touch events for simplicity. For device, we can later wire SIK hand ray.

//@input Component.Camera camera
//@input SceneObject planeObj
//@input Component.Text readout

//@input bool useNormalizedDepth = true
//@input float nearDepth = 0.0 {"widget":"slider","min":0.0,"max":1.0,"step":0.01}
//@input float farDepth = 1.0 {"widget":"slider","min":0.0,"max":2.0,"step":0.01}
//@input float worldNearDepth = -500.0
//@input float worldFarDepth = 200.0

//@input bool invertPlaneNormal = false
//@input bool debugDraw = true
//@input bool logToConsole = true

//@input bool autoPlaneSize = true
//@input float planeWidth = 1.0
//@input float planeHeight = 1.0

function clamp01(x) { return Math.max(0.0, Math.min(1.0, x)); }

function intersectRayPlane(ro, rd, origin, normal) {
    var denom = rd.dot(normal);
    if (Math.abs(denom) < 1e-4) { return null; }
    var t = origin.sub(ro).dot(normal) / denom;
    if (t < 0) { return null; }
    return ro.add(rd.uniformScale(t));
}

function computeUV(hitPos, origin, right, up, width, height) {
    var rel = hitPos.sub(origin);
    var u = 0.5 + rel.dot(right) / (width !== 0 ? width : 1.0);
    var v = 0.5 + rel.dot(up) / (height !== 0 ? height : 1.0);
    return new vec2(clamp01(u), clamp01(v));
}

function getRayFromScreen(uv) {
    var pNear = script.useNormalizedDepth
        ? script.camera.screenSpaceToWorldSpace(uv, script.nearDepth)
        : script.camera.screenSpaceToWorldSpace(uv, script.worldNearDepth);
    var pFar = script.useNormalizedDepth
        ? script.camera.screenSpaceToWorldSpace(uv, script.farDepth)
        : script.camera.screenSpaceToWorldSpace(uv, script.worldFarDepth);
    var dir = pFar.sub(pNear);
    var len = dir.length;
    if (len > 0.00001) dir = dir.uniformScale(1.0 / len);
    return { ro: pNear, rd: dir, pFar: pFar };
}

function onMove(ev) {
    if (!script.camera || !script.planeObj) { return; }
    var uv = ev.getTouchPosition();

    var ray = getRayFromScreen(uv);
    var tr = script.planeObj.getTransform();
    var origin = tr.getWorldPosition();
    var normal = tr.forward;
    if (script.invertPlaneNormal) { normal = normal.uniformScale(-1); }
    var right = tr.right;
    var up = tr.up;

    var width = script.planeWidth;
    var height = script.planeHeight;
    if (script.autoPlaneSize) {
        var s = tr.getWorldScale();
        width = Math.abs(s.x);
        height = Math.abs(s.y);
    }

    var hit = intersectRayPlane(ray.ro, ray.rd, origin, normal);
    if (!hit) { return; }

    var uv01 = computeUV(hit, origin, right, up, width, height);

    if (script.debugDraw && global.debugRenderSystem) {
        global.debugRenderSystem.drawLine(ray.ro, hit, new vec4(1,0.8,0.2,1));
        global.debugRenderSystem.drawSphere(hit, 0.5, new vec4(0.2,1.0,0.4,1));
    }

    if (script.readout) {
        script.readout.text = "u=" + uv01.x.toFixed(3) + ", v=" + uv01.y.toFixed(3);
    }
    if (script.logToConsole) {
        print("[PlanePointerDebug] u=" + uv01.x.toFixed(4) + ", v=" + uv01.y.toFixed(4));
    }
}

script.createEvent("TouchMoveEvent").bind(onMove);
script.createEvent("TouchStartEvent").bind(onMove);

