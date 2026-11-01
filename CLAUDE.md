# Templum

App personal de entrenamiento al estilo de Hevy, con identidad católica: el cuerpo como templo (1 Cor 6,19). Sirve para registrar rutinas de pesas, cardio y calistenia, ver el progreso y recibir avisos sobre el rendimiento. Es una PWA para celular y computador, toda en español y en kg/km.

## Cómo trabajar con el usuario

- **No es programador.** Explica en español simple y sin jerga. Cuando haya que correr algo, guíalo paso a paso.
- **Ruta por etapas, con aprobación al final de cada una.** No adelantes etapas ni empieces a programar sin que lo pida.
- **Lo visual es muy importante.** Muestra antes de implementar y pregunta sus gustos en vez de suponerlos.
- La fe va en dosis moderadas. Pidió explícitamente que la app no se sienta sobrecargada.

## Estado actual (2026-11-01)

| Etapa | Estado |
|---|---|
| 0 · Diseño visual | ✅ Aprobada |
| 1 · Contenido | ✅ Aprobada el 2026-11-01 (versículos, oraciones, ejercicios y calendario litúrgico) |
| 2 · Construcción | ⏳ **En curso** desde el 2026-11-01. Parte 1 |
| 3 · Publicar e instalar en el celular | Pendiente |
| 4 · Futuro (nube, Claude dentro de la app, medidas corporales) | Opcional |

El usuario todavía **no tiene rutinas** armadas. Las creará él en la app, así que no hay que precargarlas.

## Próximos pasos

1. ✅ **Biblioteca de ejercicios**, cerrada el 2026-10-27 con 112 ejercicios. Los tipos son `pesas` | `peso_corporal` | `cardio` | `tiempo`. **Pendiente para más adelante:** hacer dibujos propios, del mismo estilo de línea, para los 51 ejercicios que hoy muestran el mapa de músculos. El usuario lo pidió así para que todos tengan dibujo.
2. ✅ **Calendario litúrgico**, aprobado por el usuario el 2026-11-01. El usuario pidió que aparezcan **todos** los santos y fiestas católicos, sin elegir uno por uno. Sigue el Calendario Romano General más los propios de Chile y América, y en Chile la Epifanía, la Ascensión y Corpus Christi van en domingo. Los rangos de los propios de Chile (Santa Teresa de los Andes y San Alberto Hurtado como fiesta) son aproximados.
3. **Etapa 2**, construyendo por partes. Cada parte termina con el usuario probándola en el navegador del computador:
   1. Base del proyecto, diseño aplicado y navegación.
   2. Biblioteca de ejercicios y rutinas (crear y editar).
   3. Entrenamiento en curso: series, check, temporizador, "lo que hiciste la vez anterior" y cambios sobre la marcha.
   4. Historial y calendario.
   5. Progreso: gráficos, récords y avisos automáticos.
   6. Versículos, oraciones, santo del día y Ajustes con sus interruptores.
   7. Exportar/importar (JSON y CSV) y "Copiar resumen para Claude".

## Decisiones tomadas

**Funciones**
- Ejercicios **sin fotos de personas reales**. El usuario eligió el **dibujo de línea** en oro, de Everkinetic (CC BY-SA 4.0: hay que darle crédito en Ajustes). 61 ejercicios tienen dibujo; los otros 51 muestran el mapa de músculos. Los músculos de cada ejercicio vienen de free-exercise-db.
- Rutinas fijas que se pueden editar durante el entrenamiento. Al terminar, la app pregunta si guardar los cambios en la rutina.
- Temporizador de descanso, récords personales, columna "Anterior", calendario e historial.
- El análisis se hace con gráficos y avisos con reglas simples: estancamiento de 3 o más semanas, buen progreso, días sin entrenar. Para ir más a fondo está el botón "Copiar resumen", que se pega en un chat con Claude; no hay API dentro de la app.
- **Datos solo en el dispositivo** (sin nube por ahora), con exportar/importar y un aviso de último respaldo en Ajustes.

**Identidad visual** (la guía completa está en `diseno/guia-de-estilo.html`)
- Logo: **Chi-Rho (☧)** dorado sobre fondo púrpura.
- Estilo minimalista y elegante. El **modo oscuro es el principal**; el claro va sobre un pergamino envejecido, nunca blanco.
- Cada color tiene una función fija:

  | Color | Oscuro | Claro | Se usa para |
  |---|---|---|---|
  | Fondo (Noche) | `#0D0A10` | `#E4D9C6` | Fondo de la app |
  | Púrpura | `#6B3A9E` | `#4B2275` | Acción, series completadas, navegación |
  | Carmesí | `#9B1E33` | `#7D1628` | Esfuerzo y "Terminar" |
  | Oro | `#CFA54E` | `#85631A` | Récords, versículos y detalles finos |
  | Texto | `#EEE7DC` | `#1D1421` | Textos (en modo claro, Pergamino es el fondo) |

  Las variantes "ink" para texto sobre fondo oscuro son `#B892E0` (púrpura) y `#E35C70` (carmesí). El resto de los tokens está en los archivos de diseño.
- Tipografías: **Cormorant Garamond** solo para versículos, oraciones y el nombre "Templum"; **Jost** para todo lo demás.
- En los ejercicios, el **mapa de músculos** pinta el principal en carmesí y los secundarios en púrpura más tenue.

**Elementos de fe** (cada uno con su interruptor en Ajustes)
- Encendidos por defecto: versículo del día en Inicio, santo del día (una línea discreta), versículo al terminar, frase al lograr un récord y oración al terminar.
- Apagados por defecto: versículos durante el descanso y oración al empezar.

