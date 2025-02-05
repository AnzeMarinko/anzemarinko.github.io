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
        fetchVideos();
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
    fetchVideos();
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
    fetchVideos();
}

// Pridobi in združi YouTube videe
async function fetchVideos() {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Prosim, vnesi YouTube API ključ.");
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
                const videos = data.items.map(video => ({
                    id: video.id.videoId,
                    title: video.snippet.title,
                    channel: channel.name,
                    publishedAt: new Date(video.snippet.publishedAt),
                }));
                allVideos = allVideos.concat(videos);
            }
        } catch (error) {
            console.error("Napaka pri pridobivanju videov:", error);
            alert("Napaka pri povezavi na YouTube API.");
        }
    }

    // Razvrsti videe po času objave (najnovejši na vrhu)
    allVideos.sort((a, b) => b.publishedAt - a.publishedAt);
    displayVideos(allVideos);
}

// Prikaz videov v enotnem zidu
function displayVideos(videos) {
    const videoWall = document.getElementById("video-wall");
    videoWall.innerHTML = "";

    videos.forEach(video => {
        if (!video.id) return;

        const videoElement = document.createElement("div");
        videoElement.classList.add("video");
        videoElement.innerHTML = `
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
            <button class="remove-channel" onclick="removeChannel('${channel.id}')">🗑️</button>
            <button class="${isHidden ? "show" : "hide"}-channel" onclick="toggleChannelVisibility('${channel.id}')">
                ${isHidden ? "👁️‍🗨️ Prikaži" : "🙈 Skrij"}
            </button>
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
    if (settings.style.display === "none") {
        settings.style.display = "block";
    } else {
        settings.style.display = "none";
    }
}
