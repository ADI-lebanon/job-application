// ====== CONFIG ======
const SUPABASE_URL = "https://hofhjeevhbinaszewohl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmhqZWV2aGJpbmFzemV3b2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDg1NjIsImV4cCI6MjA4NTMyNDU2Mn0.R_1rMuB8jV2OSeE9fomCKLJBfejuxSS4Gsi6MtKxeL8";

// Buckets created in Supabase Storage
const BUCKET_PHOTOS = "applicant-photos";
const BUCKET_CVS = "applicant-cvs";

// File limits
const MAX_PHOTO_MB = 5;
const MAX_CV_MB = 10;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== DOM ======
const form = document.getElementById("applicationForm");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

const hasHealthIssuesEl = document.getElementById("hasHealthIssues");
const healthDetailsWrap = document.getElementById("healthDetailsWrap");
const healthDetailsEl = document.getElementById("healthDetails");
const langToggle = document.getElementById("langToggle");

// ====== i18n ======
const translations = {
  en: {
    title: "Job Application Form",
    intro: 'Please fill in your information. Fields marked <span class="req">*</span> are required.',
    photo: 'Personal Photo <span class="req">*</span>',
    photo_hint: "JPG/PNG/WebP, up to 5MB",

    fullName: 'Full Name <span class="req">*</span>',
    nationality: 'Nationality <span class="req">*</span>',
    dob: "Date of Birth",
    city: "Residential City",
    phone: 'Phone Number <span class="req">*</span>',
    position: 'Position Applied To <span class="req">*</span>',
    educationLevel: "Educational Level",
    major: "Major / Field of Study",
    experienceYears: "Experience (Years)",
    lastCompany: "Most Recent Company",
    previousPosition: "Previous Position",
    previousSalary: "Previous Salary (optional)",
    salary_hint: "If you don’t want to share, leave it empty.",
    workingHours: "Working Hours Preference",
    reasonLeaving: "Reason for Leaving Previous Work",
    smoker: "Smoker?",
    relatives: "Do you have relatives in the company?",
    drivingLicense: "Do you have a driving license?",
    nightShift: "Are you flexible to work day and night shifts?",
    message: "Message",
    healthIssues: "Do you have health issues that affect work?",
    healthDetails: "If yes, what is it?",
    health_hint: "Only share what’s necessary for work accommodations.",
    cv: "CV Upload",
    cv_hint: "PDF/DOC/DOCX, up to 10MB",
    consent:
      'I consent to the company collecting and reviewing my submitted information for recruitment purposes. <span class="req">*</span>',
    footer: "Tip: Don’t submit passwords or banking details. This form is only for recruitment.",

    submit_btn: "Submit Application",

    phone_placeholder: "+961 ...",
    salary_placeholder: "e.g. 800",
    message_placeholder: "Anything you want us to know…",

    // status
    err_photo_required: "Personal photo is required.",
    status_uploading: "Uploading files…",
    status_submitting: "Submitting application…",
    status_success: "Submitted successfully. Thank you!",
    err_fullname: "Full name is required.",
    err_nationality:"Nationality is required.",
    err_phone: "Phone number is required.",
    err_position: "Position applied to is required.",
    err_consent: "Consent is required.",
    err_photo_big: (mb) => `Photo is too large. Max ${mb}MB.`,
    err_cv_big: (mb) => `CV file is too large. Max ${mb}MB.`,
    err_generic: "Something went wrong.",
  },

  ar: {
    title: "نموذج التقديم للوظيفة",
    intro: 'يرجى تعبئة المعلومات. الحقول التي تحتوي على <span class="req">*</span> مطلوبة.',
    photo: 'صورة شخصية <span class="req">*</span>',
    photo_hint: "JPG/PNG/WebP — الحد الأقصى 5MB",

    fullName: 'الاسم الكامل <span class="req">*</span>',
    nationality: 'الجنسية<span class="req">*</span>',
    dob: "تاريخ الميلاد",
    city: "مدينة السكن",
    phone: 'رقم الهاتف <span class="req">*</span>',
    position: 'الوظيفة المتقدم لها <span class="req">*</span>',
    educationLevel: "المستوى التعليمي",
    major: "التخصص",
    experienceYears: "سنوات الخبرة",
    lastCompany: "آخر شركة",
    previousPosition: "الوظيفة السابقة",
    previousSalary: "الراتب السابق (اختياري)",
    salary_hint: "إذا لا تريد المشاركة، اتركه فارغًا.",
    workingHours: "تفضيل ساعات العمل",
    reasonLeaving: "سبب ترك العمل السابق",
    smoker: "هل أنت مدخن؟",
    relatives: "هل لديك أقارب في الشركة؟",
    drivingLicense: "هل لديك رخصة قيادة؟",
    nightShift: "هل يمكنك العمل في مناوبة صباحية وليلية؟",
    message: "رسالة",
    healthIssues: "هل لديك مشاكل صحية تؤثر على العمل؟",
    healthDetails: "إذا نعم، ما هي؟",
    health_hint: "شارك فقط ما يلزم لتسهيلات العمل.",
    cv: "رفع السيرة الذاتية",
    cv_hint: "PDF/DOC/DOCX — الحد الأقصى 10MB",
    consent:
      'أوافق على أن تقوم الشركة بجمع ومراجعة المعلومات المقدمة لأغراض التوظيف. <span class="req">*</span>',
    footer: "ملاحظة: لا ترسل كلمات مرور أو معلومات بنكية. هذا النموذج للتوظيف فقط.",

    submit_btn: "إرسال الطلب",

    phone_placeholder: "مثال: +961 ...",
    salary_placeholder: "مثال: 800",
    message_placeholder: "أي معلومات إضافية…",

    // status
    err_photo_required: "الصورة الشخصية مطلوبة.",
    status_uploading: "جارٍ رفع الملفات…",
    status_submitting: "جارٍ إرسال الطلب…",
    status_success: "تم الإرسال بنجاح. شكرًا لك!",
    err_fullname: "الاسم الكامل مطلوب.",
    err_nationality:"الجنسية مطلوبة",
    err_phone: "رقم الهاتف مطلوب.",
    err_position: "الوظيفة المتقدم لها مطلوبة.",
    err_consent: "يجب الموافقة على الإقرار.",
    err_photo_big: (mb) => `حجم الصورة كبير. الحد الأقصى ${mb}MB.`,
    err_cv_big: (mb) => `حجم السيرة الذاتية كبير. الحد الأقصى ${mb}MB.`,
    err_generic: "حدث خطأ ما.",
  },
};

