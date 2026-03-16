// --------------------------------------------------
// updateWeather.js – Node Backend
// --------------------------------------------------

import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

// --------------------------------------------------
// Firebase Config (gleich wie im Frontend)
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
// OpenWeather API
// --------------------------------------------------
const API_KEY = "27602f1bbb8e3dd3587a1da6e3de24b6";
const LAT = 47.402;   // Beispiel Koordinaten
const LON = 16.260;

// --------------------------------------------------
// Wetter abrufen
// --------------------------------------------------
async function updateWeather() {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&lang=de&appid=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  // LIVE-Daten (erstes Element)
  const live = data.list[0];
  const now = Math.floor(Date.now() / 1000);

  await set(ref(db, "weather/live"), {
    temp: live.main.temp,
    humidity: live.main.humidity,
    pressure: live.main.pressure,
    timestamp: now
  });

  // SUN
  await set(ref(db, "weather/sun"), {
    sunrise: data.city.sunrise,
    sunset: data.city.sunset
  });

  // FORECAST (5 Stunden)
  const fc = data.list.slice(0, 5).map(item => ({
    ts: item.dt,
    temp: item.main.temp,
    icon: item.weather[0].icon
  }));

  await set(ref(db, "weather/forecast/5h"), fc);

  // HISTORY (jede Ausführung ein Eintrag)
  await push(ref(db, "weather/history"), {
    ts: now,
    temp: live.main.temp
  });

  console.log("Firebase komplett aktualisiert!");
}

updateWeather();
