"""Generate abstract cover art locally with Stable Diffusion 3.5 Medium.

Usage:
    .venv-sd35/Scripts/python.exe scripts/gen_sd35.py --tsv site/public/sfx/covers/remaining.tsv --outdir site/public/sfx/covers
    .venv-sd35/Scripts/python.exe scripts/gen_sd35.py --prompt "..." --output out.png
"""

import argparse
import os
import sys
from pathlib import Path

# Load HUGGING_FACE_TOKEN from site/.env if not already in the environment.
if "HUGGING_FACE_TOKEN" not in os.environ:
    env_path = Path(__file__).resolve().parent.parent / "site" / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("HUGGING_FACE_TOKEN="):
                os.environ["HUGGING_FACE_TOKEN"] = line.split("=", 1)[1].strip()
                break

token = os.environ.get("HUGGING_FACE_TOKEN")
if not token:
    sys.exit("HUGGING_FACE_TOKEN not set and not found in site/.env")

import torch
from diffusers import StableDiffusion3Pipeline

MODEL_ID = "stabilityai/stable-diffusion-3.5-medium"

NEGATIVE = "text, letters, words, watermark, signature, logo, low quality, blurry"


def load_pipeline():
    print("Loading SD 3.5 Medium (weights already cached)...", file=sys.stderr)
    # Blackwell (sm_120) prefers bf16 over fp16, and the T5-XXL third text
    # encoder is the single biggest cost in the pipeline for barely any
    # quality gain on short abstract prompts like ours — drop it.
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    pipe = StableDiffusion3Pipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
        text_encoder_3=None,
        tokenizer_3=None,
        token=token,
    )
    pipe = pipe.to("cuda")
    return pipe


def generate_one(
    pipe,
    prompt: str,
    out_path: Path,
    steps: int = 28,
    seed: int | None = None,
    width: int = 1024,
    height: int = 1024,
):
    import time

    out_path.parent.mkdir(parents=True, exist_ok=True)
    generator = torch.Generator(device="cuda")
    if seed is not None:
        generator = generator.manual_seed(seed)

    started = time.time()

    def on_step(pipe, step, timestep, kwargs):
        print(f"  step {step + 1} @ {time.time() - started:.1f}s", file=sys.stderr, flush=True)
        return kwargs

    image = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE,
        num_inference_steps=steps,
        guidance_scale=4.5,
        height=height,
        width=width,
        generator=generator,
        callback_on_step_end=on_step,
    ).images[0]
    image.save(out_path)
    print(f"OK {out_path} ({out_path.stat().st_size} bytes) in {time.time() - started:.1f}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt")
    ap.add_argument("--output")
    ap.add_argument("--tsv", help="tab-separated file of <output-filename>\\t<prompt> per line")
    ap.add_argument("--outdir", default=".")
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=1024)
    args = ap.parse_args()

    pipe = load_pipeline()

    if args.tsv:
        outdir = Path(args.outdir)
        with open(args.tsv, encoding="utf-8") as f:
            for line in f:
                line = line.rstrip("\n")
                if not line.strip():
                    continue
                out_name, prompt = line.split("\t", 1)
                out_path = outdir / out_name
                if out_path.exists():
                    print(f"skip existing {out_name}")
                    continue
                print(f"[{out_name}] {prompt[:70]}...")
                generate_one(
                    pipe, prompt, out_path, steps=args.steps, width=args.width, height=args.height
                )
    elif args.prompt and args.output:
        generate_one(
            pipe,
            args.prompt,
            Path(args.output),
            steps=args.steps,
            width=args.width,
            height=args.height,
        )
    else:
        sys.exit("pass either --tsv/--outdir or --prompt/--output")


if __name__ == "__main__":
    main()
