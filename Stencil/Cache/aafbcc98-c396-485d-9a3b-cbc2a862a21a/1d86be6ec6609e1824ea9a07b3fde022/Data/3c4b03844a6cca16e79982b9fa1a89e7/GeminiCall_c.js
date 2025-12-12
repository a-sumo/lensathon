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
// @ui {"widget":"separator"}
// @ui {"widget":"group_start", "label":"Gemini API Config"}
// @input string apiKey {"hint":"Your Gemini API key"}
// @input string model = "gemini-2.5-flash-image" {"hint":"Gemini model for image generation"}
// @ui {"widget":"group_end"}
// @ui {"widget":"separator"}
// @ui {"widget":"group_start", "label":"Image Generation"}
// @input SceneObject imgObject
// @input AssignableType objectTypeInput {"hint":"Text input field for object category/type"}
// @input string basePrompt = "Generate a high quality image of a" {"hint":"Base prompt - object type will be appended", "widget":"text_area"}
// @input AssignableType_1 generateButton {"hint":"RectangleButton to trigger image generation"}
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
var Module = require("../../../../Modules/Src/Assets/Scripts/GeminiCall");
Object.setPrototypeOf(script, Module.ExampleGeminiImageGen.prototype);
script.__initialize();
let awakeEvent = script.createEvent("OnAwakeEvent");
awakeEvent.bind(() => {
    checkUndefined("apiKey", []);
    checkUndefined("model", []);
    checkUndefined("imgObject", []);
    checkUndefined("basePrompt", []);
    if (script.onAwake) {
       script.onAwake();
    }
});
