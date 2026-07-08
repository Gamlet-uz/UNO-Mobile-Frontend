import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// BU YERGA O'ZINGIZNING FIREBASE CONFIG MA'LUMOTLARINGIZNI YOZING
const firebaseConfig = {
  apiKey: "AIzaSyAyF5AMwsuM4MqClrH4TTePJMrzSfODlPk",
  authDomain: "uno-mobile-c9ecb.firebaseapp.com",
  databaseURL: "https://uno-mobile-c9ecb-default-rtdb.firebaseio.com",
  projectId: "uno-mobile-c9ecb",
  storageBucket: "uno-mobile-c9ecb.firebasestorage.app",
  messagingSenderId: "897110000307",
  appId: "1:897110000307:web:18de5d20e33c50c9e526c6"
};

// Firebaseni ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
