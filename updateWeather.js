import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";

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
  console.log("Hole OpenWeather...");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
  const ow = await fetch(url).then(r => r.json());

  console.log("OpenWeather OK:", ow.weather[0].description);

  // LIVE-DATEN
  await update(ref(db, "weather/live"), {
    temp: ow.main.temp,
    humidity: ow.main.humidity,
    pressure: ow.main.pressure,
    icon: ow.weather[0].icon,
    timestamp: Math.floor(Date.now() / 1000)
  });

  // ROHDATEN
  await update(ref(db, "weather/openweather/raw"), ow);

  // SONNE
  await update(ref(db, "weather/sun"), {
    sunrise: ow.sys.sunrise,
    sunset: ow.sys.sunset
  });

  console.log("Firebase aktualisiert!");
}
