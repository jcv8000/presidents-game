/* eslint-disable @typescript-eslint/no-empty-object-type */
/// <reference types="vite/client" />

interface MyEnv {
    VITE_SERVER_PORT: string;
    VITE_APP_VERSION: string;
}

interface ImportMetaEnv extends Readonly<MyEnv> {}

declare module "bun" {
    interface Env extends MyEnv {}
}
