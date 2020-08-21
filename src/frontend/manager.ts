import { GameBoy } from "../core/gameboy";
import { GameBoyProvider } from "../core/provider";
import { Bus } from "../core/bus";
import { RTC } from "../core/mbc/rtc";
import MBCWithRTC from "../core/mbc/mbc_with_rtc";

const localforage = (window as any).localforage;

export class GameBoyManager {
    gb: GameBoy;

    skipBootrom = true;
    volume = 1;

    rtcLastUnixMillis = Date.now();
    constructor() {
        this.gb = new GameBoy(this.skipBootrom);

        setInterval(() => {
            if (this.gb.bus.mbc.sramDirty) {
                this.gb.bus.mbc.sramDirty = false;
                this.flushSram();
            }

            let mbc = this.gb.bus.mbc;
            if (mbc instanceof MBCWithRTC) {
                let now = Date.now();
                let secondsDiff = (now - this.rtcLastUnixMillis) / 1000;
                this.rtcLastUnixMillis = Date.now();
                mbc.rtc.incrementSeconds(secondsDiff);
            }

            this.flushRtc();
        }, 1000);
    }

    setVolume(volume: number) {
        this.volume = volume;
        this.updateVolume();
    }

    updateVolume() {
        this.gb.apu.player.gain.gain.value = this.volume;
    }

    flushSram() {
        console.log("Flushing SRAM...");
        let title = Bus.getTitle(this.gb.bus.rom);
        localforage.setItem(`${title}.sav`, this.gb.bus.mbc.sram);
    }

    flushRtc() {
        let mbc = this.gb.bus.mbc;
        if (mbc instanceof MBCWithRTC) {
            console.log("Flushing RTC...");
            // Store the last time RTC was updated in RTC object
            mbc.rtc.lastUnixMillis = this.rtcLastUnixMillis;
            let rtcJson = JSON.stringify(mbc.rtc);
            let title = Bus.getTitle(this.gb.bus.rom);
            localforage.setItem(`${title}.rtc`, rtcJson);
        }
    }

    romLoaded = false;

    reset() {
        let sram = new Uint8Array(this.gb.bus.mbc.sram.length);
        sram.set(this.gb.bus.mbc.sram);
        let provider = this.gb.provider;
        this.gb = new GameBoy(this.skipBootrom, provider);
        this.gb.bus.mbc.setSram(sram);
        this.updateVolume();
    }

    loadSave(save: Uint8Array) {
        this.gb.bus.mbc.setSram(save);
    }

    /**
     * 
     * Loads a ROM, resets the emulated Game Boy and attempts to load SRAM and RTC data if available.
     */
    async loadRom(rom: Uint8Array) {
        this.romLoaded = true;

        if (!localforage) alert('localForage not found!');

        let title = Bus.getTitle(rom);

        let oldBootrom = this.gb.provider?.bootrom;
        let sav = await localforage.getItem(`${title}.sav`) as Uint8Array;
        let rtc = JSON.parse(await localforage.getItem(`${title}.rtc`)) as RTC;

        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(rom, oldBootrom));

        if (!sav) {
            console.log(`Save not found for ${title}.`);
        } else {
            console.log(`Save found for ${title}, loading...`);
            this.gb.bus.mbc.setSram(sav);
        }

        if (!rtc) {
            console.log(`RTC not found for ${title}.`);
        } else {
            console.log(`RTC found for ${title}, loading...`);
            let mbc = this.gb.bus.mbc;
            if (mbc instanceof MBCWithRTC) {
                if (rtc.seconds != null)
                    mbc.rtc.seconds = rtc.seconds;
                if (rtc.minutes != null)
                    mbc.rtc.minutes = rtc.minutes;
                if (rtc.hours != null)
                    mbc.rtc.hours = rtc.hours;
                if (rtc.days != null)
                    mbc.rtc.days = rtc.days;
                if (rtc.daysOverflow != null)
                    mbc.rtc.daysOverflow = rtc.daysOverflow;
                if (rtc.halted != null)
                    mbc.rtc.halted = rtc.halted;

                // Set this so time can be caught up on next RTC update as scheduled in the constructor
                if (rtc.lastUnixMillis != null)
                    this.rtcLastUnixMillis = rtc.lastUnixMillis;
            }
        }

        this.updateVolume();
    }

    loadBootrom(bootrom: Uint8Array) {
        let oldRom = this.gb.provider?.rom ?? new Uint8Array(0);
        this.gb = new GameBoy(this.skipBootrom, new GameBoyProvider(oldRom, bootrom));
        this.updateVolume();
    }
}
