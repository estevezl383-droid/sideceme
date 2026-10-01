"""Lee el paquete autorizado; publica únicamente estructura, nunca datos de ejemplos."""
from pathlib import Path
import re,json,hashlib,sys,unicodedata
root=Path(sys.argv[1]); out=Path('calcos/formato-militar/v1/catalogo.js')
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
keys=['aprec-personal','aprec-inteligencia','aprec-operaciones','aprec-logistica','aprec-acgm','aprec-artilleria','aprec-ingenieria','aprec-comunicaciones','aprec-ada','plan-personal','plan-logistica','plan-aspc','plan-ingenieria','plan-comunicaciones','plan-engano','plan-fuegos','plan-ada','orden-operaciones','orden-reconocimiento','orden-movimiento','orden-mision','prep1','prep2','prep3','calco','apendice-fuegos']
terms=['apresiacion de personal','apresiacion de inteligencia.md','apresiacionde operaciones','apresiacion de logistica','apresiacion de acgm','apresiacion de artilleria.md','apresiacin deingenieria','apresiacin de comunicaciones','apresiacin de defensa antiaerea','plan de. personal','plan de logistica','plan de apoyo de servicio','plan deingenieria','plan de comunicaciones','plan de engano','plan de apoyo de fuegos','plan de apoyo de defensa','orden de operaciones','orden de reconocimiento','orden de movimiento','orden tipo mision','orden prepartoria 1','orden preparatoria 2','orden preparatoria 3','modelo calco','modelo apedice']
result={}
for key,term in zip(keys,terms):
 p=next(p for p in root.glob('*.txt') if term in norm(p.name));txt=p.read_text(); print(key,p.name,len(txt))
 headings=[]; stack=[]; labels=[]
 for line in txt.splitlines():
  line=re.sub(r'^\[[^\]]+\]\s*','',line.strip()).lstrip('# ').strip()
  if re.search(r'^(EL COMANDANTE|EL G[– -]|EL OFICIAL|EL CAF)',line):break
  m=re.match(r'^([IVX]+)\.\-\s*(.+)$',line)
  if m and re.sub(r'\([^)]*\)','',m[2]).isupper():level,title=1,m[2]
  else:
   m=re.match(r'^([A-Z])\.\-\s*(.+)$',line)
   if m:level,title=2,m[2]
   else:
    m=re.match(r'^(\d+)\.\-\s*(.+)$',line)
    if m:level,title=3,m[2]
    else:
     m=re.match(r'^([a-z])\.\-\s*(.+)$',line)
     if m:level,title=4,m[2]
     else:
      m=re.match(r'^(\d+)\)\s*(.+)$',line)
      if m:level,title=5,m[2]
      else:
       m=re.match(r'^([a-z])\)\s*(.+)$',line)
       if m:level,title=6,m[2]
       else:continue
  if not headings and level!=1:continue
  title=title.strip();stack=stack[:level-1];stack.append(title);headings.append({'nivel':level,'titulo':title,'ruta':' / '.join(stack)})
 labels=re.findall(r'(?m)^\s*(OBJETO|CARTAS?|ANEXOS?|APÉNDICES?|AGREGADOS)\s*[:.]',txt)
 sec=re.search(r'(?:EM\.|EMO|Pl\.?\s*My\.?)[^\n]*',txt)
 result[key]={'fuente':p.name.removesuffix('.txt'),'sha256Lectura':hashlib.sha256(txt.encode()).hexdigest(),'seccionFuente':sec[0] if sec else '', 'rotulos':list(dict.fromkeys(labels)) or ['OBJETO','CARTA','ANEXOS'],'apartados':headings}
# En estos originales los tres primeros títulos no llevan marcador explícito.
r=result['orden-reconocimiento'];r['apartados']=[{'nivel':n,'titulo':t,'ruta':p} for n,t,p in [(1,'SITUACIÓN.','SITUACIÓN.'),(2,'Fuerzas enemigas.','SITUACIÓN. / Fuerzas enemigas.'),(2,'Fuerzas propias.','SITUACIÓN. / Fuerzas propias.'),(2,'Refuerzos y Reducciones.','SITUACIÓN. / Refuerzos y Reducciones.'),(1,'MISIÓN.','MISIÓN.'),(1,'EJECUCIÓN.','EJECUCIÓN.'),(2,'Plan de Reconocimiento.','EJECUCIÓN. / Plan de Reconocimiento.'),(3,'Objetivo general del reconocimiento.','EJECUCIÓN. / Plan de Reconocimiento. / Objetivo general del reconocimiento.'),(3,'Método del reconocimiento.','EJECUCIÓN. / Plan de Reconocimiento. / Método del reconocimiento.'),(2,'Tareas para las Unidades subordinadas.','EJECUCIÓN. / Tareas para las Unidades subordinadas.'),(3,'Forma de llegar a la zona de reconocimiento.','EJECUCIÓN. / Tareas para las Unidades subordinadas. / Forma de llegar a la zona de reconocimiento.'),(3,'Tareas (RCIC).','EJECUCIÓN. / Tareas para las Unidades subordinadas. / Tareas (RCIC).'),(3,'Plazos en tiempo.','EJECUCIÓN. / Tareas para las Unidades subordinadas. / Plazos en tiempo.'),(2,'Instrucciones de coordinación.','EJECUCIÓN. / Instrucciones de coordinación.')]]+r['apartados']
for key in ['prep1','prep2','prep3']:
 r=result[key]['apartados'];r.extend([{'nivel':2,'titulo':t,'ruta':'COMANDO Y COMUNICACIONES / '+t} for t in ['Comando.','Comunicaciones.']] if not any(a['nivel']==2 and 'Comando' in a['titulo'] for a in r) else [])
# Instrucciones numeradas no constituyen texto elaborado del ejercicio.
for key,modelo in result.items():
 for a in modelo['apartados']:
  if re.match(r'^(Indicar|Enumerar|Describa|Determine|Establezca|Identifique|Registre|Copie|Incluya)\b',a['titulo']):
   a['instruccion']=a['titulo'];a['titulo']='Conclusión pendiente' if a['ruta'].startswith('CONCLUSIONES') else 'Apartado pendiente'
# Rótulos descriptivos del apartado V de la apreciación logística.
labels=['Viabilidad del apoyo logístico.','Curso de acción con mejor apoyo logístico.','Desventajas logísticas.','Limitaciones y recomendaciones.','Estado logístico final de la unidad.']
for a,label in zip([a for a in result['aprec-logistica']['apartados'] if a['nivel']==2 and 'CONCLUSIONES' in a['ruta']],labels):a['titulo']=label
out.write_text('export const catalogo = '+json.dumps(result,ensure_ascii=False,indent=2)+';\n')
