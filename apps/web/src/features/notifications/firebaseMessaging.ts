import { getMessaging } from "firebase/messaging";
import { firebaseApp } from "./firebaseApp";

export const firebaseMessaging = getMessaging(firebaseApp);