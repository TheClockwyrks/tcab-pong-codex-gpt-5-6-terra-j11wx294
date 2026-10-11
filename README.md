# Carom

Carom is a browser-first top-down paddle duel. Bend a rally with paddle motion, bank it through the central gates, and outscore your opponent in solo or local versus play.

## Run it

```bash
npm ci
npm run dev
```

Build the static production site with:

```bash
npm run build
```

The complete site is written to `dist/`.

## Controls

- **W / S** — left paddle
- **Arrow Up / Arrow Down** — right paddle in Versus; also control the left paddle in Solo
- **Enter / Space** — select a menu item
- **P / Escape** — pause or resume
- **M** — mute sound

The key to Carom is spin: move a paddle as the ball contacts it to curve the outgoing flight. First to 11, leading by two, wins.
