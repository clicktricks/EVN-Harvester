// ==UserScript==
// @name         evn_harvester.user.js
// @version      1.5
// @description  Scan-Overlay + Zentrales Popup + Button Reset
// @author       clicktricks
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.id = 'evn-scan-btn';
    btn.innerHTML = "<span style='font-size:22px;'>🔍</span><br>SCAN";
    btn.style = `position:fixed;top:25px;right:50px;z-index:99999;width:55px;height:55px;
                 border:3px solid #3d2273;border-radius:10px;font-weight:bold;color:white;
                 cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,0.8);display:flex;
                 flex-direction:column;justify-content:center;align-items:center;
                 text-align:center;background:#1976d2;font-family:sans-serif;font-size:15px;`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.title.split('|')[0].split('–')[0].trim();
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;

        // --- Overlay erstellen ---
        const overlay = document.createElement('div');
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.95); z-index: 99998;
            display: flex; flex-direction: column; justify-content: flex-start;
            padding-top: 32px; align-items: center;
            color: #a5b7c9; font-family: sans-serif; font-size: 24px;
            pointer-events: none;
        `;
        overlay.innerHTML = "Scan läuft ⟶";
        document.body.appendChild(overlay);

        let reportData = [];
        const startTime = new Date();

        // --- Scan-Schleife ---
        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            btn.innerHTML = `⏳<br>${i+1}/${containers.length}`;

            const lines = container.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const time = lines.find(l => /\d{2}:\d{2}/.test(l)) || "--:--";
            const trainFull = container.querySelector('span[class*="train"]')?.innerText || lines[0];

            let trainNrMatch = lines.find(l => /^[A-Z]?\s?\d{4,5}$/.test(l) || (l.includes(' ') && /\d+/.test(l) && l.length < 12 && l !== trainFull));
            let displayNr = trainNrMatch || "";
            let detailLink = container.querySelector('a[href*="/details/"]')?.href || "";

            let destination = "";
            let destElements = Array.from(container.querySelectorAll('[class*="destination"]'));
            if (destElements.length > 0) {
                destination = destElements[destElements.length - 1].innerText;
            } else {
                let pot = lines.filter(l => l.length > 3 && !/\d{2}:\d{2}/.test(l) && l !== trainFull);
                destination = pot.length > 0 ? pot[pot.length - 1] : "Ziel";
            }

            container.scrollIntoView({ block: "center" });
            container.click();
            await new Promise(r => setTimeout(r, 1400));

            let matches = container.innerHTML.match(/\d{4}\s\d{3}/g) || [];
            let track = lines.find(l => l.toLowerCase().includes("gleis") || /^\d+$/.test(l))?.replace(/Gleis /gi, "") || "";

            reportData.push({ time, train: trainFull, nr: displayNr, link: detailLink, dest: destination, evns: [...new Set(matches)], track: track });

            container.click();
            await new Promise(r => setTimeout(r, 2000));
        }

        // --- Abschluss-Aktionen ---

        // 1. Overlay weg
        if (overlay) overlay.remove();

        // 2. Button zurück auf Anfang
        btn.disabled = false;
        btn.style.background = "#1976d2";
        btn.innerHTML = "<span style='font-size:25px;'>🔍</span><br>SCAN";

        // 3. Separates Popup anzeigen
        const popup = document.createElement('div');
        popup.innerHTML = "<b>SCAN FERTIG ✔</b><br><span style='font-size:12px;'>Report wurde erstellt</span>";
        popup.style = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background:#0b3b20; color: white #9bb2c9; padding: 12px 25px;
            border-radius: 4px; font-family: sans-serif; font-size: 16px;
            z-index: 100000; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            text-align: center; border: 1px solid white;
        `;
        document.body.appendChild(popup);

        // Popup nach 3 Sek ausblenden
        setTimeout(() => {
            popup.style.opacity = "0";
            popup.style.transition = "opacity 0.5s ease";
            setTimeout(() => popup.remove(), 500);
        }, 3000);

        // 4. Download
        exportHTML(stationName, startTime, reportData);
    };

    function exportHTML(station, dateObj, data) {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        const timeStamp = `${day}-${month}-${year}_${hours}-${mins}`;

        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 20px; }
            .header { background: #2b70b5; color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-weight: bold; }
            .header h1 { font-size: 1.9rem; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; vertical-align: middle; }
            th { background: #f2f2f2; color: #003366; text-transform: uppercase; }
            .evn { background: #eeeeee; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; border: 1px solid #ccc; margin: 0 3px; }
            .track-box { background:#006666; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
        </style></head><body>
        <div class="header"><h1>🚉 REPORT: ${station}</h1><p>${dateObj.toLocaleString('de-DE')}</p></div>
        <table><thead><tr><th>Zeit</th><th>Zug / Nr</th><th>Ziel</th><th>Info</th></tr></thead><tbody>`;

        data.forEach(item => {
            const evnsHtml = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            const trackHtml = item.track ? `<span class="track-box">Gl. ${item.track}</span>` : "";
            const clipHtml = item.link ? `<a href="${item.link}" target="_blank" style="text-decoration:none; font-size:1.5rem;">📎</a>` : "";
            html += `<tr>
                <td><b>${item.time}</b></td>
                <td><b>${item.train}</b><br><small>${item.nr}</small></td>
                <td><b>${item.dest}</b></td>
                <td><div style="display:flex; align-items:center; gap:10px;">${clipHtml} ${evnsHtml} ${trackHtml}</div></td>
            </tr>`;
        });
        html += `</tbody></table></body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `EVN_Report_${station.replace(/[^a-z0-9]/gi, '_')}_${timeStamp}.html`;
        a.click();
    }
})();
