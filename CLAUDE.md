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
| 2 · Construcción | ⏳ **En curso** desde el 2026-11-01. Partes 1 y 2 ✅ aprobadas el 2026-11-01 · Parte 3 ✅ aprobada el 2026-11-01 · Parte 4 ✅ aprobada el 2026-11-01 · Parte 5 hecha el 2026-11-01, espera la prueba del usuario |
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
- **Tamaño de letra (2026-11-01):** el usuario la encontró pequeña, sobre todo la de los versículos. La base es de 16 px en el celular y 17 px en el computador. Los versículos van a 28 px en el celular y 40 px en el computador. No volver a achicarla.
- **Computador (2026-11-01):** usa todo el ancho, con el menú como barra lateral a la izquierda (logo arriba) y el contenido en columnas (Inicio en dos). En el celular el menú va abajo. El cambio ocurre a los 900 px (`@media (min-width: 900px)` en `base.css`).
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
  lib/                         tema.ts (Automático/Oscuro/Claro, en localStorage), fechas.ts, tiempo.ts (m:ss), rutinas.ts, useSesion.ts
  db/                          Capa de datos (Dexie). tipos.ts, db.ts, ejercicios.ts y rutinas.ts, con hooks useLiveQuery
  styles/parte2.css            Estilos de la biblioteca, el detalle, los editores, el selector y los avisos
  styles/parte3.css            Entrenamiento en curso, descanso, fin, menú que sube (Hoja), interruptores
  screens/Entrenamiento.tsx    Entrenamiento en curso · FinEntrenamiento.tsx · Empezar.tsx
  lib/series.ts                Leer y mostrar series por tipo (kg con coma, m:ss), sugerencias, récords
  lib/ajustes.ts, lib/aviso.ts Ajustes de cada persona (sonido, vibración, pantalla) y aviso del descanso
  lib/contenido.ts             Versículos y oraciones (elige uno fijo por entrenamiento)
  screens/Historial.tsx        Calendario del mes y lista por semanas · SesionDetalle.tsx · SesionEditor.tsx
  lib/historial.ts             Volumen, récords de cada sesión (en su momento) y semanas de constancia
  styles/parte4.css            Historial, calendario, detalle y edición de una sesión
  screens/Progreso.tsx         Gráfico por ejercicio, récords personales y avisos
  components/GraficoLinea.tsx  Gráfico de línea propio en SVG (sin librería), con lectura al tocar
  lib/records.ts, insights.ts  Métricas por sesión, 1RM (Epley), récords por tipo y avisos con reglas
  styles/parte5.css            Progreso, gráfico, récords y avisos
