# Stickman Fight Online

Real-time 1v1 browser-based stickman fighting game with ranked matchmaking, 5 unique fighters, and cinematic ultimate abilities.

## Features

- Real-time online PvP via Socket.IO
- Room code system (create/join)
- 5 unique fighters with ultimate abilities
- Ranked ELO system with leaderboard
- Training mode
- Casual & Ranked matchmaking
- Particle effects, screen shake, hit sparks

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Deploy to Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/stickman-fight.git
git push -u origin main
```

### Step 2 — Create Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`
5. Click **Create Web Service**

The game will be live at your Render URL within ~2 minutes.

## Controls

| Action | Key |
|---|---|
| Move Left | A / ← |
| Move Right | D / → |
| Jump | W / ↑ / Space |
| Punch | J |
| Kick | K |
| Block | S / ↓ |
| Dash | Double-tap A or D |
| Special | Q |
| Ultimate | E (when meter full) |

## Fighters

| Fighter | Style | Ultimate |
|---|---|---|
| Ryoku | Balanced brawler | Dragon Fist |
| Seraph | Aerial fighter | Angel Descent |
| Vortex | Speed demon | Cyclone Rush |
| Nyx | Tricky rushdown | Shadow Clone |
| Titan | Heavy tank | Earthquake Slam |
