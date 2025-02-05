const x = document.getElementById("demo");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            saveAndShowPosition, useLastKnownPosition, {
            enableHighAccuracy: true,
            maximumAge: Infinity,
            timeout: 15000
        });
    } else {
        useLastKnownPosition();
    }
}

function saveAndShowPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    localStorage.setItem("lastLatitude", latitude);
    localStorage.setItem("lastLongitude", longitude);
    fetchWeather(latitude, longitude);
}

function useLastKnownPosition() {
    const lastLatitude = localStorage.getItem("lastLatitude");
    const lastLongitude = localStorage.getItem("lastLongitude");
    if (lastLatitude && lastLongitude) {
        fetchWeather(lastLatitude, lastLongitude);
        x.innerHTML = "Uporabljena zadnja znana lokacija.";
    } else {
        x.innerHTML = "Geolocation ni na voljo in ni shranjene lokacije.";
    }
}

function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function fetchWeather(latitude, longitude) {
    const response = httpGet("https://api.open-meteo.com/v1/dwd-icon?latitude=" + latitude +
        "&longitude=" + longitude + "&hourly=temperature_2m,precipitation,wind_speed_10m,direct_normal_irradiance&daily=sunrise,sunset&timezone=Europe%2FBerlin&past_days=3&forecast_days=8");
    const obj = JSON.parse(response);
    let hourly_times = obj.hourly.time.map(datetime => new Date(datetime));

    const tempColor = '#DC143C';  // rdeča
    const padavColor = '#4682B4';  // modra
    const veterColor = '#008000';  // zelena
    const sonColor = '#FF8C00';  // oranžna
    const currentTime = new Date();

    const endDate = new Date(currentTime);
    endDate.setDate(endDate.getDate() + 2);

    // Prvi graf (Temperatura in Obsevanje)
    const data = [
        { x: hourly_times, y: obj.hourly.temperature_2m, mode: "lines", name: 'Temperatura [' + obj.hourly_units.temperature_2m + ']', line: { color: tempColor }, yaxis: "y" },
        { x: hourly_times, y: obj.hourly.direct_normal_irradiance, mode: "lines", name: 'Sonce [' + obj.hourly_units.direct_normal_irradiance + ']', line: { color: sonColor }, yaxis: "y2" },
        { x: hourly_times, y: obj.hourly.wind_speed_10m, mode: "lines", name: 'Hitrost vetra [' + obj.hourly_units.wind_speed_10m + ']', line: { color: veterColor }, yaxis: "y3" },
        { x: hourly_times, y: obj.hourly.precipitation, type: "bar", name: 'Padavine [' + obj.hourly_units.precipitation + ']', marker: { color: padavColor }, opacity: 0.5, yaxis: "y4" },
        { x: [currentTime, currentTime], y: [Math.min(...obj.hourly.temperature_2m), Math.max(...obj.hourly.temperature_2m)], mode: "lines", line: { color: "gold", dash: "dash", width: 5 }, name: "Trenutni čas" }
    ];

    const layout = {
        title: "Vremenska napoved",
        xaxis: { 
            title: "Čas", 
            range: [currentTime, endDate],
            fixedrange: false, 
            showspikes: true,
            showgrid: true,
            showline: true
            },
        yaxis: { 
            // title: "Temperatura",
            tickfont: { color: tempColor },
            showspikes: true,
            showline: true,
            showgrid: false,
            fixedrange: true
        },
        yaxis2: { 
            // title: "Sonce", 
            tickfont: { color: sonColor }, 
            overlaying: 'y', 
            side: 'right', 
            showspikes: true,
            showline: true,
            fixedrange: true },
        yaxis3: { 
            // title: "Hitrost vetra",
            tickfont: { color: veterColor },
            overlaying: 'y', 
            side: 'left',
            position: 0.03,
            showspikes: true,
            showline: true,
            showgrid: false,
            fixedrange: true },
        yaxis4: { 
            // title: "Padavine", 
            tickfont: { color: padavColor }, 
            overlaying: 'y', 
            side: 'right', 
            position: 0.97,
            showgrid: false,
            showspikes: true,
            showline: true,
            fixedrange: true },
        legend: { orientation: "h", y: -0.2 },
        dragmode: 'pan',  // Set pan as default mode
        spikedistance: -1, // Enables global spike lines
        margin: {
            t: 40,  // Top margin
            b: 40,  // Bottom margin
            l: 40,  // Left margin
            r: 40,  // Right margin
        },
        autosize: true,
    };

    const layoutOptions = {
        showspikes: true,
        displaylogo: false,
        displayModeBar: true,
        modeBarButtonsToRemove: ['toImage', 'pan2d', 'zoom2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines'],
    };

    Plotly.newPlot("plot", data, layout, layoutOptions);

    document.getElementById("sunrise").innerHTML = `Vzhod: ${obj.daily.sunrise[0].split('T')[1]}`;
    document.getElementById("sunset").innerHTML = `Zahod: ${obj.daily.sunset[0].split('T')[1]}`;
}

getLocation();