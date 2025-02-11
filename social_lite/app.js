const MAX_RESULTS = 3;

// Pridobi API ključ iz LocalStorage
function getApiKey() {
    return localStorage.getItem("googleApiKey");
}

// Shrani API ključ v LocalStorage
function saveApiKey() {
    const apiKey = document.getElementById("apiKeyInput").value;
    if (apiKey) {
        localStorage.setItem("googleApiKey", apiKey);
        alert("API ključ shranjen!");
        location.reload();
    }
}

// Počisti API ključ
function clearApiKey() {
    localStorage.removeItem("googleApiKey");
    alert("API ključ odstranjen!");
    location.reload();
}

// Pridobi shranjene kanale
function getChannels() {
    return JSON.parse(localStorage.getItem("youtubeChannels")) || [];
}

// Pridobi skrite kanale
function getHiddenChannels() {
    return JSON.parse(localStorage.getItem("hiddenChannels")) || [];
}

// Shrani kanale
function saveChannels(channels) {
    localStorage.setItem("youtubeChannels", JSON.stringify(channels));
}

// Shrani skrite kanale
function saveHiddenChannels(hiddenChannels) {
    localStorage.setItem("hiddenChannels", JSON.stringify(hiddenChannels));
}

// Dodaj nov kanal
async function addChannel() {
    const channelId = document.getElementById("channelIdInput").value.trim();
    if (!channelId) {
        alert("Prosim, vnesite ID kanala.");
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Prosim, vnesite API ključ.");
        return;
    }

    let channels = getChannels();
    if (channels.some(c => c.id === channelId)) {
        alert("Kanal je že dodan.");
        return;
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            alert("Kanal ni najden. Preverite ID.");
            return;
        }

        const channelName = data.items[0].snippet.title;
        channels.push({ id: channelId, name: channelName });
        saveChannels(channels);
        renderChannelList();
    } catch (error) {
        console.error("Napaka pri pridobivanju imena kanala:", error);
        alert("Napaka pri pridobivanju imena kanala.");
    }
}


// Odstrani kanal
function removeChannel(channelId) {
    let channels = getChannels().filter(c => c.id !== channelId);
    saveChannels(channels);
    renderChannelList();
}

// Skrij/Prikaži kanal
function toggleChannelVisibility(channelId) {
    let hiddenChannels = getHiddenChannels();
    if (hiddenChannels.includes(channelId)) {
        hiddenChannels = hiddenChannels.filter(id => id !== channelId);
    } else {
        hiddenChannels.push(channelId);
    }
    saveHiddenChannels(hiddenChannels);
    renderChannelList();
}

async function fetchVideos() {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Prosim, vnesite API ključ.");
        return;
    }

    const channels = getChannels();
    const hiddenChannels = getHiddenChannels();
    let allVideos = [];

    for (const channel of channels) {
        if (hiddenChannels.includes(channel.id)) continue;

        try {
            const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channel.id}&part=snippet,id&order=date&maxResults=${MAX_RESULTS}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("Napaka API-ja:", data.error);
                alert(`Napaka pri API klicu: ${data.error.message}`);
                continue;
            }
            if (data.items) {
                const videoIds = data.items.map(video => video.id.videoId).filter(id => id);
                const durations = await fetchVideoDurations(videoIds, apiKey);
                
                const videos = data.items.map((video, index) => ({
                    id: video.id.videoId,
                    title: video.snippet.title,
                    channel: channel.name,
                    publishedAt: new Date(video.snippet.publishedAt),
                    duration: durations[video.id.videoId] || "??:??"
                }));
                allVideos = allVideos.concat(videos);
            }
        } catch (error) {
            console.error("Napaka pri pridobivanju videov:", error);
            alert("Napaka pri povezavi na YouTube API.");
        }
    }

    allVideos.sort((a, b) => b.publishedAt - a.publishedAt);
    displayVideos(allVideos);
}

