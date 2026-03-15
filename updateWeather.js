import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, child } from "firebase/database";

// --------------------------------------------------
// Firebase
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meinewetterstation.firebaseapp.com",
  databaseURL: "https://meinewetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meinewetterstation",
  storageBucket: "meinewetterstation.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
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
// 1. Forecast (5 Stunden)
// --------------------------------------------------
async function updateForecast() {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=de`;
  const fc = await fetch(url).then(r => r.json());

  const next5 = fc.list.slice(0, 5).map(item => ({
    ts: item.dt,
    temp: item.main.temp,
    icon: item.weather[0].icon
  }));

  await update(ref(db, "weather/forecast"), {
    "5h": next5
  });

  console.log("5h-Vorhersage aktualisiert!");
}

// --------------------------------------------------
// 2. History-Arrays (week, month, year)
// --------------------------------------------------
async function updateHistoryArrays() {
  const snap = await get(child(ref(db), "weather/history"));
  const hist = snap.val() || {};

  const entries = Object.entries(hist)
    .filter(([key]) => !isNaN(key)) // nur echte Timestamps
    .sort(([a], [b]) => Number(a) - Number(b));

  const week = entries.slice(-7).map(([ts, v]) => ({
    ts: Number(ts),
    temp: v.temp
  }));

  const month = entries.slice(-30).map(([ts, v]) => ({
    ts: Number(ts),
    temp: v.temp
  }));

  const year = entries.slice(-365).map(([ts, v]) => ({
    ts: Number(ts),
    temp: v.temp
  }));

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

  console.log("OpenWeather OK:", ow.weather[0].description);

  // LIVE
  await update(ref(db, "weather/live"), {
    temp: ow.main.temp,
    humidity: ow.main.humidity,
    pressure: ow.main.pressure,
    icon: ow.weather[0].icon,
    timestamp: Math.floor(Date.now() / 1000)
  });

  // SUN
  await update(ref(db, "weather/sun"), {
    sunrise: ow.sys.sunrise,
    sunset: ow.sys.sunset
  });

  // HISTORY
  const ts = Math.floor(Date.now() / 1000);
  await update(ref(db, "weather/history/" + ts), {
    ts,
    temp: ow.main.temp
  });

  // FORECAST HIER AUFRUFEN
  await updateForecast();

  console.log("Firebase komplett aktualisiert!");
}
// --------------------------------------------------
// START
// --------------------------------------------------
updateWeather();
