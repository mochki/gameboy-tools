interface Window {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
}

const NEAR_CLIPPING_PLANE = 0;

function debug(msg: any) {
    let debugElement = document.getElementById("debug")!;
    debugElement.innerText = msg;
}

class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copyFrom(vec: Vec3) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    }
}

class ObjVertexRef {
    v: number;
    vt: number;
    vn: number;

    constructor(v: number, vt: number, vn: number) {
        this.v = v;
        this.vt = vt;
        this.vn = vn;
    }
}

class ObjVertex {
    position: Vec3;
    texCoord: Vec2;
    normal: Vec3;

    constructor(position: Vec3, texCoord: Vec2, normal: Vec3) {
        this.position = position;
        this.texCoord = texCoord;
        this.normal = normal;
    }
}

class ObjFile {
    positionArr: Vec3[];
    texCoordArr: Vec2[];
    normalArr: Vec3[];

    constructor(positionArr: Vec3[], texCoordArr: Vec2[], normalArr: Vec3[]) {
        this.positionArr = positionArr;
        this.texCoordArr = texCoordArr;
        this.normalArr = normalArr;
    }
}

class VertexData {
    x: number = 0;
    y: number = 0;
    z: number = 0;

    u: number = 0;
    v: number = 0;

    color: number = 0;
}

class Triangle {
    verticesX = new Float64Array(3);
    verticesY = new Float64Array(3);
    verticesZ = new Float64Array(3);

    verticesU = new Float64Array(3);
    verticesV = new Float64Array(3);

    colors = new Uint32Array(3);
    colorFactor = 1;

    materialId = 0;
    textureId = 0; // nonzero = textured

    normal = new Vec3();

    constructor(
        x0 = 0, y0 = 0, z0 = 0, u0 = 0, v0 = 0,
        x1 = 0, y1 = 0, z1 = 0, u1 = 0, v1 = 0,
        x2 = 0, y2 = 0, z2 = 0, u2 = 0, v2 = 0,

        color0 = 0,
        color1 = 0,
        color2 = 0,

        textureId = 0,
        materialId = 0,
    ) {
        this.verticesU[0] = u0;
        this.verticesV[0] = v0;
        this.verticesX[0] = x0;
        this.verticesY[0] = y0;
        this.verticesZ[0] = z0;
        this.verticesU[1] = u1;
        this.verticesV[1] = v1;
        this.verticesX[1] = x1;
        this.verticesY[1] = y1;
        this.verticesZ[1] = z1;
        this.verticesU[2] = u2;
        this.verticesV[2] = v2;
        this.verticesX[2] = x2;
        this.verticesY[2] = y2;
        this.verticesZ[2] = z2;

        this.colors[0] = color0;
        this.colors[1] = color1;
        this.colors[2] = color2;

        this.textureId = textureId;
        this.materialId = materialId;
    }

    set(
        x0 = 0, y0 = 0, z0 = 0, u0 = 0, v0 = 0,
        x1 = 0, y1 = 0, z1 = 0, u1 = 0, v1 = 0,
        x2 = 0, y2 = 0, z2 = 0, u2 = 0, v2 = 0,

        color0 = 0,
        color1 = 0,
        color2 = 0,

        textureId = 0,
        materialId = 0,
    ) {
        this.verticesU[0] = u0;
        this.verticesV[0] = v0;
        this.verticesX[0] = x0;
        this.verticesY[0] = y0;
        this.verticesZ[0] = z0;
        this.verticesU[1] = u1;
        this.verticesV[1] = v1;
        this.verticesX[1] = x1;
        this.verticesY[1] = y1;
        this.verticesZ[1] = z1;
        this.verticesU[2] = u2;
        this.verticesV[2] = v2;
        this.verticesX[2] = x2;
        this.verticesY[2] = y2;
        this.verticesZ[2] = z2;

        this.colors[0] = color0;
        this.colors[1] = color1;
        this.colors[2] = color2;

        this.textureId = textureId;
        this.materialId = materialId;
    }

    invertNormal() {
        let u = this.verticesU[0];
        let v = this.verticesV[0];
        let x = this.verticesX[0];
        let y = this.verticesY[0];
        let z = this.verticesZ[0];
        this.verticesU[0] = this.verticesU[1];
        this.verticesV[0] = this.verticesV[1];
        this.verticesX[0] = this.verticesX[1];
        this.verticesY[0] = this.verticesY[1];
        this.verticesZ[0] = this.verticesZ[1];
        this.verticesU[1] = u;
        this.verticesV[1] = v;
        this.verticesX[1] = x;
        this.verticesY[1] = y;
        this.verticesZ[1] = z;
    }
}

let tmpVec0 = new Vec3();
let tmpVec1 = new Vec3();
function normalOfTriangle(tri: Triangle, vec: Vec3) {
    tmpVec0.x = tri.verticesX[1] - tri.verticesX[0];
    tmpVec0.y = tri.verticesY[1] - tri.verticesY[0];
    tmpVec0.z = tri.verticesZ[1] - tri.verticesZ[0];
    tmpVec1.x = tri.verticesX[2] - tri.verticesX[0];
    tmpVec1.y = tri.verticesY[2] - tri.verticesY[0];
    tmpVec1.z = tri.verticesZ[2] - tri.verticesZ[0];
    crossProduct(tmpVec0, tmpVec1, vec);
    return vec;
}

function angleBetweenVectors(in0: Vec3, in1: Vec3): number {
    return Math.acos(dotProduct(in0, in1) / (lengthOfVector(in0) * lengthOfVector(in1)));
}

function lengthOfVector(vec: Vec3): number {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
}

function normalizeVector(vec: Vec3) {
    let length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    vec.x /= length;
    vec.y /= length;
    vec.z /= length;
    return vec;
}

function normalizeTo1Vector(vec: Vec3) {
    let largest = max(max(vec.x, vec.y), vec.z);
    vec.x /= largest;
    vec.y /= largest;
    vec.z /= largest;
    return vec;
}

function crossProduct(in0: Vec3, in1: Vec3, out: Vec3) {
    let x = (in0.y * in1.z) - (in0.z * in1.y);
    let y = (in0.z * in1.x) - (in0.x * in1.z);
    let z = (in0.x * in1.y) - (in0.y * in1.x);
    out.x = x;
    out.y = y;
    out.z = z;
}

function dotProduct(in0: Vec3, in1: Vec3): number {
    let result = 0;
    result += in0.x * in1.x;
    result += in0.y * in1.y;
    result += in0.z * in1.z;
    return result;
}

const RESOLUTION_SCALE = 2;
const SCREEN_SCALE = 4;
const WIDTH = 160 * RESOLUTION_SCALE;
const HEIGHT = 144 * RESOLUTION_SCALE;
const HALF_WIDTH = WIDTH / 2;
const HALF_HEIGHT = HEIGHT / 2;
const BYTES_PER_PIXEL = 4;

const G_BUFFER_CLEAR_VAL = 4294967295;
const Z_BUFFER_CLEAR_VAL = 0;

export class ExpoRender {
    debugMode = true;

    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;

    normalShading = true;

    crossVertIndex = 0;
    frameCount = 0;
    frameTimeCounterNext = 0;

    crossX = 0;
    crossY = 0;

    triangle0Z = 0;

    zDivisor = 150;
    flySpeedMul = 1;

    lookUp = false;
    lookLeft = false;
    lookDown = false;
    lookRight = false;

