import { db, auth } from "./firebaseConfig.js";
import { ref, push, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function loginGoogle() {
  signInWithPopup(auth, provider).catch(alert);
}

export function loginAnon() {
  signInAnonymously(auth).catch(alert);
}

export function loginEmail() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, pass).catch(alert);
}

export function registerEmail() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, pass).catch(alert);
}

export function logout() {
  auth.signOut();
}

export function observeAuth(callback) {
  onAuthStateChanged(auth, callback);
}


export async function addReminder(date, text) {
  const user = auth.currentUser;
  if (!user) return alert("Não logado");

  const snapshot = await get(child(ref(db), `reminders/${user.uid}/${date}`));
  const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;

  const isAnon = user.isAnonymous;
  const isPremium = !isAnon && false; // ajustar depois com banco

  if (!isPremium && count >= 4) {
    alert("Limite de 4 lembretes no plano grátis!");
    return;
  }

  push(ref(db, `reminders/${user.uid}/${date}`), {
    text,
    createdAt: Date.now()
  });
}
