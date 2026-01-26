async function loadData() {
    const r = await fetch("data.json?nocache=" + Date.now());
    const d = await r.json();

    document.getElementById("temp").textContent = d.temperature + " °C";
    document.getElementById("hum").textContent = d.humidity + " %";
    document.getElementById("press").textContent = d.pressure + " hPa";
    document.getElementById("time").textContent = d.timestamp;
}

async function loadHistory() {
    const r = await fetch("history.json?nocache=" + Date.now());
    const h = await r.json();

    const labels = h.records.map(e => e.timestamp);
    const temp = h.records.map(e => e.temperature);
    const hum = h.records.map(e => e.humidity);
    const press = h.records.map(e => e.pressure);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { ticks: { display: false } } }
    };

    new Chart(document.getElementById("chartTemp"), {
        type: "line",
        data: { labels, datasets: [{ label: "Temperatur", data: temp, borderColor: "red" }] },
        options: chartOptions
    });

    new Chart(document.getElementById("chartHum"), {
        type: "line",
        data: { labels, datasets: [{ label: "Feuchte", data: hum, borderColor: "cyan" }] },
        options: chartOptions
    });

    new Chart(document.getElementById("chartPress"), {
        type: "line",
        data: { labels, datasets: [{ label: "Druck", data: press, borderColor: "yellow" }] },
        options: chartOptions
    });
}

setInterval(loadData, 15000);
loadData();
loadHistory();
