// Firebase laden
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Deine Firebase-Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyAfIU041dyNBiCC_ywpJiwf8mABJVsT-Lw",
    authDomain: "meine-wetterstation.firebaseapp.com",
    databaseURL: "https://meine-wetterstation-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "meine-wetterstation",
    storageBucket: "meine-wetterstation.appspot.com",
    messagingSenderId: "593494014586",
    appId: "1:593494014586:web:c704ffa5baa9ae5a6059c3"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ----------------------------------------------------------
// LIVE-DATEN
// ----------------------------------------------------------

const liveRef = ref(db, "weather");

onValue(liveRef, (snap) => {
    const d = snap.val();
    if (!d) return;

    document.getElementById("temp").textContent = d.temperature.toFixed(1) + " °C";
    document.getElementById("hum").textContent  = d.humidity.toFixed(1) + " %";
    document.getElementById("pres").textContent = d.pressure.toFixed(1) + " hPa";

    const ts = new Date(d.timestamp);
    document.getElementById("time").textContent = ts.toLocaleTimeString();
});

// ----------------------------------------------------------
// HISTORY LADEN
// ----------------------------------------------------------

async function loadDay(year, month, day) {
    const path = `history/${year}/${month}/${day}`;
    const snap = await get(ref(db, path));
    if (!snap.exists()) return [];

    const raw = snap.val();
    return Object.keys(raw).map(ts => ({
        timestamp: Number(ts),
        ...raw[ts]
    }));
}

async function loadToday() {
    const d = new Date();
    return loadDay(
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    );
}

async function loadWeek() {
    const now = new Date();
    let all = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);

        const dayData = await loadDay(
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        );

        all = all.concat(dayData);
    }

    return all.sort((a, b) => a.timestamp - b.timestamp);
}

async function loadMonth() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");

    const snap = await get(ref(db, `history/${year}/${month}`));
    if (!snap.exists()) return [];

    const raw = snap.val();
    let all = [];

    Object.keys(raw).forEach(day => {
        Object.keys(raw[day]).forEach(ts => {
            all.push({
                timestamp: Number(ts),
                ...raw[day][ts]
            });
        });
    });

    return all.sort((a, b) => a.timestamp - b.timestamp);
}

// ----------------------------------------------------------
// MIN/MAX
// ----------------------------------------------------------

function calcMinMax(data) {
    if (data.length === 0) return null;

    const temps = data.map(e => e.temperature);
    const hums  = data.map(e => e.humidity);
    const pres  = data.map(e => e.pressure);

    return {
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        humMin:  Math.min(...hums),
        humMax:  Math.max(...hums),
        presMin: Math.min(...pres),
        presMax: Math.max(...pres)
    };
}

// ----------------------------------------------------------
// DIAGRAMM
// ----------------------------------------------------------

let chart = null;

function drawChart(data) {
    const labels = data.map(e =>
        new Date(e.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    );

    const temps = data.map(e => e.temperature);

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Temperatur (°C)",
                data: temps,
                borderColor: "red",
                tension: 0.2
            }]
        }
    });
}

// ----------------------------------------------------------
// CSV EXPORT
// ----------------------------------------------------------

function exportCSV() {
    if (!window.lastData) return;

    let csv = "timestamp;temperature;humidity;pressure\n";

    window.lastData.forEach(e => {
        csv += `${e.timestamp};${e.temperature};${e.humidity};${e.pressure}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "wetterstation_history.csv";
    a.click();

    URL.revokeObjectURL(url);
}

window.exportCSV = exportCSV;

// ----------------------------------------------------------
// BUTTON-FUNKTIONEN
// ----------------------------------------------------------

window.showToday = async () => {
    const data = await loadToday();
    window.lastData = data;
    drawChart(data);

    const mm = calcMinMax(data);
    document.getElementById("minmax").innerHTML =
        `Min: ${mm.tempMin} °C – Max: ${mm.tempMax} °C`;
};

window.showWeek = async () => {
    const data = await loadWeek();
    window.lastData = data;
    drawChart(data);

    const mm = calcMinMax(data);
    document.getElementById("minmax").innerHTML =
        `Min: ${mm.tempMin} °C – Max: ${mm.tempMax} °C`;
};

window.showMonth = async () => {
    const data = await loadMonth();
    window.lastData = data;
    drawChart(data);

    const mm = calcMinMax(data);
    document.getElementById("minmax").innerHTML =
        `Min: ${mm.tempMin} °C – Max: ${mm.tempMax} °C`;
};
