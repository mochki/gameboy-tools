import { pulseDuty, pulseDutyArray, waveShiftCodes, noise7Array, noiseDivisors, noise15Array, setPitchScaler, REVERB_WET } from './../core/apu';

import { GameBoyManager } from './manager';

import { GameBoy } from "../core/gameboy";
import { hexN } from '../core/util/misc';
import { resolveSchedulerId, SchedulerId } from '../core/scheduler';
import { disassemble } from '../core/disassembler';
import { ExpoRender } from './exporender';
import { Bus } from '../core/bus';

let done: boolean = false;

let cpuMeter = false;

let romsList: string[] = [];
let romsListLoadFailed = false;

let expoRender = new ExpoRender();
expoRender.load(false);
(window as any).expoRender = expoRender;

let bigScreen = true;

let mgr = new GameBoyManager();
(window as any).mgr = mgr;

export default async function main(): Promise<void> {

    LoadRomFromURL("../roms/dmg_boot.bin", true);
    LoadRomFromURL("../roms/Tetris (World) (Rev A).gb", false);

    let romsDescUrl = "../roms/roms.txt";
    let client = new XMLHttpRequest();
    client.open("GET", romsDescUrl);
    client.onreadystatechange = () => {
        if (client.status == 404) romsListLoadFailed = true;
        romsList = client.responseText.split('\n');
    };
    client.send();

    if (typeof (window) !== "undefined") {
        window.requestAnimationFrame(_init);
    } else {
        async function _main(): Promise<void> {
            await _init();
            for (let i = 0; i < 3; ++i) { _loop(1 / 60); }
            await _done();
        }
        _main().catch(console.error);
    }
}

let lastFpsDisplayMs = 0;

(window as any).sanic = function () {
    syncToAudio = false;
    mgr.gb.turboMode = true;
    runEmulator = true;
    (window as any).renderUi = false;
};

function enableTurbo() {
    mgr.gb.turboMode = true;
    // mgr.gb.ppu.frameSkipRate = 10;
    syncToAudio = false;
}
function disableTurbo() {
    mgr.gb.turboMode = false;
    // mgr.gb.ppu.frameSkipRate = 0;
    syncToAudio = true;
}

function resetGui() {
    setCheckbox("portamento-checkbox", false);
    setCheckbox("resample-checkbox", true);
    setCheckbox("reverb-checkbox", true);
    setSlider("wet-slider", mgr.gb.apu.reverbL.wet * 100);
    setSlider("decay-slider", mgr.gb.apu.reverbL.getDecay() * 100);
}

function reset() {
    mgr.reset();
    resetGui();
}

function loadRom(rom: Uint8Array) {
    mgr.loadRom(rom);
    resetGui();
}


