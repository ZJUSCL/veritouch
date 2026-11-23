"""Third-person | wrist side-by-side strips for the real-world rollout pairs, built from the pair_* clips in ../assets/video/policy:
  - policy/strip_<pair>_<side>.mp4 (+ .jpg poster)
usage: python -B -I build_v2_media.py"""
import pathlib, subprocess

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent
V = SITE / "assets" / "video"
FF = SITE.parents[1] / "wsx" / "tools" / "ffmpeg-master-latest-win64-gpl" / "bin" / "ffmpeg.exe"

TASK = {"chip_pick": "Chip", "egg_pick": "Egg", "charger_press": "Press", "pullback_car": "Car", "whiteboard_erase": "Erase"}


def build_strips():
    for p in ["chip_n0", "press_n0", "egg_n0_l8"]:
        for side in ["base", "vt"]:
            a, b = V / "policy" / f"pair_{p}_{side}_main.mp4", V / "policy" / f"pair_{p}_{side}_wrist.mp4"
            out = V / "policy" / f"strip_{p}_{side}.mp4"
            fc = "[0:v]scale=480:360,setsar=1[a];[1:v]scale=480:360,setsar=1[b];[a][b]hstack=inputs=2,format=yuv420p[o]"
            subprocess.run([str(FF), "-v", "error", "-y", "-i", str(a), "-i", str(b), "-filter_complex", fc, "-map", "[o]", "-shortest",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-g", "30", "-an", "-movflags", "+faststart", str(out)], check=True)
            subprocess.run([str(FF), "-v", "error", "-y", "-ss", "1", "-i", str(out), "-frames:v", "1", "-q:v", "4", str(out.with_suffix(".jpg"))], check=True)
            print("strip", out.name, round(out.stat().st_size / 1e6, 2), "MB")


if __name__ == "__main__":
    build_strips()
