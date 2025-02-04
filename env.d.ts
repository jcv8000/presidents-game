/* eslint-disable @typescript-eslint/no-empty-object-type */
/// <reference types="vite/client" />

interface MyEnv {
    VITE_SERVER_PORT: string;
    VITE_DEV_HOST: string;
    VITE_CLIENT_API_HASH: string;
}

interface ImportMetaEnv extends Readonly<MyEnv> {}

declare module "bun" {
    interface Env extends MyEnv {}
}
