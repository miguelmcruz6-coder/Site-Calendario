import {
  addReminder,
  observeAuth,
  loginGoogle,
  loginAnon,
  loginEmail,
  registerEmail,
  logout
} from "./crud.js";

window.loginGoogle = loginGoogle;
window.loginAnon = loginAnon;
window.loginEmail = loginEmail;
window.registerEmail = registerEmail;
window.logout = logout;

let selectedDate = null;

// ===== AUTH UI CONTROL =====
observeAuth((user) => {
  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");

  if (user) {
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");
    renderCalendar();
  } else {
    loginScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

// ===== CALENDAR =====
function renderCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  for (let i = 1; i <= 30; i++) {
    const div = document.createElement("div");
    div.className = "day";
    div.innerText = i;
    div.onclick = () => openModal(i);
    calendar.appendChild(div);
  }
}

function openModal(day) {
  selectedDate = day;
  document.getElementById("modal").classList.remove("hidden");
}

window.saveReminder = function () {
  const text = document.getElementById("reminderText").value;
  addReminder(selectedDate, text);
  document.getElementById("modal").classList.add("hidden");
};
