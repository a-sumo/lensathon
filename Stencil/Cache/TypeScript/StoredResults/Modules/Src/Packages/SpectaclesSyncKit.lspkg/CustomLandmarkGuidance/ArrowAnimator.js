"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrowAnimator = exports.ArrowType = void 0;
const animate_1 = require("SpectaclesInteractionKit.lspkg/Utils/animate");
const SceneObjectUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils");
var ArrowType;
(function (ArrowType) {
    ArrowType[ArrowType["None"] = 0] = "None";
    ArrowType[ArrowType["FigureEightYZ"] = 1] = "FigureEightYZ";
    ArrowType[ArrowType["FigureEightXY"] = 2] = "FigureEightXY";
    ArrowType[ArrowType["FigureEightXZ"] = 3] = "FigureEightXZ";
})(ArrowType || (exports.ArrowType = ArrowType = {}));
class ArrowAnimator {
    constructor(arrow) {
        this.arrow = arrow;
        this.arrowTransform = null;
        this.arrowStartPos = null;
        this.arrowStartRot = null;
        this.arrowRmv = null;
        this.cancelSet = new animate_1.CancelSet();
        if (this.arrow) {
            this.arrowTransform = this.arrow.getTransform();
            this.arrowStartPos = this.arrowTransform.getLocalPosition();
            this.arrowStartRot = this.arrowTransform.getLocalRotation();
            this.arrowRmv = (0, SceneObjectUtils_1.findComponentInChildren)(this.arrow, "Component.RenderMeshVisual");
        }
        this.setEnabled(false);
    }
    setEnabled(enabled) {
        if (this.arrow) {
            this.arrow.enabled = enabled;
        }
    }
    stop() {
        this.cancelSet.cancel();
    }
    play(type, displayTimeMs) {
        this.cancelSet.cancel();
        if (type === ArrowType.None || !this.arrowTransform) {
            return;
        }
        const duration = Math.max(0.01, displayTimeMs / 1000);
        if (type === ArrowType.FigureEightXY) {
            this.animateFigureEight(duration, /*plane*/ "xy");
        }
        else if (type === ArrowType.FigureEightXZ) {
            this.animateFigureEight(duration, /*plane*/ "xz");
        }
        else if (type === ArrowType.FigureEightYZ) {
            this.animateFigureEight(duration, /*plane*/ "yz");
        }
    }
    animateFigureEight(durationSeconds, plane) {
        const transform = this.arrowTransform;
        const amplitude = 7.0;
        const speed = 0.75;
        const updatePosition = (t) => {
            // Absolute (non-incremental) figure-8 with analytic tangent for rotation
            const theta = t * durationSeconds * speed; // absolute parameter
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            const cos2 = Math.cos(2 * theta);
            const sin2 = Math.sin(2 * theta);
            // Lemniscate of Bernoulli (scaled): x = s cos θ, y = (s sin 2θ)/2,   s = 2A / (3 - cos 2θ)
            const D = 3 - cos2;
            const s = (2 * amplitude) / D;
            // Absolute position in its local plane (before mapping to XY/XZ/YZ)
            const X = s * cosT;
            const Y = (s * sin2) / 2;
            // Map to the requested plane + choose an up-vector perpendicular to that plane
            const pos = new vec3(0, 0, 0);
            let upVec = null;
            if (plane === "xy") {
                pos.x = X;
                pos.y = Y;
                upVec = vec3.up(); // +Y (Not the plane normal, for better visibility)
            }
            else if (plane === "xz") {
                pos.x = X;
                pos.z = Y;
                upVec = vec3.up(); // +Y up out of the plane
            }
            else {
                // "yz"
                pos.y = X;
                pos.z = Y;
                upVec = vec3.right(); // +X up out of the plane
            }
            // ---- Analytic tangent (derivative) for orientation ----
            // s = 2A / (3 - cos 2θ)  =>  s' = ds/dθ = -4A sin 2θ / (3 - cos 2θ)^2
            const sPrime = (-4 * amplitude * sin2) / (D * D);
            // x(θ) = s cos θ, y(θ) = (s sin 2θ)/2
            // x'(θ) = s' cos θ - s sin θ
            // y'(θ) = (s' sin 2θ)/2 + s cos 2θ
            const dX = sPrime * cosT - s * sinT;
            const dY = (sPrime * sin2) / 2 + s * cos2;
            // Map derivative to the plane (no need to scale by dθ/dt for direction)
            const tangent = new vec3(0, 0, 0);
            if (plane === "xy") {
                tangent.x = dX;
                tangent.y = dY;
                tangent.z = 0;
            }
            else if (plane === "xz") {
                tangent.x = dX;
                tangent.z = dY;
                tangent.y = 0;
            }
            else {
                // "yz"
                tangent.y = dX;
                tangent.z = dY;
                tangent.x = 0;
            }
            transform.setLocalPosition(pos);
            const forward = tangent.normalize();
            const rot = quat.lookAt(forward, upVec);
            transform.setLocalRotation(rot);
        };
        updatePosition(0);
        this.arrow.enabled = true;
        (0, animate_1.default)({
            update: updatePosition,
            duration: durationSeconds,
            cancelSet: this.cancelSet
        });
    }
}
exports.ArrowAnimator = ArrowAnimator;
//# sourceMappingURL=ArrowAnimator.js.map