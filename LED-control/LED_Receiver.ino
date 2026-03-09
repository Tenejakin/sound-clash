#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <DNSServer.h>
#include <FastLED.h>

/**
 * Sound Clash - Complete Standalone Server with Captive Portal
 * Creates a Hotspot, serves the UI, and redirects all traffic to it.
 */

// --- CONFIGURATION ---
const char* ssid = "SoundClash_LED";
const char* password = "password123";
const byte DNS_PORT = 53;

#define DATA_PIN    D3
#define NUM_LEDS    17
#define BRIGHTNESS  150
#define LED_TYPE    WS2812B
#define COLOR_ORDER GRB

CRGB leds[NUM_LEDS];
WebSocketsServer webSocket = WebSocketsServer(81);
ESP8266WebServer server(80);
DNSServer dnsServer;

// --- WEB INTERFACE ---
const char INDEX_HTML[] PROGMEM = R"=====(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sound Clash | LED Controller</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); --accent: #38bdf8; --text: #f8fafc; --low: #22c55e; --mid: #eab308; --high: #ef4444; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; background: radial-gradient(circle at top right, #1e293b, #0f172a); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .glass-container { background: var(--card); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
        header h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
        header p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 32px; }
        .accent { color: var(--accent); }
        .controls { margin-bottom: 40px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .flex-row { display: flex; gap: 8px; }
        .flex-row input { flex: 1; }
        .thresholds { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; margin-bottom: 24px; }
        label { font-size: 0.8rem; color: #94a3b8; text-align: left; padding-left: 4px; }
        input { background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 12px 16px; color: white; font-family: inherit; outline: none; transition: border 0.3s; }
        input:focus { border-color: var(--accent); }
        button { background: var(--accent); color: #0f172a; border: none; border-radius: 12px; padding: 12px; font-weight: 600; cursor: pointer; transition: transform 0.2s, opacity 0.2s; }
        button:active { transform: scale(0.98); }
        .status { font-size: 0.8rem; color: #ef4444; }
        .status.connected { color: #22c55e; }
        .db-display { margin-bottom: 24px; }
        #db-value { font-size: 4rem; font-weight: 800; color: var(--accent); }
        .unit { font-size: 1.2rem; color: #94a3b8; }
        .led-bar { display: flex; gap: 4px; justify-content: center; height: 40px; margin: 20px 0; }
        .led-segment { width: 12px; height: 100%; background: rgba(255, 255, 255, 0.05); border-radius: 4px; transition: background 0.1s; }
        .main-btn { width: 100%; padding: 16px; font-size: 1.1rem; background: linear-gradient(135deg, #38bdf8, #818cf8); color: white; box-shadow: 0 10px 15px -3px rgba(56, 189, 248, 0.3); }
        .led-low.active { background: var(--low); box-shadow: 0 0 10px var(--low); }
        .led-mid.active { background: var(--mid); box-shadow: 0 0 10px var(--mid); }
        .led-high.active { background: var(--high); box-shadow: 0 0 10px var(--high); }
    </style>
</head>
<body>
    <div class="glass-container">
        <header>
            <h1>Sound <span class="accent">Monitor</span></h1>
            <p>Standalone Hotspot Control</p>
        </header>
        <section class="controls">
            <div class="thresholds">
                <div class="input-group">
                    <label>Min (0 LEDs)</label>
                    <input type="number" id="min-db" value="45">
                </div>
                <div class="input-group">
                    <label>Max (Full)</label>
                    <input type="number" id="max-db" value="120">
                </div>
            </div>
            <div class="status" id="status">Connecting to Wemos...</div>
        </section>
        <div class="db-display">
            <span id="db-value">--</span><span class="unit">dB</span>
        </div>
        <div id="led-bar" class="led-bar"></div>
        <footer>
            <button id="start-audio" class="main-btn">Start Microphone</button>
        </footer>
    </div>

    <script>
        const ledBar = document.getElementById('led-bar');
        const dbValueDisplay = document.getElementById('db-value');
        const startBtn = document.getElementById('start-audio');
        const statusText = document.getElementById('status');
        const minDbInput = document.getElementById('min-db');
        const maxDbInput = document.getElementById('max-db');

        let socket = null, audioContext = null, analyser = null, microphone = null, dataArray = null, animationId = null;
        const NUM_LEDS = 17;

        for (let i = 0; i < NUM_LEDS; i++) {
            const segment = document.createElement('div');
            segment.classList.add('led-segment');
            if (i < 8) segment.classList.add('led-low');
            else if (i < 13) segment.classList.add('led-mid');
            else segment.classList.add('led-high');
            ledBar.appendChild(segment);
        }
        const ledSegments = document.querySelectorAll('.led-segment');

        function connect() {
            socket = new WebSocket(`ws://${window.location.hostname}:81`);
            socket.onopen = () => { statusText.innerText = 'Connected to Wemos'; statusText.classList.add('connected'); };
            socket.onclose = () => { statusText.innerText = 'Disconnected - Retrying...'; statusText.classList.remove('connected'); setTimeout(connect, 2000); };
        }
        connect();

        startBtn.addEventListener('click', async () => {
            if (audioContext) { audioContext.close(); audioContext = null; startBtn.innerText = 'Start Microphone'; cancelAnimationFrame(animationId); return; }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                analyser.fftSize = 256;
                dataArray = new Uint8Array(analyser.frequencyBinCount);
                microphone.connect(analyser);
                startBtn.innerText = 'Stop Microphone';
                update();
            } catch (err) { alert('Microphone access denied'); }
        });

        function update() {
            animationId = requestAnimationFrame(update);
            analyser.getByteFrequencyData(dataArray);
            let sum = 0; for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            let average = sum / dataArray.length;
            const minDb = parseFloat(minDbInput.value) || 45, maxDb = parseFloat(maxDbInput.value) || 120;
            let db = Math.round((average / 255) * (maxDb - 20) + 20);
            if (db < 10) db = 10;
            dbValueDisplay.innerText = db;
            let level = 0; if (db >= minDb) level = Math.round(((db - minDb) / (maxDb - minDb)) * NUM_LEDS);
            if (level > NUM_LEDS) level = NUM_LEDS;
            ledSegments.forEach((seg, i) => { if (i < level) seg.classList.add('active'); else seg.classList.remove('active'); });
            if (socket && socket.readyState === WebSocket.OPEN) socket.send(level.toString());
        }
    </script>
</body>
</html>
)=====";

void updateLEDs(int level);
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);

void handleRoot() {
  server.send(200, "text/html", INDEX_HTML);
}

void handleNotFound() {
  // Redirect any unknown URL to the root for the Captive Portal effect
  server.sendHeader("Location", String("http://") + WiFi.softAPIP().toString(), true);
  server.send(302, "text/plain", "");
}

void updateLEDs(int level) {
  if (level > NUM_LEDS) level = NUM_LEDS;
  if (level < 0) level = 0;
  FastLED.clear();
  for(int i = 0; i < level; i++) {
    if (i < 8) leds[i] = CRGB::Green;
    else if (i < 13) leds[i] = CRGB::Yellow;
    else leds[i] = CRGB::Red;
  }
  FastLED.show();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if(type == WStype_TEXT) {
    int level = String((char*)payload).toInt();
    updateLEDs(level);
  }
}

void setup() {
  Serial.begin(115200);
  
  // LED Init
  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
  FastLED.setBrightness(BRIGHTNESS);
  FastLED.clear();
  FastLED.show();

  // WiFi Hotspot Init
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);
  
  // DNS Server for Captive Portal (redirect all DNS to Wemos IP)
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  Serial.print("Access the UI at: http://");
  Serial.println(WiFi.softAPIP());

  // Web Server
  server.on("/", handleRoot);
  server.on("/generate_204", handleRoot);  // Android portal detection
  server.on("/favicon.ico", handleRoot);   // Stop favicon 404s
  server.onNotFound(handleNotFound);       // Redirect all other queries
  server.begin();

  // WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  dnsServer.processNextRequest();
  webSocket.loop();
  server.handleClient();
}
