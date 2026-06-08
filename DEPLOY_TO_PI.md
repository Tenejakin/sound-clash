# Uploading new code to the Raspberry Pis

This guide explains how to push your latest changes from your computer to the
Raspberry Pis that run Sound Clash at an event.

> **This branch is the Albanian (`albanian`) language version.**
> Each event location runs the branch for its language:
> - `main` → Slovenian
> - `bulgarian` → Bulgarian 🇧🇬
> - `albanian` → Albanian 🇦🇱
>
> A Pi should always be checked out on the branch that matches its language.

---

## The big picture

1. You make changes on your computer and **push** them to GitHub.
2. You connect to each Pi over the network (SSH).
3. On the Pi you **pull** the new code from GitHub and restart the app.

GitHub is the middle-man: code goes *your computer → GitHub → Pi*.

Repository: <https://github.com/Tenejakin/sound-clash>

---

## Step 1 — Push your changes from your computer

After editing strings (or anything else) on the correct branch:

```bash
git add -A
git commit -m "Describe what you changed"
git push
```

Make sure you are on the right branch first (`git branch --show-current`
should print `albanian` for the Albanian Pi).

---

## Step 2 — Connect to the Pi

You need the Pi's IP address (ask whoever set it up, or check your router).
From your computer's terminal:

```bash
ssh pi@<PI_IP_ADDRESS>
```

Example: `ssh pi@192.168.1.50` — then enter the Pi's password.

> 💡 Tip: write down the IP address of each Pi and which language it runs.

---

## Step 3 — Pull the new code on the Pi

Once connected, go into the project folder and pull. Adjust the folder path if
the project lives somewhere else on the Pi.

```bash
cd ~/sound-clash          # the project folder on the Pi

git fetch origin
git checkout albanian     # only needed the first time / if on the wrong branch
git pull                  # downloads the latest code
```

If `git pull` complains about local changes on the Pi that you don't care
about, you can throw them away and force the Pi to match GitHub exactly:

```bash
git fetch origin
git reset --hard origin/albanian
```

---

## Step 4 — Rebuild and restart the app

The main scream app lives in the `Sound_clash` folder and needs a rebuild after
a code change:

```bash
cd ~/sound-clash/Sound_clash
npm install        # only needed if dependencies changed
npm run prod       # builds the frontend and starts the server
```

If the Pi runs the app automatically as a background service (so it relaunches
on boot), restart that service instead of running `npm run prod` by hand. For a
typical `systemd` service named `soundclash`:

```bash
sudo systemctl restart soundclash
sudo systemctl status soundclash      # check it came back up
```

> Not sure if there's a service? Run `systemctl list-units | grep -i sound`.
> If nothing shows up, the app is being started manually with `npm run prod`.

---

## Step 5 — Check it worked

- Open the Pi's screen (or its browser kiosk) and confirm the text shows in the
  right language.
- The leaderboard (`leaderboard/index.html`) and the photo download page
  (`photo-server`) are deployed separately — usually on Vercel, not on the Pi.
  If you changed those, redeploy them where they're hosted rather than on the Pi.

---

## Quick reference (copy/paste)

On your computer:
```bash
git add -A && git commit -m "update text" && git push
```

On the Pi:
```bash
ssh pi@<PI_IP_ADDRESS>
cd ~/sound-clash
git fetch origin && git reset --hard origin/albanian
cd Sound_clash && npm install && npm run prod
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Permission denied` when SSH-ing | Wrong username/password or IP. Confirm with whoever set up the Pi. |
| `git pull` says "Already up to date" but text didn't change | You forgot to `git push` from your computer, or the Pi is on the wrong branch (`git branch --show-current`). |
| Old text still showing | Rebuild the app (`npm run prod`) and refresh the browser / restart the service. |
| Can't find the project folder | Run `ls ~` or `find / -name "Sound_clash" -type d 2>/dev/null` to locate it. |
