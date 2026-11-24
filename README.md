# VeriTouch: Verified Visuo-Tactile World Models that Improve Robot Policy Learning

Shuxun Wang<sup>1,\*</sup>, Xiaonan Jiang<sup>2,\*</sup>, Zhaoyu Wang<sup>1,\*</sup>, Ziyuan Chu<sup>1,\*</sup>, Xihang Yue<sup>1</sup>, Pengfei Liu<sup>3</sup>, Haodong Zhu<sup>4</sup>, Shiqi Liu<sup>5</sup>, Mingzhi Zheng<sup>6</sup>, Liang Su<sup>7</sup>, Linchao Zhu<sup>1,†</sup>

<sup>1</sup>Zhejiang University · <sup>2</sup>City University of Hong Kong · <sup>3</sup>Nanyang Technological University · <sup>4</sup>Technical University of Munich · <sup>5</sup>Zhejiang University City College · <sup>6</sup>Nanjing University · <sup>7</sup>Hangzhou Institute for Advanced Study, UCAS

<sup>\*</sup>Equal contribution · <sup>†</sup>Corresponding author

**Project page:** https://zjuscl.github.io/veritouch/ · **arXiv:** https://arxiv.org/abs/2611.30572 · **Code:** coming soon

## Overview

Scaling visuo-tactile policy learning is constrained by the high cost of real-world data collection and the difficulty of building realistic simulations. **VeriTouch** turns a visuo-tactile world model into a scalable, verified source of synthetic demonstrations:

1. **VeriGen** jointly generates high-fidelity dual-view videos and realistic 3-D tactile sequences over complete manipulation trajectories from initial camera images and a task instruction.
2. **VeriEval** checks visual physics via a fine-tuned 7-dimension VLM judge while verifying tactile reliability—contact timing alignment, tactile manifold realism, and contact-force plausibility—directly filtering out unreliable sequences.
3. **VeriIDM** combines global scene information from both camera views with fine-grained gripper details and temporal motion to recover accurate robot actions from verified videos.
4. Verified synthetic demonstrations join real demonstrations to train both vision-only and visuo-tactile policies.

## Results

On five real-robot contact-rich tasks (chip pick, egg pick, charger press, pull-back car, whiteboard erase):

- Adding verified synthetic data raises the mean success rate across four policies (ACT, $\pi_{0.5}$, $\mathcal{N}_0$-VTLA, FTP-1) from **19.4% to 33.8%** (unfiltered synthetic reaches only 22.9%).
- Scaling synthetic data to 4× the real demonstrations lifts $\mathcal{N}_0$-VTLA from **33.0% to 67.0%** without additional real-world data collection.
- Verification matters: unfiltered 33.3%, visual checks only 43.3%, visual + touch checks **51.7%** ($\mathcal{N}_0$-VTLA). Replacing generated touch with no-contact touch drops performance to 26.0%.
- Actions extracted by VeriIDM succeed **94.0%** of the time when replayed on the real robot (best baseline EVA: 84.0%).

## Citation

```bibtex
@misc{wang2026veritouchverifiedvisuotactileworld,
      title={VeriTouch: Verified Visuo-Tactile World Models that Improve Robot Policy Learning},
      author={Shuxun Wang and Xiaonan Jiang and Zhaoyu Wang and Ziyuan Chu and Xihang Yue and Pengfei Liu and Haodong Zhu and Shiqi Liu and Mingzhi Zheng and Liang Su and Linchao Zhu},
      year={2026},
      eprint={2611.30572},
      archivePrefix={arXiv},
      primaryClass={cs.RO},
      url={https://arxiv.org/abs/2611.30572},
}
```

---

## About this repository

This repository hosts the static VeriTouch project page (no build step required):

```bash
python3 -m http.server 8000        # then open http://localhost:8000
```

| File | What it holds |
|---|---|
| `index.html` | Page layout: hero & demo film, abstract, interactive pipeline, policy results & real-world rollouts, **VeriGen**, **VeriEval**, **VeriIDM**, and BibTeX |
| `hero.css`, `hero.js`, `hero-data.js` | Title block, film, and interactive 4-stage pipeline animation with floating tactile zoom loupe and 4-policy side-by-side switcher |
| `page.css`, `main.js` | Interactive charts (policy bars, scaling curve, 5-task & 3-axis radars, 2D bubble scatter / lollipop, 7-D VLM ring, semi-circle gauges, donut rings, VeriIDM columns & 5-task dumbbell plot), 4-view drag-to-compare player, and 9-model comparison grid |
| `style.css` | Base layout of the navbar, lightbox, and footer |
| `assets/` | Demo film, real-robot policy rollout comparisons, VeriGen vs. GT views, 9-model world-model comparison clips, VeriEval visual rejection example, and share-preview image (`fig/og.jpg`) |
| `_build/` | Media transcoding scripts |
