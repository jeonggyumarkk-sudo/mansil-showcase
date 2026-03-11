import type { Config } from "tailwindcss";
import { mansilPreset } from "@mansil/ui/tailwind.config";

const config: Config = {
    presets: [mansilPreset],
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
export default config;
