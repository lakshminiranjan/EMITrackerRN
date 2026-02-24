import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNnCCSNDfy6a45WaMAW37IKd5DeJ16vzc",
  authDomain: "emimobiletracker.firebaseapp.com",
  projectId: "emimobiletracker",
  storageBucket: "emimobiletracker.firebasestorage.app",
  messagingSenderId: "1061024235190",
  appId: "1:1061024235190:web:e5194802d11472d4f6f017",
  measurementId: "G-TN875FTJSD",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);