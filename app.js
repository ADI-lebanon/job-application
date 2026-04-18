// ====== CONFIG ======
const SUPABASE_URL = "https://hofhjeevhbinaszewohl.supabase.co";
const SUPABASE_ANON_KEY = "PUT_YOUR_SUPABASE_ANON_KEY_HERE";

const BUCKET_PHOTOS = "applicant-photos";
const MAX_PHOTO_MB = 5;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== DOM ======
const form = document.getElementById("applicationForm");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");
const langToggle = document.getElementById("langToggle");

// ====== i18n ======
const translations = {
  en: {
    title: "Job Application Form",
    intro: 'Please fill in your information. Fields marked <span class="req">*</span> are required.',
    photo: 'Add an ADI image <span class="req">*</span>',
    photo_hint: "JPG/PNG/WebP, up to 5MB",

    fullName: 'Full Name <span class="req">*</span>',
    phone: 'Phone Number <span class="req">*</span>',
    experienceField: 'Do you have experience in our field? <span class="req">*</span>',
    shiftAbility: 'Can you work day and night shifts? <span class="req">*</span>',
    experienceFieldDetails: 'If yes, what is this experience?',
    retailExperience: 'Do you have experience in retail? <span class="req">*</span>',
    customerReaction: 'What do you do if a customer gets upset? <span class="req">*</span>',

    consent:
      'I consent to the company collecting and reviewing my submitted information for recruitment purposes. <span class="req">*</span>',
    footer: "Tip: Don’t submit passwords or banking details. This form is only for recruitment.",
    submit_btn: "Submit Application",

    yes: "Yes",
    no: "No",
    select: "Select…",

    phone_placeholder: "+961 ...",
    experience_placeholder: "Write your experience here...",
    customer_placeholder: "Write your answer here...",

    err_photo_required: "ADI image is required.",
    status_optimizing: "Optimizing image...",
    status_uploading: "Uploading image...",
    status_submitting: "Submitting application...",
    status_success: "Submitted successfully. Thank you!",

    err_fullname: "Full name is required.",
    err_phone: "Phone number is required.",
    err_experienceField: "Please choose whether you have experience in our field.",
    err_shiftAbility: "Please choose whether you can work day and night shifts.",
    err_retailExperience: "Please choose whether you have retail experience.",
    err_customerReaction: "Please answer the customer question.",
    err_consent: "Consent is required.",
    err_photo_big: (mb) => `Image is too large. Max ${mb}MB.`,
    err_generic: "Something went wrong."
  },

  ar: {
    title: "نموذج التقديم للوظيفة",
    intro: 'يرجى تعبئة المعلومات. الحقول التي تحتوي على <span class="req">*</span> مطلوبة.',
    photo: 'ارفع صورة لل ADI <span class="req">*</span>',
    photo_hint: "JPG/PNG/WebP — الحد الأقصى 5MB",

    fullName: 'الاسم بالكامل <span class="req">*</span>',
    phone: 'رقم الهاتف <span class="req">*</span>',
    experienceField: 'هل لديك خبرة في مجال عملنا؟ <span class="req">*</span>',
    shiftAbility: 'هل تستطيع العمل في نظام مسائي ونهاري؟ <span class="req">*</span>',
    experienceFieldDetails: 'إذا نعم، ما هي هذه الخبرة؟',
    retailExperience: 'هل لديك خبره في ريتال؟ <span class="req">*</span>',
    customerReaction: 'ماذا تفعل في حال زبون قد زعل؟ <span class="req">*</span>',

    consent:
      'أوافق على أن تقوم الشركة بجمع ومراجعة المعلومات المقدمة لأغراض التوظيف. <span class="req">*</span>',
    footer: "ملاحظة: لا ترسل كلمات مرور أو معلومات بنكية. هذا النموذج للتوظيف فقط.",
    submit_btn: "إرسال الطلب",

    yes: "نعم",
    no: "لا",
    select: "اختر…",

    phone_placeholder: "مثال: +961 ...",
    experience_placeholder: "اكتب خبرتك هنا...",
    customer_placeholder: "اكتب إجابتك هنا...",

    err_photo_required: "صورة ADI مطلوبة.",
    status_optimizing: "جارٍ تحسين الصورة...",
    status_uploading: "جارٍ رفع الصورة...",
    status_submitting: "جارٍ إرسال الطلب...",
    status_success: "تم الإرسال بنجاح. شكرًا لك!",

    err_fullname: "الاسم بالكامل مطلوب.",
    err_phone: "رقم الهاتف مطلوب.",
    err_experienceField: "يرجى اختيار ما إذا كان لديك خبرة في مجال عملنا.",
    err_shiftAbility: "يرجى اختيار ما إذا كنت تستطيع العمل مسائي ونهاري.",
    err_retailExperience: "يرجى اختيار ما إذا كان لديك خبرة في ريتال.",
    err_customerReaction: "يرجى الإجابة على سؤال الزبون.",
    err_consent: "يجب الموافقة على الإقرار.",
    err_photo_big: (mb) => `حجم الصورة كبير. الحد الأقصى ${mb}MB.`,
    err_generic: "حدث خطأ ما."
  }
};

function getLang() {
  return localStorage.getItem("lang") || "ar";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyLang(lang);
}