    moveUp = false;
    moveDown = false;
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;

    objXFlip = false;
    objYFlip = false;
    objZFlip = false;

    normalYFlip = false;
    shiftLeft = false;
    pointerCaptured = false;

    buffer = new ImageData(WIDTH, HEIGHT);
    zBuffer = new Float64Array(WIDTH * HEIGHT);
    zBufferAlwaysBlank = new Float64Array(WIDTH * HEIGHT);
    gBuffer = new Uint32Array(WIDTH * HEIGHT);

    tris: Array<Triangle> = new Array();
    renderTris: Array<Triangle> = new Array();
    renderTrisCount = 0;

    textures: Array<ImageData> = new Array();
    static missingTexture = ExpoRender.generateMissingTexture();

    clearColor = 0x222222FF;

    pixelsFilled = 0;
    linesFilled = 0;

    vertexBuf = new Array(3).fill(0).map(() => new VertexData());

    cameraTranslateX = 0;
    cameraTranslateY = 0;
    cameraTranslateZ = 0;
    cameraRotateX = 0;
    cameraRotateY = 0;
    cameraRotateZ = 0;

    cameraVec = new Vec3();

    worldRotateX = 0;
    worldRotateY = 0;
    worldRotateZ = 0;

    ssao = true;
    vertexDots = false;
    perspectiveTransform = true;
    fill = true;
    rotate = false;
    wireframe = false;
    renderZ = false;
    depthTest = true;

    lowZ = 0;
    highZ = 0;
    activeLowZ = 0;
    activeHighZ = 0;

    tmpVec = new Vec3();
    upVec = new Vec3(0, 0, 1);

    load(debugMode: boolean, canvasElement?: HTMLCanvasElement, infoElement?: HTMLElement) {
        this.debugMode = debugMode;

        this.canvas = canvasElement;
        this.ctx = canvasElement?.getContext("2d")!;
        if (this.ctx) {
            console.log("Hello ExpoRender!");
        } else {
            console.log("Couldn't load 2D context");
        }

        if (this.debugMode) {
            document.getElementById("rotate")!.onclick = e => { this.rotate = (e as any).target.checked; };
            document.getElementById("fill")!.onclick = e => { this.fill = (e as any).target.checked; };
            document.getElementById("wireframe")!.onclick = e => { this.wireframe = (e as any).target.checked; };
            document.getElementById("render-z")!.onclick = e => { this.renderZ = (e as any).target.checked; };
            document.getElementById("depth-test")!.onclick = e => { this.depthTest = (e as any).target.checked; };
            document.getElementById("ssao")!.onclick = e => { this.ssao = (e as any).target.checked; };
            document.getElementById("perspective-transform")!.onclick = e => { this.perspectiveTransform = (e as any).target.checked; };
            document.getElementById("normal-shading")!.onclick = e => { this.normalShading = (e as any).target.checked; };
            document.getElementById("triangle-0-z")!.oninput = e => { this.triangle0Z = parseInt((e as any).target.value); };
            document.getElementById("x-slider")!.oninput = e => { this.cameraTranslateX = parseInt((e as any).target.value); };
            document.getElementById("y-slider")!.oninput = e => { this.cameraTranslateY = parseInt((e as any).target.value); };
            document.getElementById("z-slider")!.oninput = e => { this.cameraTranslateZ = parseInt((e as any).target.value); };
            document.getElementById("x-rotation")!.oninput = e => { this.worldRotateX = parseInt((e as any).target.value); };
            document.getElementById("y-rotation")!.oninput = e => { this.worldRotateY = parseInt((e as any).target.value); };
            document.getElementById("z-rotation")!.oninput = e => { this.worldRotateZ = parseInt((e as any).target.value); };
            document.getElementById("vertex-dots")!.onclick = e => { this.vertexDots = (e as any).target.checked; };
            document.getElementById("obj-x-flip")!.onclick = e => { this.objXFlip = (e as any).target.checked; };
            document.getElementById("obj-y-flip")!.onclick = e => { this.objYFlip = (e as any).target.checked; };
            document.getElementById("obj-z-flip")!.onclick = e => { this.objZFlip = (e as any).target.checked; };
            document.getElementById("normal-y-flip")!.onclick = e => { this.normalYFlip = (e as any).target.checked; };

            this.rotate = (document.getElementById("rotate") as any).checked;
            this.fill = (document.getElementById("fill") as any).checked;
            this.wireframe = (document.getElementById("wireframe") as any).checked;
            this.renderZ = (document.getElementById("render-z") as any).checked;
            this.depthTest = (document.getElementById("depth-test") as any).checked;
            this.ssao = (document.getElementById("ssao") as any).checked;
            this.perspectiveTransform = (document.getElementById("perspective-transform") as any).checked;
            this.normalShading = (document.getElementById("normal-shading") as any).checked;
            this.triangle0Z = parseInt((document.getElementById("triangle-0-z") as any).value);
            this.cameraTranslateX = parseInt((document.getElementById("x-slider") as any).value);
            this.cameraTranslateY = parseInt((document.getElementById("y-slider") as any).value);
            this.cameraTranslateZ = parseInt((document.getElementById("z-slider") as any).value);

            document.onpointerlockchange = () => {
                this.pointerCaptured = document.pointerLockElement == canvasElement;
            };

            document.addEventListener("wheel", e => {
                if (this.pointerCaptured) {
                    this.flySpeedMul += -e.deltaY / 250;
                    this.flySpeedMul = bounds(0, 10, this.flySpeedMul);
                    e.preventDefault();
                }
            }, { passive: false });

            let keyEvent = (key: string, val: boolean) => {
                switch (key) {
                    case "KeyE": this.moveUp = val; break;
                    case "KeyQ": this.moveDown = val; break;
                    case "KeyW": this.moveForward = val; break;
                    case "KeyS": this.moveBackward = val; break;
                    case "KeyA": this.moveLeft = val; break;
                    case "KeyD": this.moveRight = val; break;
                    case "ArrowLeft": this.lookLeft = val; break;
                    case "ArrowRight": this.lookRight = val; break;
                    case "ArrowUp": this.lookUp = val; break;
                    case "ArrowDown": this.lookDown = val; break;
                    case "ShiftLeft": this.shiftLeft = val; break;
                }
            };

            let block = ["KeyQ", "KeyE", "KeyW", "KeyS", "KeyA", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "ShiftLeft", "Backquote"];

            document.onkeydown = e => {
                if (block.includes(e.key)) {
                    e.preventDefault();
                }

                switch (e.code) {
                    case "Backquote":
                        if (this.shiftLeft) {
                            canvasElement?.requestPointerLock();
                        }
                        break;
                }

                keyEvent(e.code, true);
            };
            document.onkeyup = e => {
                if (block.includes(e.key)) {
                    e.preventDefault();
                }

                keyEvent(e.code, false);
            };

            let dropHandler = (ev: Event | any) => {
                let expoRender = this;
                if (ev.dataTransfer.files[0] instanceof Blob) {
                    console.log("File(s) dropped");

                    ev.preventDefault();

                    let reader = new FileReader();
                    reader.onload = function () {
                        if (this.result instanceof ArrayBuffer) {
                            let dec = new TextDecoder("utf-8");
                            let newTris = parseObjFile(dec.decode(new Uint8Array(this.result)), expoRender.objXFlip, expoRender.objYFlip, expoRender.objZFlip);

                            for (let i = 0; i < newTris.length; i++) {
                                expoRender.tris.push(newTris[i]);
                            }
                        }
                    };
                    reader.readAsArrayBuffer(ev.dataTransfer.files[0]);
                }
            };

            let dragoverHandler = (ev: Event | any) => {
                ev.preventDefault();
            };

            window.addEventListener("drop", dropHandler);
            window.addEventListener("dragover", dragoverHandler);
        }

        if (canvasElement) {
            canvasElement.onclick = (evt) => {
                if (!this.pointerCaptured) {
                    let x = this.crossX - this.cameraTranslateX - HALF_WIDTH;
                    let y = this.crossY - this.cameraTranslateY - HALF_HEIGHT;
                    this.tris[0].verticesX[this.crossVertIndex] = x + HALF_WIDTH;
                    this.tris[0].verticesY[this.crossVertIndex] = y + HALF_HEIGHT;

                    // tris[0].verticesX[crossVertIndex] = crossX - globalTranslateX;
                    // tris[0].verticesY[crossVertIndex] = crossY - globalTranslateY;

                    this.crossVertIndex++;

                    if (this.crossVertIndex >= 3) {
                        this.crossVertIndex = 0;
                    }
                }
            };

            canvasElement.width = WIDTH;
            canvasElement.height = HEIGHT;
            canvasElement.style.width = (WIDTH * SCREEN_SCALE).toString() + "px";
            canvasElement.style.height = (HEIGHT * SCREEN_SCALE).toString() + "px";
            canvasElement.style.imageRendering = "pixelated";
            canvasElement.style.cursor = "none";
            canvasElement.onmousemove = (evt) => {
                if (this.pointerCaptured) {
                    this.cameraRotateY += evt.movementX * 0.25;
                    this.cameraRotateX += evt.movementY * 0.25;

                    this.cameraRotateY %= 360;
                    this.cameraRotateX = bounds(-90, 90, this.cameraRotateX);
                } else {
                    let ratio = canvasElement.clientWidth / WIDTH;

                    let rect = canvasElement.getBoundingClientRect();

                    this.crossX = ((evt.clientX - rect.left) / ratio) | 0;
                    this.crossY = ((evt.clientY - rect.top) / ratio) | 0;

                    if (this.debugMode && infoElement) {
                        infoElement.innerText = `
                        Pos X: ${this.crossX}
                        Pos Y: ${this.crossY}
                
                        Set Vertex ${this.crossVertIndex}
                        `;
                    }
                }
            };
        }

        this.init();

        if (this.debugMode) {
            requestAnimationFrame(this.frameDriver.bind(this));
        }
    };

