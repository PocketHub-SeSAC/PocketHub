/* v5 도트 아이콘. size 를 주면 높이 기준으로 비율을 맞춘다 */
import { ICONS } from './icons';

export default function Icon({ name, size, className = '' }) {
  const ic = ICONS[name];
  if (!ic) return null;
  const h = size || ic.h;
  const w = size ? Math.round((ic.w / ic.h) * size) : ic.w;
  return (
    <svg className={`px ${className}`} width={w} height={h} viewBox={ic.vb} shapeRendering='crispEdges' aria-hidden='true'
      dangerouslySetInnerHTML={{ __html: ic.svg }} />
  );
}
