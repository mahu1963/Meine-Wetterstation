async function loadData() {
    try {
        const response = await fetch("http://192.168.1.200");
        const data = await response.json();

        document.getElementById("temp").innerText = data.temperature.toFixed(1) + " °C";
        document.getElementById("hum").innerText = data.humidity.toFixed(1) + " %";
        document.getElementById("pres").innerText = data.pressure.toFixed(1) + " hPa";

        const statusBox = document.getElementById("statusBox");

        if (data.fallback_ap) {
            statusBox.innerHTML = "⚠️ AP‑Modus aktiv (Router offline)";
            statusBox.style.color = "orange";
        } else if (!data.github_ok) {
            statusBox.innerHTML = "⚠️ GitHub Upload fehlgeschlagen";
            statusBox.style.color = "red";
        } else {
            statusBox.innerHTML = "✅ GitHub Upload OK";
            statusBox.style.color = "green";
        }

    } catch (e) {
        document.getElementById("statusBox").innerHTML = "❌ ESP nicht erreichbar";
        document.getElementById("statusBox").style.color = "red";
    }
}

setInterval(loadData, 3000);
loadData();