    loadTexture(id: number, width: number, height: number, data: Uint8Array) {
        if (id == 0) return;

        let imageData = new ImageData(width, height);
        for (let i = 0; i < data.length; i++) {
            imageData.data[i] = data[i];
        }
        this.textures[id - 1] = imageData;
    }

    fetchTexture(id: number) {
        if (this.textures[id - 1]) {
            return this.textures[id - 1];
        }

        return ExpoRender.missingTexture;
    }

    loadTextureFromUrl(url: string) {
        let img = document.createElement('img');
        img.src = url;
        img.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            canvas.remove();

            this.textures.push(ctx.getImageData(0, 0, img.width, img.height));
        };
    }

    static generateMissingTexture() {
        let data = new ImageData(8, 8);
        let colors = [0xFF00FFFF, 0x000000FF];
        let colorIndex = 0;
        let dataIndex = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                data.data[dataIndex++] = (colors[colorIndex] >> 24) & 0xFF;
                data.data[dataIndex++] = (colors[colorIndex] >> 16) & 0xFF;
                data.data[dataIndex++] = (colors[colorIndex] >> 8) & 0xFF;
                data.data[dataIndex++] = (colors[colorIndex] >> 0) & 0xFF;
                colorIndex++;
                colorIndex %= 2;
            }
            colorIndex++;
            colorIndex %= 2;
        }

        return data;
    }

    rasterize() {
        this.activeLowZ = this.lowZ;
        this.activeHighZ = this.highZ;
        this.lowZ = 0;
        this.highZ = 0;

        let activeZBuffer = this.depthTest ? this.zBuffer : this.zBufferAlwaysBlank;

        if (this.fill) {
            triLoop:
            for (let t = 0; t < this.renderTrisCount; t++) {
                let tri = this.renderTris[t];
                let materialId = tri.materialId;
                let texture = this.fetchTexture(tri.textureId);

                for (let v = 0; v < 3; v++) {
                    // Place vertices into temporary buffers
                    this.vertexBuf[v].x = tri.verticesX[v];
                    this.vertexBuf[v].y = tri.verticesY[v];
                    this.vertexBuf[v].z = tri.verticesZ[v];
                    this.vertexBuf[v].u = tri.verticesU[v];
                    this.vertexBuf[v].v = tri.verticesV[v];
                    this.vertexBuf[v].color = tri.colors[v];

                }

                let c00 = 0;
                let c01 = 0;
                let c02 = 0;
                let c10 = 0;
                let c11 = 0;
                let c12 = 0;

                // console.log(`${verticesXBuf[0]}, ${verticesXBuf[1]}, ${verticesXBuf[2]}`);

                // Insertion sort vertices by Y
                let i = 1;
                while (i < 3 /* length */) {
                    let j = i;
                    while (j > 0 && this.vertexBuf[j - 1].y > this.vertexBuf[j].y) {
                        let tmp = this.vertexBuf[j];
                        this.vertexBuf[j] = this.vertexBuf[j - 1];
                        this.vertexBuf[j - 1] = tmp;

                        j--;
                    }
                    i++;
                }

                let y = bounds(0, HEIGHT, this.vertexBuf[0].y);
                let endY = bounds(0, HEIGHT, this.vertexBuf[2].y);

                for (; y < endY; y++) {
                    // left edge: 0-1 
                    // right edge: 0-2 
                    let e0v0 = this.vertexBuf[1];
                    let e0v1 = this.vertexBuf[0];

                    let e1v0 = this.vertexBuf[0];
                    let e1v1 = this.vertexBuf[2];

                    // if (line == leftEdge0.y) {
                    //     vertexBuf[0].color ^= 0xFFFFFF00;
                    //     vertexBuf[1].color ^= 0xFFFFFF00;
                    //     vertexBuf[2].color ^= 0xFFFFFF00;
                    // }

                    if (y >= e0v0.y && !(e1v1.y == y && e0v0.y == y)) {
                        e0v1 = e1v1;

                        let tmp = e0v1;
                        e0v1 = e0v0;
                        e0v0 = tmp;
                    }

                    let e0Height = e0v1.y - e0v0.y;
                    let e1Height = e1v1.y - e1v0.y;

                    let e0StartY = min(e0v1.y, e0v0.y);
                    let e1StartY = min(e1v1.y, e1v0.y);

                    let e0RelativeY = y - e0StartY;
                    let e1RelativeY = y - e1StartY;

                    let e0XRatio = abs(e0RelativeY / e0Height);
                    let e1XRatio = abs(e1RelativeY / e1Height);

                    let e0Lerped = lerp(e0v1.x, e0v0.x, e0XRatio);
                    let e1Lerped = lerp(e1v0.x, e1v1.x, e1XRatio);
                    let e0ColorLerped = lerpColor(e0v1.color, e0v0.color, e0XRatio);
                    let e1ColorLerped = lerpColor(e1v0.color, e1v1.color, e1XRatio);
                    let e0RecipZLerped = lerp(1 / e0v1.z, 1 / e0v0.z, e0XRatio);
                    let e1RecipZLerped = lerp(1 / e1v0.z, 1 / e1v1.z, e1XRatio);

                    let e0ULerpedRecip = lerp(e0v1.u / e0v1.z, e0v0.u / e0v0.z, e0XRatio);
                    let e1ULerpedRecip = lerp(e1v0.u / e1v0.z, e1v1.u / e1v1.z, e1XRatio);
                    let e0VLerpedRecip = lerp(e0v1.v / e0v1.z, e0v0.v / e0v0.z, e0XRatio);
                    let e1VLerpedRecip = lerp(e1v0.v / e1v0.z, e1v1.v / e1v1.z, e1XRatio);

                    // debug(`
                    //     L: ${leftEdgeHeight}
                    //     R: ${rightEdgeHeight}
                    // `);

                    // console.log(`left  X ratio: ${leftEdgeXRatio}`)
                    // console.log(`right X ratio: ${rightEdgeXRatio}`)

                    // console.log(`left X: ${leftEdge0X}`)

                    // If the left is to the right of the right for some reason, swap left and right
                    // (allow arbitrary winding order)
                    if (e0Lerped >= e1Lerped) {
                        let tmp = e1Lerped;
                        e1Lerped = e0Lerped;
                        e0Lerped = tmp;
                        let tmpColor = e1ColorLerped;
                        e1ColorLerped = e0ColorLerped;
                        e0ColorLerped = tmpColor;
                        let tmpZ = e1RecipZLerped;
                        e1RecipZLerped = e0RecipZLerped;
                        e0RecipZLerped = tmpZ;

                        let tmpU = e1ULerpedRecip;
                        e1ULerpedRecip = e0ULerpedRecip;
                        e0ULerpedRecip = tmpU;
                        let tmpV = e1VLerpedRecip;
                        e1VLerpedRecip = e0VLerpedRecip;
                        e0VLerpedRecip = tmpV;
                    }

                    c00 = (((e0ColorLerped >> 24) & 0xFF) * tri.colorFactor) | 0;
                    c01 = (((e0ColorLerped >> 16) & 0xFF) * tri.colorFactor) | 0;
                    c02 = (((e0ColorLerped >> 8) & 0xFF) * tri.colorFactor) | 0;
                    c10 = (((e1ColorLerped >> 24) & 0xFF) * tri.colorFactor) | 0;
                    c11 = (((e1ColorLerped >> 16) & 0xFF) * tri.colorFactor) | 0;
                    c12 = (((e1ColorLerped >> 8) & 0xFF) * tri.colorFactor) | 0;

                    let lineLengthNoClip = e1Lerped - e0Lerped;

                    let recipZ = e0RecipZLerped;
                    let c0 = c00;
                    let c1 = c01;
                    let c2 = c02;

                    let recipU = e0ULerpedRecip;
                    let recipV = e0VLerpedRecip;

                    let recipZPerPixel = (e1RecipZLerped - e0RecipZLerped) / lineLengthNoClip;
                    let c0PerPixel = (c10 - c00) / lineLengthNoClip;
                    let c1PerPixel = (c11 - c01) / lineLengthNoClip;
                    let c2PerPixel = (c12 - c02) / lineLengthNoClip;

                    let recipUPerPixel = (e1ULerpedRecip - e0ULerpedRecip) / lineLengthNoClip;
                    let recipVPerPixel = (e1VLerpedRecip - e0VLerpedRecip) / lineLengthNoClip;

                    // Adjust starting parameters for left side being off screen
                    if (e0Lerped < 0) {
                        recipZ -= recipZPerPixel * e0Lerped;
                        c0 -= c0PerPixel * e0Lerped;
                        c1 -= c1PerPixel * e0Lerped;
                        c2 -= c2PerPixel * e0Lerped;

                        recipU -= recipUPerPixel * e0Lerped;
                        recipV -= recipVPerPixel * e0Lerped;

                        e0Lerped = 0;
                    }

                    // Align to screen space integers
                    recipZ -= recipZPerPixel * (e0Lerped % 1);
                    c0 -= c0PerPixel * (e0Lerped % 1);
                    c1 -= c1PerPixel * (e0Lerped % 1);
                    c2 -= c2PerPixel * (e0Lerped % 1);

                    recipU -= recipUPerPixel * (e0Lerped % 1);
                    recipV -= recipVPerPixel * (e0Lerped % 1);

                    e1Lerped = bounds(0, WIDTH, e1Lerped);

                    let x = e0Lerped | 0;
                    let endX = e1Lerped | 0;

                    // console.log(`lerped left  X: ${leftEdgeLerped}`)
                    // console.log(`lerped right X: ${rightEdgeLerped}`)

                    let lineLength = endX - x;
                    // console.log(`length: ${lineLength}`)

                    // pls mr runtime, round down...
                    let zBase = y * WIDTH + x;
                    let base = zBase * BYTES_PER_PIXEL;

                    if (!this.renderZ) {
                        for (; x < endX; x++) {
                            if (recipZ >= activeZBuffer[zBase]) {
                                let correctZ = 1 / recipZ;

                                if (correctZ > 1) {
                                    if (tri.textureId != 0) {
                                        let correctU = recipU * correctZ;
                                        let correctV = recipV * correctZ;

                                        // extend when out of bounds
                                        let pixelU = abs(((correctU * texture.width) | 0) % texture.width);
                                        let pixelV = abs(((correctV * texture.height) | 0) % texture.height);

                                        let texelBase = (pixelV * texture.width + pixelU) * 4;
                                        let texelR = (texture.data[texelBase + 0] * tri.colorFactor) | 0;
                                        let texelG = (texture.data[texelBase + 1] * tri.colorFactor) | 0;
                                        let texelB = (texture.data[texelBase + 2] * tri.colorFactor) | 0;

                                        // Texture fill
                                        this.buffer.data[base + 0] = texelR; /* R */;
                                        this.buffer.data[base + 1] = texelG; /* G */;
                                        this.buffer.data[base + 2] = texelB; /* B */;
                                    } else {
                                        this.buffer.data[base + 0] = c0; /* R */;
                                        this.buffer.data[base + 1] = c1; /* G */;
                                        this.buffer.data[base + 2] = c2; /* B */;
                                    }

                                    this.zBuffer[zBase] = recipZ;
                                    this.gBuffer[zBase] = materialId;
                                }
                            }

                            recipZ += recipZPerPixel;
                            recipU += recipUPerPixel;
                            recipV += recipVPerPixel;
                            c0 += c0PerPixel;
                            c1 += c1PerPixel;
                            c2 += c2PerPixel;

                            base += 4;
                            zBase += 1;
                        }
                    } else {
                        for (; x < endX; x++) {
                            if (recipZ >= activeZBuffer[zBase]) {
                                let renderZ = recipZ;
                                if (renderZ < this.lowZ) this.lowZ = renderZ;
                                if (renderZ > this.highZ) this.highZ = renderZ;
                                renderZ -= this.activeLowZ;
                                renderZ *= (255 / (this.activeHighZ - this.activeLowZ));

                                this.buffer.data[base + 0] = renderZ;
                                this.buffer.data[base + 1] = renderZ;
                                this.buffer.data[base + 2] = renderZ;

                                this.zBuffer[zBase] = recipZ;
                            }

                            recipZ += recipZPerPixel;

                            base += 4;
                            zBase += 1;
                        }
                    }

                    this.pixelsFilled += lineLength;
                    this.linesFilled++;
                }
            }
        }

        if (this.wireframe) {
            for (let t = 0; t < this.renderTrisCount; t++) {
                let tri = this.renderTris[t];

                // let color = tri.colors[0];

                // const c0 = (color >> 24) & 0xFF;
                // const c1 = (color >> 16) & 0xFF;
                // const c2 = (color >> 8) & 0xFF;
                // const c3 = (color >> 0) & 0xFF;

                // const lc0 = lerp(c0, 0xFF, 0.5);
                // const lc1 = lerp(c1, 0xFF, 0.5);
                // const lc2 = lerp(c2, 0xFF, 0.5);

                // let lineColor = ((c0 << 0) | (c1 << 8) | (c2 << 16) | (c3 << 24)) ^ 0xFFFFFF00;

                this.drawLine(tri.verticesX[0], tri.verticesY[0], tri.verticesX[1], tri.verticesY[1], 0x000000FF);
                this.drawLine(tri.verticesX[1], tri.verticesY[1], tri.verticesX[2], tri.verticesY[2], 0x000000FF);
                this.drawLine(tri.verticesX[2], tri.verticesY[2], tri.verticesX[0], tri.verticesY[0], 0x000000FF);
            }
        }
    }

    postProcess() {
        for (let y = 1; y < HEIGHT - 1; y++) {
            let p = (WIDTH * 1) * y + 1;
            let screenIndex = p * 4;
            for (let x = 1; x < WIDTH - 1; x++) {
                if (this.gBuffer[p] != G_BUFFER_CLEAR_VAL) {
                    let core = this.zBuffer[p];
                    let occlusion = 0;

                    // SSAO
                    // Sample 3x3 area - index up 1 and left 1 
                    // const initIndex = (p - (WIDTH * 1)) - 1;
                    // let index = initIndex;

                    // for (let i = 0; i < 3; i++) {
                    //     let subIndex = index;
                    //     for (let j = 0; j < 3; j++) {
                    //         if (this.gBuffer[subIndex] != G_BUFFER_CLEAR_VAL) {
                    //             let depth = this.zBuffer[subIndex];
                    //             const threshold = 32;
                    //             let diff = abs(depth - core);
                    //             if (diff > threshold) {
                    //                 diff *= smoothstep(1, 0, (diff + threshold) / 64);
                    //             }
                    //             occlusion += diff;
                    //         }

                    //         subIndex++;
                    //     }
                    //     index += WIDTH;
                    // }

                    // Edge marking
                    const materialId = this.gBuffer[p];
                    if (
                        this.gBuffer[p - 1] > materialId ||
                        this.gBuffer[p + 1] > materialId ||
                        this.gBuffer[p + WIDTH] > materialId ||
                        this.gBuffer[p - WIDTH] > materialId
                    ) {
                        const EDGE_VAL = 0x7F;
                        this.buffer.data[screenIndex + 0] = EDGE_VAL;
                        this.buffer.data[screenIndex + 1] = EDGE_VAL;
                        this.buffer.data[screenIndex + 2] = EDGE_VAL;
                    } else {
                        let sub = max(0, occlusion) * 2;
                        this.buffer.data[screenIndex + 0] = this.buffer.data[screenIndex + 0] - sub;
                        this.buffer.data[screenIndex + 1] = this.buffer.data[screenIndex + 1] - sub;
                        this.buffer.data[screenIndex + 2] = this.buffer.data[screenIndex + 2] - sub;
                    }
                }

                screenIndex += 4;
                p++;
            }
        }
    }

    drawLine(x0: number, y0: number, x1: number, y1: number, color: number) {
        let low: boolean;
        let swap: boolean;
        let dx0: number;
        let dy0: number;
        let dx1: number;
        let dy1: number;

        if (abs(y1 - y0) < abs(x1 - x0)) {
            low = true;
            swap = x0 > x1;
        } else {
            low = false;
            swap = y0 > y1;
        }

        if (swap) {
            dx0 = x1;
            dy0 = y1;
            dx1 = x0;
            dy1 = y0;
        } else {
            dx0 = x0;
            dy0 = y0;
            dx1 = x1;
            dy1 = y1;
        }

        if (low) {
            let dx = dx1 - dx0;
            let dy = dy1 - dy0;

            let yi = 1;

            if (dy < 0) {
                yi = -1;
                dy = -dy;
            }

            let d = (2 * dy) - dx;
            let y = dy0;

            for (let x = dx0; x <= dx1; x++) {
                this.setPixel(x, y, color);
                if (d > 0) {
                    y = y + yi;
                    d = d + (2 * (dy - dx));
                } else {
                    d = d + 2 * dy;
                }
                this.pixelsFilled++;
            }
        } else {
            let dx = dx1 - dx0;
            let dy = dy1 - dy0;

            let xi = 1;

            if (dx < 0) {
                xi = -1;
                dx = -dx;
            }

            let d = (2 * dx) - dy;
            let x = dx0;

            for (let y = dy0; y <= dy1; y++) {
                this.setPixel(x, y, color);
                if (d > 0) {
                    x = x + xi;
                    d = d + (2 * (dx - dy));
                } else {
                    d = d + 2 * dx;
                }
                this.pixelsFilled++;
            }
        }
    }

    drawCrosshair() {
        switch (this.crossVertIndex) {
            case 0: col = 0xFF0000FF; break;
            case 1: col = 0x00FF00FF; break;
            case 2: col = 0x0000FFFF; break;
        }

        let x = this.crossX;
        let y = this.crossY;

        this.setPixel(x + 0, y - 1, col);
        this.setPixel(x + 0, y - 2, col);

        this.setPixel(x + 0, y + 1, col);
        this.setPixel(x + 0, y + 2, col);

        this.setPixel(x - 1, y + 0, col);
        this.setPixel(x - 2, y + 0, col);

        this.setPixel(x + 1, y + 0, col);
        this.setPixel(x + 2, y + 0, col);
    }

    invertColorAt(x: number, y: number) {
        // Invert RGB channels
        this.setPixel(x, y, this.getPixel(x, y) ^ 0xFFFFFF00);
    }

    drawDots() {
        for (let t = 0; t < this.tris.length; t++) {
            let tri = this.renderTris[t];
            for (let v = 0; v < 3; v++) {
                let col = tri.colors[v];
                let x = tri.verticesX[v] | 0;
                let y = tri.verticesY[v] | 0;
                this.setPixel(x - 1, y - 1, col);
                this.setPixel(x + 0, y - 1, col);
                this.setPixel(x + 1, y - 1, col);
                this.setPixel(x - 1, y + 0, col);
                this.setPixel(x + 1, y + 0, col);
                this.setPixel(x - 1, y + 1, col);
                this.setPixel(x + 0, y + 1, col);
                this.setPixel(x + 1, y + 1, col);
            }
        }
    }

    setPixel(x: number, y: number, col: number) {
        if (x >= WIDTH) return;
        if (y >= HEIGHT) return;

        const c0 = (col >> 24) & 0xFF;
        const c1 = (col >> 16) & 0xFF;
        const c2 = (col >> 8) & 0xFF;
        const c3 = (col >> 0) & 0xFF;

        let base = ((y * WIDTH) + x) * BYTES_PER_PIXEL;
        this.buffer.data[base + 0] = c0;
        this.buffer.data[base + 1] = c1;
        this.buffer.data[base + 2] = c2;
        this.buffer.data[base + 3] = c3;
    }

    getPixel(x: number, y: number): number {
        let base = ((y * WIDTH) + x) * BYTES_PER_PIXEL;
        return (this.buffer.data[base + 0] << 24) |
            (this.buffer.data[base + 1] << 16) |
            (this.buffer.data[base + 2] << 8) |
            (this.buffer.data[base + 3] << 0);
    }

    init() {
        // my own setup 
        this.tris = new Array(1).fill(0).map(
            () => new Triangle(
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,

                0xFF0000FF,
                0x00FF00FF,
                0x0000FFFF
            )
        );

        this.renderTris = new Array(4);

        this.addCube(
            0, 0, 0, 64, 0xFFFFFFFF, 1
        );


        // this.tris[0].verticesX[2] = 127 + 1;
        // this.tris[0].verticesY[2] = 27 - 1;
        // this.tris[0].verticesX[1] = 195 + 1;
        // this.tris[0].verticesY[1] = 163 - 1;
        // this.tris[0].verticesX[0] = 59 + 1;
        // this.tris[0].verticesY[0] = 163 - 1;

        // this.tris[0].verticesU[2] = this.tris[0].verticesX[2];
        // this.tris[0].verticesV[2] = this.tris[0].verticesY[2];
        // this.tris[0].verticesU[1] = this.tris[0].verticesX[1];
        // this.tris[0].verticesV[1] = this.tris[0].verticesY[1];
        // this.tris[0].verticesU[0] = this.tris[0].verticesX[0];
        // this.tris[0].verticesV[0] = this.tris[0].verticesY[0];

        // this.loadTextureFromUrl("cubetexture.png");
        this.loadTextureFromUrl("mattrb.webp");

        // Actual application setup 
        for (let i = 0; i < this.zBufferAlwaysBlank.length; i++) {
            this.zBufferAlwaysBlank[i] = Z_BUFFER_CLEAR_VAL;
        }
    }

    addCube(x: number, y: number, z: number, size: number, color: number, textureId: number) {
        let hSize = size / 2; // half size
        let mul = 1;
        let cMul = 1; // right triangle corner 
        for (let f = 0; f < 2; f++) {
            for (let t = 0; t < 2; t++) {
                let t0 = new Triangle(
                    x + hSize * cMul, y + hSize * cMul, z + hSize * mul, t, t,
                    x - hSize, y + hSize, z + hSize * mul, 0, 1,
                    x + hSize, y - hSize, z + hSize * mul, 1, 0,

                    color,
                    color,
                    color,

                    textureId
                );
                let t1 = new Triangle(
                    z + hSize * mul, x + hSize * cMul, y + hSize * cMul, t, t,
                    z + hSize * mul, x - hSize, y + hSize, 0, 1,
                    z + hSize * mul, x + hSize, y - hSize, 1, 0,

                    color,
                    color,
                    color,

                    textureId
                );
                let t2 = new Triangle(
                    x - hSize, z + hSize * mul, y + hSize, 0, 1,
                    x + hSize * cMul, z + hSize * mul, y + hSize * cMul, t, t,
                    x + hSize, z + hSize * mul, y - hSize, 1, 0,

                    color,
                    color,
                    color,

                    textureId
                );

                // idk how to work out the proper winding order for cube tris so I'll just hack it like this 
                if (t == 0) {
                    t0.invertNormal();
                    t1.invertNormal();
                    t2.invertNormal();
                }
                if (f == 0) {
                    t0.invertNormal();
                    t1.invertNormal();
                    t2.invertNormal();
                }

                this.tris.push(t0);
                this.tris.push(t1);
                this.tris.push(t2);

                cMul *= -1;
            }

            mul *= -1;
        }
    }

    clear() {
        let pos = 0;
        for (let i = 0; i < WIDTH * HEIGHT; i++) {
            let c = this.clearColor;
            for (let j = 0; j < BYTES_PER_PIXEL; j++) {
                this.buffer.data[pos++] = (c >> 24) & 0xFF;
                c <<= 8;
            }
            this.zBuffer[i] = Z_BUFFER_CLEAR_VAL;
            this.gBuffer[i] = G_BUFFER_CLEAR_VAL;
        }
        this.pixelsFilled += WIDTH * HEIGHT;
    }

    display() {
        this.ctx?.putImageData(this.buffer, 0, 0);
    }

    frame(time: DOMHighResTimeStamp) {
        let deltaTime = time - lastTime;
        lastTime = time;

        cameraSinY = Math.sin(toRadians(this.cameraRotateY));
        cameraCosY = Math.cos(toRadians(this.cameraRotateY));
        cameraSinX = Math.sin(toRadians(this.cameraRotateX));
        cameraCosX = Math.cos(toRadians(this.cameraRotateX));
        cameraSinZ = Math.sin(toRadians(this.cameraRotateZ));
        cameraCosZ = Math.cos(toRadians(this.cameraRotateZ));

        movementVector.set(0, 0, 0);

        let moveBy = (deltaTime / 16) * this.flySpeedMul;
        if (this.moveUp) this.cameraTranslateY += moveBy;
        if (this.moveDown) this.cameraTranslateY -= moveBy;
        if (this.moveForward) movementVector.z += moveBy;
        if (this.moveBackward) movementVector.z -= moveBy;
        if (this.moveLeft) movementVector.x += moveBy;
        if (this.moveRight) movementVector.x -= moveBy;

        rotateVecXz(movementVector, cameraSinY, cameraCosY);

        this.cameraTranslateX += movementVector.x;
        this.cameraTranslateY += movementVector.y;
        this.cameraTranslateZ += movementVector.z;

        this.worldRotateX += deltaTime / 16;
        this.worldRotateZ += deltaTime / 16;

        moveBy = deltaTime / 8;
        if (this.lookLeft) this.cameraRotateY -= moveBy;
        if (this.lookRight) this.cameraRotateY += moveBy;
        if (this.lookDown) this.cameraRotateX += moveBy;
        if (this.lookUp) this.cameraRotateX -= moveBy;

        this.tris[0].verticesZ[0] = this.triangle0Z;
        this.tris[0].verticesZ[1] = this.triangle0Z;
        this.tris[0].verticesZ[2] = this.triangle0Z;

        this.clear();

        this.processTransformations();
        this.rasterize();
        if (this.ssao) this.postProcess();

        if (this.vertexDots) this.drawDots();
        if (!this.pointerCaptured) this.drawCrosshair();

        this.display();

        this.frameCount++;

        if (time >= this.frameTimeCounterNext) {
            this.frameTimeCounterNext += 1000;
            if (this.debugMode) {
                debug(
                    `FPS: ${this.frameCount}
                 Lines: ${this.linesFilled}
                 Tris: ${this.renderTrisCount}
                 Pixels: ${this.pixelsFilled}

                 Translate X: ${this.cameraTranslateX}
                 Translate Y: ${this.cameraTranslateY}
                 Translate Z: ${this.cameraTranslateZ}

                 Rotate X: ${this.cameraRotateX}
                 Rotate Y: ${this.cameraRotateY}
                 Rotate Z: ${this.cameraRotateZ}
                 `
                );
            }
            this.frameCount = 0;
        }

        this.linesFilled = 0;
        this.pixelsFilled = 0;
    }

    processTransformations() {
        this.renderTrisCount = 0;

        let worldSinY = Math.sin(toRadians(this.worldRotateY));
        let worldCosY = Math.cos(toRadians(this.worldRotateY));
        let worldSinX = Math.sin(toRadians(this.worldRotateX));
        let worldCosX = Math.cos(toRadians(this.worldRotateX));
        let worldSinZ = Math.sin(toRadians(this.worldRotateZ));
        let worldCosZ = Math.cos(toRadians(this.worldRotateZ));

        if (this.normalYFlip) {
            this.upVec.y = -1;
        } else {
            this.upVec.y = 1;
        }

        this.cameraVec.x = 0;
        this.cameraVec.y = 0;
        this.cameraVec.z = -1;

        if (this.rotate) {
            rotateVecXz(this.cameraVec, cameraSinY, cameraCosY);
            rotateVecYz(this.cameraVec, cameraSinX, cameraCosX);
            rotateVecXy(this.cameraVec, cameraSinZ, cameraCosZ);
        }

        triLoop:
        for (let i = 0; i < this.tris.length; i++) {
            if (this.renderTris[this.renderTrisCount] == null) {
                this.renderTris[this.renderTrisCount] = new Triangle();
            }
            let preTri = this.tris[i];

            let renderTri = this.renderTris[this.renderTrisCount];

            for (let j = 0; j < 3; j++) {
                renderTri.verticesX[j] = preTri.verticesX[j];
                renderTri.verticesY[j] = preTri.verticesY[j];
                renderTri.verticesZ[j] = preTri.verticesZ[j];
                renderTri.verticesU[j] = preTri.verticesU[j];
                renderTri.verticesV[j] = preTri.verticesV[j];

                renderTri.colors[j] = preTri.colors[j];
            }
            renderTri.textureId = preTri.textureId;
            renderTri.materialId = preTri.materialId;

            rotateTriXz(this.renderTris[this.renderTrisCount], 0, 0, worldSinY, worldCosY);
            rotateTriYz(this.renderTris[this.renderTrisCount], 0, 0, worldSinX, worldCosX);
            rotateTriXy(this.renderTris[this.renderTrisCount], 0, 0, worldSinZ, worldCosZ);

            if (this.normalShading) {
                normalOfTriangle(renderTri, renderTri.normal);
                this.tmpVec.copyFrom(renderTri.normal);
                renderTri.colorFactor = angleBetweenVectors(this.tmpVec, this.upVec) / Math.PI;
            } else {
                renderTri.colorFactor = 1;
            }

            for (let j = 0; j < 3; j++) {
                renderTri.verticesX[j] += HALF_WIDTH;
                renderTri.verticesY[j] += HALF_HEIGHT;
            }

            if (this.rotate) {
                rotateTriXz(this.renderTris[this.renderTrisCount], HALF_WIDTH - this.cameraTranslateX, this.cameraTranslateZ, cameraSinY, cameraCosY);
                rotateTriYz(this.renderTris[this.renderTrisCount], HALF_HEIGHT - this.cameraTranslateY, this.cameraTranslateZ, cameraSinX, cameraCosX);
                rotateTriXy(this.renderTris[this.renderTrisCount], HALF_WIDTH, HALF_HEIGHT, cameraSinZ, cameraCosZ);
            }

            // TODO: Implement frustum culling
            let xzInsideFrustum = true;

            if (this.perspectiveTransform && true) {
                for (let j = 0; j < 3; j++) {
                    let centeredX = renderTri.verticesX[j] + this.cameraTranslateX - HALF_WIDTH;
                    let centeredY = renderTri.verticesY[j] + this.cameraTranslateY - HALF_HEIGHT;
                    let z = renderTri.verticesZ[j] - this.cameraTranslateZ;

                    let finalX = (centeredX / ((z / (this.zDivisor * RESOLUTION_SCALE)))) + HALF_WIDTH;
                    let finalY = (centeredY / ((z / (this.zDivisor * RESOLUTION_SCALE)))) + HALF_HEIGHT;

                    // If vertex behind clipping plane, skip triangle
                    if (z < NEAR_CLIPPING_PLANE) {
                        // if (finalX < 0 || finalX >= WIDTH || finalY < 0 || finalY >= HEIGHT) {
                        //     continue triLoop;
                        // }
                        finalX *= -1;
                        finalY *= -1;
                    }

                    renderTri.verticesX[j] = finalX | 0;
                    renderTri.verticesY[j] = finalY | 0;
                    renderTri.verticesZ[j] = z;
                }
            } else {
                for (let j = 0; j < 3; j++) {
                    renderTri.verticesX[j] = (renderTri.verticesX[j] + this.cameraTranslateX) | 0;
                    renderTri.verticesY[j] = (renderTri.verticesY[j] + this.cameraTranslateY) | 0;
                }
            }

            if (xzInsideFrustum) this.renderTrisCount++;
        }
        x += Math.PI / (144 * 4);
        x2 += Math.PI / (144);
    }

    frameDriver(time: DOMHighResTimeStamp) {
        this.frame(time);
        requestAnimationFrame(this.frameDriver.bind(this));
    }

    clearTris() {
        this.tris = new Array();
    }

    addTri(
        x0 = 0, y0 = 0, z0 = 0, u0 = 0, v0 = 0,
        x1 = 0, y1 = 0, z1 = 0, u1 = 0, v1 = 0,
        x2 = 0, y2 = 0, z2 = 0, u2 = 0, v2 = 0,

        color0 = 0,
        color1 = 0,
        color2 = 0,

        textureId = 0,
        materialId = 0,
    ) {
        this.tris.push(new Triangle(
            x0, y0, z0, u0, v0,
            x1, y1, z1, u1, v1,
            x2, y2, z2, u2, v2,

            color0,
            color1,
            color2,

            textureId,
            materialId,
        ));
    }

    addTriObject(tri: Triangle) {
        this.tris.push(tri);
    }
}

