// -----------------------------
// Konfiguration
// -----------------------------
const LIVE_URL = "data.json";
const HISTORY_URL = "https://raw.githubusercontent.com/mahu1963/Meine-Wetterstation/main/data-history.json";

// Charts
let tempChart, humChart, presChart;

// Merker für aktuellen Modus je Kategorie
let tempMode = "temp-live";
let humMode = "hum-live";
let presMode = "pres-live";

// Historie im Speicher
let historyData = [];


// -----------------------------
// Hilfsfunktionen
// -----------------------------
function createLineChart(ctx, label, color = "#4fc3f7") {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label,
                data: [],
                borderColor: color,
                backgroundColor: "rgba(79, 195, 247, 0.15)",
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#666" } },
                y: { ticks: { color: "#666" } }
            }
        }
    });
}

function filterHistory(history, days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter(e => e.time >= cutoff);
}

function smooth(values, windowSize = 4) {
    if (!values || values.length === 0) return [];
    return values.map((v, i, arr) => {
        const start = Math.max(0, i - windowSize);
        const end = Math.min(arr.length, i + windowSize);
        const slice = arr.slice(start, end);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
}

function aggregateByMonth(history, key) {
    const months = Array.from({ length: 12 }, () => []);
    history.forEach(e => {
        const m = new Date(e.time).getMonth();
        months[m].push(e[key]);
    });
    return months.map(arr =>
        arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null
    );
}


// -----------------------------
// Live-Daten laden
// -----------------------------
async function loadLiveData() {
    try {
        const res = await fetch(LIVE_URL + "?cb=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("Live-Daten Fehler");
        const data = await res.json();

        // Nur Live-Modus aktualisiert die Charts mit Live-Daten
        if (tempMode === "temp-live") {
            updateLiveChart(tempChart, data.temperature, "°C");
        }
        if (humMode === "hum-live") {
            updateLiveChart(humChart, data.humidity, "%");
        }
        if (presMode === "pres-live") {
            updateLiveChart(presChart, data.pressure, "hPa");
        }

    } catch (e) {
        console.error("Fehler Live-Daten:", e);
    }
}

function updateLiveChart(chart, value, unit) {
    const now = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(value);

    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}


// -----------------------------
// Historie laden
// -----------------------------
async function loadHistory() {
    try {
        const res = await fetch(HISTORY_URL + "?cb=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("Historie Fehler");
        const data = await res.json();
        historyData = data;

        // Nach Laden der Historie alle Modi neu zeichnen
        updateAllFromModes();

    } catch (e) {
        console.error("Fehler Historie:", e);
    }
}


// -----------------------------
// Temperatur-Modi
// -----------------------------
function updateTempChart() {
    if (!historyData || historyData.length === 0) return;

    if (tempMode === "temp-live") {
        // Live wird durch loadLiveData() gefüttert
        return;
    }

    let labels = [];
    let valuesTemp = [];
    let valuesHum = [];
    let valuesPres = [];

    if (tempMode === "temp-week") {
        const week = filterHistory(historyData, 7);
        labels = week.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { weekday: "short" })
        );
        valuesTemp = week.map(e => e.temperature);
    }

    if (tempMode === "temp-month") {
        const month = filterHistory(historyData, 30);
        labels = month.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
        );
        valuesTemp = month.map(e => e.temperature);
    }

    if (tempMode === "temp-year") {
        const yearAgg = aggregateByMonth(historyData, "temperature");
        labels = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
        valuesTemp = yearAgg;
    }

    if (tempMode === "temp-day") {
        const day = filterHistory(historyData, 1);
        labels = day.map(e =>
            new Date(e.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        );
        const temps = day.map(e => e.temperature);
        valuesTemp = smooth(temps, 4);
    }

    if (tempMode === "temp-combined") {
        const week = filterHistory(historyData, 7);
        labels = week.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { weekday: "short" })
        );
        valuesTemp = week.map(e => e.temperature);
        valuesHum = week.map(e => e.humidity);
        valuesPres = week.map(e => e.pressure);

        tempChart.data.labels = labels;
        tempChart.data.datasets = [
            {
                label: "Temperatur (°C)",
                data: valuesTemp,
                borderColor: "#ff5252",
                backgroundColor: "rgba(255,82,82,0.15)",
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0
            },
            {
                label: "Feuchtigkeit (%)",
                data: valuesHum,
                borderColor: "#4fc3f7",
                backgroundColor: "rgba(79,195,247,0.10)",
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0
            },
            {
                label: "Luftdruck (hPa)",
                data: valuesPres,
                borderColor: "#81c784",
                backgroundColor: "rgba(129,199,132,0.10)",
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0
            }
        ];
        tempChart.update();
        return;
    }

    // Standard: nur Temperatur
    tempChart.data.labels = labels;
    tempChart.data.datasets = [{
        label: "Temperatur (°C)",
        data: valuesTemp,
        borderColor: "#ffb74d",
        backgroundColor: "rgba(255,183,77,0.15)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0
    }];
    tempChart.update();
}


