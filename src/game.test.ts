import { describe, expect, it } from "vitest";
import { game } from "./game";

const api = {
  input: {
    value: () => 0,
    pressed: () => false,
    pointer: () => ({
      x: 0,
      y: 0,
      down: false,
      device: "mouse" as const,
      buttons: [],
    }),
    pointerPressed: () => false,
    pointerReleased: () => false,
    pointerSamples: () => [],
    pointerContacts: () => [],
    wheel: () => ({ x: 0, y: 0 }),
  },
  audio: {
    play: () => undefined,
    loop: () => undefined,
    stop: () => undefined,
    looping: () => false,
    setMuted: () => undefined,
    muted: () => false,
  },
  frame: () => ({ count: 0, timeMs: 0, lastDeltaMs: 0 }),
  viewport: () => ({ x: 0, y: 0, width: 1280, height: 720, scale: 1, dpr: 1 }),
} as never;

const init = {
  input: { register: () => undefined, layout: () => null },
  audio: { define: () => undefined, load: async () => undefined },
  assets: {} as never,
  diagnostics: { register: () => undefined },
  events: {} as never,
  viewport: () => ({ x: 0, y: 0, width: 1280, height: 720, scale: 1, dpr: 1 }),
} as never;

describe("Carom simulation", () => {
  it("serves a countdown ball toward its receiver", async () => {
    const [state, debug] = await game.initialize(init);
    let s = debug.setScreen(state, "countdown");
    s = debug.setBallHoldTimer(s, 0);
    const next = game.update(s, api, 1 / 60);
    expect(next.screen).toBe("playing");
    expect(next.ball?.held).toBe(false);
    expect(next.ball?.vx).toBeLessThan(0);
  });

  it("scores when a ball crosses the goal", async () => {
    const [state, debug] = await game.initialize(init);
    let s = debug.setScreen(state, "playing");
    s = debug.setBallHeld(s, false);
    s = debug.setBallPosition(s, 1300, 360);
    const next = game.update(s, api, 1 / 120);
    expect(next.score.p1).toBe(1);
    expect(next.screen).toBe("countdown");
  });
});