function getLang() {
  return localStorage.getItem("lang") || "en";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyLang(lang);
}

function applyLang(lang) {
  const t = translations[lang] || translations.en;

  document.documentElement.lang = lang === "ar" ? "ar" : "en";
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  // Labels / texts by id (innerHTML because some strings include <span class="req">)
  const htmlMap = [
    ["t_title", "title"],
    ["t_intro", "intro"],
    ["t_photo", "photo"],
    ["t_photo_hint", "photo_hint"],
    ["t_fullName", "fullName"],
    ["t_nationality", "nationality"],
    ["t_dob", "dob"],
    ["t_city", "city"],
    ["t_phone", "phone"],
    ["t_position", "position"],
    ["t_educationLevel", "educationLevel"],
    ["t_major", "major"],
    ["t_experienceYears", "experienceYears"],
    ["t_lastCompany", "lastCompany"],
    ["t_previousPosition", "previousPosition"],
    ["t_previousSalary", "previousSalary"],
    ["t_salary_hint", "salary_hint"],
    ["t_workingHours", "workingHours"],
    ["t_reasonLeaving", "reasonLeaving"],
    ["t_smoker", "smoker"],
    ["t_relatives", "relatives"],
    ["t_drivingLicense", "drivingLicense"],
    ["t_nightShift", "nightShift"],
    ["t_message", "message"],
    ["t_healthIssues", "healthIssues"],
    ["t_healthDetails", "healthDetails"],
    ["t_health_hint", "health_hint"],
    ["t_cv", "cv"],
    ["t_cv_hint", "cv_hint"],
    ["t_consent", "consent"],
    ["t_footer", "footer"],
  ];

  for (const [id, key] of htmlMap) {
    const el = document.getElementById(id);
    if (el && t[key]) {
      // checkbox labels contain input elements: we should keep input and only change text.
      // Our checkbox labels have id on <label>, and their HTML currently includes the input.
      // If we overwrite innerHTML, we would delete the input. So for those, handle separately below.
      if (["t_smoker", "t_relatives", "t_drivingLicense", "t_nightShift", "t_healthIssues", "t_consent"].includes(id)) {
        continue;
      }
      el.innerHTML = t[key];
    }
  }

  // Checkbox labels: update only the text node after the input
  const checkboxIds = [
    ["t_smoker", "smoker"],
    ["t_relatives", "relatives"],
    ["t_drivingLicense", "drivingLicense"],
    ["t_nightShift", "nightShift"],
    ["t_healthIssues", "healthIssues"],
    ["t_consent", "consent"],
  ];

  for (const [labelId, key] of checkboxIds) {
    const label = document.getElementById(labelId);
    if (!label || !t[key]) continue;

    // Keep first child input intact, rebuild remaining contents safely.
    const input = label.querySelector("input");
    if (!input) continue;

    // Remove everything except input
    label.innerHTML = "";
    label.appendChild(input);

    // Add translated text (as HTML for consent which includes <span>)
    const span = document.createElement("span");
    span.innerHTML = " " + t[key];
    label.appendChild(span);
  }

  // data-t text nodes (button etc.)
  document.querySelectorAll("[data-t]").forEach((el) => {
    const key = el.getAttribute("data-t");
    if (t[key]) el.textContent = t[key];
  });

  // placeholders
  document.querySelectorAll("[data-t-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-t-placeholder");
    if (t[key]) el.setAttribute("placeholder", t[key]);
  });

  // Translate select options (education + working hours)
  const edu = document.getElementById("educationLevel");
  if (edu) {
    const eduMap = {
      en: { select: "Select…", hs: "High School", tv: "Technical / Vocational", ad: "Associate Degree", ba: "Bachelor’s", ma: "Master’s", phd: "PhD", other: "Other" },
      ar: { select: "اختر…", hs: "ثانوي", tv: "تقني / مهني", ad: "دبلوم", ba: "إجازة / بكالوريوس", ma: "ماجستير", phd: "دكتوراه", other: "أخرى" },
    };
    edu.querySelectorAll("option").forEach((opt) => {
      const k = opt.getAttribute("data-opt-key");
      if (!k) return;
      opt.textContent = (eduMap[lang] && eduMap[lang][k]) ? eduMap[lang][k] : opt.textContent;
    });
  }

  const wh = document.getElementById("workingHours");
  if (wh) {
    const whMap = {
      en: { select: "Select…", full: "Full-time", part: "Part-time", flex: "Flexible" },
      ar: { select: "اختر…", full: "دوام كامل", part: "دوام جزئي", flex: "مرن" },
    };
    wh.querySelectorAll("option").forEach((opt) => {
      const k = opt.getAttribute("data-wh-key");
      if (!k) return;
      opt.textContent = (whMap[lang] && whMap[lang][k]) ? whMap[lang][k] : opt.textContent;
    });
  }

  // Toggle button label
  if (langToggle) {
    langToggle.textContent = lang === "ar" ? "English" : "العربية";
    langToggle.setAttribute("aria-pressed", lang === "ar" ? "true" : "false");
  }
}

