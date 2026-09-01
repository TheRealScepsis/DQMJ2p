(function () {
  "use strict";

  const RECIPES = DQMJ2_DATA.recipes;
  const MONSTER_ICONS = DQMJ2_DATA.monsterIcons;
  const SKILLS = DQMJ2_DATA.skills;

  const RANK_ORDER = ["E", "D", "C", "B", "A", "S", "SS / X"];

  function rankClass(rank) {
    if (!rank) return "";
    const r = rank.trim().toUpperCase();
    if (r.startsWith("SS")) return "rank-ss";
    if (r === "S") return "rank-s";
    if (r === "A") return "rank-a";
    if (r === "B") return "rank-b";
    if (r === "C") return "rank-c";
    if (r === "D") return "rank-d";
    if (r === "E") return "rank-e";
    return "";
  }

  function normalise(s) {
    return (s || "").toLowerCase().trim();
  }

  function iconFor(name) {
    return MONSTER_ICONS[name] || "";
  }

  function monChip(name, isHighlighted) {
    const icon = iconFor(name);
    const cls = "mon-chip" + (isHighlighted ? " highlight" : "");
    const img = icon ? `<img src="${icon}" alt="" loading="lazy">` : "";
    return `<span class="${cls}">${img}${escapeHtml(name)}</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- Populate filters ----------

  const familySet = new Set();
  const rankSet = new Set();
  RECIPES.forEach((r) => {
    if (r.family) familySet.add(r.family);
    if (r.rank) rankSet.add(r.rank);
  });

  const familyFilter = document.getElementById("familyFilter");
  Array.from(familySet).sort().forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    familyFilter.appendChild(opt);
  });

  const rankFilter = document.getElementById("rankFilter");
  RANK_ORDER.filter((r) => rankSet.has(r)).forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    rankFilter.appendChild(opt);
  });

  // ---------- Tabs ----------

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const target = "tab-" + btn.dataset.tab;
      tabPanels.forEach((p) => p.classList.toggle("active", p.id === target));
    });
  });

  // ---------- Monster search ----------

  const monsterSearch = document.getElementById("monsterSearch");
  const monsterClear = document.getElementById("monsterClear");
  const monsterEmptyState = document.getElementById("monsterEmptyState");
  const monsterResults = document.getElementById("monsterResults");
  const asResultList = document.getElementById("asResultList");
  const asMaterialList = document.getElementById("asMaterialList");
  const countAsResult = document.getElementById("countAsResult");
  const countAsMaterial = document.getElementById("countAsMaterial");
  const specialToggle = document.getElementById("specialToggle");

  function recipeCard(r, opts) {
    const highlightResult = !!opts.highlightResult;
    const highlightMaterialIdx = opts.highlightMaterialIdx;
    const badges = [];
    if (r.rank) badges.push(`<span class="rank-badge ${rankClass(r.rank)}">${escapeHtml(r.rank)}</span>`);
    if (r.family) badges.push(`<span class="family-tag">${escapeHtml(r.family)}</span>`);
    if (r.special) badges.push(`<span class="special-badge">Special-Only</span>`);

    const materialsHtml = r.materials
      .map((m, i) => monChip(m, i === highlightMaterialIdx))
      .join(`<span class="formula-plus">+</span>`);

    return `
      <div class="recipe-card${r.special ? " special" : ""}">
        <div class="recipe-top">
          ${monChip(r.result, highlightResult)}
          ${badges.join("")}
        </div>
        <div class="recipe-formula">
          <span class="formula-eq">=</span>
          ${materialsHtml}
        </div>
      </div>`;
  }

  function passesFilters(r) {
    const fam = familyFilter.value;
    const rank = rankFilter.value;
    if (fam && r.family !== fam) return false;
    if (rank && r.rank !== rank) return false;
    if (!specialToggle.checked && r.special) return false;
    return true;
  }

  function runMonsterSearch() {
    const q = normalise(monsterSearch.value);
    monsterClear.hidden = q.length === 0;

    if (!q) {
      monsterEmptyState.hidden = false;
      monsterResults.hidden = true;
      return;
    }

    const asResult = [];
    const asMaterial = [];

    RECIPES.forEach((r) => {
      if (!passesFilters(r)) return;
      if (normalise(r.result).includes(q)) {
        asResult.push(r);
      }
      const idx = r.materials.findIndex((m) => normalise(m).includes(q));
      if (idx !== -1) {
        asMaterial.push({ r, idx });
      }
    });

    countAsResult.textContent = asResult.length;
    countAsMaterial.textContent = asMaterial.length;

    asResultList.innerHTML = asResult.length
      ? asResult.map((r) => recipeCard(r, { highlightResult: true })).join("")
      : `<div class="no-results">No recipes produce a monster matching “${escapeHtml(monsterSearch.value)}”.</div>`;

    asMaterialList.innerHTML = asMaterial.length
      ? asMaterial.map(({ r, idx }) => recipeCard(r, { highlightMaterialIdx: idx })).join("")
      : `<div class="no-results">No recipes use a monster matching “${escapeHtml(monsterSearch.value)}” as a material.</div>`;

    monsterEmptyState.hidden = true;
    monsterResults.hidden = false;
  }

  monsterSearch.addEventListener("input", runMonsterSearch);
  familyFilter.addEventListener("change", runMonsterSearch);
  rankFilter.addEventListener("change", runMonsterSearch);
  specialToggle.addEventListener("change", runMonsterSearch);
  monsterClear.addEventListener("click", () => {
    monsterSearch.value = "";
    runMonsterSearch();
    monsterSearch.focus();
  });

  document.querySelectorAll("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      monsterSearch.value = btn.dataset.fill;
      runMonsterSearch();
    });
  });

  // ---------- Skill search ----------

  const skillSearch = document.getElementById("skillSearch");
  const skillClear = document.getElementById("skillClear");
  const skillEmptyState = document.getElementById("skillEmptyState");
  const skillResults = document.getElementById("skillResults");
  const skillAsResultList = document.getElementById("skillAsResultList");
  const skillAsMaterialList = document.getElementById("skillAsMaterialList");
  const countSkillResult = document.getElementById("countSkillResult");
  const countSkillMaterial = document.getElementById("countSkillMaterial");

  function skillPill(name, level, isHighlighted) {
    const cls = "skill-pill" + (isHighlighted ? " highlight" : "");
    const lvl = level != null ? `<span class="lvl">(${level})</span>` : "";
    return `<span class="${cls}">${escapeHtml(name)} ${lvl}</span>`;
  }

  function skillCardAsResult(s) {
    const needed = s.needed
      .map((n) => skillPill(n.skill, n.level, false))
      .join(`<span class="formula-plus">+</span>`);
    return `
      <div class="skill-card">
        <div class="skill-name">${escapeHtml(s.result)}</div>
        <div class="skill-formula">
          <span class="formula-eq">=</span>
          ${needed}
        </div>
      </div>`;
  }

  function skillCardAsMaterial(s, idx) {
    const needed = s.needed
      .map((n, i) => skillPill(n.skill, n.level, i === idx))
      .join(`<span class="formula-plus">+</span>`);
    return `
      <div class="skill-card">
        <div class="skill-name dim">${escapeHtml(s.result)}</div>
        <div class="skill-formula">
          <span class="formula-eq">=</span>
          ${needed}
        </div>
      </div>`;
  }

  function runSkillSearch() {
    const q = normalise(skillSearch.value);
    skillClear.hidden = q.length === 0;

    if (!q) {
      skillEmptyState.hidden = false;
      skillResults.hidden = true;
      return;
    }

    const asResult = SKILLS.filter((s) => normalise(s.result).includes(q));
    const asMaterial = [];
    SKILLS.forEach((s) => {
      const idx = s.needed.findIndex((n) => normalise(n.skill).includes(q));
      if (idx !== -1) asMaterial.push({ s, idx });
    });

    countSkillResult.textContent = asResult.length;
    countSkillMaterial.textContent = asMaterial.length;

    skillAsResultList.innerHTML = asResult.length
      ? asResult.map(skillCardAsResult).join("")
      : `<div class="no-results">No skill matching “${escapeHtml(skillSearch.value)}” is created by a combination.</div>`;

    skillAsMaterialList.innerHTML = asMaterial.length
      ? asMaterial.map(({ s, idx }) => skillCardAsMaterial(s, idx)).join("")
      : `<div class="no-results">No skill combination uses “${escapeHtml(skillSearch.value)}” as an ingredient.</div>`;

    skillEmptyState.hidden = true;
    skillResults.hidden = false;
  }

  skillSearch.addEventListener("input", runSkillSearch);
  skillClear.addEventListener("click", () => {
    skillSearch.value = "";
    runSkillSearch();
    skillSearch.focus();
  });

  document.querySelectorAll("[data-fill-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      skillSearch.value = btn.dataset.fillSkill;
      runSkillSearch();
    });
  });
})();
