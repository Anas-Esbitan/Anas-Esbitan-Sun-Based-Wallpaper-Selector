import http from "http";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesPath = path.join(__dirname, "images");


async function getSunTimes(lat, lon) {
    const url = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lon}&timezone=auto`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching sun data:", error);
        return null;
    }
}


function determineWallpaper(sunrise, sunset, noon) {
    const now = new Date();
    const currentHour = now.getHours();

    const sunriseHour = parseInt(sunrise.split(":")[0]);
    const sunsetHour = parseInt(sunset.split(":")[0]);
    const noonHour = parseInt(noon.split(":")[0]);

    if (currentHour < sunriseHour) {
        return "night.png";  
    } else if (currentHour < sunriseHour + 1) {
        return "sunrise.png";  
    } else if (currentHour < noonHour - 2) {
        return "morning.png";  
    } else if (currentHour < noonHour + 2) {
        return "noon.png";  
    } else if (currentHour < sunsetHour - 1) {
        return "evening.png";  
    } else if (currentHour < sunsetHour + 1) {
        return "sunset.png"; 
    } else {
        return "night.png";  
    }
}


const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/get-wallpaper") {
        const lat = url.searchParams.get("lat");
        const lon = url.searchParams.get("lon");

        if (!lat || !lon) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing lat and lon parameters" }));
            return;
        }

        const sunData = await getSunTimes(lat, lon);
        if (!sunData) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to fetch sun data" }));
            return;
        }

        const wallpaper = determineWallpaper(sunData.sunrise, sunData.sunset, sunData.solar_noon);
        const imagePath = path.join(imagesPath, wallpaper);

        if (fs.existsSync(imagePath)) {
            res.writeHead(200, { "Content-Type": "image/png" });
            fs.createReadStream(imagePath).pipe(res);
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Image not found");
        }
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
    /**
     * example for prowser 
     * http://localhost:3000/get-wallpaper?lat=21.3891&lon=39.8579
     * http://localhost:3000/get-wallpaper?lat=-33.8688&lon=151.2093
     * http://localhost:3000/get-wallpaper?lat=35.6895&lon=139.6917
     */
});
