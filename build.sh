#!/bin/sh -e

echo "Assembling hello.."
uxnasm etc/hello.tal bin/hello.rom
echo "Assembling formatter.."
uxnasm etc/format-js.tal bin/format-js.rom
echo "Writing program.js.."
uxncli bin/format-js.rom bin/hello.rom > etc/program.js
echo "Done."
