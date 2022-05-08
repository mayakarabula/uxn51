#!/bin/sh -e

echo "Assembling talk.."
uxnasm etc/talk.tal bin/talk.rom
echo "Assembling formatter.."
uxnasm etc/format-js.tal bin/format-js.rom
echo "Writing program.js.."
uxncli bin/format-js.rom bin/talk.rom > etc/program.js
echo "Done."
