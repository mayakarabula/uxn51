# Uxn5

An emulator for the [Uxn stack-machine](https://wiki.xxiivv.com/site/uxn.html), written in Javascript. 

## Usage

The first parameter is the rom file, the subsequent arguments will be accessible to the rom, via the [Console vector](https://wiki.xxiivv.com/site/varvara.html#console).

```html
<script src="src/uxn.js"></script>
```

## Devices

- `00` system(missing)
- `10` console(missing)
- `20` screen(missing)
- `30` audio(missing)
- `70` midi(missing)
- `80` controller(missing)
- `90` mouse(missing)
- `a0` file(missing)
- `c0` datetime(missing)

## Need a hand?

The following resources are a good place to start:

* [XXIIVV — uxntal](https://wiki.xxiivv.com/site/uxntal.html)
* [XXIIVV — uxntal cheatsheet](https://wiki.xxiivv.com/site/uxntal_cheatsheet.html)
* [XXIIVV — uxntal reference](https://wiki.xxiivv.com/site/uxntal_reference.html)
* [compudanzas — uxn tutorial](https://compudanzas.net/uxn_tutorial.html)

You can also find us in [`#uxn` on irc.esper.net](ircs://irc.esper.net:6697/#uxn).

## Contributing

Submit patches using [`git send-email`](https://git-send-email.io/) to the [~rabbits/public-inbox mailing list](https://lists.sr.ht/~rabbits/public-inbox).
