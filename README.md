<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/521bcbd1-0e3b-4c8c-bb5e-00a3493a96c6

## Run Locally

**Prerequisites:** Node.js 20 or newer


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to the `main` branch.
2. The repository already contains a GitHub Actions workflow that builds the app and deploys `dist/` to GitHub Pages on pushes to `main` (see `.github/workflows/deploy.yml`).
3. The workflow sets `VITE_BASE=./` so the build works on Pages; no additional config is required if your `firebase-applet-config.json` is committed in the repo.
4. The project now supports using GitHub Secrets to inject Firebase config at build time. To avoid committing `firebase-applet-config.json`, add the following repository secrets (Settings > Secrets > Actions):

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID` (optional)

The workflow will map these secrets to Vite env vars (`VITE_FIREBASE_*`) during the build step.

After pushing to `main`, open the Actions tab and wait for the `Deploy to GitHub Pages` workflow to finish. GitHub Pages will publish the site; the Pages URL is shown in the repository Settings > Pages.
