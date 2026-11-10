(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Kopf: Hintergrund beim Scrollen, Handymenü */
  var kopf = $("#kopf");
  function kopfLage() { if (kopf) kopf.classList.toggle("ist-unten", window.scrollY > 40); }
  window.addEventListener("scroll", kopfLage, { passive: true }); kopfLage();
  var menueKnopf = $(".kopf__menue"), menue = $("#handymenue");
  if (menueKnopf && menue) {
    menueKnopf.addEventListener("click", function () {
      var auf = menueKnopf.getAttribute("aria-expanded") === "true";
      menueKnopf.setAttribute("aria-expanded", String(!auf));
      menue.hidden = auf;
      menueKnopf.textContent = auf ? "Menü" : "Schließen";
    });
    $$("a", menue).forEach(function (a) { a.addEventListener("click", function () { menue.hidden = true; menueKnopf.setAttribute("aria-expanded", "false"); menueKnopf.textContent = "Menü"; }); });
  }

  /* Einblenden */
  var ziele = $$(".kette__kopf, .typenschild, .standort__kopf, .kachel, .wasch, .jobs__kopf, .stelle, .team, .kontakt__raster");
  ziele.forEach(function (el) { el.classList.add("zeigen"); });
  var flotte = $(".flotte");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("ist-da"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    ziele.forEach(function (el) { io.observe(el); });
    if (flotte) io.observe(flotte);
  } else { ziele.forEach(function (el) { el.classList.add("ist-da"); }); }

  /* Hilfen */
  function gradText(t, nachkomma) {
    var z = Math.abs(t).toFixed(nachkomma ? 1 : 0).replace(".", ",");
    return (t < 0 ? "−" : t > 0 ? "+" : "") + z + " °C";
  }
  function mische(a, b, f) {
    var pa = [parseInt(a.substr(1, 2), 16), parseInt(a.substr(3, 2), 16), parseInt(a.substr(5, 2), 16)];
    var pb = [parseInt(b.substr(1, 2), 16), parseInt(b.substr(3, 2), 16), parseInt(b.substr(5, 2), 16)];
    return "rgb(" + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * f); }).join(",") + ")";
  }
  function farbe(t) {
    if (t <= 0) return mische("#1f8fe0", "#7fd0f5", (t + 25) / 25);
    if (t <= 10) return mische("#7fd0f5", "#9ee0c9", t / 10);
    return mische("#f3d27a", "#ff9f2a", (t - 10) / 15);
  }
  function kontaktOk(v) {
    v = (v || "").trim();
    return /\S+@\S+\.\S+/.test(v) || v.replace(/[^0-9]/g, "").length >= 6;
  }

  /* Auflieger-Planer */
  var planer = $("#planer");
  if (planer) {
    var t1 = $("#temp1"), t2 = $("#temp2"), anz = $("#paletten-zahl"), wandAn = $("#trennwand-an");
    var gruppe = $("#paletten"), wand = $("#trennwand"), ns = "http://www.w3.org/2000/svg";
    var X0 = 148, BREITE = 692, Y0 = 38, HOEHE = 144, SP = 11, RE = 3, TEIL = 6;
    var zw = BREITE / SP, zh = HOEHE / RE, zellen = [], oben = [];
    for (var i = 0; i < SP * RE; i++) {
      var sp = Math.floor(i / RE), re = i % RE;
      var r = document.createElementNS(ns, "rect");
      r.setAttribute("x", (X0 + sp * zw + 2).toFixed(1)); r.setAttribute("y", (Y0 + re * zh + 2).toFixed(1));
      r.setAttribute("width", (zw - 4).toFixed(1)); r.setAttribute("height", (zh - 4).toFixed(1)); r.setAttribute("rx", "3");
      r.setAttribute("class", "palette palette--leer"); gruppe.appendChild(r); zellen.push(r);
      var o = document.createElementNS(ns, "rect");
      o.setAttribute("x", (X0 + sp * zw + 9).toFixed(1)); o.setAttribute("y", (Y0 + re * zh + 9).toFixed(1));
      o.setAttribute("width", (zw - 18).toFixed(1)); o.setAttribute("height", (zh - 18).toFixed(1)); o.setAttribute("rx", "2");
      o.setAttribute("class", "palette-oben"); o.style.display = "none"; gruppe.appendChild(o); oben.push(o);
    }
    var wandX = X0 + TEIL * zw; wand.setAttribute("x1", wandX); wand.setAttribute("x2", wandX);

    function anteil(el) { el.style.setProperty("--anteil", ((el.value - el.min) / (el.max - el.min) * 100) + "%"); }
    function zeichne() {
      var a = +t1.value, b = +t2.value, n = +anz.value, zwei = wandAn.checked;
      $("#temp1-wert").textContent = gradText(a); $("#temp2-wert").textContent = gradText(b);
      $("#paletten-wert").textContent = n; $("#anzp").textContent = n;
      var w1 = $("#anz1"), w2 = $("#anz2");
      w1.textContent = gradText(a, true); w1.classList.toggle("warm", a > 8);
      w2.textContent = gradText(b, true); w2.classList.toggle("warm", b > 8);
      $("#zone1-name").textContent = zwei ? "Zone vorn" : "Ladung";
      $("#anz2-feld").hidden = !zwei; $("#temp2-feld").hidden = !zwei; wand.hidden = !zwei;
      if (zwei) wand.removeAttribute("hidden"); else wand.setAttribute("hidden", "");
      var unten = Math.min(n, 33), drauf = Math.max(0, n - 33);
      zellen.forEach(function (z, i) {
        var sp = Math.floor(i / RE), voll = i < unten;
        z.setAttribute("class", "palette" + (voll ? "" : " palette--leer"));
        z.style.fill = voll ? farbe(zwei && sp >= TEIL ? b : a) : "";
        oben[i].style.display = i < drauf ? "" : "none";
      });
      var h = n <= 33 ? n + (n === 1 ? " Europalette" : " Europaletten") + " auf einer Ebene, Platz für 33." :
        n + " Europaletten, doppelstöckig geladen (" + drauf + " in der zweiten Ebene).";
      if (zwei) h += " Trennwand: vorn " + gradText(a) + ", hinten " + gradText(b) + ".";
      $("#planer-hinweis").textContent = h;
      anteil(anz);
    }
    [t1, t2, anz].forEach(function (el) { el.addEventListener("input", zeichne); });
    wandAn.addEventListener("change", zeichne);
    $$("input[name=ware]", planer).forEach(function (r) {
      r.addEventListener("change", function () { if (r.checked) { t1.value = r.getAttribute("data-temp"); zeichne(); } });
    });
    zeichne();

    planer.addEventListener("submit", function (e) {
      e.preventDefault();
      var k = $("#a-kontakt"), f = $("#a-kontakt-fehler");
      if (!kontaktOk(k.value)) { f.hidden = false; k.parentNode.classList.add("hat-fehler"); k.setAttribute("aria-invalid", "true"); k.focus(); return; }
      f.hidden = true; k.parentNode.classList.remove("hat-fehler"); k.removeAttribute("aria-invalid");
      var ware = ($("input[name=ware]:checked", planer) || {}).value || "";
      var teile = [ware + ", " + $("#paletten-zahl").value + " Europaletten bei " + gradText(+t1.value)];
      if (wandAn.checked) teile[0] += " (hinten " + gradText(+t2.value) + ")";
      var von = $("#von").value.trim(), nach = $("#nach").value.trim(), tag = $("#ladetag").value;
      if (von || nach) teile.push((von || "?") + " nach " + (nach || "?"));
      if (tag) { var d = tag.split("-"); teile.push("Ladetag " + d[2] + "." + d[1] + "." + d[0]); }
      $("#planer-zusammenfassung").textContent = teile.join(" · ") + ". Antwort an: " + k.value.trim() + ".";
      $$(".planer__buehne, .planer__regler, .planer__fahrt", planer).forEach(function (el) { el.hidden = true; });
      var ok = $("#planer-ok"); ok.hidden = false; ok.focus();
    });
    $("#planer-neu").addEventListener("click", function () {
      $$(".planer__buehne, .planer__regler, .planer__fahrt", planer).forEach(function (el) { el.hidden = false; });
      $("#planer-ok").hidden = true; t1.focus();
    });
  }

  /* Kurzbewerbung in drei Schritten */
  var bew = $("#bewerbung");
  if (bew) {
    var schritte = $$(".schritt", bew), marken = $$(".schritte li", bew), jetzt = 1;
    function zeige(n, still) {
      jetzt = n;
      schritte.forEach(function (s) { s.hidden = +s.getAttribute("data-schritt") !== n; });
      marken.forEach(function (m) { var s = +m.getAttribute("data-s"); m.className = s === n ? "ist" : s < n ? "fertig" : ""; });
      var stelle = ($("input[name=stelle]:checked", bew) || {}).value;
      $$(".nur-fahrer", bew).forEach(function (el) { el.hidden = stelle !== "Kraftfahrer CE"; });
      var ziel = $(".schritt:not([hidden]) .schritt__frage", bew);
      if (ziel && !still) { ziel.setAttribute("tabindex", "-1"); ziel.focus({ preventScroll: true }); }
    }
    $$(".weiter", bew).forEach(function (b) { b.addEventListener("click", function () { zeige(jetzt + 1); }); });
    $$(".zurueck", bew).forEach(function (b) { b.addEventListener("click", function () { zeige(jetzt - 1); }); });
    $$("[data-stelle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var w = b.getAttribute("data-stelle");
        $$("input[name=stelle]", bew).forEach(function (r) { r.checked = r.value === w; });
        zeige(2);
        bew.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });
    });
    bew.addEventListener("submit", function (e) {
      e.preventDefault();
      var k = $("#b-kontakt"), f = $("#b-kontakt-fehler");
      if (!kontaktOk(k.value)) { f.hidden = false; k.parentNode.classList.add("hat-fehler"); k.setAttribute("aria-invalid", "true"); k.focus(); return; }
      f.hidden = true; k.parentNode.classList.remove("hat-fehler"); k.removeAttribute("aria-invalid");
      var w = function (n) { return ($("input[name=" + n + "]:checked", bew) || {}).value; };
      var name = $("#b-name").value.trim();
      var t = (name ? name + ", " : "") + "Stelle: " + w("stelle");
      if (w("stelle") === "Kraftfahrer CE") t += ", Führerschein CE: " + w("fuehrerschein");
      t += ", Erfahrung: " + w("erfahrung") + ", Start: " + w("start") + ". Rückweg: " + k.value.trim() + ".";
      $("#bew-zusammenfassung").textContent = t;
      schritte.forEach(function (s) { s.hidden = true; });
      marken.forEach(function (m) { m.className = "fertig"; });
      var ok = $("#bew-ok"); ok.hidden = false; ok.focus();
    });
    zeige(1, true);
  }

  /* Kurzform auf Unterseiten */
  $$(".kurzform").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var k = $("input[name=kontakt]", form), f = $(".fehler", form);
      if (!kontaktOk(k.value)) { f.hidden = false; k.focus(); return; }
      f.hidden = true; $(".kurzform__ok", form).hidden = false;
    });
  });
})();
