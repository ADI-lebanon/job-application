console.log("ADMIN JS LOADED", new Date().toISOString());
// ====== CONFIG ======
const SUPABASE_URL = "https://hofhjeevhbinaszewohl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmhqZWV2aGJpbmFzemV3b2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDg1NjIsImV4cCI6MjA4NTMyNDU2Mn0.R_1rMuB8jV2OSeE9fomCKLJBfejuxSS4Gsi6MtKxeL8"; // must be anon public key (often starts with eyJ...)

const BUCKET_PHOTOS = "applicant-photos";
const BUCKET_CVS = "applicant-cvs";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== DOM ======
const loginCard = document.getElementById("loginCard");
const adminApp = document.getElementById("adminApp");

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginStatus = document.getElementById("loginStatus");

const whoami = document.getElementById("whoami");
const countPill = document.getElementById("countPill");
const adminStatus = document.getElementById("adminStatus");
const appsBody = document.getElementById("appsBody");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Details modal
const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsSub = document.getElementById("detailsSub");
const detailsBody = document.getElementById("detailsBody");

const photoPreview = document.getElementById("photoPreview");
const downloadPhotoBtn = document.getElementById("downloadPhotoBtn");
const downloadCvBtn = document.getElementById("downloadCvBtn");

let cachedRows = new Map(); // id -> full row

function setStatus(el, msg, type = "") {
  el.textContent = msg;
  el.className = `status ${type}`.trim();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtBool(v) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

function fmtValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return fmtBool(v);
  return String(v);
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function showModal() { show(detailsModal); }
function closeModal() { hide(detailsModal); }

document.addEventListener("click", (e) => {
  if (e.target?.getAttribute("data-close") === "details") closeModal();
});

// ====== Auth / admin check ======
async function isAdmin(userId) {
  // IMPORTANT: admin_users RLS should allow selecting your own row only
  const { data, error } = await sb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function showAdminUI(session) {
  const user = session.user;
  whoami.textContent = `Signed in: ${user.email || user.id}`;

  const ok = await isAdmin(user.id);
  if (!ok) {
    await sb.auth.signOut();
    throw new Error("Not authorized.");
  }

  hide(loginCard);
  show(adminApp);

  await loadApplications();
}

// ====== Data ======
async function loadApplications() {
  setStatus(adminStatus, "Loading applications…");
  appsBody.innerHTML = "";

  // Select ALL columns so details view can show everything.
  // (If you have a lot of rows, this is still fine for HR scale.)
  const { data, error } = await sb
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);

  cachedRows = new Map(data.map((r) => [String(r.id), r]));
  countPill.textContent = `${data.length} applications`;

  for (const row of data) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", row.id);

    const date = row.created_at ? new Date(row.created_at).toLocaleString() : "—";
    tr.innerHTML = `
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(row.full_name || "")}</td>
      <td>${escapeHtml(row.position_applied || "")}</td>
    `;
    appsBody.appendChild(tr);
  }

  setStatus(adminStatus, "Loaded.", "ok");
}

// Click a row -> open details
appsBody.addEventListener("click", async (e) => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;

  const id = String(tr.getAttribute("data-id"));
  const row = cachedRows.get(id);
  if (!row) return;

  try {
    setStatus(adminStatus, "Opening application…");
    await openDetails(row);
    setStatus(adminStatus, "Ready.", "ok");
  } catch (err) {
    setStatus(adminStatus, err.message || "Failed to open.", "err");
  }
});

// ====== Files via signed URLs ======
async function signedUrl(bucket, path, seconds = 120) {
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

function setFileButtonsNone() {
  // reset everything so one bad link doesn't break next actions
  photoPreview.src = "";
  hide(photoPreview);

  [downloadPhotoBtn,downloadCvBtn].forEach((a) => {
    a.href = "#";
    hide(a);
    a.removeAttribute("download");
  });
}

async function openDetails(row) {
  detailsTitle.textContent = row.full_name || "Application";
  detailsSub.textContent = row.created_at ? new Date(row.created_at).toLocaleString() : "";

  // Show ALL fields automatically (except big/internal ones if you want)
  // You can exclude columns here:
const exclude = new Set([
  "id",
  "photo_path",
  "cv_path",
  "created_at",
  "updated_at"
]);
  const entries = Object.entries(row).filter(([k]) => !exclude.has(k));

  // Nice ordering: put key fields first, then the rest
  const priority = [
    "full_name","date_of_birth","residential_city","phone_number","position_applied",
    "education_level","major","experience_years",
    "last_company","previous_position","previous_salary","working_hours_preference",
    "reason_for_leaving","smoker","has_relatives_in_company","has_driving_license","can_work_night_shift",
    "has_health_issues","health_issues_details","message",
    "photo_path","cv_path","consent","created_at"
  ];

  const byKey = new Map(entries);
  const ordered = [];
  for (const k of priority) if (byKey.has(k)) ordered.push([k, byKey.get(k)]);
  for (const [k, v] of entries) if (!priority.includes(k)) ordered.push([k, v]);

  detailsBody.innerHTML = ordered
    .map(([k, v]) => `<div class="kv"><strong>${escapeHtml(k)}</strong><div>${escapeHtml(fmtValue(v))}</div></div>`)
    .join("");

  // Files
  setFileButtonsNone();

  // Photo
  if (row.photo_path) {
    const url = await signedUrl(BUCKET_PHOTOS, row.photo_path, 180);

    photoPreview.src = url;
    show(photoPreview);

   
    downloadPhotoBtn.href = url;
    downloadPhotoBtn.setAttribute("download", "photo");

  
    show(downloadPhotoBtn);
  }

  // CV
  if (row.cv_path) {
    const url = await signedUrl(BUCKET_CVS, row.cv_path, 180);

 
    downloadCvBtn.href = url;
    downloadCvBtn.setAttribute("download", "cv");


    show(downloadCvBtn);
  }

  showModal();
}

// ====== Auth state ======
sb.auth.onAuthStateChange(async (_event, session) => {
  try {
    if (session) {
      await showAdminUI(session);
    } else {
      hide(adminApp);
      show(loginCard);
    }
  } catch (e) {
    setStatus(loginStatus, e.message || "Auth error", "err");
    hide(adminApp);
    show(loginCard);
  }
});

// ====== Login ======
function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Login timed out.")), ms)),
  ]);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus(loginStatus, "Signing in…");
  loginBtn.disabled = true;

  // After 10s, show a helpful message, but DO NOT fail the login.
  const t = setTimeout(() => {
    setStatus(loginStatus, "Still signing in… If this keeps spinning, clear site data for this site.", "err");
  }, 10000);

  try {
    const email = emailEl.value.trim();
    const password = passEl.value;

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    clearTimeout(t);
    setStatus(loginStatus, "Signed in. Checking access…");

    await showAdminUI(data.session);
    setStatus(loginStatus, "", "ok");
  } catch (err) {
    clearTimeout(t);
    console.error(err);
    setStatus(loginStatus, err.message || "Login failed", "err");
  } finally {
    loginBtn.disabled = false;
  }
});


// ====== Buttons ======
refreshBtn.addEventListener("click", async () => {
  try {
    await loadApplications();
  } catch (e) {
    setStatus(adminStatus, e.message || "Failed to refresh", "err");
  }
});

logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
});