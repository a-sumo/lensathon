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
// @input Asset.ConnectedLensModule connectedLensModule
// @input Asset.LocationCloudStorageModule locationCloudStorageModule
// @input boolean isColocated = "true"
// @ui {"widget":"group_start", "label":"Colocation", "showIf":"isColocated"}
// @input Component.LocatedAtComponent locatedAtComponent
// @ui {"widget":"group_end"}
// @ui {"widget":"group_start", "label":"Start Mode Configuration"}
// @input string startMode = "START_MENU" {"widget":"combobox", "values":[{"label":"Start Menu", "value":"START_MENU"}, {"label":"Multiplayer", "value":"MULTIPLAYER"}, {"label":"Off", "value":"OFF"}]}
// @ui {"widget":"group_end"}
// @ui {"widget":"group_start", "label":"Location Based Experiences"}
// @input boolean skipCustomLandmarkInLensStudio = "true"
// @ui {"widget":"group_end"}
if (!global.BaseScriptComponent) {
    function BaseScriptComponent() {}
    global.BaseScriptComponent = BaseScriptComponent;
    global.BaseScriptComponent.prototype = Object.getPrototypeOf(script);
    global.BaseScriptComponent.prototype.__initialize = function () {};
    global.BaseScriptComponent.getTypeName = function () {
        throw new Error("Cannot get type name from the class, not decorated with @component");
    };
}
var Module = require("../../../../../Modules/Src/Packages/SpectaclesSyncKit.lspkg/Core/SessionControllerComponent");
Object.setPrototypeOf(script, Module.SessionControllerComponent.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("connectedLensModule", []);
    checkUndefined("locationCloudStorageModule", []);
    checkUndefined("isColocated", []);
    checkUndefined("locatedAtComponent", [["isColocated",true]]);
    checkUndefined("startMode", []);
    checkUndefined("skipCustomLandmarkInLensStudio", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
