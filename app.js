// --------------------------------------------------
// OpenWeather Icon-URL
// --------------------------------------------------
function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

// --------------------------------------------------
// Firebase
// --------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
// LIVE-DATEN (KORREKTER PFAD!)
// --------------------------------------------------
onValue(ref(db, "/weather/live"), snap => {
  const v = snap.val();
  console.log("LIVE-DATEN:", v);
  if (!v) return;

  // Temperatur
  document.getElementById("live-temp").textContent =
    v.temp != null ? v.temp.toFixed(1) : "--";

  // Feuchte
  document.getElementById("live-hum").textContent =
    v.humidity != null ? v.humidity.toFixed(0) : "--";

  // Druck
  document.getElementById("live-pres").textContent =
    v.pressure != null ? v.pressure.toFixed(1) : "--";

  // Zeitstempel
  if (v.timestamp) {
    const d = new Date(v.timestamp * 1000);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    document.getElementById("timestamp").textContent = `Stand: ${hh}:${mm}`;
  }

  // Icon
  if (v.icon) {
    document.getElementById("icon-top").src = iconUrl(v.icon);
  }
});

// --------------------------------------------------
// SONNENZEITEN
// --------------------------------------------------
onValue(ref(db, "/weather/sun"), snap => {
  const v = snap.val();
  if (!v) return;

  document.getElementById("sunrise").textContent = v.sunrise || "--:--";
  document.getElementById("sunset").textContent = v.sunset || "--:--";
});

// --------------------------------------------------
// FORECAST (5 Stunden)
// --------------------------------------------------
onValue(ref(db, "/weather/live"), snap => {
  const v = snap.val();
  if (!v) return;

  // Temperatur
  document.getElementById("live-temp").textContent =
    v.temp != null ? v.temp.toFixed(1) : "--";

  // Feuchte
  document.getElementById("live-hum").textContent =
    v.humidity != null ? v.humidity.toFixed(0) : "--";

  // Druck
  document.getElementById("live-pres").textContent =
    v.pressure != null ? v.pressure.toFixed(1) : "--";

  // Zeitstempel
  if (v.timestamp) {
    const d = new Date(v.timestamp * 1000);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    document.getElementById("timestamp").textContent = `Stand: ${hh}:${mm}`;
  }

  // Icon
  if (v.icon) {
    document.getElementById("icon-top").src = iconUrl(v.icon);
  }
});

    // Icon
    const iconEl = document.getElementById(`fc-icon-${i}`);
    if (iconEl && item.icon) {
      iconEl.src = iconUrl(item.icon);
    }
  }
});
