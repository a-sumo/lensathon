// SprayCanController.ts
// Version: 2.1.0
// - Shows the spray can in the user's hand while the app is in Drawing mode
// - Toggles the spray particle material visibility ONLY while the user is actively drawing (pinching)
//   by setting mainPass.colorStart/colorEnd to black (transparent in Screen blend mode)

@component
export class SprayCanController extends BaseScriptComponent {

    @input
    @hint("The 3D spray can object to show in hand")
    sprayCan: SceneObject;

    @input
    @hint("Which hand to use: 'right' or 'left'")
    handType: string = "right";

    @input
    @hint("Offset from wrist position (local space)")
    positionOffset: vec3 = new vec3(0, 0.05, 0.03);

    @input
    @hint("Rotation offset in degrees")
    rotationOffset: vec3 = new vec3(0, 0, 0);

    @input
    @allowUndefined
    @hint("Optional: GPU particle material (e.g. SprayPaint.lspkg/GPU Particles.mat). Its mainPass.colorStart/colorEnd will be set to black when not spraying.")
    particleMaterial: Material;

    private handInputData: any;
    private hand: any;

    // Set by Drawing Script via global.setSprayActive(true/false)
    private isActivelyDrawing: boolean = false;

    // Cached "visible" colors from the particle material
    private particleColorStartActive: vec3 | null = null;
    private particleColorEndActive: vec3 | null = null;

    onAwake() {
        // Import HandInputData from SIK
        const HandInputData = require("SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData").HandInputData;
        this.handInputData = HandInputData.getInstance();

        // Get the specified hand
        this.hand = this.handInputData.getHand(this.handType);

        // Cache the particle material's current colors so we can restore them when spraying
        if (this.particleMaterial) {
            this.particleColorStartActive = this.particleMaterial.mainPass.colorStart;
            this.particleColorEndActive = this.particleMaterial.mainPass.colorEnd;
        }

        // Initially hide the spray can
        if (this.sprayCan) {
            this.sprayCan.enabled = false;
        }

        // Set initial particle state (off)
        this.setParticleState(false);

        // Global hook for Drawing Script to notify active drawing (pinch)
        const self = this;
        (global as any).setSprayActive = function(isActive: boolean) {
            self.isActivelyDrawing = isActive;
        };

        // Update loop
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));

        print("SprayCanController v2.1.0 initialized for " + this.handType + " hand");
    }

    onUpdate() {
        // Check if we're in drawing mode
        let isDrawingMode = false;
        const isDrawingModeFunc = (global as any).isDrawingMode;
        if (typeof isDrawingModeFunc === "function") {
            isDrawingMode = isDrawingModeFunc();
        } else {
            // Fallback: allow drawing if controller missing
            isDrawingMode = true;
        }

        // Show/hide spray can based on drawing mode and hand tracking
        if (this.sprayCan) {
            const handTracked = this.hand && this.hand.isTracked && this.hand.isTracked();
            this.sprayCan.enabled = isDrawingMode && handTracked;
        }

        // Update position if visible
        if (this.sprayCan && this.sprayCan.enabled) {
            this.updateSprayCanPosition();
        }

        // Particles: visible ONLY while actively drawing (pinching) and can is visible
        const showParticles = !!(this.sprayCan && this.sprayCan.enabled && this.isActivelyDrawing);
        this.setParticleState(showParticles);
    }

    private updateSprayCanPosition() {
        if (!this.hand || !this.hand.wrist || !this.sprayCan) {
            return;
        }

        try {
            // Get wrist position and rotation
            const wristPos = this.hand.wrist.position;
            const wristRot = this.hand.wrist.rotation;

            const sprayTransform = this.sprayCan.getTransform();

            // Apply position offset in local space of wrist
            const offsetWorld = wristRot.multiplyVec3(this.positionOffset);
            sprayTransform.setWorldPosition(wristPos.add(offsetWorld));

            // Apply rotation offset (in degrees)
            if (this.rotationOffset.length > 0.001) {
                const rotOffset = quat.fromEulerAngles(
                    this.rotationOffset.x,
                    this.rotationOffset.y,
                    this.rotationOffset.z
                );
                sprayTransform.setWorldRotation(wristRot.multiply(rotOffset));
            } else {
                sprayTransform.setWorldRotation(wristRot);
            }
        } catch (e) {
            print("SprayCanController: Error updating pose - " + e);
        }
    }

    private setParticleState(isActive: boolean) {
        if (!this.particleMaterial) {
            return;
        }

        try {
            // Screen blend: black = transparent/off
            const black = new vec3(0, 0, 0);

            if (isActive) {
                // Restore original colors
                if (this.particleColorStartActive) {
                    this.particleMaterial.mainPass.colorStart = this.particleColorStartActive;
                }
                if (this.particleColorEndActive) {
                    this.particleMaterial.mainPass.colorEnd = this.particleColorEndActive;
                }
            } else {
                // Force transparent/off
                this.particleMaterial.mainPass.colorStart = black;
                this.particleMaterial.mainPass.colorEnd = black;
            }
        } catch (e) {
            print("SprayCanController: Error updating particle state - " + e);
        }
    }
}
