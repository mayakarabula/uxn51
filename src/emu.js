'use strict'

function Console(emu)
{
	this.buffer = ""
	this.display = null

	this.i = (char) => {
		console.log("i",char)
	}

	this.send = (char) => {
		if(char == 0x0a){
			this.display.innerHTML = this.buffer
			this.buffer = ""
		}
		else{
			this.buffer += String.fromCharCode(char)
		}
	}

	this.input = (char) => {
		// Get vector
		let vec = emu.uxn.peek16(emu.uxn.dev + 0x10)
		// Set char
		emu.uxn.poke8(emu.uxn.dev + 0x12, char)
		if(!vec)
			console.warn("No console vector")
		emu.uxn.eval(vec)
	}
}

function Emu ()
{
	this.debug = 0
	this.uxn = new Uxn(this)
	this.console = new Console(this)

	let opcodes = [
		"LIT", "INC", "POP", "NIP", "SWP", "ROT", "DUP", "OVR",
		"EQU", "NEQ", "GTH", "LTH", "JMP", "JCN", "JSR", "STH",
		"LDZ", "STZ", "LDR", "STR", "LDA", "STA", "DEI", "DEO",
		"ADD", "SUB", "MUL", "DIV", "AND", "ORA", "EOR", "SFT",
		"BRK"]

	function getname(byte) {
		let m2 = !!(byte & 0x20) ? "2" : ""
		let mr = !!(byte & 0x40) ? "r" : ""
		let mk = !!(byte & 0x80) ? "k" : ""
		return opcodes[byte & 0x1f] + m2 + mk + mr
	}

	this.onStep = (pc, instr) => {
		if(this.debug)
			console.log(getname(instr), pc)
	}

	this.dei = (port) => {
		return this.uxn.getdev(port)
	}

	this.deo = (port, val) => {
		this.uxn.setdev(port, val)
		if(port == 0x18) {
			this.console.send(val)
		}
	}
}
