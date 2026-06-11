import admin from "firebase-admin";
import serviceAccount from "../config/firebase-service-account.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendPushNotification = async (
  token,
  title,
  body
) => {
  if (!token) return;

  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body
      }
    });

    console.log("Push notification sent");
  } catch (err) {
    console.log(err.message);
  }
};