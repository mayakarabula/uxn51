'use strict'

function Stack(u) {

	this.mem = new Uint8Array(0x100)
	this.p = 0
	this.u = u

	this.pop8 = () => {
		if(this.p == 0x00)
			return this.u.halt(1)
		if(this.u.rk)
			return this.mem[--this.pk]
		return this.mem[--this.p]
	}

	this.pop16 = () => {
		return this.pop8() + (this.pop8() << 8)
	}

	this.push8 = (val) => {
		if(this.p == 0xff)
			return this.u.halt(2)
		this.mem[this.p++] = val
	}

	this.push16 = (val) => {
		this.push8(val >> 0x08)
		this.push8(val & 0xff)
	}
}


function Uxn (emu) {

	this.emu = emu
	this.ram = new Uint8Array(0x10000)
	this.wst = new Stack(this)
	this.rst = new Stack(this)
	this.dev = 0x12000

	this.getdev = (port) => { return this.ram[this.dev + port] }
	this.setdev = (port, val) => { this.ram[this.dev + port] = val }

	this.pop = () => { 
		return this.r2 ? this.src.pop16() : this.src.pop8() 
	}

	this.push8 = (x) => { 
		this.src.push8(x) 
	}

	this.push16 = (x) => { 
		this.src.push16(x) 
	}

	this.push = (val) => { 
		if(this.r2) 
			this.push16(val) 
		else 
			this.push8(val) 
	}

	this.peek = (addr) => { 
		return this.r2 ? (this.ram[addr] << 8) + this.ram[addr + 1] : this.ram[addr] 
	}

	this.poke = (addr, val) => { 
		if(this.r2) { 
			this.ram[addr] = val >> 8; 
			this.ram[addr + 1] = val; 
		} else 
			this.ram[addr] = val 
	}

	this.devr = (port) => { 
		return this.r2 ? (this.emu.dei(port) << 8) + this.emu.dei(port+1) : this.emu.dei(port) 
	}

	this.devw = (port, val) => { 
		if(this.r2) { 
			this.emu.deo(port, val >> 8); 
			this.emu.deo(port+1, val & 0xff) 
		} else 
			this.emu.deo(port, val) 
	}

	this.jump = (addr, pc) => { 
		return this.r2 ? addr : pc + rel(addr); 
	}

	this.eval = (pc) => {
		let a, b, c, instr
		if(!pc || this.dev[0x0f])
			return 0;
		while((instr = this.ram[pc++])) {
			this.emu.onStep(pc, instr)
			// registers
			this.r2 = instr & 0x20
			this.rr = instr & 0x40
			this.rk = instr & 0x80
			if(this.rk) {
				this.wst.pk = this.wst.p
				this.rst.pk = this.rst.p
			}
			if(this.rr) {
				this.src = this.rst
				this.dst = this.wst
			} else {
				this.src = this.wst
				this.dst = this.rst
			}
			switch(instr & 0x1f) {
			// Stack
			case 0x00: /* LIT */ this.push(this.peek(pc)); pc += !!this.r2 + 1; break;
			case 0x01: /* INC */ this.push(this.pop() + 1); break;
			case 0x02: /* POP */ this.pop(); break;
			case 0x03: /* NIP */ a = this.pop(); this.pop(); this.push(a); break;
			case 0x04: /* SWP */ a = this.pop(); b = this.pop(); this.push(a); this.push(b); break;
			case 0x05: /* ROT */ a = this.pop(); b = this.pop(); c = this.pop(); this.push(b); this.push(a); this.push(c); break;
			case 0x06: /* DUP */ a = this.pop(); this.push(a); this.push(a); break;
			case 0x07: /* OVR */ a = this.pop(); b = this.pop(); this.push(b); this.push(a); this.push(b); break;
			// Logic
			case 0x08: /* EQU */ a = this.pop(); b = this.pop(); this.push8(b == a); break;
			case 0x09: /* NEQ */ a = this.pop(); b = this.pop(); this.push8(b != a); break;
			case 0x0a: /* GTH */ a = this.pop(); b = this.pop(); this.push8(b > a); break;
			case 0x0b: /* LTH */ a = this.pop(); b = this.pop(); this.push8(b < a); break;
			case 0x0c: /* JMP */ pc = this.jump(this.pop(), pc); break;
			case 0x0d: /* JCN */ a = this.pop(); if(this.src.pop8()) pc = this.jump(a, pc); break;
			case 0x0e: /* JSR */ this.dst.push16(pc); pc = this.jump(this.pop(), pc); break;
			case 0x0f: /* STH */ this.dst.push16(this.pop()); break;
			// Memory
			case 0x10: /* LDZ */ this.push(this.peek(this.src.pop8())); break;
			case 0x11: /* STZ */ this.poke(this.src.pop8(), this.pop()); break;
			case 0x12: /* LDR */ this.push(this.peek(pc + rel(this.src.pop8()))); break;
			case 0x13: /* STR */ this.poke(pc + rel(this.src.pop8()), this.pop()); break;
			case 0x14: /* LDA */ this.push(this.peek(this.src.pop16())); break;
			case 0x15: /* STA */ this.poke(this.src.pop16(), this.pop()); break;
			case 0x16: /* DEI */ this.push(this.devr(this.src.pop8())); break;
			case 0x17: /* DEO */ this.devw(this.src.pop8(), this.pop()); break;
			// Arithmetic
			case 0x18: /* ADD */ a = this.pop(); b = this.pop(); this.push(b + a); break;
			case 0x19: /* SUB */ a = this.pop(); b = this.pop(); this.push(b - a); break;
			case 0x1a: /* MUL */ a = this.pop(); b = this.pop(); this.push(b * a); break;
			case 0x1b: /* DIV */ a = this.pop(); b = this.pop(); if(!a) return this.halt(3); this.push(b / a); break;
			case 0x1c: /* AND */ a = this.pop(); b = this.pop(); this.push(b & a); break;
			case 0x1d: /* ORA */ a = this.pop(); b = this.pop(); this.push(b | a); break;
			case 0x1e: /* EOR */ a = this.pop(); b = this.pop(); this.push(b ^ a); break;
			case 0x1f: /* SFT */ a = this.src.pop8(); b = this.pop(); this.push(b >> (a & 0x0f) << ((a & 0xf0) >> 4)); break;
			}
		}
	}

	this.load = (program) => {
		for (let i = 0; i <= program.length; i++)
			this.ram[0x100 + i] = program[i];
		return this
	}

	this.errors = [
		"underflow",
		"overflow",
		"division by zero"
	]

	this.halt = (err) => {
		console.error("Error", this.rr ? "Return-stack" : "Working-stack", errors[err]);
		this.pc = 0x0000
	}

	function rel(val) {
		return (val > 0x80 ? val - 256 : val)
	}
}
