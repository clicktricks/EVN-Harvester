// ==UserScript==
// @name         Bahn.expert EVN Harvester - Background Fix
// @version      14.2
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = "position:fixed;bottom:30px;right:30px;z-index:10000;background:#003366;color:white;padding:15px;border-radius:15px;font-weight:bold;border:3px solid white;cursor:pointer;width:150px;height:90px;box-shadow:0 8px 25px rgba(0,0,0,0.4);";
    document.body.appendChild(btn);

    btn.onclick = async () => {
        const stationName = document.querySelector('h1')?.innerText || "Unbekannter Bahnhof";
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.6";
        let reportData = [];
        const now = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];

            // Falls der Tab gewechselt wurde, warten wir kurz länger,
            // um dem Browser Zeit zu geben, die Daten im Hintergrund bereitzustellen.
            const isHidden = document.hidden;
            const waitTime = isHidden ? 1500 : 850;

            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const train = container.innerText.split('\n')[0] || "Zug";
            const destination = container.innerText.split('\n')[2] || "Unbekannt";

            btn.innerHTML = `⌛<br>${i+1}/${containers.length}`;
            document.title = `(${i+1}/${containers.length}) ${train}`;

            // Sicherstellen, dass das Element im Viewport ist (hilft gegen Hintergrund-Throttling)
            container.scrollIntoView({ block: "center", behavior: "instant" });

            container.click();

            // Warten auf das Laden der Wagendaten
            await new Promise(r => setTimeout(r, waitTime));

            // Wir scannen jetzt MEHRFACH, falls die Daten verzögert kommen
            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];

            // Zweiter Versuch nach kurzer Pause, falls beim ersten Mal nichts da war
            if (matches.length === 0) {
                await new Promise(r => setTimeout(r, 400));
                matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            }

            const uniqueEvns = [...new Set(matches)];
            reportData.push({ time, train, dest: destination, evns: uniqueEvns });

            container.click();
            await new Promise(r => setTimeout(r, 250));
        }

        document.title = "✅ Scan fertig!";
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "🚀<br>SCAN STARTEN";

        generateReport(stationName, now.toLocaleDateString('de-DE'), now.toLocaleTimeString('de-DE'), reportData);
    };

    function generateReport(station, date, scanTime, data) {
        const reportWindow = window.open("", "_blank");
        let html = `<html><head><title>EVN Report</title><style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
            .header { background: #003366; color: white; padding: 15px; border-radius: 4px; font-weight: bold; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background: #f2f2f2; color: #003366; border-bottom: 2px solid #003366; }
            .evn { background: #eeeeee; color: black; border: 1px solid #ccc; padding: 2px 8px; border-radius: 3px; font-family: monospace; font-weight: bold; margin: 2px; display: inline-block; }
            .dest { color: #003366; font-weight: bold; }
        </style></head><body>
        <div class="header">Bahnhof: ${station} | Datum: ${date} | Zeit: ${scanTime}</div>
        <table><thead><tr><th>Abfahrt</th><th>Zug</th><th>Ziel</th><th>EVN</th></tr></thead><tbody>`;

        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr><td><b>${item.time}</b></td><td>${item.train}</td><td class="dest">${item.dest}</td><td>${evns || "---"}</td></tr>`;
        });
        html += `</tbody></table></body></html>`;
        reportWindow.document.write(html);
        reportWindow.document.close();
    }
})();