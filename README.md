# NuMaze

A relaxing number puzzle game. Transform the start number into the target using a chain of rules.

## How to Play

1. You're given a **start** number and a **target** number.
2. Tap rules to transform the start number step by step.
3. Reach the target using exactly the number of steps in the hidden solution to win.
4. Finish the puzzle and start the next one.

Every puzzle is generated on the fly, so there is never a shortage of levels.

## Rules

| Rule | Effect |
|------|--------|
| +5, +7, +10 | Add the number |
| −3, −7 | Subtract the number |
| ×2, ×3 | Multiply |
| ÷2 | Halve (rounded down) |
| mod 10 | Keep the last digit |
| Σ digits | Sum of the digits |
| Reverse | Reverse the digits |
| # digits | Count the digits |

Rules unlock as levels increase, so early puzzles use only the simpler rules.

## Controls

- **Undo**: removes the last step. You have 5 per puzzle.
- **Reset**: clears the path and starts over. You have 2 per puzzle.
- **Give Up**: reveals the solution. This also resets your current win streak.

## Stats and Badges

Stats are saved in your browser's local storage, so they stay between visits.

- Current and longest win streak
- Best time per level
- Total wins and perfect wins (solved without a reset)

Badges:

- 🔥 **On Fire**: 10 wins in a row
- ⚡ **Speed Runner**: solve in under 30 seconds
- ✨ **Perfect**: solve without using a reset
- 💥 **Unstoppable**: 25 wins in a row
- 👑 **Master**: beat your best time 3 times
- 🏆 **Collector**: earn 5 badges

## Tech Stack

- [React](https://react.dev/) 18+
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) icons

## Getting Started

Requires Node.js 18 or newer.

```bash
git clone https://github.com/mbalavignesh/numaze.git
cd numaze
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build and Deploy

```bash
npm run build
```

The production files are written to `dist/`. The project is set up for one-click deployment on [Vercel](https://vercel.com/): import the repository, and Vercel detects Vite and uses `npm run build` with `dist` as the output.

## Project Structure

```
numaze/
├── index.html
├── src/
│   ├── App.jsx        # Game logic and UI
│   ├── index.css      # Tailwind import and global styles
│   └── main.jsx       # Entry point
├── vite.config.js
└── package.json
```

## Roadmap

- Automatic level progression
- Daily challenge
- Share card for results

## License

This project is currently unlicensed. All rights reserved by the author.
