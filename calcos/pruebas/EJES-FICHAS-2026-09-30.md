# Colores y terminación manual sobre fichas

Base: a408a3555d031274e7b8fd6a8edd4f7d7a3a12c8, PR #33.

La prueba previa de doble clic terminaba sobre terreno; no cubría el clic sobre un icono. Durante el dibujo, las fichas eran no interactivas. Ahora, únicamente mientras se dibujan líneas de G-4, aceptan clic para agregar sus coordenadas y doble clic para agregar sus coordenadas y terminar. No se arrastran durante el dibujo. Fuera del dibujo mantienen su comportamiento anterior.

Se guarda la geometría manual, sin vincular relaciones de apoyo entre entidades ni generar cálculos operativos. No modifica servidor ni formato de ejercicios. EPA se muestra #ff8c00, EPE #00e5ff con línea discontinua; la lista y el primer trazo de vista previa usan los mismos colores.

Pruebas en Chromium con un ejercicio ficticio: ambos tipos de línea en 2D y 3D; primer clic sobre icono, punto intermedio sobre terreno, doble clic sobre otro icono; coordenadas inicial y final exactas, herramienta desactivada, colores correctos y sin errores de página. node --check aprobado. Constructor reproducible: python calcos/pruebas/construir-ejes-fichas.py.

Reversión: cambiar calcos/index.html para cargar ./assets/index-ejes-20260930.js, que se conserva.
