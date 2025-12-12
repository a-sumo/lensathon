if (script.onAwake) {
    script.onAwake();
    return;
}
function checkUndefined(property, showIfData) {
    for (var i = 0; i < showIfData.length; i++) {
        if (showIfData[i][0] && script[showIfData[i][0]] != showIfData[i][1]) {
            return;
        }
    }
    if (script[property] == undefined) {
        throw new Error("Input " + property + " was not provided for the object " + script.getSceneObject().name);
    }
}
// @input SceneObject guidanceRoot
// @input Component.Text guidanceText
// @input SceneObject arrow
// @input SceneObject troubleshootingRoot
// @input Component.Text titleText
// @input Component.Text bullet1Title
// @input Component.Text bullet1Copy
// @input Component.Text bullet2Title
// @input Component.Text bullet2Copy
// @input Component.Text bullet3Title
// @input Component.Text bullet3Copy
// @input Component.Text bullet4Title
// @input Component.Text bullet4Copy
// @input AssignableType keepLookingButton
// @input SceneObject successRoot
// @input Component.Text successText
// @input int guidanceTimeoutMs = "30000"
// @input int successVisibleMs = "1000"
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../Modules/Src/Packages/SpectaclesSyncKit.lspkg/CustomLandmarkGuidance/CustomLandmarkGuidanceBinding");
Object.setPrototypeOf(script, Module.CustomLandmarkGuidanceBinding.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("guidanceRoot", []);
    checkUndefined("guidanceText", []);
    checkUndefined("arrow", []);
    checkUndefined("troubleshootingRoot", []);
    checkUndefined("titleText", []);
    checkUndefined("bullet1Title", []);
    checkUndefined("bullet1Copy", []);
    checkUndefined("bullet2Title", []);
    checkUndefined("bullet2Copy", []);
    checkUndefined("bullet3Title", []);
    checkUndefined("bullet3Copy", []);
    checkUndefined("bullet4Title", []);
    checkUndefined("bullet4Copy", []);
    checkUndefined("keepLookingButton", []);
    checkUndefined("successRoot", []);
    checkUndefined("successText", []);
    checkUndefined("guidanceTimeoutMs", []);
    checkUndefined("successVisibleMs", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
