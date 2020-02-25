"use strict";

const Directives = [
    new Directive("ORG", "Orgin of code", 1),
    new DefineDataDirective("DB", "Define Byte", 8),
    new DefineDataDirective("DW", "Define Word", 16),
    new DefineDataDirective("DD", "Define Double Word", 32),
    new DefineDataDirective("DP", "Define Pointer", 48),
    new DefineDataDirective("DF", "Define Far Pointer", 48),
    new DefineDataDirective("DQ", "Define Quad Word", 64),
    new DefineDataDirective("DT", "Define FPU Double", 80),
    new ReserveDataDirective("DB", "Define Byte", 8),
    new ReserveDataDirective("DW", "Define Word", 16),
    new ReserveDataDirective("DD", "Define Double Word", 32),
    new ReserveDataDirective("DP", "Define Pointer", 48),
    new ReserveDataDirective("DF", "Define Far Pointer", 48),
    new ReserveDataDirective("DQ", "Define Quad Word", 64),
    new ReserveDataDirective("DT", "Define FPU Double", 80)
];
