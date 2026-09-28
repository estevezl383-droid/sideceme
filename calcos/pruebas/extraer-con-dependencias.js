// Como extraer.cargar(), pero si una función pide un nombre que no se pidió
// («X is not defined»), lo agrega y vuelve a probar. Sirve para traer del
// compilado catálogos que usan muchos ayudantes (p. ej. los símbolos de tareas).
const { cargar } = require('./extraer')

function cargarConDependencias(ruta, nombres, prueba = () => {}, globales = {}) {
  const pedidos = [...nombres]
  for (let i = 0; i < 80; i++) {
    let ctx
    try {
      ctx = cargar(ruta, pedidos, globales)
      prueba(ctx)
      return ctx
    } catch (e) {
      const m = /^(\w+|\$\w*) is not defined$/.exec(String(e && e.message))
      if (!m || pedidos.includes(m[1])) throw e
      pedidos.push(m[1])
    }
  }
  throw new Error('Demasiadas dependencias: ' + pedidos.join(', '))
}

module.exports = { cargarConDependencias }
