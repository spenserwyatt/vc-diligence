# Getting Started — VC Diligence Engine

This guide assumes you're on a Mac and have never used a terminal before. Follow each step in order.

---

## Step 1: Install Claude Code

This is the AI that powers the analysis. You need your own subscription.

1. Go to [claude.ai/download](https://claude.ai/download)
2. Download the Mac app and install it
3. Open it and create an account (or sign in if you have one)
4. You need a paid plan — the free tier won't work for this

**How to verify:** Open Claude Code. If it opens and you can type, you're good.

---

## Step 2: Install Node.js

This runs the web interface.

1. Go to [nodejs.org](https://nodejs.org)
2. Click the big green **LTS** button (not "Current")
3. Open the downloaded file and follow the installer

**How to verify:** Open **Terminal** (press Cmd+Space, type "Terminal", hit Enter), then type:
```
node --version
```
You should see something like `v22.x.x`. If you see "command not found", close Terminal, reopen it, and try again.

---

## Step 3: Check Python

Python is usually pre-installed on Mac.

In Terminal, type:
```
python3 --version
```

If you see `Python 3.x.x` — you're good, move on.

If you see "command not found":
1. In Terminal, type: `xcode-select --install`
2. Click "Install" in the popup
3. Wait for it to finish (a few minutes)
4. Try `python3 --version` again

---

## Step 4: Download the Project

You should have received access to a private GitHub repository.

1. Go to the repository link you were given (looks like `github.com/spenserwyatt/vc-diligence`)
2. If prompted, sign in to GitHub (create a free account if you don't have one)
3. Click the green **"Code"** button
4. Click **"Download ZIP"**
5. Open your Downloads folder and double-click the ZIP to unzip it
6. You should now have a folder called `vc-diligence-main`

---

## Step 5: Run Setup

This installs all the dependencies. You only do this once.

1. Open **Terminal** (Cmd+Space, type "Terminal", Enter)
2. Type the following — each line followed by Enter:

```
cd ~/Downloads/vc-diligence-main
chmod +x setup.sh
./setup.sh
```

You'll see it downloading and installing things. Wait for it to finish. It should end with "Setup complete!"

If you see any red errors, take a screenshot and send it over.

---

## Step 6: Start the App

1. In the same Terminal window, type:
```
cd web
npm run dev
```

2. Wait a few seconds. You should see:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
✓ Ready
```

3. Open your web browser (Safari, Chrome, whatever)
4. Go to **http://localhost:3000**
5. You should see the Diligence Engine dashboard

---

## Using the App

### To analyze a new deal:
1. Click **"+ New Deal"**
2. Enter the company or fund name
3. Upload the pitch deck (PDF)
4. Click **"Create Deal"**
5. Go to the **Run** tab
6. Select "Run Screening" (for startups) or "Run Fund Evaluation" (for funds)
7. Click **"Start Pipeline"**
8. Wait — this takes 20-40 minutes. You'll see progress update as each phase completes.
9. When done, go to the **Brief** tab to see the full analysis

### To stop the app:
In Terminal, press **Ctrl+C**

### To start the app again later:
Open Terminal and type:
```
cd ~/Downloads/vc-diligence-main/web
npm run dev
```
Then open http://localhost:3000 in your browser.

---

## Troubleshooting

**"command not found: node"** — Node.js isn't installed. Go back to Step 2.

**"command not found: python3"** — Go back to Step 3.

**Setup script shows errors** — Take a screenshot and send it over.

**Pipeline run fails or hangs** — Make sure Claude Code is open and signed in. The pipeline needs Claude Code running in the background.

**Page won't load** — Make sure Terminal is still running with `npm run dev`. If you closed it, start it again (see "To start the app again later" above).