let a = 1;
let b = 0.5;

let col = 0x000000FF;

let cameraSinY = 0;
let cameraCosY = 0;
let cameraSinX = 0;
let cameraCosX = 0;
let cameraSinZ = 0;
let cameraCosZ = 0;

let movementVector = new Vec3();

let lastTime = 0;


let x = 0;
let x2 = 0;

function lerp(in0: number, in1: number, factor: number) {
    return (1 - factor) * in0 + factor * in1;
}

function lerpColor(in0: number, in1: number, factor: number) {
    const c00 = (in0 >> 24) & 0xFF;
    const c01 = (in0 >> 16) & 0xFF;
    const c02 = (in0 >> 8) & 0xFF;
    const c03 = (in0 >> 0) & 0xFF;

    const c10 = (in1 >> 24) & 0xFF;
    const c11 = (in1 >> 16) & 0xFF;
    const c12 = (in1 >> 8) & 0xFF;
    const c13 = (in1 >> 0) & 0xFF;

    return (lerp(c00, c10, factor) << 24) |
        (lerp(c01, c11, factor) << 16) |
        (lerp(c02, c12, factor) << 8) |
        (lerp(c03, c13, factor) << 0);
}

function min(in0: number, in1: number): number {
    if (in0 > in1) return in1;
    return in0;
}

