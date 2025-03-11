type benchOpts = Required<{
    name?: string;
    setupFn: (b: Benchmark) => void;
    logEnabled?: boolean;
    logSelector?: string;
    runtimeGoalMS: number;
    this?: any;
}>;
export declare abstract class BenchSuite {
    static run2(opts?: Partial<benchOpts>, instance?: any): Promise<void>;
    run(opts?: Partial<benchOpts>): Promise<void>;
}
export declare const bench: (fn: (b: Benchmark) => any, opts?: Partial<benchOpts>) => Promise<Benchmark>;
export declare class Benchmark {
    protected _N: number;
    protected _I: number;
    protected _duration: number;
    protected benchFunc: (b: Benchmark) => any;
    protected startTime: number;
    protected timerOn: boolean;
    protected opts: benchOpts;
    get N(): number;
    get I(): number;
    get duration(): number;
    get name(): string;
    get result(): {
        name: string;
        N: {
            (locales?: string | string[], options?: Intl.NumberFormatOptions): string;
            (locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): string;
        };
        duration: {
            (locales?: string | string[], options?: Intl.NumberFormatOptions): string;
            (locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): string;
        };
    };
    constructor(fn: (b: Benchmark) => any, opts?: Partial<benchOpts>);
    StartTimer(): void;
    StopTimer(): void;
    ResetTimer(): void;
    run: () => Promise<void>;
    protected runN: (n: number) => Promise<void>;
    toString(): string;
    toStrings(): string[];
    logTable(selector?: string): void;
}
export {};
