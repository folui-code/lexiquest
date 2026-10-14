/* ===================================================================
   MODE 2 — CONTEXT CRYPTIC
   Type the missing word/expression in a fresh context sentence.
   Points decay over time; each clue you unlock costs points.
   =================================================================== */
const Cryptic = {
  ROUNDS: 10, MAX: 100, MIN: 40,
  CLUES: { syn: ["🔍 Synonyms", 15], meaning: ["📖 Meaning", 15], letters: ["🔤 First letters", 25] },

  intro() {
    const el = $("#screen-cryptic");
    el.innerHTML = `<button class="back-btn" id="cc-back">← Home</button>
      <div class="card intro"><div class="mode-icon" style="background:var(--g-cryptic)">🕵️</div>
      <h1>Context Cryptic</h1><p class="muted">Think like a detective. Read the clues in the sentence.</p>
      <ul><li>📝 ${this.ROUNDS} brand-new sentences, each with a missing word or expression</li>
      <li>💯 Each word starts at <b>${this.MAX} pts</b> and loses points every second</li>
      <li>🔍 Stuck? Unlock clues, but each one costs points</li>
      <li>🔥 Get several right in a row for a streak bonus</li>
      <li>🧠 Words you struggle with come back more often</li></ul>
      <div class="row"><button class="btn primary" id="cc-start">▶ Start Case</button></div>
      <p class="muted" style="margin-top:14px">Best: ${fmt(Store.d.best.cryptic || 0)}</p></div>`;
    $("#cc-back").onclick = () => showScreen("home");
    $("#cc-start").onclick = () => this.start();
    showScreen("cryptic");
  },

  start() {
    showScreen("cryptic");
    Object.assign(this, { cards: Store.pickWords(this.ROUNDS), i: 0, score: 0, results: [], streak: 0, totalClues: 0, timer: null });
    currentCleanup = () => clearInterval(this.timer);
    this.round();
  },

  skeleton(word, revealFirst) {
    return word.split(/(\s+|\.\.\.)/).map((tok) => {
      if (/^\s+$/.test(tok)) return "&nbsp;&nbsp;";
      if (tok === "...") return " … ";
      return [...tok].map((ch, k) => (/[a-z]/i.test(ch) ? (revealFirst && k === 0 ? ch.toUpperCase() : "_") : ch)).join(" ");
    }).join("");
  },

  sentenceHTML(c, solved) {
    const parts = c.word.split(/\s*\.\.\.\s*/);
    let k = 0;
    return esc(c.context).replace(/___/g, () => {
      const fill = parts.length > 1 ? parts[k++] || "" : c.word;
      return solved ? `<span class="gap solved">${esc(fill)}</span>` : `<span class="gap">?&nbsp;?&nbsp;?</span>`;
    });
  },

  round() {
    const c = (this.c = this.cards[this.i]);
    Object.assign(this, { pts: this.MAX, used: {}, tries: 0, closeWarned: false, done: false, t0: Date.now() });
    const el = $("#screen-cryptic");
    el.innerHTML = `<div class="game-head"><button class="back-btn" id="cc-quit" style="margin:0">✕ Quit</button>
        <div class="progress-dots">${this.cards.map((_, k) => `<i class="${k < this.i ? (this.results[k].ok ? "ok" : "bad") : k === this.i ? "cur" : ""}"></i>`).join("")}</div>
        <div class="hud"><div class="pill">🔥 <b>${this.streak}</b></div><div class="pill">⭐ <b>${fmt(this.score)}</b></div></div></div>
      <div class="card cc-card" id="cc-card">
        <div class="cc-meta"><span class="chip">${esc(c.pos)}</span><span class="pts" id="cc-pts">${this.MAX} pts</span></div>
        <div class="cc-sentence" id="cc-sentence">${this.sentenceHTML(c, false)}</div>
        <div class="skeleton" id="cc-skel">${this.skeleton(c.word, false)}</div>
        <div class="clues" id="cc-clues"></div>
      </div>
      <div class="answer-row"><input id="cc-input" placeholder="Type the missing word / expression…" autocomplete="off" autocapitalize="off" spellcheck="false" /><button class="btn primary" id="cc-submit">Submit ↵</button></div>
      <div class="feedback" id="cc-fb"></div>
      <div class="hint-row" id="cc-hints">${Object.entries(this.CLUES).map(([k, [lab, cost]]) => `<button class="btn small" id="cc-hint-${k}" data-k="${k}">${lab} <small>−${cost}</small></button>`).join("")}<button class="btn small" id="cc-giveup">🏳️ Reveal</button></div>`;
    $("#cc-quit").onclick = () => { clearInterval(this.timer); this.intro(); };
    $("#cc-submit").onclick = () => this.submit();
    $("#cc-input").onkeydown = (e) => { if (e.key === "Enter") this.done ? this.nextRound() : this.submit(); };
    $$("#cc-hints [data-k]").forEach((b) => (b.onclick = () => this.clue(b.dataset.k, b)));
    $("#cc-giveup").onclick = () => this.finish(false);
    $("#cc-input").focus();
    clearInterval(this.timer);
    this.timer = setInterval(() => { if (!this.done) { this.pts = Math.max(this.MIN - this.penalty(), this.pts - 1); this.showPts(); } }, 1000);
  },

  penalty() { return Object.keys(this.used).reduce((s, k) => s + this.CLUES[k][1], 0) + this.tries * 10; },
  showPts() { const el = $("#cc-pts"); if (el) el.textContent = `${Math.max(0, this.pts)} pts`; },

  clue(k, btn) {
    if (this.used[k] || this.done) return;
    this.used[k] = true; this.totalClues++; this.pts -= this.CLUES[k][1]; this.showPts(); Sfx.click();
    btn.disabled = true;
    const c = this.c, box = $("#cc-clues");
    if (k === "syn") box.insertAdjacentHTML("beforeend", `<div class="clue"><b>Synonyms:</b>${esc(c.synonyms.join(", "))}</div>`);
    if (k === "meaning") box.insertAdjacentHTML("beforeend", `<div class="clue"><b>Meaning:</b>${esc(c.meaning)}</div>`);
    if (k === "letters") $("#cc-skel").innerHTML = this.skeleton(c.word, true);
    $("#cc-input").focus();
  },

  submit() {
    if (this.done) return;
    const guess = norm($("#cc-input").value), target = norm(this.c.word), fb = $("#cc-fb");
    if (!guess) return;
    if (guess === target) return this.finish(true);
    const dist = levenshtein(guess, target);
    if (!this.closeWarned && dist <= Math.max(1, Math.floor(target.length / 8))) {
      this.closeWarned = true; this.pts -= 5; this.showPts();
      fb.className = "feedback bad"; fb.textContent = "😮 So close! Check your spelling (−5)";
      return;
    }
    this.tries++; this.pts -= 10; this.showPts(); Sfx.wrong();
    $("#cc-card").classList.remove("shake"); void $("#cc-card").offsetWidth; $("#cc-card").classList.add("shake");
    fb.className = "feedback bad"; fb.textContent = this.tries >= 3 ? "" : `❌ Not quite. ${3 - this.tries} attempt${3 - this.tries > 1 ? "s" : ""} left (−10)`;
    if (this.tries >= 3) this.finish(false);
    $("#cc-input").select();
  },

  finish(ok) {
    this.done = true; clearInterval(this.timer);
    const c = this.c, nClues = Object.keys(this.used).length;
    let gained = 0;
    if (ok) {
      this.streak++;
      gained = Math.round(Math.max(10, this.pts) * (1 + Math.min(0.5, (this.streak - 1) * 0.1)));
      this.score += gained; Sfx.correct(this.streak * 2);
      Store.review(c.id, nClues === 0 && this.tries === 0 ? 5 : nClues <= 1 ? 4 : 3);
      if (this.streak >= 3) Fx.confetti(40, innerWidth / 2, innerHeight / 2);
    } else { this.streak = 0; Sfx.wrong(); Store.review(c.id, 1); }
    this.results.push({ ok, c });
    $("#cc-sentence").innerHTML = this.sentenceHTML(c, true);
    $("#cc-skel").innerHTML = "";
    $("#cc-clues").innerHTML = `<div class="clue"><b>${esc(c.word)}</b>— ${esc(c.meaning)}</div>`;
    const fb = $("#cc-fb");
    fb.className = "feedback " + (ok ? "good" : "bad");
    fb.innerHTML = ok ? `✅ Cracked it! +${gained} pts ${this.streak >= 2 ? `· 🔥 ${this.streak} streak bonus` : ""}` : `💡 The answer was <b>${esc(c.word)}</b>. It'll come back soon for review.`;
    $("#cc-input").disabled = true;
    $("#cc-hints").innerHTML = `<button class="btn primary" id="cc-next">${this.i + 1 < this.cards.length ? "Next word →" : "See results 🏁"}</button>`;
    $("#cc-next").onclick = () => this.nextRound();
    $("#cc-submit").disabled = true;
    setTimeout(() => $("#cc-next")?.focus(), 50);
  },

  nextRound() { this.i++; this.i < this.cards.length ? this.round() : this.end(); },

  end() {
    const right = this.results.filter((r) => r.ok).length;
    if (right === this.ROUNDS) Store.unlock("perfect10");
    if (this.totalClues === 0 && right >= 7) Store.unlock("nohint");
    if (right >= 7) Store.quest("cryptic");
    showResults({
      mode: "cryptic", emoji: right >= 9 ? "🕵️" : right >= 6 ? "🔎" : "📓", title: right >= 9 ? "Master detective!" : "Case closed",
      score: this.score, xp: 20 + this.score / 8,
      stats: [["Cracked", `${right}/${this.ROUNDS}`], ["Clues used", this.totalClues]],
      review: this.results.filter((r) => !r.ok).map((r) => r.c), replay: () => this.start()
    });
  }
};
