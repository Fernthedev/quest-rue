/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_USE_QUEST_MOCK: boolean | undefined
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}