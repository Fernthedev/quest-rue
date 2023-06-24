/// <reference types="vite/client" />
interface ImportMetaEnv {
  VITE_QUEST_PORT: string | undefined;
  VITE_QUEST_IP: string | undefined;
  readonly VITE_USE_QUEST_MOCK: string | undefined;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
