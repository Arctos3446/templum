/*
 * Calendario litúrgico de Templum.
 *
 * Calcula, para cualquier fecha, la celebración del día, su color y el tiempo litúrgico.
 * Usa los datos de calendario.json y sigue las Normas universales sobre el año litúrgico
 * (tabla de precedencia), con las fiestas que en Chile se trasladan al domingo:
 * Epifanía (domingo entre el 2 y el 8 de enero), Ascensión y Corpus Christi.
 *
 * Al construir la app, este archivo pasa a src/lib/liturgia.ts.
 *
 * Uso:
 *   const calendario = Liturgia.crear(datosDeCalendarioJson);
 *   calendario.dia(new Date())  ->  { nombre, color, tiempo, rango, ... }
 */
(function (raiz) {
  'use strict';

  var DIA = 86400000;
  var ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV',
    'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII',
    'XXVIII', 'XXIX', 'XXX', 'XXXI', 'XXXII', 'XXXIII', 'XXXIV'];
  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Precedencia: número más bajo, más importante (Normas universales, n. 59).
  var PREC = { triduo: 1, mayor: 2, solemnidad: 3, solemnidadPropia: 4, fiestaDelSenor: 5, domingo: 6,
    fiesta: 7, fiestaPropia: 8, feriaPrivilegiada: 9, memoria: 10, memoriaPropia: 11, libre: 12, feria: 13 };

  function fecha(anio, mes, dia) { return Date.UTC(anio, mes - 1, dia); }
  function diaSemana(t) { return new Date(t).getUTCDay(); }
  function domingoAntes(t) { return t - diaSemana(t) * DIA; }
  function clave(t) {
    var d = new Date(t);
    return String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function semanas(desde, hasta) { return Math.round((hasta - desde) / (7 * DIA)); }

  // Domingo de Pascua (algoritmo anónimo gregoriano, de Meeus).
  function pascua(anio) {
    var a = anio % 19, b = Math.floor(anio / 100), c = anio % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return fecha(anio, mes, dia);
  }

  // Las fechas que ordenan el año civil.
  function hitos(anio) {
    var p = pascua(anio);
    var epifania = domingoAntes(fecha(anio, 1, 8));
    var dia = new Date(epifania).getUTCDate();
    var navidad = fecha(anio, 12, 25);
    var adviento = domingoAntes(fecha(anio, 12, 3));
    var sagradaFamilia = diaSemana(navidad) === 0 ? fecha(anio, 12, 30) : navidad + (7 - diaSemana(navidad)) * DIA;
    return {
      pascua: p,
      ceniza: p - 46 * DIA,
      cuaresma1: p - 42 * DIA,
      ramos: p - 7 * DIA,
      juevesSanto: p - 3 * DIA,
      pentecostes: p + 49 * DIA,
      epifania: epifania,
      // Si la Epifanía cae el 7 u 8 de enero, el Bautismo pasa al lunes siguiente.
      bautismo: dia >= 7 ? epifania + DIA : epifania + 7 * DIA,
      adviento: adviento,
      cristoRey: adviento - 7 * DIA,
      navidad: navidad,
      sagradaFamilia: sagradaFamilia
    };
  }

  // El día según el tiempo litúrgico, sin santos.
  function feria(t, h) {
    var ds = diaSemana(t), dom = ds === 0, n;
    if (t >= h.adviento && t < h.navidad) {
      n = semanas(h.adviento, domingoAntes(t)) + 1;
      if (dom) return { tiempo: 'adviento', nombre: ROMANOS[n] + ' Domingo de Adviento', prec: PREC.mayor, color: n === 3 ? 'rosa' : 'morado' };
      var mes = new Date(t).getUTCDate();
      return { tiempo: 'adviento', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana de Adviento',
        prec: mes >= 17 ? PREC.feriaPrivilegiada : PREC.feria, color: 'morado' };
    }
    if (t >= h.navidad) {
      return { tiempo: 'navidad', nombre: 'Octava de Navidad', prec: PREC.feriaPrivilegiada, color: 'blanco' };
    }
    if (t < h.bautismo) {
      if (dom) return { tiempo: 'navidad', nombre: 'Domingo del tiempo de Navidad', prec: PREC.domingo, color: 'blanco' };
      return { tiempo: 'navidad', nombre: DIAS[ds] + ' del tiempo de Navidad', prec: PREC.feria, color: 'blanco' };
    }
    if (t < h.ceniza) {
      // La semana I empieza después del Bautismo; si este cae en lunes, se cuenta desde la Epifanía.
      var ref = diaSemana(h.bautismo) === 0 ? h.bautismo : h.epifania;
      return ordinario(semanas(ref, domingoAntes(t)) + 1, ds);
    }
    if (t < h.juevesSanto) {
      if (t === h.ceniza) return { tiempo: 'cuaresma', nombre: 'Miércoles de Ceniza', prec: PREC.mayor, color: 'morado' };
      if (t < h.cuaresma1) return { tiempo: 'cuaresma', nombre: DIAS[ds] + ' después de Ceniza', prec: PREC.feriaPrivilegiada, color: 'morado' };
      if (t === h.ramos) return { tiempo: 'cuaresma', nombre: 'Domingo de Ramos en la Pasión del Señor', prec: PREC.mayor, color: 'rojo' };
      if (t > h.ramos) return { tiempo: 'cuaresma', nombre: DIAS[ds] + ' Santo', prec: PREC.mayor, color: 'morado' };
      n = semanas(h.cuaresma1, domingoAntes(t)) + 1;
      if (dom) return { tiempo: 'cuaresma', nombre: ROMANOS[n] + ' Domingo de Cuaresma', prec: PREC.mayor, color: n === 4 ? 'rosa' : 'morado' };
      return { tiempo: 'cuaresma', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana de Cuaresma', prec: PREC.feriaPrivilegiada, color: 'morado' };
    }
    if (t < h.pascua) {
      if (t === h.juevesSanto) return { tiempo: 'triduo', nombre: 'Jueves Santo de la Cena del Señor', prec: PREC.triduo, color: 'blanco' };
      if (t === h.juevesSanto + DIA) return { tiempo: 'triduo', nombre: 'Viernes Santo de la Pasión del Señor', prec: PREC.triduo, color: 'rojo' };
      return { tiempo: 'triduo', nombre: 'Sábado Santo', prec: PREC.triduo, color: 'morado' };
    }
    if (t <= h.pentecostes) {
      if (t === h.pascua) return { tiempo: 'pascua', nombre: 'Domingo de Pascua de la Resurrección del Señor', prec: PREC.triduo, color: 'blanco' };
      if (t < h.pascua + 7 * DIA) return { tiempo: 'pascua', nombre: DIAS[ds] + ' de la Octava de Pascua', prec: PREC.mayor, color: 'blanco' };
      n = semanas(h.pascua, domingoAntes(t)) + 1;
      if (n === 2 && dom) return { tiempo: 'pascua', nombre: 'II Domingo de Pascua o de la Divina Misericordia', prec: PREC.mayor, color: 'blanco' };
      if (dom) return { tiempo: 'pascua', nombre: ROMANOS[n] + ' Domingo de Pascua', prec: PREC.mayor, color: 'blanco' };
      return { tiempo: 'pascua', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana de Pascua', prec: PREC.feria, color: 'blanco' };
    }
    // Después de Pentecostés las semanas se cuentan hacia atrás desde Cristo Rey (semana XXXIV).
    return ordinario(34 - semanas(domingoAntes(t), h.cristoRey), ds);
  }

  function ordinario(n, ds) {
    if (ds === 0) return { tiempo: 'ordinario', nombre: ROMANOS[n] + ' Domingo del Tiempo Ordinario', prec: PREC.domingo, color: 'verde' };
    return { tiempo: 'ordinario', nombre: DIAS[ds] + ' de la ' + ROMANOS[n] + ' semana del Tiempo Ordinario', prec: PREC.feria, color: 'verde' };
  }

  function precedencia(c) {
    if (c.precedencia) return c.precedencia;
    var propia = !!c.region;
    if (c.rango === 'solemnidad') return propia ? PREC.solemnidadPropia : PREC.solemnidad;
    if (c.rango === 'fiesta') return c.delSenor ? PREC.fiestaDelSenor : (propia ? PREC.fiestaPropia : PREC.fiesta);
    if (c.rango === 'memoria') return propia ? PREC.memoriaPropia : PREC.memoria;
    return PREC.libre;
  }

  function fechaMovil(regla, h) {
    if (regla === 'epifania') return h.epifania;
    if (regla === 'bautismo') return h.bautismo;
    if (regla === 'sagrada-familia') return h.sagradaFamilia;
    var m = /^(pascua|adviento)([+-]\d+)$/.exec(regla);
    if (!m) throw new Error('Regla desconocida: ' + regla);
    return h[m[1]] + Number(m[2]) * DIA;
  }

  function crear(datos) {
    // Las celebraciones propias (Chile, América) reemplazan a las generales del mismo día.
    var propias = {};
    datos.fijas.forEach(function (c) { if (c.region) propias[c.fecha] = true; });
    var fijas = datos.fijas.filter(function (c) { return c.region || !propias[c.fecha]; });
    var cache = {};

    function anio(a) {
      if (cache[a]) return cache[a];
      var h = hitos(a);
      var dias = {};
      for (var t = fecha(a, 1, 1); t <= fecha(a, 12, 31); t += DIA) {
        dias[clave(t)] = { t: t, feria: feria(t, h), celebraciones: [], conmemoraciones: [] };
      }
      function cima(d) {
        return d.celebraciones.reduce(function (min, c) { return Math.min(min, c.prec); }, d.feria.prec);
      }
      function poner(t, c) { dias[clave(t)].celebraciones.push(c); }

      datos.moviles.forEach(function (m) {
        var t = fechaMovil(m.regla, h);
        if (new Date(t).getUTCFullYear() === a) poner(t, Object.assign({ prec: precedencia(m) }, m));
      });

      fijas.forEach(function (f) {
        var p = f.fecha.split('-');
        var t = fecha(a, Number(p[0]), Number(p[1]));
        var c = Object.assign({ prec: precedencia(f) }, f);
        var d = dias[f.fecha];
        var solemnidad = c.prec <= PREC.solemnidadPropia;
        // Dos memorias del mismo rango conviven (por ejemplo, San Fabián y San Sebastián); dos solemnidades no.
        if (c.prec < cima(d) || (!solemnidad && c.prec === cima(d) && c.prec < d.feria.prec)) { poner(t, c); return; }
        if (solemnidad) {
          // Solemnidad impedida: se traslada.
          var nueva;
          if (f.fecha === '03-19' && t >= h.ramos) nueva = h.ramos - DIA;
          else if (f.fecha === '03-25' && t >= h.ramos && t <= h.pascua + 7 * DIA) nueva = h.pascua + 8 * DIA;
          else {
            nueva = t + DIA;
            while (dias[clave(nueva)] && cima(dias[clave(nueva)]) <= PREC.fiestaPropia) nueva += DIA;
            if (!dias[clave(nueva)] || new Date(nueva).getUTCFullYear() !== a) return;
          }
          poner(nueva, Object.assign({ trasladada: true }, c));
          return;
        }
        // Memorias en Cuaresma, del 17 al 24 de diciembre y en la Octava de Navidad: solo se recuerdan.
        if (c.prec >= PREC.memoria && d.feria.prec === PREC.feriaPrivilegiada && !d.celebraciones.length) {
          d.conmemoraciones.push(c.nombre);
        }
      });

      cache[a] = { hitos: h, dias: dias };
      return cache[a];
    }

    function dia(entrada) {
      var t = entrada instanceof Date
        ? fecha(entrada.getFullYear(), entrada.getMonth() + 1, entrada.getDate())
        : fecha(entrada[0], entrada[1], entrada[2]);
      var a = new Date(t).getUTCFullYear();
      var info = anio(a);
      var d = info.dias[clave(t)];
      var lista = d.celebraciones.slice().sort(function (x, y) { return x.prec - y.prec; });
      // Con igual precedencia gana la celebración (Epifanía, Ascensión y Pentecostés sobre su domingo).
      var gana = lista.length && lista[0].prec <= d.feria.prec ? lista[0] : null;
      var anioLiturgico = t >= info.hitos.adviento ? a + 1 : a;
      return {
        fecha: clave(t),
        tiempo: d.feria.tiempo,
        nombre: gana ? gana.nombre : d.feria.nombre,
        rango: gana ? gana.rango : 'feria',
        // En las memorias libres se mantiene el color del tiempo.
        color: gana && gana.rango !== 'libre' ? gana.color : d.feria.color,
        feria: d.feria.nombre,
        otras: gana ? lista.slice(1).filter(function (c) { return c.prec === gana.prec; }).map(function (c) { return c.nombre; }) : [],
        conmemoraciones: gana ? [] : d.conmemoraciones,
        trasladada: !!(gana && gana.trasladada),
        ciclo: ['C', 'A', 'B'][anioLiturgico % 3],
        anioPar: anioLiturgico % 2 === 0
      };
    }

    return { dia: dia, hitos: hitos, pascua: pascua };
  }

  var api = { crear: crear, pascua: pascua };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Liturgia = api;
})(this);
