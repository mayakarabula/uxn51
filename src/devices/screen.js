// 'use strict'

function Layer(pixels, changed) {
  this.pixels = pixels;
  this.changed = changed;
}

var WIDTH = 64 * 8;
var HEIGHT = 40 * 8;

function UxnScreen(width = WIDTH, height = HEIGHT, mono = 0) {
  this.palette = new Uint32Array(4);
  this.width = width;
  this.height = height;
  this.fg = new Layer(new Uint32Array(width * height), 0);
  this.bg = new Layer(new Uint32Array(width * height), 0);
  this.pixels = new Uint32Array(width * height);
  this.mono = mono;
}

uxn_screen = new UxnScreen();

palette_mono = [0x0f000000, 0x0fffffff];

blending = [
  [0, 0, 0, 0, 1, 0, 1, 1, 2, 2, 0, 2, 3, 3, 3, 0],
  [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  [1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1, 1, 2, 3, 1],
  [2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 2, 3, 1, 2],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
];

/* screen_write(UxnScreen *p, Layer *layer, Uint16 x, Uint16 y, Uint8 color) */
function screen_write(p, layer, x, y, color) {
  if (x < p.width && y < p.height) {
    var i = x + y * p.width;

    console.log({ i, x, y, w: p.width, color });

    if (color != layer.pixels[i]) {
      console.log("setpix");
      layer.pixels[i] = color;
      layer.changed = 1;
    } else {
      console.log("nopix", color, layer.pixels[i]);
    }
  }
}

/* screen_blit(UxnScreen *p, Layer *layer, Uint16 x, Uint16 y, Uint8 *sprite, Uint8 color, Uint8 flipx, Uint8 flipy, Uint8 twobpp) */
function screen_blit(p, layer, x, y, sprite, color, flipx, flipy, twobpp) {
  var v,
    h,
    opaque = blending[4][color];

  for (v = 0; v < 8; v++) {
    var c = sprite[v] | ((twobpp ? sprite[v + 8] : 0) << 8);

    for (h = 7; h >= 0; --h, c >>= 1) {
      var ch = (c & 1) | ((c >> 7) & 2);

      if (opaque || ch)
        screen_write(
          p,
          layer,
          x + (flipx ? 7 - h : h),
          y + (flipy ? 7 - v : v),
          blending[ch][color]
        );
    }
  }
}

/* screen_palette(UxnScreen *p, Uint8 *addr) */
function screen_palette(p, uxn) {
  var i, shift;

  const n = 8;

  for (i = 0, shift = 4; i < 4; ++i, shift ^= 4) {
    var r = (uxn.getdev(n + 0 + Math.floor(i / 2)) >> shift) & 0x0f;
    var g = (uxn.getdev(n + 2 + Math.floor(i / 2)) >> shift) & 0x0f;
    var b = (uxn.getdev(n + 4 + Math.floor(i / 2)) >> shift) & 0x0f;

    p.palette[i] = 0x000000 | (r << 16) | (g << 8) | b;
    p.palette[i] |= p.palette[i] << 4;
  }

  p.fg.changed = p.bg.changed = 1;
}

/* screen_resize(UxnScreen *p, Uint16 width, Uint16 height) */
function screen_resize(p, width, height) {
  var bg = new Layer(new Uint32Array(width * height), 0);
  var fg = new Layer(new Uint32Array(width * height), 0);
  var pixels = new Uint32Array(width * height);

  if (bg) p.bg.pixels = bg;

  if (fg) p.fg.pixels = fg;

  if (pixels) p.pixels = pixels;

  if (bg && fg && pixels) {
    p.width = width;
    p.height = height;
    screen_clear(p, p.bg);
    screen_clear(p, p.fg);
  }
}

/* screen_clear(UxnScreen *p, Layer *layer) */
function screen_clear(p, layer) {
  var i,
    size = p.width * p.height;

  for (i = 0; i < size; i++) layer.pixels[i] = 0x00;

  layer.changed = 1;
}

/* screen_redraw(UxnScreen *p, Uint32 *pixels) */
function screen_redraw(p, pixels) {
  var i,
    size = p.width * p.height,
    palette = new Uint32Array(16);

  for (i = 0; i < 16; i++) palette[i] = p.palette[i >> 2 ? i >> 2 : i & 3];

  if (p.mono) {
    for (i = 0; i < size; i++)
      pixels[i] =
        palette_mono[(p.fg.pixels[i] ? p.fg.pixels[i] : p.bg.pixels[i]) & 0x1];
  } else {
    for (i = 0; i < size; i++)
      pixels[i] = palette[(p.fg.pixels[i] << 2) | p.bg.pixels[i]];
  }

  p.fg.changed = p.bg.changed = 0;
}

/* clamp(int val, int min, int max) */
function clamp(val, min, max) {
  return val >= min ? (val <= max ? val : max) : min;
}

/* screen_mono(UxnScreen *p, Uint32 *pixels) */
function screen_mono(p, pixels) {
  p.mono = !p.mono;
  screen_redraw(p, pixels);
}

/* IO */

/* screen_dei(Device *d, Uint8 port) */
function screen_dei(d, port) {
  switch (port) {
    case 0x2:
      return uxn_screen.width >> 8;
    case 0x3:
      return uxn_screen.width;
    case 0x4:
      return uxn_screen.height >> 8;
    case 0x5:
      return uxn_screen.height;
    default:
      return d.dat[port];
  }
}

const FIXED_SIZE = 0;

/* screen_deo(Device *d, Uint8 port) */
function screen_deo(d, port) {
  switch (port) {
    case 0x23:
      if (!FIXED_SIZE) {
        var w = d.dat(0x2);
        screen_resize(uxn_screen, clamp(w, 1, 1024), uxn_screen.height);
      }
      break;

    case 0x25:
      if (!FIXED_SIZE) {
        var h = d.dat(0x4);
        screen_resize(uxn_screen, uxn_screen.width, clamp(h, 1, 1024));
      }
      break;

    case 0x2e: {
      var x, y;
      var layer = d.dat(0xe) & 0x40;

      x = (d.dat(0x8) << 8) + d.dat(0x9);
      y = (d.dat(0xa) << 8) + d.dat(0xb);

      console.log(x, y);
      console.log(d.dat(0x8), d.dat(0x9));

      screen_write(
        uxn_screen,
        layer ? uxn_screen.fg : uxn_screen.bg,
        x,
        y,
        d.dat(0xe) & 0x3
      );

      if (d.dat(0x6) & 0x01) d.u.poke(0x28, x + 1); /* auto x+1 */
      if (d.dat(0x6) & 0x02) d.u.poke(0x2a, y + 1); /* auto y+1 */

      break;
    }
    case 0x2f: {
      var x, y, dx, dy, addr;
      var i,
        n,
        twobpp = !!(d.dat(0xf) & 0x80);

      var layer = d.dat(0xf) & 0x40 ? uxn_screen.fg : uxn_screen.bg;

      x = (d.dat(0x8) << 8) + d.dat(0x9);
      y = (d.dat(0xa) << 8) + d.dat(0xb);
      addr = (d.dat(0xc) << 8) + d.dat(0xd);

      n = d.dat(0x6) >> 4;
      dx = (d.dat(0x6) & 0x01) << 3;
      dy = (d.dat(0x6) & 0x02) << 2;

      console.log({ n, dx, dy });

      if (addr > 0x10000 - ((n + 1) << (3 + twobpp))) return;

      const sprite = [];
      for (i = 0; i < 8; i++) sprite[i] = d.u.ram[addr + i];

      for (i = 0; i <= n; i++) {
        console.log("blit");

        screen_blit(
          uxn_screen,
          layer,
          x + dy * i,
          y + dx * i,
          sprite,
          d.dat(0xf) & 0xf,
          d.dat(0xf) & 0x10,
          d.dat(0xf) & 0x20,
          twobpp
        );

        addr += (d.dat(0x6) & 0x04) << (1 + twobpp);
      }

      d.u.poke(0x2c, addr); /* auto addr+length */
      d.u.poke(0x28, x + dx); /* auto x+8 */
      d.u.poke(0x2a, y + dy); /* auto y+8 */

      break;
    }
  }
}
