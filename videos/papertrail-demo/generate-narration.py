import asyncio
import json
from pathlib import Path

import edge_tts

VOICE = "en-US-AndrewMultilingualNeural"

RATE = "+0%"

TICKS_PER_SECOND = 10_000_000


async def main() -> None:
    folder = Path(__file__).resolve().parent
    text = (folder / "narration.txt").read_text(encoding="utf-8").strip()

    captions: list[dict[str, object]] = []

    with (folder / "narration.mp3").open("wb") as audio:
        speaker = edge_tts.Communicate(
            text, VOICE, rate=RATE, boundary="WordBoundary"
        )

        async for chunk in speaker.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
                continue

            if chunk["type"] != "WordBoundary":
                continue

            start_ms = chunk["offset"] / TICKS_PER_SECOND * 1000
            end_ms = (chunk["offset"] + chunk["duration"]) / TICKS_PER_SECOND * 1000

            spoken = chunk["text"]

            captions.append(
                {
                    "text": spoken if not captions else f" {spoken}",
                    "startMs": round(start_ms, 2),
                    "endMs": round(end_ms, 2),
                    "timestampMs": round((start_ms + end_ms) / 2, 2),
                    "confidence": None,
                }
            )

    (folder / "captions.json").write_text(
        json.dumps(captions, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    spoken_seconds = captions[-1]["endMs"] / 1000 if captions else 0
    minutes = int(spoken_seconds // 60)
    seconds = int(spoken_seconds % 60)

    print(f"words spoken: {len(captions)}")
    print(f"narration length: {minutes}:{seconds:02d}")


if __name__ == "__main__":
    asyncio.run(main())
