import { createRequire } from 'module';
import { spawn } from 'child_process';
const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const LW = 180, LH = 320, SCALE = 2;
const W = LW * SCALE, H = LH * SCALE;
const FPS = 12;
const DURATION = 36;
const FRAMES = FPS * DURATION;

const GLYPH = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  G: ['01111','10000','10000','10111','10001','10001','01111'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['01110','00100','00100','00100','00100','00100','01110'],
  J: ['00111','00010','00010','00010','00010','10010','01100'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','10101','01010'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  Z: ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','11110','00001','00001','10001','01110'],
  '6': ['00110','01000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00010','01100'],
  '?': ['01110','10001','00001','00010','00100','00000','00100'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '.': ['00000','00000','00000','00000','00000','01100','01100'],
  '-': ['00000','00000','00000','01110','00000','00000','00000'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
};

const TOWERS = [
  [8, 18, 70], [30, 22, 96], [56, 16, 58], [76, 30, 124],
  [112, 18, 80], [134, 24, 108], [162, 14, 64],
];

const pix = new Uint8Array(LW * LH * 4);
const out = Buffer.alloc(W * H * 4);

const pset = (x, y, r, g, b, a = 255) => {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= LW || y >= LH) return;
  const i = (y * LW + x) * 4;
  pix[i] = r; pix[i + 1] = g; pix[i + 2] = b; pix[i + 3] = a;
};
const fill = (x, y, w, h, c) => {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) pset(x + xx, y + yy, c[0], c[1], c[2]);
};
const text = (s, x, y, c, scale = 1) => {
  let cx = x;
  for (const ch of s) {
    const g = GLYPH[ch] || GLYPH[' '];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
      if (g[row][col] === '1') fill(cx + col * scale, y + row * scale, scale, scale, c);
    }
    cx += 6 * scale;
  }
  return cx - x;
};
const center = (s, y, c, scale = 1) => text(s, Math.round((LW - s.length * 6 * scale) / 2), y, c, scale);

const YELLOW = [244, 214, 74];
const WHITE = [236, 244, 248];
const CYAN = [57, 231, 255];
const MAG = [255, 79, 216];
const GREEN = [90, 255, 140];
const INK = [8, 6, 14];

function sky(t) {
  for (let y = 0; y < LH; y++) {
    const k = y / LH;
    const r = 14 + k * 28, g = 6 + k * 8, b = 32 + k * 42;
    for (let x = 0; x < LW; x++) pset(x, y, r, g, b);
  }
  for (let i = 0; i < 40; i++) {
    const x = (i * 47 + 9) % LW;
    const y = (i * 29 + 4) % 150;
    const tw = ((Math.sin(t * 2 + i) + 1) / 2) > 0.35;
    if (tw) pset(x, y, 220, 230, 255);
  }
  const mx = 148, my = 36;
  for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
    const disk = x * x + y * y <= 70;
    const bite = (x - 5) * (x - 5) + y * y <= 42;
    if (disk && !bite) pset(mx + x, my + y, 236, 230, 198);
  }
  for (let i = 0; i < 18; i++) {
    const x = (i * 23 + Math.floor(t * 28 + i * 9)) % LW;
    const y = (i * 41 + Math.floor(t * 70)) % 210;
    pset(x, y, 70, 255, 120);
    pset(x, y + 1, 40, 180, 80);
  }
}

function ground() {
  fill(0, 236, LW, LH - 236, [10, 16, 28]);
  fill(0, 246, LW, 16, [6, 8, 12]);
  for (let x = 4; x < LW; x += 10) fill(x, 252, 5, 2, CYAN);
  for (let x = 8; x < LW; x += 14) fill(x, 258, 3, 1, MAG);
  fill(0, 262, LW, 2, [20, 40, 48]);
}

function tower(x, w, h, t, hero, glow) {
  const top = 246 - h;
  fill(x, top, w, h, [18, 14, 32]);
  fill(x, top, w, 3, hero ? MAG : CYAN);
  fill(x, 243, w, 3, [8, 8, 12]);
  for (let wy = top + 8; wy < 236; wy += 8) {
    for (let wx = x + 3; wx < x + w - 4; wx += 6) {
      const on = ((wx * 3 + wy + Math.floor(t * 3)) % 7) > 1;
      const lit = glow && Math.abs(wx - 90) < 5 && Math.abs(wy - 168) < 5;
      const col = lit ? MAG : on ? (hero ? CYAN : [255, 214, 120]) : [28, 22, 48];
      fill(wx, wy, 3, 4, col);
    }
  }
}

