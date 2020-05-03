"use strict";

// Example data first

const exampleDosProgram = `; Example DOS program which compiles as a .com file
; Prints 'Hello, world!', waits for a key press, then exits 
    org    100h       

    mov ah,09
    mov dx,msg
    int 21h
    mov ah,08
    int 21h
    int 20h
    msg db "hello world!$"
`;

const exampleDosMZProgram = `format MZ

entry main:start            ; program entry point
stack 100h                ; stack size

segment main                ; main program segment
start:
mov    ax,text
mov    ds,ax
mov    dx,hello
call    extra:write_text
mov    ax,4C00h
int    21h
segment text
hello db 'Hello world!',24h
segment extra
write_text:
mov    ah,9
int    21h
retf`;

const exampleDosMZ2Program = `format MZ                       ;Исполняемый файл DOS EXE (MZ EXE)
entry code_seg:start            ;Точка входа в программу
stack 200h                      ;Размер стека
;--------------------------------------------------------------------
    segment data_seg                ;Cегмент данных
hello db 'Hello, asmworld!$'    ;Строка
;--------------------------------------------------------------------
    segment code_seg                ;Сегмент кода
start:                          ;Точка входа в программу
mov ax,data_seg             ;Инициализация регистра DS
mov ds,ax
mov ah,09h
mov dx,hello                ;Вывод строки
int 21h
mov ax,4C00h
int 21h                     ;Завершение программы
`;

import {Store, clear, del, get, keys, set} from "idb-keyval";

const module = "FileStore";
const log = (...params) => console.log(`${module}:`, ...params);

const fileStore = new Store("ide-files", "ide-files-store");

export function FS () {
    const getFilenames = () => {
        return keys(fileStore);
    }
    const getFile = (filename) => {
        return get(filename, fileStore);
    }
    const setFile = (filename, data) => {
        return set(filename, data, fileStore);
    }
    const delFile = (filename) => {
        return del(filename, fileStore);
    }
    const reset = () => {
        return clear(fileStore)
            .then(() => setFile("exampleDosProgram.com", exampleDosProgram))
            .then(() => setFile("exampleDosProgram.exe", exampleDosMZProgram));
    }

    const ready = getFilenames()
        .then((filenames) => {
            if (filenames.length === 0) {
                // database is empty, reset to insert example files.
                return reset();
            }
        });

    return {
        getFilenames,
        getFile,
        setFile,
        delFile,
        reset,
        ready
    };
}



