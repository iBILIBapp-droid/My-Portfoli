// ============================================================
//  APP.JS — Jearo Robi Galeste Portfolio
// ============================================================

const SB_URL = "https://gujzpqpcobwdsigxjcem.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1anpwcXBjb2J3ZHNpZ3hqY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjMyMzMsImV4cCI6MjA4NzkzOTIzM30.3W1BtfXpXRcikt1bfOGwdFBQEVtT3xhrGbub-PyGQ6o";
const sb = supabase.createClient(SB_URL, SB_KEY);

var websiteProjects = [];
var appProjects     = [];

// ── HELPERS ──────────────────────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getPublicUrl(path) {
    return sb.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
}

function stripExt(name) {
    return name.replace(/\.[^/.]+$/, '');
}

function niceName(filename) {
    return stripExt(filename)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

// ── LOAD WEBSITES ─────────────────────────────────────────────
async function loadWebsites() {
    var res = await sb.from('projects').select('*').order('created_at', { ascending: false });
    if (res.error) { console.error('[Portfolio] Website table error:', res.error.message); return; }
    websiteProjects = res.data || [];
}

// ── LOAD APPS ─────────────────────────────────────────────────
async function loadApps() {
    var appRes = await sb.storage.from('portfolio').list('app', { limit: 200, offset: 0 });
    if (appRes.error) { console.error('[Portfolio] Error listing app/ folder:', appRes.error.message); return; }

    var appFiles = (appRes.data || []).filter(function(f) {
        return f.name && f.name !== '.emptyFolderPlaceholder' && f.name !== '.gitkeep';
    });
    if (!appFiles.length) { appProjects = []; return; }

    var thumbRes = await sb.storage.from('portfolio').list('thumbnail', { limit: 200, offset: 0 });
    var thumbMap = {};
    if (!thumbRes.error) {
        (thumbRes.data || []).forEach(function(f) {
            if (!f.name || f.name === '.emptyFolderPlaceholder') return;
            thumbMap[stripExt(f.name).toLowerCase()] = getPublicUrl('thumbnail/' + f.name);
        });
    }

    appProjects = appFiles.map(function(f) {
        return {
            title:         niceName(f.name),
            description:   '',
            file_url:      getPublicUrl('app/' + f.name),
            thumbnail_url: thumbMap[stripExt(f.name).toLowerCase()] || ''
        };
    });
}

// ── RENDER ────────────────────────────────────────────────────
function filter(cat) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var tabBtn = document.getElementById('btn-' + cat);
    if (tabBtn) tabBtn.classList.add('active');

    var grid  = document.getElementById('projectGrid');
    var items = cat === 'Website' ? websiteProjects : appProjects;

    if (!items || !items.length) {
        grid.innerHTML = '<div class="empty-state">No ' + cat.toLowerCase() + 's added yet.</div>';
        return;
    }

    grid.innerHTML = items.map(function(p) {
        var preview;

        if (cat === 'Website' && p.live_url) {
            // iframe scaled: 240px tall card / 800px iframe height = 0.30 scale
            // scaled width = 1280 × 0.30 = 384px — fills 380px min-width card
            preview = '<div class="iframe-wrap">'
                + '<iframe src="' + escHtml(p.live_url) + '" '
                + 'scrolling="no" tabindex="-1" aria-hidden="true" '
                + 'sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>'
                + '</div>';
        } else if (p.thumbnail_url) {
            preview = '<img src="' + escHtml(p.thumbnail_url) + '" alt="' + escHtml(p.title) + '" loading="lazy">';
        } else {
            preview = '<div class="no-thumb">No preview</div>';
        }

        var action = cat === 'Website'
            ? '<a href="' + escHtml(p.live_url) + '" target="_blank" rel="noopener" class="card-action">View Live ↗</a>'
            : '<a href="' + escHtml(p.file_url) + '" download class="card-action">Download ↓</a>';

        return '<div class="project-card">'
            + '<div class="card-thumb">'
            +   preview
            +   '<div class="card-overlay">' + action + '</div>'
            + '</div>'
            + '<div class="card-body">'
            +   '<div class="card-title">' + escHtml(p.title) + '</div>'
            +   '<div class="card-desc">'  + escHtml(p.description || '') + '</div>'
            + '</div>'
            + '</div>';
    }).join('');
}

