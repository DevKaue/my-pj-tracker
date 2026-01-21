import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp(
        projectId && clientEmail && privateKey
          ? { credential: admin.credential.cert({ projectId, clientEmail, privateKey }) }
          : { credential: admin.credential.applicationDefault() }
      );

export const firestore = admin.firestore(app);
export const auth = admin.auth(app);
