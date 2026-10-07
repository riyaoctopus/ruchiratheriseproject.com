import "./style.css";

// ---------- Hero spatial scene (3D tilt + scroll/pointer parallax) ----------
const heroParallax = document.querySelector("[data-hero-parallax]");
if (heroParallax && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const heroStage = heroParallax.closest(".hero-stage");
  const state = { scrollY: 0, tiltX: 0, tiltY: 0, px: 0, py: 0 };
  let ticking = false;

  const render = () => {
    heroParallax.style.transform =
      `translate3d(${state.px}px, ${state.scrollY + state.py}px, 0) ` +
      `rotateX(${state.tiltX}deg) rotateY(${state.tiltY}deg)`;
    ticking = false;
  };
  const schedule = () => {
    if (!ticking) {
      window.requestAnimationFrame(render);
      ticking = true;
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      state.scrollY = Math.min(window.scrollY * 0.12, 60);
      schedule();
    },
    { passive: true }
  );

  if (window.matchMedia("(pointer: fine)").matches && heroStage) {
    heroStage.addEventListener("mousemove", (e) => {
      const rect = heroStage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      state.tiltY = nx * 14; // left/right -> rotate around Y
      state.tiltX = ny * -10; // up/down -> rotate around X
      state.px = nx * 18;
      state.py = ny * 12;
      schedule();
    });
    heroStage.addEventListener("mouseleave", () => {
      state.tiltX = 0;
      state.tiltY = 0;
      state.px = 0;
      state.py = 0;
      schedule();
    });
  }
}

// ---------- Mobile nav toggle ----------
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = !navMenu.classList.contains("hidden");
    navMenu.classList.toggle("hidden");
    navToggle.setAttribute("aria-expanded", String(!isOpen));
  });
  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.add("hidden");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ---------- Active nav link on scroll ----------
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-link");
if (sections.length && navLinks.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll("[data-reveal]");
if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

// ---------- Tabs (floor plans, gallery, etc.) ----------
document.querySelectorAll("[data-tab-group]").forEach((group) => {
  const groupName = group.getAttribute("data-tab-group");
  const triggers = group.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll(`[data-tab-group-panel="${groupName}"]`);

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const target = trigger.getAttribute("data-tab");

      triggers.forEach((t) => {
        const active = t === trigger;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.getAttribute("data-tab-panel") === target);
      });
    });
  });
});

// Active-tab button styling (gold pill vs plain) kept in sync via CSS below
const style = document.createElement("style");
style.textContent = `
  [data-tab-group] [data-tab].is-active { background: var(--color-gold-deep); color: #fff; }
  [data-tab-group] [data-tab]:not(.is-active) { color: var(--color-muted); }
  [data-tab-group] [data-tab]:not(.is-active):hover { background: var(--color-cream-card); color: var(--color-charcoal); }
`;
document.head.appendChild(style);

// ---------- FAQ accordion ----------
function setPanelHeight(item, open) {
  const panel = item.querySelector("[data-accordion-panel]");
  if (!panel) return;
  panel.style.maxHeight = open ? `${panel.scrollHeight}px` : "0px";
}

document.querySelectorAll("[data-accordion-item]").forEach((item) => {
  setPanelHeight(item, item.classList.contains("is-open"));

  const trigger = item.querySelector("[data-accordion-trigger]");
  trigger?.addEventListener("click", () => {
    const willOpen = !item.classList.contains("is-open");
    const group = item.closest("[id]");
    group?.querySelectorAll("[data-accordion-item]").forEach((sibling) => {
      sibling.classList.remove("is-open");
      setPanelHeight(sibling, false);
    });
    if (willOpen) {
      item.classList.add("is-open");
      setPanelHeight(item, true);
    }
  });
});

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-accordion-item].is-open").forEach((item) => setPanelHeight(item, true));
});

// ---------- Floor plan gate (blur + unlock on enquiry) ----------
const UNLOCK_KEY = "rise_leads_unlocked";

function applyUnlockState() {
  if (localStorage.getItem(UNLOCK_KEY) === "1") {
    document.documentElement.classList.add("leads-unlocked");
  }
}
applyUnlockState();

function unlockFloorPlans() {
  localStorage.setItem(UNLOCK_KEY, "1");
  document.documentElement.classList.add("leads-unlocked");
}

document.querySelectorAll(".floorplan-gate").forEach((gate) => {
  const overlay = document.createElement("div");
  overlay.className = "floorplan-gate-overlay";
  overlay.innerHTML = `
    <div class="floorplan-gate-card">
      <span class="material-symbols-outlined">lock</span>
      <p class="font-serif text-base font-medium mt-2 mb-1">Floor Plan Locked</p>
      <p class="text-xs text-[color:var(--color-muted)] mb-4">Register your interest to view the full floor plan.</p>
      <button type="button" data-open-enquiry-modal class="btn-shimmer w-full bg-[color:var(--color-gold-deep)] hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-ink)] text-white text-[11px] font-bold uppercase tracking-widest px-5 py-3 rounded transition-colors">
        Unlock Floor Plan
      </button>
    </div>
  `;
  gate.appendChild(overlay);
});

// ---------- Enquiry modal ----------
const modal = document.getElementById("enquiry-modal");
const MODAL_SEEN_KEY = "rise_enquiry_modal_seen";

function openModal() {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-open-enquiry-modal]").forEach((btn) => {
  btn.addEventListener("click", openModal);
});
modal?.querySelector("[data-modal-close]")?.addEventListener("click", closeModal);
modal?.querySelector("[data-modal-backdrop]")?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
});

// Auto-show the enquiry modal on a visitor's first visit to the site.
if (modal && localStorage.getItem(MODAL_SEEN_KEY) !== "1") {
  window.setTimeout(() => {
    openModal();
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  }, 1200);
}

// ---------- Enquiry form submit (shared by the inline section + the modal) ----------
function setStatus(formEl, message, kind) {
  const statusEl = formEl.querySelector("[data-form-status]");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-green-50", "text-green-700");
  statusEl.classList.add(kind === "error" ? "bg-red-50" : "bg-green-50", kind === "error" ? "text-red-700" : "text-green-700");
}

document.querySelectorAll("form[data-enquiry-form]").forEach((formEl) => {
  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(formEl).entries());

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        setStatus(formEl, "Thank you! Our sales team will contact you shortly.", "success");
        formEl.reset();
        unlockFloorPlans();
        if (formEl.closest("#enquiry-modal")) {
          window.setTimeout(closeModal, 1600);
        }
      } else {
        setStatus(formEl, (result.errors && result.errors[0]) || "Something went wrong. Please try again or call us directly.", "error");
      }
    } catch (err) {
      setStatus(formEl, "Network error — please call +91 74838 53926 or try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Enquiry";
    }
  });
});