function max(in0: number, in1: number): number {
    if (in1 > in0) return in1;
    return in0;
}

function abs(in0: number): number {
    if (in0 < 0) return in0 * -1;
    return in0;
}

function bounds(bMin: number, bMax: number, val: number): number {
    return max(bMin, min(bMax, val));
}

function transformTriXy(tri: Triangle, originX: number, originY: number, m0: number, m1: number, m2: number, m3: number) {
    for (let i = 0; i < 3; i++) {
        let origX = tri.verticesX[i];
        let origY = tri.verticesY[i];
        tri.verticesX[i] = originX + ((origX - originX) * m0 + (origY - originY) * m1);
        tri.verticesY[i] = originY + ((origX - originX) * m2 + (origY - originY) * m3);
    }
}

function transformTriXz(tri: Triangle, originX: number, originZ: number, m0: number, m1: number, m2: number, m3: number) {
    for (let i = 0; i < 3; i++) {
        let origX = tri.verticesX[i];
        let origZ = tri.verticesZ[i];
        tri.verticesX[i] = originX + ((origX - originX) * m0 + (origZ - originZ) * m1);
        tri.verticesZ[i] = originZ + ((origX - originX) * m2 + (origZ - originZ) * m3);
    }
}

function transformTriYz(tri: Triangle, originY: number, originZ: number, m0: number, m1: number, m2: number, m3: number) {
    for (let i = 0; i < 3; i++) {
        let origY = tri.verticesY[i];
        let origZ = tri.verticesZ[i];
        tri.verticesY[i] = originY + ((origY - originY) * m0 + (origZ - originZ) * m1);
        tri.verticesZ[i] = originZ + ((origY - originY) * m2 + (origZ - originZ) * m3);
    }
}

