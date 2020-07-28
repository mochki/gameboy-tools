
import { GameBoyManager } from './manager';
import * as ImGui from "../lib/imgui-js/imgui";
import * as ImGui_Impl from "./imgui_impl";

import { ImVec2, ImGuiCol } from "../lib/imgui-js/imgui";
import { ImVec4 } from "../lib/imgui-js/imgui";
import { ImGuiIO } from "../lib/imgui-js/imgui";

import { MemoryEditor } from "../lib/imgui-js/imgui_memory_editor";

import { GameBoy } from "../core/gameboy";
import { hexN } from '../core/util/misc';

const clearColor: ImVec4 = new ImVec4(0.114, 0.114, 0.114, 1.00);
const memoryEditor: MemoryEditor = new MemoryEditor();

let done: boolean = false;

async function LoadArrayBuffer(url: string): Promise<ArrayBuffer> {
    const response: Response = await fetch(url);
    return response.arrayBuffer();
}

let romsList: string[] = [];

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

    if (typeof (window) !== "undefined") {
        window.requestAnimationFrame(_loop);
    }
}

// Main loop
function _loop(time: number): void {
    // Poll and handle events (inputs, window resize, etc.)
    // You can read the io.WantCaptureMouse, io.WantCaptureKeyboard flags to tell if dear imgui wants to use your inputs.
    // - When io.WantCaptureMouse is true, do not dispatch mouse input data to your main application.
    // - When io.WantCaptureKeyboard is true, do not dispatch keyboard input data to your main application.
    // Generally you may always pass all inputs to dear imgui, and hide them from your application based on those two flags.

    if (frameStep) {
        for (let i = 0; i < 100000; i++) {
            if (mgr.gb.errored) break;
            mgr.gb.step();
        }
    }

    // Start the Dear ImGui frame
    ImGui_Impl.NewFrame(time);
    ImGui.NewFrame();

    DrawDebug();
    DrawRoms();
    DrawDisplay();
    DrawSchedulerInfo();

    memoryEditor.DrawWindow("Memory Viewer", mgr.gb.bus.wram[0], 0x2000, 0xC000);

    if (ImGui.BeginMainMenuBar()) {
        if (ImGui.BeginMenu("File")) {
            if (ImGui.MenuItem("Load ROM")) {
                //Do something
            }

            ImGui.EndMenu();
        }
        if (ImGui.BeginMenu("Settings")) {
            ImGui.EndMenu();
        }
        ImGui.EndMainMenuBar();
    }

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

        ImGui.Text("Welcome to a new generation of Optime GB.");
        ImGui.Separator();
        ImGui.Columns(3);

        ImGui.Text(`AF: ${hexN(mgr.gb.cpu.getAf(), 4)}`);
        ImGui.Text(`BC: ${hexN(mgr.gb.cpu.getBc(), 4)}`);
        ImGui.Text(`DE: ${hexN(mgr.gb.cpu.getDe(), 4)}`);
        ImGui.Text(`HL: ${hexN(mgr.gb.cpu.getHl(), 4)}`);
        ImGui.Text("");
        ImGui.Text(`SP: ${hexN(mgr.gb.cpu.sp, 4)}`);
        ImGui.Text("");
        ImGui.Text(`PC: ${hexN(mgr.gb.cpu.pc, 4)}`);

        ImGui.Checkbox("IME", v => v = mgr.gb.cpu.ime);

        ImGuiColumnSeparator();

        ImGui.Checkbox("Frame Step", (v = frameStep) => frameStep = v);
        if (ImGui.Button("Unerror")) {
            mgr.gb.errored = false;
        }
        if (ImGui.Button("Step")) {
            mgr.gb.step();
        }
        

        ImGui.NextColumn();

        ImGui.Checkbox("Zero", v => v = mgr.gb.cpu.zero);
        ImGui.Checkbox("Negative", v => v = mgr.gb.cpu.negative);
        ImGui.Checkbox("Half Carry", v => v = mgr.gb.cpu.halfCarry);
        ImGui.Checkbox("Carry", v => v = mgr.gb.cpu.carry);

        ImGui.NextColumn();

        ImGui.Checkbox("Enabled", v => v = mgr.gb.ppu.lcdDisplayEnable);

        ImGui.Text(`LY: ${mgr.gb.ppu.ly}`);
        ImGui.Text(`SCX: ${mgr.gb.ppu.scx}`);
        ImGui.Text(`SCY: ${mgr.gb.ppu.scy}`);

        ImGui.Columns(1);

        ImGui.Separator();
        ImGui.Text(mgr.gb.bus.serialOut);
        ImGui.Separator();

        for (let i = 0; i < mgr.gb.infoText.length; i++) {
            ImGui.Text(mgr.gb.infoText[mgr.gb.infoText.length - i - 1]);
        }

        ImGui.End();
    }
}

function DrawSchedulerInfo() {
    if (ImGui.Begin("Scheduler")) {

        ImGui.Text(`Current Ticks: ${mgr.gb.scheduler.currTicks}`);
        ImGui.Text(`Next event at: ${mgr.gb.scheduler.currEventTicks}`);
        ImGui.Text(`Events queued: ${mgr.gb.scheduler.heapSize}`);

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
    if (ImGui.Begin("ROMs")) {

        for (let i = 0; i < romsList.length; i++) {
            if (ImGui.Button('Load##' + i)) {
                LoadRomFromURL(`../roms/${romsList[i]}`, false);
            }

            ImGui.SameLine(); ImGui.Text(romsList[i]);
        }

        if (romLoaded) {
            ImGui.Text("ROM loaded!");
        }

        ImGui.End();
    }
}

let tex: null | WebGLTexture;

function DrawDisplay() {
    if (ImGui.Begin("Display")) {

        ImGui.SetWindowSize(new ImVec2((160 * 2) + 16, (144 * 2) + 36));

        const gl: WebGLRenderingContext | null = ImGui_Impl.gl;
        if (gl) {
            if (!tex) tex = gl.createTexture()!;
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
                gl.UNSIGNED_BYTE,
                mgr.gb.ppu.screenBuf
            );

            ImGui.Image(tex, new ImVec2(160 * 2, 144 * 2));
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