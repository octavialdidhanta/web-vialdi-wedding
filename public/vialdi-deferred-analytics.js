/**
 * Dipanggil via <script defer> agar parse HTML tidak terblok panjang oleh inline script (FCP).
 * Logika sama dengan versi sebelumnya di index.html.
 */
window.__deferNonCritical =
  window.__deferNonCritical ||
  function (fn) {
    var run = function () {
      try {
        fn();
      } catch (e) {
        // keep page usable even if scheduling fails
      }
    };
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(run, { timeout: 1200 });
      return;
    }
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        window.setTimeout(run, 0);
      });
      return;
    }
    window.setTimeout(run, 0);
  };

(function () {
  var w = window;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  w.__deferNonCritical(function () {
    var didLoad = false;
    function loadGtm() {
      if (didLoad) return;
      didLoad = true;
      var d = document;
      var s = "script";
      var l = "dataLayer";
      var i = "GTM-N7LD8CX";
      var f = d.getElementsByTagName(s)[0];
      var j = d.createElement(s);
      var dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    }

    var once = function () {
      loadGtm();
      w.removeEventListener("pointerdown", once, true);
      w.removeEventListener("keydown", once, true);
      w.removeEventListener("touchstart", once, true);
      w.removeEventListener("scroll", once, true);
    };
    w.addEventListener("pointerdown", once, true);
    w.addEventListener("keydown", once, true);
    w.addEventListener("touchstart", once, true);
    w.addEventListener("scroll", once, true);

    w.addEventListener(
      "load",
      function () {
        setTimeout(loadGtm, 2800);
      },
      { once: true },
    );
  });
})();

window.__fbPixelBooted = false;
window.__fbqLastTrackedUrl = window.__fbqLastTrackedUrl || null;
window.__fbqInitialPageViewTracked = window.__fbqInitialPageViewTracked || false;

function loadMetaPixel() {
  if (typeof window.fbq === "function") {
    window.__fbPixelBooted = true;
    return;
  }
  if (window.__fbPixelBooted) return;
  window.__fbPixelBooted = true;

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  fbq("init", "490486342185584");
  fbq("track", "PageView");
  window.__fbqInitialPageViewTracked = true;
  window.__fbqLastTrackedUrl =
    window.location.pathname + window.location.search + window.location.hash;
}

window.loadMetaPixel = loadMetaPixel;

window.__deferNonCritical(function () {
  var did = false;
  function load() {
    if (did) return;
    did = true;
    loadMetaPixel();
  }
  var once = function () {
    load();
    window.removeEventListener("pointerdown", once, true);
    window.removeEventListener("keydown", once, true);
    window.removeEventListener("touchstart", once, true);
    window.removeEventListener("scroll", once, true);
  };
  window.addEventListener("pointerdown", once, true);
  window.addEventListener("keydown", once, true);
  window.addEventListener("touchstart", once, true);
  window.addEventListener("scroll", once, true);
  window.addEventListener(
    "load",
    function () {
      setTimeout(load, 2800);
    },
    { once: true },
  );
});