function rotateTriXy(tri: Triangle, originX: number, originY: number, sin: number, cos: number) {
    transformTriXy(tri, originX, originY, cos, -sin, sin, cos);
}

function rotateTriXz(tri: Triangle, originX: number, originZ: number, sin: number, cos: number) {
    transformTriXz(tri, originX, originZ, cos, -sin, sin, cos);
}

function rotateTriYz(tri: Triangle, originY: number, originZ: number, sin: number, cos: number) {
    transformTriYz(tri, originY, originZ, cos, -sin, sin, cos);
}

function transformVecXy(vec: Vec3, m0: number, m1: number, m2: number, m3: number) {
    let origX = vec.x;
    let origY = vec.y;
    vec.x = origX * m0 + origY * m1;
    vec.y = origX * m2 + origY * m3;
}

function transformVecXz(vec: Vec3, m0: number, m1: number, m2: number, m3: number) {
    let origX = vec.x;
    let origZ = vec.z;
    vec.x = origX * m0 + origZ * m1;
    vec.z = origX * m2 + origZ * m3;
}

function transformVecYz(vec: Vec3, m0: number, m1: number, m2: number, m3: number) {
    let origY = vec.y;
    let origZ = vec.z;
    vec.y = origY * m0 + origZ * m1;
    vec.z = origY * m2 + origZ * m3;
}

