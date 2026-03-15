import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";

// --------------------------------------------------
// Firebase Config
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "meine-wetterstation.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.appspot.com",
  messagingSenderId: "DEINE_ID",
  appId: "DEINE_APP_ID"
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
// Forecast holen und in Firebase schreiben
// --------------------------------------------------
async function updateForecast() {
  try {
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

    console.log("Forecast aktualisiert!");
  } catch (err) {
    console.error("Forecast Fehler:", err);
  }
}

// --------------------------------------------------
// Wetterdaten holen und in Firebase schreiben
// --------------------------------------------------
async function updateWeather() {
  try {
    console.log("Hole OpenWeather...");

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=de`;
    const ow = await fetch(url).then(r => r.json());

    console.log("OpenWeather OK:", ow.weather[0].description);

    const ts = Math.floor(Date.now() / 1000);

    // LIVE
    await update(ref(db, "weather/live"), {
      temp: ow.main.temp,
      humidity: ow.main.humidity,
      pressure: ow.main.pressure,
      icon: ow.weather[0].icon,
      timestamp: ts
    });

    // SUN
    await update(ref(db, "weather/sun"), {
      sunrise: ow.sys.sunrise,
      sunset: ow.sys.sunset
    });

    // HISTORY
    await update(ref(db, "weather/history/" + ts), {
      ts,
      temp: ow.main.temp
    });

    console.log("Live + Sun + History aktualisiert!");

    // FORECAST
    await updateForecast();

    console.log("Firebase komplett aktualisiert!");
  } catch (err) {
    console.error("Fehler beim Aktualisieren:", err);
  }
}

// --------------------------------------------------
// Script starten
// --------------------------------------------------
updateWeather();
