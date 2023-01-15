/// <reference types="vite/client" />
interface ImportMetaEnv {
    VITE_QUEST_PORT: string;
    VITE_QUEST_IP: string;
    readonly VITE_USE_QUEST_MOCK: boolean | undefined;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
