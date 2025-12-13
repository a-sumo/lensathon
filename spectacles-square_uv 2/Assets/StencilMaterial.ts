@component
export class StencilMaterial extends BaseScriptComponent {
    
    @input
    mesh: SceneObject;
    
    @input
    backgroundTex: Texture;
    
    @input
    stencilMask: Texture;
    
    @input
    tintColor: vec4 = new vec4(1, 0, 0, 1);

    private material: Material | null = null;
    private isSetup: boolean = false;
    onAwake(){
        this.setup()
    }
    setup(): void {
        const renderMeshVisual = this.mesh.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        
        if (!renderMeshVisual) {
            print("StencilMaterial: No RenderMeshVisual found on mesh");
            return;
        }
        
        this.material = renderMeshVisual.mainMaterial;
        
        if (!this.material) {
            print("StencilMaterial: No material found on RenderMeshVisual");
            return;
        }
        
        this.material.mainPass.backgroundTex = this.backgroundTex;
        this.material.mainPass.stencilMask = this.stencilMask;
        this.material.mainPass.tintColor = this.tintColor;
        
        this.isSetup = true;
    }

    setStencilColor(newColor: vec4): void {
        if (!this.isSetup || !this.material) {
            print("StencilMaterial: setup() must be called before setStencilColor()");
            return;
        }
        this.material.mainPass.tintColor = newColor;
    }
}