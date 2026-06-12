import admin from "firebase-admin";

const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountVar) {
  console.error("Critical Error: FIREBASE_SERVICE_ACCOUNT environment variable is missing!");
  process.exit(1); 
}

const serviceAccount = JSON.parse(serviceAccountVar);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;