async function _init(): Promise<void> {
    resetGui();

    function dropHandler(ev: Event | any) {
        if (ev.dataTransfer.files[0] instanceof Blob) {
            console.log('File(s) dropped');

            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();

            let reader = new FileReader();
            reader.onload = function () {
                let arrayBuffer = this.result;
                if (arrayBuffer instanceof ArrayBuffer) {
                    let array = new Uint8Array(arrayBuffer);

                    loadRom(array);
                }
            };
            reader.readAsArrayBuffer(ev.dataTransfer.files[0]);
        }
    }

    function dragoverHandler(ev: Event | any) {
        ev.preventDefault();
    }
    window.addEventListener("drop", dropHandler);
    window.addEventListener("dragover", dragoverHandler);

    setInterval(() => {
        updateSaves();
    }, 1000);

    setInterval(() => {
        let currentMs = performance.now();
        let diff = currentMs - lastFpsDisplayMs;
        lastFpsDisplayMs = currentMs;

        let pct = cycles / (70224 * (diff / 1000));
        cycles = 0;
        document.title = `Optime GB (${((pct * 1) | 0) >> mgr.gb.doubleSpeed} fps)`;
    }, 1000);

    let altControls = false;
    let block = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "\\", "z", "x", "Tab"];

    document.onkeydown = function (e) {
        if (block.includes(e.key)) {
            e.preventDefault();
        }

        if (altControls) {
            switch (e.key.toLowerCase()) {
                case "a": mgr.gb.joypad.left = true; break;
                case "w": mgr.gb.joypad.up = true; break;
                case "d": mgr.gb.joypad.right = true; break;
                case "s": mgr.gb.joypad.down = true; break;

                case "l": mgr.gb.joypad.a = true; break;
                case "k": mgr.gb.joypad.b = true; break;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case "arrowleft": mgr.gb.joypad.left = true; break;
                case "arrowup": mgr.gb.joypad.up = true; break;
                case "arrowright": mgr.gb.joypad.right = true; break;
                case "arrowdown": mgr.gb.joypad.down = true; break;

                case "x": mgr.gb.joypad.a = true; break;
                case "z": mgr.gb.joypad.b = true; break;
            }
        }

        switch (e.key) {
            case "Enter": mgr.gb.joypad.start = true; break;
            case "\\": mgr.gb.joypad.select = true; break;
            case "Shift": mgr.gb.joypad.select = true; break;

            case "s": mgr.gb.cpu.execute(); break;

            // Emulator Control
            case "Tab": {
                enableTurbo();
            } break;
        }
    };
    document.onkeyup = function (e) {
        if (block.includes(e.key))
            e.preventDefault();

        if (altControls) {
            switch (e.key.toLowerCase()) {
                case "a": mgr.gb.joypad.left = false; break;
                case "w": mgr.gb.joypad.up = false; break;
                case "d": mgr.gb.joypad.right = false; break;
                case "s": mgr.gb.joypad.down = false; break;

                case "l": mgr.gb.joypad.a = false; break;
                case "k": mgr.gb.joypad.b = false; break;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case "arrowleft": mgr.gb.joypad.left = false; break;
                case "arrowup": mgr.gb.joypad.up = false; break;
                case "arrowright": mgr.gb.joypad.right = false; break;
                case "arrowdown": mgr.gb.joypad.down = false; break;

                case "x": mgr.gb.joypad.a = false; break;
                case "z": mgr.gb.joypad.b = false; break;
            }
        }

        switch (e.key) {
            case "Enter": mgr.gb.joypad.start = false; break;
            case "\\": mgr.gb.joypad.select = false; break;
            case "Shift": mgr.gb.joypad.select = false; break;

            // Emulator Control
            case "Tab": {
                disableTurbo();
            } break;
        }
    };


    try {
        if (typeof (window) !== "undefined") {
            window.requestAnimationFrame(_loop);
        }
    } catch (error) {
        alert("Exception occured in main loop, check console for info.");
        console.error(error);
    }

    let toggleImGuiBtn = document.getElementById("toggle-imgui-btn")!;
    let outputCanvas = document.getElementById("output-canvas")!;

    document.getElementById("reset-btn")!.onclick = () => {
        reset();
    };

    document.getElementById("start-btn")!.onclick = () => {
        runEmulator = true;
    };

    document.getElementById("stop-btn")!.onclick = () => {
        runEmulator = false;
    };

    loadFileOnClick(document.getElementById("open-rom-btn")!, ".gb,.gbc", (result: ArrayBuffer) => {
        loadRom(new Uint8Array(result));
    });

    loadFileOnClick(document.getElementById("load-save-btn")!, ".sav", (result: ArrayBuffer) => {
        mgr.loadSave(new Uint8Array(result));
        mgr.reset();
    });

    document.getElementById("download-save-btn")!.onclick = e => {
        let localforage = (window as any).localforage;
        let title = Bus.getTitle(mgr.gb.bus.rom);
        localforage.getItem(`${title}.sav`).then((arr: Uint8Array) => {
            download(`${title}.sav`, arr);
        });
    };

    onSliderInput("volume-slider", val => {
        let ratio = val / 100;
        changeVolume(ratio);
    });

    onSliderInput("wet-slider", val => {
        let ratio = val / 100;
        mgr.gb.apu.reverbL.wet = ratio;
        mgr.gb.apu.reverbR.wet = ratio;
    });

    onSliderInput("decay-slider", val => {
        let ratio = val / 100;
        mgr.gb.apu.reverbL.setDecay(ratio);
        mgr.gb.apu.reverbR.setDecay(ratio);
    });

    onCheckboxInput("portamento-checkbox", checked => {
        mgr.gb.apu.portamento = checked;
    });

    onCheckboxInput("resample-checkbox", checked => {
        mgr.gb.apu.setResamplerEnabled(checked);
    });

    onCheckboxInput("reverb-checkbox", checked => {
        mgr.gb.apu.enableReverb = checked;
    });

    document.getElementById("transpose-plus")!.onclick = () => {
        mgr.gb.apu.transposeSemitones++;
    };
    document.getElementById("transpose-minus")!.onclick = () => {
        mgr.gb.apu.transposeSemitones--;
    };

    loadSettings();

    setupOutputWebGl();
}

