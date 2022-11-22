"use strict";

function Console(emu) {
  this.buffer = "";
  this.display = null;

  this.i = (char) => {
    console.log("i", char);
  };

  this.send = (char) => {
    if (char == 0x0a) {
      this.display.innerHTML = this.buffer;
      this.buffer = "";
    } else {
      this.buffer += String.fromCharCode(char);
    }
  };

  this.input = (char) => {
    // Get vector
    let vec = emu.uxn.peek16(emu.uxn.dev + 0x10);
    // Set char
    emu.uxn.poke8(emu.uxn.dev + 0x12, char);
    if (!vec) console.warn("No console vector");
    emu.uxn.eval(vec);
  };
}

function Emu() {
  this.debug = 0;
  this.uxn = new Uxn(this);
  this.console = new Console(this);

  this.screen_device = uxn_port(this.uxn, 0x20, screen_dei, screen_deo);

  let opcodes = [
    "LIT",
    "INC",
    "POP",
    "NIP",
    "SWP",
    "ROT",
    "DUP",
    "OVR",
    "EQU",
    "NEQ",
    "GTH",
    "LTH",
    "JMP",
    "JCN",
    "JSR",
    "STH",
    "LDZ",
    "STZ",
    "LDR",
    "STR",
    "LDA",
    "STA",
    "DEI",
    "DEO",
    "ADD",
    "SUB",
    "MUL",
    "DIV",
    "AND",
    "ORA",
    "EOR",
    "SFT",
    "BRK",
  ];

  function getname(byte) {
    let m2 = !!(byte & 0x20) ? "2" : "";
    let mr = !!(byte & 0x40) ? "r" : "";
    let mk = !!(byte & 0x80) ? "k" : "";
    return opcodes[byte & 0x1f] + m2 + mk + mr;
  }

  this.debugger = () => {
    if (!this.uxn.wst.ptr()) console.log("Stack is clean");
    // Stack
    let buf = "";
    for (let i = 0; i < this.uxn.wst.ptr(); i++) {
      buf += this.uxn.wst.get(i).toString(16) + " ";
    }
    console.warn(buf);
  };

  this.onStep = (pc, instr) => {
    if (this.debug) console.log(getname(instr), pc);
    console.log("STEP");
  };

  this.dei = (port) => {
    return this.uxn.getdev(port);
  };

  this.redraw = () => {
    // if(gRect.w != uxn_screen.width || gRect.h != uxn_screen.height) set_size();

    screen_redraw(uxn_screen, uxn_screen.pixels);

    console.log(uxn_screen.pixels);

    drawOnCanvas(uxn_screen.pixels);
  };

  // var system_device = uxn_port(this.uxn, 0x0)

  this.deo = (port, val) => {
    this.uxn.setdev(port, val);

    console.log("deo", port.toString(16), val);

    if (port == 0x10 || port == 0x11) {
      console.log("Set console vector");
    } else if (port == 0x00 || port == 0x01) {
      console.log("Set system vector");
    } else if (port == 0x02) {
      this.uxn.wst.addr = val ? val * 0x100 : 0x10000;
    } else if (port == 0x18) {
      this.console.send(val);
    } else if (port == 0x0f) {
      console.warn("Program ended.");
    } else if (port > 0x7 && port < 0xe) {
      screen_palette(uxn_screen, this.uxn);
    } else if (port >= 0x20 && port <= 0x2f) {
      screen_deo(this.screen_device, port);
    } else {
      console.log("Unknown deo", port.toString(16), val);
    }

    console.log("redraw", uxn_screen.fg.changed || uxn_screen.bg.changed);

    if (uxn_screen.fg.changed || uxn_screen.bg.changed) this.redraw();
  };
}

var ctx;

function drawOnCanvas(pixels) {
  const canvas = document.getElementById("screen");
  if (!canvas) {
    return;
  }

  if (!ctx) {
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
  }

  ctx.clearRect(0, 0, uxn_screen.width, uxn_screen.height);

  var imageData = ctx.getImageData(0, 0, uxn_screen.width, uxn_screen.height);

  for (var x = 0; x < uxn_screen.width; x++) {
    for (var y = 0; y < uxn_screen.height; y++) {
      var index = (x + y * imageData.width) * 4;

      var color = pixels[x + y * uxn_screen.width].toString(16);

      imageData.data[index + 0] = Number("0x" + color[0] + color[1]);
      imageData.data[index + 1] = Number("0x" + color[2] + color[3]);
      imageData.data[index + 2] = Number("0x" + color[4] + color[5]);
      imageData.data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
