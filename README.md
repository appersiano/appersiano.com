# appersiano.com

This is the source code for **appersiano.com**, my personal website. It hosts my experiments, blog posts, and about me pages.

## Build (static site)

Content from `data/*.json` is pre-rendered at build time—no runtime `fetch`. Output in `dist/`:

```bash
npm run build
```

Then serve or deploy the `dist/` folder.

### GitHub Pages (Actions)

A workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`. To enable:

1. **Settings → Pages** → under "Build and deployment" choose **GitHub Actions** as source
2. Push to `main` — the workflow runs and deploys `dist/` automatically
