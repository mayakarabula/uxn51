'use strict'

function Stack() {

	this.mem = new Uint8Array(0xfe)
	this.ptr = 0
	this.err = 0
	this.mode = 0

	this.push = (val) => {
		this.mem[this.ptr++] = val;
	}

	this.pop = () => {
		return this.mem[--this.ptr]
	}

	this.pop8 = () => {
		
	}
	this.push8 = (val) => {
		
	}
	this.pop16 = () => {
		
	}
	this.push16 = (val) => {
		
	}

}

function Uxn () {

	this.ram = new Uint8Array(0x10000)
	this.wst = new Stack()
	this.rst = new Stack()
	this.dev = new Uint8Array(0x100)
	this.src = this.wst
	this.dst = this.rst

	this.push = (val) => {
		this.src.push(val)
	}

	this.pop = () => {
		return this.src.pop()
	}

	this.load = (program) => {
		for (let i = 0; i <= program.length; i++)
			this.ram[0x100 + i] = program[i];
		console.log(this.ram)
	}

	this.step = () => {
		let a,b,c,kptr
		let instr = this.ram[pc++]
		/* return */
		if(instr & 0x40){
			this.src = this.rst;
			this.dst = this.wst;
		} else {
			this.src = this.wst;
			this.dst = this.rst;
		}
		/* keep */
		if(instr & 0x80) {
			kptr = this.src.ptr;
		}
		/* Short Mode */
		if(instr & 0x20){
			this.pop = this.pop16;
			this.push = this.push16;
		} else {
			this.pop = this.pop8;
			this.push = this.push8;
		}

		switch(instr & 0x1f) {
		/* Stack */
		case 0x00: /* LIT */ break;
		case 0x01: /* INC */ a = this.pop(); this.push(a + 1); break;
		case 0x02: /* POP */ a = this.pop(); break;
		case 0x03: /* DUP */ a = this.pop(); this.push(a); this.push(a); break;
		case 0x04: /* NIP */ a = this.pop(); b = this.pop(); this.push(a); break;
		case 0x05: /* SWP */ a = this.pop(); b = this.pop(); this.push(a); this.push(b); break;
		case 0x06: /* OVR */ a = this.pop(); b = this.pop(); this.push(b); this.push(a); this.push(b); break;
		case 0x07: /* ROT */ a = this.pop(); b = this.pop(); c = this.pop(); this.push(b); this.push(a); this.push(c); break;
		/* Logic */
		case 0x08: /* EQU */ a = this.pop(); b = this.pop(); this.push8(src, b == a); break;
		case 0x09: /* NEQ */ a = this.pop(); b = this.pop(); this.push8(src, b != a); break;
		case 0x0a: /* GTH */ a = this.pop(); b = this.pop(); this.push8(src, b > a); break;
		case 0x0b: /* LTH */ a = this.pop(); b = this.pop(); this.push8(src, b < a); break;
		case 0x0c: /* JMP */ a = this.pop(); this.jump(a); break;
		case 0x0d: /* JCN */ a = this.pop(); if(this.pop()) this.jump(a); break;
		case 0x0e: /* JSR */ a = this.pop(); this.dst.push16(pc); this.jump(a); break;
		case 0x0f: /* STH */ a = this.pop(); this.dst.push16(a); break;
		/* Memory */
		case 0x10: /* LDZ */ a = this.pop8(); b = this.peek(a); this.push(b); break;
		case 0x11: /* STZ */ a = this.pop8(); b = this.pop(); this.poke(a, b); break;
		case 0x12: /* LDR */ a = this.pop8(); this.peek(b, pc + a); this.push(b); break;
		case 0x13: /* STR */ a = this.pop8(); b = this.pop(); c = pc + a; this.poke(c, b); break;
		case 0x14: /* LDA */ a = this.pop16(); b = this.peek(a); this.push(b); break;
		case 0x15: /* STA */ a = this.pop16(); b = this.pop(); this.poke(a, b); break;
		case 0x16: /* DEI */ a = this.pop8(); b = this.devr(a); this.push(b); break;
		case 0x17: /* DEO */ a = this.pop8(); b = this.pop(); this.devw(a, b); break;
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

	this.eval = (pc) => {
		
	}

	this.halt = (instr, err, addr) => {

	}
}
