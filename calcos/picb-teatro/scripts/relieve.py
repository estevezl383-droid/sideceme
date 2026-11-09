#!/usr/bin/env python3
"""🌎 PICB del Teatro — relieve GENERALIZADO a escala 1:1.000.000.

Baja el modelo de elevación (tiles Terrarium de AWS, nivel 8 ≈ 600 m por píxel), calcula la
pendiente y la clasifica para fuerzas mecanizadas:
   · severo       pendiente media > 14°  (cordillera, volcanes, quebradas profundas)
   · restringido  7° a 14°               (serranías, faldeos)
   · el resto     llanura / altiplano    (sin polígono)
Escribe una grilla (uint8: 0 llano, 1 restringido, 2 severo) + su georreferencia en JSON; los
polígonos los arma generalizar.mjs con d3-contour.

Uso:  python3 relieve.py SALIDA_DIR [oeste sur este norte]
Fuente: https://registry.opendata.aws/terrain-tiles/ (atribución: github.com/tilezen/joerd).
"""
import io, json, math, os, sys, time, urllib.request
import numpy as np
from PIL import Image

Z = 8
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

def tile_x(lon, z): return (lon + 180.0) / 360.0 * 2 ** z
def tile_y(lat, z):
    r = math.radians(lat)
    return (1.0 - math.log(math.tan(r) + 1.0 / math.cos(r)) / math.pi) / 2.0 * 2 ** z
def lat_de_y(y, z):
    n = math.pi - 2.0 * math.pi * y / 2 ** z
    return math.degrees(math.atan(math.sinh(n)))

def bajar(x, y, cache):
    ruta = os.path.join(cache, f'{Z}_{x}_{y}.png')
    if not os.path.exists(ruta):
        for intento in range(4):
            try:
                req = urllib.request.Request(URL.format(z=Z, x=x, y=y), headers={'User-Agent': 'SIDECEME-teatro/1.0'})
                with urllib.request.urlopen(req, timeout=60) as r:
                    datos = r.read()
                with open(ruta, 'wb') as f:
                    f.write(datos)
                break
            except Exception as e:
                time.sleep(2 * (intento + 1))
        else:
            return None
    im = np.asarray(Image.open(ruta).convert('RGB'), dtype=np.float64)
    return im[:, :, 0] * 256.0 + im[:, :, 1] + im[:, :, 2] / 256.0 - 32768.0

def main():
    salida = sys.argv[1]
    oeste, sur, este, norte = (float(v) for v in (sys.argv[2:6] if len(sys.argv) >= 6 else (-71.6, -25.0, -57.4, -9.5)))
    cache = os.path.join(salida, 'tiles')
    os.makedirs(cache, exist_ok=True)
    x0, x1 = int(tile_x(oeste, Z)), int(tile_x(este, Z))
    y0, y1 = int(tile_y(norte, Z)), int(tile_y(sur, Z))
    W, H = (x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256
    dem = np.zeros((H, W), dtype=np.float64)
    faltan = 0
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            t = bajar(tx, ty, cache)
            if t is None:
                faltan += 1
                continue
            dem[(ty - y0) * 256:(ty - y0 + 1) * 256, (tx - x0) * 256:(tx - x0 + 1) * 256] = t
    dem = np.maximum(dem, -100.0)
    # tamaño del píxel en metros (Mercator: varía con la latitud de cada fila)
    filas = np.arange(H) + 0.5
    lats = np.array([lat_de_y(y0 + f / 256.0, Z) for f in filas])
    px_m = 40075016.686 * np.cos(np.radians(lats)) / (2 ** Z * 256)
    dzdx = np.zeros_like(dem); dzdy = np.zeros_like(dem)
    dzdx[:, 1:-1] = (dem[:, 2:] - dem[:, :-2]) / (2.0 * px_m[:, None])
    dzdy[1:-1, :] = (dem[2:, :] - dem[:-2, :]) / (2.0 * px_m[1:-1, None])
    pend = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    # media en 3×3 (≈ 1,8 km): lo que se ve a escala teatro, no cada barranco
    def media(a, r=1):
        acc = np.zeros_like(a); n = 0
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                acc += np.roll(np.roll(a, dy, 0), dx, 1); n += 1
        return acc / n
    pm = media(pend, 1)
    clase = np.zeros((H, W), dtype=np.uint8)
    clase[pm >= 7.0] = 1
    clase[(pm >= 14.0) | (dem >= 5200.0)] = 2
    # recorte a la caja pedida
    c0, c1 = int((tile_x(oeste, Z) - x0) * 256), int((tile_x(este, Z) - x0) * 256)
    r0, r1 = int((tile_y(norte, Z) - y0) * 256), int((tile_y(sur, Z) - y0) * 256)
    clase = clase[r0:r1, c0:c1]
    alt = np.clip(dem[r0:r1, c0:c1], 0, 7000)
    # la grilla va en filas de Mercator: se guardan las latitudes de cada fila
    lats_f = [round(lat_de_y(y0 + (r0 + f + 0.5) / 256.0, Z), 6) for f in range(clase.shape[0])]
    lon_c = [round((x0 + (c0 + c + 0.5) / 256.0) / 2 ** Z * 360.0 - 180.0, 6) for c in range(clase.shape[1])]
    with open(os.path.join(salida, 'relieve-clases.bin'), 'wb') as f:
        f.write(clase.tobytes())
    with open(os.path.join(salida, 'relieve-altura.bin'), 'wb') as f:
        f.write((alt / 30.0).astype(np.uint8).tobytes())   # 30 m por unidad (0–7.650 m)
    json.dump({'z': Z, 'ancho': int(clase.shape[1]), 'alto': int(clase.shape[0]), 'lats': lats_f, 'lons': lon_c,
               'faltan': faltan, 'umbral': {'restringido': 7, 'severo': 14, 'altura_severo': 5200}},
              open(os.path.join(salida, 'relieve.json'), 'w'))
    print(f'relieve: {clase.shape[1]}×{clase.shape[0]} px, severo {np.mean(clase == 2) * 100:.1f} %, restringido {np.mean(clase == 1) * 100:.1f} %, tiles faltantes {faltan}')

if __name__ == '__main__':
    main()
