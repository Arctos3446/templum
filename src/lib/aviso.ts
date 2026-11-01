import { useEffect } from 'react'
import { leerAjustes } from './ajustes'

// Aviso al terminar el descanso: una campanita suave hecha con el navegador
// (sin archivos de audio) y una vibración corta.

let audio: AudioContext | null = null

/**
 * Hay que "despertar" el sonido con un toque del usuario (sobre todo en iPhone).
 * Se llama al marcar una serie.
 */
export function prepararSonido() {
  if (!leerAjustes().sonido) return
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    /* el navegador no tiene sonido */
  }
}

function campanita() {
  if (!audio) return
  const t = audio.currentTime
  // Dos notas (mi y si) que se apagan suave, como una campana pequeña.
  for (const [frec, inicio] of [
    [659.25, 0],
    [987.77, 0.18],
  ] as const) {
    const osc = audio.createOscillator()
    const vol = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = frec
    vol.gain.setValueAtTime(0.0001, t + inicio)
    vol.gain.exponentialRampToValueAtTime(0.35, t + inicio + 0.02)
    vol.gain.exponentialRampToValueAtTime(0.0001, t + inicio + 1.2)
    osc.connect(vol).connect(audio.destination)
    osc.start(t + inicio)
    osc.stop(t + inicio + 1.3)
  }
}

export function avisarFinDescanso() {
  const a = leerAjustes()
  if (a.sonido) campanita()
  if (a.vibrar) navigator.vibrate?.([220, 120, 220])
}

/** Mantiene la pantalla encendida mientras la pantalla que lo usa esté abierta. */
export function usePantallaEncendida(activo: boolean) {
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let vivo = true
    const pedir = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const l = await navigator.wakeLock.request('screen')
        if (vivo) lock = l
        else void l.release()
      } catch {
        /* sin batería suficiente o no permitido: no pasa nada */
      }
    }
    void pedir()
    // Al volver a la app, el navegador lo suelta; se pide de nuevo.
    document.addEventListener('visibilitychange', pedir)
    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', pedir)
      void lock?.release()
    }
  }, [activo])
}

/** Avisa cuando termina el descanso, esté donde esté el usuario dentro de la app. */
export function useVigiaDescanso(hasta: number | undefined) {
  useEffect(() => {
    if (!hasta) return
    const ms = hasta - Date.now()
    // Si ya terminó hace rato (por ejemplo, al volver a abrir la app), no suena.
    if (ms < -5000) return
    const t = window.setTimeout(avisarFinDescanso, Math.max(0, ms))
    return () => window.clearTimeout(t)
  }, [hasta])
}