function city(t, glow) {
  ground();
  for (const [x, w, h] of TOWERS) tower(x, w, h, t, x === 76, glow);
}

function brackets(x, y, s, c) {
  const a = 6;
  fill(x, y, a, 2, c); fill(x, y, 2, a, c);
  fill(x + s - a, y, a, 2, c); fill(x + s - 2, y, 2, a, c);
  fill(x, y + s - 2, a, 2, c); fill(x, y + s - a, 2, a, c);
  fill(x + s - a, y + s - 2, a, 2, c); fill(x + s - 2, y + s - a, 2, a, c);
}

function dashes(y, t) {
  const shift = Math.floor(t * 10) % 8;
  for (let x = -shift; x < LW; x += 8) fill(x, y, 4, 1, [80, 120, 90]);
}

function card(n, label) {
  const wide = 14 + label.length * 6;
  fill(8, 286, wide, 22, INK);
  fill(8, 286, wide, 1, YELLOW);
  text(String(n), 12, 293, YELLOW, 1);
  text(label, 24, 293, WHITE, 1);
}

function caption(a, b) {
  fill(16, 28, 148, 34, [0, 0, 0]);
  center(a, 32, YELLOW, 1);
  if (b) center(b, 44, YELLOW, 1);
}

function badge(label, x, y) {
  fill(x, y, label.length * 6 + 8, 12, INK);
  text(label, x + 4, y + 3, GREEN, 1);
}

function car(t) {
  const x = 8 + ((t * 22) % 150);
  fill(x, 240, 16, 6, MAG);
  fill(x + 3, 237, 9, 4, CYAN);
  fill(x + 1, 245, 3, 3, [20, 20, 20]);
  fill(x + 11, 245, 3, 3, [20, 20, 20]);
  pset(x + 14, 241, 255, 230, 120);
}

function blimp(t) {
  const x = 36 + Math.sin(t * 0.6) * 10;
  const y = 78;
  fill(x, y + 6, 78, 16, [46, 18, 64]);
  fill(x + 6, y, 64, 8, [255, 79, 216]);
  fill(x + 6, y + 20, 64, 6, [57, 140, 255]);
  fill(x + 14, y + 8, 50, 10, [6, 8, 16]);
  text('ROBINHOOD', x + 16, y + 10, CYAN, 1);
  fill(x + 78, y + 10, 10, 4, [255, 79, 216]);
}

function hacker(ox, oy, t, dissolve) {
  const splitX = ox + 36;
  const box = (x, y, w, h, col) => fill(x, y, w, h, col);
  box(ox + 16, oy + 14, 24, 8, [24, 140, 78]);
  box(ox + 14, oy + 20, 28, 16, [32, 176, 96]);
  box(ox + 18, oy + 24, 16, 12, [236, 204, 168]);
  box(ox + 21, oy + 27, 3, 3, INK);
  box(ox + 28, oy + 27, 3, 3, INK);
  box(ox + 12, oy + 36, 30, 26, [22, 118, 68]);
  box(ox + 8, oy + 40, 6, 16, [22, 118, 68]);
  const bob = Math.floor(t * 5) % 2;
  box(ox + 34, oy + 52 + bob, 12, 4, [236, 204, 168]);
  box(ox + 46, oy + 18, 24, 18, [16, 36, 34]);
  box(ox + 48, oy + 20, 20, 14, [8, 20, 18]);
  const scan = Math.floor(t * 8) % 12;
  box(ox + 48, oy + 20 + scan, 20, 2, GREEN);
  box(ox + 50, oy + 23, 4, 2, CYAN);
  box(ox + 58, oy + 26, 5, 2, MAG);
  box(ox + 6, oy + 64, 62, 6, [48, 32, 56]);
  box(ox + 18, oy + 66, 16, 2, [20, 16, 24]);
  if (!dissolve) return;
  for (let y = oy + 12; y < oy + 64; y++) {
    for (let x = splitX; x < ox + 44; x++) {
      const i = (y * LW + x) * 4;
      pix[i] = pix[i] * 0.12 | 0;
      pix[i + 1] = pix[i + 1] * 0.12 | 0;
      pix[i + 2] = pix[i + 2] * 0.16 | 0;
    }
  }
  for (let i = 0; i < 16; i++) {
    const life = (t * 0.35 + i * 0.07) % 1;
    const x = ox + 10 + (i * 5) % 24;
    const y = oy + 58 - life * 36;
    pset(x, y | 0, 40, 210, 110);
    pset(x + 1, y | 0, 255, 90, 210);
  }
}

