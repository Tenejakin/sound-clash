const ledBar = document.getElementById('led-bar');
const dbValueDisplay = document.getElementById('db-value');
const connectBtn = document.getElementById('connect-btn');
const startBtn = document.getElementById('start-audio');
const statusText = document.getElementById('status');
const ipInput = document.getElementById('wemos-ip');
const minDbInput = document.getElementById('min-db');
const maxDbInput = document.getElementById('max-db');

let socket = null;
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let animationId = null;

const NUM_LEDS = 17;

// Create LED segments
for (let i = 0; i < NUM_LEDS; i++) {
    const segment = document.createElement('div');
    segment.classList.add('led-segment');
    if (i < 8) segment.classList.add('led-low');
    else if (i < 13) segment.classList.add('led-mid');
    else segment.classList.add('led-high');
    ledBar.appendChild(segment);
}

const ledSegments = document.querySelectorAll('.led-segment');

// WebSocket Connection
connectBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (!ip) return;

    if (socket) socket.close();

    statusText.innerText = 'Connecting...';
    statusText.style.color = '#eab308';

    socket = new WebSocket(`ws://${ip}:81`);

    socket.onopen = () => {
        statusText.innerText = 'Connected';
        statusText.classList.add('connected');
        connectBtn.innerText = 'Disconnect';
    };

    socket.onclose = () => {
        statusText.innerText = 'Disconnected';
        statusText.classList.remove('connected');
        connectBtn.innerText = 'Connect';
        statusText.style.color = '#ef4444';
    };

    socket.onerror = () => {
        statusText.innerText = 'Error Connecting';
    };
});

// Audio Processing
startBtn.addEventListener('click', async () => {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
        startBtn.innerText = 'Start Microphone';
        cancelAnimationFrame(animationId);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        microphone.connect(analyser);
        startBtn.innerText = 'Stop Microphone';

        update();
    } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Could not access microphone');
    }
});

function update() {
    animationId = requestAnimationFrame(update);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    let average = sum / dataArray.length;

    // Read dynamic thresholds
    const minDb = parseFloat(minDbInput.value) || 45;
    const maxDb = parseFloat(maxDbInput.value) || 120;

    // Simple mock of Decibels (0-255 mapped to dB)
    let db = Math.round((average / 255) * (maxDb - 20) + 20);

    // Constrain db display
    if (db < 10) db = 10;
    dbValueDisplay.innerText = db;

    // Calculate LED level based on dynamic mapping
    let ledLevel = 0;
    if (db >= minDb) {
        ledLevel = Math.round(((db - minDb) / (maxDb - minDb)) * NUM_LEDS);
    }

    if (ledLevel > NUM_LEDS) ledLevel = NUM_LEDS;
    if (ledLevel < 0) ledLevel = 0;

    // Update UI Preview
    ledSegments.forEach((seg, index) => {
        if (index < ledLevel) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });

    // Send to Wemos
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(ledLevel.toString());
    }
}
