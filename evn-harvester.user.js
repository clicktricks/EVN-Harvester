// ==UserScript==
// @name         evn_harvester.user.js
// @version      1.1
// @description  neues Layout
// @author       clicktricks
// @match        https://bahn.expert/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btn = document.createElement('button');
    btn.id = 'evn-scan-btn';
    btn.innerHTML = "🚀<br>SCAN STARTEN";
    btn.style = `position:fixed;bottom:20px;right:20px;z-index:99999;width:110px;height:110px;
                 border:4px solid white;border-radius:15px;font-weight:bold;color:white;
                 cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,0.6);display:flex;
                 flex-direction:column;justify-content:center;align-items:center;
                 text-align:center;background:#003366;font-family:sans-serif;`;
    document.body.appendChild(btn);

    btn.onclick = async () => {
        let stationName = document.title.split('|')[0].split('–')[0].trim();
        const containers = Array.from(document.querySelectorAll('div[id$="container"]'));
        if (containers.length === 0) return alert("Keine Abfahrten gefunden!");

        btn.disabled = true;
        let reportData = [];
        const startTime = new Date();

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
            await new Promise(r => setTimeout(r, 200));
        }

        btn.disabled = false;
        btn.style.background = "#004d00";
        btn.innerHTML = `<div style="font-size:2rem;">✔</div><div style="font-size:0.85rem;">FERTIG</div>`;
        exportHTML(stationName, startTime, reportData);
    };

    function exportHTML(station, dateObj, data) {
        // --- NEU: DATUM UND ZEIT FORMATIEREN ---
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        // Erzeugt Format: DD-MM-YYYY_HH-mm
        const timeStamp = `${day}-${month}-${year}_${hours}-${mins}`;

        let html = `<html><head><meta charset="UTF-8"><style>
            body { font-family: sans-serif; padding: 20px; }
            .header { background: #2b70b5; color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-weight: bold; }
            .header h1 { font-size: 1.9rem; margin: 0; }
            .header p { font-size: 1.5rem; margin: 5px 0 0 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 10px; vertical-align: middle; }
            th { background: #f2f2f2; color: #003366; text-transform: uppercase; font-size: 1.5rem; }
            .train-nr { color: #040b21; font-weight: bold; font-size: 1.3rem; margin-top: 4px; }
            .info-cell { display: flex; align-items: center; justify-content: space-between; width: 100%; }
            .left-group { display: flex; align-items: center; gap: 15px; }
            .big-clip-btn {
                display: flex; align-items: center; justify-content: center; text-decoration: none;
                font-size: 1.8rem; background: #f0f4f8; border: 2px solid #003366;
                border-radius: 8px; width: 60px; height: 50px; color: #003366;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.1); margin-right: 30px;
            }
            .big-clip-btn:hover { background: #97b8c4; }
            .evn { background: #eeeeee; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; border: 1px solid #ccc; font-size: 1.3rem; margin: 0 6px; }
            .track-box { background:#006666; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 1.2rem; white-space: nowrap; }
        </style></head><body>
        <div class="header"><h1>🚉 REPORT: ${station}</h1><p>${dateObj.toLocaleString('de-DE')}</p></div>
        <table><thead><tr><th>Zeit</th><th>Zug / Nr</th><th>Ziel</th><th>Link | EVNs | Gleis</th></tr></thead><tbody>`;

        data.forEach(item => {
            const evnsHtml = item.evns.map(e => `<span class="evn">${e}</span>`).join(" ");
            const trackHtml = item.track ? `<span class="track-box">Gl. ${item.track}</span>` : "";
            const clipHtml = item.link ? `<a href="${item.link}" target="_blank" class="big-clip-btn">📎</a>` : "";
            html += `<tr>
                <td style="font-size:1.4rem;"><b>${item.time}</b></td>
                <td><b style="font-size:1.3rem;">${item.train}</b><br><div class="train-nr">${item.nr}</div></td>
                <td style="font-size:1.4rem;"><b>${item.dest}</b></td>
                <td><div class="info-cell"><div class="left-group">${clipHtml} <div style="display:flex; flex-wrap:wrap; gap:5px;">${evnsHtml}</div></div>${trackHtml}</div></td>
            </tr>`;
        });
        html += `</tbody></table></body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        // --- GEÄNDERT: Zeitstempel im Dateinamen ---
        a.download = `EVN_Report_${station.replace(/[^a-z0-9]/gi, '_')}_${timeStamp}.html`;
        a.click();
    }
})();
