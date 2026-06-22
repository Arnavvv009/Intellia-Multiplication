"""
Audio Generation Script — Multiplication Facts 4, 5 & 10
=========================================================
Generates MP3 files using ElevenLabs Voice ID: Xb7hH8MSUJpSbSDYk0k2 (Alice)

Priority:  ElevenLabs (real Alice voice)  →  edge-tts fallback  →  skip

Usage:
    python scripts/generate_audio_local.py

Setup:
    1. Create a .env file in the project root:
           VITE_ELEVENLABS_API_KEY=your_key_here
    2. Run this script — it generates all MP3s and writes src/utils/audioMap.js
    3. Skips files that already exist on disk (safe to re-run)

Output:
    public/assets/audio/*.mp3
    src/utils/audioMap.js  (text → /assets/audio/filename mapping)
"""

import asyncio
import os
import re
import json
import urllib.request
import urllib.error
import time

# ── Try to load edge-tts as fallback ─────────────────────────────────────────
try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

# ── Config ────────────────────────────────────────────────────────────────────
ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT, "public", "assets", "audio")
MAP_PATH   = os.path.join(ROOT, "src", "utils", "audioMap.js")
ENV_PATH   = os.path.join(ROOT, ".env")

VOICE_ID   = "Xb7hH8MSUJpSbSDYk0k2"   # Alice — ElevenLabs
MODEL      = "eleven_multilingual_v2"
RATE_LIMIT = 0.5                         # seconds between ElevenLabs requests

EDGE_VOICE = "en-GB-SoniaNeural"        # fallback voice for edge-tts
EDGE_STYLE = {"rate": "+2%", "pitch": "+0Hz"}

VOICE_SETTINGS = {
    "celebration":  {"stability": 0.12, "similarity_boost": 0.45, "style": 0.75, "use_speaker_boost": True},
    "encouragement":{"stability": 0.16, "similarity_boost": 0.50, "style": 0.65, "use_speaker_boost": True},
    "question":     {"stability": 0.20, "similarity_boost": 0.55, "style": 0.55, "use_speaker_boost": True},
    "emphasis":     {"stability": 0.16, "similarity_boost": 0.50, "style": 0.60, "use_speaker_boost": True},
    "thinking":     {"stability": 0.24, "similarity_boost": 0.60, "style": 0.35, "use_speaker_boost": True},
    "statement":    {"stability": 0.20, "similarity_boost": 0.55, "style": 0.50, "use_speaker_boost": True},
    "instruction":  {"stability": 0.20, "similarity_boost": 0.55, "style": 0.50, "use_speaker_boost": True},
}

