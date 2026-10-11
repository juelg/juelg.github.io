# juelg.github.io

Source for [tobiasjuelg.de](https://tobiasjuelg.de): a static research profile built from plain HTML, CSS and JS, with no build step.

```
index.html              # all content (papers, software, links)
assets/css/style.css    # theme (dark default + light toggle)
assets/js/main.js       # theme toggle, media galleries, lazy videos, BibTeX copy
assets/papers/<slug>/   # figures and videos per paper
assets/projects/        # media for the software section
CNAME                   # custom domain for GitHub Pages
```

## Local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Adding a paper

Copy one `<article class="paper">` block in `index.html` (or a `pub-compact` block for a
smaller entry), drop its media into `assets/papers/<slug>/` and update the links and BibTeX.
Videos use `data-src` so they only load when scrolled into view. Keep clips under about 15 MB.

To show the paper figure first and then fade over to a video once the card has been in view for about 2 s,
use a staged media block (`STAGE_DELAY` in `main.js` sets the delay):

```html
<div class="media-main staged">
  <img class="stage-figure" src="assets/papers/x/figure.png" alt="...">
  <video class="stage-video" data-stage-src="assets/papers/x/demo.mp4" muted loop playsinline></video>
  <span class="stage-progress" aria-hidden="true"></span>
</div>
```

Add the `contain` class to the video to letterbox it instead of cropping (useful for square clips).

## Deployment (GitHub Pages + tobiasjuelg.de)

1. Push this folder to `github.com/juelg/juelg.github.io` (branch `master`).
2. Repo → Settings → Pages: *Deploy from a branch*, `master` / `(root)`. The custom domain is taken from `CNAME`.
3. DNS for `tobiasjuelg.de`:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records for `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www` → `juelg.github.io`
4. Once the certificate has been issued, tick **Enforce HTTPS**.
5. Optional: verify the domain under GitHub → Settings → Pages (account level) to prevent domain takeover.
6. Optional: point `juelg.dev` at the site with a redirect (URL forwarding at your registrar to `https://tobiasjuelg.de`).
