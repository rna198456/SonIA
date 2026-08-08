// ─────────────────────────────────────────────────────────────────────────────
// concepts.js — Base teórica y glosario técnico de SonIA
// Mismo shape que el concepts.js de CHIONIA (title/aliases/summary/explanation/
// classroomUse/examples) — pensado para poder importarse en ambos proyectos
// sin duplicar código. El modo "teoria" y el modo "wildtracks" citan de acá.
// ─────────────────────────────────────────────────────────────────────────────

export const CONCEPTS = {
  // ── Michel Chion — «La Audiovisión» ─────────────────────────────────────
  valorAnadido: {
    title: "VALOR AÑADIDO (Chion)",
    aliases: ["valor anadido", "added value"],
    summary: "El sonido no se limita a acompañar la imagen: crea la impresión de que la información que aporta ya estaba contenida en ella.",
    explanation: "Chion señala que, una vez que un sonido se pega a una imagen, es casi imposible evaluar el efecto de la imagen sola: el sonido parece haber estado siempre ahí, aportando ritmo, textura o sentido que en realidad no está en el plano visual.",
    classroomUse: "Sirve para justificar cualquier capa sonora que cambia la lectura emocional de un plano sin que la imagen cambie una sola vez de encuadre.",
    examples: [
      "Un mismo primer plano de un rostro neutro lee como amenazante o como tierno según la música que se le agregue.",
      "Grabar una misma ambiente en 3 intensidades permite reescribir el clima de una escena en la mezcla sin volver a rodar.",
    ],
  },

  sincresis: {
    title: "SÍNCRESIS (Chion)",
    aliases: ["sincresis", "synchresis"],
    summary: "La soldadura mental automática e irresistible entre un sonido y un evento visual cuando ocurren al mismo tiempo, aunque no tengan relación real entre sí.",
    explanation: "Es el mecanismo que hace posible el Foley: cualquier sonido con la envolvente y el timing correctos se lee como \"el\" sonido de una acción, sin importar qué objeto lo generó realmente en la grabación.",
    classroomUse: "Fundamenta por qué el timing de un wild track de utilería importa más que su fidelidad literal a la fuente.",
    examples: [
      "Un crujido de cuero grabado por separado se percibe como parte del cuerpo del actor si entra sincronizado con su movimiento.",
      "Un tic-tac de reloj que se desincroniza levemente de los cortes de cámara rompe la síncresis a propósito, generando extrañeza.",
    ],
  },

  acusmetro: {
    title: "ACUSMÉTRO (Chion)",
    aliases: ["acusmetro", "acousmetre", "voz acusmática"],
    summary: "Un personaje cuya voz se escucha en escena sin que su cuerpo sea (todavía) visible — y que por eso mismo tiene un poder narrativo especial.",
    explanation: "Mientras el acusmétro permanece sin cuerpo visible conserva una omnisciencia o amenaza latente; en el momento en que se lo \"desacusmatiza\" (se le muestra la cara), pierde ese poder y se vuelve un personaje más.",
    classroomUse: "Útil para decisiones de blocking de cámara y de mic tan pronto se decide retrasar la revelación visual de una fuente de diálogo.",
    examples: [
      "Una voz en off por handy o intercomunicador que da órdenes antes de que se revele quién habla.",
      "Un personaje que solo se escucha detrás de una puerta cerrada durante varias escenas.",
    ],
  },

  puntoEscucha: {
    title: "PUNTO DE ESCUCHA (Chion)",
    aliases: ["punto de escucha", "point of audition"],
    summary: "El equivalente sonoro del punto de vista: el lugar (físico o narrativo) desde el que el relato nos hace \"escuchar\" la escena.",
    explanation: "Puede coincidir con el oído literal de un personaje (subjetivo — sonido amortiguado, tinnitus, latido) o ser un punto de escucha narrativo más abstracto, independiente de cualquier personaje puntual.",
    classroomUse: "Guía decisiones de mezcla y de qué wild tracks priorizar (respiración, latido) cuando una escena necesita subjetivizarse sin cortar cámara.",
    examples: [
      "Atenuar el diálogo del resto de la sala y resaltar la respiración de un personaje en shock.",
      "Un sonido de tráfico que se atenúa por completo cuando la cámara entra a un auto con las ventanillas subidas.",
    ],
  },

  // ── Carmelo Saitta — «Cine y música: textos reunidos» ───────────────────
  sonidosAcusmaticos: {
    title: "SONIDOS ACUSMÁTICOS (Saitta)",
    aliases: ["sonido acusmatico", "sonidos acusmaticos", "de lo oculto al extrañamiento"],
    summary: "Sonidos sin fuente visible ni identificable por experiencia previa, sin relación causa-efecto reconocible — distinto del fuera de campo de Chion, que sí remite a una fuente diegética aunque no visible.",
    explanation: "Donde el fuera de campo asume una fuente real que simplemente no entra en cuadro, el sonido acusmático de Saitta no evoca ninguna imagen mental previa: no hay nada que \"buscar\" fuera de cuadro. Su efecto no es informativo sino de extrañamiento — perturba antes de significar.",
    classroomUse: "Central para diseño sonoro de suspenso/thriller psicológico: genera ambigüedad antes de que la trama la explique, sin depender de qué hay literalmente fuera de cuadro.",
    examples: [
      "Un zumbido de baja frecuencia sin fuente visible en una escena de tensión.",
      "Un elemento diegético (como un reloj) que se desincroniza sutilmente de la imagen hasta volverse irreconocible como \"el\" reloj.",
    ],
  },

  // ── Glosario de producción (craft, no teoría) ────────────────────────────
  wildTrack: {
    title: "WILD TRACK",
    aliases: ["wild track", "toma salvaje"],
    summary: "Grabación de sonido hecha en el set o la locación, sin cámara rodando, para usar como insumo de posproducción.",
    explanation: "A diferencia del sonido sincrónico (grabado junto con la imagen), el wild track se planifica y se pide explícitamente porque cubre algo que el diálogo sincrónico no va a dar: una textura, una variación, un detalle aislado.",
    classroomUse: "Todo wild track que proponés en el Dossier necesita una razón narrativa concreta — si no la tiene, no vale la pena pedirle tiempo al rodaje para grabarlo.",
    examples: ["Room tone", "Una respiración aislada", "Una variación de intensidad de lluvia"],
  },

  roomTone: {
    title: "ROOM TONE",
    aliases: ["room tone", "tono de sala", "ambiente base"],
    summary: "El \"silencio\" característico de una locación — nunca es silencio real, es la huella acústica del espacio vacío.",
    explanation: "Se graba siempre, incluso si el diálogo sincrónico salió limpio: es lo que permite a edición empalmar cortes sin que se note el cambio de aire entre tomas.",
    classroomUse: "Se pide antes de mover al elenco del set, con el ambiente lo más parecido posible al de rodaje (mismo clima, misma actividad de fondo).",
    examples: ["Interior con lluvia de fondo constante", "Exterior con tránsito variable"],
  },

  boomVsSolapero: {
    title: "BOOM vs. SOLAPERO/CORBATERO",
    aliases: ["boom vs lavalier", "mic de planta vs solapero"],
    summary: "Dos formas de cubrir diálogo con tradeoffs opuestos: el boom da mejor timbre y menos roce de tela; el solapero/corbatero da más consistencia cuando el boom no puede acercarse o quedar fuera de cuadro.",
    explanation: "La decisión no es fija por proyecto sino por escena: multicámara, planos secuencia largos, 360° o vestuario conflictivo empujan la cobertura hacia el solapero como fuente principal y el boom como respaldo de ambiente — el resto de los casos suele ser al revés.",
    classroomUse: "Es la decisión que resuelve el Módulo de Microfonía de SonIA para cada actor y cada escena, no una regla general.",
    examples: ["Boom principal + solapero de respaldo (2D estándar)", "Solapero principal + boom solo de ambiente (360°, multicámara, plano secuencia largo)"],
  },
};

export default CONCEPTS;
