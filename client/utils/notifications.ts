import { notifications } from "@mantine/notifications";

export function showErrorNotification(props: { title?: string; message?: string }) {
    const { title, message } = props;
    notifications.show({
        title: title || "Error",
        message: message,
        withCloseButton: true,
        withBorder: true,
        color: "red",
        autoClose: 10_000
    });
}
