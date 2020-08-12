import { pulseDuty, pulseDutyArray, waveShiftCodes, noise7Array, noiseDivisors, noise15Array } from './../core/apu';

import { GameBoyManager } from './manager';
import * as ImGui from "../lib/imgui-js/imgui";
import * as ImGui_Impl from "./imgui_impl";

import { ImVec2, ImGuiCol } from "../lib/imgui-js/imgui";
import { ImVec4 } from "../lib/imgui-js/imgui";
import { ImGuiIO } from "../lib/imgui-js/imgui";

import { MemoryEditor } from "../lib/imgui-js/imgui_memory_editor";

import { GameBoy } from "../core/gameboy";
import { hexN } from '../core/util/misc';
import { resolveSchedulerId } from '../core/scheduler';

const clearColor: ImVec4 = new ImVec4(0.114, 0.114, 0.114, 1.00);

let done: boolean = false;

let cpuMeter = false;

let romsList: string[] = [];
let romsListLoadFailed = false;

let mgr = new GameBoyManager();
(window as any).mgr = mgr;

export default async function main(): Promise<void> {
    await ImGui.default();

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
    mgr.gb.ppu.frameSkipRate = 10;
    syncToAudio = false;
}
function disableTurbo() {
    mgr.gb.turboMode = false;
    mgr.gb.ppu.frameSkipRate = 0;
    syncToAudio = true;
}

async function _init(): Promise<void> {
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

                    mgr.loadRom(array);
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
        document.title = `Optime GB (${(pct * 1) | 0} fps)`;
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

            // Emulator Control
            case "Tab": {
                disableTurbo();
            } break;
        }
    };


    console.log("Total allocated space (uordblks) @ _init:", ImGui.bind.mallinfo().uordblks);

    // Setup Dear ImGui binding
    ImGui.IMGUI_CHECKVERSION();
    ImGui.CreateContext();

    const io: ImGuiIO = ImGui.GetIO();
    // io.ConfigFlags |= ImGui.ConfigFlags.NavEnableKeyboard;  // Enable Keyboard Controls

    // Setup style
    // ImGui.StyleColorsDark();
    ImGui.StyleColorsLight();
    //ImGui.StyleColorsClassic();

    io.Fonts.AddFontDefault();

    if (typeof (window) !== "undefined") {
        const canvas: HTMLCanvasElement = document.getElementById("imgui-canvas") as HTMLCanvasElement;
        if (canvas) {
            canvas.tabIndex = 1;
            ImGui_Impl.Init(canvas);
        } else {
            alert("<canvas> with ID \"imgui-canvas\" not found!");
        }
    } else {
        ImGui_Impl.Init(null);
    }

    try {
        if (typeof (window) !== "undefined") {
            window.requestAnimationFrame(_loop);
        }
    } catch (error) {
        alert("Exception occured in main loop, check console for info.");
        console.error(error);
    }

    let toggleImGuiBtn = document.getElementById("toggle-imgui-btn")!;
    let imguiCanvas = document.getElementById("imgui-canvas")!;
    let outputCanvas = document.getElementById("output-canvas")!;
    toggleImGuiBtn.onclick = () => {
        if ((window as any).renderUi) {
            toggleImGuiBtn.innerText = "Enable ImGui";
            (window as any).renderUi = false;

            imguiCanvas.style.display = "none";
            outputCanvas.style.display = "block";

        } else {
            toggleImGuiBtn.innerText = "Disable ImGui";
            (window as any).renderUi = true;

            imguiCanvas.style.display = "block";
            outputCanvas.style.display = "none";

            ImGui_Impl.WindowOnResize();
        }
    };

    document.getElementById("reset-btn")!.onclick = () => {
        mgr.reset();
    };

    document.getElementById("start-btn")!.onclick = () => {
        runEmulator = true;
    };

    document.getElementById("stop-btn")!.onclick = () => {
        runEmulator = false;
    };

    loadFileOnClick(document.getElementById("open-rom-btn")!, ".gb,.gbc", (result: ArrayBuffer) => {
        mgr.loadRom(new Uint8Array(result));
    });

    loadFileOnClick(document.getElementById("load-save-btn")!, ".sav", (result: ArrayBuffer) => {
        mgr.loadSave(new Uint8Array(result));
    });

    document.getElementById("volume-slider")!.oninput = e => {
        let percentVolume = (e.target as HTMLInputElement).value as unknown as number;
        let ratio = percentVolume / 100;
        changeVolume(ratio);
    };

    loadSettings();

    setupOutputWebGl();
}

