import { DependencyList, useEffect, useRef } from "react";

export function useEffectAsync(
    func: () => Promise<undefined | (() => void)>,
    deps?: DependencyList,
    error?: (reason: any) => void
) {
    const unregister = useRef<(() => void) | undefined>(undefined);

    return useEffect(() => {
        func()
            .then((l) => (unregister.current = l))
            .catch(
                (e) =>
                    (error && error(e)) ||
                    console.error(`Caught error in useEffectAsync(): ${e}`)
            );

        return () => {
            if (unregister.current) unregister.current();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

export function uniqueNumber(min = 0, max = Number.MAX_SAFE_INTEGER) {
    return Math.floor(Math.random() * max + min);
}
