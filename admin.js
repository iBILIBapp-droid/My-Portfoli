// ============================================================
//  ADMIN.JS — Admin dashboard with Supabase Auth gate
// ============================================================

const SB_URL = "https://alpvtuximvsrsopsxghq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHZ0dXhpbXZzcnNvcHN4Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzUyNTMsImV4cCI6MjA4NzcxMTI1M30.XvAkTQo0QssHGFO7EWFFu7-wLMwP2t9WRS6fb9Jo37o";
const sb = supabase.createClient(SB_URL, SB_KEY);

// ── AUTH STATE LISTENER ──
sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
        showAdmin(session.user);
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdmin(user) {
    document.getElementById('loginPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('userBadge').textContent = user.email;
}

// ── LOGIN ──
async function doLogin() {
    const btn      = document.getElementById('loginBtn');
    const errEl    = document.getElementById('loginError');
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    errEl.classList.remove('show');
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        errEl.textContent = error.message;
        errEl.classList.add('show');
    }

    btn.textContent = 'Sign In';
    btn.disabled = false;
}

document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
});

// ── LOGOUT ──
async function doLogout() {
    await sb.auth.signOut();
}

// ── FORM TOGGLE ──
function toggleInputs() {
    const cat = document.getElementById('category').value;
    document.getElementById('websiteInput').classList.toggle('hidden', cat !== 'Website');
    document.getElementById('appThumbInput').classList.toggle('hidden', cat !== 'App');
    document.getElementById('appFileInput').classList.toggle('hidden', cat !== 'App');
}

// ── FORM SUBMIT ──
document.getElementById('adminForm').onsubmit = async (e) => {
    e.preventDefault();

    const btn   = document.getElementById('submitBtn');
    const title = document.getElementById('title').value.trim();
    const cat   = document.getElementById('category').value;

    if (!title) { alert('Please enter a project title.'); return; }

    btn.textContent = 'Uploading…';
    btn.disabled = true;

    try {
        if (cat === 'Website') {
            const liveUrl = document.getElementById('liveUrl').value.trim();
            if (!liveUrl) throw new Error("Please enter the live URL.");

            const { error: dbErr } = await sb.from('projects').insert([{
                title,
                category:      'Website',
                description:   document.getElementById('desc').value,
                thumbnail_url: null,
                live_url:      liveUrl,
                file_url:      null
            }]);
            if (dbErr) throw dbErr;

        } else {
            const thumbFile = document.getElementById('thumbInput').files[0];
            const appFile   = document.getElementById('fileInput').files[0];

            if (!thumbFile) throw new Error("Please select a thumbnail image.");
            if (!appFile)   throw new Error("Please select an app file.");

            const tPath = `thumbs/${Date.now()}_${thumbFile.name}`;
            const { error: tErr } = await sb.storage.from('portfolio').upload(tPath, thumbFile);
            if (tErr) throw tErr;
            const thumbUrl = sb.storage.from('portfolio').getPublicUrl(tPath).data.publicUrl;

            const fPath = `files/${Date.now()}_${appFile.name}`;
            const { error: fErr } = await sb.storage.from('portfolio').upload(fPath, appFile);
            if (fErr) throw fErr;
            const fUrl = sb.storage.from('portfolio').getPublicUrl(fPath).data.publicUrl;

            const { error: dbErr } = await sb.from('projects').insert([{
                title,
                category:      'App',
                description:   document.getElementById('desc').value,
                thumbnail_url: thumbUrl,
                live_url:      null,
                file_url:      fUrl
            }]);
            if (dbErr) throw dbErr;
        }

        alert("Project published successfully!");
        document.getElementById('adminForm').reset();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.textContent = 'Publish Project';
        btn.disabled = false;
    }
};
