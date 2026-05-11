"""Diabetica-7B API — CPU Basic Space (free)

Uses the Q4_K_M GGUF quantised version of WaltonFuture/Diabetica-7B via
llama-cpp-python. Runs on the 16 GB / 2 vCPU CPU Basic hardware tier.

Model card: https://huggingface.co/mradermacher/Diabetica-7B-GGUF
Original : https://huggingface.co/WaltonFuture/Diabetica-7B
"""

import json
import os
from pathlib import Path

import gradio as gr
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

# ---------------------------------------------------------------------------
# Model download (cached on Space persistent storage between restarts)
# ---------------------------------------------------------------------------
MODEL_REPO = "mradermacher/Diabetica-7B-GGUF"
MODEL_FILE = "Diabetica-7B.Q8_0.gguf"  # 8.1 GB — near-full quality (99%), fits in 16 GB RAM
CACHE_DIR = Path("/tmp/models")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

print(f"Downloading {MODEL_FILE} from {MODEL_REPO} (first run: ~5 min) ...")
model_path = hf_hub_download(
    repo_id=MODEL_REPO,
    filename=MODEL_FILE,
    cache_dir=str(CACHE_DIR),
)
print(f"Model cached at: {model_path}")

# ---------------------------------------------------------------------------
# Load model into llama-cpp (stays in RAM for the lifetime of the Space)
# n_ctx = context window (tokens)
# n_threads = vCPUs available on CPU Basic
# ---------------------------------------------------------------------------
print("Loading model into llama-cpp (this takes ~60 s on first load)...")
llm = Llama(
    model_path=model_path,
    n_ctx=4096,
    n_threads=2,    # CPU Basic gives 2 vCPUs
    n_batch=512,    # process 512 tokens at once for better throughput
    n_gpu_layers=0, # CPU only
    verbose=False,
)
print("Diabetica-7B ready.")


# ---------------------------------------------------------------------------
# Inference function — exposed as the Gradio API endpoint /api/predict
# ---------------------------------------------------------------------------
def generate(system_prompt: str, user_message: str, max_tokens: int = 1024, temperature: float = 0.3) -> str:
    """Generate a Diabetica-7B response.

    Args:
        system_prompt : System/context message
        user_message  : User's assessment prompt
        max_tokens    : Max tokens to generate
        temperature   : Sampling temperature (0.3 = deterministic medical output)

    Returns:
        Model response string
    """
    # Qwen2 chat template (Diabetica-7B is a Qwen2 fine-tune)
    prompt = (
        f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
        f"<|im_start|>user\n{user_message}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )

    output = llm(
        prompt,
        max_tokens=int(max_tokens),
        temperature=float(temperature),
        top_p=0.9,
        stop=["<|im_end|>", "<|im_start|>"],
        echo=False,
    )

    return output["choices"][0]["text"].strip()


def health_check() -> str:
    return json.dumps({"status": "ok", "model": MODEL_FILE})


# ---------------------------------------------------------------------------
# Gradio UI (also auto-generates REST API at /api/predict)
# ---------------------------------------------------------------------------
with gr.Blocks(title="Diabetica 7B API") as demo:
    gr.Markdown(
        "## Diabetica-7B Medical LLM API\n"
        "CPU Basic Space (Q8_0 — near-full quality) — called by the Diavise backend. "
        "Responses take ~120-180 s on CPU."
    )

    with gr.Row():
        with gr.Column():
            sys_in = gr.Textbox(label="System Prompt", lines=3,
                                value="You are Diabetica, an expert AI medical assistant specialising in diabetes.")
            usr_in = gr.Textbox(label="User Message", lines=6,
                                placeholder="Paste the assessment prompt here...")
            max_tok = gr.Slider(256, 2048, value=1024, step=64, label="Max Tokens")
            temp = gr.Slider(0.0, 1.0, value=0.3, step=0.05, label="Temperature")
            btn = gr.Button("Generate", variant="primary")
        with gr.Column():
            out = gr.Textbox(label="Model Response", lines=20)

    # api_name="predict" exposes this as POST /api/predict (Gradio 3)
    # and POST /call/predict (Gradio 4+) — required for gr.Blocks
    btn.click(fn=generate, inputs=[sys_in, usr_in, max_tok, temp], outputs=out, api_name="predict")

    with gr.Tab("Health"):
        gr.Button("Check").click(fn=health_check, inputs=[], outputs=gr.Textbox(label="Status"), api_name="health")

demo.queue()
demo.launch(server_name="0.0.0.0", server_port=7860)
