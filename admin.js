console.log("ADMIN JS LOADED", new Date().toISOString());

// ====== CONFIG ======
const SUPABASE_URL = "https://hofhjeevhbinaszewohl.supabase.co";
const SUPABASE_ANON_KEY = "PUT_YOUR_SUPABASE_ANON_KEY_HERE";

const BUCKET_PHOTOS = "applicant-photos";
const BUCKET_CVS = "applicant-cvs";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

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
const resetLoginBtn = document.getElementById("resetLoginBtn");

// Details modal
const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsSub = document.getElementById("detailsSub");
const detailsBody = document.getElementById("detailsBody");

const photoPreview = document.getElementById("photoPreview");
const downloadPhotoBtn = document.getElementById("downloadPhotoBtn");
const downloadCvBtn = document.getElementById("downloadCvBtn");

let cachedRows = new Map(); // id -> full row

// ====== Helpers ======
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
  if (v === true || v === "yes") return "Yes";
  if (v === false || v === "no") return "No";
  return "—";
}

function fmtValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return fmtBool(v);
  if (v === "yes" || v === "no") return fmtBool(v);
  return String(v);
}

function prettyLabel(key) {
  const labels = {
    full_name: "Full name",
    phone_number: "Phone number",
    position: "Position",
    position_applied: "Position applied",
    experience_in_field: "Experience in our field",
    experience_field_details: "Experience details",
    can_work_day_night: "Can work day/night",
    retail_experience: "Retail experience",
    customer_reaction: "Customer handling answer",
    nationality: "Nationality",
    date_of_birth: "Date of birth",
    residential_city: "Residential city",
    education_level: "Education level",
    major: "Major",
    experience_years: "Experience years",
    last_company: "Last company",
    previous_position: "Previous position",
    previous_salary: "Previous salary",
    working_hours_preference: "Working hours preference",
    reason_for_leaving: "Reason for leaving",
    smoker: "Smoker",
    has_relatives_in_company: "Has relatives in company",
    has_driving_license: "Has driving license",
    can_work_night_shift: "Can work night shift",
    has_health_issues: "Has health issues",
    health_issues_details: "Health issues details",
    message: "Message",
    consent: "Consent",
    created_at: "Created at",
    updated_at: "Updated at"
  };

  return labels[key] || key.replaceAll("_", " ");
}

function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}

function showModal() {
  show(detailsModal);
}

function closeModal() {
  hide(detailsModal);
}

function closeDetails() {
  closeModal();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetails();
});

document.addEventListener("click", (e) => {
  if (e.target?.getAttribute("data-close") === "details") closeDetails();
});

function setFileButtonsNone() {
  photoPreview.src = "";
  hide(photoPreview);

  [downloadPhotoBtn, downloadCvBtn].forEach((a) => {
    a.href = "#";
    hide(a);
    a.removeAttribute("download");
  });
}

// ====== Auth / admin check ======
async function isAdmin(userId) {
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
    const positionValue = row.position || row.position_applied || "";

    tr.innerHTML = `
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(row.full_name || "")}</td>
      <td>${escapeHtml(positionValue)}</td>
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

async function openDetails(row) {
  const positionValue = row.position || row.position_applied || "—";

  detailsTitle.textContent = row.full_name || "Application";
  detailsSub.textContent = `${row.created_at ? new Date(row.created_at).toLocaleString() : ""}${positionValue !== "—" ? " • " + positionValue : ""}`;

  const exclude = new Set([
    "id",
    "photo_path",
    "cv_path",
    "created_at",
    "updated_at"
  ]);

  const entries = Object.entries(row).filter(([k]) => !exclude.has(k));

  const priority = [
    "full_name",
    "phone_number",
    "position",
    "position_applied",
    "experience_in_field",
    "experience_field_details",
    "can_work_day_night",
    "retail_experience",
    "customer_reaction",
    "nationality",
    "date_of_birth",
    "residential_city",
    "education_level",
    "major",
    "experience_years",
    "last_company",
    "previous_position",
    "previous_salary",
    "working_hours_preference",
    "reason_for_leaving",
    "smoker",
    "has_relatives_in_company",
    "has_driving_license",
    "can_work_night_shift",
    "has_health_issues",
    "health_issues_details",
    "message",
    "consent"
  ];

  const byKey = new Map(entries);
  const ordered = [];

  for (const k of priority) {
    if (byKey.has(k)) {
      ordered.push([k, byKey.get(k)]);
    }
  }

  for (const [k, v] of entries) {
    if (!priority.includes(k)) {
      ordered.push([k, v]);
    }
  }

  detailsBody.innerHTML = ordered
    .map(([k, v]) => {
      return `
        <div class="kv">
          <strong>${escapeHtml(prettyLabel(k))}</strong>
          <div>${escapeHtml(fmtValue(v))}</div>
        </div>
      `;
    })
    .join("");

  setFileButtonsNone();

  if (row.photo_path) {
    const photoUrl = await signedUrl(BUCKET_PHOTOS, row.photo_path, 180);

    photoPreview.src = photoUrl;
    show(photoPreview);

    downloadPhotoBtn.href = photoUrl;
    downloadPhotoBtn.setAttribute("download", "photo");
    show(downloadPhotoBtn);
  }

  if (row.cv_path) {
    const cvUrl = await signedUrl(BUCKET_CVS, row.cv_path, 180);

    downloadCvBtn.href = cvUrl;
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
let slowTimer = null;

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus(loginStatus, "Signing in…");
  loginBtn.disabled = true;

  slowTimer = setTimeout(() => {
    setStatus(loginStatus, "Still signing in… Click Reset if it doesn’t finish.", "err");
  }, 8000);

  try {
    const email = emailEl.value.trim();
    const password = passEl.value;

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    clearTimeout(slowTimer);
    setStatus(loginStatus, "Signed in. Loading…");

    await showAdminUI(data.session);
    setStatus(loginStatus, "", "ok");
  } catch (err) {
    clearTimeout(slowTimer);
    setStatus(loginStatus, err.message || "Login failed", "err");
  } finally {
    loginBtn.disabled = false;
  }
});

resetLoginBtn.addEventListener("click", async () => {
  try { await sb.auth.signOut(); } catch {}
  try { sessionStorage.clear(); } catch {}
  location.reload();
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
