/* eslint-disable @typescript-eslint/no-empty-object-type */
/// <reference types="vite/client" />

interface MyEnv {
    VITE_APP_VERSION: string;
    VITE_SERVER_PORT: string;
    VITE_DEV_HOST: string;
    VITE_JOIN_LINK_BASE: string;
}

interface ImportMetaEnv extends Readonly<MyEnv> {}

declare module "bun" {
    interface Env extends MyEnv {}
}
