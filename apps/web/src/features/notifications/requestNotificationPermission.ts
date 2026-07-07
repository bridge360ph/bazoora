export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}