from pathlib import Path
import json, hashlib
base=Path('calcos/assets/index-formato-militar-ia-20261001.js')
s=base.read_text(); cambios=[]
def reemplazar(a,b,n=1):
 global s
 assert s.count(a)==n,(a[:110],s.count(a),n)
 cambios.append({'viejo':a,'nuevo':b,'veces':n});s=s.replace(a,b)
s='import SIDInicioEjercicio from "../inicio-ejercicio/v1/editor.js";\nimport {configurarIdentidad as SIDIdentidadConfig,migrarArmas as SIDIdentidadArmas,exigirIdentidad as SIDIdentidadExigir} from "../inicio-ejercicio/v1/modelo.js";\n'+s
reemplazar('runtime.js?v=ia20261001','runtime.js?v=inicio20261001')
reemplazar('[en,hn]=je.useState([]),','[en,hn]=je.useState([]),[SIDpasoUnidad,SIDsetPasoUnidad]=je.useState(false),[SIDleyendoDocs,SIDsetLeyendoDocs]=je.useState(false),')
# Callback aplica únicamente los campos de identidad; mantiene todos los otros datos.
reemplazar('SIDMilContexto({ejercicio:wn,','const SIDelegirUnidad=je.useCallback(seleccion=>{const nuevo=SIDIdentidadConfig({ops:Lt,ordenSup:Tn,unidadAnalisis:ut},wn,seleccion);Sn(prev=>({...prev,unidadConsiderada:nuevo.ops.unidadConsiderada,contextoDocumental:{...prev.contextoDocumental,...nuevo.ops.contextoDocumental}}));$s(prev=>({...prev,unidad:nuevo.ordenSup.unidad}));Ft(prev=>({...prev,nombre:nuevo.unidadAnalisis.nombre,...(seleccion.escalon?{magnitud:seleccion.escalon}:{})}));},[wn,Lt,Tn,ut]);SIDMilContexto({exigirIdentidad:()=>{if(Bn&&Tn?.unidad)return;try{SIDIdentidadExigir(Lt)}catch(e){SIDsetPasoUnidad(true);Yr(true);throw e}},ejercicio:wn,')
reemplazar('const Qe=await Z4e(Ee);hn(ct=>[...ct,...Qe]);','SIDsetLeyendoDocs(true);const Qe=await Z4e(Ee);hn(ct=>[...ct,...Qe]);Sn(prev=>({...prev,unidadConsiderada:{...prev.unidadConsiderada,confirmada:false}}));SIDsetPasoUnidad(false);Yr(true);')
reemplazar('he("No se pudo leer un documento: "+Qe.message)}}},[])','he("No se pudo leer un documento: "+Qe.message)}finally{SIDsetLeyendoDocs(false)}}},[])')
reemplazar('um=je.useMemo(()=>({orientacion:ri,onOrientacion:up,documentos:en,onAgregarDocumentos:gv,onQuitarDocumento:lu,onCategoria:J2,aviso:gg}),[ri,en,gv,lu,J2,gg])','um=je.useMemo(()=>({orientacion:ri,onOrientacion:up,documentos:en,onAgregarDocumentos:gv,onQuitarDocumento:lu,onCategoria:J2,aviso:gg,unidadConsiderada:Lt.unidadConsiderada,onElegirUnidad:SIDelegirUnidad,pasoUnidad:SIDpasoUnidad,onPasoUnidad:SIDsetPasoUnidad,cargandoDocumentos:SIDleyendoDocs,finalizado:Bn}),[ri,en,gv,lu,J2,gg,Lt.unidadConsiderada,SIDelegirUnidad,SIDpasoUnidad,SIDleyendoDocs,Bn])')
reemplazar('mm=je.useCallback((Ee,Qe,ot)=>{','mm=je.useCallback((Ee,Qe,ot)=>{Ee=SIDIdentidadArmas(Ee,Qe);SIDsetPasoUnidad(false);')
reemplazar('Sn(Ee.ops||Vt)','Sn({...Vt,...Ee.ops||{}})')
# Evita que una unidad de otro ejercicio sobreviva al abrir un archivo antiguo.
reemplazar('Ee.unidadAnalisis&&Ft(Ee.unidadAnalisis)','Ft(Ee.unidadAnalisis||{magnitud:"brigada",especialidad:"Armas combinadas",capacidades:"",ingenieria:false})')
reemplazar('Ju=je.useCallback(async({conCoc:Ee=!1}={})=>{','Ju=je.useCallback(async({conCoc:Ee=!1}={})=>{try{if(!(Bn&&Tn?.unidad))SIDIdentidadExigir(Lt)}catch(err){SIDsetPasoUnidad(true);Yr(true);throw err;}')
reemplazar('fr,Tn,qd,_g,ne]),vv=','fr,Tn,qd,_g,ne,Bn]),vv=')
# Inicio grande y legible; sólo el panel de ejercicios.
reemplazar('return f.jsxs("div",{style:or.panel,children:','return f.jsxs("div",{className:"sid-inicio-ejercicio",style:or.panel,children:')
reemplazar('f.jsx(rD,{...v})','f.jsx(SIDInicioEjercicio,{react:je,aporte:v,children:f.jsx(rD,{...v})})')
# Identidad visible desde el nombre de ejercicio y disponible sin adjuntos.
reemplazar('fontSize:12,fontWeight:700,color:"#fbbf24",marginBottom:4','fontSize:16,fontWeight:700,color:"#fbbf24",marginBottom:8')
# Guardar un borrador sigue permitido; cerrar por X con documentos exige confirmar.
reemplazar('f.jsx("button",{style:or.btnX,onClick:g,children:"✕"})','f.jsx("button",{style:or.btnX,onClick:()=>{if(v?.cargandoDocumentos||v?.documentos?.length&&!v?.unidadConsiderada?.confirmada){v.onPasoUnidad(true);B("COMPLETE SU UNIDAD CONSIDERADA ANTES DE CONTINUAR.");return;}g()},children:"✕"})')
salida=Path('calcos/assets/index-inicio-ejercicio-20261001.js');salida.write_text(s)
Path('calcos/pruebas/reemplazos-inicio-ejercicio.json').write_text(json.dumps({'sha256Base':hashlib.sha256(base.read_bytes()).hexdigest(),'sha256Salida':hashlib.sha256(s.encode()).hexdigest(),'reemplazos':cambios},ensure_ascii=False))
p=Path('calcos/index.html');h=p.read_text().replace('index-formato-militar-ia-20261001.js','index-inicio-ejercicio-20261001.js')
if './inicio-ejercicio/v1/estilo.css' not in h:h=h.replace('</head>','  <link rel="stylesheet" href="./inicio-ejercicio/v1/estilo.css">\n  </head>')
p.write_text(h)
print('Inicio de ejercicio construido; original conservado.')
