# Uxn5

An emulator for the [Uxn stack-machine](https://wiki.xxiivv.com/site/uxn.html), written in Javascript. 

## Usage

Include the uxn core in your `<head>` tag:

```html
<script src="src/uxn.js"></script>
```

Include the boot sequence in your website, and evaluate a program:

```html
<script type="text/javascript">
	const uxn = new Uxn()
	uxn.load(program).eval(0x0100)
</script>
```

## Devices

- `00` system(missing)
- `10` console(partial)
- `20` screen(missing)
- `30` audio(missing)
- `70` midi(missing)
- `80` controller(missing)
- `90` mouse(missing)
- `a0` file(missing)
- `c0` datetime(missing)

## Tests

Build and run tests with reference emulator:

```sh
uxnasm etc/tests.tal bin/tests.rom && uxncli bin/tests.rom
```

Format tests for Javascript:

```sh
uxnasm etc/format.tal bin/format.rom && uxncli bin/format.rom bin/tests.rom > etc/program.js
```

## Need a hand?

The following resources are a good place to start:

* [XXIIVV — uxntal](https://wiki.xxiivv.com/site/uxntal.html)
* [XXIIVV — uxntal cheatsheet](https://wiki.xxiivv.com/site/uxntal_cheatsheet.html)
* [XXIIVV — uxntal reference](https://wiki.xxiivv.com/site/uxntal_reference.html)
* [compudanzas — uxn tutorial](https://compudanzas.net/uxn_tutorial.html)

You can also find us in [`#uxn` on irc.esper.net](ircs://irc.esper.net:6697/#uxn).

## Contributing

Submit patches using [`git send-email`](https://git-send-email.io/) to the [~rabbits/public-inbox mailing list](https://lists.sr.ht/~rabbits/public-inbox).
