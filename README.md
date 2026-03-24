# Zen Garden

A meditative pixel-art zen garden built with Phaser 3. Rake sand patterns, place rocks, shrubs, and teahouses, and enjoy ambient soundscapes.

## Getting Started

```bash
npm install
npm run dev      # development server
npm run build    # production build
npm run preview  # preview production build
```

## Project Structure

```
src/
├── main.js                      # Phaser game config and boot
├── constants.js                 # Shared dimensions, colors, tuning values
├── scenes/
│   └── GardenScene.js           # Scene orchestrator — wires modules together
├── audio/
│   ├── AudioManager.js          # Web Audio context lifecycle, layer registry
│   ├── WindLayer.js             # Filtered white noise wind ambience
│   ├── ChimesLayer.js           # Random pentatonic chime scheduling
│   ├── CicadasLayer.js          # Bandpass-filtered noise with LFO modulation
│   ├── RakeSound.js             # Raking interaction sound
│   └── PlaceSound.js            # Item placement "plink" sound
├── tools/
│   ├── RakeTool.js              # Multi-tine rake stroke logic
│   ├── RockTool.js              # Rock placement
│   ├── ShrubTool.js             # Shrub placement
│   └── TeahouseTool.js          # Teahouse placement
├── atmosphere/
│   ├── DayNightCycle.js         # Compressed 24-hour cycle driving fog & light
│   └── FogRenderer.js           # Drifting translucent fog wisps overlay
├── graphics/
│   ├── GardenMask.js            # Elliptical garden boundary with noise edges
│   ├── SandCanvas.js            # Pixel-level sand rendering and manipulation
│   ├── BorderRenderer.js        # Stone border with moss decoration
│   └── sprites/
│       ├── RockSprite.js        # Procedural rock texture generation
│       ├── ShrubSprite.js       # Procedural shrub texture generation
│       └── TeahouseSprite.js    # Procedural teahouse texture generation
└── ui/
    ├── Toolbar.js               # Bottom toolbar with tool buttons
    └── SoundDialog.js           # Sound & atmosphere settings modal overlay
```

## Architecture

The codebase is modularized so that different types of changes can be made in parallel without merge conflicts.

**GardenScene** is a thin orchestrator that wires modules together. It owns no game logic itself — all functionality lives in focused modules:

| Directory | Purpose | When to add files |
|-----------|---------|-------------------|
| `atmosphere/` | Weather, time-of-day, and environmental effects | Adding fog, rain, day/night, or similar overlays |
| `audio/` | Sound layers and interaction sounds | Adding a new ambient sound or interaction sound effect |
| `tools/` | Pointer-based interaction tools | Adding a new garden tool (e.g., a water feature placer) |
| `graphics/sprites/` | Procedural sprite generators | Adding a new placeable item type |
| `graphics/` | Rendering systems | Changing how the garden area, sand, or border renders |
| `ui/` | DOM overlays and Phaser UI | Adding new dialogs, menus, or toolbar changes |

### Adding a new tool

1. Create `src/tools/MyTool.js` with an `onDown(pointer)` method (and optionally `onMove`/`onUp`)
2. If it places a sprite, create `src/graphics/sprites/MySprite.js`
3. Register it in `GardenScene.create()` under `this.tools`
4. Add the tool name to the `TOOL_NAMES` array in `src/ui/Toolbar.js`

### Adding a new sound layer

1. Create `src/audio/MyLayer.js` with `setup(ctx, destination)`, `updateGain(ctx)`, and `enabled`/`volume`/`maxGain` properties
2. Connect the layer's output gain to `destination` (the master bus) rather than `ctx.destination`
3. Register it in `AudioManager`'s constructor under `this.layers`
4. Add it to the `layerDefs` array in `src/ui/SoundDialog.js`

### Atmosphere system

The `src/atmosphere/` directory holds environmental effects:

- **DayNightCycle** — a compressed 24-hour clock (8 min per full day). Exposes `.hour`, `.fogTimeFactor`, and `.darkness` that other systems query each frame.
- **FogRenderer** — draws drifting translucent fog wisps on a canvas texture overlay. Density is `baseDensity × fogTimeFactor + rainBoost`. Call `notifyRainStart()` / `notifyRainStop()` to trigger lingering post-rain mist.
- **Audio muffling** — `AudioManager` routes all layers through a master lowpass filter whose cutoff drops with fog density.
- Fog density is user-adjustable from the Sound & Atmosphere dialog (light haze → thick mist).

### Shared constants

All dimensions (canvas size, toolbar height), colors (sand, groove, ridge), tuning values (rake tine count, chime frequencies), and atmosphere parameters (fog wisp count, muffle frequencies, day cycle length) live in `src/constants.js`.
