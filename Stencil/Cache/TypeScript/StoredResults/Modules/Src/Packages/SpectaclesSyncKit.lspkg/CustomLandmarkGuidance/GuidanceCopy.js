"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultGuidanceCopy = void 0;
const ArrowAnimator_1 = require("./ArrowAnimator");
exports.DefaultGuidanceCopy = {
    guidance: {
        displayTimeSeconds: 6,
        fadeInTimeSeconds: 0.6,
        hints: [
            { text: "Walk around and look around\nto join the experience", arrows: ArrowAnimator_1.ArrowType.None },
            { text: "Move slowly and steadily", arrows: ArrowAnimator_1.ArrowType.FigureEightXZ },
            { text: "Look up, down, left, and right", arrows: ArrowAnimator_1.ArrowType.FigureEightXY }
        ]
    },
    troubleshooting: {
        title: "Couldn't find the location",
        bullets: [
            { title: "•   Look around the area", description: "Look up, down, left, and right." },
            { title: "•   Walk around slowly", description: "Try moving at a slower pace." },
            { title: "•   Move steadily", description: "Avoid sudden changes in direction." },
            { title: "•   Check lighting conditions", description: "Bright lighting improves feature detection." }
        ],
        button: "Keep Looking"
    },
    success: {
        text: "You're all set!"
    }
};
//# sourceMappingURL=GuidanceCopy.js.map