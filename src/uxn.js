'use strict'

function Stack(u) {

	this.mem = new Uint8Array(0xfe)
	this.p = 0
	this.u = u

	this.set8 = (i, v) => { this.mem[i] = v }
	this.at8 = (i) => { return this.mem[i] }
	this.at16 = (i) => { return (this.mem[i] << 8) + this.mem[i + 1] }
	this.get8 = (i) => { return this.at8(this.p - 1 - i) }
	this.get16 = (i) => { return this.at16(this.p - 2 - i) }

	this.drop8new = (i) => {
		if(this.p == 0x00)
			return this.u.halt(1)
		let val = this.get8(i)
		for(let j = this.p - i - 1; j < i + 1; j++)
			this.set8(j, this.at8(j + 1))
		this.p--
		return val
	}

	this.drop16new = (i) => {
		if(this.p == 0x00)
			return this.u.halt(1)
		let val = this.get16(i*2)
		for(let j = this.p - i * 2 - 2; j < this.p; j++)
			this.set8(j, this.at8(j + 2))
		this.p -= 2
		return val
	}

	this.drop8 = () => {
		if(this.p == 0x00)
			return this.u.halt(1)
		return this.at8(this.u.rk ? --this.pk : --this.p)
	}

	this.drop16 = () => {
		if(this.p < 0x02)
			return this.u.halt(1)
		if(this.u.rk)
			return this.mem[--this.pk] + (this.mem[--this.pk] << 8)
		return this.mem[--this.p] + (this.mem[--this.p] << 8)
	}

	this.push8 = (val) => {
		if(this.p == 0xff)
			return this.u.halt(2)
		this.mem[this.p++] = val
	}

	this.push16 = (val) => {
		if(this.p > 0xfe)
			return this.u.halt(2)
		this.mem[this.p++] = val >> 0x08
		this.mem[this.p++] = val & 0xff
	}
}


function Uxn (emu) {

	this.emu = emu
	this.ram = new Uint8Array(0x10000)
	this.wst = new Stack(this)
	this.rst = new Stack(this)
	this.dev = new Uint8Array(0x100)

	/* Control */
	this.src = () => { return this.rr ? this.rst : this.wst }
	this.dst = () => { return this.rr ? this.wst : this.rst }
	this.peek = (addr) => { return this.r2 ? (this.ram[addr] << 8) + this.ram[addr + 1] : this.ram[addr] }
	this.poke = (addr, val) => { if(this.r2) { this.ram[addr] = val >> 8; this.ram[addr + 1] = val; } else this.ram[addr] = val }
	this.devr = (port) => { return this.r2 ? (this.emu.dei(port) << 8) + this.emu.dei(port+1) : this.emu.dei(port) }
	this.devw = (port, val) => { if(this.r2){ this.emu.deo(port, val >> 8); this.emu.deo(port+1, val & 0xff) } else this.emu.deo(port, val) }
	this.jump = (addr, pc) => { return this.r2 ? addr : pc + rel(addr); }
	/* Stack Primitives */
	this.push = (v) => { if(this.r2) this.src().push16(v); else this.src().push8(v) }
	this.drop = (i) => { return this.r2 ? this.src().drop16(i) : this.src().drop8(i) }
	
	this.pick = (i) => { this.push(this.r2 ? this.src().get16(i) : this.src().get8(i)) }
	this.roll = (i) => { this.push(this.dropnew(i)) }

	this.dropnew = (i) => { return this.r2 ? this.src().drop16new(i) : this.src().drop8new(i) }

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
			if(this.rk){
				this.wst.pk = this.wst.p
				this.rst.pk = this.rst.p
			}
			switch(instr & 0x1f) {
			/* Stack */
			case 0x00: /* LIT */ this.push(this.peek(pc)); pc += !!this.r2 + 1; break;
			case 0x01: /* INC */ this.push(this.drop() + 1); break;
			case 0x02: /* POP */ this.dropnew(0); break;
			case 0x03: /* DUP */ this.pick(0); break;
			case 0x04: /* NIP */ this.dropnew(1); break;
			case 0x05: /* SWP */ this.roll(1); break;
			case 0x06: /* OVR */ this.pick(1); break;
			case 0x07: /* ROT */ this.roll(2); break;
			/* Logic */
			case 0x08: /* EQU */ a = this.dropnew(0); b = this.dropnew(0); this.src().push8(b == a); break;
			case 0x09: /* NEQ */ a = this.dropnew(0); b = this.dropnew(0); this.src().push8(b != a); break;
			case 0x0a: /* GTH */ a = this.dropnew(0); b = this.dropnew(0); this.src().push8(b > a); break;
			case 0x0b: /* LTH */ a = this.dropnew(0); b = this.dropnew(0); this.src().push8(b < a); break;
			case 0x0c: /* JMP */ pc = this.jump(this.drop(), pc); break;
			case 0x0d: /* JCN */ a = this.drop(); if(this.src().drop8()) pc = this.jump(a, pc); break;
			case 0x0e: /* JSR */ this.dst().push16(pc); pc = this.jump(this.drop(), pc); break;
			case 0x0f: /* STH */ this.dst().push16(this.drop()); break;
			/* Memory */
			case 0x10: /* LDZ */ this.push(this.peek(this.src().drop8())); break;
			case 0x11: /* STZ */ this.poke(this.src().drop8(), this.drop()); break;
			case 0x12: /* LDR */ this.push(this.peek(pc + rel(this.src().drop8()))); break;
			case 0x13: /* STR */ this.poke(pc + rel(this.src().drop8()), this.drop()); break;
			case 0x14: /* LDA */ this.push(this.peek(this.src().drop16())); break;
			case 0x15: /* STA */ this.poke(this.src().drop16(), this.drop()); break;
			case 0x16: /* DEI */ this.push(this.devr(this.src().drop8())); break;
			case 0x17: /* DEO */ this.devw(this.src().drop8(), this.drop()); break;
			/* Arithmetic */
			case 0x18: /* ADD */ a = this.dropnew(0); b = this.dropnew(0); this.push(b + a); break;
			case 0x19: /* SUB */ a = this.dropnew(0); b = this.dropnew(0); this.push(b - a); break;
			case 0x1a: /* MUL */ a = this.dropnew(0); b = this.dropnew(0); this.push(b * a); break;
			case 0x1b: /* DIV */ a = this.dropnew(0); b = this.dropnew(0); this.push(b / a); break;
			case 0x1c: /* AND */ a = this.dropnew(0); b = this.dropnew(0); this.push(b & a); break;
			case 0x1d: /* ORA */ a = this.dropnew(0); b = this.dropnew(0); this.push(b | a); break;
			case 0x1e: /* EOR */ a = this.dropnew(0); b = this.dropnew(0); this.push(b ^ a); break;
			case 0x1f: /* SFT */ a = this.src().drop8(); b = this.dropnew(0); this.push(b >> (a & 0x0f) << ((a & 0xf0) >> 4)); break;
			}
		}
	}

	this.load = (program) => {
		for (let i = 0; i <= program.length; i++)
			this.ram[0x100 + i] = program[i];
		return this
	}

	this.halt = (err) => {
		console.warn("Halt", err)
		this.pc = 0x0000
	}

	function rel(val) {
		return (val > 0x80 ? val - 256 : val)
	}
}
