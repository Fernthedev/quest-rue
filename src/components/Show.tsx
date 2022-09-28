// https://github.com/solidjs/solid/blob/ea2c976add11b20798267c1fa218672189955ef6/packages/solid/src/render/flow.ts#L63-L102

type ReactChildren = React.ReactElement; // | React.ReactElement[];

type ShowProps<T> = {
    when: T | undefined | null | false;
    fallback?: ReactChildren | (() => ReactChildren);
} & (
    | {
          keyed?: false;
          children: ReactChildren | (() => ReactChildren);
      }
    | {
          keyed: true;
          children: ReactChildren | ((arg: T) => ReactChildren);
      }
);

export default function Show<T = void>({
    when,
    fallback,
    keyed,
    children,
}: ShowProps<T>): ReactChildren {
    const key = when;

    if (!key) {
        // Fallback
        if (fallback) {
            return typeof fallback === "function" ? fallback() : fallback;
        }

        return <></>;
    }

    // Render main
    if (typeof children === "function") {
        return keyed ? children(key) : children();
    }

    return children;
}
