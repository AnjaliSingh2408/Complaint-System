import admin from "../config/firebase.js";

export const sendPushNotification = async (token, title, body) => {

  if (!token) return;

  const message = {
    notification: {
      title,
      body
    },
    token
  };

  await admin.messaging().send(message);
};