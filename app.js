// --------------------------------------------------
// OpenWeather Icon-URL
// --------------------------------------------------
function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, child } from "firebase/database";

// --------------------------------------------------
// Firebase
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meine-wetterstation-default-rtdb.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --------------------------------------------------
// OpenWeather API
// --------------------------------------------------
const API_KEY = "27602f1bbb8e3dd3587a1da6e3de24b6";
const LAT = 47.43602311386345;
const LON = 16.25550536923543;

// --------------------------------------------------
// 1. 5‑Stunden‑Vorhersage (Frontend erwartet: /weather/forecast/5h)
// --------------------------------------------------
async function updateForecast() {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=de`;
  const fc = await fetch(url).then(r => r.json());

  const next5 = fc.list.slice(0, 5).map(item => ({
    time: item.dt,
    temp: item.main.temp,
    icon: item.weather[0].icon
  }));

  await update(ref(db, "weather/forecast"), {
    "5h": next5
  });

  console.log("5h-Vorhersage aktualisiert!");
}

// --------------------------------------------------
// 2. History in drei fertige Arrays umwandeln
// --------------------------------------------------
async function updateHistoryArrays() {
  const snap = await get(child(ref(db), "weather/history"));
  const hist = snap.val() || {};

  const entries = Object.entries(hist)
    .sort(([a], [b]) => (a > b ? 1 : -1));

  const week = entries.slice(-7).map(([ts, v]) => ({ temp: v.temp }));
  const month = entries.slice(-30).map(([ts, v]) => ({ temp: v.temp }));
  const year = entries.slice(-365).map(([ts, v]) => ({ temp: v.temp }));

  await update(ref(db, "weather/history"), {
    week,
    month,
    year
  });

  console.log("History-Arrays aktualisiert!");
}

// --------------------------------------------------
// 3. Hauptfunktion
// --------------------------------------------------
async function updateWeather() {
  console.log("Hole OpenWeather...");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=de`;
  const ow = await fetch(url).then(r => r.json());

  // LIVE-DATEN
  await update(ref(db, "weather/live"), {
    temp: ow.main.temp,
    humidity: ow.main.humidity,
    pressure: ow.main.pressure,
    icon: ow.weather[0].icon,
    timestamp: Math.floor(Date.now() / 1000)
  });

  // HISTORY (Tageswert speichern)
  const today = Math.floor(Date.now() / 1000);
  await update(ref(db, "weather/history/" + today), {
    temp: ow.main.temp
  });

  // VORHERSAGE
  await updateForecast();

  // HISTORY-ARRAYS (Woche/Monat/Jahr)
  await updateHistoryArrays();

  console.log("Alles aktualisiert!");
}

// --------------------------------------------------
// START
// --------------------------------------------------
updateWeather();
// --------------------------------------------------
// CHARTS
// --------------------------------------------------
function updateChart(canvasId, data, label) {
  if (!data) return;

  const timestamps = Object.keys(data).sort();
  const labels = timestamps.map(ts =>
    new Date(ts * 1000).toLocaleDateString()
  );
  const temps = timestamps.map(ts => data[ts].temp);

  new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: temps,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { maxRotation: 0, minRotation: 0 } }
      }
    }
  });
}