async function loadSettings() {
    let localforage = (window as any).localforage;
    if (localforage) {
        let volume = await localforage.getItem("frontend-volume");
        if (volume) {
            mgr.gb.apu.player.gain.gain.value = volume;
            ((document.getElementById("volume-slider") as HTMLInputElement).value as unknown as number) = volume * 100;
        }
    }
}

function changeVolume(ratio: number) {
    let localforage = (window as any).localforage;
    mgr.gb.apu.player.gain.gain.value = ratio;
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

            gl.viewport(0, 0, 160, 144);
        } catch {
            console.log("WebGL initialization failed");
        }
    }
}

let hostCpuRatioSamples = new Float32Array(32);
let hostCpuRatioPos = 0;

const gbHz = 4194304 * 1;

(window as any).renderUi = true;

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
                while (mgr.gb.apu.player.sourcesPlaying < 10 && !mgr.gb.errored && attempts > 0) {
                    let startMs = performance.now();

                    let i = mgr.gb.frame();
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
                while (mgr.gb.apu.player.sourcesPlaying < 10 && !mgr.gb.errored && attempts > 0) {
                    cycles += mgr.gb.frame();
                }
            }
        } else {
            mgr.gb.turboMode = true;
            cycles += mgr.gb.doubleFrame();
            cycles += mgr.gb.doubleFrame();
            cycles += mgr.gb.doubleFrame();
            cycles += mgr.gb.doubleFrame();
        }
    }

    if ((window as any).renderUi) {
        // Start the Dear ImGui frame
        ImGui_Impl.NewFrame(time);
        ImGui.NewFrame();

        DrawDebug();
        DrawRoms();
        DrawDisplay();
        DrawSchedulerInfo();
        DrawSaves();
        DrawTimingDiagram();
        DrawSoundVisualizer();

        ImGui.EndFrame();

        // Rendering
        ImGui.Render();
        const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
        if (gl) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.w);
            gl.clear(gl.COLOR_BUFFER_BIT);
            //gl.useProgram(0); // You may want this if using this code in an OpenGL 3+ context where shaders may be bound
        }
        ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
    } else {
        RenderOutput();
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
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGB,
                160,
                144,
                0,
                gl.RGB,
                gl.UNSIGNED_SHORT_5_6_5,
                mgr.gb.ppu.screenFrontBuf,
            );
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }
}

let runEmulator = false;

