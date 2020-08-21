import { RTC } from "./rtc";
import { MBC } from "./mbc";

export default abstract class MBCWithRTC extends MBC {
    abstract rtc: RTC;
}