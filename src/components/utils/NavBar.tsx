import { MouseEventHandler, useState } from "react";
import Show from "./Show";

export interface NavButtonProps {
    label?: string;
    icon?: JSX.Element;
    onPress?: MouseEventHandler<HTMLButtonElement> | undefined;
    children: React.ReactElement;
}

export interface NavBarProps {
    active: number;
    children: React.ReactElement<NavButtonProps>[];
}

export function NavButton(props: NavButtonProps) {
    return props.children
}

export default function NavBar(props: NavBarProps) {
    // TODO: Animate selection switch
    const [activeStateful, setActiveStateful] = useState(props.active);
    const page = props.children[activeStateful].props.children;

    return (
        <>
            <div
                className="btm-nav btm-nav-sm"
                style={{
                    width: "20rem",
                    position: "static",
                    marginBottom: "1rem"
                }}
            >
                {props.children.map((navButton, i) => (
                    <button
                        className={activeStateful === i ? "active" : undefined}
                        key={i}
                        onClick={(e) => {
                            setActiveStateful(i);
                            navButton.props.onPress?.(e);
                        }}
                    >
                        {navButton.props.icon}

                        <Show when={navButton.props.label} keyed>
                            <span className="btm-nav-label">
                                {navButton.props.label}
                            </span>
                        </Show>
                    </button>
                ))}
            </div>

            {page}
        </>
    );
}
