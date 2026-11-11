#!/usr/bin/env python3
"""Static site generator for Cloudy Game Dev Kits. Usage: BASE_URL=https://x.github.io/repo python3 build.py"""
import json, os, shutil, html, datetime, re, zipfile
from pathlib import Path
from urllib.parse import urlparse
BASE = os.environ.get('BASE_URL', 'https://itscloudy96.github.io/game-dev-kits').rstrip('/')
SITE = 'Cloudy Game Dev Kits'
X_HANDLE = 'ItsCloudySpace'
NEWS = 'https://cloudys-newsletter.beehiiv.com/subscribe'
TOOLS_SITE = 'https://itscloudy96.github.io/ai-tool-finder/'
PROMPTS_SITE = 'https://itscloudy96.github.io/prompt-library/'
TODAY = datetime.date.today().isoformat()
ROOT = Path(__file__).resolve().parent
src, out, kits_dir = ROOT/'src', ROOT/'dist', ROOT/'kits'
D = json.loads((ROOT/'data'/'kits.json').read_text())
KITS = D['kits']
BY = {k['id']: k for k in KITS}
e = lambda s: html.escape(str(s if s is not None else ''), quote=True)
def jl(o): return '<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False).replace('</','<\\/') + '</script>'
ORG = {"@type":"Organization","name":"Cloudy","url":BASE+'/',"sameAs":[f"https://x.com/{X_HANDLE}","https://cloudys-newsletter.beehiiv.com",TOOLS_SITE,PROMPTS_SITE]}

def md(text):
    text = text.replace('\r\n','\n')
    parts, buf, mode = [], [], None
    def flush():
        nonlocal buf, mode
        if not buf: return
        raw = '\n'.join(buf)
        buf = []
        if mode == 'pre':
            parts.append('<pre class="file">'+e(raw)+'</pre>')
        elif mode == 'ul':
            items = ''.join(f'<li>{inline(i[2:].strip())}</li>' for i in raw.split('\n') if i.strip())
            parts.append('<ul>'+items+'</ul>')
        elif mode == 'bq':
            lines = [inline(re.sub(r'^>\s?', '', ln)) for ln in raw.split('\n')]
            parts.append('<blockquote>'+'<br>'.join(lines)+'</blockquote>')
        else:
            parts.append('<p>'+inline(raw)+'</p>')
        mode = None
    def inline(s):
        s = e(s)
        s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
        s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
        s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
        return s
    for line in text.split('\n'):
        if line.startswith('```'):
            if mode == 'pre':
                flush(); mode = None
            else:
                flush(); mode = 'pre'
            continue
        if mode == 'pre':
            buf.append(line); continue
        if re.match(r'^#{1,3} ', line):
            flush()
            lvl = len(line) - len(line.lstrip('#'))
            parts.append(f'<h{lvl}>{inline(line[lvl+1:].strip())}</h{lvl}>')
            continue
        if line.startswith('- '):
            if mode != 'ul': flush(); mode = 'ul'
            buf.append(line); continue
        if line.startswith('>'):
            if mode != 'bq': flush(); mode = 'bq'
            buf.append(line); continue
        if not line.strip():
            flush(); continue
        if mode not in (None, 'p'): flush()
        mode = 'p'; buf.append(line)
    flush()
    return '\n'.join(parts)

