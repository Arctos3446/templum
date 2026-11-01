// Mapa de músculos (silueta de la maqueta "Detalle del ejercicio").
// El músculo principal va en carmesí y los secundarios en púrpura tenue.

type Forma = ['circle' | 'rect' | 'ellipse', Record<string, number>, string[]]

const FRENTE: Forma[] = [
  ['circle', { cx: 50, cy: 16, r: 10 }, []],
  ['rect', { x: 45, y: 26, width: 10, height: 8, rx: 2 }, ['Cuello']],
  ['ellipse', { cx: 29, cy: 42, rx: 8, ry: 7 }, ['Hombros']],
  ['ellipse', { cx: 71, cy: 42, rx: 8, ry: 7 }, ['Hombros']],
  ['rect', { x: 34, y: 36, width: 15.5, height: 20, rx: 6 }, ['Pecho']],
  ['rect', { x: 50.5, y: 36, width: 15.5, height: 20, rx: 6 }, ['Pecho']],
  ['rect', { x: 40, y: 58, width: 20, height: 32, rx: 5 }, ['Abdominales']],
  ['rect', { x: 33, y: 60, width: 6, height: 26, rx: 3 }, ['Abdominales']],
  ['rect', { x: 61, y: 60, width: 6, height: 26, rx: 3 }, ['Abdominales']],
  ['ellipse', { cx: 23, cy: 61, rx: 5, ry: 11 }, ['Bíceps']],
  ['ellipse', { cx: 77, cy: 61, rx: 5, ry: 11 }, ['Bíceps']],
  ['ellipse', { cx: 19, cy: 87, rx: 4, ry: 12 }, ['Antebrazos']],
  ['ellipse', { cx: 81, cy: 87, rx: 4, ry: 12 }, ['Antebrazos']],
  ['rect', { x: 36, y: 92, width: 28, height: 14, rx: 6 }, ['Aductores', 'Abductores']],
  ['ellipse', { cx: 42, cy: 130, rx: 7.5, ry: 22 }, ['Cuádriceps']],
  ['ellipse', { cx: 58, cy: 130, rx: 7.5, ry: 22 }, ['Cuádriceps']],
  ['ellipse', { cx: 42, cy: 176, rx: 5, ry: 15 }, []],
  ['ellipse', { cx: 58, cy: 176, rx: 5, ry: 15 }, []],
]

const ESPALDA: Forma[] = [
  ['circle', { cx: 50, cy: 16, r: 10 }, []],
  ['rect', { x: 38, y: 28, width: 24, height: 14, rx: 6 }, ['Trapecio']],
  ['ellipse', { cx: 29, cy: 42, rx: 8, ry: 7 }, ['Hombros']],
  ['ellipse', { cx: 71, cy: 42, rx: 8, ry: 7 }, ['Hombros']],
  ['rect', { x: 34, y: 44, width: 15, height: 30, rx: 6 }, ['Dorsales', 'Espalda media']],
  ['rect', { x: 51, y: 44, width: 15, height: 30, rx: 6 }, ['Dorsales', 'Espalda media']],
  ['rect', { x: 42, y: 75, width: 16, height: 15, rx: 4 }, ['Espalda baja']],
  ['ellipse', { cx: 23, cy: 61, rx: 5, ry: 11 }, ['Tríceps']],
  ['ellipse', { cx: 77, cy: 61, rx: 5, ry: 11 }, ['Tríceps']],
  ['ellipse', { cx: 19, cy: 87, rx: 4, ry: 12 }, ['Antebrazos']],
  ['ellipse', { cx: 81, cy: 87, rx: 4, ry: 12 }, ['Antebrazos']],
  ['rect', { x: 36, y: 92, width: 13.5, height: 18, rx: 6 }, ['Glúteos']],
  ['rect', { x: 50.5, y: 92, width: 13.5, height: 18, rx: 6 }, ['Glúteos']],
  ['ellipse', { cx: 42, cy: 134, rx: 7.5, ry: 20 }, ['Isquiotibiales']],
  ['ellipse', { cx: 58, cy: 134, rx: 7.5, ry: 20 }, ['Isquiotibiales']],
  ['ellipse', { cx: 42, cy: 176, rx: 5.5, ry: 15 }, ['Pantorrillas']],
  ['ellipse', { cx: 58, cy: 176, rx: 5.5, ry: 15 }, ['Pantorrillas']],
]

function Silueta({ formas, principal, secundarios, etiqueta }: { formas: Forma[]; principal: string; secundarios: string[]; etiqueta: string }) {
  return (
    <svg viewBox="0 0 100 210" role="img" aria-label={etiqueta}>
      {formas.map(([tag, attrs, musculos], i) => {
        const cls = musculos.includes(principal) ? 'm1' : musculos.some((m) => secundarios.includes(m)) ? 'm2' : 'm'
        const Tag = tag
        return <Tag key={i} className={cls} {...attrs} />
      })}
    </svg>
  )
}

export function MapaMusculos({ principal, secundarios, className = '' }: { principal: string; secundarios: string[]; className?: string }) {
  return (
    <div className={`mapa ${className}`}>
      <Silueta formas={FRENTE} principal={principal} secundarios={secundarios} etiqueta="Vista frontal" />
      <Silueta formas={ESPALDA} principal={principal} secundarios={secundarios} etiqueta="Vista posterior" />
    </div>
  )
}
