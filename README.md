# VeriTouch: Verified Visuo-Tactile World Models that Improve Robot Policy Learning

Shuxun Wang<sup>1,\*</sup>, Xiaonan Jiang<sup>2,\*</sup>, Zhaoyu Wang<sup>1,\*</sup>, Ziyuan Chu<sup>1,\*</sup>, Xihang Yue<sup>1</sup>, Pengfei Liu<sup>3</sup>, Haodong Zhu<sup>4</sup>, Shiqi Liu<sup>5</sup>, Mingzhi Zheng<sup>6</sup>, Liang Su<sup>7</sup>, Linchao Zhu<sup>1,†</sup>

<sup>1</sup>Zhejiang University · <sup>2</sup>City University of Hong Kong · <sup>3</sup>Nanyang Technological University · <sup>4</sup>Technical University of Munich · <sup>5</sup>Zhejiang University City College · <sup>6</sup>Nanjing University · <sup>7</sup>Hangzhou Institute for Advanced Study, UCAS

<sup>\*</sup>Equal contribution · <sup>†</sup>Corresponding author

**Project page:** https://zjuscl.github.io/veritouch/ · Paper, arXiv and code: coming soon

## Overview

Teaching robots contact-rich manipulation takes visuo-tactile demonstrations, which are expensive to collect on real hardware and hard to simulate faithfully. VeriTouch turns a world model into a source of verified visuo-tactile training data:

1. **VeriGen** generates complete manipulation rollouts, dual-view video together with bilateral touch, from the initial camera frames and a task instruction.
2. **VeriEval** keeps only the rollouts it can trust. Each one must pass four checks in order: visual physics (a fine-tuned VLM judge on both cameras), contact timing (contact seen by the wrist camera must line up with contact felt by touch), tactile realism and force plausibility.
3. **VeriIDM** recovers the robot's actions for every frame from the two camera views.
4. The verified synthetic demonstrations are mixed with real ones to train vision-only and visuo-tactile policies.

## Results

On five real-robot tasks (chip pick, egg pick, charger press, pull-back car, whiteboard erase):

- Adding verified synthetic data raises the mean success rate of four policies (ACT, π0.5, N0-VTLA, FTP-1) from **19.4% to 33.8%**. Unfiltered synthetic data reaches only 22.9%.
- Scaling synthetic data to 4× the real data lifts N0-VTLA from **33.0% to 67.0%** without collecting more real demonstrations.
- Verification matters: unfiltered 33.3%, visual checks only 43.3%, visual + touch checks **51.7%** (N0-VTLA). Training without the generated touch drops it to 26.0%.
- Actions extracted by VeriIDM succeed **94.0%** of the time when replayed on the real robot (best baseline 84.0%).

## Citation

```bibtex
@misc{veritouch2027,
  title  = {VeriTouch: Verified Visuo-Tactile World Models that Improve Robot Policy Learning},
  author = {Wang, Shuxun and Jiang, Xiaonan and Wang, Zhaoyu and Chu, Ziyuan and Yue, Xihang and Liu, Pengfei and Zhu, Haodong and Liu, Shiqi and Zheng, Mingzhi and Su, Liang and Zhu, Linchao},
  year   = {2027}
}
```

---

## About this repository

This repository is the project page: a static site with no build step. The page runs top to bottom as: title and film, abstract, an interactive "How it works" animation, real-robot results, generated vs. real (with other world models in a collapsed dropdown), why verification and touch matter, action extraction, and the citation.

```bash
python3 -m http.server 8000        # then open http://localhost:8000
```

| File | What it holds |
|---|---|
| `index.html` | All page content |
| `hero.css`, `hero.js`, `hero-data.js` | Title block, film, and the "How it works" animation: six real generated rollouts and their real verifier records |
| `page.css`, `main.js` | Results charts, generated-vs-real comparison, other-world-models dropdown, verification charts, action-extraction chart, real-world rollout pairs; also the page's restyled navbar, BibTeX block and footer |
| `style.css` | Base layout of the navbar and footer |
| `assets/` | Film, rollout clips, generated-vs-real clips, hero media, share-preview image (`fig/og.jpg`) |
| `_build/` | Scripts that regenerate the clips in `assets/video` from the source recordings |

Every number on the page is taken from the paper (Tables 1, 4, 5 and 6, Fig. 3) or from the verifier records of the rollouts shown. The radar chart's per-task values below 4× are read from the vector figure of Fig. 3, since the paper prints only the 4× values.

### Still to fill in

Search the code for `TODO(`:

- `TODO(cases)`: real-world rollout pairs (`EXEC` in `main.js`).
- `TODO(models)`: other world models' outputs. Put each clip at `assets/video/cmp/<task>_<model>.mp4` (+ `.jpg` poster), for example `cmp/chip_pick_cosmossuper.mp4`, and add `<task>_<model>` to `READY` in `main.js`. Hovering a pending tile shows its expected file name.
- `TODO(links)`: Paper, arXiv and Code buttons.
- `TODO(bibtex)`: final citation.

### Rebuilding media

`_build/build_videos.py` (film, rollout clips, generated-vs-real clips) and `_build/build_v2_media.py` (third-person | wrist strips) read the source recordings from the shared workspace and write into `assets/video`. Run `build_videos.py` first.

`_build/make_og.cjs` re-renders the share-preview image from the running page (title plus the finished flowchart); run it after changing the animation.
