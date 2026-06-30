# TestCaseGen — QA Test Case Generator

A simple, browser-based application that generates structured QA test cases from
your feature description. It runs **entirely in your browser** — no server, no
build step, no installation, and no data ever leaves your machine.

## What it does

Describe a feature and the generator produces a table of test cases covering the
categories you choose:

- **Functional (positive)** — derived from your acceptance criteria and fields
- **Negative** — empty required fields, invalid input per field type
- **Boundary / Limits** — min/max, length limits, date edges, file size/type
- **UI / Usability** — layout, responsiveness, keyboard navigation
- **Security** — SQL injection, XSS, password handling, access control
- **Performance** — response time, concurrent load
- **Accessibility** — screen-reader support, colour contrast (WCAG)

Each test case includes an ID, category, title, numbered steps, expected result,
and priority. You can filter, **copy** the results, or **export to CSV**
(ready for Jira / TestRail / Excel).

## How to run it in Chrome (local)

No tools required — just open the file:

1. Download / clone this repository.
2. Open the project folder.
3. **Double-click `index.html`** — it opens in your default browser.
   - Or, in Chrome, press `Ctrl+O` (`Cmd+O` on Mac) and select `index.html`.

That's it. The address bar will show a `file:///…/index.html` URL and the app
is fully functional.

### Optional: run via a local server

If you prefer serving over `http://` (some teams disable `file://`), run any
static server from the project folder:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000 in Chrome
```

## How to use

1. Enter a **Feature / Module name** (required).
2. Optionally add a user story and **acceptance criteria** (one per line).
3. Add the feature's **input fields** with their type and required/optional flag
   — these drive the negative and boundary tests.
4. Tick the **test categories** you want.
5. Click **Generate test cases**.
6. Use **Copy** or **Export CSV** to take the results into your tracker.

Tip: click **Load sample** to see a fully populated "User Login" example.

## Files

| File         | Purpose                                  |
|--------------|------------------------------------------|
| `index.html` | App structure / form                     |
| `styles.css` | Styling                                  |
| `app.js`     | Test-case generation logic (no deps)     |