## Archivos

```
CLAUDE.md
package.json                   La app (Vite + React + TypeScript). `npm run dev` la abre en el navegador
index.html, vite.config.ts     Entrada de la app y configuración (PWA, íconos, versión)
public/icons/                  Íconos de la app: Chi-Rho dorado sobre púrpura
src/
  main.tsx, App.tsx            Arranque, letras locales (@fontsource) y rutas (HashRouter)
  styles/tokens.css            Colores de la guía (oscuro, claro y Automático)
  styles/base.css              Piezas comunes: botones, tarjetas, grupos, menú, versículo, estado vacío
  components/                  Icon, Logo (ChiRho, Wordmark), TabBar, Empty
  screens/                     Inicio, Rutinas, Progreso, Historial, Ajustes
  lib/                         tema.ts (Automático/Oscuro/Claro, se guarda en localStorage) y fechas.ts
  db/                          Capa de datos (Dexie), desde la parte 2
diseno/
  guia-de-estilo.html          Guía de estilo aprobada (paleta, letras, logos, piezas)
  pantallas/project/*.dc.html  Maquetas de las 8 pantallas (lienzo Design)
contenido/
  versiculos.json              91 versículos aprobados: id, tema, ref, texto, momentos[]
  versiculos-descartados.json  17 que quitó el usuario (no usar)
  oraciones.json               9 oraciones aprobadas: id, momento (inicio|cierre), tipo, titulo, texto
  ejercicios.json              112 ejercicios aprobados: id, nombre, grupo, equipo, tipo, musculoPrincipal, musculosSecundarios, idOriginal, dibujos[]
  ejercicios-descartados.json  58 que quitó el usuario (no usar)
  dibujos/                     Dibujos de línea de Everkinetic (relaxation y tension), en currentColor
  calendario.json              223 celebraciones fijas y 11 móviles: fecha o regla, nombre, rango, color, delSenor, region, precedencia
  liturgia.js                  Cálculo del día litúrgico (Pascua, tiempos, precedencia y traslados). Pasa a src/lib/liturgia.ts
  revision-calendario.html     Página para ver el calendario mes a mes
  revision-ejercicios.html     Página para revisar los ejercicios
  revision.html                Página que se usó para revisar los textos
```

- En `versiculos.json`, los `momentos` posibles son `inicio` (todos), `cierre` (25), `record` (14) y `descanso` (14). Los temas son `cuerpo`, `fortaleza`, `carrera`, `disciplina`, `descanso` y `gratitud`.
- Pantallas con maqueta: Inicio (en la guía de estilo), Entrenamiento en curso, Fin del entrenamiento, Biblioteca, Detalle del ejercicio, Progreso, Historial, Crear/editar rutina y Ajustes. **Al construir, respeta estas maquetas.**

## Enlaces (artifacts privados del usuario)

- Guía de estilo: https://claude.ai/artifact/Bd14bUKnVaLSDnrKf7AKTy
- Maquetas de pantallas: https://claude.ai/artifact/4VAsowd7uBEYU1Mk9EbR3W
- Revisión de versículos: https://claude.ai/artifact/Lcm6pxLmcWWP2AvXaw59D8. Las respuestas están en su base de datos, colecciones `revision` y `propuestas`, ya aplicadas a los JSON.
- Calendario litúrgico: https://claude.ai/artifact/EB1tJjjY4ovJrW2r6CyVtL (sin base de datos; el usuario responde en el chat).
- Revisión de ejercicios: https://claude.ai/artifact/YPLDZoMXWhMtcrpRzpwPCs. Las respuestas quedan en su base de datos: `revision` (id → `decision: remove`; la primera ronda de 55 ya está aplicada), `nombres` (id → `nombre` como le dice el usuario), `preferencias/imagen` (`estilo`: dibujo | mapa | nada) y `faltantes` (`nombre`, `grupo`, `nota`). Todo está aplicado.

## Plan técnico (Etapa 2)

- PWA con **Vite + React + TypeScript**, datos locales con **Dexie** (IndexedDB), gráficos con **Recharts** y **vite-plugin-pwa** para instalarla y usarla sin internet.
- Mapa de músculos con una silueta SVG; por ejemplo react-body-highlighter (MIT) o una propia como la de la maqueta.
- La capa de datos va aislada en `src/db/` para poder agregar la nube (Supabase) después sin rehacer nada.
- Modelo de datos:
  - `exercises`: nombre, músculos, tipo, si es personalizado.
  - `routines`: ejercicios ordenados, con series, reps objetivo, descanso y nota.
  - `workouts`: inicio, fin, rutina de origen y notas.
  - `workoutSets`: kg + reps, solo reps, solo tiempo (plancha), o distancia + tiempo; y si está completada.
- Lógica en `src/lib/`:
  - `records.ts`: récords y 1RM estimado con la fórmula de Epley.
  - `insights.ts`: avisos de progreso.
  - `summary.ts`: el resumen para Claude.
  - `exportImport.ts`: exportar e importar.
- El equipo tiene Node 24, npm y git. La carpeta es un repositorio git (rama `main`, autor "Arctos"). El usuario tiene cuenta de GitHub, que servirá para publicar en la Etapa 3.
- Para sacar fotos de prueba sin molestar al usuario sirve `firefox --headless --screenshot` con un perfil temporal; Brave en modo headless se queda colgado.
- Verificación en cada parte: `npm run dev`, una prueba guiada con el usuario y revisión a tamaño celular. Antes de publicar, `npm run build` sin errores.
- La publicación (Etapa 3) es gratis en GitHub Pages o Vercel. Se publica solo la app; los datos se quedan en cada dispositivo.
