const DATA_URL = "https://mahu1963.github.io/Meine-Wetterstation/data.json";

let chart24 = null;
let chartWeek = null;
let chartYear = null;

function formatTimestamp(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleString("de-AT", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDateStamp(dayStamp) {
    // YYYYMMDD -> Date
    const s = dayStamp.toString();
    const y = parseInt(s.substring(0, 4));
    const m = parseInt(s.substring(4, 6)) - 1;
    const d = parseInt(s.substring(6, 8));
    const date = new Date(y, m, d);
    return date.toLocaleDateString("de-AT", {
        day: "2-digit",
        month: "2-digit"
    });
}

async function loadData() {
    try {
        const res = await fetch(DATA_URL, { cache: "no-cache" });
        const data = await res.json();

        // Live-Werte
        document.getElementById("temp").innerText  = data.t.toFixed(1) + " °C";
        document.getElementById("hum").innerText   = data.h.toFixed(1) + " %";
        document.getElementById("press").innerText = data.p.toFixed(1) + " hPa";

        // Letztes Update (aus letztem hist-Eintrag)
        if (data.hist && data.hist.length > 0) {
            const last = data.hist[data.hist.length - 1];
            const d = new Date(last.ts * 1000);
            document.getElementById("lastUpdate").innerText =
                "Letztes Update: " +
                d.toLocaleString("de-AT", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                });
        }

        draw24hChart(data.hist || []);
        drawWeekChart(data.week || []);
        drawYearChart(data.year || []);

    } catch (e) {
        console.error("Fehler beim Laden:", e);
    }
}

function draw24hChart(hist) {
    const ctx = document.getElementById("chart24").getContext("2d");

    const labels = hist.map(h => formatTimestamp(h.ts));
    const temps  = hist.map(h => h.t);

    if (chart24) chart24.destroy();

    chart24 = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Temperatur (°C)",
                data: temps,
                borderColor: "#007aff",
                backgroundColor: "rgba(0,122,255,0.18)",
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function drawWeekChart(week) {
    const ctx = document.getElementById("chartWeek").getContext("2d");

    const labels = week.map(d => formatDateStamp(d.day));
    const minT   = week.map(d => d.minT);
    const maxT   = week.map(d => d.maxT);

    if (chartWeek) chartWeek.destroy();

    chartWeek = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Min °C",
                    data: minT,
                    borderColor: "#ff3b30",
                    backgroundColor: "rgba(255,59,48,0.15)",
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 3
                },
                {
                    label: "Max °C",
                    data: maxT,
                    borderColor: "#34c759",
                    backgroundColor: "rgba(52,199,89,0.15)",
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        boxWidth: 10
                    }
                }
            },
            scales: {
                x: {
                    ticks: { maxRotation: 0, autoSkip: true }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function drawYearChart(year) {
    const ctx = document.getElementById("chartYear").getContext("2d");

    const labels = year.map(d => formatDateStamp(d.day));
    const minT   = year.map(d => d.minT);
    const maxT   = year.map(d => d.maxT);

    if (chartYear) chartYear.destroy();

    chartYear = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Min °C",
                    data: minT,
                    borderColor: "#ff9f0a",
                    backgroundColor: "rgba(255,159,10,0.15)",
                    borderWidth: 1.8,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: "Max °C",
                    data: maxT,
                    borderColor: "#0a84ff",
                    backgroundColor: "rgba(10,132,255,0.15)",
                    borderWidth: 1.8,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { boxWidth: 10 }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Dark-Mode Handling
function initTheme() {
    const prefersDark = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && prefersDark)) {
        document.body.classList.add("dark");
        document.getElementById("modeToggle").textContent = "☀︎";
    } else {
        document.body.classList.remove("dark");
        document.getElementById("modeToggle").textContent = "☾";
    }

    document.getElementById("modeToggle").addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        document.getElementById("modeToggle").textContent = isDark ? "☀︎" : "☾";
    });
}

initTheme();
loadData();
setInterval(loadData, 60000);