// -----------------------------
// Feuchtigkeits-Modi
// -----------------------------
function updateHumChart() {
    if (!historyData || historyData.length === 0) return;

    if (humMode === "hum-live") {
        return;
    }

    let labels = [];
    let values = [];

    if (humMode === "hum-week") {
        const week = filterHistory(historyData, 7);
        labels = week.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { weekday: "short" })
        );
        values = week.map(e => e.humidity);
    }

    if (humMode === "hum-month") {
        const month = filterHistory(historyData, 30);
        labels = month.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
        );
        values = month.map(e => e.humidity);
    }

    if (humMode === "hum-year") {
        const yearAgg = aggregateByMonth(historyData, "humidity");
        labels = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
        values = yearAgg;
    }

    if (humMode === "hum-day") {
        const day = filterHistory(historyData, 1);
        labels = day.map(e =>
            new Date(e.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        );
        const hums = day.map(e => e.humidity);
        values = smooth(hums, 4);
    }

    humChart.data.labels = labels;
    humChart.data.datasets[0].label = "Feuchtigkeit (%)";
    humChart.data.datasets[0].data = values;
    humChart.update();
}


// -----------------------------
// Druck-Modi
// -----------------------------
function updatePresChart() {
    if (!historyData || historyData.length === 0) return;

    if (presMode === "pres-live") {
        return;
    }

    let labels = [];
    let values = [];

    if (presMode === "pres-week") {
        const week = filterHistory(historyData, 7);
        labels = week.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { weekday: "short" })
        );
        values = week.map(e => e.pressure);
    }

    if (presMode === "pres-month") {
        const month = filterHistory(historyData, 30);
        labels = month.map(e =>
            new Date(e.time).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
        );
        values = month.map(e => e.pressure);
    }

    if (presMode === "pres-year") {
        const yearAgg = aggregateByMonth(historyData, "pressure");
        labels = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
        values = yearAgg;
    }

    if (presMode === "pres-day") {
        const day = filterHistory(historyData, 1);
        labels = day.map(e =>
            new Date(e.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        );
        const pres = day.map(e => e.pressure);
        values = smooth(pres, 4);
    }

    presChart.data.labels = labels;
    presChart.data.datasets[0].label = "Luftdruck (hPa)";
    presChart.data.datasets[0].data = values;
    presChart.update();
}


// -----------------------------
// Alle Charts nach aktuellem Modus aktualisieren
// -----------------------------
function updateAllFromModes() {
    updateTempChart();
    updateHumChart();
    updatePresChart();
}


// -----------------------------
// Tabs & Dropdowns
// -----------------------------
function setupTabs() {
    const allTabs = document.querySelectorAll(".tab[data-target]");
    const dropdownItems = document.querySelectorAll(".dropdown-item");

    allTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-target");

            // Kategorie bestimmen
            if (target.startsWith("temp-")) {
                tempMode = target;
                // aktive Tabs in Temperatur-Karte setzen
                setActiveTabInSection(tab);
                updateTempChart();
            }
            if (target.startsWith("hum-")) {
                humMode = target;
                setActiveTabInSection(tab);
                updateHumChart();
            }
            if (target.startsWith("pres-")) {
                presMode = target;
                setActiveTabInSection(tab);
                updatePresChart();
            }
        });
    });

    dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");

            if (target.startsWith("temp-")) {
                tempMode = target;
                updateTempChart();
            }
            if (target.startsWith("hum-")) {
                humMode = target;
                updateHumChart();
            }
            if (target.startsWith("pres-")) {
                presMode = target;
                updatePresChart();
            }

            // Dropdown schließen
            const menu = item.closest(".dropdown-menu");
            menu.classList.remove("show");
        });
    });

    // Dropdown-Buttons (▼)
    const dropdownButtons = document.querySelectorAll(".dropdown > .tab");
    dropdownButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const menu = btn.parentElement.querySelector(".dropdown-menu");
            menu.classList.toggle("show");
        });
    });

    // Klick außerhalb schließt Popover
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".dropdown")) {
            document.querySelectorAll(".dropdown-menu").forEach(m => m.classList.remove("show"));
        }
    });
}

function setActiveTabInSection(tab) {
    const section = tab.closest(".card");
    const tabs = section.querySelectorAll(".tab[data-target]");
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
}


// -----------------------------
// Dark-Mode-Anpassung (optional)
// -----------------------------
function updateChartColorsForDarkMode() {
    const isDark = document.body.classList.contains("dark");
    const charts = [tempChart, humChart, presChart];

    charts.forEach(chart => {
        if (!chart) return;
        chart.options.scales.x.ticks.color = isDark ? "#ccc" : "#666";
        chart.options.scales.y.ticks.color = isDark ? "#ccc" : "#666";
        chart.update();
    });
}


// -----------------------------
// Start
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
    // Charts initialisieren
    tempChart = createLineChart(
        document.getElementById("tempChart").getContext("2d"),
        "Temperatur (°C)",
        "#ffb74d"
    );
    humChart = createLineChart(
        document.getElementById("humChart").getContext("2d"),
        "Feuchtigkeit (%)",
        "#4fc3f7"
    );
    presChart = createLineChart(
        document.getElementById("presChart").getContext("2d"),
        "Luftdruck (hPa)",
        "#81c784"
    );

    setupTabs();

    loadLiveData();
    loadHistory();

    setInterval(loadLiveData, 5000);
    setInterval(loadHistory, 5 * 60 * 1000);
});
