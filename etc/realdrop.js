
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