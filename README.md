# SonIA — Coordinadora de Departamento de Sonido

Asistente de preproducción y bitácora de rodaje para sonido directo. No edita
audio: cruza guion, casting y plan de rodaje para proponer esquemas de
microfonía, wild tracks fundamentados y partes de sonido digitales — en
tablas Markdown listas para pegar en Google Sheets.

Mismo criterio que [CHIONIA](https://github.com/rna198456/CHIONIA): React +
Vite, GitHub Pages, cada usuario trae su propia clave de Groq. **$0 de
hosting.**

## Arquitectura en 30 segundos

- `src/data/sonPrompt.js` — el prompt maestro: `BASE_PROMPT` (siempre activo)
  + `MODE_PROMPTS` (un fragmento por botón del menú, se concatena según el
  modo activo). También vive acá `MODES`, `GENERATION_CONFIG` por modo, y la
  lista de modelos de Groq.
- `src/data/concepts.js` — base teórica (Chion, Saitta) y glosario de
  producción, mismo *shape* que el `concepts.js` de CHIONIA.
- `src/utils/classifier.js` — sugiere el modo activo por keywords, sin
  gastar tokens del LLM.
- `src/utils/groqApi.js` — la llamada a la API, con fallback entre modelos.
- `src/components/` — UI: `ApiKeySetup`, `ModeSelector`, `Message` (Markdown
  con tablas exportables), `LevelMeter` (el indicador de "generando").

## Instalación local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Te va a pedir una clave de Groq (gratis en
[console.groq.com/keys](https://console.groq.com/keys), empieza con `gsk_`)
— se guarda solo en tu navegador, no hay backend propio.

## Deploy a GitHub Pages

1. Subí este repo a GitHub (ver más abajo).
2. **Settings → Pages → Source: GitHub Actions.**
3. Cada push a `main` dispara `.github/workflows/deploy.yml`, que
   compila y publica `dist/` automáticamente. No hace falta `gh-pages` ni
   tocar ninguna rama a mano.

## Subir a GitHub por primera vez

```bash
cd sonia
git init
git add .
git commit -m "SonIA v1"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/sonia.git
git push -u origin main
```

## Modo Guion (guiones de largometraje, 100+ páginas)

Botón 📎 al lado del input. Al subir un PDF:

- **< 6 escenas detectadas** → panel para elegir cuáles insertar en el chat y trabajarlas a fondo con los modos normales.
- **≥ 6 escenas** → además ofrece "Escanear el guion completo": arma lotes de 3-5 escenas (`scriptParser.batchScenes`, acotado también por caracteres, no solo cantidad), y los procesa uno por uno contra Groq con `structured outputs` (`json_schema`, `strict: true` — soportado en `gpt-oss-120b`/`20b`) para extraer `ambientes`/`foley`/`fx` por escena.
- El ritmo entre lotes lo maneja un rate limiter real (`groqApi.js: TokenRateLimiter`) que trackea tokens usados en la ventana de 60s, no un delay fijo — clave para no repetir el 413 de TPM en un guion largo.
- Cada lote que termina se inyecta al chat como un mensaje más (`batchToMarkdown.js`) — hereda gratis el render de tablas y el botón de exportar CSV de `Message.jsx`. Un lote que falla no corta la corrida: queda marcado con error y se puede reintentar esa escena a mano.
- El contexto global que viaja en cada lote combina dos capas: metadata determinística gratis (`scriptParser.extractDeterministicContext` — locaciones, INT/EXT, día/noche, sin costo de API) + un resumen narrativo opcional de 1 sola llamada barata (`groqApi.summarizeScriptForContext`, botón "✨ Completar con IA").
- `pdfjs-dist` se importa dinámicamente recién al elegir un archivo (no infla el bundle inicial — el chunk pesa ~480 KB y solo se baja si se usa 📎).



Por default `SHEETS_ENDPOINT` está vacío y SonIA funciona igual — solo no
persiste el historial fuera de tu navegador. Para loguear cada Parte de
Sonido en una Sheet:

1. Seguí las instrucciones dentro de `apps-script/Code.gs`.
2. Pegá la URL del Web App resultante en `SHEETS_ENDPOINT`
   (`src/data/sonPrompt.js`).

## Sobre los modelos de Groq

`GROQ_MODELS` usa `openai/gpt-oss-120b` (principal) y `openai/gpt-oss-20b`
(fallback) — verificados vigentes al 07/08/2026. **`llama-3.3-70b-versatile`
se da de baja el 16/08/2026**, por eso no está en la lista (ver nota aparte
sobre CHIONIA, que sí lo usa todavía). Antes de reactivar este proyecto
después de un tiempo sin tocarlo, vale la pena chequear
[console.groq.com/docs/deprecations](https://console.groq.com/docs/deprecations).

## Próximos pasos posibles

- Sumar un modo "onboarding" guiado con formulario (hoy el alta del
  proyecto es conversacional, vía `WELCOME_MESSAGE`).
- Reusar `src/data/concepts.js` como paquete compartido entre SonIA y
  CHIONIA en vez de mantener dos copias.
- Fallback de modelo local en el navegador (como `src/llm/` en CHIONIA),
  si en algún momento hace falta funcionar sin clave de Groq.
