import Cookies from "js-cookie";
import { COOKIE_EXPIRATION, NAME_COOKIE_EXPIRATION } from "types/constants";

type Cookie = "name" | "code" | "authToken";

export function getCookie(cookie: Cookie) {
    return Cookies.get(cookie);
}

export function setCookie(cookie: Cookie, value: string) {
    Cookies.set(cookie, value, {
        expires: cookie == "name" ? NAME_COOKIE_EXPIRATION : COOKIE_EXPIRATION,
        sameSite: "Strict"
    });
}
