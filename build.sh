#!/bin/sh -e

rm -rf bin
mkdir bin

uxnasm etc/sprite.tal bin/sprite.rom

echo "Assembling unicycle.."
uxnasm etc/unicycle.tal bin/unicycle.rom
echo "Assembling formatter.."
uxnasm etc/format-js.tal bin/format-js.rom
echo "Writing program.js.."
uxncli bin/format-js.rom bin/sprite.rom > etc/program.js
echo "Done."
