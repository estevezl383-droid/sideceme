"""Comprueba los metadatos de dibujos que Microsoft Word requiere."""
import sys, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

def validar(path):
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None, 'ZIP incompleto'
        for name in z.namelist():
            if name.endswith(('.xml', '.rels')):
                ET.fromstring(z.read(name))
        root = ET.fromstring(z.read('word/document.xml'))
        dibujos = root.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}docPr')
        assert dibujos, 'Faltan dibujos'
        ids = [d.get('id') for d in dibujos]
        assert len(ids) == len(set(ids)), 'Identificadores de dibujo repetidos'
        assert all(i and i.isdigit() for i in ids), 'Identificador inválido'
        assert all(d.get('name') for d in dibujos), 'Falta nombre obligatorio del dibujo'
    print(f'OK estructura Word: {path}')

if __name__ == '__main__':
    files = [Path(p) for p in sys.argv[1:]] or list(Path('calcos/pruebas/salidas-conceptos').glob('*.docx'))
    assert files, 'No hay documentos para validar'
    for path in files:
        validar(path)