function setCheckbox(id: string, checked: boolean) {
    (document.getElementById(id) as HTMLInputElement).checked = checked;
}

function setSlider(id: string, val: number) {
    (document.getElementById(id) as HTMLInputElement).value = val.toString();
}

function onCheckboxInput(id: string, callback: (checked: boolean) => void) {
    document.getElementById(id)!.oninput = e => callback((e.target as HTMLInputElement).checked);
}

function onSliderInput(id: string, callback: (val: number) => void) {
    document.getElementById(id)!.oninput = e => callback((e.target as HTMLInputElement).value as unknown as number);
}


async function loadSettings() {
    let localforage = (window as any).localforage;
    if (localforage) {
        let volume = await localforage.getItem("frontend-volume");
        // Don't test for truthy, that will ignore the value of "0", test for undefined/null instead.
        if (volume != null) {
            mgr.setVolume(volume);
            ((document.getElementById("volume-slider") as HTMLInputElement).value as unknown as number) = volume * 100;
        }
    }
}

function changeVolume(ratio: number) {
    let localforage = (window as any).localforage;
    mgr.setVolume(ratio);
    if (localforage) {
        localforage.setItem("frontend-volume", ratio);
    }
}

let outputCtx: WebGLRenderingContext | null;
let shaderProgram: WebGLProgram | null;
function setupOutputWebGl() {
    let outputCanvas = document.getElementById("output-canvas") as HTMLCanvasElement;
    outputCtx = outputCanvas.getContext('webgl');

    let gl = outputCtx;
    if (gl) {
        try {
            outputTex = gl.createTexture();

            const vertices = [
                +1, +1,
                +1, -1,
                -1, -1,
                -1, +1,
            ];

            const texCoords = [
                1, 0,
                1, 1,
                0, 1,
                0, 0
            ];

            /*====================== Shaders =======================*/

            let vertCode =
                `
                    attribute vec2 aVertex;
                    attribute vec2 aTex;
                    varying vec2 vTex;
                    void main(void) {
                        gl_Position = vec4(aVertex, 0.0, 1.0);
                        vTex = aTex;
                    }
                `;

            let fragCode =
                `
                    precision highp float;
                    varying vec2 vTex;
                    uniform sampler2D sampler0;
                    void main(void){
                        gl_FragColor = texture2D(sampler0, vTex);
                    }
                `;


            let vertShader = gl.createShader(gl.VERTEX_SHADER)!;
            gl.shaderSource(vertShader, vertCode);
            gl.compileShader(vertShader);

            // Create fragment shader object 
            let fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
            gl.shaderSource(fragShader, fragCode);
            gl.compileShader(fragShader);

            // Create a shader program object to
            // store the combined shader program
            shaderProgram = gl.createProgram()!;

            // Attach shaders
            gl.attachShader(shaderProgram, vertShader);
            gl.attachShader(shaderProgram, fragShader);

            // Link and use
            gl.linkProgram(shaderProgram);
            gl.useProgram(shaderProgram);

            // Shader's been linked, no need to have  them anymore.
            gl.deleteShader(vertShader);
            gl.deleteShader(fragShader);

            /* ======= Associating shaders to buffer objects =======*/

            // Create an empty buffer object to store vertex buffer
            let vertBuf = gl.createBuffer()!;
            // Bind, pass data, unbind
            gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            let vLoc = gl.getAttribLocation(shaderProgram, "aVertex");
            gl.enableVertexAttribArray(vLoc);
            gl.vertexAttribPointer(vLoc, 2, gl.FLOAT, false, 8, 0);

            // Create an empty buffer object to store Index buffer
            let texCoordBuf = gl.createBuffer()!;
            // Bind, pass data, unbind
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

            let tLoc = gl.getAttribLocation(shaderProgram, "aTex");
            gl.enableVertexAttribArray(tLoc);
            gl.vertexAttribPointer(tLoc, 2, gl.FLOAT, false, 8, 0);
        } catch {
            console.log("WebGL initialization failed");
        }
    }
}

let hostCpuRatioSamples = new Float32Array(32);
let hostCpuRatioPos = 0;

