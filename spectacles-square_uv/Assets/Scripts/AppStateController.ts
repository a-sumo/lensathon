// AppStateController.ts
// Version: 1.0.0
// Global state controller for coordinating between WallRectangleGizmo and Drawing Script
// 
// States:
// - CreatingRectangle: User is creating/adjusting the drawing surface
// - Drawing: Rectangle is complete, user can draw on it

export enum AppState {
  CreatingRectangle = "CreatingRectangle",
  Drawing = "Drawing"
}

/**
 * Singleton state controller that manages app-wide state
 * Both WallRectangleGizmo and Drawing Script should check this state
 */
@component
export class AppStateController extends BaseScriptComponent {
  private static instance: AppStateController | null = null;
  
  @input
  @hint("Optional: Text component to show current state for debugging")
  debugText: Text;
  
  private _currentState: AppState = AppState.CreatingRectangle;
  
  // Callbacks for state changes
  private onStateChangeCallbacks: ((state: AppState) => void)[] = [];
  
  onAwake() {
    // Singleton pattern
    if (AppStateController.instance) {
      print("Warning: Multiple AppStateController instances! Using first one.");
      return;
    }
    AppStateController.instance = this;
    
    this.updateDebugText();
    print("AppStateController initialized. State: " + this._currentState);
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): AppStateController | null {
    return AppStateController.instance;
  }
  
  /**
   * Get current app state
   */
  get currentState(): AppState {
    return this._currentState;
  }
  
  /**
   * Check if currently in rectangle creation mode
   */
  isCreatingRectangle(): boolean {
    return this._currentState === AppState.CreatingRectangle;
  }
  
  /**
   * Check if currently in drawing mode
   */
  isDrawing(): boolean {
    return this._currentState === AppState.Drawing;
  }
  
  /**
   * Switch to drawing mode (called when rectangle is completed)
   */
  switchToDrawingMode() {
    if (this._currentState !== AppState.Drawing) {
      this._currentState = AppState.Drawing;
      print("AppState changed to: Drawing");
      this.updateDebugText();
      this.notifyStateChange();
    }
  }
  
  /**
   * Switch to rectangle creation mode (called to reset/create new rectangle)
   */
  switchToCreatingMode() {
    if (this._currentState !== AppState.CreatingRectangle) {
      this._currentState = AppState.CreatingRectangle;
      print("AppState changed to: CreatingRectangle");
      this.updateDebugText();
      this.notifyStateChange();
    }
  }
  
  /**
   * Toggle between states
   */
  toggleState() {
    if (this._currentState === AppState.CreatingRectangle) {
      this.switchToDrawingMode();
    } else {
      this.switchToCreatingMode();
    }
  }
  
  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: AppState) => void) {
    this.onStateChangeCallbacks.push(callback);
  }
  
  /**
   * Remove callback
   */
  removeStateChangeCallback(callback: (state: AppState) => void) {
    const index = this.onStateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.onStateChangeCallbacks.splice(index, 1);
    }
  }
  
  private notifyStateChange() {
    for (const callback of this.onStateChangeCallbacks) {
      callback(this._currentState);
    }
  }
  
  private updateDebugText() {
    if (this.debugText) {
      this.debugText.text = "State: " + this._currentState;
    }
  }
}

// Global access function for JS scripts
;(global as any).getAppState = function(): string {
  const controller = AppStateController.getInstance();
  return controller ? controller.currentState : AppState.CreatingRectangle;
};

;(global as any).isDrawingMode = function(): boolean {
  const controller = AppStateController.getInstance();
  // If no controller in scene, default to true (allow drawing)
  return controller ? controller.isDrawing() : true;
};

;(global as any).switchToDrawingMode = function(): void {
  const controller = AppStateController.getInstance();
  if (controller) controller.switchToDrawingMode();
};

;(global as any).switchToCreatingMode = function(): void {
  const controller = AppStateController.getInstance();
  if (controller) controller.switchToCreatingMode();
};