function DrawDebug() {
    if (ImGui.Begin("Optime GB")) {
        if (mgr.romLoaded) {
            ImGui.Text("Welcome to a new generation of Optime GB.");
            ImGui.Separator();
            ImGui.Columns(4);

            ImGui.Text(`AF: ${hexN(mgr.gb.cpu.getAf(), 4)}`);
            ImGui.Text(`BC: ${hexN(mgr.gb.cpu.getBc(), 4)}`);
            ImGui.Text(`DE: ${hexN(mgr.gb.cpu.getDe(), 4)}`);
            ImGui.Text(`HL: ${hexN(mgr.gb.cpu.getHl(), 4)}`);
            ImGui.Text("");
            ImGui.Text(`SP: ${hexN(mgr.gb.cpu.sp, 4)}`);
            ImGui.Text("");
            ImGui.Text(`PC: ${hexN(mgr.gb.cpu.pc, 4)}`);

            ImGui.Checkbox("IME", v => v = mgr.gb.cpu.ime);
            ImGui.Text(`Halted Cycles: \n${mgr.gb.haltSkippedCycles}`);

            ImGuiColumnSeparator();

            if (cpuMeter) {

                let hostCpuRatio = 0;
                for (let i = 0; i < 32; i++) {
                    hostCpuRatio += hostCpuRatioSamples[i];
                }
                hostCpuRatio /= 32;
                ImGui.Text(`Host CPU:`);
                let pos: ImVec2 = ImGui.GetCursorScreenPos();
                let width: number = ImGui.GetColumnWidth();
                ImGui.GetWindowDrawList().AddRectFilled(new ImVec2(pos.x, pos.y), new ImVec2(pos.x + ((width - 24) * hostCpuRatio), pos.y + 8), ImGui.GetColorU32(ImGuiCol.PlotHistogram));
                ImGui.GetWindowDrawList().AddRect(new ImVec2(pos.x, pos.y), new ImVec2(pos.x + width - 24, pos.y + 8), ImGui.GetColorU32(ImGuiCol.Border));
                ImGui.Dummy(new ImVec2(0, 8));

            }
            ImGui.Checkbox("CPU Meter", (v = cpuMeter) => cpuMeter = v);

            ImGui.Checkbox("Run Emulator", (v = runEmulator) => runEmulator = v);
            if (ImGui.Button("Unerror")) mgr.gb.errored = false;
            if (ImGui.Button("Step")) mgr.gb.cpu.execute();
            if (ImGui.Button("Reset")) mgr.reset();
            ImGui.Checkbox("Skip Boot ROM", (v = mgr.skipBootrom) => mgr.skipBootrom = v);

            ImGui.NextColumn();

            ImGui.Checkbox("Zero", v => v = mgr.gb.cpu.zero);
            ImGui.Checkbox("Negative", v => v = mgr.gb.cpu.negative);
            ImGui.Checkbox("Half Carry", v => v = mgr.gb.cpu.halfCarry);
            ImGui.Checkbox("Carry", v => v = mgr.gb.cpu.carry);

            ImGui.NextColumn();

            ImGui.Checkbox("Enabled", v => v = mgr.gb.ppu.lcdDisplayEnable);
            ImGui.Checkbox("Window Tilemap", v => v = mgr.gb.ppu.windowTilemapSelect);
            ImGui.Checkbox("Window Enable", v => v = mgr.gb.ppu.windowEnable);
            ImGui.Checkbox("Tile Data Select", v => v = mgr.gb.ppu.bgWindowTiledataSelect);
            ImGui.Checkbox("BG Tilemap", v => v = mgr.gb.ppu.bgTilemapSelect);
            ImGui.Checkbox("Sprite Size", v => v = mgr.gb.ppu.objSize);
            ImGui.Checkbox("Sprite Enable", v => v = mgr.gb.ppu.objEnable);
            ImGui.Checkbox("BG / Window Enable", v => v = mgr.gb.ppu.bgWindowEnable);

            ImGuiColumnSeparator();

            ImGui.Text(`LY: ${mgr.gb.ppu.ly}`);
            ImGui.Text(`SCX: ${mgr.gb.ppu.scx}`);
            ImGui.Text(`SCY: ${mgr.gb.ppu.scy}`);
            ImGui.Text(`WY: ${mgr.gb.ppu.wy}`);
            ImGui.Text(`WX: ${mgr.gb.ppu.wx}`);

            ImGui.Text(`Fetcher Step: ${mgr.gb.ppu.fetcherStep}`);
            ImGui.Text(`Fetcher Pixel X: ${mgr.gb.ppu.fetcherX}`);

            ImGui.NextColumn();

            ImGui.Text(`DIV: ${mgr.gb.timer.getDiv()}`);
            ImGui.Text(`TIMA: ${mgr.gb.timer.counter}`);
            ImGui.Text(`TMA: ${mgr.gb.timer.modulo}`);

            ImGui.Columns(1);

            ImGui.Separator();
            ImGui.Text(mgr.gb.bus.serialOut);
            ImGui.Separator();

            for (let i = 0; i < mgr.gb.infoText.length; i++) {
                ImGui.Text(mgr.gb.infoText[mgr.gb.infoText.length - i - 1]);
            }

            ImGui.End();
        } else {
            ImGui.Text("No ROM loaded :(");
        }
    }
}