const gbHz = 4194304 * 1;

(window as any).renderUi = false;

let syncToAudio = true;

let cycles = 0;

// Main loop
function _loop(time: number): void {
    // Poll and handle events (inputs, window resize, etc.)
    // You can read the io.WantCaptureMouse, io.WantCaptureKeyboard flags to tell if dear imgui wants to use your inputs.
    // - When io.WantCaptureMouse is true, do not dispatch mouse input data to your main application.
    // - When io.WantCaptureKeyboard is true, do not dispatch keyboard input data to your main application.
    // Generally you may always pass all inputs to dear imgui, and hide them from your application based on those two flags.

    // Use this to sync to audio
    if (runEmulator) {
        if (syncToAudio) {
            if (cpuMeter) {
                let attempts = 10;
                while (mgr.gb.apu.player.sourcesPlaying < 10 && !mgr.gb.breaked && attempts > 0) {
                    let startMs = performance.now();

                    let i = 0;
                    let cpu = mgr.gb.cpu;
                    while (i < 70224 && !mgr.gb.breaked) {
                        i += cpu.execute();
                    }
                    cycles += i;

                    let endMs = performance.now();

                    let timeRealMs = endMs - startMs;
                    let timeEmulMs = (i / gbHz) * 1000;

                    hostCpuRatioSamples[hostCpuRatioPos] = timeRealMs / timeEmulMs;
                    hostCpuRatioPos = (hostCpuRatioPos + 1) & 31;
                    attempts--;
                }
            } else {
                let attempts = 10;
                while (mgr.gb.apu.player.sourcesPlaying < 10 && !mgr.gb.breaked && attempts > 0) {
                    let i = 0;
                    let cpu = mgr.gb.cpu;
                    while (i < 70224 && !mgr.gb.breaked) {
                        i += cpu.execute();
                    }
                    cycles += i;
                }
            }
        } else {
            mgr.gb.turboMode = true;
            let startTime = performance.now();
            // Run 1/60 of a host second
            while (startTime + 16.66 > performance.now()) {
                cycles += mgr.gb.doubleFrame();
            }
        }

        if (mgr.gb.breaked) {
            mgr.gb.unbreak();
            runEmulator = false;
        }
    }


    if (window) {
        requestAnimationFrame(done ? _done : _loop);
    }
}

let outputTex: WebGLTexture | null;
function RenderOutput() {
    if (mgr.gb.ppu.renderDoneScreen) {
        mgr.gb.ppu.renderDoneScreen = false;

        let gl = outputCtx;

        if (gl) {
            gl.useProgram(shaderProgram);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, outputTex);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            if ((window as any).cube) {
                expoRender.worldRotateX += 1;
                expoRender.worldRotateZ += 1;

                expoRender.cameraTranslateX = 0;
                expoRender.cameraTranslateY = 0;
                expoRender.cameraTranslateZ = -120;
                // expoRender.worldRotateX = -160;
                // expoRender.worldRotateY = 20;
                // expoRender.worldRotateZ = -90;
                expoRender.loadTexture(1, 160, 144, new Uint8Array(mgr.gb.ppu.screenFrontBuf.buffer));
                expoRender.frame(0);

                gl.viewport(0, 0, 320, 288);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    320,
                    288,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    expoRender.buffer.data
                );
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            } else {
                gl.viewport(0, 0, 320, 288);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    160,
                    144,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    new Uint8Array(mgr.gb.ppu.screenFrontBuf.buffer)
                );
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            }
        }
    }
}

let runEmulator = false;

function DrawDebug() {
}

let disassemblerInput = "";
function DrawDisassembly() {
    let title = mgr.gb.breakedInfo.length > 0 ? `Disassembly - ${mgr.gb.breakedInfo}` : "Disassembly";
}

function DrawSchedulerInfo() {
    
}

function LoadRomFromURL(url: string, bootrom: boolean) {
    let client = new XMLHttpRequest();
    client.responseType = "arraybuffer";
    client.open("GET", url);
    client.onreadystatechange = () => {
        if (client.status != 404) {
            if (client.response instanceof ArrayBuffer) {
                if (bootrom) {
                    mgr.loadBootrom(new Uint8Array(client.response));
                    console.log("Bootrom loaded!");
                } else {
                    romLoaded = true;
                    loadRom(new Uint8Array(client.response));
                }
            }
        }
    };
    client.send();
}

