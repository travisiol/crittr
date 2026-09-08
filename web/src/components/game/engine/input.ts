/**
 * Keyboard state. Movement keys are polled every frame; action keys fire
 * once per press through `onAction`. Typing into a text field suspends
 * everything so chat does not walk you into the pond.
 */

export type Action = "interact" | "use" | "bag" | "map" | "bank" | "chat" | "close" | "slot1" | "slot2" | "slot3";

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

const ACTION_KEYS: Record<string, Action> = {
  KeyE: "interact",
  Space: "use",
  KeyI: "bag",
  KeyM: "map",
  KeyB: "bank",
  Enter: "chat",
  Escape: "close",
  Digit1: "slot1",
  Digit2: "slot2",
  Digit3: "slot3",
};

export class Input {
  private down = new Set<string>();
  suspended = false;

  constructor(private onAction: (a: Action) => void) {}

  attach() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  private isTyping(e: KeyboardEvent): boolean {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isTyping(e)) {
      if (e.code === "Escape") this.onAction("close");
      return;
    }
    if (e.code in MOVE_KEYS) {
      if (!this.suspended) this.down.add(e.code);
      e.preventDefault();
      return;
    }
    const action = ACTION_KEYS[e.code];
    if (action) {
      if (e.repeat) return;
      e.preventDefault();
      this.onAction(action);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };

  private onBlur = () => {
    this.down.clear();
  };

  /** Unit-ish movement vector for this frame. */
  vector(): [number, number] {
    if (this.suspended) return [0, 0];
    let x = 0;
    let y = 0;
    for (const code of this.down) {
      const v = MOVE_KEYS[code];
      if (v) {
        x += v[0];
        y += v[1];
      }
    }
    if (x && y) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return [Math.sign(x) * Math.min(1, Math.abs(x)), Math.sign(y) * Math.min(1, Math.abs(y))];
  }

  release() {
    this.down.clear();
  }
}
