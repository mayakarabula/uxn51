let names = [
	"LIT", "INC", "POP", "DUP", "NIP", "SWP", "OVR", "ROT",
	"EQU", "NEQ", "GTH", "LTH", "JMP", "JCN", "JSR", "STH",
	"LDZ", "STZ", "LDR", "STR", "LDA", "STA", "DEI", "DEO",
	"ADD", "SUB", "MUL", "DIV", "AND", "ORA", "EOR", "SFT",
	"BRK"]

function opcode(byte){
	return names[byte & 0x1f] + (!!(byte & 0x20) ? "2" : "") + (!!(byte & 0x40) ? "r" : "") + (!!(byte & 0x80) ? "k" : "")
}