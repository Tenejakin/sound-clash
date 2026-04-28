import board
import busio
import neopixel_spi
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app)

PIXELS_PER_STRIP = 20
NUM_STRIPS = 2
NUM_PIXELS = PIXELS_PER_STRIP * NUM_STRIPS
SOUND_TIMEOUT = 1.5

spi = busio.SPI(clock=board.SCLK, MOSI=board.MOSI)
pixels = neopixel_spi.NeoPixel_SPI(spi, NUM_PIXELS, brightness=1.0, auto_write=False, pixel_order=neopixel_spi.RGB)

app_active = False

sound_lock = threading.Lock()
last_sound_time = 0.0
last_sound_team = 'red'
last_sound_level = 0


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def sound_active():
    return time.time() - last_sound_time < SOUND_TIMEOUT


def render_sound_frame():
    with sound_lock:
        team = last_sound_team
        level = last_sound_level
    color = (255, 0, 0) if team == 'red' else (0, 0, 255)
    level = max(0, min(PIXELS_PER_STRIP, level))
    off = (0, 0, 0)
    for i in range(NUM_PIXELS):
        local = i % PIXELS_PER_STRIP
        pixels[i] = color if local < level else off
    pixels.show()


def animation_loop():
    colors = [(255, 0, 0), (0, 0, 255)]
    color_index = 0
    while not app_active:
        if sound_active():
            render_sound_frame()
            time.sleep(0.03)
            continue

        color = colors[color_index]
        for i in range(0, 256, 3):
            if app_active or sound_active():
                break
            pixels.fill(tuple(int(c * i / 255) for c in color))
            pixels.show()
            time.sleep(0.01)
        for i in range(255, -1, -3):
            if app_active or sound_active():
                break
            pixels.fill(tuple(int(c * i / 255) for c in color))
            pixels.show()
            time.sleep(0.01)
        color_index = (color_index + 1) % 2


threading.Thread(target=animation_loop, daemon=True).start()


@app.route('/sound', methods=['POST'])
def sound():
    global last_sound_time, last_sound_team, last_sound_level
    data = request.json or {}
    team = data.get('team', 'red')
    level = int(data.get('level', 0))
    with sound_lock:
        last_sound_team = team
        last_sound_level = level
        last_sound_time = time.time()
    return jsonify({'status': 'ok'})


@app.route('/set', methods=['POST'])
def set_color():
    global app_active
    app_active = True
    data = request.json
    color = hex_to_rgb(data.get('color', '#000000'))
    pixels.fill(color)
    pixels.show()
    return jsonify({'status': 'ok'})


@app.route('/set_pixel', methods=['POST'])
def set_pixel():
    global app_active
    app_active = True
    data = request.json
    index = data.get('index', 0)
    color = hex_to_rgb(data.get('color', '#000000'))
    pixels[index] = color
    pixels.show()
    return jsonify({'status': 'ok'})


@app.route('/clear', methods=['POST'])
def clear():
    global app_active
    app_active = True
    pixels.fill((0, 0, 0))
    pixels.show()
    return jsonify({'status': 'ok'})


@app.route('/status', methods=['GET'])
def status():
    return jsonify({'status': 'ok', 'num_pixels': NUM_PIXELS})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
