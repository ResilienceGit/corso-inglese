# EasyEnglish — demo sito + gestionale

Demo completa per EasyEnglish (corsi di inglese per bambini, adulti e aziende — Roma e online).

| URL | Cosa c'è |
|---|---|
| `/` | Pagina introduttiva «Abbiamo preparato una demo per te» |
| `/site/` | Sito pubblico (HTML renderizzato lato server, animazioni leggere in JS) |
| `/admin/` | Gestionale: richieste dal sito, clienti, appuntamenti, preventivi/fatture, pagamenti e scadenze, **editor dei contenuti del sito** |

## Avvio
```bash
npm install
npm start            # http://localhost:3000
```
Password gestionale demo: `easyenglish` (cambiala con `ADMIN_PASSWORD`).

Variabili: `PORT`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `DATA_DIR` (cartella del DB SQLite), `SEED_DEMO=0` per non inserire i dati di esempio.
`npm run seed` azzera il database e reinserisce contenuti e dati demo.

## Note tecniche
- Node ≥ 22.13 (usa `node:sqlite` integrato) + Express, nessuna build.
- Il form del sito salva le richieste (`POST /api/contact`, con honeypot e rate limit) e le mostra in *Richieste*, da dove si convertono in clienti.
- Testi, prezzi, FAQ e contatti del sito si modificano da *Contenuti sito* e sono pubblicati subito.
- Testi, prezzi e informativa privacy sono segnaposto di demo; nessuna recensione inventata.
