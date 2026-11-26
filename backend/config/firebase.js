import 'dotenv/config';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const firebaseApp = initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const realtimeDB = getDatabase(firebaseApp);

export default realtimeDB;