export function setIntervalWithEnd(opts: {
    func: () => void;
    conditionToEnd: () => boolean;
    interval: number;
    callback: () => void;
}) {
    let over = false;
    const interval = setInterval(() => {
        if (over) {
            clearInterval(interval);
            return;
        }

        opts.func();

        if (opts.conditionToEnd() === true) {
            over = true;
            opts.callback();
        }
    }, opts.interval);
}
