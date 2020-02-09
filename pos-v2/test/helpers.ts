export const retry = (n: number, f: () => Promise<void>) => async  () => {
    for (let i = 0; i < n; i++) {
        await f();
    }
};
