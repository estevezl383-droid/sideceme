"""Comprueba los Word de la matriz de administración del riesgo (F2·P7 / F6·P3).

Lo que Word exige para abrirlos sin quejarse (XML bien formado, dibujos con id único y
nombre, filas de la tabla que suman las columnas de la grilla) y el formato militar:
carta apaisada, la clasificación arriba y abajo, la numeración de páginas al pie, el
membrete táctico en Arial 10 negrilla, la matriz de seis columnas, un solo nivel
general encerrado en un círculo y ninguna marca «[IA — verificar]».

    python3 word-riesgo.py [archivo.docx …]   (sin argumentos: salidas-riesgo/*.docx)
"""
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
WP = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}'


def texto(nodo):
    return ''.join(t.text or '' for t in nodo.iter(W + 't'))


def validar(path):
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None, 'ZIP incompleto'
        partes = {}
        for name in z.namelist():
            if name.endswith(('.xml', '.rels')):
                partes[name] = ET.fromstring(z.read(name))
        for k in ['[Content_Types].xml', 'word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/header1.xml', 'word/footer1.xml']:
            assert k in partes, f'falta {k}'
        doc = partes['word/document.xml']
        cuerpo = doc.find(W + 'body')

        # Carta apaisada.
        pg = cuerpo.find(W + 'sectPr').find(W + 'pgSz')
        assert pg.get(W + 'orient') == 'landscape' and int(pg.get(W + 'w')) > int(pg.get(W + 'h')), 'la hoja no es apaisada'

        # Clasificación arriba y abajo; numeración «PAGE - NUMPAGES» al pie.
        clas = texto(partes['word/header1.xml']).strip()
        assert clas in ('SECRETO', 'RESERVADO', 'CONFIDENCIAL'), f'encabezado: {clas!r}'
        pie = ET.tostring(partes['word/footer1.xml'], encoding='unicode')
        assert clas in texto(partes['word/footer1.xml']), 'el pie no repite la clasificación'
        instr = ''.join(i.text or '' for i in partes['word/footer1.xml'].iter(W + 'instrText'))
        assert 'PAGE' in instr and 'NUMPAGES' in instr and ' - ' in texto(partes['word/footer1.xml']), 'falta la numeración «1 - N»'
        del pie

        # Membrete táctico: los párrafos antes del título, en Arial 10 negrilla.
        pars = list(cuerpo)
        i_titulo = next(i for i, p in enumerate(pars) if p.tag == W + 'p' and 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO' in texto(p))
        membrete = [p for p in pars[:i_titulo] if p.tag == W + 'p' and texto(p).strip()]
        assert len(membrete) >= 2, 'falta el membrete táctico'
        assert any(texto(p).startswith('No. ') for p in membrete), 'falta el número del documento'
        for p in membrete:
            for r in p.iter(W + 'r'):
                if r.find(W + 't') is None:
                    continue
                rpr = r.find(W + 'rPr')
                assert rpr is not None and rpr.find(W + 'b') is not None, f'membrete sin negrilla: {texto(p)!r}'
                assert rpr.find(W + 'sz').get(W + 'val') == '20', f'membrete no es de 10 puntos: {texto(p)!r}'
                assert rpr.find(W + 'rFonts').get(W + 'ascii') == 'Arial', 'membrete no es Arial'

        # La matriz: seis columnas; cada fila suma las seis.
        tablas = cuerpo.findall(W + 'tbl')
        assert len(tablas) == 1, 'tiene que haber una sola matriz'
        grilla = tablas[0].find(W + 'tblGrid').findall(W + 'gridCol')
        assert len(grilla) == 6, 'la matriz tiene seis columnas (E a J)'
        for n, tr in enumerate(tablas[0].findall(W + 'tr')):
            suma = 0
            for tc in tr.findall(W + 'tc'):
                assert tc.find(W + 'p') is not None, f'celda sin párrafo en la fila {n + 1}'
                gs = tc.find(W + 'tcPr').find(W + 'gridSpan')
                suma += int(gs.get(W + 'val')) if gs is not None else 1
            assert suma == 6, f'la fila {n + 1} ocupa {suma} columnas'
        t = texto(tablas[0])
        assert re.search(r'(K\. Determinar el nivel general|11\. DETERMINAR EL NIVEL DE RIESGO GLOBAL)', t), 'falta la casilla K / 11'
        for nivel in ['BAJO (B)', 'MODERADO (M)', 'ALTO (A)', 'SUMAMENTE ALTO (SA)']:
            assert nivel in t, f'falta {nivel}'

        # Dibujos (el círculo de K): id único y numérico, con nombre (Word lo exige).
        dibujos = doc.findall('.//' + WP + 'docPr')
        ids = [d.get('id') for d in dibujos]
        assert len(ids) == len(set(ids)), 'identificadores de dibujo repetidos'
        assert all(i and i.isdigit() for i in ids), 'identificador de dibujo inválido'
        assert all(d.get('name') for d in dibujos), 'dibujo sin nombre'
        assert len(dibujos) <= 1, 'más de un nivel encerrado'

        todo = ET.tostring(doc, encoding='unicode')
        assert '[IA' not in todo, 'quedó una marca «[IA — verificar]»'
        assert 'EL COMANDANTE' in texto(cuerpo), 'falta la firma del Comandante'
    print(f'OK matriz de riesgo: {path} ({clas}, {len(membrete)} líneas de membrete, {len(tablas[0].findall(W + "tr"))} filas, {len(dibujos)} círculo)')


if __name__ == '__main__':
    files = [Path(p) for p in sys.argv[1:]] or sorted(Path(__file__).parent.joinpath('salidas-riesgo').glob('*.docx'))
    assert files, 'No hay documentos para validar'
    for path in files:
        validar(path)
