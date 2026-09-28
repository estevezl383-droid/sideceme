# Hoja gráfica de conceptos entrelazados

Este módulo sustituye la presentación narrativa de F2·P1 por una hoja gráfica, con formulario de unidades, tarea, propósito, fases y relaciones declaradas por el usuario. Conserva las claves anteriores como antecedentes. Se guarda dentro de `g3.entrelazados`, mediante el guardado existente del ejercicio.

Los datos se introducen y revisan en el formulario. No se deducen tareas ni relaciones tácticas. El Word contiene imágenes de las láminas; el contenido se edita en la aplicación y se vuelve a exportar. Los textos largos se conservan en continuaciones.

La integración parte exclusivamente de `index-zhbwncsH.js`, sin recompilar el ZIP antiguo. El archivo original se conserva. `../pruebas/integrar-conceptos.cjs` enumera todos los reemplazos y verifica la reversión exacta. El único cambio en `calcos/index.html` es la referencia al compilado integrado.

`runtime.js` recibe React y los constructores de Word que ya incorpora la aplicación, antes del render inicial. No carga bibliotecas de terceros ni envía datos a servidores externos. `editor.js` es JavaScript legible generado desde el componente JSX; `modelo.js` comparte la composición entre vista y exportación.

Pruebas:

```bash
node calcos/pruebas/conceptos.cjs
PLAYWRIGHT_MODULE=/ruta/a/playwright node calcos/pruebas/e2e/conceptos.cjs
```

El workflow `Validar conceptos entrelazados` ejecuta las pruebas en Chromium en escritorio y móvil y conserva las capturas y los Word de muestra.

Para revertir la integración, restaure en `calcos/index.html` la referencia a `./assets/index-zhbwncsH.js`. Los textos anteriores no se eliminan; la estructura nueva permanece almacenada y sólo la muestra el editor gráfico.
