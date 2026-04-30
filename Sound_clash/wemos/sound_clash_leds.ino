// ============================================================
// sound_clash_leds.ino
// WeMos D1 Mini — Sound Clash LED Controller
//
// Board  : LOLIN(WeMos) D1 R2 & mini
// Library: Adafruit NeoPixel (install via Library Manager)
//
// Wiring : NeoPixel DATA → D3 (GPIO0)
//          NeoPixel 5V  → 5V rail
//          NeoPixel GND → GND (shared with Pi)
//          Add 300-500Ω resistor in series on DATA line
//          Add 1000µF cap across 5V/GND near strip
// ============================================================

#include <Adafruit_NeoPixel.h>

// ─── Configuration ────────────────────────────────────────────
#define LED_PIN       D3          // GPIO0 — data line to strip
#define LED_COUNT     17
#define BAUD_RATE     115200
#define SERIAL_TIMEOUT_MS  5     // readStringUntil blocks at most 5 ms

// dB range mapped to strip fill during TRACK
#define DB_MIN_FILL   85         // sustain threshold — 1 LED per side
#define DB_MAX_FILL   120        // max — full 8 LEDs per side

// Brightness limits (0–255)
#define BRIGHTNESS_GLOBAL  200   // global strip brightness cap (power/heat)
#define BREATH_MIN         5
#define BREATH_MAX         80
#define BREATH_PERIOD_MS   1500  // one full breath cycle


// ─── State Machine ────────────────────────────────────────────
enum LedState { STATE_IDLE, STATE_MONITOR, STATE_TRACK, STATE_COMPLETE };

LedState currentState = STATE_IDLE;
bool     isRed        = true;   // true = red team, false = blue team
int      currentDb    = 0;

// ─── NeoPixel Instance ────────────────────────────────────────
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// ─── Colour Helpers ───────────────────────────────────────────

uint32_t teamColor(uint8_t brightness) {
  return isRed ? strip.Color(brightness, 0, 0)
               : strip.Color(0, 0, brightness);
}

// Slightly whitened colour for peak LEDs
uint32_t teamColorPeak(uint8_t brightness) {
  uint8_t w = brightness / 5;
  return isRed ? strip.Color(brightness, w, w)
               : strip.Color(w, w, brightness);
}

void setAll(uint32_t color) {
  for (int i = 0; i < LED_COUNT; i++) strip.setPixelColor(i, color);
  strip.show();
}

void clearAll() {
  strip.clear();
  strip.show();
}

// ─── State: IDLE (alternating red/blue breathing) ─────────────
// Full cycle = 2 × BREATH_PERIOD_MS: first half breathes red, second half blue
void handleIdle() {
  uint32_t t       = millis() % (BREATH_PERIOD_MS * 2);
  bool     redPhase = (t < (uint32_t)BREATH_PERIOD_MS);
  uint32_t phaseT  = redPhase ? t : t - BREATH_PERIOD_MS;
  float    phase   = (float)phaseT / (float)BREATH_PERIOD_MS;
  float    sine    = (sin(phase * 2.0f * PI - PI / 2.0f) + 1.0f) / 2.0f;
  uint8_t  brightness = (uint8_t)(BREATH_MIN + sine * (BREATH_MAX - BREATH_MIN));
  uint32_t color   = redPhase ? strip.Color(brightness, 0, 0)
                               : strip.Color(0, 0, brightness);
  for (int i = 0; i < LED_COUNT; i++) strip.setPixelColor(i, color);
  strip.show();
}

// ─── State: MONITOR (slow breathing) ─────────────────────────
void handleMonitor() {
  uint32_t t    = millis() % BREATH_PERIOD_MS;
  float    phase = (float)t / (float)BREATH_PERIOD_MS;
  // Sine wave 0→1→0 over one period
  float    sine  = (sin(phase * 2.0f * PI - PI / 2.0f) + 1.0f) / 2.0f;
  uint8_t  brightness = (uint8_t)(BREATH_MIN + sine * (BREATH_MAX - BREATH_MIN));
  uint32_t color = teamColor(brightness);
  for (int i = 0; i < LED_COUNT; i++) strip.setPixelColor(i, color);
  strip.show();
}

