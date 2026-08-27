# Generador de Calcos v1.60.0 → SIDECEME /calcos

Corrige las dos cosas que reportaste sobre la v1.59 (que ya está publicada).

## 1 · Ahora SÍ se mueve la magnitud de los límites

Eran dos trabas distintas:

- **Con una herramienta encendida, nada del calco se podía agarrar.** Como el panel de
  Medidas se usa con la herramienta prendida para seguir trazando, la marca nunca respondía.
  Ahora **las marcas de magnitud se agarran siempre**, incluso mientras estás dibujando: son
  chicas y no se comen el clic del trazo salvo justo encima.
- **Los límites trazados antes de la v1.59** no tenían marca propia: su escalón era un dibujo
  fijo, imposible de tocar. Ahora ese escalón **también se arrastra**, y el primer arrastre lo
  convierte en marca suelta como cualquier otra (girar, cambiar de escalón, borrar). **No hay
  que rehacer ningún límite ya trazado.**

Si borrás la marca de un límite, el escalón vuelve a mostrarse en el medio, porque un
**Límite** por definición lleva su magnitud. Para una línea sin escalón está
**─ Línea (sin magnitud)**.

## 2 · Las cruces ✥ ya no tapan el calco

Con el ASDI desplegado había **seis cruces fijas** (el área más las cinco compañías) justo
encima de lo que hay que mirar. Ahora **no se dibuja ninguna**: la cruz aparece sola cuando
acercás el puntero al **centro** de un área — una a la vez, la del área más cercana — y
desaparece al alejarte. El arrastre funciona igual que antes: se lleva el área con sus
puestos adentro.

## Cómo se sube: UN solo paso

1. `https://github.com/estevezl383-droid/sideceme` → **Add file → Upload files**.
2. Arrastrar la carpeta **`calcos`** que está al lado de este LEEME.
3. **Commit changes**. GitHub Pages tarda 1-2 minutos.

## Cómo comprobar que subió

Con el ASDI desplegado, **el calco tiene que verse sin cruces**; al acercar el puntero al
centro del área aparece una sola. Y con la herramienta **Límite** todavía encendida, la
**XX** del límite tiene que dejarse arrastrar por la línea. Si no, es caché: Cmd+Shift+R.
