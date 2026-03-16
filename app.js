// --------------------------------------------------
// app.js – Frontend (Browser)
// --------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --------------------------------------------------
// Firebase Config
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meine-wetterstation.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.firebasestorage.app",
  messagingSenderId: "593494014586",
  appId: "1:593494014586:web:cad0037363543e946059c3",
  measurementId: "G-139QB1TEMD"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --------------------------------------------------
// LIVE-DATEN
// --------------------------------------------------
onValue(ref(db, "weather/live"), (snap) => {
  const d = snap.val();
  if (!d) return;

  document.getElementById("temp").innerText = d.temp.toFixed(1) + " °C";
  document.getElementById("hum").innerText = d.humidity + " %";
  document.getElementById("press").innerText = d.pressure + " hPa";

  const dt = new Date(d.timestamp * 1000);
  document.getElementById("time").innerText =
    dt.getHours().toString().padStart(2, "0") + ":" +
    dt.getMinutes().toString().padStart(2, "0");
});

// --------------------------------------------------
// SONNE
// --------------------------------------------------
onValue(ref(db, "weather/sun"), (snap) => {
  const d = snap.val();
  if (!d) return;

  document.getElementById("sunrise").innerText =
    new Date(d.sunrise * 1000).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });

  document.getElementById("sunset").innerText =
    new Date(d.sunset * 1000).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
});

// --------------------------------------------------
// 5-STUNDEN-VORHERSAGE
// --------------------------------------------------
onValue(ref(db, "weather/forecast/5h"), (snap) => {
  const arr = snap.val();
  if (!arr) return;

  const box = document.getElementById("forecast");
  box.innerHTML = "";

  arr.forEach(item => {
    const t = new Date(item.ts * 1000);
    const hour = t.getHours().toString().padStart(2, "0");

    box.innerHTML += `
      <div class="fc-item">
        <div>${hour}:00</div>
        <img src="https://openweathermap.org/img/wn/${item.icon}.png">
        <div>${item.temp.toFixed(1)} °C</div>
      </div>
    `;
  });
});

// --------------------------------------------------
// HISTORY → Woche / Monat / Jahr
// --------------------------------------------------
onValue(ref(db, "weather/history"), (snap) => {
  const data = snap.val();
  if (!data) return;

  const now = Date.now() / 1000;

  let week = [];
  let month = [];
  let year = [];

  for (const k in data) {
    const entry = data[k];
    const age = now - entry.ts;

    if (age <= 7 * 24 * 3600) week.push(entry.temp);
    if (age <= 30 * 24 * 3600) month.push(entry.temp);
    if (age <= 365 * 24 * 3600) year.push(entry.temp);
  }

  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length).toFixed(1) : "--.-";

  document.getElementById("avg-week").innerText = avg(week) + " °C";
  document.getElementById("avg-month").innerText = avg(month) + " °C";
  document.getElementById("avg-year").innerText = avg(year) + " °C";
});