public/dibujos/                Copia de contenido/dibujos que usa la app (si cambia un dibujo, copiarlo aquí)
diseno/
  guia-de-estilo.html          Guía de estilo aprobada (paleta, letras, logos, piezas)
  pantallas/project/*.dc.html  Maquetas de las 8 pantallas (lienzo Design)
contenido/
  versiculos.json              91 versículos aprobados: id, tema, ref, texto, momentos[]
  versiculos-descartados.json  17 que quitó el usuario (no usar)
  oraciones.json               9 oraciones aprobadas: id, momento (inicio|cierre), tipo, titulo, texto
  ejercicios.json              112 ejercicios aprobados: id, nombre, grupo, equipo, tipo, musculoPrincipal, musculosSecundarios, idOriginal, dibujos[]
  ejercicios-descartados.json  58 que quitó el usuario (no usar)
  instrucciones.json           "Cómo hacerlo" de los 112 ejercicios: id → pasos[] y consejo. Los escribió Claude; el usuario no quiso revisarlos uno por uno
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

## Cómo quedó construida la Parte 2 (2026-11-01)

- Los 112 ejercicios de la biblioteca se leen directo de `contenido/ejercicios.json` (`CATALOGO`) y no se pueden editar. En la base de datos (IndexedDB `templum`) solo se guardan `ejerciciosPropios` (id `propio-…`) y `rutinas`.
- Rutas (createHashRouter): `/rutinas`, `/rutinas/nueva`, `/rutinas/:id`, `/ejercicios`, `/ejercicios/nuevo`, `/ejercicios/:id` y `/ejercicios/:id/editar`. La pestaña Rutinas también queda marcada en `/ejercicios/*`. Los editores llevan `handle: {enfoque: true}`, que esconde el menú de abajo en el celular.
- En cada rutina, un ejercicio guarda `series`, `objetivo` (texto libre: "8–10", "30 s", "20 min"), `descanso` en segundos y `nota`. Las rutinas se reordenan arrastrando ⋮⋮ (@dnd-kit) y los días van de 0 = lunes a 6 = domingo.
- Inicio muestra hasta 4 rutinas; las del día van primero, con la etiqueta "Hoy".
- `useAvisoSalida` pregunta "¿Salir sin guardar?" al cancelar, al tocar el menú o al cerrar la pestaña. Después de guardar se sale con `sinAviso()`.
- El detalle del ejercicio alterna las dos fases del dibujo cada 1,4 s (al usuario le gustó así). La pestaña "Cómo hacerlo" sale de `contenido/instrucciones.json` y no aparece en los ejercicios propios. Los récords que muestra dependen del tipo y se llenan en la parte 5.
- Decisiones del usuario: valores iniciales al agregar un ejercicio, 3 series × 8–10 con 1:30 de descanso (cardio: 1 × 20 min, sin descanso); los 112 de la biblioteca no se editan, solo los propios.
- Los créditos de Everkinetic (CC BY-SA 4.0) y de free-exercise-db ya están al pie de Ajustes.
- Prueba automática: puppeteer-core con Brave (`executablePath: '/usr/bin/brave'`), instalado en una carpeta temporal y no en el proyecto. Crea una rutina, agrega ejercicios, los reordena, la guarda, prueba los avisos y crea un ejercicio propio, sin errores en la consola.

## Cómo quedó construida la Parte 3 (2026-11-01)

- El usuario usa un **Samsung A16**; sus amigos con iPhone y otros celulares también usarán la app. Lo que depende del celular va como ajuste de cada persona: sonido, vibración (el iPhone no vibra desde una web) y pantalla encendida, en Ajustes → Entrenamiento (localStorage `templum.ajustes`).
- Base de datos versión 2: `entrenamientos` (terminados) y `enCurso` (una fila como máximo). Mientras se entrena, las series se guardan como texto ("62,5", "1:30") y al guardar pasan a números (`kg`, `reps`, `seg`, `km`); solo se guardan las series marcadas.
- La pantalla trabaja sobre una copia local y la guarda 0,4 s después de cada cambio (y al esconder la app), así sobrevive a recargas y a cerrar el navegador.
- Sugerencias en cada casilla: lo de la vez anterior; si no hay, la serie de arriba; si tampoco, el objetivo de la rutina. Al marcar ✓ con casillas vacías se usan esas sugerencias; si falta un dato, la casilla se pone roja y recibe el cursor.
- Descanso: corre con la hora de término (no se desfasa); el aviso suena desde cualquier pantalla de la app (`useVigiaDescanso` en App.tsx). Con el celular bloqueado no puede sonar; por eso "Mantener pantalla encendida" viene activado.
- Récord en vivo: supera lo mejor del historial (kg en pesas, reps en peso corporal, tiempo, km en cardio). La primera vez que se hace un ejercicio no cuenta como récord.
- Fin: duración, volumen, series, récords, versículo de cierre y oración de cierre (fijos por entrenamiento), "Guardar" y la casilla "Actualizar la rutina" si cambió la estructura (ejercicios, cantidad de series, descanso, notas).
- Se puede empezar desde ▶ en cada rutina (Inicio, Rutinas o la pantalla Empezar) o en blanco. Si ya hay uno en curso, pregunta antes de descartarlo. Mientras hay uno en curso se ve el aviso "En curso" sobre el menú (abajo en el celular, al final del menú lateral en el computador).
- Inicio ya muestra los días entrenados de la semana y sus totales.
- Prueba automática: `pruebas/parte3.mjs` en la carpeta temporal (siembra una rutina y un entrenamiento anterior directo en IndexedDB).

## Cómo quedó construida la Parte 4 (2026-11-01)

- Rutas: `/historial`, `/historial/:id` (detalle) y `/historial/:id/editar` (enfoque, con aviso al salir sin guardar).
- Calendario según la maqueta: días entrenados en púrpura, hoy con anillo dorado y días futuros tenues. No deja avanzar más allá del mes actual. El mes que se mira se recuerda al volver de un detalle (sessionStorage). Al tocar un día entrenado, la lista muestra solo ese día.
- Totales del mes: entrenamientos y tiempo total. "Semanas de constancia" cuenta semanas seguidas (de lunes a domingo) con al menos un entrenamiento; si esta semana aún no entrenas, no se corta.
- La lista va agrupada por semana ("Esta semana", "Semana pasada", "Semana del 12 de octubre"), con duración, kilos, ejercicios y récords.
- Los récords de cada sesión se calculan "en su momento", recorriendo el historial del más antiguo al más nuevo. Si se edita o borra una sesión, se recalculan solos.
- El editor permite cambiar nombre, fecha, hora, duración, series (con las mismas casillas del entrenamiento) y agregar o quitar ejercicios. Las series incompletas se marcan en rojo y bloquean el guardado.
- En el detalle del ejercicio, Resumen muestra "Última vez" y la pestaña Historial lista cada vez que se hizo. Los récords y el 1RM llegan en la parte 5.
- Prueba automática: `pruebas/parte4.mjs` (siembra 12 sesiones de octubre y noviembre). Después de escribir directo en IndexedDB hay que recargar, porque Dexie guarda en caché las consultas.

## Cómo quedó construida la Parte 5 (2026-11-01)

- El gráfico se dibuja con SVG propio (`GraficoLinea`), sin Recharts, para que la app pese menos. Sigue la maqueta: línea púrpura con área tenue y el último punto en dorado con su valor. Al tocar o pasar el mouse aparece una línea punteada con el valor y la fecha (también con las flechas del teclado), y hay una tabla oculta para lectores de pantalla. Los colores pasaron la revisión de contraste en oscuro y en claro.
- Métricas por tipo: pesas → 1RM estimado (Epley), peso máximo y volumen; peso corporal → más reps y reps totales; tiempo → mejor tiempo; cardio → distancia y ritmo (en el ritmo, menos es mejor). Periodos: 3 meses, 6 meses, 1 año y Todo. El ejercicio, la métrica y el periodo se recuerdan durante la sesión.
- Récords personales por tipo. Los que se lograron en la última sesión salen en dorado. Los tres números del Resumen en el detalle del ejercicio ya se llenan.
- Avisos (`lib/insights.ts`):
  - **Días sin entrenar:** desde 5 días.
  - **Estancado:** la mejor marca tiene 3 semanas o más y hubo 3 sesiones o más sin superarla, con una sugerencia concreta. Muestra hasta 2.
  - **Buen progreso:** en las últimas 12 semanas, 4 sesiones o más y una mejora de 5 % o más. Muestra hasta 2.
  - Solo se juzgan los ejercicios hechos en las últimas 2 semanas. El cardio no se juzga, porque la distancia varía a propósito. Al tocar un aviso se abre ese ejercicio en el gráfico.
- "Copiar resumen para Claude" (está en la maqueta de Progreso) queda para la Parte 7.
- Prueba automática: `pruebas/parte5.mjs` (siembra 3 meses: press banca que sube, sentadilla estancada, dominadas, plancha y trote).

## Plan técnico (Etapa 2)

- PWA con **Vite + React + TypeScript**, datos locales con **Dexie** (IndexedDB), gráficos en SVG propio (se descartó Recharts para que pese menos) y **vite-plugin-pwa** para instalarla y usarla sin internet.
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