# ── Load API key from .env ────────────────────────────────────────────────────
def load_env():
    api_key = os.environ.get("VITE_ELEVENLABS_API_KEY", "")
    if not api_key and os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("VITE_ELEVENLABS_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    return api_key


# ── Helpers ───────────────────────────────────────────────────────────────────
def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", text.lower())
    return "audio_" + slug[:60].strip("_")


def generate_elevenlabs(text: str, style: str, output_path: str, api_key: str) -> bool:
    """Call ElevenLabs REST API synchronously using urllib (no extra deps)."""
    settings = VOICE_SETTINGS.get(style, VOICE_SETTINGS["statement"])
    payload  = json.dumps({
        "text": text,
        "model_id": MODEL,
        "voice_settings": settings,
    }).encode("utf-8")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "xi-api-key":   api_key,
            "Content-Type": "application/json",
            "Accept":       "audio/mpeg",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
            if len(data) > 500:
                with open(output_path, "wb") as f:
                    f.write(data)
                return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        print(f"    ElevenLabs HTTP {e.code}: {body[:120]}")
    except Exception as e:
        print(f"    ElevenLabs error: {e}")
    return False


async def generate_edge_tts(text: str, output_path: str) -> bool:
    """Fallback: edge-tts (Microsoft neural TTS, free)."""
    if not HAS_EDGE_TTS:
        return False
    try:
        comm = edge_tts.Communicate(text, EDGE_VOICE,
                                    rate=EDGE_STYLE["rate"],
                                    pitch=EDGE_STYLE["pitch"])
        await comm.save(output_path)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 500
    except Exception as e:
        print(f"    edge-tts error: {e}")
        return False

# ── Full phrase list ───────────────────────────────────────────────────────────
# POLICY: paragraph/question text ONLY — never titles or headings
ALL_PHRASES = [
    # Wonder
    {"text": "A baker puts 5 buns in every box. She packs 4 boxes. How many buns did she pack — without counting one by one?", "style": "question"},
    {"text": "What if there's a faster way than counting one bun at a time?", "style": "question"},
    # Story slides (body text only)
    {"text": "Aisha is setting up 5 tables for her birthday party. Each table seats 4 friends. She wants to know how many friends she can invite without counting one by one.", "style": "statement"},
    {"text": "We can see 5 separate tables. Each one has exactly 4 chairs — that's 5 equal groups of 4.", "style": "statement"},
    {"text": "If we count in jumps of 4 — once for every table — we go 4, 8, 12, 16, 20. That's much faster than counting every chair!", "style": "emphasis"},
    {"text": "5 tables, 4 chairs each, makes 20 chairs altogether. Aisha can invite 20 friends to her party!", "style": "celebration"},
    # Simulate station instructions
    {"text": "Use the sliders to set the number of groups and items. Watch the total update live!", "style": "instruction"},
    {"text": "Drag the sliders to change the rows and columns of the dot array.", "style": "instruction"},
    {"text": "Choose a step size and tap Jump to skip-count along the number line.", "style": "instruction"},
    {"text": "Tap the cells in the table to reveal the multiplication facts and spot the patterns!", "style": "instruction"},
    # Reflect
    {"text": "Tell me one multiplication trick you learned today!", "style": "question"},
    # Praise pool
    {"text": "Amazing! That's the magic of multiplying!", "style": "celebration"},
    {"text": "Well done! You've got this!", "style": "celebration"},
    {"text": "Brilliant! Skip-counting works every time!", "style": "celebration"},
    {"text": "You got it! Keep going!", "style": "celebration"},
    {"text": "Fantastic! That's one more fact in your brain!", "style": "celebration"},
    # Encouragement pool
    {"text": "Let's try again — think about the equal groups!", "style": "thinking"},
    {"text": "Not quite — use skip-counting to check!", "style": "thinking"},
    {"text": "So close! Try counting in jumps.", "style": "thinking"},
    {"text": "Almost there — you can do it!", "style": "encouragement"},
    # Equal groups questions + hints + explanations
    {"text": "4 baskets, each with 3 buns. How many buns in total?", "style": "question"},
    {"text": "Look at 4 baskets — each has 3 buns.", "style": "thinking"},
    {"text": "Count in 3s: 3, 6, 9, 12.", "style": "thinking"},
    {"text": "4 groups of 3 = 12. So 4 times 3 = 12.", "style": "statement"},
    {"text": "5 packs, each with 2 pencils. How many pencils altogether?", "style": "question"},
    {"text": "There are 5 packs, each holding 2 pencils.", "style": "thinking"},
    {"text": "Count in 2s: 2, 4, 6, 8, 10.", "style": "thinking"},
    {"text": "5 groups of 2 = 10. So 5 times 2 = 10.", "style": "statement"},
    {"text": "5 boxes, each holding 4 stickers. How many stickers in total?", "style": "question"},
    {"text": "There are 5 boxes with 4 stickers each.", "style": "thinking"},
    {"text": "Count in 4s: 4, 8, 12, 16, 20.", "style": "thinking"},
    {"text": "5 groups of 4 = 20. So 5 times 4 = 20.", "style": "statement"},
    {"text": "4 vases, each with 5 flowers. How many flowers are there?", "style": "question"},
    {"text": "Count the vases — there are 4, each with 5 flowers.", "style": "thinking"},
    {"text": "Count in 5s: 5, 10, 15, 20.", "style": "thinking"},
    {"text": "4 groups of 5 = 20. So 4 times 5 = 20.", "style": "statement"},
    {"text": "4 rows of chairs, 7 chairs in each row. How many chairs?", "style": "question"},
    {"text": "Think: 4 equal groups, 7 in each.", "style": "thinking"},
    {"text": "Count in 7s four times: 7, 14, 21, 28.", "style": "thinking"},
    {"text": "4 groups of 7 = 28. So 4 times 7 = 28.", "style": "statement"},
    {"text": "5 fish tanks, each with 6 fish. How many fish in total?", "style": "question"},
    {"text": "There are 5 tanks, each with 6 fish.", "style": "thinking"},
    {"text": "Skip-count by 6 five times: 6, 12, 18, 24, 30.", "style": "thinking"},
    {"text": "5 groups of 6 = 30. So 5 times 6 = 30.", "style": "statement"},
    {"text": "10 bags, each with 4 coins. How many coins altogether?", "style": "question"},
    {"text": "There are 10 groups of 4 coins.", "style": "thinking"},
    {"text": "Multiply: 10 times 4 = 40.", "style": "thinking"},
    {"text": "10 groups of 4 = 40. So 10 times 4 = 40.", "style": "statement"},
    {"text": "4 shelves, each holding 8 books. How many books are there?", "style": "question"},
    {"text": "You have 4 shelves — each holds 8 books.", "style": "thinking"},
    {"text": "Count in 8s four times: 8, 16, 24, 32.", "style": "thinking"},
    {"text": "4 groups of 8 = 32. So 4 times 8 = 32.", "style": "statement"},
    {"text": "5 jars, each with 9 marbles. How many marbles in total?", "style": "question"},
    {"text": "There are 5 jars, each containing 9 marbles.", "style": "thinking"},
    {"text": "Skip-count by 9 five times: 9, 18, 27, 36, 45.", "style": "thinking"},
    {"text": "5 groups of 9 = 45. So 5 times 9 = 45.", "style": "statement"},
    {"text": "4 crates, each with 9 oranges. How many oranges are there?", "style": "question"},
    {"text": "You have 4 crates, each holding 9 oranges.", "style": "thinking"},
    {"text": "Count in 9s four times: 9, 18, 27, 36.", "style": "thinking"},
    {"text": "4 groups of 9 = 36. So 4 times 9 = 36.", "style": "statement"},
]

ALL_PHRASES += [
    # Array count
    {"text": "A grid shows 2 rows of 4 dots. What is 2 times 4?", "style": "question"},
    {"text": "2 times 4 = 8. There are 8 dots in total.", "style": "statement"},
    {"text": "An array shows 3 rows and 5 columns. What is 3 times 5?", "style": "question"},
    {"text": "3 times 5 = 15. There are 15 dots.", "style": "statement"},
    {"text": "A square array has 4 rows and 4 columns. How many dots?", "style": "question"},
    {"text": "4 times 4 = 16.", "style": "statement"},
    {"text": "A grid shows 5 rows of 5 stars each. What is 5 times 5?", "style": "question"},
    {"text": "5 times 5 = 25.", "style": "statement"},
    {"text": "An array shows 4 rows and 6 columns of circles. What is 4 times 6?", "style": "question"},
    {"text": "4 times 6 = 24.", "style": "statement"},
    {"text": "A grid has 10 rows and 3 columns. What is 10 times 3?", "style": "question"},
    {"text": "10 times 3 = 30.", "style": "statement"},
    {"text": "An array shows 5 rows and 7 columns. What is 5 times 7?", "style": "question"},
    {"text": "5 times 7 = 35.", "style": "statement"},
    {"text": "A grid has 4 rows and 10 columns of dots. What is 4 times 10?", "style": "question"},
    {"text": "4 times 10 = 40.", "style": "statement"},
    {"text": "An array shows 4 rows and 9 columns. What is 4 times 9?", "style": "question"},
    {"text": "4 times 9 = 36.", "style": "statement"},
    {"text": "An array has 5 rows and 10 columns. What is 5 times 10?", "style": "question"},
    {"text": "5 times 10 = 50.", "style": "statement"},
    # Fill blank
    {"text": "4 times 2 equals what?", "style": "question"},
    {"text": "4 times 2 = 8.", "style": "statement"},
    {"text": "5 times 3 equals what?", "style": "question"},
    {"text": "5 times 3 = 15.", "style": "statement"},
    {"text": "4 times blank equals 24. What is the missing number?", "style": "question"},
    {"text": "4 times 6 = 24. The missing number is 6.", "style": "statement"},
    {"text": "5 times blank equals 40. What is the missing number?", "style": "question"},
    {"text": "5 times 8 = 40. The missing number is 8.", "style": "statement"},
    {"text": "10 times 6 equals what?", "style": "question"},
    {"text": "10 times 6 = 60.", "style": "statement"},
    {"text": "10 times blank equals 70. What is the missing number?", "style": "question"},
    {"text": "10 times 7 = 70. The missing number is 7.", "style": "statement"},
    {"text": "Blank times 8 equals 32. What is the missing number?", "style": "question"},
    {"text": "4 times 8 = 32. The missing number is 4.", "style": "statement"},
    {"text": "5 times blank equals 45. What is the missing number?", "style": "question"},
    {"text": "5 times 9 = 45. The missing number is 9.", "style": "statement"},
    {"text": "4 times 10 equals what?", "style": "question"},
    {"text": "Blank times 10 equals 50. What is the missing number?", "style": "question"},
    {"text": "5 times 10 = 50. The missing number is 5.", "style": "statement"},
    # Word problems
    {"text": "Aisha sets up 5 tables. Each table has 4 chairs. How many chairs in total?", "style": "question"},
    {"text": "5 times 4 = 20. Aisha needs 20 chairs.", "style": "statement"},
    {"text": "Mei buys 4 packs of stickers. Each pack has 5 stickers. How many stickers does Mei have?", "style": "question"},
    {"text": "4 times 5 = 20. Mei has 20 stickers.", "style": "statement"},
    {"text": "Wei Ming packs 5 boxes of buns. Each box holds 6 buns. How many buns are packed?", "style": "question"},
    {"text": "5 times 6 = 30. Wei Ming packed 30 buns.", "style": "statement"},
    {"text": "Priya counts 10 flowers in each vase. She has 5 vases. How many flowers in total?", "style": "question"},
    {"text": "10 times 5 = 50. There are 50 flowers.", "style": "statement"},
    {"text": "Ahmad buys 4 bags of marbles. Each bag holds 7 marbles. How many marbles does Ahmad have?", "style": "question"},
    {"text": "4 times 7 = 28. Ahmad has 28 marbles.", "style": "statement"},
    {"text": "Ryan saves 10 cents every day for 8 days. How many cents does he save in total?", "style": "question"},
    {"text": "10 times 8 = 80. Ryan saves 80 cents.", "style": "statement"},
    {"text": "Siti places 4 rows of coins on a table. Each row has 8 coins. How many coins are there?", "style": "question"},
    {"text": "4 times 8 = 32. There are 32 coins.", "style": "statement"},
    {"text": "Jun has 5 fish tanks. Each tank holds 9 fish. How many fish does Jun have?", "style": "question"},
    {"text": "5 times 9 = 45. Jun has 45 fish.", "style": "statement"},
    {"text": "Kavya arranges 4 trays. Each tray has 10 cupcakes. How many cupcakes are there?", "style": "question"},
    {"text": "4 times 10 = 40. There are 40 cupcakes.", "style": "statement"},
    {"text": "Xiao Ling counts 5 minutes for each problem. There are 10 problems. How many minutes in total?", "style": "question"},
    {"text": "5 times 10 = 50. It takes 50 minutes.", "style": "statement"},
]

ALL_PHRASES += [
    # Skip count
    {"text": "4, 8, blank, 16, 20. What is the missing number?", "style": "question"},
    {"text": "Counting in 4s: 4, 8, 12, 16, 20. The missing number is 12.", "style": "statement"},
    {"text": "5, 10, 15, blank, 25. What is the missing number?", "style": "question"},
    {"text": "Counting in 5s: 5, 10, 15, 20, 25. The missing number is 20.", "style": "statement"},
    {"text": "10, 20, blank, 40, 50. What is the missing number?", "style": "question"},
    {"text": "Counting in 10s: 10, 20, 30, 40, 50. The missing number is 30.", "style": "statement"},
    {"text": "4, blank, 12, 16, 20. What is the missing number?", "style": "question"},
    {"text": "Counting in 4s: 4, 8, 12, 16, 20. The missing number is 8.", "style": "statement"},
    {"text": "20, 25, 30, 35, blank. What is the missing number?", "style": "question"},
    {"text": "Counting in 5s: the missing number is 40.", "style": "statement"},
    {"text": "40, blank, 60, 70, 80. What is the missing number?", "style": "question"},
    {"text": "Counting in 10s: 40, 50, 60. The missing number is 50.", "style": "statement"},
    {"text": "28, 32, blank, 40, 44. What is the missing number?", "style": "question"},
    {"text": "Counting in 4s: 28, 32, 36, 40, 44. The missing number is 36.", "style": "statement"},
    {"text": "45, blank, 55, 60, 65. What is the missing number?", "style": "question"},
    {"text": "Counting in 5s: the missing number is 50.", "style": "statement"},
    {"text": "32, 36, blank, 44, 48. What is the missing number?", "style": "question"},
    {"text": "Counting in 4s: the missing number is 40.", "style": "statement"},
    {"text": "60, 70, 80, blank, 100. What is the missing number?", "style": "question"},
    {"text": "Counting in 10s: 60, 70, 80, 90, 100. The missing number is 90.", "style": "statement"},
    # True/False
    {"text": "Is 4 times 3 equal to 12? True or False?", "style": "question"},
    {"text": "4 times 3 = 12. This is TRUE.", "style": "statement"},
    {"text": "Is 5 times 6 equal to 35? True or False?", "style": "question"},
    {"text": "5 times 6 = 30, not 35. This is FALSE.", "style": "statement"},
    {"text": "Is 10 times 4 equal to 40? True or False?", "style": "question"},
    {"text": "10 times 4 = 40. This is TRUE.", "style": "statement"},
    {"text": "Is 4 times 5 equal to 25? True or False?", "style": "question"},
    {"text": "4 times 5 = 20, not 25. This is FALSE.", "style": "statement"},
    {"text": "Is 5 times 8 equal to 40? True or False?", "style": "question"},
    {"text": "5 times 8 = 40. This is TRUE.", "style": "statement"},
    {"text": "Is 4 times 7 equal to 26? True or False?", "style": "question"},
    {"text": "4 times 7 = 28, not 26. This is FALSE.", "style": "statement"},
    {"text": "Is 10 times 9 equal to 90? True or False?", "style": "question"},
    {"text": "10 times 9 = 90. This is TRUE.", "style": "statement"},
    {"text": "Is 4 times 9 equal to 38? True or False?", "style": "question"},
    {"text": "4 times 9 = 36, not 38. This is FALSE.", "style": "statement"},
    {"text": "Is 5 times 10 equal to 50? True or False?", "style": "question"},
    {"text": "5 times 10 = 50. This is TRUE.", "style": "statement"},
    {"text": "Is 4 times 10 equal to 14? True or False?", "style": "question"},
    {"text": "4 times 10 = 40, not 14. This is FALSE.", "style": "statement"},
    # Missing factor
    {"text": "Blank times 5 equals 20. What is the missing number?", "style": "question"},
    {"text": "4 times 5 = 20. The missing number is 4.", "style": "statement"},
    {"text": "4 times blank equals 16. What is the missing number?", "style": "question"},
    {"text": "4 times 4 = 16. The missing number is 4.", "style": "statement"},
    {"text": "Blank times 10 equals 30. What is the missing number?", "style": "question"},
    {"text": "3 times 10 = 30. The missing number is 3.", "style": "statement"},
    {"text": "5 times blank equals 35. What is the missing number?", "style": "question"},
    {"text": "5 times 7 = 35. The missing number is 7.", "style": "statement"},
    {"text": "Blank times 4 equals 24. What is the missing number?", "style": "question"},
    {"text": "6 times 4 = 24. The missing number is 6.", "style": "statement"},
    {"text": "Blank times 5 equals 45. What is the missing number?", "style": "question"},
    {"text": "9 times 5 = 45. The missing number is 9.", "style": "statement"},
    {"text": "4 times blank equals 36. What is the missing number?", "style": "question"},
    {"text": "4 times 9 = 36. The missing number is 9.", "style": "statement"},
    {"text": "Blank times 10 equals 70. What is the missing number?", "style": "question"},
    {"text": "7 times 10 = 70. The missing number is 7.", "style": "statement"},
    {"text": "5 times blank equals 50. What is the missing number?", "style": "question"},
    {"text": "5 times 10 = 50. The missing number is 10.", "style": "statement"},
    {"text": "Blank times 4 equals 40. What is the missing number?", "style": "question"},
    {"text": "10 times 4 = 40. The missing number is 10.", "style": "statement"},
    # Fact recall
    {"text": "What is 4 times 1?", "style": "question"},
    {"text": "4 times 1 = 4.", "style": "statement"},
    {"text": "What is 5 times 1?", "style": "question"},
    {"text": "5 times 1 = 5.", "style": "statement"},
    {"text": "What is 4 times 4?", "style": "question"},
    {"text": "4 times 4 = 16.", "style": "statement"},
    {"text": "What is 5 times 5?", "style": "question"},
    {"text": "5 times 5 = 25.", "style": "statement"},
    {"text": "What is 10 times 5?", "style": "question"},
    {"text": "10 times 5 = 50.", "style": "statement"},
    {"text": "What is 4 times 6?", "style": "question"},
    {"text": "4 times 6 = 24.", "style": "statement"},
    {"text": "What is 5 times 7?", "style": "question"},
    {"text": "5 times 7 = 35.", "style": "statement"},
    {"text": "What is 4 times 8?", "style": "question"},
    {"text": "4 times 8 = 32.", "style": "statement"},
    {"text": "What is 10 times 9?", "style": "question"},
    {"text": "10 times 9 = 90.", "style": "statement"},
    {"text": "What is 4 times 10?", "style": "question"},
    # Pattern reasoning
    {"text": "Which of these is a multiple of 5?", "style": "question"},
    {"text": "25 is a multiple of 5. Multiples of 5 end in 0 or 5.", "style": "statement"},
    {"text": "Which of these is a multiple of 10?", "style": "question"},
    {"text": "30 is a multiple of 10. Multiples of 10 always end in 0.", "style": "statement"},
    {"text": "Which of these is NOT a multiple of 5?", "style": "question"},
    {"text": "18 does not end in 0 or 5, so it is not a multiple of 5.", "style": "statement"},
    {"text": "Which of these is a multiple of 4?", "style": "question"},
    {"text": "28 is a multiple of 4. 4 times 7 = 28.", "style": "statement"},
    {"text": "Which of these is NOT a multiple of 10?", "style": "question"},
    {"text": "45 ends in 5, so it is not a multiple of 10.", "style": "statement"},
    {"text": "Which is the largest multiple of 4 that is less than 30?", "style": "question"},
    {"text": "28 is 4 times 7 = 28, the largest multiple of 4 below 30.", "style": "statement"},
    {"text": "Which of these is a multiple of both 4 and 5?", "style": "question"},
    {"text": "20 equals 4 times 5 and 5 times 4. It appears in both tables.", "style": "statement"},
    {"text": "How many times do products in the times 4 table go up by?", "style": "question"},
    {"text": "Each product in the times 4 table is 4 more than the previous.", "style": "statement"},
    {"text": "What is the last digit of every multiple of 10?", "style": "question"},
    {"text": "Every multiple of 10 ends in 0.", "style": "statement"},
    {"text": "How many multiples of 4 are there from 1 to 40?", "style": "question"},
    {"text": "There are 10 multiples of 4 from 1 to 40.", "style": "statement"},
]

# Deduplicate by text
_seen = set()
_deduped = []
for p in ALL_PHRASES:
    if p["text"] not in _seen:
        _seen.add(p["text"])
        _deduped.append(p)
ALL_PHRASES = _deduped


# ── Main runner ───────────────────────────────────────────────────────────────
async def run():
    api_key = load_env()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    audio_map  = {}
    generated  = 0
    skipped    = 0
    failed     = 0
    used_el    = 0
    used_edge  = 0

    mode = "ElevenLabs" if api_key else ("edge-tts" if HAS_EDGE_TTS else "NONE")
    print(f"\n{'='*64}")
    print(f"  🎙  Generating {len(ALL_PHRASES)} audio files")
    print(f"  Voice: Alice ({VOICE_ID})")
    print(f"  Mode : {mode}")
    if not api_key:
        print(f"\n  ⚠  No VITE_ELEVENLABS_API_KEY found in .env")
        print(f"     Using edge-tts fallback (free, different voice)")
        print(f"     To get ElevenLabs Alice voice, add your key to .env")
    print(f"{'='*64}\n")

    for i, phrase in enumerate(ALL_PHRASES):
        text  = phrase["text"]
        style = phrase["style"]
        slug  = slugify(text)
        fname = f"{slug}.mp3"
        fpath = os.path.join(OUTPUT_DIR, fname)
        url   = f"/assets/audio/{fname}"

        # Skip if already exists and non-empty
        if os.path.exists(fpath) and os.path.getsize(fpath) > 1000:
            audio_map[text] = url
            skipped += 1
            continue

        ok = False

        # PRIORITY 1: ElevenLabs (Alice voice)
        if api_key:
            ok = generate_elevenlabs(text, style, fpath, api_key)
            if ok:
                used_el += 1
                time.sleep(RATE_LIMIT)   # rate-limit ElevenLabs

        # PRIORITY 2: edge-tts fallback
        if not ok and HAS_EDGE_TTS:
            ok = await generate_edge_tts(text, fpath)
            if ok:
                used_edge += 1
            else:
                await asyncio.sleep(0.1)

        if ok and os.path.getsize(fpath) > 500:
            audio_map[text] = url
            generated += 1
            src = "EL" if (api_key and used_el > used_edge) else "edge"
            print(f"  ✓ [{generated:03d}/{len(ALL_PHRASES)}] [{src}] {text[:68]}")
        else:
            failed += 1
            print(f"  ✗  FAILED [{i+1}]: {text[:60]}")

    # Write audioMap.js
    header = (
        "// AUTO-GENERATED — do not edit manually\n"
        "// Priority 1: local .mp3  |  Priority 2: ElevenLabs API  |  Priority 3: Web Speech\n"
        f"// Generated with Voice ID: {VOICE_ID} (Alice, ElevenLabs)\n"
    )
    map_js = header + f"export const audioMap = {json.dumps(audio_map, indent=2, ensure_ascii=False)};\n"
    with open(MAP_PATH, "w", encoding="utf-8") as f:
        f.write(map_js)

    print(f"\n{'='*64}")
    print(f"  ✅  Done!")
    print(f"     Generated : {generated}  (ElevenLabs: {used_el}, edge-tts: {used_edge})")
    print(f"     Skipped   : {skipped}  (already existed)")
    print(f"     Failed    : {failed}")
    print(f"     Audio dir : {OUTPUT_DIR}")
    print(f"     Map file  : {MAP_PATH}")
    print(f"{'='*64}\n")


if __name__ == "__main__":
    asyncio.run(run())
