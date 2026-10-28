// Cartografía humanitaria separada de los resultados y del estado de la Mesa.
(() => {
  const script = document.currentScript;
  const destino = new URL('./index.html', script.src).href;
  let dialogo;
  function abrir() {
    if (!dialogo) {
      dialogo = document.createElement('dialog');
      dialogo.setAttribute('aria-label', 'Cartografía · 5 áreas');
      dialogo.style.cssText = 'width:98vw;max-width:none;height:96vh;max-height:none;padding:0;border:1px solid #277884;border-radius:10px;background:#edf3f3;overflow:hidden;';
      const barra = document.createElement('div');
      barra.style.cssText = 'height:42px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#123d48;color:white;font:14px system-ui';
      const titulo = document.createElement('span'); titulo.textContent = 'Cartografía · hasta cinco áreas';
      const cerrar = document.createElement('button'); cerrar.textContent = 'Volver a Calcos'; cerrar.onclick = () => dialogo.close(); cerrar.style.cssText='padding:6px 12px;cursor:pointer';
      const marco = document.createElement('iframe'); marco.title='Mapa de cinco áreas'; marco.src=destino; marco.style.cssText='width:100%;height:calc(100% - 42px);border:0;background:white';
      barra.append(titulo,cerrar);dialogo.append(barra,marco);document.body.append(dialogo);
    }
    dialogo.showModal();
  }
  function instalar() {
    if (typeof document === "undefined") return;
    const panel=document.querySelector('aside.panel');
    if(!panel || panel.querySelector('#sid-apoyo-humanitario'))return;
    const seccion=document.createElement('section');seccion.id='sid-apoyo-humanitario';seccion.className='bloque';
    const boton=document.createElement('button');boton.textContent='🗺️ Cartografía · 5 áreas';boton.type='button';boton.style.cssText='width:100%;padding:10px;background:#126976;color:white;border:1px solid #55bcae;border-radius:7px;cursor:pointer;font:600 13px system-ui';boton.onclick=abrir;
    seccion.append(boton);
    const cabecera=panel.querySelector('.panel-titulo');if(cabecera)cabecera.after(seccion);else panel.prepend(seccion);
  }
  new MutationObserver(instalar).observe(document.body,{childList:true,subtree:true});instalar();
})();
