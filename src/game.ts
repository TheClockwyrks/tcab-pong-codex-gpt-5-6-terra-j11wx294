import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLES,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
export interface MenuRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
export interface CaromSnapshot {
  readonly version: number;
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly muted: boolean;
  readonly paddles: CaromState["paddles"];
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: (BallState & { readonly speed: number }) | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
}
type Pose<T extends unknown[] = []> = (
  s: DeepReadonly<CaromState>,
  ...a: T
) => CaromState;
export interface CaromDebugApi {
  readonly version: number;
  clearWorld: Pose;
  spawnBall: Pose;
  spawnObstacle: Pose<[number]>;
  reset: Pose;
  reconcile: Pose;
  setScreen: Pose<[Screen]>;
  setMode: Pose<[Mode]>;
  setMenuIndex: Pose<[number]>;
  setTitleIndex: Pose<[number]>;
  setResumeScreen: Pose<["countdown" | "playing"]>;
  setScore: Pose<[number, number]>;
  setWinner: Pose<[Side | null]>;
  setReceiver: Pose<[Side]>;
  setPaddleCy: Pose<[Side, number]>;
  setPaddleVy: Pose<[Side, number]>;
  setPaddleDriven: Pose<[Side, boolean]>;
  setBallPosition: Pose<[number, number]>;
  setBallVelocity: Pose<[number, number]>;
  setBallSpin: Pose<[number]>;
  setBallHeld: Pose<[boolean]>;
  setBallHoldTimer: Pose<[number]>;
  setBallServeSign: Pose<[1 | -1]>;
  drawBallServeSign: Pose;
  setAiTracking: Pose<[boolean]>;
  setAiMovement: Pose<[boolean]>;
  setMuted: Pose<[boolean]>;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): MenuRect | null;
}
export const BACKGROUND = "#09131f";
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const serveSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const parked = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: serveSign(),
  trail: [],
});
const fresh = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: parked(),
  obstacles: OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y })),
  simTime: 0,
  muted,
});
const copy = (s: DeepReadonly<CaromState>): CaromState => ({
  ...s,
  score: { ...s.score },
  paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
  ai: { ...s.ai },
  ball: s.ball
    ? { ...s.ball, trail: s.ball.trail.map((t) => ({ ...t })) }
    : null,
  obstacles: s.obstacles.map((o) => ({ ...o })),
});
const ball = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw new Error("Carom: no ball is present");
  return s.ball;
};
const items = (x: Screen): readonly string[] =>
  x === "title"
    ? TITLE_ITEMS
    : x === "paused"
      ? PAUSE_ITEMS
      : x === "matchover"
        ? MATCHOVER_ITEMS
        : x === "howto"
          ? ["BACK"]
          : [];
const rect = (x: Screen, i: number): MenuRect | null =>
  i < 0 || i >= items(x).length
    ? null
    : { x: 420, y: x === "howto" ? 590 : 320 + i * 62, w: 440, h: 48 };
