# appersiano.com

Sito personale di Alessandro Persiano, aka appersiano.

La homepage si presenta come AI Product & Software Engineer: prodotti digitali, sperimentazione e community. La consulenza non si chiede qui. Il link porta a [etnatech.it](https://etnatech.it).

## Cosa c'è

- **Homepage** (`/`): intro, link social, e quattro schede — Esperimenti, Post, Talk, Community.
- **Privacy di Stage Timer** (`/apps/stagetimer/privacypolicy`).
- **Video Stream Quality Test** (`/utility/vsqt`), una pagina per controllare testo e resa video.

Le schede della homepage leggono i contenuti da `data/experiments.json`, `data/blog.json`, `data/talks.json` e `data/community.json`.

## In locale

Serve un server, perché la homepage carica i JSON a runtime.

```bash
python3 -m http.server
```

Poi apri `http://127.0.0.1:8000/`.