async function fetchVideoDurations(videoIds, apiKey) {
    if (videoIds.length === 0) return {};

    const url = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(",")}&part=contentDetails`;
    const response = await fetch(url);
    const data = await response.json();
    
    let durations = {};
    if (data.items) {
        data.items.forEach(video => {
            durations[video.id] = formatDuration(video.contentDetails.duration);
        });
    }
    return durations;
}

function formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    return (hours ? hours + ":" : "") + (minutes < 10 && hours ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function displayVideos(videos) {
    const videoWall = document.getElementById("video-wall");
    videoWall.innerHTML = "";

    videos.forEach(video => {
        if (!video.id) return;

        const videoElement = document.createElement("div");
        videoElement.classList.add("video");
        videoElement.innerHTML = `
            <div class="video-info" title="${video.title}">
                <span class="video-channel">${video.channel}</span>
                <span class="video-duration">⏱️ ${video.duration}</span>
            </div>
            <iframe
                src="https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1" 
                frameborder="0" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
            </iframe>
        `;
        videoWall.appendChild(videoElement);
    });
}

// Prikaz dodanih kanalov z možnostjo skrivanja/prikazovanja
function renderChannelList() {
    const channelListDiv = document.getElementById("channelList");
    const channels = getChannels();
    const hiddenChannels = getHiddenChannels();
    channelListDiv.innerHTML = "";

    channels.forEach(channel => {
        const isHidden = hiddenChannels.includes(channel.id);

        const channelDiv = document.createElement("div");
        channelDiv.classList.add("channel-item");
        channelDiv.innerHTML = `
            ${channel.name}
            <button class="${isHidden ? "show" : "hide"}-channel" onclick="toggleChannelVisibility('${channel.id}')">
                ${isHidden ? "👁️‍🗨️ Prikaži" : "🙈 Skrij"}
            </button>
            <button class="remove-channel" onclick="removeChannel('${channel.id}')">🗑️</button>
        `;
        channelListDiv.appendChild(channelDiv);
    });
}


// Ob zagonu naloži shranjene kanale
renderChannelList();
if (getApiKey()) {
    fetchVideos();
}

function toggleTooltip(id) {
    const tooltip = document.getElementById(id);
    tooltip.style.display = tooltip.style.display === 'block' ? 'none' : 'block';
}

// Funkcija za preklapljanje nastavitvenega menija
function toggleSettings() {
    const settings = document.getElementById('settings');
    const videos = document.getElementById('videos');
    const settingsButton = document.getElementById('settingsButton');
    if (settings.style.display === "none") {
        settings.style.display = "block";
        videos.style.display = "none";
        settingsButton.innerHTML = "Zapri nastavitve";
    } else {
        settings.style.display = "none";
        videos.style.display = "block";
        settingsButton.innerHTML = "⚙️ Nastavitve";
        fetchVideos();
    }
}

let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("Wake lock enabled");

            // Poskrbimo, da se Wake Lock obnovi, če se stran skrije in prikaže
            document.addEventListener("visibilitychange", async () => {
                if (wakeLock !== null && document.visibilityState === "visible") {
                    wakeLock = await navigator.wakeLock.request("screen");
                }
            });
            keepWakeLockAlive();
        } catch (err) {
            console.error("Wake Lock error:", err);
        }
    }
}

async function keepWakeLockAlive() {
    try {
        while (wakeLock !== null) {
            await new Promise(resolve => setTimeout(resolve, 30000)); // Osveži vsakih 30s
            wakeLock = await navigator.wakeLock.request("screen");
        }
    } catch (err) {
        console.error("Wake Lock refresh error:", err);
    }
}

// Aktiviramo Wake Lock ob kliku na iframe (predvajanje videa)
document.addEventListener("pointerdown", (event) => {
    if (event.target.tagName === "IFRAME") {
        requestWakeLock();
        
    }
});

document.addEventListener("fullscreenchange", async () => {
    if (document.fullscreenElement && wakeLock === null) {
        await requestWakeLock();
    }
});

document.addEventListener("fullscreenerror", (event) => {
    console.error("Fullscreen mode error:", event);
});