function DrawSchedulerInfo() {
    if (ImGui.Begin("Scheduler")) {

        ImGui.Text(`Current Ticks: ${mgr.gb.scheduler.currTicks}`);
        ImGui.Text(`Next event at: ${mgr.gb.scheduler.nextEventTicks}`);
        ImGui.Text(`Events queued: ${mgr.gb.scheduler.heapSize}`);

        ImGui.Separator();

        ImGui.Columns(3);

        ImGui.Text("Index");
        ImGui.SetColumnWidth(ImGui.GetColumnIndex(), 50);
        ImGui.NextColumn();
        ImGui.Text("Ticks");
        ImGui.NextColumn();
        ImGui.Text("ID");
        ImGui.NextColumn();

        ImGui.Separator();

        for (let i = 0; i < mgr.gb.scheduler.heapSize; i++) {
            let evt = mgr.gb.scheduler.heap[i];
            ImGui.Text(i.toString());
            ImGui.NextColumn();
            ImGui.Text((evt.ticks - mgr.gb.scheduler.currTicks).toString());
            ImGui.NextColumn();
            ImGui.Text(resolveSchedulerId(evt.id));
            ImGui.NextColumn();
        }
        ImGui.Columns(1);

        ImGui.End();
    }
}

function LoadRomFromURL(url: string, bootrom: boolean) {
    let client = new XMLHttpRequest();
    client.responseType = "arraybuffer";
    client.open("GET", url);
    client.onreadystatechange = () => {
        if (client.response instanceof ArrayBuffer) {
            if (bootrom) {
                mgr.loadBootrom(new Uint8Array(client.response));
                console.log("Bootrom loaded!");
            } else {
                romLoaded = true;
                mgr.loadRom(new Uint8Array(client.response));
            }
        }
    };
    client.send();
}

let romLoaded = false;
function DrawRoms() {
    if (romsListLoadFailed) return;

    if (ImGui.Begin("ROMs")) {

        for (let i = 0; i < romsList.length; i++) {
            if (romsList[i].substr(0, 1) != "#") {
                if (ImGui.Button('Load##' + i)) {
                    LoadRomFromURL(`../roms/${romsList[i]}`, false);
                }
                ImGui.SameLine(); ImGui.Text(romsList[i]);
            }

        }

        if (romLoaded) {
            ImGui.Text("ROM loaded!");
        }

        ImGui.End();
    }
}

let displayTex: null | WebGLTexture;
let displaySize = new ImVec2(160 * 4, 144 * 4);