function cursor(x, y) {
  for (let i = 0; i < 8; i++) pset(x + i, y + i, 255, 255, 255);
  for (let i = 1; i < 6; i++) pset(x, y + i, 255, 255, 255);
  pset(x + 1, y + 5, 255, 255, 255);
  pset(x + 2, y + 4, 255, 255, 255);
}

function scaleFrame() {
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      const si = (y * LW + x) * 4;
      for (let dy = 0; dy < SCALE; dy++) {
        const row = ((y * SCALE + dy) * W) * 4;
        for (let dx = 0; dx < SCALE; dx++) {
          const di = row + (x * SCALE + dx) * 4;
          out[di] = pix[si];
          out[di + 1] = pix[si + 1];
          out[di + 2] = pix[si + 2];
          out[di + 3] = 255;
        }
      }
    }
  }
}

function frame(n) {
  const t = n / FPS;
  pix.fill(0);
  sky(t);
  if (t < 3.2) {
    city(t, false);
    caption('HOW DO YOU', 'OPEN A FLOOR?');
    center('ROBINHACKERS', 72, CYAN, 1);
  } else if (t < 9) {
    city(t, true);
    dashes(120, t); dashes(150, t); dashes(190, t);
    brackets(84, 160, 18, GREEN);
    fill(91, 156, 1, 26, [255, 60, 70]);
    caption('A SINGLE FLOOR', 'STARTS TO GLOW');
    card('1', 'SPOT');
  } else if (t < 15) {
    const u = (t - 9) / 6;
    city(t, true);
    brackets(84, 160, 18, u > 0.72 ? MAG : GREEN);
    if (u > 0.72) fill(86, 164, 14, 10, [255, 79, 216]);
    const cx = 150 - u * 58;
    const cy = 90 + u * 78;
    cursor(cx, cy);
    caption('EVERY FLOOR', 'IS A TERMINAL');
    card('2', 'CLICK');
  } else if (t < 22) {
    fill(0, 200, LW, 120, [8, 10, 18]);
    tower(18, 46, 150, t, true, true);
    fill(70, 78, 96, 150, [12, 8, 18]);
    fill(70, 78, 96, 2, CYAN);
    fill(64, 148, 8, 2, CYAN);
    hacker(82, 96, t, 0);
    caption('A BUBBLE OPENS', 'TO THE RIGHT');
    card('3', 'OPEN');
  } else if (t < 29) {
    fill(0, 200, LW, 120, [8, 10, 18]);
    tower(18, 46, 150, t, true, true);
    fill(70, 78, 96, 150, [12, 8, 18]);
    fill(70, 78, 96, 2, CYAN);
    hacker(82, 96, t * 0.45, Math.min(1, (t - 22) / 4));
    badge('SLOW-MO', 58, 8);
    caption('PIXELS DRIFT OFF', 'THE LINK HOLDS');
    card('4', 'LINK');
  } else if (t < 33.4) {
    city(t, false);
    car(t);
    blimp(t + 2);
    caption('CARS KEEP MOVING', 'THE MOON STAYS');
    card('5', 'CITY');
  } else {
    city(t, false);
    blimp(t);
    fill(22, 118, 136, 52, INK);
    center('ROBINHACKERS', 128, CYAN, 1);
    center('NEON CITY', 146, YELLOW, 1);
  }
  scaleFrame();
}

const outPath = new URL('../../robinhackers-reel.mp4', import.meta.url);
const ff = spawn(ffmpegPath, [
  '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS),
  '-i', 'pipe:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  outPath.pathname.replace(/^\//, ''),
], { stdio: ['pipe', 'ignore', 'pipe'] });

let err = '';
ff.stderr.on('data', d => { err += d.toString(); });
const done = new Promise((resolve, reject) => {
  ff.on('error', reject);
  ff.on('close', code => code === 0 ? resolve() : reject(new Error(err.slice(-800) || `ffmpeg ${code}`)));
});

const write = buf => new Promise((resolve, reject) => {
  ff.stdin.write(buf, e => e ? reject(e) : resolve());
});

for (let n = 0; n < FRAMES; n++) {
  frame(n);
  const ok = ff.stdin.write(out);
  if (!ok) await new Promise(r => ff.stdin.once('drain', r));
  if (n % FPS === 0) process.stdout.write(`\r${n / FPS}s`);
}
ff.stdin.end();
await done;
console.log('\nwrote', outPath.pathname);
