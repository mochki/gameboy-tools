
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

async function _init(): Promise<void> {

    setInterval(() => {
        updateSaves();
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
        const output: HTMLElement = document.getElementById("output") || document.body;
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        output.appendChild(canvas);
        canvas.tabIndex = 1;
        canvas.style.position = "absolute";
        canvas.style.left = "0px";
        canvas.style.right = "0px";
        canvas.style.top = "0px";
        canvas.style.bottom = "0px";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        ImGui_Impl.Init(canvas);
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

    const openRomBtn = document.getElementById("open-rom-btn")!;
    openRomBtn.onclick = () => {
        let input = document.createElement("input");
        input.type = "file";
        input.accept = ".gb,.gbc";
        input.addEventListener("input", () => {
            if (input.files && input.files.length > 0) {
                let file = input.files[0];
                let reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function () {
                    let result = reader.result;
                    if (result instanceof ArrayBuffer) {
                        mgr.loadRom(new Uint8Array(result));
                    } else {
                        alert("Failed to read ROM! Probably a result of a lack of API support.");
                    }
                };
            }
        });
        input.dispatchEvent(new MouseEvent("click"));
    };
}

let hostCpuRatioSamples = new Float32Array(32);
let hostCpuRatioPos = 0;

const gbHz = 4194304 * 1;

(window as any).renderUi = true;

let syncToAudio = true;

// Main loop
function _loop(time: number): void {
    // Poll and handle events (inputs, window resize, etc.)
    // You can read the io.WantCaptureMouse, io.WantCaptureKeyboard flags to tell if dear imgui wants to use your inputs.
    // - When io.WantCaptureMouse is true, do not dispatch mouse input data to your main application.
    // - When io.WantCaptureKeyboard is true, do not dispatch keyboard input data to your main application.
    // Generally you may always pass all inputs to dear imgui, and hide them from your application based on those two flags.

    // Use this to sync to audio
    if (frameStep) {
        if (syncToAudio) {
            if (cpuMeter) {
                let attempts = 10;
                while (mgr.gb.apu.player.sourcesPlaying < 8 && !mgr.gb.errored && attempts > 0) {
                    let startMs = performance.now();

                    let i = mgr.gb.frame();

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
                    mgr.gb.frame();
                }
            }
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

        const ctx: CanvasRenderingContext2D | null = ImGui_Impl.ctx;
        if (ctx) {
            // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = `rgba(${clearColor.x * 0xff}, ${clearColor.y * 0xff}, ${clearColor.z * 0xff}, ${clearColor.w})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
    }

    if (typeof (window) !== "undefined") {
        window.requestAnimationFrame(done ? _done : _loop);
    }
}

class FastRNG {
    x = 123456789;
    y = 362436069;
    z = 521288629;

    // xorshf96
    next(): number {
        let t = 0;
        this.x ^= this.x << 16;
        this.x ^= this.x >> 5;
        this.x ^= this.x << 1;

        t = this.x;
        this.x = this.y;
        this.y = this.z;
        this.z = t ^ this.x ^ this.y;

        return this.z;
    }
}
const RNG = new FastRNG();

let frameStep = false;

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

            ImGui.Checkbox("Frame Step", (v = frameStep) => frameStep = v);
            if (ImGui.Button("Unerror")) mgr.gb.errored = false;
            if (ImGui.Button("Step")) mgr.gb.cpu.execute();
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

let tex: null | WebGLTexture;

function DrawDisplay() {
    if (ImGui.Begin("Display", () => true, ImGui.ImGuiWindowFlags.NoResize)) {

        ImGui.SetWindowSize(new ImVec2((160 * 2) + 16, (144 * 2) + 36));

        const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
        if (gl) {
            if (!tex) tex = gl.createTexture()!;

            if (mgr.gb.ppu.renderDoneScreen) {
                mgr.gb.ppu.renderDoneScreen = false;
                gl.bindTexture(gl.TEXTURE_2D, tex);

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
            }

            ImGui.Image(tex, new ImVec2(160 * 2, 144 * 2));
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
            if (!timingDiagramTex) timingDiagramTex = gl.createTexture()!;

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

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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

async function _done(): Promise<void> {
    const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
    if (gl) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.w);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    const ctx: CanvasRenderingContext2D | null = ImGui_Impl.ctx;
    if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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