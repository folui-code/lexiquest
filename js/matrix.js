/* ===================================================================
   MODE 3 — SEMANTIC MATRIX (NYT Connections style)
   16 tiles → 4 hidden groups of 4. 4 lives. Daily puzzle + practice.
   =================================================================== */
const Matrix = {
  byWord: null,

  intro() {
    const daily = Store.d.daily.matrix;
    const el = $("#screen-matrix");
    el.innerHTML = `<button class="back-btn" id="mx-back">← Home</button>
      <div class="card intro"><div class="mode-icon" style="background:var(--g-matrix)">🧩</div>
      <h1>Semantic Matrix</h1><p class="muted">Find the hidden connections.</p>
      <ul><li>🔢 16 words hide in <b>4 secret groups</b> of 4</li>
      <li>👆 Select 4 words that belong together, then press <b>Submit</b></li>
      <li>❤️ You can make <b>4 mistakes</b>. "One away…" means you're close!</li>
      <li>🟨🟩🟦🟪 Groups range from straightforward to devious</li>
      <li>📅 One <b>Daily Puzzle</b> a day (same for the whole class!), plus unlimited practice</li></ul>
      <div class="row">
        <button class="btn matrix" id="mx-daily" ${daily ? "disabled" : ""}>📅 ${daily ? "Daily solved ✓" : "Daily Puzzle"}</button>
        <button class="btn" id="mx-practice">🎲 Practice</button></div>
      ${daily ? `<div class="share-grid">${daily.grid}</div><p class="muted">Come back tomorrow for a new puzzle ⏰</p>` : ""}</div>`;
    $("#mx-back").onclick = () => showScreen("home");
    $("#mx-daily").onclick = () => this.start(true);
    $("#mx-practice").onclick = () => this.start(false);
    showScreen("matrix");
  },

  build(rnd) {
    this.byWord ||= Object.fromEntries(VOCAB.map((c) => [c.word.toLowerCase(), c]));
    const valid = MATRIX_GROUPS.map((g) => ({ ...g, cards: g.words.map((w) => this.byWord[w.toLowerCase()]).filter(Boolean) })).filter((g) => g.cards.length >= 4);
    const chosen = shuffle(valid, rnd).slice(0, 4).sort((a, b) => a.diff - b.diff);
    return chosen.map((g, i) => ({ name: g.name, color: `d${i + 1}`, cards: shuffle(g.cards, rnd).slice(0, 4) }));
  },

  start(daily) {
    showScreen("matrix");
    const rnd = daily ? seededRng("matrix-" + todayKey()) : Math.random;
    this.groups = this.build(rnd);
    Object.assign(this, { daily, lives: 4, sel: new Set(), solved: [], guesses: [], tried: new Set(), mistakeIds: new Set(), over: false, found: 0 });
    this.tiles = shuffle(this.groups.flatMap((g) => g.cards.map((c) => ({ c, g }))));
    const el = $("#screen-matrix");
    el.innerHTML = `<div class="mx-wrap">
      <div class="game-head"><button class="back-btn" id="mx-quit" style="margin:0">✕ Quit</button>
        <h1>${daily ? "📅 Daily Matrix" : "🎲 Practice Matrix"}</h1><span class="muted">${todayKey()}</span></div>
      <p class="muted" style="text-align:center;margin-bottom:14px">Create four groups of four!</p>
      <div class="mx-solved" id="mx-solved"></div>
      <div class="mx-grid" id="mx-grid"></div>
      <div class="mx-lives" id="mx-lives"></div>
      <div class="mx-actions" id="mx-actions">
        <button class="btn small" id="mx-shuffle">🔀 Shuffle</button>
        <button class="btn small" id="mx-clear">Deselect all</button>
        <button class="btn matrix small" id="mx-submit" disabled>Submit</button></div></div>`;
    $("#mx-quit").onclick = () => this.intro();
    $("#mx-shuffle").onclick = () => { this.tiles = shuffle(this.tiles); this.renderGrid(); Sfx.click(); };
    $("#mx-clear").onclick = () => { this.sel.clear(); this.renderGrid(); };
    $("#mx-submit").onclick = () => this.submit();
    this.renderGrid(); this.renderLives();
  },

  renderGrid() {
    $("#mx-grid").innerHTML = this.tiles.map((t, i) => `<button class="tile ${t.c.word.length > 16 ? "long" : ""} ${this.sel.has(t.c.id) ? "sel" : ""}" id="mx-tile-${i}" data-id="${t.c.id}">${esc(t.c.word)}</button>`).join("");
    $$("#mx-grid .tile").forEach((b) => (b.onclick = () => this.toggle(+b.dataset.id)));
    $("#mx-submit").disabled = this.sel.size !== 4;
  },
  renderLives() { $("#mx-lives").innerHTML = `Mistakes remaining: ${[0, 1, 2, 3].map((i) => `<i class="${i >= this.lives ? "lost" : ""}"></i>`).join("")}`; },

  toggle(id) {
    if (this.over) return;
    if (this.sel.has(id)) this.sel.delete(id); else if (this.sel.size < 4) this.sel.add(id); else return;
    Sfx.click(); this.renderGrid();
  },

  submit() {
    if (this.sel.size !== 4 || this.over) return;
    const ids = [...this.sel], key = ids.slice().sort().join(",");
    if (this.tried.has(key)) return toast("You already tried that combination!");
    this.tried.add(key);
    const tiles = ids.map((id) => this.tiles.find((t) => t.c.id === id));
    this.guesses.push(tiles.map((t) => t.g.color));
    // jump animation
    ids.forEach((id, k) => setTimeout(() => $(`#mx-grid .tile[data-id="${id}"]`)?.classList.add("jump"), k * 80));
    const counts = {}; tiles.forEach((t) => (counts[t.g.name] = (counts[t.g.name] || 0) + 1));
    const top = Math.max(...Object.values(counts));
    setTimeout(() => {
      if (top === 4) this.solve(tiles[0].g, true);
      else {
        this.lives--; ids.forEach((id) => this.mistakeIds.add(id)); this.renderLives(); Sfx.wrong();
        $("#mx-grid").classList.remove("shake"); void $("#mx-grid").offsetWidth; $("#mx-grid").classList.add("shake");
        toast(top === 3 ? "🤏 One away…" : "❌ Not a group");
        if (this.lives <= 0) this.lose();
      }
    }, 450);
  },

  solve(g, byPlayer) {
    this.solved.push(g); this.sel.clear();
    this.tiles = this.tiles.filter((t) => t.g !== g);
    g.cards.forEach((c) => Store.review(c.id, !byPlayer ? 1 : this.mistakeIds.has(c.id) ? 3 : 4));
    $("#mx-solved").insertAdjacentHTML("beforeend", `<div class="mx-row ${g.color}"><h4>${esc(g.name)}</h4><p>${g.cards.map((c) => `<span data-id="${c.id}" title="${esc(c.meaning)}">${esc(c.word)}</span>`).join(", ")}</p></div>`);
    $$("#mx-solved span[data-id]").forEach((s) => (s.onclick = () => showWord(VOCAB[+s.dataset.id])));
    this.renderGrid();
    if (byPlayer) this.found++;
    if (byPlayer) { Sfx.correct(this.solved.length * 4); Fx.confetti(50, innerWidth / 2, innerHeight / 3); }
    if (byPlayer && this.solved.length === 4) setTimeout(() => this.win(), 700);
  },

  lose() {
    this.over = true;
    this.groups.filter((g) => !this.solved.includes(g)).forEach((g, k) => setTimeout(() => this.solve(g, false), 500 * (k + 1)));
    setTimeout(() => this.finish(false), 600 * 5);
  },

  win() { this.over = true; this.finish(true); },

  shareGrid() {
    const em = { d1: "🟨", d2: "🟩", d3: "🟦", d4: "🟪" };
    return this.guesses.map((row) => row.map((c) => em[c]).join("")).join("<br>");
  },

  finish(won) {
    const mistakes = 4 - this.lives;
    const score = won ? 400 + this.lives * 150 : this.found * 100;
    if (won && mistakes === 0) Store.unlock("flawless");
    if (this.daily) { Store.d.daily.matrix = { won, grid: this.shareGrid() }; Store.save(); if (won) Store.quest("matrix"); }
    const grid = this.shareGrid();
    showResults({
      mode: "matrix", emoji: won ? (mistakes === 0 ? "💎" : "🧩") : "🫠", title: won ? (mistakes === 0 ? "Flawless!" : "Matrix solved!") : "So close…",
      score, xp: won ? 60 + this.lives * 25 : 15,
      stats: [["Mistakes", mistakes], ["Groups found", `${this.found}/4`]],
      review: this.groups.flatMap((g) => g.cards).filter((c) => this.mistakeIds.has(c.id)),
      replay: () => this.start(false)
    });
    $(".results .stat-row").insertAdjacentHTML("afterend", `<div class="share-grid">${grid}</div><button class="btn small" id="mx-copy">📋 Copy result</button>`);
    $("#mx-copy").onclick = () => {
      navigator.clipboard?.writeText(`LexiQuest Matrix ${todayKey()}\n` + grid.replace(/<br>/g, "\n"));
      toast("Copied! Share it with your class 📤");
    };
  }
};
