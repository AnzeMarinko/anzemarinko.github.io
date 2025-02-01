const MAX_RESULTS = 3;
const youtubeChannelsDiv = document.getElementById("youtube-channels");

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
        fetchVideos();
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
    const storedChannels = localStorage.getItem("youtubeChannels");
    return storedChannels ? JSON.parse(storedChannels) : [];
}

// Shrani kanale v LocalStorage
function saveChannels(channels) {
    localStorage.setItem("youtubeChannels", JSON.stringify(channels));
}

// Dodaj nov kanal
async function addChannel() {
    const channelId = document.getElementById("channelIdInput").value.trim();
    if (!channelId) {
        alert("Prosim, vnesi YouTube Channel ID.");
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Prosim, vnesi YouTube API ključ.");
        return;
    }

    // Preverimo, ali je kanal že dodan
    let channels = getChannels();
    if (channels.some(c => c.id === channelId)) {
        alert("Ta kanal je že dodan.");
        return;
    }

    try {
        // 🔍 Pridobi ime kanala iz YouTube API-ja
        const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            alert("Ni mogoče najti kanala. Preveri ID.");
            return;
        }

        const channelName = data.items[0].snippet.title; // 📌 Pridobi ime kanala

        // Shrani kanal v LocalStorage
        channels.push({ id: channelId, name: channelName });
        saveChannels(channels);
        fetchVideos();
    } catch (error) {
        console.error("Napaka pri pridobivanju imena kanala:", error);
        alert("Napaka pri pridobivanju imena kanala.");
    }
}


// Odstrani kanal
function removeChannel(channelId) {
    let channels = getChannels();
    channels = channels.filter(c => c.id !== channelId);
    saveChannels(channels);
    fetchVideos();
}

// Pridobi YouTube videe za vsak kanal
async function fetchVideos() {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Prosim, vnesi YouTube API ključ.");
        return;
    }

    youtubeChannelsDiv.innerHTML = ""; // Počisti stare rezultate
    const channels = getChannels();

    for (const channel of channels) {
        const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channel.id}&part=snippet,id&order=date&maxResults=${MAX_RESULTS}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("Napaka API-ja:", data.error);
                alert(`Napaka pri API klicu: ${data.error.message}`);
                continue;
            }

            displayVideos(channel, data.items);
        } catch (error) {
            console.error("Napaka pri pridobivanju videov:", error);
            alert("Napaka pri povezavi na YouTube API.");
        }
    }
}

// Prikaz videov v vrstici za posamezen kanal
function displayVideos(channel, videos) {
    const channelElement = document.createElement("div");
    channelElement.classList.add("channel");

    // Naslov kanala + gumb za brisanje
    const title = document.createElement("h2");
    title.innerHTML = `${channel.name} <button class="remove-btn" onclick="removeChannel('${channel.id}')">🗑️</button>`;
    channelElement.appendChild(title);

    // Vrstica videov
    const videoRow = document.createElement("div");
    videoRow.classList.add("video-row");

    videos.forEach(video => {
        if (video.id.videoId) {
            const videoElement = document.createElement("div");
            videoElement.classList.add("video");
            videoElement.innerHTML = `
                <iframe 
                    src="https://www.youtube-nocookie.com/embed/${video.id.videoId}?rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            `;
            videoRow.appendChild(videoElement);
        }
    });

    channelElement.appendChild(videoRow);
    youtubeChannelsDiv.appendChild(channelElement);
}

// Ob zagonu naloži shranjene kanale
if (getApiKey()) {
    fetchVideos();
}
