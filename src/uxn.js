'use strict'

function Stack(u) {

	this.mem = new Uint8Array(0xfe)
	this.ptr = 0
	this.err = 0
	this.u = u

	this.pop8 = () => {
		if(this.ptr == 0x00) return this.u.halt(1)
		if(this.u.rk) return this.mem[this.ptr-1]
		return this.mem[--this.ptr]
	}

	this.pop16 = () => {
		if(this.ptr < 0x02) return this.u.halt(1)
		if(this.u.rk) return this.mem[this.ptr-1] + (this.mem[this.ptr-2] << 8)
		return this.mem[--this.ptr] + (this.mem[--this.ptr] << 8);
	}

	this.push8 = (val) => {
		if(this.ptr == 0xff) return this.u.halt(2)
		this.mem[this.ptr++] = val
	}

	this.push16 = (val) => {
		if(this.ptr > 0xfe) return this.u.halt(2)
		this.mem[this.ptr++] = val >> 0x08
		this.mem[this.ptr++] = val & 0xff
	}
}

function Uxn (emu) {

	this.emu = emu
	this.ram = new Uint8Array(0x10000)
	this.wst = new Stack(this)
	this.rst = new Stack(this)
	this.dev = new Uint8Array(0x100)

	this.src = () => { return this.rr ? this.rst : this.wst }
	this.dst = () => { return this.rr ? this.wst : this.rst }
	this.pop8 = () => { return this.src().pop8() }
	this.pop16 = () => { return this.src().pop16() }
	this.pop = () => { return this.r2 ? this.pop16() : this.pop8() }
	this.push8 = (x) => { this.src().push8(x) }
	this.push16 = (x) => { this.src().push16(x) }
	this.push = (val) => { if(this.r2) { this.push16(val) } else this.push8(val) }
	this.peek = (addr) => { return this.r2 ? (this.ram[addr] << 8) + this.ram[addr + 1] : this.ram[addr] }
	this.poke = (addr, val) => { if(this.r2) { this.ram[addr] = val >> 8; this.ram[addr + 1] = val; } else this.ram[addr] = val }
	this.devr = (port) => { return this.emu.dei(port) }
	this.devw = (port, val) => { this.emu.deo(port, val) }
	this.jump = (addr, pc) => { return this.r2 ? addr : pc + (addr > 0x80 ? addr - 256 : addr); }

	this.eval = (pc) => {
		let a, b, c, instr
		if(!pc || this.dev[0x0f])
			return 0;
		while((instr = this.ram[pc++])){
			this.emu.onStep(pc, instr)
			/* registers */
			this.r2 = instr & 0x20
			this.rr = instr & 0x40
			this.rk = instr & 0x80




			switch(instr & 0x1f) {
			/* Stack */
			case 0x00: /* LIT */ this.push(this.peek(pc)); pc += !!this.r2 + 1; break;
			case 0x01: /* INC */ this.push(this.pop() + 1); break;
			case 0x02: /* POP */ this.pop(); break;
			case 0x03: /* DUP */ a = this.pop(); this.push(a); this.push(a); break;
			case 0x04: /* NIP */ a = this.pop(); this.pop(); this.push(a); break;
			case 0x05: /* SWP */ a = this.pop(); b = this.pop(); this.push(a); this.push(b); break;
			case 0x06: /* OVR */ a = this.pop(); b = this.pop(); this.push(b); this.push(a); this.push(b); break;
			case 0x07: /* ROT */ a = this.pop(); b = this.pop(); c = this.pop(); this.push(b); this.push(a); this.push(c); break;
			/* Logic */
			case 0x08: /* EQU */ a = this.pop(); b = this.pop(); this.push8(b == a); break;
			case 0x09: /* NEQ */ a = this.pop(); b = this.pop(); this.push8(b != a); break;
			case 0x0a: /* GTH */ a = this.pop(); b = this.pop(); this.push8(b > a); break;
			case 0x0b: /* LTH */ a = this.pop(); b = this.pop(); this.push8(b < a); break;
			case 0x0c: /* JMP */ pc = this.jump(this.pop(), pc); break;
			case 0x0d: /* JCN */ a = this.pop(); if(this.pop()) pc = this.jump(a, pc); break;
			case 0x0e: /* JSR */ this.dst().push16(pc); pc = this.jump(this.pop(), pc); break;
			case 0x0f: /* STH */ this.dst().push16(this.pop()); break;
			/* Memory */
			case 0x10: /* LDZ */ this.push(this.peek(this.pop8())); break;
			case 0x11: /* STZ */ this.poke(this.pop8(), this.pop()); break;
			case 0x12: /* LDR */ this.push(this.peek(pc + this.pop8())); break;
			case 0x13: /* STR */ this.poke(pc + this.pop8(), this.pop()); break;
			case 0x14: /* LDA */ this.push(this.peek(this.pop16())); break;
			case 0x15: /* STA */ this.poke(this.pop16(), this.pop()); break;
			case 0x16: /* DEI */ this.push(this.devr(this.pop8())); break;
			case 0x17: /* DEO */ this.devw(this.pop8(), this.pop()); break;
			/* Arithmetic */
			case 0x18: /* ADD */ a = this.pop(); b = this.pop(); this.push(b + a); break;
			case 0x19: /* SUB */ a = this.pop(); b = this.pop(); this.push(b - a); break;
			case 0x1a: /* MUL */ a = this.pop(); b = this.pop(); this.push(b * a); break;
			case 0x1b: /* DIV */ a = this.pop(); b = this.pop(); this.push(b / a); break;
			case 0x1c: /* AND */ a = this.pop(); b = this.pop(); this.push(b & a); break;
			case 0x1d: /* ORA */ a = this.pop(); b = this.pop(); this.push(b | a); break;
			case 0x1e: /* EOR */ a = this.pop(); b = this.pop(); this.push(b ^ a); break;
			case 0x1f: /* SFT */ a = this.pop8(); b = this.pop(); this.push(b >> (a & 0x0f) << ((a & 0xf0) >> 4)); break;
			}
		}
	}

	this.halt = (err) => {
		console.warn("Halt", err)
		this.pc = 0x0000
	}
}
