Polymorpher / WebASM
====================

This project started life as a possible framework for writing multiple toy
languages and developed into an 8086 Assembler and 8086 Emulator all written
in Javascript.

Assembler Details
-------
The assembler is complete but bug fixing is ongoing as part of the work building
the emulator to find test cases. It accepts Intel Syntax assembly code. Binary 
generation is tested against _fasm_ as a reference assembler assumed to be bug
 free. As such it shares a syntax with _fasm_.

It supports the full set of 8086 instructions, the assembler structures are
used to generate the Op Code table. Not all instructions or instruction formats
(such as addressing) are tested. Bugs should be reported for fixing.

Emulator Details
-------
The emulator is a work in progress. Features are being built at the same time as
a BIOS is being written for it. Don't expect code to run correctly on it. It only
supports a subset of instructions so far.