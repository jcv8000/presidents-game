import { escape } from "validator";

export function sanitize<T extends Record<string, string>>(input: T) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitized = structuredClone<any>(input);

    for (const [key, value] of Object.entries(input)) {
        if (typeof value === "string") sanitized[key] = escape(value);
    }

    return sanitized as T;
}
