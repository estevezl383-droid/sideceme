"""Construye paquetes SIDPKG1 cifrados por fragmento. Nunca publicar el archivo de claves."""
import argparse,json,gzip,os,hashlib,struct,base64,math,tempfile
from pathlib import Path
from collections import defaultdict
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from shapely.geometry import shape
from shapely import intersects

def compact(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def bbox_union(features):
 return [min(f['bbox'][0] for f in features),min(f['bbox'][1] for f in features),max(f['bbox'][2] for f in features),max(f['bbox'][3] for f in features)]
def morton(f):
 b=f['bbox'];x=int(((b[0]+b[2])/2+180)*100);y=int(((b[1]+b[3])/2+90)*100)
 return sum(((x>>i)&1)<<(2*i) | ((y>>i)&1)<<(2*i+1) for i in range(16))

def run(a):
 out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
 dem=Path(a.dem);lc=Path(a.landcover)
 inv=json.load(open(dem/'inventory.json'));lcInv=json.load(open(lc/'inventory.json'))
 for directory in (dem,lc):
  status=json.load(open(directory/'download-result.json'))
  assert not status['errors'],f'Descarga incompleta: {directory}'
 keys_path=Path(a.keys);keys_path.parent.mkdir(parents=True,exist_ok=True)
 registry=json.load(open(keys_path)) if keys_path.exists() else {}
 names={'pacifico':'Pacífico','amazonico':'Amazónico','central':'Central','plata':'Plata'}
 zones={n:shape(v['geometry']) for n,v in inv['zones'].items()}
 layers={n:defaultdict(list) for n in zones};counts=defaultdict(int)
 for p in sorted(Path(a.data).glob('chunk-*.json')):
  for row in json.load(open(p)):
   assert not row['capa'].startswith('mil_')
   g=shape(row['geometry']);counts[row['capa']]+=1
   f={'type':'Feature','id':row['id'],'bbox':list(g.bounds),'properties':row['props'],'geometry':row['geometry']}
   for n,z in zones.items():
    if g.intersects(z):layers[n][row['capa']].append(f)
  print('Leído',p.name,flush=True)
 expected=json.load(open(a.expected))
 assert dict(counts)==expected,('Conteos de origen no coinciden',dict(counts),expected)
 summaries=[]
 for n in ['pacifico','amazonico','central','plata']:
  id=f'bolivia-{n}-20261027-v1';key=base64.b64decode(registry[id]['key']) if id in registry else os.urandom(32);cipher=AESGCM(key)
  manifest={'version':1,'id':id,'zona':n,'nombre':names[n],'pais':'bolivia','geometry':inv['zones'][n]['geometry'],'maxDemZoom':12,'landcoverCellDegrees':.5,'landcoverPixels':1536,'created':'2026-10-27','entries':[],
   'sources':['SIDECEME calcos_features, capas civiles de Bolivia, exportación 2026-10-27; origen OSM según el generador. © OpenStreetMap contributors, ODbL.','Mapzen Terrain Tiles / AWS Open Data. Atribución: https://github.com/tilezen/joerd/blob/master/docs/attribution.md','Esri / Impact Observatory / Microsoft Sentinel-2 Land Cover. https://livingatlas.arcgis.com/landcover/','Natural Earth 1:110m (dominio público), usado como máscara aproximada con margen de 0.15 grados.'],
   'limitations':['No contiene mapa base ni imágenes satelitales de fondo.','Resolución del relieve hasta ~40 m/píxel; el generador usa menos detalle para áreas grandes.','Cobertura de suelo remuestreada a ~36 m; no equivale a los píxeles originales de 10 m.','No incluye documentos, unidades, órdenes, capas militares ni soluciones del CMOC.','El límite del país y las cuatro regiones es aproximado.','Las huellas en vivo requieren un modo conectado; no se consultan en modo paquetes.']}
  payload=tempfile.TemporaryFile();offset=0
  def add(path,raw,codec='raw',**meta):
   nonlocal offset
   data=gzip.compress(raw,compresslevel=6,mtime=0) if codec=='gzip' else raw
   iv=os.urandom(12);encrypted=cipher.encrypt(iv,data,(id+'\n'+path).encode())
   assert len(encrypted)<8*1024*1024
   manifest['entries'].append({'path':path,'offset':offset,'length':len(encrypted),'iv':base64.b64encode(iv).decode(),'codec':codec,'plainBytes':len(raw),**meta})
   payload.write(encrypted);offset+=len(encrypted)
  add('check',b'SIDECEME paquete de terreno v1')
  layercounts={}
  for layer,features in layers[n].items():
   features.sort(key=morton);layercounts[layer]=len(features)
   for i in range(0,len(features),300):
    batch=features[i:i+300];add(f'vector/{layer}/{i//300}.json',compact({'type':'FeatureCollection','features':batch}),'gzip',layer=layer,bbox=bbox_union(batch))
  dembytes=0
  for z,x,y in inv['zones'][n]['tiles']:
   raw=(dem/str(z)/str(x)/(str(y)+'.png')).read_bytes();dembytes+=len(raw);add(f'dem/{z}/{x}/{y}.png',raw)
  lcbytes=0
  for x,y in lcInv[n]:
   raw=(lc/f'{x}_{y}.png').read_bytes();lcbytes+=len(raw);add(f'lc/{x}_{y}.png',raw)
  manifest['counts']=layercounts;head=compact(manifest);mh=hashlib.sha256(head).hexdigest()
  path=out/f'Bolivia_{n}.sidcalco';tmp=path.with_suffix('.partial')
  with open(tmp,'wb') as f:
   f.write(b'SIDPKG1\n');f.write(struct.pack('<I',len(head)));f.write(head);payload.seek(0)
   import shutil;shutil.copyfileobj(payload,f,1024*1024)
  payload.close();tmp.replace(path)
  # Complete integrity read: every entry decrypts and matches its declared length.
  with open(path,'rb') as f:
   for e in manifest['entries']:
    f.seek(12+len(head)+e['offset']);plain=cipher.decrypt(base64.b64decode(e['iv']),f.read(e['length']),(id+'\n'+e['path']).encode())
    if e['codec']=='gzip':plain=gzip.decompress(plain)
    assert len(plain)==e['plainBytes']
  registry[id]={'key':base64.b64encode(key).decode(),'manifest_sha256':mh,'file':path.name}
  fd=os.open(keys_path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
  with os.fdopen(fd,'w') as f:json.dump(registry,f)
  summary={'zona':n,'file':path.name,'bytes':path.stat().st_size,'dem_bytes':dembytes,'landcover_bytes':lcbytes,'entries':len(manifest['entries']),'features':sum(layercounts.values()),'manifest_sha256':mh}
  summaries.append(summary);print('Paquete verificado',n,path.stat().st_size,'bytes',flush=True)
 (out/'inventario-paquetes.json').write_bytes(compact(summaries))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--dem',required=True);p.add_argument('--landcover',required=True);p.add_argument('--expected',required=True);p.add_argument('--output',required=True);p.add_argument('--keys',required=True);run(p.parse_args())