// ── DOM READY ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

    // Particles
    var canvas = document.getElementById('particles');
    var ctx = canvas.getContext('2d');
    var W, H, dots = [];
    function resizeCanvas() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    for (var i = 0; i < 70; i++) {
        dots.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
            r: Math.random()*1.2+0.2, vx: (Math.random()-0.5)*0.12, vy: (Math.random()-0.5)*0.12, a: Math.random()*0.3+0.05 });
    }
    function drawDots() {
        ctx.clearRect(0,0,W,H);
        dots.forEach(function(d) {
            d.x+=d.vx; d.y+=d.vy;
            if(d.x<0||d.x>W) d.vx*=-1; if(d.y<0||d.y>H) d.vy*=-1;
            ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
            ctx.fillStyle='rgba(255,255,255,'+d.a+')'; ctx.fill();
        });
        requestAnimationFrame(drawDots);
    }
    drawDots();

    // Nav scroll
    window.addEventListener('scroll', function() {
        var nav = document.getElementById('mainNav');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    // Admin open/close
    var adminPanel   = document.getElementById('adminPanel');
    var adminOverlay = document.getElementById('adminOverlay');
    function openAdmin()  { adminPanel.classList.add('open'); adminOverlay.classList.add('open'); document.body.style.overflow='hidden'; }
    function closeAdmin() { adminPanel.classList.remove('open'); adminOverlay.classList.remove('open'); document.body.style.overflow=''; }

    document.getElementById('adminTriggerBtn').addEventListener('click', openAdmin);
    document.getElementById('adminCloseBtn').addEventListener('click', closeAdmin);
    document.getElementById('adminOverlay').addEventListener('click', closeAdmin);
    document.addEventListener('keydown', function(e) { if(e.key==='Escape') closeAdmin(); });

    var cc=0, ct=null;
    document.getElementById('navLogo').addEventListener('click', function() {
        cc++; clearTimeout(ct); ct=setTimeout(function(){cc=0;},500); if(cc>=3){cc=0;openAdmin();}
    });

    // Auth
    sb.auth.onAuthStateChange(function(_e, session) {
        if (session && session.user) {
            document.getElementById('loginView').style.display = 'none';
            document.getElementById('dashView').style.display  = 'block';
            document.getElementById('userBadge').textContent   = session.user.email;
        } else {
            document.getElementById('loginView').style.display = 'block';
            document.getElementById('dashView').style.display  = 'none';
        }
    });

    document.getElementById('loginBtn').addEventListener('click', async function() {
        var btn=this, errEl=document.getElementById('loginError');
        var email=document.getElementById('loginEmail').value.trim(), pass=document.getElementById('loginPassword').value;
        errEl.classList.remove('show'); btn.textContent='Signing in…'; btn.disabled=true;
        var r = await sb.auth.signInWithPassword({ email:email, password:pass });
        if (r.error) { errEl.textContent=r.error.message; errEl.classList.add('show'); }
        btn.textContent='Sign In'; btn.disabled=false;
    });
    document.getElementById('loginPassword').addEventListener('keydown', function(e){
        if(e.key==='Enter') document.getElementById('loginBtn').click();
    });
    document.getElementById('logoutBtn').addEventListener('click', async function(){
        await sb.auth.signOut();
    });

    // Category toggle
    function updateCategoryFields() {
        var cat = document.getElementById('projCategory').value;
        document.getElementById('websiteInput').style.display = cat === 'Website' ? 'block' : 'none';
        document.getElementById('appFileInput').style.display = cat === 'App'     ? 'block' : 'none';
    }
    document.getElementById('projCategory').addEventListener('change', updateCategoryFields);

    // Submit
    document.getElementById('submitBtn').addEventListener('click', async function() {
        var btn   = this;
        var title = document.getElementById('projTitle').value.trim();
        var desc  = document.getElementById('projDesc').value.trim();
        var cat   = document.getElementById('projCategory').value;

        if (!title) { alert('Please enter a project name.'); return; }
        btn.textContent = 'Uploading…'; btn.disabled = true;

        try {
            if (cat === 'Website') {
                var liveUrl = document.getElementById('projLiveUrl').value.trim();
                if (!liveUrl) { alert('Please enter the live URL.'); return; }

                var ins = await sb.from('projects').insert([{
                    title: title, description: desc, category: 'Website',
                    thumbnail_url: null, live_url: liveUrl
                }]);
                if (ins.error) throw ins.error;
                await loadWebsites();
                filter('Website');

            } else {
                var thumbFile = document.getElementById('thumbInput').files[0];
                var appFile   = document.getElementById('appFileInput_file').files[0];
                if (!thumbFile) { alert('Please select a thumbnail image.'); return; }
                if (!appFile)   { alert('Please select the app file.'); return; }

                var tPath = 'thumbnail/' + title.replace(/\s+/g,'_').toLowerCase() + '.' + thumbFile.name.split('.').pop();
                var tUp = await sb.storage.from('portfolio').upload(tPath, thumbFile, { upsert: true });
                if (tUp.error) throw tUp.error;

                var aPath = 'app/' + title.replace(/\s+/g,'_').toLowerCase() + '.' + appFile.name.split('.').pop();
                var aUp = await sb.storage.from('portfolio').upload(aPath, appFile, { upsert: true });
                if (aUp.error) throw aUp.error;

                await loadApps();
                filter('App');
            }

            alert('Published!');
            document.getElementById('adminForm').reset();
            updateCategoryFields();

        } catch(err) {
            alert('Error: ' + err.message);
        } finally {
            btn.textContent = 'Publish Project'; btn.disabled = false;
        }
    });

    // Init
    Promise.all([loadWebsites(), loadApps()]).then(function() {
        filter('Website');
    });

}); // end DOMContentLoaded