function DrawDisplay() {
    if (ImGui.Begin("Display", () => true, ImGui.ImGuiWindowFlags.NoResize)) {

        ImGui.SetWindowSize(new ImVec2(displaySize.x + 16, displaySize.y + 36));

        const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
        if (gl) {
            if (!displayTex) {
                displayTex = gl.createTexture()!;

                gl.bindTexture(gl.TEXTURE_2D, displayTex);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }

            if (mgr.gb.ppu.renderDoneScreen) {
                mgr.gb.ppu.renderDoneScreen = false;
                gl.bindTexture(gl.TEXTURE_2D, displayTex);

                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB,
                    160,
                    144,
                    0,
                    gl.RGB,
                    gl.UNSIGNED_SHORT_5_6_5,
                    mgr.gb.ppu.screenFrontBuf,
                );
            }

            ImGui.Image(displayTex, displaySize);
        }

        ImGui.End();
    }
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
    if (ImGui.Begin("Saves")) {
        let localforage = (window as any).localforage;
        if (localforage) {
            if (savesInfo.length > 0) {
                for (let i = 0; i < savesInfo.length; i++) {
                    if (ImGui.Button('Download##' + i)) {
                        localforage.getItem(savesInfo[i]).then((arr: Uint8Array) => {
                            download(`${savesInfo[i].slice(0, -4)}.sav`, arr);
                        });
                    }
                    ImGui.SameLine(); ImGui.Text(savesInfo[i]);
                }
            } else {
                ImGui.Text("No saves found.");
            }
        } else {
            ImGui.Text("localForage not found :(");
        }

        ImGui.End();
    }
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
    if (ImGui.Begin("Timing Diagram"), () => true, ImGui.ImGuiWindowFlags.NoResize) {
        ImGui.SetWindowSize(new ImVec2((456) + 16, (154) + 36));

        const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
        if (gl) {
            if (!timingDiagramTex) {
                timingDiagramTex = gl.createTexture()!;

                gl.bindTexture(gl.TEXTURE_2D, timingDiagramTex);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }

            if (mgr.gb.ppu.renderDoneTimingDiagram) {
                mgr.gb.ppu.renderDoneTimingDiagram = false;
                let bufPos = 0;
                for (let r = 0; r < 154; r++) {
                    if (r < 144) {
                        bufPos += 80 * 3;
                        let mode3Length = mgr.gb.ppu.scanlineTimingsFront[r];
                        let mode0Length = 376 - mode3Length;
                        for (let c = 0; c < mode3Length; c++) {
                            timingDiagramBuf[bufPos++] = mode3[0];
                            timingDiagramBuf[bufPos++] = mode3[1];
                            timingDiagramBuf[bufPos++] = mode3[2];
                        }
                        for (let c = 0; c < mode0Length; c++) {
                            timingDiagramBuf[bufPos++] = mode0[0];
                            timingDiagramBuf[bufPos++] = mode0[1];
                            timingDiagramBuf[bufPos++] = mode0[2];
                        }
                    }
                }

                gl.bindTexture(gl.TEXTURE_2D, timingDiagramTex);

                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB,
                    456,
                    154,
                    0,
                    gl.RGB,
                    gl.UNSIGNED_BYTE,
                    timingDiagramBuf,
                );
            }
            ImGui.Image(timingDiagramTex, new ImVec2(456, 154));
        }

        ImGui.End();
    }
}

function drawPulseBox(duty: number, widthMul: number, heightMul: number) {
    let dl = ImGui.GetWindowDrawList();
    let pos: ImVec2 = ImGui.GetCursorScreenPos();
    let width: number = ImGui.GetWindowContentRegionWidth();

    ImGui.Dummy(new ImVec2(0, 128));
    dl.AddRectFilled(pos, new ImVec2(pos.x + width, pos.y + 128), ImGui.GetColorU32(ImGuiCol.Button));
    dl.AddRect(pos, new ImVec2(pos.x + width, pos.y + 128), ImGui.GetColorU32(ImGuiCol.Border));

    const lineCol = ImGui.GetColorU32(ImGuiCol.PlotLines);

    let init = 0;
    let xPerUnit = ((width) / 8) * widthMul;
    let valX = pos.x;

    const yCenter = (pos.y + 64);
    const yHigh = (yCenter - (heightMul * 56));
    const yLow = (yCenter + (heightMul * 56));

    for (let i = 0; i < 2048; i++) {
        let val = pulseDuty[duty][i & 7];
        val = (val * -1) + 1;

        let newX = valX + xPerUnit;
        if (newX > pos.x + width) newX = pos.x + width;
        if (valX > pos.x + width) valX = pos.x + width;
        if (val != init) {
            // Make sure vertical line isn't off the edge of the box
            if (valX > pos.x && valX < pos.x + width) {
                dl.AddLine(new ImVec2(valX, yHigh), new ImVec2(valX, yLow), lineCol, 2);
            }
        }
        if (val) {
            dl.AddLine(new ImVec2(valX, yHigh), new ImVec2(newX, yHigh), lineCol, 2);
        } else {
            dl.AddLine(new ImVec2(valX, yLow), new ImVec2(newX, yLow), lineCol, 2);
        }
        valX += xPerUnit;

        init = val;

        if (valX > pos.x + width) return;
    }
}

