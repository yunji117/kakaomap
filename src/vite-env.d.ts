/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_CLIENT_ID: string;
  readonly VITE_KAKAO_API_KEY: string;
  readonly VITE_VWORLD_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
