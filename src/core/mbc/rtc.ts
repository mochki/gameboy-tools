export class RTC {
    seconds = 0;
    getSeconds(): number {
        return Math.floor(this.seconds);
    }
    setSeconds(s: number): number {
        return this.seconds = s;
    }
    minutes = 0;
    hours = 0;
    days = 0;

    daysOverflow = false;
    halted = false;

    lastUnixMillis = Date.now();

    incrementSeconds(s: number) {
        if (!this.halted) {

            this.seconds += s;

            while (this.seconds >= 60) {
                this.seconds -= 60;
                this.minutes++;
            }

            while (this.minutes >= 60) {
                this.minutes -= 60;
                this.hours++;
            }

            while (this.hours >= 24) {
                this.hours -= 24;
                this.days++;
            }

            if (this.days >= 512) {
                this.days = 0;
                this.daysOverflow = true;
            }
        }
    }
}