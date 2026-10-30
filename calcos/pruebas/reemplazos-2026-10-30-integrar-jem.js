// 🧩 Integrar el trabajo de los G (calcos/integrar/v1/integrar.js): el compilado sólo deja a la vista
// el catálogo de las hojas de cada sección y la función con la que abre un ejercicio. No cambia
// el formato del ejercicio ni el servidor.
module.exports = [
  {
    nombre: 'Dejar a la vista el catálogo de las hojas de cada sección',
    viejo: 'const aC={g1:uN(Nx.g1),g4:uN(Nx.g4),g5:uN(Nx.g5),eme:uN(Nx.eme)},',
    nuevo: 'const aC={g1:uN(Nx.g1),g4:uN(Nx.g4),g5:uN(Nx.g5),eme:uN(Nx.eme)},SIDcatalogoHojas=typeof window<"u"?window.SIDCatalogoHojas=()=>({cmte:hse.cmte,jem:hse.jem,g1:aC.g1,g2:sg,g3:ev,g4:aC.g4,g5:aC.g5,eme:aC.eme}):null,',
    veces: 1,
  },
  {
    nombre: 'Dejar a la vista la función que pone un ejercicio en la Mesa',
    viejo: ',Qu=je.useCallback(async Ee=>{const Qe=await og.abrir(Ee);',
    nuevo: ',SIDcargarMesa=window.SIDMesaCargar=mm,Qu=je.useCallback(async Ee=>{const Qe=await og.abrir(Ee);',
    veces: 1,
  },
]