let romLoaded = false;
function DrawRoms() {
    if (romsListLoadFailed) return;

 
}

let displayTex: null | WebGLTexture;

function DrawDisplay() {

}

let savesInfo: string[] = [];

function updateSaves() {
    let localforage = (window as any).localforage;
    if (localforage) {
        let temp: string[] = [];
        localforage.iterate((v: any, k: string, i: number) => {
            temp.push(k);
        }).then(() => {
            savesInfo = temp;
        });
    }
}

function DrawSaves() {
   
}

let timingDiagramTex: WebGLTexture;

const timingDiagramBuf = new Uint8Array(456 * 154 * 3);
const mode2 = new Uint8Array([0xF3, 0xC9, 0x4A]);
const mode3 = new Uint8Array([0xF3, 0x72, 0x4A]);
const mode0 = new Uint8Array([0x4A, 0xF3, 0x66]);
const mode1 = new Uint8Array([0x4A, 0xE3, 0xF3]);

function initializeTimingDiagram() {
    let bufPos = 0;
    for (let r = 0; r < 154; r++) {
        if (r < 144) {
            for (let c = 0; c < 80; c++) {
                timingDiagramBuf[bufPos++] = mode2[0];
                timingDiagramBuf[bufPos++] = mode2[1];
                timingDiagramBuf[bufPos++] = mode2[2];
            }
            bufPos += 376 * 3;
        } else {
            for (let c = 0; c < 456; c++) {
                timingDiagramBuf[bufPos++] = mode1[0];
                timingDiagramBuf[bufPos++] = mode1[1];
                timingDiagramBuf[bufPos++] = mode1[2];
            }
        }
    }
}
initializeTimingDiagram();

function DrawTimingDiagram() {
  
}

function drawPulseBox(duty: number, widthMul: number, heightMul: number) {}

function drawWaveBox(waveTable: Uint8Array, widthMul: number, waveShift: number) {

}

function drawNoiseBox(noiseArray: Uint8Array, widthMul: number, heightMul: number, noisePos: number) {
 
}


function DrawSoundVisualizer() {
   
}

let scanRom = false;
let scanVram = false;
let scanSram = true;
let scanWram = true;
let scanOam = false;
let scanHram = false;

let memScanHex = false;
let memScanAddr = "";
let memScanInvalid = false;
let gameSharkText = "";
let gameSharkInvalid = false;

let memScanSizes: ["8-bit", "16-bit"] = [
    "8-bit",
    "16-bit",
];

let memScannedMap = new Map<number, number>();
let memScannedValuesFound = 0;
let oldMemScannedMap = memScannedMap;
let oldMemScannedValuesFound = 0;

let memScanRevertAvailable = false;

let currentMemScanSize: "8-bit" | "16-bit" = memScanSizes[0];

let firstScan = true;

function DrawCheats() {
  
}

async function _done(): Promise<void> {

}

function ImGuiColumnSeparator() {

}

function download(filename: string, arr: Uint8Array) {
    let element = document.createElement('a');
    let blob = new Blob([arr.buffer], { type: 'application/octet-stream' });
    element.href = window.URL.createObjectURL(blob);
    element.download = filename;

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function downloadText(filename: string, text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromFrequency(frequency: number) {
    var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
}

function frequencyFromNote(note: number) {
    return Math.pow(2, (note - 69) / 12) * 440;
}

function noteNameFromFrequency(frequency: number) {
    return noteStrings[noteFromFrequency(frequency) % 12];
}

function octaveFromFrequency(frequency: number) {
    // Use octave 0 as base
    return Math.floor(Math.log2(frequency / 27.50));
}

function centsOffFromPitch(frequency: number, note: number) {
    return Math.floor(1200 * Math.log(frequency / frequencyFromNote(note)) / Math.log(2));
}


function loadFileOnClick(element: HTMLElement, accept: string, callback: (arr: ArrayBuffer) => void) {
    element.onclick = () => {
        let input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.addEventListener("input", () => {
            if (input.files && input.files.length > 0) {
                let file = input.files[0];
                let reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function () {
                    let result = reader.result;
                    if (result instanceof ArrayBuffer) {
                        callback(result);
                    } else {
                        alert("Failed to read file! Probably a result of a lack of API support.");
                    }
                };
            }
        });
        input.dispatchEvent(new MouseEvent("click"));
    };
}