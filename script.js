// -----------------------------------------
// Diagramm-Variablen
// -----------------------------------------
let tempChart = null;
let humidityChart = null;
let pressureChart = null;

// Min/Max Werte (Session)
let minTemp = null, maxTemp = null;
let minHumidity = null, maxHumidity = null;
let minPressure = null, maxPressure = null;

// Trend-Vergleichswerte (Session)
let lastTemp = null;
let lastHumidity = null;
let lastPressure = null;

// GitHub Raw URL für Historie
const HISTORY_URL = "https://raw.githubusercontent.com/mahu1963/Meine-Wetterstation/main/data-history.json";


// -----------------------------------------
// Universelle Chart-Erstellung
// -----------------------------------------
function createLineChart(ctx, label) {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: "#4fc3f7",
                backgroundColor: "rgba(79, 195, 247, 0.2)",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#666" }},
                y: { ticks: { color: "#666" }}
            }
        }
    });
}


// -----------------------------------------
// Alle Diagramme initialisieren
// -----------------------------------------
function initAllCharts() {
    tempChart = createLineChart(
        document.getElementById("tempChart").getContext("2d"),
        "Temperatur (°C)"
    );

    humidityChart = createLineChart(
        document.getElementById("humidityChart").getContext("2d"),
        "Luftfeuchtigkeit (%)"
    );

    pressureChart = createLineChart(
        document.getElementById("pressureChart").getContext("2d"),
        "Luftdruck (hPa)"
    );
}


// -----------------------------------------
// Daten in Diagramm pushen
// -----------------------------------------
function pushChartData(chart, value) {
    const now = new Date().toLocaleTimeString();

    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(value);

    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}


// -----------------------------------------
// Live-Daten laden (data.json)
// -----------------------------------------
async function loadLiveData() {
    try {
        const response = await fetch("data.json?cachebuster=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Fehler beim Laden der Live-Daten");

        const data = await response.json();

        // Live-Werte anzeigen
        document.getElementById("temp").textContent = data.temperature + " °C";
        document.getElementById("humidity").textContent = data.humidity + " %";
        document.getElementById("pressure").textContent = data.pressure + " hPa";

        // Min/Max (Session)
        if (minTemp === null || data.temperature < minTemp) minTemp = data.temperature;
        if (maxTemp === null || data.temperature > maxTemp) maxTemp = data.temperature;
        document.getElementById("tempMin").textContent = minTemp + " °C";
        document.getElementById("tempMax").textContent = maxTemp + " °C";

        if (minHumidity === null || data.humidity < minHumidity) minHumidity = data.humidity;
        if (maxHumidity === null || data.humidity > maxHumidity) maxHumidity = data.humidity;
        document.getElementById("humidityMin").textContent = minHumidity + " %";
        document.getElementById("humidityMax").textContent = maxHumidity + " %";

        if (minPressure === null || data.pressure < minPressure) minPressure = data.pressure;
        if (maxPressure === null || data.pressure > maxPressure) maxPressure = data.pressure;
        document.getElementById("pressureMin").textContent = minPressure + " hPa";
        document.getElementById("pressureMax").textContent = maxPressure + " hPa";

        // Trendpfeile
        document.getElementById("tempTrend").textContent =
            lastTemp === null ? "→" :
            data.temperature > lastTemp ? "↑" :
            data.temperature < lastTemp ? "↓" : "→";

        document.getElementById("humidityTrend").textContent =
            lastHumidity === null ? "→" :
            data.humidity > lastHumidity ? "↑" :
            data.humidity < lastHumidity ? "↓" : "→";

        document.getElementById("pressureTrend").textContent =
            lastPressure === null ? "→" :
            data.pressure > lastPressure ? "↑" :
            data.pressure < lastPressure ? "↓" : "→";

        lastTemp = data.temperature;
        lastHumidity = data.humidity;
        lastPressure = data.pressure;

        // Live-Diagramme
        pushChartData(tempChart, data.temperature);
        pushChartData(humidityChart, data.humidity);
        pushChartData(pressureChart, data.pressure);

        const now = new Date();
        document.getElementById("lastUpdate").textContent =
            "Zuletzt aktualisiert: " +
            now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    } catch (err) {
        console.error(err);
        document.getElementById("lastUpdate").textContent = "Fehler beim Laden der Live-Daten";
    }
}


