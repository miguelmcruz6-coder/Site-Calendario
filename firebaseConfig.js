import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwhRkSL85j2OW0tanDdz-1skcLjusiaeI",
  authDomain: "site-de-organizacao.firebaseapp.com",
  databaseURL: "https://site-de-organizacao-default-rtdb.firebaseio.com",
  projectId: "site-de-organizacao",
  storageBucket: "site-de-organizacao.firebasestorage.app",
  messagingSenderId: "668048761560",
  appId: "1:668048761560:web:2eb0239b99ad36cb56edad",
  measurementId: "G-Y0FL6HTBPG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const provider = new GoogleAuthProvider();

