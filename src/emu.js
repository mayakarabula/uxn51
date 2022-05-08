'use strict'

function Emu () {

	this.debug = 0
	this.uxn = new Uxn(this)

	this.buffer = ""

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

	this.console = {
		input: (char) => {
			console.log(char);
			// Trigger Vector
		},
		output: "hello"
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
			if(val == 0x0a){
				console.log(this.buffer)
				this.buffer = ""
			}
			else{
				this.buffer += String.fromCharCode(val)
			}
		}
	}
}