// init language
applyLang(getLang());

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const current = getLang();
    setLang(current === "en" ? "ar" : "en");
  });
}

// ====== UI behaviors ======
hasHealthIssuesEl.addEventListener("change", () => {
  const on = hasHealthIssuesEl.checked;
  healthDetailsWrap.hidden = !on;
  if (!on) healthDetailsEl.value = "";
});

function setStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`.trim();
}

function bytesFromMB(mb) {
  return mb * 1024 * 1024;
}

function safeFileName(originalName) {
  return originalName.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

async function compressImage(file, {
  maxSize = 1200,     // max width/height in px
  quality = 0.8,      // 0..1
  mimeType = "image/jpeg" // "image/webp" also works in modern browsers
} = {}) {
  if (!file || !file.type.startsWith("image/")) return file;

  // Use createImageBitmap when available (fast)
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;

  // If already small, still compress format/quality
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // Convert canvas to blob
  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mimeType, quality);
  });

  // Fallback: if blob failed, return original
  if (!blob) return file;

  // Give it a clean name
  const newName = file.name.replace(/\.\w+$/, "") + (mimeType === "image/webp" ? ".webp" : ".jpg");

  return new File([blob], newName, { type: mimeType });
}

async function uploadFile(bucket, file, prefix) {
  if (!file) return null;

  const cleaned = safeFileName(file.name);
  const unique = `${prefix}/${crypto.randomUUID()}_${Date.now()}_${cleaned}`;

  const { error } = await sb.storage.from(bucket).upload(unique, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(error.message || "Upload failed");
  return unique;
}

function required(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

// ====== Submit ======
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");
  submitBtn.disabled = true;

  const lang = getLang();
  const t = translations[lang] || translations.en;

  try {
    const full_name = document.getElementById("fullName").value.trim();
    const nationality = document.getElementById("nationality").value.trim() || null;
    const date_of_birth = document.getElementById("dob").value || null;
    const residential_city = document.getElementById("city").value.trim() || null;
    const phone_number = document.getElementById("phone").value.trim();
    const position_applied = document.getElementById("position").value.trim();
    const education_level = document.getElementById("educationLevel").value || null;
    const major = document.getElementById("major").value.trim() || null;

    const experience_years_raw = document.getElementById("experienceYears").value;
    const experience_years = experience_years_raw ? Number(experience_years_raw) : null;

    const last_company = document.getElementById("lastCompany").value.trim() || null;
    const previous_position = document.getElementById("previousPosition").value.trim() || null;

    const previous_salary_raw = document.getElementById("previousSalary").value;
    const previous_salary = previous_salary_raw ? Number(previous_salary_raw) : null;

    const working_hours_preference = document.getElementById("workingHours").value || null;
    const reason_for_leaving = document.getElementById("reasonLeaving").value.trim() || null;

    const smoker = document.getElementById("smoker").checked;
    const has_relatives_in_company = document.getElementById("relatives").checked;
    const has_driving_license = document.getElementById("drivingLicense").checked;
    const can_work_night_shift = document.getElementById("nightShift").checked;

    const message = document.getElementById("message").value.trim() || null;

    const has_health_issues = document.getElementById("hasHealthIssues").checked;
    const health_issues_details = has_health_issues ? (healthDetailsEl.value.trim() || null) : null;

    const consent = document.getElementById("consent").checked;

    if (!required(full_name)) throw new Error(t.err_fullname);
    if (!required(phone_number)) throw new Error(t.err_phone);
    if (!required(position_applied)) throw new Error(t.err_position);
    if (!consent) throw new Error(t.err_consent);
    if (!required(nationality)) throw new Error(t.err_nationality);

    const photoFile = document.getElementById("photo").files[0] || null;
    let photoToUpload = photoFile;

if (photoFile) {
  setStatus("Optimizing photo…");
  photoToUpload = await compressImage(photoFile, {
    maxSize: 1200,
    quality: 0.8,
    mimeType: "image/jpeg",
  });
}

    if (!photoFile) {
  throw new Error(
    (translations[getLang()] || translations.en).err_photo_required ||
    "Personal photo is required."
  );
}

    const cvFile = document.getElementById("cv").files[0] || null;

    if (photoFile && photoFile.size > bytesFromMB(MAX_PHOTO_MB)) {
      throw new Error(typeof t.err_photo_big === "function" ? t.err_photo_big(MAX_PHOTO_MB) : t.err_generic);
    }
    if (cvFile && cvFile.size > bytesFromMB(MAX_CV_MB)) {
      throw new Error(typeof t.err_cv_big === "function" ? t.err_cv_big(MAX_CV_MB) : t.err_generic);
    }

    setStatus(t.status_uploading);
   const photo_path = await uploadFile(BUCKET_PHOTOS, photoToUpload, "photos");
    const cv_path = await uploadFile(BUCKET_CVS, cvFile, "cvs");

    setStatus(t.status_submitting);

    const payload = {
      full_name,
      nationality,
      date_of_birth,
      residential_city,
      phone_number,
      position_applied,
      education_level,
      major,
      experience_years,
      last_company,
      previous_position,
      previous_salary,
      working_hours_preference,
      reason_for_leaving,
      smoker,
      has_relatives_in_company,
      has_driving_license,
      can_work_night_shift,
      message,
      has_health_issues,
      health_issues_details,
      photo_path,
      cv_path,
      consent,
    };

    const { error } = await sb.from("job_applications").insert(payload);
    if (error) throw new Error(error.message);

    setStatus(t.status_success, "ok");
    form.reset();
    healthDetailsWrap.hidden = true;
  } catch (err) {
    setStatus(err.message || t.err_generic, "err");
  } finally {
    submitBtn.disabled = false;
  }
});
