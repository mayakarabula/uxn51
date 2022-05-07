'use strict'

function Emu () {

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

	this.onStep = (pc, instr) => {
		// console.log(getname(instr), pc)
	}

	this.dei = (port) => {
		return this.uxn.dev[port]
	}

	this.deo = (port, val) => {
		this.uxn.dev[port] = val
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
