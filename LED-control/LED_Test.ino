#include <FastLED.h>

/**
 * DIAGNOSTIC MODE: Only first 6 working?
 * 1. Check physical connection between LED 6 and LED 7.
 * 2. Power: 17 LEDs at full white draw ~1A. D3/GPIO0 has a pull-up that can weaken signals.
 */

#define DATA_PIN    D3    // Try D4 if D3 continues to fail
#define NUM_LEDS    17
#define BRIGHTNESS  32    // Lowered to 32 to rule out power dropouts
#define LED_TYPE    WS2811 // Using WS2811/WS2812 generic timing
#define COLOR_ORDER GRB

CRGB leds[NUM_LEDS];

void setup() {
  delay(2000);
  // Using a slightly more generic timing profile
  FastLED.addLeds<WS2812, DATA_PIN, GRB>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
  FastLED.setBrightness(BRIGHTNESS);
  FastLED.clear();
  FastLED.show();
}

void showColor(CRGB color, String name) {
  fill_solid(leds, NUM_LEDS, color);
  FastLED.show();
  delay(1000);
}

void loop() {
  // Cycle colors to check all channels
  showColor(CRGB::White, "White");
  showColor(CRGB::Red, "Red");
  showColor(CRGB::Green, "Green");
  showColor(CRGB::Blue, "Blue");

  // Wave to see signal flow
  for (int i = 0; i < NUM_LEDS; i++) {
    FastLED.clear();
    leds[i] = CRGB::White;
    if (i > 0) leds[i-1] = CRGB::Red; // Trail
    FastLED.show();
    delay(150);
  }
  
  FastLED.clear();
  FastLED.show();
  delay(1000);
}
