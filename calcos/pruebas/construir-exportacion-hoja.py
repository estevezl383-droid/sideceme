"""Renueva el exportador de la hoja conservando la versión anterior."""
from pathlib import Path
base = Path(__file__).resolve().parents[1]
original = base / 'assets/index-autenticador-militar-20261001.js'
contenido = original.read_text()
antes = 'runtime.js?v=autenticador20261001'
despues = 'runtime.js?v=exportacion20261001'
assert contenido.count(antes) == 1
salida = base / 'assets/index-exportacion-hoja-20261001.js'
salida.write_text(contenido.replace(antes, despues))
indice = base / 'index.html'
indice.write_text(indice.read_text().replace(original.name, salida.name))
