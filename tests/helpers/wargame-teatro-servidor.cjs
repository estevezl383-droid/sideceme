// Laboratorio local: pantalla y función reales, base temporal inventada.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { laboratorio } = require('./wargame-lab.cjs');
const root = path.resolve(__dirname, '../..');
const punto = x => [1 + x, 1];
const base = { tipo: 'sideceme-teatro-base', cod: 'abierto',
  vias: [[1, 'J1', 'Camino ficticio', [punto(0), punto(.05), punto(.1), punto(.15), punto(.2), punto(.3), punto(.4)]]],
  rios: [], relieve: [], lagos: [], salares: [], fronteras: [],
  poblaciones: [['ALFA (FICTICIO)', 2, 1, 1], ['BETA (FICTICIO)', 3, 1.2, 1]],
};
const ejercicio = { nombre: 'LABORATORIO FICTICIO · ESCALA TEATRO', escala: 'teatro',
  unidades: [
    { id: 'A', tipo: 'unidad', designacion: 'AZUL FICTICIO', bando: 'propias', escalon: 'brigada', arma: 'motorizada', lng: 1, lat: 1 },
    { id: 'B', tipo: 'unidad', designacion: 'ROJO FICTICIO', bando: 'enemigas', escalon: 'brigada', arma: 'motorizada', lng: 1.2, lat: 1 },
  ],
  ops: { areaOps: { nombre: 'TEATRO FICTICIO', coords: [[.96,.96],[1.25,.96],[1.25,1.05],[.96,1.05],[.96,.96]] } },
};
function crearServidor() {
  let lab = laboratorio();
  const leaflet = path.dirname(require.resolve('leaflet/dist/leaflet.js'));
  const client = `<link rel="stylesheet" href="/__lab/leaflet.css"><script src="/__lab/leaflet.js"></script><script>
  window.supabase={createClient(){return {functions:{async invoke(name,args){
    if(name!=='wargame-ops')return {data:{ok:true,capas:[],areas:[]},error:null};
    const r=await fetch('/__lab/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args.body)});
    return r.ok?{data:await r.json(),error:null}:{data:null,error:{message:'Error de laboratorio',context:r}};
  }}}}};
  </script>`;
  const bootstrap = `<style>#screen-wargame.wg-full,#screen-wargame.wg-full #wg-game{top:22px!important;height:calc(100vh - 22px)!important}</style><script>
  (async()=>{
    getTokenSesion=()=> 'lab-token';getSession=()=>({tipo:'docente',user:{id:'LAB',rol:'profesor'}});
    showScreen('screen-wargame');await wgAbrir(91,'');_wgSyncParar();
    if(WG._maqTile)WG.map.removeLayer(WG._maqTile);
    document.getElementById('wg-map').style.background='#182d37';
    const aviso=document.createElement('div'),texto=document.createElement('span');texto.textContent='LABORATORIO LOCAL · DATOS FICTICIOS · SIN CONEXIÓN A PARTIDAS REALES';
    texto.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1';aviso.appendChild(texto);
    const paso=document.createElement('button');paso.textContent='AVANZAR PASO';paso.style.cssText='font:9px system-ui;margin-left:8px;flex-shrink:0';
    paso.onclick=async()=>{const r=await(await fetch('/__lab/paso')).json();if(r.pausado)_wgAviso('Primero iniciá el juego y pulsá PLAY.',2600);else _wgTicRecibido(r)};aviso.appendChild(paso);
    aviso.style.cssText='position:fixed;top:0;left:0;right:0;height:22px;display:flex;align-items:center;z-index:100000;background:#234438;color:#d9f3e5;font:10px system-ui;padding:3px';document.body.appendChild(aviso);
    window.labReady=true;
  })().catch(e=>{window.labError=String(e);console.error(e)});
  </script>`;
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', client)
    .replace(/<\/body>\s*<\/html>\s*$/, bootstrap + '</body></html>');
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://local');
      if (url.pathname === '/__lab/api') {
        let text = ''; for await (const part of req) text += part;
        const body = JSON.parse(text);
        const result = await lab.invoke(body.accion, body, { token: body.token });
        res.writeHead(result.status, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(result));
      }
      if (url.pathname === '/__lab/paso') {
        lab.clock.now += 5000;
        const result = await lab.invoke('tic');
        res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(result));
      }
      if (url.pathname === '/__lab/reiniciar') { lab = laboratorio(); res.end('OK'); return; }
      if (url.pathname === '/__lab/ejercicio.json') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(ejercicio)); }
      if (url.pathname === '/calcos/picb-teatro/v1/datos/teatro-base.json') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(base)); }
      if (url.pathname === '/' || url.pathname === '/index.html') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(html); }
      const esLeaflet = url.pathname.startsWith('/__lab/');
      const dir = esLeaflet ? leaflet : root;
      const rel = esLeaflet ? url.pathname.slice('/__lab/'.length) : '.' + decodeURIComponent(url.pathname);
      const file = path.resolve(dir, rel);
      if (!file.startsWith(dir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
      const mime = { '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png' };
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500, { 'Content-Type':'application/json' }); res.end(JSON.stringify({ok:false,error:e.message})); }
  });
  return { server, get lab() { return lab; }, ejercicio };
}
module.exports = { crearServidor, ejercicio };
if (require.main === module) {
  const { server } = crearServidor(), port = Number(process.env.PORT) || 4173;
  server.listen(port, '127.0.0.1', () => console.log(`Laboratorio local: http://127.0.0.1:${port}/ · escenario: /__lab/ejercicio.json`));
}
