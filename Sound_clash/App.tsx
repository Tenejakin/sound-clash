import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import DecibelMeter from './components/DecibelMeter';
import Leaderboard from './components/Leaderboard';
import VirtualKeyboard from './components/VirtualKeyboard';
import { ScoreEntry, Team } from './types';
import { S } from './strings';



//test comment
// Logic Constants (configurable via .env)
const START_THRESHOLD = Number(import.meta.env.VITE_START_THRESHOLD) || 95;
const SUSTAIN_THRESHOLD = Number(import.meta.env.VITE_SUSTAIN_THRESHOLD) || 85;
const DROPOUT_GRACE_PERIOD = Number(import.meta.env.VITE_DROPOUT_GRACE_PERIOD) || 200;
const UI_UPDATE_INTERVAL = Number(import.meta.env.VITE_UI_UPDATE_INTERVAL) || 60;
const SCORE_MULTIPLIER = Number(import.meta.env.VITE_SCORE_MULTIPLIER) || 1;

const BACKGROUND_URL = import.meta.env.VITE_BACKGROUND_URL || '/r2/app_bg_final.png';
const LOGO_URL = import.meta.env.VITE_LOGO_URL || '/r2/Logo.png';
const JOTFORM_BASE_URL = import.meta.env.VITE_JOTFORM_URL || 'https://redbull.jotform.com/261021301301027';

// Pi LED API (Flask). Forced to http:// because led_api.py is plain HTTP.
// Defaults to the same hostname the app is served from, on port 5000.
const PI_LED_URL = import.meta.env.VITE_PI_LED_URL
  || `http://${window.location.hostname}:5000`;
const PI_NUM_PIXELS = Number(import.meta.env.VITE_PI_NUM_PIXELS) || 20;
const PI_MAX_DB = Number(import.meta.env.VITE_PI_MAX_DB) || 120;

