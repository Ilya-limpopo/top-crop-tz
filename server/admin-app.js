// Shared client helpers used by every admin page. Loaded automatically
// by server/render.js right after the per-page payload script
// (window.__ADMIN__).
//
// Exposes window.TopCropAdmin = { uploadFile, saveTo, deleteFrom,
//                                 wireLogout, status, escapeAttr, slugify }
//
// Pages still own their form rendering and dirty-tracking logic — this
// just centralises the network calls and the bits every page needs to
// repeat (logout button, "✓ saved" feedback, file upload, slugify).

(function () {
  const NS = {};

  // ---------- network ----------
  async function uploadFile(file) {
    if (!file) throw new Error('no_file');
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw Object.assign(new Error(j.error || 'upload_failed'), { status: r.status, body: j });
    return j.url; // e.g. "uploads/<hash>.png"
  }

  async function jsonRequest(url, method, body) {
    const r = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body == null ? {} : { 'Content-Type': 'application/json' },
      body: body == null ? undefined : JSON.stringify(body),
    });
    let j = null;
    try { j = await r.json(); } catch {}
    if (r.status === 401) {
      // Session died; bounce to login.
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = '/admin/login?next=' + next;
      throw new Error('unauthorized');
    }
    if (!r.ok || (j && j.ok === false)) {
      throw Object.assign(new Error((j && (j.error || 'save_failed')) || 'save_failed'),
                          { status: r.status, body: j });
    }
    return j;
  }

  function saveTo(url, data, opts) {
    return jsonRequest(url, opts?.method || 'PUT', data);
  }
  function deleteFrom(url) { return jsonRequest(url, 'DELETE'); }

  // ---------- UI helpers ----------
  function status(statusEl, text) {
    if (statusEl) statusEl.textContent = text;
  }

  // Wire the standard "Save changes" button. Caller passes:
  //   { url, method?, getPayload, btn, statusEl, onSaved? }
  async function runSave({ url, method, getPayload, btn, statusEl, onSaved }) {
    if (btn?.disabled) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    status(statusEl, 'Saving…');
    try {
      const payload = typeof getPayload === 'function' ? await getPayload() : getPayload;
      const res = await saveTo(url, payload, { method });
      status(statusEl, '✓  All changes saved');
      if (typeof onSaved === 'function') onSaved(res);
    } catch (err) {
      status(statusEl, formatErr(err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save changes';
      }
    }
  }
  function formatErr(err) {
    if (err && err.body && err.body.errors) {
      const fields = Object.keys(err.body.errors);
      return 'Save failed — ' + fields.join(', ');
    }
    if (err && err.status === 401) return 'Session expired';
    return 'Save failed — try again';
  }

  // Replace any element with class .logout (or id=logoutBtn) so it POSTs
  // /api/auth/logout and redirects to /admin/login. Works for the <a>
  // elements baked into the prototype top bar.
  function wireLogout() {
    const handler = async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch {}
      location.href = '/admin/login';
    };
    document.querySelectorAll('a.logout, #logoutBtn, [data-action="logout"]').forEach((el) => {
      el.addEventListener('click', handler);
    });
  }

  // Match the server-side slugify so the "URL slug" hint on the news/job
  // editors matches what the server will store.
  function slugify(s) {
    return String(s || '').trim().toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Auto-wire logout once DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireLogout);
  } else {
    wireLogout();
  }

  Object.assign(NS, {
    uploadFile, saveTo, deleteFrom, runSave, status, slugify, escapeAttr,
    wireLogout,
  });
  window.TopCropAdmin = NS;
})();
