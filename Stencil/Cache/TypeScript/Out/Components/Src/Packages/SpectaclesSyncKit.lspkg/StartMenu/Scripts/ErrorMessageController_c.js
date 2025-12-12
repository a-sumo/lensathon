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
// @input SceneObject noInternetErrorObject
// @input SceneObject connectionFailedErrorObject
// @input SceneObject errorDisplayContainer
// @input float defaultDistanceFromUser = "150.0"
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../../Modules/Src/Packages/SpectaclesSyncKit.lspkg/StartMenu/Scripts/ErrorMessageController");
Object.setPrototypeOf(script, Module.ErrorMessageControllerComponent.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("noInternetErrorObject", []);
    checkUndefined("connectionFailedErrorObject", []);
    checkUndefined("errorDisplayContainer", []);
    checkUndefined("defaultDistanceFromUser", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
