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
// OpenWeather Icon Loader  ⭐ HIER EINGEFÜGT
// ---------------------------------------------------------
async function loadOpenWeatherIcon() {
  const apiKey = "27602f1bbb8e3dd3587a1da6e3de24b6"; // HIER deinen OpenWeather API-Key eintragen
  const lat = 47.4;  // Deine Koordinaten
  const lon = 16.2;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const iconCode = data.weather[0].icon; // z.B. "10d"
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    document.getElementById("live-icon").innerHTML =
      `<img src="${iconUrl}" style="width:90px;height:90px;">`;

  } catch (err) {
    console.error("Fehler beim Laden des OpenWeather-Icons:", err);
  }
}

// ---------------------------------------------------------
// Live Rendering
// ---------------------------------------------------------
function renderLive(d) {
  if (!d) return;

  document.getElementById("live-temp").textContent =
    d.temp ? d.temp.toFixed(1) : "--.-";

  document.getElementById("live-hum").textContent =
    d.humidity ? d.humidity.toFixed(0) : "--";

  document.getElementById("live-pres").textContent =
    d.pressure ? d.pressure.toFixed(1) : "----";

  document.getElementById("timestamp").textContent =
    d.timestamp
      ? "Stand: " + new Date(d.timestamp * 1000).toLocaleString()
      : "Stand: --";

  // ⭐ OpenWeather Icon laden
  loadOpenWeatherIcon();
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

// ---------------------------------------------------------
// History (Woche) laden und Diagramm anzeigen
// ---------------------------------------------------------
async function loadWeekHistory() {
  const weekRef = ref(db, "weather/history/week");

  onValue(weekRef, snap => {
    if (!snap.exists()) return;

    const data = snap.val();
    const labels = [];
    const temps = [];

    // Einträge sortieren (Firebase push keys sind unsortiert)
    const entries = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);

    entries.forEach(entry => {
      const date = new Date(entry.timestamp * 1000);
      labels.push(date.toLocaleString());
      temps.push(entry.temp);
    });

    drawWeekChart(labels, temps);
  });
}

let weekChart = null;

function drawWeekChart(labels, temps) {
  const ctx = document.getElementById("chartWeek").getContext("2d");

  if (weekChart) weekChart.destroy();

  weekChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperatur (°C)",
        data: temps,
        borderColor: "#ff6600",
        backgroundColor: "rgba(255, 102, 0, 0.2)",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true },
        y: { display: true }
      }
    }
  });
}

// Starten
loadWeekHistory();
