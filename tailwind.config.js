/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
        extend: {},
    },
    daisyui: {
        themes: [
            {
                light: {
                    ...require("daisyui/src/theming/themes")[
                        "[data-theme=light]"
                    ],
                    primary: "#1d4ed8",
                    // "primary-focus": "mediumblue",
                },
                dark: {
                    ...require("daisyui/src/theming/themes")[
                        "[data-theme=dark]"
                    ],
                    primary: "#1d4ed8", // blue-700
                    // "primary-focus": "mediumblue",
                },
            },
        ],
    },
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    plugins: [require("daisyui"), require("@tailwindcss/typography")],
};