interface RunSummary {
  duration: number;
  maxDb: number;
  rank: number;
  score: number;
  imageUrl?: string;
}

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showNicknameScreen, setShowNicknameScreen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showJotForm, setShowJotForm] = useState(false);
  const [countdown, setCountdown] = useState<number | 'SCREAM!' | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [displayDb, setDisplayDb] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isRunComplete, setIsRunComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [scoreAnimProgress, setScoreAnimProgress] = useState(0);
  const [resourceStatus, setResourceStatus] = useState<'testing' | 'online' | 'offline'>('testing');
  const [dbSaveStatus, setDbSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [savedToken, setSavedToken] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Logic Refs (Mutable state for the high-speed loop)
  const selectedTeamRef = useRef<Team | null>(null); // CRITICAL: Synchronous access to team
  const isTrackingRef = useRef(false);
  const isRunCompleteRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const dropoutStartTimeRef = useRef<number | null>(null);
  const lastDurationRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedImageRef = useRef<string | null>(null);
  const rawDbHistoryRef = useRef<number[]>([]);
  const dbBufferRef = useRef<number[]>([]);
  const lastUiUpdateTimeRef = useRef<number>(0);
  const updateAudioDataRef = useRef<() => void>(() => { });
  const logoDataUrlRef = useRef<string | null>(null);
  const pendingSaveArgsRef = useRef<[number, number, Team, string | null, string | null] | null>(null);

  // ─── WebSocket → LED control ───────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const ledWsRef = useRef<WebSocket | null>(null);
  const lastLedUpdateRef = useRef<number>(0);
  const LED_UPDATE_INTERVAL = 66; // 15 Hz cap for serial dB updates
  const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setResourceStatus('online');
    img.onerror = () => setResourceStatus('offline');
    img.src = BACKGROUND_URL;

    // Preload logo as a data URL so canvas.drawImage works without CORS taint
    fetch(LOGO_URL)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => { logoDataUrlRef.current = dataUrl; })
      .catch(() => { /* non-critical — logo just won't appear in composed image */ });

    const savedScores = localStorage.getItem('sound-clash-scores');
    if (savedScores) {
      try {
        setScores(JSON.parse(savedScores));
      } catch (e) {
        console.error("Failed to parse scores", e);
      }
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Target 9:16 Aspect Ratio
      const targetWidth = 1080;
      const targetHeight = 1920;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth > 0) {
        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetWidth / targetHeight;

        let sx, sy, sWidth, sHeight;

        if (videoRatio > targetRatio) {
          // Video is wider than target (Landscape) - Crop sides
          sHeight = video.videoHeight;
          sWidth = sHeight * targetRatio;
          sx = (video.videoWidth - sWidth) / 2;
          sy = 0;
        } else {
          // Video is taller than target - Crop top/bottom
          sWidth = video.videoWidth;
          sHeight = sWidth / targetRatio;
          sx = 0;
          sy = (video.videoHeight - sHeight) / 2;
        }

        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);



        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        capturedImageRef.current = dataUrl;
        return dataUrl;
      }
    }
    return null;
  }, []);

  // ─── Upload image to R2, return public URL ───────────────────────────────────
  const uploadImage = useCallback(async (imageDataUrl: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      });
      if (!res.ok) return null;
      const { url } = await res.json();
      console.log('[R2] Image uploaded:', url);
      return url as string;
    } catch (err) {
      console.error('[R2] Upload failed:', err);
      return null;
    }
  }, []);

  // ─── Save to PostgreSQL via API ─────────────────────────────────────────────
  const saveToDatabase = useCallback(async (duration: number, maxDb: number, team: Team, imageDataUrl: string | null, playerNickname: string | null) => {
    setDbSaveStatus('saving');
    try {
      // 1. Upload image to R2 first (non-blocking on failure)
      const imageUrl = imageDataUrl ? await uploadImage(imageDataUrl) : null;

      // 2. Save score with the R2 URL
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, duration, maxDb, imageUrl, nickname: playerNickname }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(`HTTP ${res.status}${body?.detail ? ': ' + body.detail : body?.error ? ': ' + body.error : ''}`);
      }
      const { id, download_token } = await res.json();
      setSavedToken(download_token);
      console.log('[DB] Score saved to server, id:', id);
      setDbSaveStatus('saved');
    } catch (err) {
      console.error('[DB] Failed to save score:', err);
      setDbSaveStatus('failed');
    }
  }, [uploadImage]);

  // Drain the pending save — called on JotForm submit or skip
  const flushSave = useCallback(() => {
    if (pendingSaveArgsRef.current) {
      saveToDatabase(...pendingSaveArgsRef.current);
      pendingSaveArgsRef.current = null;
    }
  }, [saveToDatabase]);

  // Detect JotForm submission via postMessage and advance to results
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.origin.includes('jotform.com')) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.action === 'submission-completed') {
          flushSave();
          setShowJotForm(false);
        }
      } catch { /* non-JSON message, ignore */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [flushSave]);

  // ─── Compose result image: clean photo with Red Bull logo at the top ────────
  const composeResultImage = useCallback(async (
    baseDataUrl: string,
    _duration: number,
    _maxDb: number,
    _team: Team,
    _rank: number,
    _score: number
  ): Promise<string | null> => {
    try {
      const W = 1080, H = 1920;
      const offscreen = document.createElement('canvas');
      offscreen.width = W;
      offscreen.height = H;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return null;

      // Draw base captured frame
      await new Promise<void>((resolve, reject) => {
        const base = new Image();
        base.onload = () => { ctx.drawImage(base, 0, 0, W, H); resolve(); };
        base.onerror = reject;
        base.src = baseDataUrl;
      });

      // Logo centred at the top
      const LOGO_TOP_Y = 80;
      const LOGO_MAX_W = 400;
      const LOGO_MAX_H = 150;

      if (logoDataUrlRef.current) {
        await new Promise<void>(resolve => {
          const logo = new Image();
          logo.onload = () => {
            const aspect = logo.naturalWidth / logo.naturalHeight;
            let lW = LOGO_MAX_W;
            let lH = lW / aspect;
            if (lH > LOGO_MAX_H) { lH = LOGO_MAX_H; lW = lH * aspect; }
            ctx.drawImage(logo, (W - lW) / 2, LOGO_TOP_Y, lW, lH);
            resolve();
          };
          logo.onerror = () => resolve();
          logo.src = logoDataUrlRef.current!;
        });
      }

      return offscreen.toDataURL('image/jpeg', 0.88);
    } catch (err) {
      console.error('[Compose] Image composition failed:', err);
      return null;
    }
  }, []);

  const saveScore = useCallback(async (duration: number, maxDb: number, team: Team, capturedDataUrl: string | null, playerNickname: string | null) => {
    // 1. HARD STOP Logic - Kill everything immediately
    isRunCompleteRef.current = true;
    isTrackingRef.current = false;

    // Stop the loop physically
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 2. Update UI State
    setIsRunComplete(true);
    setShowJotForm(true);
    setIsTracking(false);
    sendLedCommand({ state: 'complete', team, maxDb }); // LEDs: celebration flash

    const tempId = Math.random().toString(36).substr(2, 9);
    const score = Math.round(maxDb * (duration / 1000) * SCORE_MULTIPLIER);

    const initialEntry: ScoreEntry = {
      id: tempId,
      team,
      duration,
      maxDb,
      score,
      timestamp: Date.now(),
      nickname: playerNickname || undefined,
    };

    setScores(prev => {
      const updated = [...prev, initialEntry].sort((a, b) => b.score - a.score);
      localStorage.setItem('sound-clash-scores', JSON.stringify(updated));
      return updated;
    });

    // Query DB for how many people have a strictly higher score → determine rank
    let realRank = 1;
    try {
      const rankRes = await fetch(`/api/rank?score=${score}`);
      const rankData = await rankRes.json();
      console.log('[Rank] score:', score, 'response:', rankData);
      realRank = rankData.rank ?? 1;
    } catch (err) { console.error('[Rank] fetch failed:', err); }

    setRunSummary({ duration, maxDb, rank: realRank, score });

    // 3. Compose the result card image with stats + logo overlaid
    let composedDataUrl: string | null = null;
    if (capturedDataUrl) {
      composedDataUrl = await composeResultImage(capturedDataUrl, duration, maxDb, team, realRank, score);
      if (composedDataUrl) {
        // Update the results screen to show the composed card
        setRunSummary(prev => prev ? { ...prev, imageUrl: composedDataUrl! } : null);
      }
    }

    // 4. Stage the save — fired only on JotForm submit or skip
    pendingSaveArgsRef.current = [duration, maxDb, team, composedDataUrl ?? capturedDataUrl, playerNickname];
  }, [composeResultImage]);

  const updateAudioData = useCallback(() => {
    // CRITICAL: If run is marked complete, do absolutely nothing.
    if (isRunCompleteRef.current) return;

    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    for (const amplitude of dataArray) {
      sumSquares += amplitude * amplitude;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const rawDb = rms > 0 ? 20 * Math.log10(rms) + 115 : 0;
    const clampedDb = Math.max(0, rawDb);

    dbBufferRef.current.push(clampedDb);
    const now = performance.now();

    // ---------------------------------------------------------
    // CORE LOGIC MACHINE
    // ---------------------------------------------------------

    if (isTrackingRef.current) {
      // === STATE: RECORDING ===
      // Check if we are sustaining the scream
      if (clampedDb >= SUSTAIN_THRESHOLD) {
        // LOUD: Extend the duration
        rawDbHistoryRef.current.push(clampedDb);
        dropoutStartTimeRef.current = null; // Reset silence timer

        const currentDuration = now - (startTimeRef.current || now);
        lastDurationRef.current = currentDuration;
        setElapsedTime(currentDuration);
        // Rate-limited LED dB update (15 Hz)
        if (now - lastLedUpdateRef.current >= LED_UPDATE_INTERVAL) {
          sendLedCommand({ state: 'tracking', team: selectedTeamRef.current, currentDb: clampedDb });
          lastLedUpdateRef.current = now;
        }
      } else {
        // QUIET: Check for dropout
        if (dropoutStartTimeRef.current === null) {
          dropoutStartTimeRef.current = now;
        }

        const timeInSilence = now - dropoutStartTimeRef.current;

        if (timeInSilence > DROPOUT_GRACE_PERIOD) {
          // === FINISH CONDITION MET ===
          const finalDuration = lastDurationRef.current;

          // USE REF to guarantee we have the team, even if closure is stale
          const finalTeam = selectedTeamRef.current;
          const finalImage = capturedImageRef.current;

          // Calculate Max DB from history
          const history = rawDbHistoryRef.current;
          let finalMaxDb = 0;
          if (history.length > 0) {
            finalMaxDb = Math.max(...history);
          }

          if (finalTeam) {
            // STOP THE LOOP HERE
            saveScore(finalDuration, finalMaxDb, finalTeam, finalImage, nickname.trim() || null);
            return; // EXIT FUNCTION IMMEDIATELY to prevent next frame request
          }
        }
      }
    } else {
      // === STATE: MONITORING (Waiting for start) ===
      if (clampedDb >= START_THRESHOLD) {
        // === START CONDITION MET ===
        isTrackingRef.current = true;
        setIsTracking(true);
        sendLedCommand({ state: 'tracking', team: selectedTeamRef.current, currentDb: clampedDb }); // LEDs: VU meter starts
        startTimeRef.current = now;
        lastDurationRef.current = 0;
        dropoutStartTimeRef.current = null;
        rawDbHistoryRef.current = [clampedDb];
        captureFrame();
      }
    }

    // ---------------------------------------------------------
    // UI UPDATES
    // ---------------------------------------------------------
    const shouldUpdateUI = !isTrackingRef.current || (now - lastUiUpdateTimeRef.current > UI_UPDATE_INTERVAL);

    if (shouldUpdateUI) {
      if (dbBufferRef.current.length > 0) {
        const sum = dbBufferRef.current.reduce((a, b) => a + b, 0);
        const avg = sum / dbBufferRef.current.length;
        setDisplayDb(avg);
        dbBufferRef.current = [];
        lastUiUpdateTimeRef.current = now;
      } else {
        setDisplayDb(clampedDb);
      }
    }

    // Loop — always call via ref so we never use a stale closure
    animationFrameRef.current = requestAnimationFrame(() => updateAudioDataRef.current());
  }, [saveScore, captureFrame, nickname]);

  // Keep the ref in sync with the latest version of the callback
  updateAudioDataRef.current = updateAudioData;

  const sendLedCommand = useCallback((cmd: any) => {
    // Pi HTTP LED API — VU meter during 'tracking'
    if (cmd.state === 'tracking' && cmd.team && cmd.currentDb != null) {
      const range = Math.max(1, PI_MAX_DB - SUSTAIN_THRESHOLD);
      const normalized = (cmd.currentDb - SUSTAIN_THRESHOLD) / range;
      const level = Math.max(0, Math.min(PI_NUM_PIXELS, Math.round(normalized * PI_NUM_PIXELS)));
      fetch(`${PI_LED_URL}/sound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: cmd.team, level }),
        keepalive: true,
      }).catch(() => { /* ignore — Pi may be offline */ });
    }
    // Legacy WeMos paths (serial/WS) — kept as fallback if anything's still wired
    if (ledWsRef.current?.readyState === WebSocket.OPEN) {
      ledWsRef.current.send(JSON.stringify(cmd));
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  // WebSocket connection — auto-reconnects every 3 s
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen  = () => {
        console.log('[WS] Connected to LED server');
        ws.send(JSON.stringify({ state: 'idle' }));
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional unmount
        wsRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // LED WebSocket — connects to Python LED server on localhost:8765
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket('ws://localhost:8765');
      ledWsRef.current = ws;
      ws.onopen = () => {
        console.log('[LED WS] Connected to LED server on :8765');
        ws.send(JSON.stringify({ state: 'idle' }));
      };
      ws.onclose = () => {
        console.log('[LED WS] Disconnected — retrying in 3s');
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => { /* suppress — onclose handles retry */ };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (ledWsRef.current) {
        ledWsRef.current.onclose = null;
        ledWsRef.current.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Score counter animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunComplete || !runSummary) {
      setAnimatedScore(0);
      setScoreAnimProgress(0);
      return;
    }
    const target = runSummary.score;
    const DURATION = 2000; // ms
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / DURATION, 1);
      // ease-out expo: fast start, decelerates to final value
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setAnimatedScore(Math.round(eased * target));
      setScoreAnimProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRunComplete, runSummary?.score]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ref set to true once devices are initialised — lets launchMonitoring start instantly
  const devicesReadyRef = useRef(false);

  const initDevices = async (team: Team) => {
    devicesReadyRef.current = false;

    setIsRunComplete(false);
    isRunCompleteRef.current = false;
    setElapsedTime(0);
    setRunSummary(null);
    capturedImageRef.current = null;
    dbBufferRef.current = [];
    rawDbHistoryRef.current = [];
    lastUiUpdateTimeRef.current = performance.now();
    isTrackingRef.current = false;
    startTimeRef.current = null;
    dropoutStartTimeRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: { width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 } }
      });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(audioContext.destination);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      if (videoRef.current) {
        videoRef.current.addEventListener('loadedmetadata', () => { videoRef.current?.play(); }, { once: true });
        videoRef.current.srcObject = stream;
      }

      devicesReadyRef.current = true;
    } catch (err) {
      console.error('Sensor error:', err);
      setCountdown(null);
      setSelectedTeam(null);
      selectedTeamRef.current = null;
      alert('Sensors offline. Microphone and Camera permissions required.');
    }
  };

  const launchMonitoring = (team: Team) => {
    if (!devicesReadyRef.current) {
      // Devices still initialising — retry shortly so the audio loop always starts.
      setTimeout(() => launchMonitoring(team), 100);
      return;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsMonitoring(true);
    sendLedCommand({ state: 'monitoring', team });
    lastLedUpdateRef.current = 0; // ensure first tracking LED update fires immediately
    animationFrameRef.current = requestAnimationFrame(() => updateAudioDataRef.current());
  };

  const startCountdown = (team: Team) => {
    setSelectedTeam(team);
    selectedTeamRef.current = team;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    initDevices(team); // kick off device init in parallel with countdown
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 'SCREAM!') {
      const t = setTimeout(() => {
        setCountdown(null);
        launchMonitoring(selectedTeamRef.current!);
      }, 900);
      return () => clearTimeout(t);
    }
    if ((countdown as number) > 0) {
      const t = setTimeout(() => setCountdown(c => (c as number) - 1), 1000);
      return () => clearTimeout(t);
    }
    setCountdown('SCREAM!');
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps


  const rearmSystem = () => {
    setIsRunComplete(false);
    isRunCompleteRef.current = false;
    setElapsedTime(0);
    setRunSummary(null);
    setSavedToken(null);
    capturedImageRef.current = null;
    isTrackingRef.current = false;
    setIsTracking(false);
    startTimeRef.current = null;
    dropoutStartTimeRef.current = null;
    lastDurationRef.current = 0;
    dbBufferRef.current = [];
    rawDbHistoryRef.current = [];
    lastUiUpdateTimeRef.current = performance.now();

    // Restart animation loop if it was stopped
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => updateAudioDataRef.current());
  };

  const stopMonitoring = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setShowSplash(true);
    setShowNicknameScreen(false);
    setNickname('');
    setShowJotForm(false);
    setIsMonitoring(false);
    setIsTracking(false);
    setIsRunComplete(false);
    isRunCompleteRef.current = false;
    setSelectedTeam(null);
    selectedTeamRef.current = null;
    sendLedCommand({ state: 'idle' }); // LEDs: off on hard stop
    setElapsedTime(0);
    setRunSummary(null);
    capturedImageRef.current = null;
    rawDbHistoryRef.current = [];
  };

  return (
    /* Root fills exactly the portrait screen — no scrolling on primary views */
    <div className="relative h-screen overflow-hidden flex flex-col">

      {/* CRYSTAL CLEAR BACKGROUND */}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url('${BACKGROUND_URL}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: resourceStatus === 'online' ? 1 : 0.3
        }}
      />

      {/* SOFT VIGNETTE */}
      <div className="fixed inset-0 z-[2] bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* MAIN UI STACK — flex column fills the full 1920px height */}
      <div className="relative z-10 flex flex-col h-full max-w-[1000px] w-full mx-auto px-12 pt-8 pb-8">

        <header className="flex-none text-center mb-6 w-full flex flex-col items-center">
          <img
            src={LOGO_URL}
            alt="Sound Clash Logo"
            className="w-full max-w-[518px] h-auto drop-shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-2"
          />
          <div className="flex justify-center items-center gap-8 text-[15px] font-black text-white/70 tracking-[0.6em] uppercase mt-2">
            <span className={selectedTeam === 'red' ? 'text-red-400' : ''}>{S.TEAM_RED}</span>
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
            <span className={selectedTeam === 'blue' ? 'text-blue-400' : ''}>{S.TEAM_BLUE}</span>
          </div>
        </header>

        {/* Main section grows to fill remaining screen height */}
        <main className={`flex-1 min-h-0 flex flex-col ${!isMonitoring && !isStarting && countdown === null ? 'justify-center' : ''}`}>
          <section className={`${!isMonitoring && !isStarting && countdown === null ? 'w-full py-8' : 'flex-1'} flex flex-col relative bg-white/5 border border-white/20 rounded-3xl p-10 shadow-2xl transition-all duration-700 shadow-black/20 ${showJotForm ? 'overflow-visible backdrop-blur-none' : 'overflow-hidden backdrop-blur-3xl'}`}>

            {countdown !== null ? (
              /* COUNTDOWN SCREEN */
              <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in duration-300">
                <div
                  key={String(countdown)}
                  className={`font-black italic tracking-tighter leading-none animate-in zoom-in-50 duration-200 ${selectedTeam === 'red' ? 'text-red-500' : 'text-blue-500'}`}
                  style={{ fontSize: countdown === 'SCREAM!' ? '5rem' : '16rem' }}
                >
                  {countdown === 'SCREAM!' ? S.COUNTDOWN_SCREAM : countdown}
                </div>
              </div>
            ) : isStarting ? (
              /* CONNECTING TRANSITION — shown while getUserMedia is pending */
              <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in duration-300">
                <div className={`text-[11rem] font-black italic tracking-tighter uppercase leading-none mb-12 animate-pulse ${selectedTeam === 'red' ? 'text-red-500' : 'text-blue-500'}`}>
                  {selectedTeam?.toUpperCase()}
                </div>
                <div className="flex gap-5 mb-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 rounded-full ${selectedTeam === 'red' ? 'bg-red-500' : 'bg-blue-500'} animate-bounce`}
                      style={{ height: `${28 + (i % 3) * 14}px`, animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <p className={`text-sm font-black uppercase tracking-[0.8em] ${selectedTeam === 'red' ? 'text-red-400/70' : 'text-blue-400/70'} animate-pulse`}>
                  {S.CONNECTING}
                </p>
              </div>
            ) : !isMonitoring ? (
              showSplash ? (
                /* SPLASH SCREEN — tap to proceed to nickname entry */
                <button
                  onClick={() => { setShowSplash(false); setShowNicknameScreen(true); }}
                  className="flex-1 flex items-center justify-center w-full animate-in fade-in duration-500"
                >
                  <p className="font-black text-white tracking-wide uppercase" style={{ fontSize: '6rem', textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>
                    {S.TOUCH_TO_START}
                  </p>
                </button>
              ) : showNicknameScreen ? (
                /* NICKNAME SCREEN */
                <div className="flex flex-col items-center justify-center flex-1 gap-8 animate-in fade-in zoom-in duration-700">
                  <h2 className="font-black text-white uppercase tracking-wide" style={{ fontSize: '3rem', textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>
                    {S.NICKNAME_TITLE}
                  </h2>
                  <input
                    type="text"
                    value={nickname}
                    readOnly
                    inputMode="none"
                    placeholder={S.NICKNAME_PLACEHOLDER}
                    className="w-full max-w-sm text-center text-2xl font-black text-white bg-white/10 border border-white/30 rounded-2xl px-6 py-4 outline-none focus:border-white/60 placeholder:text-white/30 uppercase tracking-widest"
                  />
                  <VirtualKeyboard
                    value={nickname}
                    onChange={setNickname}
                    onSubmit={() => { if (nickname.trim()) setShowNicknameScreen(false); }}
                  />
                </div>
              ) : (
                /* TEAM SELECTION */
                <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in zoom-in duration-700 gap-6">
                  <h2 className="text-3xl font-black text-white tracking-wide">{S.SELECT_TITLE}</h2>

                  {/* RED team card */}
                  <button
                    onClick={() => startCountdown('red')}
                    className="w-full flex items-center justify-center px-6 py-12 active:scale-95 transition-all"
                    style={{ background: 'rgb(210,0,60)' }}
                  >
                    <span className="text-5xl font-black text-white uppercase tracking-[0.15em]">{S.TEAM_RED}</span>
                  </button>

                  {/* VS divider */}
                  <div className="flex items-center gap-4 flex-none w-full">
                    <div className="flex-1 h-px bg-red-500/40"></div>
                    <div className="flex items-baseline gap-3">
                      
                      <span className="text-2xl font-black text-white/40 tracking-widest">{S.VS_LABEL}</span>
                      
                    </div>
                    <div className="flex-1 h-px bg-blue-500/40"></div>
                  </div>

                  {/* BLUE team card */}
                  <button
                    onClick={() => startCountdown('blue')}
                    className="w-full flex items-center justify-center px-6 py-12 active:scale-95 transition-all"
                    style={{ background: 'rgb(15,0,105)' }}
                  >
                    <span className="text-5xl font-black text-white uppercase tracking-[0.15em]">{S.TEAM_BLUE}</span>
                  </button>
                </div>
              )
            ) : (
              /* MONITORING — fills card height */
              <div className="flex flex-col items-center flex-1">
                {!isRunComplete && (
                  <div className="w-full flex justify-between items-center mb-8 px-2 flex-none">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${selectedTeam === 'red' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_blue]'} ${isTracking ? 'animate-ping' : ''}`}></div>
                      <span className="text-sm font-black text-white uppercase tracking-[0.4em]">
                        {S.STATUS_MONITORING}
                      </span>
                      {dbSaveStatus === 'saving' && (
                        <span className="text-xs font-black text-yellow-400/80 uppercase tracking-widest animate-pulse">{S.DB_SYNCING}</span>
                      )}
                      {dbSaveStatus === 'failed' && (
                        <span className="text-xs font-black text-red-400/80 uppercase tracking-widest">{S.DB_ERROR}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className={`w-full flex-none transition-all duration-1000 ease-in-out ${isRunComplete ? 'opacity-0 scale-90 h-0 overflow-hidden' : 'opacity-100 mb-10'}`}>
                  <DecibelMeter currentDb={displayDb} threshold={START_THRESHOLD} team={selectedTeam!} />
                </div>

                <div className="text-center w-full flex flex-col items-center justify-center flex-1">

                  {/* Live timer while monitoring */}
                  {!isRunComplete && (
                    <div className="flex flex-col items-center transition-all duration-1000 w-full">
                      <div
                        className={`font-black tracking-tighter tabular-nums flex items-baseline leading-none ${isTracking
                          ? (selectedTeam === 'red' ? 'text-red-500' : 'text-blue-500')
                          : 'text-white/20'
                          }`}
                        style={{ fontSize: '14rem' }}
                      >
                        {(elapsedTime / 1000).toFixed(2)}
                        <span className="text-4xl ml-6 text-white/30 font-bold uppercase tracking-widest">S</span>
                      </div>
                    </div>
                  )}

                  {/* ── JOTFORM SCREEN — shown right after scream, before results ── */}
                  {isRunComplete && showJotForm && runSummary && (
                    <div className="relative isolate z-30 flex flex-col w-full flex-1 gap-4 animate-in fade-in duration-500 min-h-0 pointer-events-auto">
                      <iframe
                        src={`${JOTFORM_BASE_URL}?team_selection=${encodeURIComponent(selectedTeam ?? '')}&loudness_level=${encodeURIComponent(String(runSummary.score))}`}
                        className="w-full flex-1 rounded-2xl border border-white/20 min-h-0 pointer-events-auto"
                        style={{ minHeight: '70vh', touchAction: 'auto' }}
                        frameBorder="0"
                        title={S.JOTFORM_TITLE}
                      />
                      <button
                        onClick={() => { flushSave(); setShowJotForm(false); }}
                        className="w-full py-4 font-black text-white/40 uppercase tracking-widest text-sm hover:text-white/60 transition-all active:scale-95"
                      >
                        {S.JOTFORM_SKIP}
                      </button>
                    </div>
                  )}

                  {/* ── RESULTS SCREEN ── */}
                  {isRunComplete && !showJotForm && runSummary && (
                    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-700">

                      {/* Row 1: image + QR side by side */}
                      <div className="flex gap-4 w-full">
                        {/* Captured image */}
                        <div className="w-1/3 rounded-2xl overflow-hidden aspect-[9/16]"
                          style={{
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: '1px solid rgba(255,255,255,0.22)',
                          }}
                        >
                          {runSummary?.imageUrl ? (
                            <img src={runSummary.imageUrl} alt="Capture" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full animate-pulse bg-white/5" />
                          )}
                        </div>

                        {/* QR card */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl p-5"
                          style={{
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: '1px solid rgba(255,255,255,0.22)',
                          }}
                        >
                          <p className="text-base font-black text-white text-center leading-tight">{S.QR_HEADING}</p>
                          {savedToken ? (
                            <div className="bg-white p-2 rounded-xl w-full">
                              <QRCodeSVG value={`https://redbull.saia.si/photo/${savedToken}`} size={999} style={{ width: '100%', height: 'auto' }} level="M" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-white/10 rounded-xl animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Row 2: score */}
                      <div className="w-full rounded-2xl p-5 flex flex-col items-center"
                        style={{
                          background: 'rgba(255,255,255,0.10)',
                          backdropFilter: 'blur(32px)',
                          WebkitBackdropFilter: 'blur(32px)',
                          border: '1px solid rgba(255,255,255,0.22)',
                        }}
                      >
                        <p className="text-lg font-black text-white mb-1">{S.LABEL_YOUR_POINTS}</p>
                        <p className={`text-6xl font-black tabular-nums ${selectedTeam === 'red' ? 'text-red-400' : 'text-blue-400'}`}
                          style={{ opacity: scoreAnimProgress }}>
                          {animatedScore.toLocaleString('de-DE')}
                        </p>
                      </div>

                      {/* Row 3: duration + peak */}
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="rounded-2xl p-5 flex flex-col items-center"
                          style={{
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: '1px solid rgba(255,255,255,0.22)',
                          }}
                        >
                          <p className="text-sm font-black text-white mb-1">{S.LABEL_TIME}</p>
                          <p className="text-3xl font-black text-white tabular-nums">{(runSummary!.duration / 1000).toFixed(2)}<span className="text-base ml-1 opacity-50">{S.UNIT_SECONDS}</span></p>
                        </div>
                        <div className="rounded-2xl p-5 flex flex-col items-center"
                          style={{
                            background: 'rgba(255,255,255,0.10)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: '1px solid rgba(255,255,255,0.22)',
                          }}
                        >
                          <p className="text-sm font-black text-white mb-1">{S.LABEL_PEAK}</p>
                          <p className="text-3xl font-black text-white tabular-nums">{Math.round(runSummary!.maxDb)}<span className="text-base ml-1 opacity-50">{S.UNIT_DB}</span></p>
                        </div>
                      </div>

                      {/* Row 4: global ranking */}
                      <div className="w-full rounded-2xl p-5 flex flex-col items-center"
                        style={{
                          background: 'rgba(255,255,255,0.10)',
                          backdropFilter: 'blur(32px)',
                          WebkitBackdropFilter: 'blur(32px)',
                          border: '1px solid rgba(255,255,255,0.22)',
                        }}
                      >
                        <p className="text-lg font-black text-white mb-1">{S.LABEL_RANK}</p>
                        <p className="text-5xl font-black text-white">{runSummary!.rank}{S.LABEL_RANK_SUFFIX}</p>
                      </div>

                      {/* Reset button — returns to the splash/start screen */}
                      <button
                        onClick={stopMonitoring}
                        className={`w-full font-black py-8 rounded-2xl text-3xl tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${selectedTeam === 'red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                      >
                        {S.BTN_RESET}
                      </button>
                    </div>
                  )}

                  <div className={`flex flex-col items-center justify-center w-full transition-all duration-1000 ${isRunComplete ? 'hidden' : 'mt-10'}`}>
                    {isRunComplete ? null : isTracking ? (
                      <div className="flex gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className={`w-14 h-2 rounded-full ${selectedTeam === 'red' ? 'bg-red-500 shadow-lg' : 'bg-blue-500 shadow-lg'} animate-pulse`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center opacity-30 animate-pulse">
                        <p className="text-base font-black text-white uppercase tracking-[0.6em] mb-5">{S.SCANNING}</p>
                        <div className="flex gap-4">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden">
                    {isRunComplete ? (
                      <div className="flex flex-col items-center w-full max-w-2xl animate-in zoom-in-95 duration-1000">
                        <button
                          onClick={rearmSystem}
                          className={`w-full font-black py-12 rounded-2xl text-5xl tracking-[0.4em] transition-all transform hover:scale-[1.02] active:scale-95 shadow-2xl ${selectedTeam === 'red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                        >
                          {S.BTN_RESET}
                        </button>
                      </div>
                    ) : isTracking ? (
                      <div className="flex gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className={`w-14 h-2 rounded-full ${selectedTeam === 'red' ? 'bg-red-500 shadow-lg' : 'bg-blue-500 shadow-lg'} animate-pulse`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center opacity-30 animate-pulse">
                        <p className="text-base font-black text-white uppercase tracking-[0.6em] mb-5">
                          {S.SCANNING}
                        </p>
                        <div className="flex gap-4">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="flex-none mt-6 text-center opacity-20 border-t border-white/10 w-full pt-5">
          <p className="text-xs font-black text-white tracking-[0.8em] uppercase">{S.FOOTER}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;