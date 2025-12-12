"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplifiedLandmarkGuidanceController = exports.SimpleState = void 0;
const WorldCameraFinderProvider_1 = require("SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider");
const animate_1 = require("SpectaclesInteractionKit.lspkg/Utils/animate");
const FunctionTimingUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils");
const mathUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/mathUtils");
const SceneObjectUtils_1 = require("SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils");
const ArrowAnimator_1 = require("./ArrowAnimator");
const SessionController_1 = require("../Core/SessionController");
var SimpleState;
(function (SimpleState) {
    SimpleState["None"] = "None";
    SimpleState["Guidance"] = "Guidance";
    SimpleState["Troubleshooting"] = "Troubleshooting";
    SimpleState["Success"] = "Success";
})(SimpleState || (exports.SimpleState = SimpleState = {}));
class SimplifiedLandmarkGuidanceController {
    constructor(views, config) {
        this.views = views;
        this.config = config;
        this.state = SimpleState.None;
        this.hintIndex = 0;
        this.guidanceTimeout = null;
        this.hintRotationTimeout = null;
        this.successTimeout = null;
        this.initialHoldTimeout = null;
        this.isInitialHoldActive = false;
        this.isLocationFound = false;
        // UI animation helpers
        this.textAnimationCancelFunction = null;
        this.arrowCancelSet = new animate_1.CancelSet();
        // Arrow transforms/cache
        this.arrow1Transform = null;
        this.arrow1StartRot = null;
        this.arrowTargetRot = quat.quatIdentity();
        this.arrow1StartPos = null;
        this.arrow1Rmv = null;
        this.currentHintArrows = ArrowAnimator_1.ArrowType.None;
        // Troubleshooting placement helpers
        this.worldCamera = null;
        // Single arrow animator facade
        this.singleArrow = null;
        this.onSuccessComplete = null;
        this.guidanceTimeoutMs = config.guidanceTimeoutMs ?? 30000;
        this.successVisibleMs = config.successVisibleMs ?? 1000;
        this.initialGuidanceHoldMs = config.initialGuidanceHoldMs ?? 2000;
        this.views.keepLookingButton.onTriggerUp.add(() => this.onKeepLooking());
        this.hideAll();
    }
    start() {
        this.isLocationFound = false;
        SessionController_1.SessionController.getInstance().notifyOnLocatedAtFound(() => {
            this.isLocationFound = true;
            this.updateIsLocated();
        });
        // Always start with guidance and hold for at least initialGuidanceHoldMs
        this.isInitialHoldActive = true;
        this.transitionTo(SimpleState.Guidance);
        this.initialHoldTimeout = (0, FunctionTimingUtils_1.setTimeout)(() => {
            this.isInitialHoldActive = false;
            this.updateIsLocated();
        }, this.initialGuidanceHoldMs);
    }
    updateIsLocated() {
        // Gate success until initial hold completes
        if (!this.isInitialHoldActive && this.isLocationFound) {
            this.transitionTo(SimpleState.Success);
            return;
        }
    }
    stop() {
        this.transitionTo(SimpleState.None);
    }
    transitionTo(next) {
        if (this.state === next) {
            return;
        }
        this.cancelTimers();
        this.hideAll();
        this.state = next;
        switch (next) {
            case SimpleState.None:
                break;
            case SimpleState.Guidance:
                this.enterGuidance();
                break;
            case SimpleState.Troubleshooting:
                this.enterTroubleshooting();
                break;
            case SimpleState.Success:
                this.enterSuccess();
                break;
        }
    }
    enterGuidance() {
        // Initialize arrow refs lazily
        this.tryInitArrows();
        // Show first hint with animation
        this.hintIndex = 0;
        this.views.guidanceRoot.enabled = true;
        this.showHint(this.hintIndex);
        // If it takes too long to find the landmark, show troubleshooting
        this.guidanceTimeout = (0, FunctionTimingUtils_1.setTimeout)(() => {
            this.transitionTo(SimpleState.Troubleshooting);
        }, this.guidanceTimeoutMs);
    }
    enterTroubleshooting() {
        const copy = this.config.copy.troubleshooting;
        this.views.troubleshootingRoot.enabled = true;
        // Ensure it appears in front of the user
        this.resetTroubleshootingPosition();
        this.views.titleText.text = copy.title;
        this.views.bullet1Title.text = copy.bullets[0]?.title ?? "";
        this.views.bullet1Copy.text = copy.bullets[0]?.description ?? "";
        this.views.bullet2Title.text = copy.bullets[1]?.title ?? "";
        this.views.bullet2Copy.text = copy.bullets[1]?.description ?? "";
        this.views.bullet3Title.text = copy.bullets[2]?.title ?? "";
        this.views.bullet3Copy.text = copy.bullets[2]?.description ?? "";
        this.views.bullet4Title.text = copy.bullets[3]?.title ?? "";
        this.views.bullet4Copy.text = copy.bullets[3]?.description ?? "";
        this.views.keepLookingButton.enabled = true;
    }
    enterSuccess() {
        const copy = this.config.copy.success;
        this.views.successRoot.enabled = true;
        this.views.successText.text = copy.text;
        // Fade in
        this.textAnimationCancelFunction?.();
        this.textAnimationCancelFunction = (0, animate_1.default)({
            update: (t) => {
                const a = (0, mathUtils_1.lerp)(0, 1, t);
                this.setTextAlpha(this.views.successText, a);
            },
            start: 0,
            end: 1,
            duration: 1,
            ended: () => {
                // Hold visible, then fade out
                this.successTimeout = (0, FunctionTimingUtils_1.setTimeout)(() => {
                    this.textAnimationCancelFunction = (0, animate_1.default)({
                        update: (tt) => {
                            const a2 = (0, mathUtils_1.lerp)(1, 0, tt);
                            this.setTextAlpha(this.views.successText, a2);
                        },
                        start: 1,
                        end: 0,
                        duration: 1,
                        ended: () => {
                            this.views.successRoot.enabled = false;
                            this.transitionTo(SimpleState.None);
                            this.onSuccessComplete?.();
                        }
                    });
                }, this.successVisibleMs);
            }
        });
    }
    onKeepLooking() {
        if (this.state === SimpleState.Troubleshooting) {
            this.transitionTo(SimpleState.Guidance);
        }
    }
    showHint(index) {
        const hints = this.config.copy.guidance.hints;
        const hint = hints[index];
        const text = hint?.text ?? "";
        const arrows = hint?.arrows ?? ArrowAnimator_1.ArrowType.None;
        this.currentHintArrows = arrows;
        // Play arrows
        this.arrowCancelSet.cancel();
        this.playArrow(arrows, (this.config.copy.guidance.displayTimeSeconds + this.config.copy.guidance.fadeInTimeSeconds * 2) * 1000);
        // Fade in text + arrows
        this.textAnimationCancelFunction?.();
        this.textAnimationCancelFunction = this.animateToAlpha(0, 1, this.config.copy.guidance.fadeInTimeSeconds, () => {
            // Queue next hint
            this.queueNextHint(index, this.config.copy.guidance.displayTimeSeconds * 1000);
        }, text);
    }
    queueNextHint(id, displayTimeMs) {
        if (this.hintRotationTimeout) {
            (0, FunctionTimingUtils_1.clearTimeout)(this.hintRotationTimeout);
        }
        this.hintRotationTimeout = (0, FunctionTimingUtils_1.setTimeout)(() => {
            this.arrowCancelSet.cancel();
            this.textAnimationCancelFunction?.();
            this.textAnimationCancelFunction = this.animateToAlpha(1, 0, 0.6, () => {
                const hints = this.config.copy.guidance.hints;
                if (!hints || hints.length === 0) {
                    return;
                }
                this.hintIndex = (id + 1) % hints.length;
                this.showHint(this.hintIndex);
            });
        }, displayTimeMs);
    }
    hideAll() {
        this.views.guidanceRoot.enabled = false;
        this.views.troubleshootingRoot.enabled = false;
        this.views.successRoot.enabled = false;
        if (this.views.arrow)
            this.views.arrow.enabled = false;
    }
    cancelTimers() {
        if (this.guidanceTimeout) {
            (0, FunctionTimingUtils_1.clearTimeout)(this.guidanceTimeout);
            this.guidanceTimeout = null;
        }
        if (this.hintRotationTimeout) {
            (0, FunctionTimingUtils_1.clearTimeout)(this.hintRotationTimeout);
            this.hintRotationTimeout = null;
        }
        if (this.successTimeout) {
            (0, FunctionTimingUtils_1.clearTimeout)(this.successTimeout);
            this.successTimeout = null;
        }
        if (this.initialHoldTimeout) {
            (0, FunctionTimingUtils_1.clearTimeout)(this.initialHoldTimeout);
            this.initialHoldTimeout = null;
        }
    }
    tryInitArrows() {
        if (!this.views.arrow) {
            return;
        }
        if (!this.arrow1Transform) {
            this.arrow1Transform = this.views.arrow.getTransform();
            this.arrow1StartRot = this.arrow1Transform.getLocalRotation();
            this.arrow1StartPos = this.arrow1Transform.getLocalPosition();
            this.arrow1Rmv = (0, SceneObjectUtils_1.findComponentInChildren)(this.views.arrow, "Component.RenderMeshVisual");
        }
        if (!this.singleArrow) {
            this.singleArrow = new ArrowAnimator_1.ArrowAnimator(this.views.arrow);
        }
    }
    setTextAlpha(text, alpha) {
        const c = text.textFill.color;
        text.textFill.color = new vec4(c.x, c.y, c.z, alpha);
    }
    setRmvAlpha(rmv, alpha) {
        rmv.mainPass.alpha = alpha;
    }
    animateToAlpha(from, to, duration, onComplete = () => { }, nextText) {
        if (nextText !== undefined) {
            this.views.guidanceText.text = nextText;
        }
        return (0, animate_1.default)({
            update: (t) => {
                const a = (0, mathUtils_1.lerp)(from, to, t);
                this.setTextAlpha(this.views.guidanceText, a);
                if (this.currentHintArrows !== ArrowAnimator_1.ArrowType.None) {
                    if (this.arrow1Rmv)
                        this.setRmvAlpha(this.arrow1Rmv, a);
                }
            },
            start: 0,
            end: 1,
            duration: duration,
            ended: onComplete
        });
    }
    playArrow(arrows, displayTimeMs) {
        this.singleArrow.play(arrows, displayTimeMs);
    }
    resetTroubleshootingPosition() {
        if (!this.worldCamera) {
            this.worldCamera = WorldCameraFinderProvider_1.default.getInstance();
        }
        const root = this.views.troubleshootingRoot;
        const rootTransform = root.getTransform();
        const head = this.worldCamera.getTransform().getWorldPosition();
        const back = this.worldCamera.getTransform().back;
        const distance = 160.0;
        const pos = back.normalize().uniformScale(distance);
        rootTransform.setWorldPosition(head.add(pos));
        rootTransform.setWorldRotation(quat.lookAt(pos.uniformScale(-1), vec3.up()));
    }
}
exports.SimplifiedLandmarkGuidanceController = SimplifiedLandmarkGuidanceController;
//# sourceMappingURL=SimplifiedLandmarkGuidance.js.map