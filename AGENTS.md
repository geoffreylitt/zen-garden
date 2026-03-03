## Cursor Cloud specific instructions

This is a purely client-side Phaser 3 game ("Zen Garden") bundled with Vite. There is no backend, database, or external service.

### Running the app

- `npm run dev -- --host 0.0.0.0` starts the Vite dev server (default port 5173).
- `npm run build` produces a production bundle in `dist/`.
- There are no automated tests, linters, or type-checking configured in this project.

### Notes

- The game renders on an HTML `<canvas>` using Phaser's CANVAS renderer. Testing UI changes requires a browser (use the `computerUse` subagent).
- Audio (Web Audio API) only initialises after the first user click due to browser autoplay policies.
