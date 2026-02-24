import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "xxxxxxxxxxxxxxxxxxxxx",
  authDomain: "xxxxxxxxxxxxxxxxxx",
  projectId: "xxxxxxxxxxxxxxx",
  storageBucket: "xxxxxxxxxxxxxxxxx",
  messagingSenderId: "xxxxxxxxxxxx",
  appId: "xxxxxxxxxxxxxxxxxxxxx",
  measurementId: "xxxxxxxxxx",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