function applyLang(lang) {
  const t = translations[lang] || translations.en;

  document.documentElement.lang = lang === "ar" ? "ar" : "en";
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  const htmlMap = [
    ["t_title", "title"],
    ["t_intro", "intro"],
    ["t_photo", "photo"],
    ["t_photo_hint", "photo_hint"],
    ["t_fullName", "fullName"],
    ["t_phone", "phone"],
    ["t_experienceField", "experienceField"],
    ["t_shiftAbility", "shiftAbility"],
    ["t_experienceFieldDetails", "experienceFieldDetails"],
    ["t_retailExperience", "retailExperience"],
    ["t_customerReaction", "customerReaction"],
    ["t_footer", "footer"]
  ];

  for (const [id, key] of htmlMap) {
    const el = document.getElementById(id);
    if (el && t[key]) {
      el.innerHTML = t[key];
    }
  }

  const consentLabel = document.getElementById("t_consent");
  if (consentLabel) {
    const input = consentLabel.querySelector("input");
    if (input) {
      consentLabel.innerHTML = "";
      consentLabel.appendChild(input);
      const span = document.createElement("span");
      span.innerHTML = " " + t.consent;
      consentLabel.appendChild(span);
    }
  }

  document.querySelectorAll("[data-t]").forEach((el) => {
    const key = el.getAttribute("data-t");
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll("[data-t-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-t-placeholder");
    if (t[key]) el.setAttribute("placeholder", t[key]);
  });

  ["experienceField", "shiftAbility", "retailExperience"].forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    const opts = select.querySelectorAll("option");
    opts.forEach((opt) => {
      if (opt.value === "") opt.textContent = t.select;
      if (opt.value === "yes") opt.textContent = t.yes;
      if (opt.value === "no") opt.textContent = t.no;
    });
  });

  if (langToggle) {
    langToggle.textContent = lang === "ar" ? "English" : "العربية";
    langToggle.setAttribute("aria-pressed", lang === "ar" ? "true" : "false");
  }
}

applyLang(getLang());

if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLang(getLang() === "en" ? "ar" : "en");
  });
}

// ====== helpers ======
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

function arabicToLatin(str) {
  const map = {
    "ا":"a","أ":"a","إ":"i","آ":"aa","ء":"", "ؤ":"w","ئ":"y",
    "ب":"b","ت":"t","ث":"th","ج":"j","ح":"h","خ":"kh",
    "د":"d","ذ":"dh","ر":"r","ز":"z","س":"s","ش":"sh",
    "ص":"s","ض":"d","ط":"t","ظ":"z","ع":"a","غ":"gh",
    "ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n",
    "ه":"h","ة":"a","و":"w","ي":"y","ى":"a",
    "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"
  };

  const diacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

  return String(str || "")
    .replace(diacritics, "")
    .split("")
    .map(ch => map[ch] ?? ch)
    .join("");
}

function safeNameBase(fullName) {
  const latin = arabicToLatin(fullName);

  const base = latin
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]+/g, "")
    .slice(0, 50);

  return base || "applicant";
}

async function compressImage(file, {
  maxSize = 1200,
  quality = 0.8,
  mimeType = "image/jpeg"
} = {}) {
  if (!file || !file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mimeType, quality);
  });

  if (!blob) return file;

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: mimeType });
}

async function uploadFile(bucket, file, prefix, friendlyBase) {
  if (!file) return null;

  const cleanedOriginal = safeFileName(file.name);
  const ext = cleanedOriginal.includes(".") ? cleanedOriginal.split(".").pop() : "bin";

  const base = safeNameBase(friendlyBase);
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const unique = `${prefix}/${base}_${uniqueId}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(unique, file, {
    upsert: false,
    contentType: file.type || undefined
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return unique;
}

function required(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

// ====== submit ======
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");
  submitBtn.disabled = true;

  const lang = getLang();
  const t = translations[lang] || translations.en;

  try {
    const full_name = document.getElementById("fullName").value.trim();
    const phone_number = document.getElementById("phone").value.trim();
    const experience_in_field = document.getElementById("experienceField").value;
    const experience_field_details =
      document.getElementById("experienceFieldDetails").value.trim() || null;
    const can_work_day_night = document.getElementById("shiftAbility").value;
    const retail_experience = document.getElementById("retailExperience").value;
    const customer_reaction = document.getElementById("customerReaction").value.trim();
    const consent = document.getElementById("consent").checked;

    if (!required(full_name)) throw new Error(t.err_fullname);
    if (!required(phone_number)) throw new Error(t.err_phone);
    if (!required(experience_in_field)) throw new Error(t.err_experienceField);
    if (!required(can_work_day_night)) throw new Error(t.err_shiftAbility);
    if (!required(retail_experience)) throw new Error(t.err_retailExperience);
    if (!required(customer_reaction)) throw new Error(t.err_customerReaction);
    if (!consent) throw new Error(t.err_consent);

    const photoFile = document.getElementById("photo").files[0] || null;
    if (!photoFile) throw new Error(t.err_photo_required);

    if (photoFile.size > bytesFromMB(MAX_PHOTO_MB)) {
      throw new Error(
        typeof t.err_photo_big === "function"
          ? t.err_photo_big(MAX_PHOTO_MB)
          : t.err_generic
      );
    }

    setStatus(t.status_optimizing);
    const photoToUpload = await compressImage(photoFile, {
      maxSize: 1200,
      quality: 0.8,
      mimeType: "image/jpeg"
    });

    setStatus(t.status_uploading);
    const photo_path = await uploadFile(BUCKET_PHOTOS, photoToUpload, "photos", full_name);

    setStatus(t.status_submitting);

    const payload = {
      full_name,
      phone_number,
      experience_in_field,
      experience_field_details,
      can_work_day_night,
      retail_experience,
      customer_reaction,
      photo_path,
      consent
    };

    const { error } = await sb.from("job_applications").insert(payload);
    if (error) throw new Error(error.message);

    setStatus(t.status_success, "ok");
    form.reset();
  } catch (err) {
    setStatus(err.message || t.err_generic, "err");
  } finally {
    submitBtn.disabled = false;
  }
});
