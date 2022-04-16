#!/bin/sh -e

echo "Assembling tests.."
uxnasm etc/tests.tal bin/tests.rom
echo "Assembling formatter.."
uxnasm etc/format.tal bin/format.rom
echo "Writing program.js.."
uxncli bin/format.rom bin/tests.rom > etc/program.js
echo "Done."
