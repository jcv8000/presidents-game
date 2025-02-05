import { notifications } from "@mantine/notifications";

export function showErrorNotification(props: { title?: string; message?: string }) {
    const { title, message } = props;
    if (message) {
        notifications.show({
            title: title || "Error",
            message: message,
            withCloseButton: true,
            withBorder: true,
            color: "red",
            autoClose: 10_000
        });
    }
}

export function showGameNotification(message: string) {
    notifications.show({
        message: message,
        withCloseButton: true,
        withBorder: true,
        autoClose: 3_000
    });
}
