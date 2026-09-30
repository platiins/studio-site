# Studio website

A small, fast website for the studio, starting with the **Jewelry in stock** page.
Plain HTML, CSS and JavaScript. No build step and nothing to install.

```
index.html        page shell
styles.css        all the styling
app.js            draws the page from the data files
data/jewelry.json your pieces (edit this to change stock)
data/site.json    texts + design settings (theme, fonts, roundness…)
images/           product photos
.pages.yml        settings for the no-code editor (Pages CMS)
CLAUDE.md         instructions Claude reads when you vibe-code changes
```

## Three ways to change the site

1. **No-code editor (daily updates).** Go to https://app.pagescms.org, sign in with GitHub, open this repository. Change prices and availability, upload photos, edit texts and pick themes and fonts. Press **Save**. The site updates about a minute later.
2. **Vibe coding (new features and design changes).** Open the repository in Claude Code (claude.ai/code, or the desktop app) and describe what you want: "add an aftercare section under the catalog", "make the cards show two photos", "add a Latvian version". Claude follows `CLAUDE.md`.
3. **Edit by hand.** Change the files on GitHub (press `.` on the repo page to open the web editor) or in VS Code.

## Preview on your computer
```
python3 -m http.server 8000
```
Then open http://localhost:8000. Opening `index.html` by double-click won't load the data files.

## Going live (one-time setup, ~20 minutes)

1. **GitHub.** Create a free account at github.com. Make a new repository (for example `studio-site`) and upload these files. Or connect GitHub in Claude settings and ask Claude to push them for you.
2. **Hosting on Netlify (free).** Go to netlify.com → sign up with GitHub → *Add new site* → *Import an existing project* → choose the repository. Leave the build command empty, set the publish directory to `/`, and deploy. You'll get an address like `studio-site.netlify.app`.
3. **Your domain.** Buy a domain (a `.lv` domain from a Latvian registrar, or `.com` anywhere). In Netlify: *Domain management* → *Add a domain* and follow the DNS instructions. HTTPS turns on automatically.
4. **Editor.** Sign in at app.pagescms.org with the same GitHub account and open the repository.

From then on, every change saved on GitHub (from Pages CMS, Claude or by hand) goes live automatically.

## Photos
Square JPGs around 1000×1000 px look best and load fast. Upload them through the editor, or put them in `images/` and set `"photo": "/images/name.jpg"` in `data/jewelry.json`.
