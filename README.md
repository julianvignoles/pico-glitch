# PICO//ARCADE

A night-city pixel arcade with four unlimited word games, hosted by Clawd (the little orange Claude Code guy).

**Play:** https://julianvignoles.github.io/pico-glitch/

| Game | What it is |
|---|---|
| **UPLINK** | Krillion-style trivia: "Name a ___". Rarer answers score more (10 to 85, and 100 for the single rarest). Clawd climbs a tower one metre per point. 14 categories, with Climbing, Video games and Vibecoding pinned first. |
| **SPLICE** | Word ladder toward a hidden target, with Wordle-style hints. Par uses everyday words only. |
| **WORDLE** | Six guesses, new word every round. |
| **CONNECTIONS** | Four groups of four, generated fresh from a pool of 73 groups. |

## Playing offline (school)

Two ways, both work with no internet:

1. **Open the link once while online.** The page saves itself in the browser. After that, the same link works offline on that laptop and browser.
2. **Carry the file.** `index.html` is the entire game in one file, with no downloads needed. Put it on a USB stick or in Google Drive, download it to the laptop, and double-click it.

Your computer does not need to be on. GitHub Pages hosts the site.

## Editing

The source is in `src/`. After changing anything, rebuild the single file:

```
node build.js
```

- `src/trivia.js`: UPLINK prompts. Answers run from most common to rarest; commas separate alternate spellings.
- `src/links.js`: CONNECTIONS groups (level 1 easy to 4 wordplay). The optional 4th field lists words that also fit, so they never appear as decoys.
- `src/pixel.js`: the font, the Clawd sprite and the city background.
