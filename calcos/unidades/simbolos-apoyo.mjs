// Símbolos según las capturas proporcionadas por el docente (08-OCT-2026).
// Sólo se aplica a unidades propias; no modifica fichas ni cálculos.
export function dibujarApoyo(ctx, unidad, x, y, ancho, alto, color) {
  const armas = ['ametralladoras', 'morteros', 'antitanque', 'lanzacohetes'];
  const texto = String(unidad.textoSimbolo || '').trim();
  if (!armas.includes(unidad.arma) && !texto) return false;
  const cx = x + ancho / 2, cy = y + alto / 2;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  if (texto) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(texto, cx, cy, ancho - 10);
  } else {
    if (unidad.circuloSimbolo) {
      ctx.beginPath(); ctx.arc(cx, cy, alto * .36, 0, Math.PI * 2); ctx.stroke();
    }
    const arriba = cy - alto * .26;
    const abajo = cy + alto * (unidad.arma === 'morteros' ? .12 : .26);
    ctx.beginPath(); ctx.moveTo(cx, arriba + 5); ctx.lineTo(cx, abajo); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, arriba); ctx.lineTo(cx - 4, arriba + 8);
    ctx.lineTo(cx + 4, arriba + 8); ctx.closePath(); ctx.fill();
    if (unidad.arma === 'morteros') {
      ctx.beginPath(); ctx.ellipse(cx, abajo + 4, 6, 4, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (['antitanque', 'lanzacohetes'].includes(unidad.arma)) {
      ctx.beginPath(); ctx.moveTo(cx - 7, abajo + 5); ctx.lineTo(cx, abajo - 3);
      ctx.lineTo(cx + 7, abajo + 5); ctx.stroke();
    }
  }
  ctx.restore();
  return true;
}
export function anchoNumero(ctx, unidad) {
  const numero = String(unidad.numeroUnidad || '').trim();
  if (!numero || unidad.bando !== 'propias' || (unidad.tipo || 'unidad') !== 'unidad') return 0;
  ctx.font = 'bold 12px Arial, sans-serif';
  return Math.ceil(ctx.measureText(numero).width) + 10;
}
