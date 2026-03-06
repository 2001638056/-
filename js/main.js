// ====== سنة الفوتر ======
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ====== قائمة الجوال ======
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// ====== تخزين ======
const STORAGE_KEY = "lh_requests_v2";
const SELECTED_PKG_KEY = "lh_selected_package";

function loadRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRequests(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function packageLabel(value) {
  const map = {
    premium: "الحزمة المميزة",
    classic: "الحزمة الكلاسيكية",
    day: "حزمة اليوم",
    custom: "حزمة مخصصة"
  };
  return map[value] || "غير محدد";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRequests() {
  const box = document.getElementById("savedRequests");
  if (!box) return;

  const requests = loadRequests();

  if (requests.length === 0) {
    box.innerHTML = `<p class="small">لا يوجد طلبات محفوظة بعد.</p>`;
    return;
  }

  box.innerHTML = requests
    .slice()
    .reverse()
    .map((r) => {
      const when = new Date(r.createdAt).toLocaleString("ar");
      return `
        <div class="card" style="margin-top:10px">
          <h4 style="margin:0 0 6px 0">طلب: ${escapeHtml(packageLabel(r.package))}</h4>
          <p class="small" style="margin:0 0 6px 0"><strong>الاسم:</strong> ${escapeHtml(r.name)} — <strong>البريد:</strong> ${escapeHtml(r.email)}</p>
          <p class="small" style="margin:0 0 6px 0"><strong>التاريخ:</strong> ${escapeHtml(when)}</p>
          <p style="margin:0"><strong>الرسالة:</strong> ${escapeHtml(r.message)}</p>
        </div>
      `;
    })
    .join("");
}

// ====== نموذج التواصل ======
const form = document.getElementById("contactForm");

if (form) {
  const successMsg = document.getElementById("successMessage");
  const clearBtn = document.getElementById("clearRequestsBtn");
  const pkgSelect = document.getElementById("package");

  // تعبئة اختيار الحزمة إذا جاء من صفحة الحزم
  const savedPkg = localStorage.getItem(SELECTED_PKG_KEY);
  if (pkgSelect && savedPkg) {
    pkgSelect.value = savedPkg;
  }

  renderRequests();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const pkgEl = document.getElementById("package");
    const msgEl = document.getElementById("message");

    const name = nameEl?.value.trim() || "";
    const email = emailEl?.value.trim() || "";
    const pkg = pkgEl?.value || "custom";
    const message = msgEl?.value.trim() || "";

    if (!name) {
      alert("الرجاء إدخال الاسم.");
      return;
    }

    if (!email) {
      alert("الرجاء إدخال البريد الإلكتروني.");
      return;
    }

    if (!message) {
      alert("الرجاء كتابة الرسالة.");
      return;
    }

    // حفظ الطلب محليًا
    const requests = loadRequests();
    requests.push({
      name,
      email,
      package: pkg,
      message,
      createdAt: new Date().toISOString()
    });
    saveRequests(requests);

    renderRequests();

    // إرسال الطلب إلى Formspree
    try {
      const formData = new FormData(form);

      // إضافة نص واضح لاسم الحزمة في الإيميل
      formData.set("package", packageLabel(pkg));

      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        if (successMsg) {
          successMsg.style.display = "block";
          successMsg.textContent = `تم إرسال طلبك بنجاح وسيصلك رد قريبًا ✅`;
        }

        localStorage.removeItem(SELECTED_PKG_KEY);
        form.reset();
      } else {
        if (successMsg) {
          successMsg.style.display = "block";
          successMsg.textContent = "تم حفظ الطلب على هذا الجهاز، لكن حدثت مشكلة في إرسال الإيميل.";
        }
      }
    } catch (error) {
      if (successMsg) {
        successMsg.style.display = "block";
        successMsg.textContent = "تم حفظ الطلب على هذا الجهاز، لكن تعذر إرسال الإيميل حاليًا.";
      }
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const ok = confirm("هل تريد مسح كل الطلبات المحفوظة على هذا الجهاز؟");
      if (!ok) return;

      localStorage.removeItem(STORAGE_KEY);
      renderRequests();

      if (successMsg) {
        successMsg.style.display = "block";
        successMsg.textContent = "تم مسح كل الطلبات المحفوظة ✅";
      }
    });
  }
}

// ====== تفاعل صفحة الحزم + زر طلب الحزمة ======
const pkgButtons = document.querySelectorAll(".pkg-btn");

if (pkgButtons.length) {
  const titleEl = document.getElementById("pkgTitle");
  const imgEl = document.getElementById("pkgImg");
  const descEl = document.getElementById("pkgDesc");
  const requestBtn = document.getElementById("requestPkgBtn");

  let currentPkg = "";

  pkgButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      pkgButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const title = btn.dataset.title || "";
      const img = btn.dataset.img || "";
      const desc = btn.dataset.desc || "";
      const key = btn.dataset.key || "";

      currentPkg = key;

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;

      if (imgEl) {
        imgEl.src = img;
        imgEl.style.display = "block";
        imgEl.alt = `صورة توضيحية لـ ${title}`;
      }

      if (requestBtn) {
        requestBtn.style.display = "inline-flex";
      }
    });
  });

  if (requestBtn) {
    requestBtn.addEventListener("click", () => {
      localStorage.setItem(SELECTED_PKG_KEY, currentPkg);
      window.location.href = "contact.html";
    });
  }
}
