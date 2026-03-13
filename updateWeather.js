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
  await update(ref(db, "weather/openweather/raw"), {
    test: "OK",
    weather: [{ icon: "01d" }]
  });

  console.log("RAW TEST geschrieben!");
}