function rotateVecXy(vec: Vec3, sin: number, cos: number) {
    transformVecXy(vec, cos, -sin, sin, cos);
}

function rotateVecXz(vec: Vec3, sin: number, cos: number) {
    transformVecXz(vec, cos, -sin, sin, cos);
}

function rotateVecYz(vec: Vec3, sin: number, cos: number) {
    transformVecYz(vec, cos, -sin, sin, cos);
}

function toDegrees(radians: number) {
    return radians * (180 / Math.PI);
}

function toRadians(deg: number) {
    return deg * (Math.PI / 180);
}

function matrixTruncater(num: number): string {
    let trunc = 10000;
    if (num < 0) trunc = 1000;
    return r_pad((((num * trunc) | 0) / trunc).toString(), 6, "0");
}

function smoothstep(edge0: number, edge1: number, x: number) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * (3 - 2 * x);
}

function clamp(x: number, lowerlimit: number, upperlimit: number) {
    if (x < lowerlimit)
        x = lowerlimit;
    if (x > upperlimit)
        x = upperlimit;
    return x;
}

function pad(n: string, width: number, z: string) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function r_pad(n: string, width: number, z: string) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

function parseObjFile(objFile: string, xFlip: boolean, yFlip: boolean, zFlip: boolean) {
    let triangleArr: Triangle[] = [];

    console.log("Loading OBJ...");
    // console.log(objFile);

    let splitObjFile = objFile.split("\n");
    let lineIndex = 0;

    let positionArr: Vec3[] = [];
    let texCoordArr: Vec2[] = [];
    let normalArr: Vec3[] = [];

    let color = 0xFFFFFFFF;
    let colorIndex = 0;
    let materialId = 1;

    while (lineIndex < splitObjFile.length) {
        let line = splitObjFile[lineIndex++];
        let splitLine = line.split(" ");
        // console.log(line);
        let splitLineIndex = 0;

        let prefix = splitLine[splitLineIndex++];

        if (prefix == "usemtl") {
            switch (colorIndex % 3) {
                case 0: color = 0xFF0000FF; break;
                case 1: color = 0x00FF00FF; break;
                case 2: color = 0x0000FFFF; break;
            }

            colorIndex++;
            materialId++;
        }

        if (prefix == "v") {
            let x = parseFloat(splitLine[splitLineIndex++]);
            let y = parseFloat(splitLine[splitLineIndex++]);
            let z = parseFloat(splitLine[splitLineIndex++]);
            positionArr.push(new Vec3(x, y, z));

            // console.log(`parsed v: X:${x} X:${y} Z:${z}`);
        }

        if (prefix == "f") {
            let vArray: number[] = [];
            while (splitLineIndex < splitLine.length) {
                vArray.push(parseDec(splitLine[splitLineIndex++]) - 1);
            }

            let refs = [vArray[0], vArray[1], vArray[2]];
            for (let i = 1; i + 1 < vArray.length; i++) {
                refs[1] = vArray[i];
                refs[2] = vArray[i + 1];

                let tri = new Triangle();

                // console.log(materialId);

                color = 0xFFFFFFFF;

                tri.colors[0] = color;
                tri.colors[1] = color;
                tri.colors[2] = color;
                tri.materialId = materialId;
                tri.textureId = 0;
                triangleArr.push(tri);
                for (let j = 0; j < 3; j++) {
                    tri.verticesX[j] = positionArr[refs[j]].x * (xFlip ? -1 : 1);
                    tri.verticesY[j] = positionArr[refs[j]].y * (yFlip ? -1 : 1);
                    tri.verticesZ[j] = positionArr[refs[j]].z * (zFlip ? -1 : 1);
                }
            }
        }
    }

    console.log(`Finalized with ${triangleArr.length} triangles`);
    // for (let i = 0; i < triangleArr.length; i++) {
    //     let t = triangleArr[i];
    // console.log(`1 X:${t.verticesX[0]} X:${t.verticesY[0]} Z:${t.verticesZ[0]}`);
    // console.log(`2 X:${t.verticesX[1]} X:${t.verticesY[1]} Z:${t.verticesZ[1]}`);
    // console.log(`3 X:${t.verticesX[2]} X:${t.verticesY[2]} Z:${t.verticesZ[2]}`);
    // }

    return triangleArr;
}

function parseDec(input: string) {
    return parseInt(input, 10);
}

