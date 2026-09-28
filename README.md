# iLOcate — Explore Iloilo Now!

iLOcate is a navigation and tourism web app for Iloilo City, Philippines. It shows PUJ (jeepney) routes, landmarks, cafes, restaurants, and turn-by-turn directions on an interactive map.

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Leaflet · OSRM (routing)

---

## 1. Requirements

| Tool | Version |
| --- | --- |
| [Node.js](https://nodejs.org/) | **20.9 or newer** (Next.js 16 requirement). The LTS version is recommended. |
| npm | Comes with Node.js |

Check your version:

```bash
node -v
```

---

## 2. Run it locally

### Step 1 — Install dependencies

Run this **from the repo root** (not inside `frontend/` or `backend/`). It installs both folders and links them together:

```bash
pnpm install     # or: npm install
```

No Firebase project or environment variables are required. Likes and interests are saved in the current browser's local storage, so they stay on this device and are not synced between browsers.

### Step 2 — Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

### Other commands (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create a production build (run this before deploying to catch errors) |
| `npm run start` | Serve the production build locally (run `npm run build` first) |
| `npm run typecheck` | Type-check `frontend/` and `backend/` separately |

---

## 3. Deploy to Vercel

### Option A — Using the Vercel website (recommended)

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
   - Do **not** commit `.env.local`. It is already listed in `.gitignore`.
2. Go to <https://vercel.com/new> and **import** the repository.
3. Set **Root Directory** to `frontend`. Leave "Include files outside the root directory" **on**, because the app imports code from `backend/`. Vercel detects the workspace and installs from the repo root automatically.
4. Click **Deploy**. No Firebase environment variables are needed.

### Option B — Using the Vercel CLI

```bash
npm i -g vercel
vercel login
cd frontend
vercel            # first deploy (preview); follow the prompts
vercel --prod     # production deploy
```

---

## 4. Project structure

The code is split into two folders so problems are easier to track down:

- **`frontend/`** is everything you see: pages, components, styles, and images (Next.js).
- **`backend/`** contains PUJ routes, landmarks, and OSRM directions. It has no React code.

The frontend imports route and landmark data through `@ilocate/backend/<file>`. Likes and interests are stored locally in the browser.

```
package.json              Workspace root: `npm run dev/build/start/typecheck` from here

frontend/                 Next.js app (UI only)
  app/
    layout.tsx            Root layout (fonts, Vercel Analytics)
    (site)/               Public pages: landing (features, how it works, FAQs, CTA), FAQs
    (auth)/               Interest selection
    login/page.tsx        Legacy login URL redirects to /dashboard
    signup/page.tsx       Legacy signup URL redirects to /dashboard
    (dashboard)/           Guest-accessible explorer and tools
      dashboard/          Home, map, places, food, itinerary, translator, saved routes, profile
  components/
    map-leaflet.tsx       Leaflet map (routes, landmarks, directions, pin drop)
    home/                 Landing page sections
    ui/                   shadcn/ui components
  hooks/                  Shared React hooks
  lib/
    preferences.ts        Browser-local interest persistence
    utils.ts              cn() class-name helper
  public/images/          Place, food, and event photos

backend/                  Data + services (@ilocate/backend)
  src/
    routes.ts             Decodes PUJ route polylines from data/routes.json
    osrm.ts               Turn-by-turn directions via the public OSRM server
    landmarks.ts          Landmark list (name, type, coordinates, image)
  data/routes.json        PUJ route data
```

### Common edits

- **Add or edit a landmark:** edit `backend/src/landmarks.ts`. Put its photo in `frontend/public/images/...`.
- **Update PUJ routes:** replace `backend/data/routes.json` (same format).
- **Change browser-local interests:** edit `frontend/lib/preferences.ts`.
- **Change colors/theme:** edit the CSS variables at the top of `frontend/app/globals.css`.

> 💡 Vercel runs on Linux, where **file names are case-sensitive**. For example, `aroma.JPG` and `aroma.jpg` are different files. Make image paths in the code match the file names exactly, or the images will work locally on Windows but break on Vercel.

---

## 5. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Cannot find module '@ilocate/backend/...'` | Run `pnpm install` (or `npm install`) from the **repo root** so the workspace link is created. |
| Map shows no "current location" | The browser blocked location access. Geolocation also requires HTTPS (Vercel provides it) or `localhost`. |
| Directions fail sometimes | Directions come from the free public OSRM demo server, which is rate-limited. For production traffic, consider self-hosting OSRM or using a paid routing API (see `backend/src/osrm.ts`). |
| A type error | `npm run typecheck` checks both folders. `npm run build` also fails on type errors. |
