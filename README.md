# Imane Meftah — Portfolio

A motion-driven, bilingual (English / 中文) portfolio for an International Business student,
built as a static site for **GitHub Pages**. No build step: just HTML, CSS and JavaScript.

**Concept: "From Morocco to the World, via China."** A trade route runs through the page,
projects are presented as shipments with boarding-pass cards, and languages appear as passport stamps.

## Add your files

| File | What it is |
|---|---|
| `assets/photo.jpg` | Portrait for the hero arch (portrait ratio, about 900×1200). Without it, an "IM" monogram shows instead. |
| `assets/Imane-Meftah-CV.pdf` | Linked from the "Download CV" button. Until it exists, the button hides itself on the live site. Remember that the CV includes a phone number. |

To add a photo or link to a project card, open `index.html`, find the card, and put an
`<img src="assets/...">` inside its `.card__media` box.

## Edit text

All copy lives in **`js/i18n.js`**, with English and Chinese side by side.
Have the Chinese text proofread by a native speaker before sharing.

## Publish on GitHub Pages

1. Create a GitHub repository named **`<your-username>.github.io`**. That name gives the site the address `https://<your-username>.github.io`.
2. Upload the site files: `index.html`, `css/`, `js/`, `assets/`, `.nojekyll` and `README.md`.
   **Don't upload** the CV `.docx` (it contains a phone number), the LinkedIn notes or the original photo. `.gitignore` already excludes them if you use git. You can drag and drop on github.com, or run:
   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages** and set *Source* to `Deploy from a branch`, using `main` and `/ (root)`.
4. After about a minute the site is live. Put the link on your CV and your LinkedIn profile.

## Preview locally

Open `index.html` directly in a browser, or serve the folder with `npx serve .`

## Tech

- [GSAP](https://gsap.com) with ScrollTrigger and MotionPath for all animation
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- Fonts: Fraunces, Inter, JetBrains Mono, Noto Serif/Sans SC and Noto Naskh Arabic (Google Fonts)
- Respects `prefers-reduced-motion`, works on mobile, and still reads correctly without JavaScript
