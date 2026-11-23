"""Transcode every clip the website uses into ../assets/video/ (H.264, no audio unless noted, +faststart) with a poster JPG.

Sources are read from <workspace>\\wsx (read-only) and <workspace>\\lsq; nothing is written outside lsq\\website.
usage:  python -B -I build_videos.py [--force] [--only <substring>]
"""
import pathlib, subprocess, sys, shutil
from concurrent.futures import ThreadPoolExecutor

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent
ROOT = SITE.parents[1]                                     # workspace root
W, L = ROOT / "wsx", ROOT / "lsq"
FF = W / "tools" / "ffmpeg-master-latest-win64-gpl" / "bin" / "ffmpeg.exe"
OUT = SITE / "assets" / "video"
D = W / "materials" / "demo_assets" / "demo"
CASE = W / "method_cuts" / "v4" / "m" / "case"
WM = W / "wm_gt_best_20261120"
D34 = D / "06_主线案例" / "demo_0034" / "02_四路播放"
D66 = D / "03_VeriEval" / "Rejected_接触时序错位" / "demo_0066"
D49 = D / "03_VeriEval" / "视觉拒绝候选" / "demo_0049"
TASKS = ["chip_pick", "egg_pick", "charger_press", "pullback_car", "whiteboard_erase"]

FORCE = "--force" in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None


def enc(crf, extra_vf=None, fps=None, audio=False):
    vf = ",".join(x for x in [extra_vf, f"fps={fps}" if fps else None, "format=yuv420p"] if x)
    a = ["-c:a", "aac", "-b:a", "128k"] if audio else ["-an"]
    return ["-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", "high",
            "-g", "30", *a, "-movflags", "+faststart"]


JOBS = []   # (out_rel, input_args, encode_args)


def job(out, src, crf=25, width=640, ss=None, t=None, sseof=None, vf=None, fps=None, audio=False):
    ia = []
    if sseof is not None: ia += ["-sseof", str(sseof)]
    if ss is not None: ia += ["-ss", str(ss)]
    if t is not None: ia += ["-t", str(t)]
    ia += ["-i", str(src)]
    v = f"scale={width}:-2:flags=lanczos" + (f",{vf}" if vf else "")
    JOBS.append((out, ia, enc(crf, v, fps, audio)))


# ---------------- full demo film (with audio) ----------------
FILM = ("film/veritouch_film.mp4", L / "VeriTouch_full.mp4")       # copied as-is (already H.264/AAC 1080p)

# ---------------- policy evaluation: case study pairs (third-person) ----------------
for k in ["pullback_car", "whiteboard_erase"]:          # tasks without a two-view pair
    job(f"policy/case_{k}_base.mp4", CASE / f"{k}_base.mp4", crf=25)
    job(f"policy/case_{k}_vt.mp4", CASE / f"{k}_vt.mp4", crf=25)

# paired rollouts with both views: (id, baseline dir, ours dir, baseline trim, ours trim)
PP = W / "policy_pairs_checked_20261120"
PAIRS = [
    ("chip_n0",      PP / "chip_pick" / "baseline", PP / "chip_pick" / "ours", None, None),
    ("press_n0",     PP / "charger_press" / "baseline", PP / "charger_press" / "ours", None, None),
    ("egg_n0_l8",    W / "egg_n0_layout8_checked_20261120" / "baseline", W / "egg_n0_layout8_checked_20261120" / "ours", None, None),
]
for pid, b, o, tb, to in PAIRS:
    for side, d, t in (("base", b, tb), ("vt", o, to)):
        job(f"policy/pair_{pid}_{side}_main.mp4", d / "view_1.mp4", crf=26, t=t)
        job(f"policy/pair_{pid}_{side}_wrist.mp4", d / "view_2.mp4", crf=26, t=t)

# ---------------- world model: GT vs VeriGen, five held-out episodes ----------------
for k in TASKS:
    for s in ("gt", "pred"):
        job(f"wm/{k}_{s}_main.mp4", WM / f"{k}_cleaned" / f"{s}_main.mp4", crf=24)
        job(f"wm/{k}_{s}_wrist.mp4", WM / f"{k}_cleaned" / f"{s}_wrist.mp4", crf=24)
        # fingertip displacement, one clip per sensor (the stacked source repeats the main camera above both sensors)
        job(f"wm/{k}_{s}_touchl.mp4", WM / f"{k}_cleaned" / f"{s}_main_tactile.mp4", crf=22, width=640, vf="crop=320:284:160:246,scale=480:-2,crop=246:426:0:0")
        job(f"wm/{k}_{s}_touchr.mp4", WM / f"{k}_cleaned" / f"{s}_main_tactile.mp4", crf=22, width=640, vf="crop=320:284:160:246,scale=480:-2,crop=234:426:246:0")

# generated rollouts shown in the hero batch (main, wrist, left tactile render)
for tag, d in (("d34", D34), ("d66", D66), ("d49", D49)):
    pre = {"d34": "demo_0034", "d66": "demo_0066", "d49": "demo_0049"}[tag]
    job(f"wm/{tag}_main.mp4", d / f"{pre}_main.mp4", crf=24)
    job(f"wm/{tag}_wrist.mp4", d / f"{pre}_wrist.mp4", crf=24)
    job(f"wm/{tag}_left.mp4", d / f"{pre}_left.mp4", crf=26, width=240, fps=30)

COPIES = [FILM]


def run(j):
    out, ia, ea = j
    o = OUT / out
    if o.exists() and not FORCE:
        return f"skip {out}"
    o.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run([str(FF), "-v", "error", "-y", *ia, *ea, str(o)], capture_output=True, text=True)
    if r.returncode:
        return f"FAIL {out}: {r.stderr.strip()[:400]}"
    poster(o)
    return f"ok   {out}  {o.stat().st_size/1e6:.2f} MB"


def poster(o):
    subprocess.run([str(FF), "-v", "error", "-y", "-ss", "0.6", "-i", str(o), "-frames:v", "1", "-q:v", "4",
                    str(o.with_suffix(".jpg"))], capture_output=True)


if __name__ == "__main__":
    jobs = [j for j in JOBS if not ONLY or ONLY in j[0]]
    with ThreadPoolExecutor(6) as ex:
        for msg in ex.map(run, jobs):
            print(msg, flush=True)
    for out, src in COPIES:
        if ONLY and ONLY not in out: continue
        o = OUT / out; o.parent.mkdir(parents=True, exist_ok=True)
        if FORCE or not o.exists():
            shutil.copyfile(src, o); poster(o)
        print("copy", out)
    total = sum(p.stat().st_size for p in OUT.rglob("*.mp4"))
    print(f"{len(list(OUT.rglob('*.mp4')))} videos, {total/1e6:.1f} MB")
