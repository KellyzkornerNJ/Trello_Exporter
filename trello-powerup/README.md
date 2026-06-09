# Trello Board Exporter Power-Up

Export any Trello board or list to **PDF**, **CSV**, and **offline searchable HTML** — right from the board toolbar.

---

## Features

| Format | What's included |
|--------|----------------|
| **PDF** | Cover images, card descriptions, labels, due dates, all attachment names + URLs — print or Save as PDF |
| **CSV** | Card name, list, description, labels, due date, attachment names & URLs — AutoHotkey-friendly |
| **Offline HTML** | Self-contained single file with collapsible lists, inline images, live search box — works without internet |

**Scope options:** Entire board • Selected lists • Cards with attachments only

---

## Setup (one-time, ~10 minutes)

### 1. Fork / push to GitHub

Push this folder as a GitHub repo (or fork it). Then enable **GitHub Pages**:
- Repo → Settings → Pages → Source: `main` branch, `/ (root)` folder
- Your Power-Up URL will be: `https://YOUR_GITHUB_USER.github.io/YOUR_REPO_NAME/`

### 2. Get a Trello API Key

1. Go to <https://trello.com/power-ups/admin>
2. Create a new Power-Up (name it anything, e.g. "Board Exporter")
3. Set **Iframe connector URL** to your GitHub Pages URL above
4. Copy your **API Key** from the same page

### 3. Update the code with your details

In **two files**, replace the placeholder values:

**`js/powerup.js`** — line near the bottom:
```js
appKey: 'YOUR_TRELLO_APP_KEY'
```

**`js/popup.js`** — inside `fetchCardDetails()`:
```js
var key = 'YOUR_TRELLO_APP_KEY';
```

**`js/powerup.js`** — in the icon URLs, replace:
```
YOUR_GITHUB_USER/YOUR_REPO_NAME
```
with your actual GitHub username and repo name.

### 4. Add the Power-Up to your board

1. Open a Trello board
2. Board menu → Power-Ups → search for your Power-Up by name
3. Enable it
4. A **📤 Export Board** button appears in the top toolbar

### 5. Authorize on first use

The first time you click an export button, Trello will ask you to authorize the Power-Up to read your board. This gives it read-only access to fetch card data.

---

## Notes

- **PDF with images:** Cover images from Trello load over the network. For fully offline PDFs, save the PDF after the page renders with images loaded.
- **CSV encoding:** Saved as UTF-8 with BOM-free commas. Works directly with AutoHotkey's file-read functions.
- **Offline HTML:** Truly self-contained — no external requests after download. Images are linked (not embedded) so they require internet to display, but all text/search works offline.
- **Privacy:** No data leaves your browser except to Trello's own API. There is no backend server.

---

## File Structure

```
index.html        ← Power-Up connector (required by Trello)
popup.html        ← Export options UI
pdf-render.html   ← PDF print view (opened as modal)
js/
  powerup.js      ← Registers the Power-Up + board button
  popup.js        ← Data fetching + all three exporters
css/
  popup.css       ← Popup styles
icons/
  export-dark.svg
  export-light.svg
README.md
```