function drawWaveBox(waveTable: Uint8Array, widthMul: number, waveShift: number) {
    let dl = ImGui.GetWindowDrawList();
    let pos: ImVec2 = ImGui.GetCursorScreenPos();
    let width: number = ImGui.GetWindowContentRegionWidth();

    ImGui.Dummy(new ImVec2(0, 128));
    dl.AddRectFilled(pos, new ImVec2(pos.x + width, pos.y + 128), ImGui.GetColorU32(ImGuiCol.Button));
    dl.AddRect(pos, new ImVec2(pos.x + width, pos.y + 128), ImGui.GetColorU32(ImGuiCol.Border));

    const lineCol = ImGui.GetColorU32(ImGuiCol.PlotLines);

    let prev = 0;
    let xPerUnit = ((width) / 32) * widthMul;
    let valX = pos.x;

    const yCenter = (pos.y + 64);
    const yHigh = yCenter - 56;
    const yLow = yCenter + 56;

    for (let i = 0; i < 2048; i++) {
        let val = waveTable[i & 31];
        val >>= waveShift;

        const y = yLow - ((val / 15) * 112);
        const yPrev = yLow - ((prev / 15) * 112);

        let newX = valX + xPerUnit;
        if (newX > pos.x + width) newX = pos.x + width;
        if (valX > pos.x + width) valX = pos.x + width;
        if (val != prev) {
            // Make sure vertical line isn't off the edge of the box
            if (valX > pos.x && valX < pos.x + width) {
                dl.AddLine(new ImVec2(valX, y), new ImVec2(valX, yPrev), lineCol, 2);
            }
        }
        dl.AddLine(new ImVec2(valX, y), new ImVec2(newX, y), lineCol, 2);
        valX += xPerUnit;

        prev = val;

        if (valX > pos.x + width) return;
    }
}

let noisePos = 0;
function drawNoiseBox(noiseArray: Uint8Array, widthMul: number, heightMul: number) {
    let dl = ImGui.GetWindowDrawList();
    let pos: ImVec2 = ImGui.GetCursorScreenPos();
    let width: number = ImGui.GetWindowContentRegionWidth();

    ImGui.Dummy(new ImVec2(0, 128));
    dl.AddRectFilled(pos, new ImVec2(pos.x + width, pos.y + 128), ImGui.GetColorU32(ImGuiCol.Button));
    dl.AddRect(pos, new ImVec2(pos.x + width, pos.y + 128), ImGui.GetColorU32(ImGuiCol.Border));

    const lineCol = ImGui.GetColorU32(ImGuiCol.PlotLines);

    let init = 0;
    let xPerUnit = ((width) / 8) * widthMul;
    let valX = pos.x;

    const yCenter = (pos.y + 64);
    const yHigh = (yCenter - (heightMul * 56));
    const yLow = (yCenter + (heightMul * 56));

    for (let i = 0; i < 2048; i++) {
        let val = noiseArray[noisePos++ & 65535];
        val = (val * -1) + 1;

        let newX = valX + xPerUnit;
        if (newX > pos.x + width) newX = pos.x + width;
        if (valX > pos.x + width) valX = pos.x + width;
        if (val != init) {
            // Make sure vertical line isn't off the edge of the box
            if (valX > pos.x && valX < pos.x + width) {
                dl.AddLine(new ImVec2(valX, yHigh), new ImVec2(valX, yLow), lineCol, 2);
            }
        }
        if (val) {
            dl.AddLine(new ImVec2(valX, yHigh), new ImVec2(newX, yHigh), lineCol, 2);
        } else {
            dl.AddLine(new ImVec2(valX, yLow), new ImVec2(newX, yLow), lineCol, 2);
        }
        valX += xPerUnit;

        init = val;

        if (valX > pos.x + width) return;
    }
}

// Converts from Game Boy cycle period into hertz.
function hzFromPeriod(period: number) {
    return 4194304 / period;
}

