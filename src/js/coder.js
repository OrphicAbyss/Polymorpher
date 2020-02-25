"use strict";

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

angular.module("assemblerApp", [])
    .controller("Ctrl", function ($scope, $log, $sce) {
            $scope.update = function () {
                var parse = new Parse($scope.code);
                $scope.asm = parse.asm;
                $scope.tokens = parse.tokens;
                $scope.machine = assemble($scope.tokens.slice());

                if ($scope.machine && $scope.machine.binaryOutput) {
                    const binary = $scope.machine.binaryOutput.split("<br/>").join(" ").split(" ");
                    const buffer = binary.map((binary) => parseInt(binary, 2));
                    const blob = new Blob([new Uint8Array(buffer)], {type: "application/binary"});
                    const url = URL.createObjectURL(blob);
                    // const downloadSpan = document.getElementById("download-span");
                    // const button = document.createElement("a");
                    // button.setAttribute("href", url);
                    // button.text = "download";
                    // downloadSpan.appendChild(button);
                    const downloadButton = document.getElementById("download");
                    downloadButton.setAttribute("href", url);
                    downloadButton.setAttribute("download", "code.com");
                    // downloadButton.click();
                } else {
                    // const downloadButton = document.getElementById("download");
                    // downloadButton.setAttribute("href", "");
                    // downloadButton.setAttribute("download", "");
                }
            };

            $scope.codeView = function () {
                return $sce.trustAsHtml($scope.asm);
            };

            $scope.machineView = function () {
                return $sce.trustAsHtml($scope.machine.output);
            };

            $scope.binaryView = function () {
                return $sce.trustAsHtml($scope.machine.binaryOutput);
            };

            $scope.code = exampleDosProgram;
            $scope.update();

            $scope.$watch("code", function () {
                $scope.update();
            });
        }
    );

