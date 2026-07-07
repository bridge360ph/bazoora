  import { getToken } from "firebase/messaging";
  import { firebaseMessaging } from "./firebaseMessaging";

  export async function getNotificationToken(): Promise<string | null> {
    try {
      return await getToken(firebaseMessaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
    } catch (err) {
      console.error("Failed to get FCM token", err);

      return null;
    }
  }