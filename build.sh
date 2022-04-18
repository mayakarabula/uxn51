#!/bin/sh -e

echo "Assembling tests.."
uxnasm etc/tests.tal bin/tests.rom
echo "Assembling formatter.."
uxnasm etc/format-js.tal bin/format-js.rom
echo "Writing program.js.."
uxncli bin/format-js.rom bin/tests.rom > etc/program.js
echo "Done."