const title = (s: DeepReadonly<CaromState>): CaromState => ({
  ...fresh(s.muted),
  titleIndex: s.titleIndex,
  menuIndex: s.titleIndex,
  simTime: s.simTime,
});
const match = (s: DeepReadonly<CaromState>, mode = s.mode): CaromState => ({
  ...copy(s),
  mode,
  screen: "countdown",
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: parked(),
  paddles: {
    left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
  },
});
const paddle = (p: PaddleState, vy: number, dt: number): PaddleState => {
  const cy = cl(p.cy + vy * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: cy !== p.cy + vy * dt && dt > 0 ? (cy - p.cy) / dt : vy,
  };
};
function paddles(s: CaromState, a: UpdateApi, dt: number): CaromState {
  const move = (side: Side) => {
    const p = s.paddles[side];
    if (p.driven) return paddle(p, p.drivenVy, dt);
    if (side === "right" && s.mode === "solo") {
      if (!s.ai.movement) return paddle(p, 0, dt);
      let target = AI_HOME_Y,
        dz = AI_HOME_DEADZONE;
      if (s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0) {
        target = s.ball.y - s.ball.vy * AI_REACT;
        dz = AI_DEADZONE;
      }
      const d = target - p.cy;
      return paddle(
        p,
        Math.abs(d) <= dz
          ? 0
          : Math.sign(d) * Math.min(AI_SPEED, Math.abs(d) / Math.max(dt, 1e-9)),
        dt,
      );
    }
    const plus = s.mode === "solo" && side === "left";
    const up =
        a.input.value(side === "left" ? "p1-up" : "p2-up") +
        (plus ? a.input.value("p2-up") : 0),
      down =
        a.input.value(side === "left" ? "p1-down" : "p2-down") +
        (plus ? a.input.value("p2-down") : 0);
    return paddle(p, cl(down - up, -1, 1) * PADDLE_SPEED, dt);
  };
  return { ...s, paddles: { left: move("left"), right: move("right") } };
}
type Face = "left" | "right" | "top" | "bottom" | null;
function hit(
  b: BallState,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): Face {
  if (!(
    b.x > x0 - BALL_R &&
    b.x < x1 + BALL_R &&
    b.y > y0 - BALL_R &&
    b.y < y1 + BALL_R
  ))
    return null;
  return (
    [
      ["left", b.x - (x0 - BALL_R)],
      ["right", x1 + BALL_R - b.x],
      ["top", b.y - (y0 - BALL_R)],
      ["bottom", y1 + BALL_R - b.y],
    ] as [Face, number][]
  ).reduce((a, z) => (z[1] < a[1] ? z : a))[0];
}
function advance(s: CaromState, a: UpdateApi, dt: number): CaromState {
  if (!s.ball) return s;
  let b: BallState = { ...s.ball };
  const n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / MAX_SUBSTEP)),
    h = dt / n,
    cues = new Set<string>();
  for (let k = 0; k < n; k++) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed) {
      const q = (b.spin / speed) * h,
        co = Math.cos(q),
        si = Math.sin(q);
      b = { ...b, vx: b.vx * co - b.vy * si, vy: b.vx * si + b.vy * co };
    }
    b = {
      ...b,
      spin: b.spin * 0.5 ** (h / SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: BALL_R, vy: -b.vy };
      cues.add(CUES.wallBounce);
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b = { ...b, y: FIELD_H - BALL_R, vy: -b.vy };
      cues.add(CUES.wallBounce);
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side],
        f = hit(
          b,
          side === "left" ? P1_X0 : P2_X0,
          side === "left" ? P1_X1 : P2_X1,
          p.cy - PADDLE_HALF,
          p.cy + PADDLE_HALF,
        );
      if (!f) continue;
      if (f === "left" || f === "right") {
        const v = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP),
          theta = cl((b.y - p.cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE,
          d = side === "left" ? 1 : -1;
        b = {
          ...b,
          x: side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R,
          vx: d * v * Math.cos(theta),
          vy: v * Math.sin(theta),
          spin: cl(b.spin + p.vy * SPIN_FROM_PADDLE, -SPIN_CLAMP, SPIN_CLAMP),
        };
        cues.add(CUES.paddleHit);
      } else {
        const top = f === "top";
        b = {
          ...b,
          y: top ? p.cy - PADDLE_HALF - BALL_R : p.cy + PADDLE_HALF + BALL_R,
          vy: (top && b.vy > 0) || (!top && b.vy < 0) ? -b.vy : b.vy,
        };
        cues.add(CUES.wallBounce);
      }
    }
    for (const o of s.obstacles) {
      const r = OBSTACLES[o.index],
        f = hit(b, r.x0, r.x1, r.y0, r.y1);
      if (!f) continue;
      if (f === "left")
        b = { ...b, x: r.x0 - BALL_R, vx: b.vx > 0 ? -b.vx : b.vx };
      if (f === "right")
        b = { ...b, x: r.x1 + BALL_R, vx: b.vx < 0 ? -b.vx : b.vx };
      if (f === "top")
        b = { ...b, y: r.y0 - BALL_R, vy: b.vy > 0 ? -b.vy : b.vy };
      if (f === "bottom")
        b = { ...b, y: r.y1 + BALL_R, vy: b.vy < 0 ? -b.vy : b.vy };
      cues.add(CUES.obstacleBounce);
    }
  }
  cues.forEach((c) => a.audio.play(c));
  if (b.x - BALL_R > FIELD_W || b.x + BALL_R < 0) {
    a.audio.play(CUES.score);
    const who: Side = b.x - BALL_R > FIELD_W ? "left" : "right",
      score = {
        p1: s.score.p1 + (who === "left" ? 1 : 0),
        p2: s.score.p2 + (who === "right" ? 1 : 0),
      },
      won =
        (score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD) ||
        (score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD);
    if (won)
      return {
        ...s,
        score,
        winner: who,
        screen: "matchover",
        menuIndex: 0,
        ball: b,
      };
    return {
      ...s,
      score,
      receiver: who === "left" ? "right" : "left",
      screen: "countdown",
      ball: parked(),
    };
  }
  return { ...s, ball: b };
}
function trail(s: CaromState): CaromState {
  if (!s.ball) return s;
  return {
    ...s,
    ball: {
      ...s.ball,
      trail: [
        ...s.ball.trail,
        { x: s.ball.x, y: s.ball.y, t: s.simTime },
      ].filter((t) => t.t >= s.simTime - TRAIL_TIME),
    },
  };
}
function input(s: CaromState, a: UpdateApi): CaromState {
  let n = copy(s);
  const up = a.input.pressed("p1-up") || a.input.pressed("p2-up");
  const down = a.input.pressed("p1-down") || a.input.pressed("p2-down");
  const yes = a.input.pressed("confirm");
  const back = a.input.pressed("back");
  const pause = a.input.pressed("pause");
  if (n.screen === "countdown" || n.screen === "playing")
    return pause
      ? { ...n, resumeScreen: n.screen, screen: "paused", menuIndex: 0 }
      : n;
  if (n.screen === "paused" && (pause || back))
    return { ...n, screen: n.resumeScreen };
  if (n.screen === "howto" && (yes || back)) return title(n);
  if (n.screen === "matchover" && back) return title(n);
  const all = items(n.screen);
  if (!all.length) return n;
  let moved = false;
  if (up) {
    n = { ...n, menuIndex: (n.menuIndex - 1 + all.length) % all.length };
    moved = true;
  } else if (down) {
    n = { ...n, menuIndex: (n.menuIndex + 1) % all.length };
    moved = true;
  }
  let clicked = false;
  for (const p of a.input.pointerSamples()) {
    const i = all.findIndex((_, j) => {
      const r = rect(n.screen, j);
      return (
        !!r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
      );
    });
    if (i >= 0) {
      n = { ...n, menuIndex: i };
      if (p.type === "up") clicked = true;
    }
  }
  if (moved || !(yes || clicked)) return n;
  if (n.screen === "title") {
    n = { ...n, titleIndex: n.menuIndex };
    return n.menuIndex < 2
      ? match(n, n.menuIndex === 0 ? "solo" : "versus")
      : { ...n, screen: "howto", menuIndex: 0 };
  }
  if (n.screen === "paused")
    return n.menuIndex === 0
      ? { ...n, screen: n.resumeScreen }
      : n.menuIndex === 1
        ? match(n)
        : title(n);
  return n.menuIndex === 0 ? match(n) : title(n);
}
function debug(): CaromDebugApi {
  const edit = (
    s: DeepReadonly<CaromState>,
    v: Partial<BallState>,
  ): CaromState => ({ ...copy(s), ball: { ...ball(s), ...v } });
  const withP = (
    s: DeepReadonly<CaromState>,
    side: Side,
    v: Partial<PaddleState>,
  ): CaromState => ({
    ...copy(s),
    paddles: { ...s.paddles, [side]: { ...s.paddles[side], ...v } },
  });
  return {
    version: CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...copy(s), ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...copy(s), ball: parked() }),
    spawnObstacle: (s, index) => {
      if (!OBSTACLE_CENTERS[index]) throw new Error("Carom: no such obstacle");
      const p = OBSTACLE_CENTERS[index];
      return {
        ...copy(s),
        obstacles: [
          ...s.obstacles.filter((o) => o.index !== index),
          { index, cx: p.x, cy: p.y },
        ].sort((x, y) => x.index - y.index),
      };
    },
    reset: (s) => fresh(s.muted),
    reconcile: (s) => copy(s),
    setScreen: (s, v) => ({ ...copy(s), screen: v }),
    setMode: (s, v) => ({ ...copy(s), mode: v }),
    setMenuIndex: (s, v) => ({ ...copy(s), menuIndex: v }),
    setTitleIndex: (s, v) => ({ ...copy(s), titleIndex: v }),
    setResumeScreen: (s, v) => ({ ...copy(s), resumeScreen: v }),
    setScore: (s, p1, p2) => ({ ...copy(s), score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...copy(s), winner }),
    setReceiver: (s, receiver) => ({ ...copy(s), receiver }),
    setPaddleCy: (s, x, cy) => withP(s, x, { cy }),
    setPaddleVy: (s, x, drivenVy) => withP(s, x, { drivenVy }),
    setPaddleDriven: (s, x, driven) => withP(s, x, { driven }),
    setBallPosition: (s, x, y) => edit(s, { x, y }),
    setBallVelocity: (s, vx, vy) => edit(s, { vx, vy }),
    setBallSpin: (s, spin) => edit(s, { spin }),
    setBallHeld: (s, held) => edit(s, { held }),
    setBallHoldTimer: (s, holdTimer) => edit(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => edit(s, { serveSign }),
    drawBallServeSign: (s) => edit(s, { serveSign: serveSign() }),
    setAiTracking: (s, tracking) => ({ ...copy(s), ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...copy(s), ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => ({ ...copy(s), muted }),
    snapshot: (s) => ({
      version: CAROM_DEBUG_VERSION,
      screen: s.screen,
      mode: s.mode,
      menuIndex: s.menuIndex,
      titleIndex: s.titleIndex,
      resumeScreen: s.resumeScreen,
      score: { ...s.score },
      winner: s.winner,
      muted: s.muted,
      paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
      ai: { ...s.ai },
      receiver: s.receiver,
      ball: s.ball
        ? {
            ...s.ball,
            trail: s.ball.trail.map((t) => ({ ...t })),
            speed: Math.hypot(s.ball.vx, s.ball.vy),
          }
        : null,
      obstacles: s.obstacles.map((o) => ({ ...o })),
      simTime: s.simTime,
    }),
    menuItemRect: (s, i) => rect(s.screen, i),
  };
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    ACTIONS.forEach((x) => api.input.register(x, { keys: [...BINDINGS[x]] }));
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 460,
      freqTo: 700,
      gain: 0.12,
      durationMs: 55,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 240,
      freqTo: 180,
      gain: 0.1,
      durationMs: 50,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "triangle",
      freq: 310,
      freqTo: 520,
      gain: 0.12,
      durationMs: 65,
    });
    api.audio.define(CUES.score, {
      wave: "sawtooth",
      freq: 320,
      freqTo: 760,
      gain: 0.15,
      durationMs: 160,
    });
    const d = (
      name: string,
      read: (s: DeepReadonly<CaromState>) => string | number,
    ) => api.diagnostics.register(name, read);
    d("screen", (s) => s.screen);
    d("mode", (s) => s.mode);
    d("score", (s) => `${s.score.p1} - ${s.score.p2}`);
    d("ball pos", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    d("ball velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    d("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : "none",
    );
    d("spin", (s) => (s.ball ? s.ball.spin : "none"));
    d(
      "left paddle",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} / ${s.paddles.left.vy.toFixed(1)}`,
    );
    d(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} / ${s.paddles.right.vy.toFixed(1)}`,
    );
    return [fresh(), debug()];
  },
  update(state, a, dt) {
    let s = copy(state);
    if (a.input.pressed("mute")) a.audio.setMuted(!a.audio.muted());
    s = { ...s, simTime: s.simTime + dt, muted: a.audio.muted() };
    const began = s.screen;
    s = input(s, a);
    if (
      (began === "countdown" || began === "playing") &&
      (s.screen === "countdown" || s.screen === "playing")
    ) {
      s = paddles(s, a, dt);
      if (s.screen === "countdown" && s.ball) {
        const hold = s.ball.holdTimer - dt;
        s = { ...s, ball: { ...s.ball, holdTimer: Math.max(0, hold) } };
        s = trail(s);
        if (hold <= 0 && s.ball) {
          const dir = s.receiver === "left" ? -1 : 1;
          s = {
            ...s,
            screen: "playing",
            ball: {
              ...s.ball,
              held: false,
              holdTimer: 0,
              trail: [],
              vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
              vy: s.ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
            },
          };
        }
      } else if (s.screen === "playing") {
        s = trail(advance(s, a, dt));
      }
    }
    return { ...s, muted: a.audio.muted() };
  },
  render(state, api) {
    draw(state, api);
  },
};
function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}
function tx(
  c: CanvasRenderingContext2D,
  v: string,
  x: number,
  y: number,
  z: number,
  color: string,
  align: CanvasTextAlign = "center",
) {
  c.fillStyle = color;
  c.font = `700 ${z}px system-ui,sans-serif`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(v, x, y);
}
function draw(s: DeepReadonly<CaromState>, a: RenderApi) {
  const c = a.ctx;
  c.fillStyle = BACKGROUND;
  c.fillRect(0, 0, FIELD_W, FIELD_H);
  c.strokeStyle = "#284052";
  c.lineWidth = 2;
  c.setLineDash([12, 14]);
  c.beginPath();
  c.moveTo(NET_X, 0);
  c.lineTo(NET_X, FIELD_H);
  c.stroke();
  c.setLineDash([]);
  const dim = ["title", "howto", "paused", "matchover"].includes(s.screen);
  c.globalAlpha = dim ? 0.36 : 1;
  s.obstacles.forEach((o) => {
    c.fillStyle = "#f5a623";
    rr(c, o.cx - 10, o.cy - 70, 20, 140, 10);
    c.fill();
  });
  for (const [x, p, color] of [
    [48, s.paddles.left, "#58d9ff"],
    [1216, s.paddles.right, "#ff5c8a"],
  ] as const) {
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 14;
    rr(c, x, p.cy - PADDLE_HALF, 16, PADDLE_HALF * 2, 8);
    c.fill();
    c.shadowBlur = 0;
  }
  if (s.ball) {
    c.strokeStyle = "rgba(236,250,255,.45)";
    c.lineWidth = 5;
    c.beginPath();
    s.ball.trail.forEach((p, i) =>
      i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y),
    );
    c.stroke();
    c.fillStyle = "#f7fbff";
    c.shadowColor = "#8be8ff";
    c.shadowBlur = 18;
    c.beginPath();
    c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
  if (["playing", "countdown", "paused"].includes(s.screen)) {
    tx(c, String(s.score.p1), 560, 75, 42, "#58d9ff");
    tx(c, String(s.score.p2), 720, 75, 42, "#ff5c8a");
    tx(
      c,
      s.mode === "solo" ? "SOLO // CURVE THE RALLY" : "VERSUS // LOCAL DUEL",
      FIELD_CX,
      112,
      14,
      "#a9c4d4",
    );
    if (s.screen === "countdown")
      tx(
        c,
        s.ball ? String(Math.max(1, Math.ceil(s.ball.holdTimer))) : "READY",
        FIELD_CX,
        310,
        34,
        "#fff",
      );
  }
  if (s.screen === "title") {
    tx(c, TITLE_TEXT, FIELD_CX, 190, 74, "#effaff");
    tx(c, "A SPIN-DRIVEN PADDLE DUEL", FIELD_CX, 230, 16, "#f5a623");
    menu(c, s, TITLE_ITEMS);
  } else if (s.screen === "howto") {
    tx(c, "HOW TO PLAY", FIELD_CX, 150, 44, "#effaff");
    tx(c, "W / S  •  LEFT PADDLE", FIELD_CX, 250, 19, "#58d9ff");
    tx(c, "↑ / ↓  •  RIGHT PADDLE (VERSUS)", FIELD_CX, 286, 19, "#ff5c8a");
    tx(
      c,
      "MOVE THROUGH CONTACT TO BEND THE BALL.",
      FIELD_CX,
      365,
      17,
      "#f5a623",
    );
    tx(
      c,
      "BANK SHOTS OFF THE AMBER GATES.  P PAUSES.  M MUTES.",
      FIELD_CX,
      400,
      15,
      "#c5d9e5",
    );
    menu(c, s, ["BACK"]);
  } else if (s.screen === "paused") {
    tx(c, "PAUSED", FIELD_CX, 230, 45, "#effaff");
    menu(c, s, PAUSE_ITEMS);
  } else if (s.screen === "matchover") {
    tx(
      c,
      `${s.winner === "left" ? "LEFT" : "RIGHT"} PLAYER WINS`,
      FIELD_CX,
      210,
      39,
      s.winner === "left" ? "#58d9ff" : "#ff5c8a",
    );
    tx(c, `${s.score.p1} — ${s.score.p2}`, FIELD_CX, 260, 30, "#effaff");
    menu(c, s, MATCHOVER_ITEMS);
  }
  tx(c, s.muted ? "MUTED" : "M • SOUND", 1200, 690, 12, "#7895a9", "right");
}
function menu(
  c: CanvasRenderingContext2D,
  s: DeepReadonly<CaromState>,
  all: readonly string[],
) {
  all.forEach((v, i) => {
    const r = rect(s.screen, i);
    if (!r) return;
    const active = s.menuIndex === i;
    c.fillStyle = active ? "#f5a623" : "rgba(239,250,255,.12)";
    rr(c, r.x, r.y, r.w, r.h, 8);
    c.fill();
    tx(c, v, FIELD_CX, r.y + r.h / 2, 18, active ? "#09131f" : "#effaff");
  });
}