// ─── State: TRACK (VU meter from both ends) ───────────────────
// 17 LEDs: 8 from each end, centre LED (index 8) stays dark.
// dB 85→120 maps to 0→8 LEDs lit per side.
void handleTrack() {
  strip.clear();

  int halfCount   = LED_COUNT / 2;   // 8
  int dbClamped   = constrain(currentDb, DB_MIN_FILL, DB_MAX_FILL);
  int ledsPerSide = map(dbClamped, DB_MIN_FILL, DB_MAX_FILL, 0, halfCount);

  // Top 2 LEDs per side get a peaked (whitened) colour
  int peakThreshold = halfCount - 2;  // indices 6 and 7 within ledsPerSide

  // Fill from left (0 → ledsPerSide-1)
  for (int i = 0; i < ledsPerSide; i++) {
    uint32_t color = (i >= peakThreshold)
                     ? teamColorPeak(BRIGHTNESS_GLOBAL)
                     : teamColor(BRIGHTNESS_GLOBAL);
    strip.setPixelColor(i, color);
  }

  // Fill from right (LED_COUNT-1 → LED_COUNT-ledsPerSide)
  for (int i = 0; i < ledsPerSide; i++) {
    uint32_t color = (i >= peakThreshold)
                     ? teamColorPeak(BRIGHTNESS_GLOBAL)
                     : teamColor(BRIGHTNESS_GLOBAL);
    strip.setPixelColor(LED_COUNT - 1 - i, color);
  }

  strip.show();
}

// ─── State: COMPLETE (breathe in team colour until next round) ─
void runCelebration() {
  // Transition straight to team-colour breathing — no blocking flash
  currentState = STATE_MONITOR;
}

// ─── Serial Parser ────────────────────────────────────────────
// Expects lines like: IDLE / MONITOR:red / TRACK:blue:092 / COMPLETE:red:107
void parseAndApply(String line) {
  line.trim();
  if (line.length() == 0) return;

  if (line == "IDLE") {
    currentState = STATE_IDLE;
    return;
  }

  int c1 = line.indexOf(':');
  int c2 = (c1 >= 0) ? line.indexOf(':', c1 + 1) : -1;

  String cmd = (c1 > 0) ? line.substring(0, c1) : line;
  String p1  = (c1 >= 0 && c2 > 0) ? line.substring(c1 + 1, c2) : (c1 >= 0 ? line.substring(c1 + 1) : "");
  String p2  = (c2 >= 0) ? line.substring(c2 + 1) : "";

  if (cmd == "MONITOR" && p1.length() > 0) {
    isRed = (p1 == "red");
    currentState = STATE_MONITOR;
    return;
  }

  if (cmd == "TRACK" && p1.length() > 0 && p2.length() > 0) {
    isRed     = (p1 == "red");
    currentDb = p2.toInt();
    currentState = STATE_TRACK;
    return;
  }

  if (cmd == "COMPLETE" && p1.length() > 0) {
    isRed = (p1 == "red");
    runCelebration(); // blocks ~4.6 s, then sets STATE_IDLE
    return;
  }
  // Unknown — ignore silently
}

// ─── Boot Sequence ────────────────────────────────────────────
// Red wipe left→right, blue wipe right→left, white flash, clear
void bootSequence() {
  // 1. Red chase left → right
  for (int i = 0; i < LED_COUNT; i++) {
    strip.setPixelColor(i, strip.Color(BRIGHTNESS_GLOBAL, 0, 0));
    strip.show();
    delay(40);
  }
  delay(150);

  // 2. Blue chase right → left
  for (int i = LED_COUNT - 1; i >= 0; i--) {
    strip.setPixelColor(i, strip.Color(0, 0, BRIGHTNESS_GLOBAL));
    strip.show();
    delay(40);
  }
  delay(150);

  // 3. Flash white twice
  for (int f = 0; f < 2; f++) {
    setAll(strip.Color(200, 200, 200));
    delay(100);
    clearAll();
    delay(80);
  }

  delay(200);
  clearAll(); // ready
}

// ─── Setup ────────────────────────────────────────────────────
void setup() {
  Serial.begin(BAUD_RATE);
  Serial.setTimeout(SERIAL_TIMEOUT_MS);

  strip.begin();
  strip.setBrightness(BRIGHTNESS_GLOBAL);
  strip.show(); // all off on boot

  bootSequence();
}

// ─── Main Loop ────────────────────────────────────────────────
void loop() {
  // Read any pending serial line from the Pi
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    parseAndApply(line);
  }

  // Render current state
  switch (currentState) {
    case STATE_IDLE:    handleIdle();    break;
    case STATE_MONITOR: handleMonitor(); break;
    case STATE_TRACK:   handleTrack();   break;
    case STATE_COMPLETE:
      // Should not be reached — runCelebration() self-transitions to IDLE
      clearAll();
      currentState = STATE_IDLE;
      break;
  }
}
