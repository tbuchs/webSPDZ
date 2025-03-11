export declare const withTimeout: typeof withTimeout_callback;
export declare function withTimeout_callback<T>(promise: Promise<T>, ms?: number, rejectValue?: T | undefined): Promise<T | undefined>;
export declare function withTimeout_race<T>(promise: Promise<T>, ms?: number, rejectValue?: T | undefined): Promise<T | undefined>;