// -----------------------------------------
// Historie laden (data-history.json von GitHub)
// -----------------------------------------
async function loadHistory() {
    try {
        const response = await fetch(HISTORY_URL + "?cachebuster=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Fehler beim Laden der Historie");

        const history = await response.json(); // Array von Einträgen

        updateDayAndWeekStats(history);

    } catch (err) {
        console.error(err);
        document.getElementById("dayStats").textContent = "Fehler beim Laden der Tagesstatistik";
        document.getElementById("weekStats").textContent = "Fehler beim Laden der Wochenstatistik";
    }
}


// -----------------------------------------
// Tages- und Wochenstatistik berechnen
// -----------------------------------------
function updateDayAndWeekStats(history) {
    const now = Date.now();
    const dayCutoff = now - 24 * 60 * 60 * 1000;
    const weekCutoff = now - 7 * 24 * 60 * 60 * 1000;

    const dayData = history.filter(e => e.time >= dayCutoff);
    const weekData = history.filter(e => e.time >= weekCutoff);

    const dayStats = calcStats(dayData);
    const weekStats = calcStats(weekData);

    if (dayStats) {
        document.getElementById("dayStats").innerHTML =
            `Temp: ${dayStats.tempMin}–${dayStats.tempMax} °C (Ø ${dayStats.tempAvg} °C)<br>` +
            `Feuchte: ${dayStats.humMin}–${dayStats.humMax} % (Ø ${dayStats.humAvg} %)<br>` +
            `Druck: ${dayStats.presMin}–${dayStats.presMax} hPa (Ø ${dayStats.presAvg} hPa)`;
    } else {
        document.getElementById("dayStats").textContent = "Noch keine Daten für die letzten 24 Stunden.";
    }

    if (weekStats) {
        document.getElementById("weekStats").innerHTML =
            `Temp: ${weekStats.tempMin}–${weekStats.tempMax} °C (Ø ${weekStats.tempAvg} °C)<br>` +
            `Feuchte: ${weekStats.humMin}–${weekStats.humMax} % (Ø ${weekStats.humAvg} %)<br>` +
            `Druck: ${weekStats.presMin}–${weekStats.presMax} hPa (Ø ${weekStats.presAvg} hPa)`;
    } else {
        document.getElementById("weekStats").textContent = "Noch keine Daten für die letzten 7 Tage.";
    }
}


function calcStats(data) {
    if (!data || data.length === 0) return null;

    const temps = data.map(e => e.temperature);
    const hums = data.map(e => e.humidity);
    const pres = data.map(e => e.pressure);

    const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);

    return {
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        tempAvg: avg(temps),
        humMin: Math.min(...hums),
        humMax: Math.max(...hums),
        humAvg: avg(hums),
        presMin: Math.min(...pres),
        presMax: Math.max(...pres),
        presAvg: avg(pres)
    };
}


// -----------------------------------------
// Dark Mode
// -----------------------------------------
function updateChartColors() {
    const isDark = document.body.classList.contains("dark");
    const charts = [tempChart, humidityChart, pressureChart];

    charts.forEach(chart => {
        if (!chart) return;

        chart.options.scales.x.ticks.color = isDark ? "#ccc" : "#666";
        chart.options.scales.y.ticks.color = isDark ? "#ccc" : "#666";

        chart.update();
    });
}

function applyDarkMode(isDark, darkToggle) {
    if (isDark) {
        document.body.classList.add("dark");
        darkToggle.checked = true;
    } else {
        document.body.classList.remove("dark");
        darkToggle.checked = false;
    }

    localStorage.setItem("darkmode", isDark ? "1" : "0");
    updateChartColors();
}


// -----------------------------------------
// Start erst, wenn DOM vollständig geladen ist
// -----------------------------------------
window.addEventListener("DOMContentLoaded", () => {

    const darkToggle = document.getElementById("darkToggle");

    darkToggle.addEventListener("change", () => {
        applyDarkMode(darkToggle.checked, darkToggle);
    });

    const saved = localStorage.getItem("darkmode");
    if (saved === "1") {
        applyDarkMode(true, darkToggle);
    } else if (saved === "0") {
        applyDarkMode(false, darkToggle);
    } else {
        applyDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches, darkToggle);
    }

    initAllCharts();
    updateChartColors();

    loadLiveData();
    loadHistory();

    setInterval(loadLiveData, 5000);
    setInterval(loadHistory, 5 * 60 * 1000);
});
