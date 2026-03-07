import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

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

// --------------------------------------------
// OpenWeather API
// --------------------------------------------
const API_KEY = "27602f1bbb8e3dd3587a1da6e3de24b6";
const LAT = 47.43602311386345;
const LON = 16.25550536923543;

async function updateWeather() {
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${LAT}&lon=${LON}&units=metric&lang=de&appid=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  // LIVE
  await set(ref(db, "weather/live"), {
    temperatur: data.current.temp,
    feuchtigkeit: data.current.humidity,
    druck: data.current.pressure,
    timestamp: data.current.dt,
    icon: data.current.weather[0].main.toLowerCase()
  });

  // STUNDEN (12 Stunden)
  const hours = data.hourly.slice(0, 12).map(h => ({
    timestamp: new Date(h.dt * 1000).toISOString(),
    temperatur: h.temp,
    wind: h.wind_speed,
    regen: h.rain?.["1h"] ?? 0,
    icon: h.weather[0].main.toLowerCase()
  }));

  await set(ref(db, "weather/forecast/stunden"), hours);

  // TAGE (5 Tage)
  const days = data.daily.slice(0, 5).map(d => ({
    datum: new Date(d.dt * 1000).toLocaleDateString("de-DE", { weekday: "short" }),
    t_min: d.temp.min,
    t_max: d.temp.max,
    wind: d.wind_speed,
    regen: d.rain ?? 0,
    icon: d.weather[0].main.toLowerCase()
  }));

  await set(ref(db, "weather/forecast_daily"), days);

  console.log("Wetterdaten erfolgreich aktualisiert");
}

updateWeather();
