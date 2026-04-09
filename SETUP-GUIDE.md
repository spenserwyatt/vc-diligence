# Getting Started — VC Diligence Engine

This guide assumes you're on a Mac and have never used a terminal before. Follow each step in order.

> **Important — read this first.** These steps are numbered on purpose. Do not skip any of them. Do not do Step 6 before Step 5. Each step depends on the ones before it — if you skip one, the next step will fail with a confusing error. The whole setup takes roughly 20–30 minutes of active work the first time, plus waiting time for downloads.

---

## Step 1: Install Claude Code

Claude Code is the AI that actually runs the analysis. The diligence app is a wrapper around it — **without Claude Code installed and signed in, the pipeline will fail immediately with a cryptic error like "exit code -2".** This is the most important step. Go slow.

### 1a. Make sure you have a paid Claude plan

**The free Claude plan does not work for this.** You need one of:
- **Claude Pro** — the cheapest option, works for most users
- **Claude Max** — higher usage limits, pick this if you'll run lots of deals
- **Claude Team / Enterprise** — if your organization already has one

If you don't have a paid plan yet, go to [claude.com/pricing](https://claude.com/pricing) and subscribe before continuing.

### 1b. Install the Claude Code command

1. Open **Terminal** (press Cmd+Space, type "Terminal", hit Enter). A plain window with a blinking cursor will appear — don't be alarmed, this is normal.
2. Copy and paste this one line exactly, then press Return:
   ```
   curl -fsSL https://claude.ai/install.sh | bash
   ```
3. You'll see some text scroll by while it downloads and installs itself. When the blinking cursor comes back with no red errors, it's done. This usually takes under a minute.

### 1c. Sign in to Claude

1. In the same Terminal window, type the following and press Return:
   ```
   claude
   ```
2. A web browser will open automatically, asking you to sign in. Use the same Claude account that has your paid plan from Step 1a.
3. After you sign in, the browser will show a success page. Go back to Terminal — Claude will be ready.
4. If the browser didn't open by itself, Terminal will show a URL. Press the `c` key to copy it, then paste it into your browser manually.
5. Once signed in, press **Ctrl+C** twice to exit Claude and return to a normal Terminal prompt.

### 1d. Verify it's working

Before moving on, make sure Claude Code is actually installed and reachable. In Terminal, type:
```
claude --version
```

You should see a version number. If you do — perfect, move on to Step 2.

If you see **"command not found: claude"**:
1. Close Terminal completely (press Cmd+Q, not just the red X in the corner)
2. Reopen Terminal
3. Try `claude --version` again
4. If it still says "command not found", go back to Step 1b and run the install command one more time. Watch the output carefully for any red error messages.

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

## Step 3: Install Python

Python is needed for one small part of the pipeline: pulling text out of pitch deck PDFs so Claude can read them faster. **Do not assume it's already on your Mac — newer Macs don't ship with it.**

### 3a. Check if you already have it

In Terminal, type:
```
python3 --version
```

- If you see `Python 3.x.x` — great, you already have it. **Skip to Step 4.**
- If you see **"command not found"**, or a popup appears asking you to install "Command Line Developer Tools" — you don't have it yet. Continue to 3b below. (If the popup appeared, click **Cancel** — we'll use a simpler installer instead.)

### 3b. Install Python from python.org

Just like you did for Node.js, we're going to download an installer from the official website:

1. Go to [python.org/downloads](https://python.org/downloads)
2. Click the big yellow **Download Python 3.x.x** button at the top of the page
3. Open the downloaded file (it will end in `.pkg`)
4. Follow the installer — click Continue, Continue, Agree, Install. Enter your Mac password when prompted.
5. When it says "The installation was successful", close the installer.

### 3c. Verify it worked

1. **Close Terminal completely** (Cmd+Q — not just clicking the red X in the corner)
2. Reopen Terminal
3. Type:
   ```
   python3 --version
   ```
4. You should now see `Python 3.x.x`. If you do, move on to Step 4.

If you still see "command not found" after reopening Terminal, take a screenshot and send it over.

---

## Step 4: Download the Project

1. Go to [github.com/spenserwyatt/vc-diligence](https://github.com/spenserwyatt/vc-diligence)
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Open your Downloads folder and double-click the ZIP to unzip it
5. You should now have a folder called `vc-diligence-main` inside your Downloads folder

> **Note about the folder name:** If you downloaded the ZIP as above, the folder is called `vc-diligence-main`. If you used `git clone` instead, it'll be called just `vc-diligence`. Anywhere in the rest of this guide that you see `vc-diligence-main`, substitute the name your folder actually has.

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

**"command not found: python3"** — Python isn't installed. Go back to Step 3.

**"command not found: claude"** — Claude Code isn't installed, or Terminal needs to be reopened. Close Terminal completely with Cmd+Q, reopen it, and try again. If it still fails, go back to Step 1b and reinstall.

**"sh: next: command not found" (or similar) when running `npm run dev`** — You skipped Step 5. The setup script is what installs the `next` tool that actually runs the app. Go back to the project folder and run `./setup.sh` first, then try `npm run dev` again.

**"Pipeline failed with exit code -2" (or any negative number) in the web UI** — Claude Code started up but quit immediately. Almost always one of:
1. You're not signed in to Claude Code. In Terminal, type `claude`, sign in again, then press Ctrl+C twice to exit.
2. Your Claude subscription lapsed or is out of credit. Check at [claude.com/settings/billing](https://claude.com/settings/billing).
3. You're on the free Claude plan. You need Pro, Max, or higher — go back to Step 1a.
4. You have an `ANTHROPIC_API_KEY` environment variable set that's pointing at a disabled or empty account. Ask Spenser about this one if the other three don't fix it.

**Pipeline hangs forever with no progress for more than an hour** — Claude may be stuck. Stop the web app (Ctrl+C in Terminal), then in a new Terminal window type `ps aux | grep claude` to see if any Claude processes are still running. Restart the app with `cd web && npm run dev` and try the deal again.

**Setup script shows red errors** — Take a screenshot of the last 20 lines and send it over.

**Page won't load in the browser** — Make sure the Terminal window with `npm run dev` is still open and still showing the "Ready" message. If you closed Terminal, the app stopped. Restart it using the "To start the app again later" instructions above.
