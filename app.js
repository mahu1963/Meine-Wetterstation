// ---------------------------------------------------------
// Firebase Setup
// ---------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyApmjkGSrwrVlrhho77ruk7lL4gTcQAbFM",
  authDomain: "meine-wetterstation.firebaseapp.com",
  databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "meine-wetterstation",
  storageBucket: "meine-wetterstation.appspot.com",
  messagingSenderId: "593494014586",
  appId: "1:593494014586:web:cad0037363543e946059c3",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------------------------------------------------
// Offline Fallback
// ---------------------------------------------------------
function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadLocal(key) {
  return JSON.parse(localStorage.getItem(key) || "null");
}

// ---------------------------------------------------------
// Live Rendering
// ---------------------------------------------------------
function renderLive(d) {
  if (!d) return;

  // Temperatur
  document.getElementById("live-temp").textContent =
    d.temp ? d.temp.toFixed(1) : "--.-";

  // Feuchte
  document.getElementById("live-hum").textContent =
    d.humidity ? d.humidity.toFixed(0) : "--";

  // Druck
  document.getElementById("live-pres").textContent =
    d.pressure ? d.pressure.toFixed(1) : "----";

  // Zeitstempel
  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleString()
      : "Stand: --";
}

// ---------------------------------------------------------
// Firebase Listener – LIVE
// ---------------------------------------------------------
onValue(ref(db, "weather/live"), snap => {
  const d = snap.val();
  saveLocal("live", d);
  renderLive(d);
});

// Offline fallback
const offlineLive = loadLocal("live");
if (offlineLive) renderLive(offlineLive);

// ---------------------------------------------------------
// Tages-Min/Max
// ---------------------------------------------------------
function loadTodayMinMax() {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

  const minRef = ref(db, `weather/day/${key}/temp/min`);
  const maxRef = ref(db, `weather/day/${key}/temp/max`);

  onValue(minRef, snap => {
    document.getElementById("minToday").textContent =
      snap.exists() ? snap.val().toFixed(1) + "°C" : "-";
  });

  onValue(maxRef, snap => {
    document.getElementById("maxToday").textContent =
      snap.exists() ? snap.val().toFixed(1) + "°C" : "-";
  });
}

loadTodayMinMax();

// ---------------------------------------------------------
// Monats- und Jahresstatistik
// ---------------------------------------------------------
async function loadMonthYearStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = `${year}-${month}`;

  const getVal = async p => (await get(ref(db, p))).val();

  const [
    minM, maxM, sumM, countM,
    minY, maxY, sumY, countY
  ] = await Promise.all([
    getVal(`weather/month/${key}/min`),
    getVal(`weather/month/${key}/max`),
    getVal(`weather/month/${key}/sum`),
    getVal(`weather/month/${key}/count`),
    getVal(`weather/year/${year}/min`),
    getVal(`weather/year/${year}/max`),
    getVal(`weather/year/${year}/sum`),
    getVal(`weather/year/${year}/count`)
  ]);

  document.getElementById("minMonth").textContent = minM ? minM.toFixed(1) + "°C" : "-";
  document.getElementById("maxMonth").textContent = maxM ? maxM.toFixed(1) + "°C" : "-";
  document.getElementById("avgMonth").textContent =
    sumM && countM ? (sumM / countM).toFixed(1) + "°C" : "-";

  document.getElementById("minYear").textContent = minY ? minY.toFixed(1) + "°C" : "-";
  document.getElementById("maxYear").textContent = maxY ? maxY.toFixed(1) + "°C" : "-";
  document.getElementById("avgYear").textContent =
    sumY && countY ? (sumY / countY).toFixed(1) + "°C" : "-";
}

loadMonthYearStats();