def page(path, title, desc, body, root, ld=None, ogtype='website'):
    url = BASE + '/' + path
    lds = ''.join(jl(x) for x in (ld or []))
    doc = f'''<!doctype html>
<html lang="en" data-root="{root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#0b1020">
<meta property="og:type" content="{ogtype}"><meta property="og:site_name" content="{SITE}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}"><meta property="og:image" content="{BASE}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@{X_HANDLE}">
<meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}"><meta name="twitter:image" content="{BASE}/og.png">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" title="LLM summary" href="{root}llms.txt">
<link rel="stylesheet" href="{root}css/styles.css?v={TODAY}">
{lds}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="container nav">
<a class="logo" href="{root}"><span class="logo-mark" aria-hidden="true">☁️</span>Cloudy <span class="muted" style="font-weight:600">Game Dev Kits</span></a>
<nav class="nav-links" aria-label="Main"><a href="{root}kits/">Kits</a><a href="{e(TOOLS_SITE)}">Tool Finder</a><a href="{e(PROMPTS_SITE)}">Prompts</a><a href="{root}about/">About</a><a href="{NEWS}" target="_blank" rel="noopener">Newsletter</a></nav>
</div></header>
<main id="main" class="container">
{body}
</main>
<footer class="footer"><div class="container footer-grid">
<div><strong>☁️ Cloudy</strong><p>Free, original game starter kits you can play in the browser and extend with an AI coding assistant.</p>
<form class="newsletter" action="{NEWS}" method="get" target="_blank"><input type="email" name="email" placeholder="you@example.com" aria-label="Email address" required><button class="btn btn-primary" type="submit">Get the daily AI agent changelog</button></form></div>
<div><strong>Kits</strong><br>{'<br>'.join(f'<a href="{root}kit/{k["id"]}/">{e(k["title"])}</a>' for k in KITS)}</div>
<div><strong>Cloudy</strong><br><a href="{root}about/">About &amp; disclosure</a><br><a href="{root}about/#sponsor">Sponsor Cloudy</a><br><a href="{e(TOOLS_SITE)}">AI Tool Finder</a><br><a href="{e(PROMPTS_SITE)}">Prompt Library</a><br><a href="https://x.com/{X_HANDLE}" target="_blank" rel="noopener">@{X_HANDLE} on X</a><br><a href="{root}llms.txt">llms.txt</a><br><a href="{root}sitemap.xml">Sitemap</a></div>
</div><div class="container disclaimer" style="margin-top:1rem">© {datetime.date.today().year} Cloudy. Kits are original, MIT-licensed, and free to use. Some outbound links may be affiliate links.</div></footer>
<script src="{root}js/app.js?v={TODAY}" defer></script>
</body></html>'''
    p = out / path
    if path == '' or path.endswith('/'): p = p / 'index.html'
    p.parent.mkdir(parents=True, exist_ok=True); p.write_text(doc)

def card(k, root):
    tags = ''.join(f'<span class="badge">{e(t)}</span>' for t in [k['genre'], k['engine']] )
    return (f'<article class="card tool-card"><h3><a href="{root}kit/{k["id"]}/">{e(k["title"])}</a></h3><div>{tags}</div>'
            f'<p>{e(k["summary"])}</p><div class="meta"><a href="{root}kit/{k["id"]}/">Play &amp; download →</a>'
            f'<span class="muted">{e(k["difficulty"])}</span></div></article>')

SPONSOR = lambda root: (f'<aside class="card sponsor" aria-label="Sponsor"><div class="label">Sponsor slot</div><h3 style="margin:.3rem 0">Your game tool here</h3>'
    f'<p class="muted" style="margin:0 0 .6rem">Reach people who are actually making games with AI.</p><a class="btn btn-secondary btn-sm" href="{root}about/#sponsor">Sponsor this spot</a></aside>')

def zip_kit(kid):
    src_kit = kits_dir / kid
    dest = out / 'downloads' / f'cloudy-{kid}.zip'
    dest.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in src_kit.rglob('*'):
            if f.is_file() and '.git' not in f.parts:
                z.write(f, arcname=str(Path(kid) / f.relative_to(src_kit)))
    return dest.stat().st_size

