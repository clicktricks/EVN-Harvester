// ==UserScript==
// @name         Bahn.expert EVN Harvester - Mobile Fix
// @version      14.5
// @description  Zuverlässiger Report-Download für PC & Smartphone (Note 13).
// @author       DeinName
// @match        https://bahn.expert/*
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:10000;background:#003366;color:white;
                 font-weight:bold;border:3px solid white;border-radius:15px;cursor:pointer;
                 width:130px;height:80px;font-size:1rem;box-shadow:0 8px 25px rgba(0,0,0,0.4);`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.querySelector('h1')?.innerText || 
                          document.title.replace('Abfahrten ', '').split(' - ')[0];
        
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        btn.style.opacity = "0.6";
        let reportData = [];
        const startTime = new Date();

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const train = container.innerText.split('\n')[0] || "Zug";
            const time = container.innerText.match(/\d{2}:\d{2}/)?.[0] || "--:--";
            const destination = container.innerText.split('\n')[2] || "Unbekannt";

            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;
            
            container.scrollIntoView({ block: "center" });
            container.click();

            const waitTime = document.hidden ? 1800 : 1000;
            await new Promise(r => setTimeout(r, waitTime));

            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            reportData.push({ time, train, dest: destination, evns: [...new Set(matches)] });

            container.click();
            await new Promise(r => setTimeout(r, 200));
        }

        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = "🚀<br>SCAN STARTEN";
        
        downloadReport(stationName, startTime, reportData);
    };

    function downloadReport(station, dateObj, data) {
        const d = dateObj.toLocaleDateString('de-DE');
        const t = dateObj.toLocaleTimeString('de-DE');
        
        let html = `<html><head><meta charset="UTF-8"><title>EVN Report</title><style>
            body { font-family: sans-serif; padding: 15px; }
            .header { background: #003366; color: white; padding: 12px; border-radius: 4px; font-weight: bold; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f2f2f2; color: #003366; }
            .evn { background: #eeeeee; color: black; border: 1px solid #ccc; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-weight: bold; display: inline-block; margin: 1px; }
        </style></head><body>
        <div class="header">Bahnhof: ${station}<br>Datum: ${d} | Zeit: ${t}</div>
        <table><thead><tr><th>Zeit</th><th>Zug</th><th>Ziel</th><th>EVNs</th></tr></thead><tbody>`;
        
        data.forEach(item => {
            const evns = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            html += `<tr><td><b>${item.time}</b></td><td>${item.train}</td><td>${item.dest}</td><td>${evns || "---"}</td></tr>`;
        });
        html += `</tbody></table></body></html>`;

        // Die Lösung für Mobile: Blob & Download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EVN_Report_${station.replace(/\s/g, '_')}.html`;
        document.body.appendChild(a);
        a.click(); // Startet den Download oder das Öffnen
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }
})();