function DrawSoundVisualizer() {
    let gb = mgr.gb;

    if (ImGui.Begin("Sound Visualizer")) {

        ImGui.Text('Pulse 1');

        let pulse1Hz = 131072 / (2048 - gb.apu.ch1.frequency);
        let pulse1Active = gb.apu.ch1.enabled && gb.apu.ch1.dacEnabled && (gb.apu.ch1.enableL || gb.apu.ch1.enableR);
        drawPulseBox(gb.apu.ch1.duty, 64 / pulse1Hz, pulse1Active ? gb.apu.ch1.volume / 15 : 0);
        let pulse1Note = noteFromFrequency(pulse1Hz);
        let pulse1CentsOff = centsOffFromPitch(pulse1Hz, pulse1Note);
        ImGui.Text(`Pitch: ${pulse1Hz} hz`);
        ImGui.Text(`Note: ${noteNameFromFrequency(pulse1Hz)}${octaveFromFrequency(pulse1Hz)} ${(pulse1CentsOff < 0 ? "" : "+") + pulse1CentsOff}`);

        ImGui.Separator();

        ImGui.Text('Pulse 2');
        let pulse2Hz = 131072 / (2048 - gb.apu.ch2.frequency);
        let pulse2Active = gb.apu.ch2.enabled && gb.apu.ch2.dacEnabled && (gb.apu.ch2.enableL || gb.apu.ch2.enableR);
        drawPulseBox(gb.apu.ch2.duty, 64 / pulse2Hz, pulse2Active ? gb.apu.ch2.volume / 15 : 0);
        let pulse2Note = noteFromFrequency(pulse2Hz);
        let pulse2CentsOff = centsOffFromPitch(pulse2Hz, pulse2Note);
        ImGui.Text(`Pitch: ${pulse2Hz} hz`);
        ImGui.Text(`Note: ${noteNameFromFrequency(pulse2Hz)}${octaveFromFrequency(pulse2Hz)} ${(pulse2CentsOff < 0 ? "" : "+") + pulse2CentsOff}`);

        ImGui.Separator();

        ImGui.Text('Wave');
        let waveHz = 65536 / (2048 - gb.apu.ch3.frequency);
        let waveActive = gb.apu.ch3.enabled && gb.apu.ch3.dacEnabled && (gb.apu.ch3.enableL || gb.apu.ch3.enableR) && gb.apu.ch3.volumeCode != 0;
        drawWaveBox(gb.apu.ch3.waveTable, 64 / waveHz, waveActive ? gb.apu.ch3.volumeShift : 0);
        let waveNote = noteFromFrequency(waveHz);
        let waveCentsOff = centsOffFromPitch(waveHz, waveNote);
        ImGui.Text(`Pitch: ${waveHz} hz`);
        ImGui.Text(`Note: ${noteNameFromFrequency(waveHz)}${octaveFromFrequency(waveHz)} ${(waveCentsOff < 0 ? "" : "+") + waveCentsOff}`);

        ImGui.Separator();

        ImGui.Text('Noise');

        let noiseHz = 524288 / noiseDivisors[gb.apu.ch4.divisorCode] / 2 ^ (gb.apu.ch4.frequencyShift + 1);
        let noiseActive = gb.apu.ch4.enabled && gb.apu.ch4.dacEnabled && (gb.apu.ch4.enableL || gb.apu.ch4.enableR);
        drawNoiseBox(gb.apu.ch4.sevenBit ? noise7Array : noise15Array, 0.025, noiseActive ? gb.apu.ch4.volume / 15 : 0);
        ImGui.End();
    }
}

async function _done(): Promise<void> {
    const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
    if (gl) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.w);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Cleanup
    ImGui_Impl.Shutdown();
    ImGui.DestroyContext();

    console.log("Total allocated space (uordblks) @ _done:", ImGui.bind.mallinfo().uordblks);
}

function ImGuiColumnSeparator() {
    ImGui.Dummy(new ImVec2(0.0, 0.5));

    // Draw separator within column
    let drawList = ImGui.GetWindowDrawList();
    let pos = ImGui.GetCursorScreenPos();
    drawList.AddLine(new ImVec2(pos.x - 9999, pos.y), new ImVec2(pos.x + 9999, pos.y), ImGui.GetColorU32(ImGuiCol.Separator));

    ImGui.Dummy(new ImVec2(0.0, 0.9));
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