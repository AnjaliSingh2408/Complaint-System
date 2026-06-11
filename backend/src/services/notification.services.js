import admin from "firebase-admin";

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