def build():
    if out.exists(): shutil.rmtree(out)
    shutil.copytree(src, out)
    (out/'data').mkdir(exist_ok=True)
    shutil.copy(ROOT/'data'/'kits.json', out/'data'/'kits.json')
    (out/'.nojekyll').write_text('')
    (out/'demos').mkdir(exist_ok=True)
    sizes = {}
    for k in KITS:
        shutil.copytree(kits_dir/k['id'], out/'demos'/k['id'])
        sizes[k['id']] = zip_kit(k['id'])
    urls = []
    faqs = [
        ("What are Cloudy Game Dev Kits?", f"Free, original, MIT-licensed starter games you can play in the browser, download as a zip, and extend with Cursor, Claude, or another coding assistant. There are {len(KITS)} kits right now."),
        ("Do I need to sign up or pay?", "No. The kits on this site are free. A future 'Pro kits' line may be paid — it is only a placeholder today, with nothing to buy."),
        ("Can I use these in my own game or jam?", "Yes. They are MIT-licensed. Keep the license, and do not add trademarked or copyrighted assets if you publish."),
        ("What is in each zip?", "The playable game, a README, Cursor rules, and a prompt pack with step-by-step ideas for vibe-coding new features."),
        ("How should I run a kit?", "Open index.html, or serve the folder with a simple static server. Orbit Garden vendors Three.js so it can run offline; if a 3D canvas is blank from a file:// URL, use a local server."),
    ]
    feat = [k for k in KITS if k.get('featured')] or KITS[:4]
    body = f'''
<section class="hero">
<div class="pill-row"><span class="pill">🎮 Play in the browser</span><span class="pill">📦 Free MIT zips</span><span class="pill">🤖 Prompt packs included</span></div>
<h1>Vibe-code your<br>first game.</h1>
<p>Free starter kits with a playable demo, a downloadable zip, and a prompt pack for Cursor or Claude. {len(KITS)} original games, no sign-up, no asset packs from other games.</p>
<div class="btn-row"><a class="btn btn-primary" href="kits/">Browse the kits</a><a class="btn btn-secondary" href="kit/{feat[0]['id']}/">Play {e(feat[0]['title'])}</a></div>
</section>
<section class="section"><h2>The kits</h2><div class="grid">{''.join(card(k,'') for k in KITS)}{SPONSOR('')}</div></section>
<section class="section"><h2>Pro kits, later</h2>
<div class="card pro-card"><div class="label">Coming soon</div>
<h3 style="margin:.3rem 0 0">A paid pack when there is something worth paying for</h3>
<p class="muted">Ideas on the table: juiced-up jam templates, a co-op kit, a dialogue-and-quest kit, and a Godot 4 export-ready project. Nothing is for sale yet — no checkout, no waitlist form. If you want a say in what gets built, DM <a href="https://x.com/{X_HANDLE}" target="_blank" rel="noopener">@{X_HANDLE}</a>.</p>
</div></section>
<section class="section card"><h2>Get the daily AI agent changelog</h2><p class="muted">New agent tools, model updates, and the occasional kit or prompt, in a 3-minute read. Free.</p>
<form class="newsletter" action="{NEWS}" method="get" target="_blank"><input type="email" name="email" placeholder="you@example.com" aria-label="Email address" required><button class="btn btn-primary" type="submit">Subscribe free</button></form></section>
<section class="section"><h2>Also from Cloudy</h2><div class="sister">
<a class="card" href="{e(TOOLS_SITE)}" style="color:var(--text);text-decoration:none"><strong>☁️ AI Tool Finder</strong><p class="muted" style="margin:.4rem 0 0">A 30-second quiz that matches you with the right AI tools for coding, agents and game dev.</p></a>
<a class="card" href="{e(PROMPTS_SITE)}" style="color:var(--text);text-decoration:none"><strong>☁️ Prompt Library</strong><p class="muted" style="margin:.4rem 0 0">64 original, copy-ready prompts and agent configs, including game-dev and vibe-coding packs.</p></a>
</div></section>
<section class="section faq"><h2>FAQ</h2>{''.join(f'<details><summary>{e(q)}</summary><p class="muted">{e(a)}</p></details>' for q,a in faqs)}</section>'''
    ld = [{"@context":"https://schema.org","@type":"WebSite","name":SITE,"url":BASE+'/',"description":"Free original game-dev starter kits with playable demos and AI prompt packs.","publisher":ORG},
          {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faqs]},
          {"@context":"https://schema.org", **ORG}]
    page('', f'{SITE}: Free Vibe-Coding Game Starters', f'Download {len(KITS)} original, MIT-licensed game starter kits. Play each one in the browser, then extend it with a bundled AI prompt pack.', body, '', ld); urls.append(('', '1.0'))
    body = f'''<p class="crumbs"><a href="../">Home</a> / Kits</p>
<section class="hero" style="padding-top:1.5rem"><h1>All starter kits</h1><p>{len(KITS)} original games. Play the demo, download the zip, and follow the prompt pack.</p></section>
<div class="grid">{''.join(card(k,'../') for k in KITS)}</div>
<div class="section">{SPONSOR('../')}</div>'''
    ld = [{"@context":"https://schema.org","@type":"ItemList","name":"Game dev starter kits","numberOfItems":len(KITS),
           "itemListElement":[{"@type":"ListItem","position":i+1,"url":f"{BASE}/kit/{k['id']}/","name":k['title']} for i,k in enumerate(KITS)]}]
    page('kits/', f'All Game Dev Starter Kits ({len(KITS)}) | Cloudy', f'Browse {len(KITS)} free, MIT-licensed game starter kits with in-browser demos and AI prompt packs.', body, '../', ld); urls.append(('kits/','0.9'))
    for k in KITS:
        kid = k['id']
        readme = md((kits_dir/kid/'README.md').read_text())
        prompts = md((kits_dir/kid/'PROMPTS.md').read_text())
        kb = max(1, round(sizes[kid]/1024))
        others = [x for x in KITS if x['id'] != kid][:3]
        body = f'''<p class="crumbs"><a href="../../">Home</a> / <a href="../../kits/">Kits</a> / {e(k["title"])}</p>
<section class="hero" style="padding-top:1.5rem"><h1>{e(k["title"])}</h1>
<p>{e(k["summary"])}</p>
<div class="tag-row"><span class="badge">{e(k["genre"])}</span><span class="badge">{e(k["engine"])}</span><span class="badge">{e(k["difficulty"])}</span></div>
<p class="muted">{e(k["controls"])}</p>
<div class="kit-actions">
<a class="btn btn-primary" href="../../downloads/cloudy-{e(kid)}.zip" download>Download zip ({kb} KB)</a>
<a class="btn btn-secondary" href="../../demos/{e(kid)}/" target="_blank" rel="noopener">Open demo in a new tab</a>
</div>
<p class="download-note">MIT licensed. The zip includes the game, a README, Cursor rules, and the prompt pack below.</p>
</section>
<section class="section"><h2>Play it here</h2>
<div class="demo-frame"><iframe src="../../demos/{e(kid)}/" title="{e(k['title'])} demo" loading="lazy" allow="autoplay; fullscreen"></iframe></div></section>
<section class="section"><h2>README</h2><div class="readme-body prose">{readme}</div></section>
<section class="section"><h2>Prompt pack</h2>
<p class="muted">Copy a prompt into Cursor, Claude, or your coding assistant after you unzip the kit. The same text ships as <code>PROMPTS.md</code>.</p>
<div class="prompt-wrap">
<button type="button" class="btn btn-secondary btn-sm copy-btn" data-copy-target="#kit-prompts">Copy</button>
<div class="readme-body" id="kit-prompts">{prompts}</div>
</div></section>
<section class="section"><h2>More kits</h2><div class="grid">{''.join(card(a,'../../') for a in others)}</div></section>
<section class="section card"><h2>Get the daily AI agent changelog</h2><p class="muted">New agent tools and the occasional kit or prompt, in a 3-minute read.</p>
<form class="newsletter" action="{NEWS}" method="get" target="_blank"><input type="email" name="email" placeholder="you@example.com" aria-label="Email address" required><button class="btn btn-primary" type="submit">Subscribe free</button></form></section>
<p class="disclaimer">Original Cloudy work. MIT licensed. Art and sound are generated in code.</p>'''
        ld = [{"@context":"https://schema.org","@type":"SoftwareApplication","name":k['title'],"url":f"{BASE}/kit/{kid}/","applicationCategory":"GameApplication","operatingSystem":"Web","description":k['summary'],"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"license":"https://opensource.org/licenses/MIT","author":{"@type":"Organization","name":"Cloudy"}},
              {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":BASE+'/'},{"@type":"ListItem","position":2,"name":"Kits","item":BASE+'/kits/'},{"@type":"ListItem","position":3,"name":k['title'],"item":f"{BASE}/kit/{kid}/"}]}]
        page(f'kit/{kid}/', f'{k["title"]} — Free {k["genre"]} Starter Kit | Cloudy', f'{k["title"]}: {k["summary"]} Play it in the browser or download the MIT-licensed zip.'[:300], body, '../../', ld, 'article'); urls.append((f'kit/{kid}/','0.8'))
    body = f'''<p class="crumbs"><a href="../">Home</a> / About</p><section class="section prose"><h1>About Cloudy</h1>
<p>Cloudy builds free, fast tools for people into AI, AI agents, vibe coding, tech and video games. Game Dev Kits are original starter games you can play, download, and extend with an AI coding assistant.</p>
<p>Also from Cloudy: the <a href="{e(TOOLS_SITE)}">AI Tool Finder</a> and the <a href="{e(PROMPTS_SITE)}">Prompt Library</a>.</p>
<h2>How these kits are made</h2><ul><li>Every game is original Cloudy work, MIT-licensed.</li><li>Art and sound are generated in code. We do not ship copyrighted or trademarked assets.</li><li>Each zip includes a README, Cursor rules, and a prompt pack meant for vibe-coding the next feature.</li><li>The 'Pro kits' section is a future idea, not a store. Nothing here costs money today.</li></ul>
<h2>Affiliate disclosure</h2><p>Some outbound links may be affiliate links, which means Cloudy may earn a commission at no extra cost to you. Affiliate links are marked with <code>rel="sponsored"</code> and never change which kits we publish.</p>
<h2 id="sponsor">Sponsor Cloudy</h2><p>Want your tool in front of people who are making games with AI? Sponsor slots are available on the site and in the Cloudy newsletter. Send a DM to <a href="https://x.com/{X_HANDLE}" target="_blank" rel="noopener">@{X_HANDLE}</a> on X.</p>
<h2>Corrections</h2><p>Found a bug in a kit? DM <a href="https://x.com/{X_HANDLE}" target="_blank" rel="noopener">@{X_HANDLE}</a>.</p>
<h2>Newsletter</h2><p><a href="{NEWS}" target="_blank" rel="noopener">Subscribe to the Cloudy newsletter</a> for the daily AI agent changelog.</p></section>'''
    page('about/', 'About Cloudy & Disclosure | Cloudy Game Dev Kits', 'How Cloudy makes original game starter kits, affiliate disclosure and sponsorship info.', body, '../'); urls.append(('about/','0.4'))
    pre = urlparse(BASE).path.rstrip('/') + '/'
    page('404.html', 'Page not found | Cloudy Game Dev Kits', 'This page does not exist.', f'<section class="hero"><h1>Lost in the clouds ☁️</h1><p>That page doesn\'t exist. Try a kit instead.</p><div><a class="btn btn-primary" href="{pre}">Go home</a> <a class="btn btn-secondary" href="{pre}kits/">All kits</a></div></section>', pre)
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{BASE}/{u}</loc><lastmod>{TODAY}</lastmod><priority>{p}</priority></url>\n' for u,p in urls) + '</urlset>\n'
    (out/'sitemap.xml').write_text(sm)
    (out/'robots.txt').write_text(f'User-agent: *\nAllow: /\n\n# AI crawlers welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n')
    L = [f'# {SITE}', '', f'> Free, original, MIT-licensed game starter kits with in-browser demos, downloadable zips, and AI prompt packs. {len(KITS)} kits. Run by Cloudy.', '',
         'Each kit ships as a zip at ' + BASE + '/downloads/cloudy-<id>.zip and a playable demo at ' + BASE + '/demos/<id>/.', '', '## Main pages',
         f'- [Home]({BASE}/)', f'- [All kits]({BASE}/kits/)', f'- [Full kit text for LLMs]({BASE}/llms-full.txt)', f'- [About & disclosure]({BASE}/about/)',
         f'- [Cloudy AI Tool Finder]({TOOLS_SITE})', f'- [Cloudy Prompt Library]({PROMPTS_SITE})', '', '## Kits']
    L += [f'- [{k["title"]}]({BASE}/kit/{k["id"]}/): {k["summary"]} Engine: {k["engine"]}.' for k in KITS]
    (out/'llms.txt').write_text('\n'.join(L)+'\n')
    F = [f'# {SITE}: full kit notes', f'Updated {D.get("generatedAt", TODAY)}. {D.get("disclaimer","")}', '']
    for k in KITS:
        F += [f'## {k["title"]}', f'- Page: {BASE}/kit/{k["id"]}/', f'- Demo: {BASE}/demos/{k["id"]}/', f'- Zip: {BASE}/downloads/cloudy-{k["id"]}.zip',
              f'- Genre: {k["genre"]}', f'- Engine: {k["engine"]}', f'- Controls: {k["controls"]}', f'- Summary: {k["summary"]}', '',
              (kits_dir/k['id']/'README.md').read_text(), '', (kits_dir/k['id']/'PROMPTS.md').read_text(), '']
    (out/'llms-full.txt').write_text('\n'.join(F))
    print('built', len(urls), 'pages ->', out, 'BASE', BASE, 'kits', len(KITS), 'zips', {i: sizes[i] for i in sizes})
if __name__ == '__main__':
    build()
