/* ===================================================================
   MODE 4 — GRAMMAR BLITZ (Curriculum Units 1–28)
   10 Rapid Multiple Choice Questions + Post-Game Rule Consolidation Review
   =================================================================== */

const Blitz = {
  currentUnit: 1,
  questions: [],
  currentIndex: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctCount: 0,
  timeLeft: 75,
  timerInterval: null,
  nextTimeout: null,
  history: [], // tracks question, selectedKey, isCorrect, correctKey, explanation
  locked: false,
  isOver: false,

  // 1. UNIT SELECTION SCREEN
  intro() {
    clearInterval(this.timerInterval);
    clearTimeout(this.nextTimeout);
    this.isOver = true;
    this.locked = true;

    const el = $("#screen-blitz");
    if (!el) return;

    const units = window.GRAMMAR_UNITS || [];
    const bestScores = (Store.d && Store.d.best && Store.d.best.blitz) || {};

    el.innerHTML = `
      <button class="back-btn" id="blitz-back">← Home</button>
      <div class="blitz-hub-card card">
        <div class="blitz-hub-head">
          <div class="mode-icon" style="background:linear-gradient(135deg, #06b6d4, #3b82f6 50%, #8b5cf6)">⚡📖</div>
          <div>
            <h1>Grammar Blitz</h1>
            <p class="muted">Grammar &amp; Usage (Book B) Curriculum Practice · 10 Rapid MCs per session</p>
          </div>
        </div>

        <div class="blitz-rules-banner">
          <div class="blitz-rule-chip">⚡ <b>10 Rapid Questions</b></div>
          <div class="blitz-rule-chip">⏱️ <b>75s Blitz Clock</b></div>
          <div class="blitz-rule-chip">🔥 <b>Combo Multipliers</b></div>
          <div class="blitz-rule-chip">📚 <b>Post-Game Rule Review</b></div>
        </div>

        <h3 style="margin:18px 0 10px;font-size:1.15rem">Select a Grammar Unit:</h3>
        <div class="blitz-units-grid">
          ${units.map(u => {
            const isUnlocked = u.unlocked;
            const isCombined = [4, 5, 6].includes(u.id);
            const best = bestScores[u.id] ? `⭐ Best: ${fmt(bestScores[u.id])}` : (isUnlocked ? "Ready to Blitz" : "Coming Soon");
            const badgeClass = isUnlocked ? (isCombined ? "combined" : "active") : "soon";
            const badgeLabel = isUnlocked
              ? (isCombined ? "🔄 Units 4–6 Pool (150 Qs)" : "🔥 Active Unit (50 Qs)")
              : "🔒 Locked";
            return `
              <button class="blitz-unit-card ${isUnlocked ? "unlocked" : "locked"} ${isCombined ? "combined-unit" : ""}" data-uid="${u.id}" ${isUnlocked ? "" : "disabled"}>
                <div class="blitz-unit-num">Unit ${u.id}${isCombined ? ' <span style="font-size:0.75rem;opacity:0.85">· Non-Finites</span>' : ''}</div>
                <div class="blitz-unit-title">${esc(u.title)}</div>
                <div class="blitz-unit-meta">
                  <span class="blitz-badge ${badgeClass}">${badgeLabel}</span>
                  <span class="muted" style="font-size:0.75rem">${best}</span>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;

    $("#blitz-back").onclick = () => showScreen("home");

    $$(".blitz-unit-card.unlocked").forEach(btn => {
      btn.onclick = () => {
        Sfx.click();
        const uid = +btn.dataset.uid;
        this.start(uid);
      };
    });

    showScreen("blitz");
  },

  // 2. START A 10-QUESTION BLITZ SESSION
  start(unitId) {
    clearInterval(this.timerInterval);
    clearTimeout(this.nextTimeout);

    this.currentUnit = unitId;
    let pool = [];

    // Units 4, 5, 6 share the combined non-finite verbs pool (150 questions)
    if ([4, 5, 6].includes(unitId)) {
      pool = [
        ...(window.GRAMMAR_QUESTIONS && window.GRAMMAR_QUESTIONS[4] ? window.GRAMMAR_QUESTIONS[4] : []),
        ...(window.GRAMMAR_QUESTIONS && window.GRAMMAR_QUESTIONS[5] ? window.GRAMMAR_QUESTIONS[5] : []),
        ...(window.GRAMMAR_QUESTIONS && window.GRAMMAR_QUESTIONS[6] ? window.GRAMMAR_QUESTIONS[6] : [])
      ];
    } else {
      pool = (window.GRAMMAR_QUESTIONS && window.GRAMMAR_QUESTIONS[unitId]) || [];
    }

    if (!pool.length) {
      toast("⚠️ No questions found for this unit yet!");
      return;
    }

    // Pick 10 random questions from the combined pool (or all available if < 10)
    const selected = shuffle([...pool]).slice(0, 10);
    this.questions = selected;
    this.currentIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.timeLeft = 75;
    this.history = [];
    this.locked = false;
    this.isOver = false;

    this.renderGame();
    this.startTimer();
    showScreen("blitz");
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const updateBar = () => {
      const el = $("#blitz-bar");
      const num = $("#blitz-time");
      if (el) el.style.width = `${Math.max(0, (this.timeLeft / 75) * 100)}%`;
      if (num) num.textContent = Math.max(0, this.timeLeft);
      if (this.timeLeft <= 10 && el) {
        el.style.background = "var(--red)";
      }
    };

    updateBar();
    this.timerInterval = setInterval(() => {
      if (this.isOver) {
        clearInterval(this.timerInterval);
        return;
      }
      this.timeLeft--;
      updateBar();
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        clearTimeout(this.nextTimeout);
        this.isOver = true;
        this.locked = true;
        Sfx.timeout();
        this.finish("time");
      }
    }, 1000);
  },

  renderGame() {
    if (this.isOver || this.timeLeft <= 0) return;
    const el = $("#screen-blitz");
    if (!el) return;

    const q = this.questions[this.currentIndex];
    const isCombined = [4, 5, 6].includes(this.currentUnit);
    const unitMeta = (window.GRAMMAR_UNITS || []).find(u => u.id === this.currentUnit);
    const chipText = isCombined ? "Units 4–6 Combined" : `Unit ${this.currentUnit}`;
    const unitTitle = isCombined
      ? "Non-Finite Verbs: To-Inf, Bare Inf & Gerund"
      : (unitMeta ? unitMeta.title : `Unit ${this.currentUnit}`);

    el.innerHTML = `
      <div class="game-head">
        <button class="back-btn" id="blitz-quit" style="margin:0">✕ Quit</button>
        <div class="hud">
          <div class="pill">Q <b>${this.currentIndex + 1} / ${this.questions.length}</b></div>
          <div class="pill">Combo <b id="blitz-combo">x${this.combo || 1}</b></div>
          <div class="pill">⭐ <b id="blitz-score">${fmt(this.score)}</b></div>
        </div>
      </div>

      <div class="timer-wrap" id="blitz-timer-wrap">
        <div class="timer-num" id="blitz-time">${Math.max(0, this.timeLeft)}</div>
        <div class="timer-bar"><i id="blitz-bar"></i></div>
      </div>

      <div class="card blitz-question-card" id="blitz-card">
        <div class="blitz-card-meta">
          <span class="chip" ${isCombined ? 'style="background:linear-gradient(135deg,rgba(168,85,247,0.3),rgba(59,130,246,0.3));border-color:rgba(168,85,247,0.6);color:#f3e8ff"' : ''}>${chipText}</span>
          <span class="muted" style="font-size:0.85rem">${esc(unitTitle)}</span>
        </div>
        <div class="blitz-question-text" id="blitz-q-text">${esc(q.question)}</div>
      </div>

      <div class="blitz-options-grid" id="blitz-options">
        ${q.options.map((opt) => `
          <button class="blitz-opt-btn" data-key="${opt.key}">
            <span class="opt-badge">${opt.key}</span>
            <span class="opt-text">${esc(opt.text)}</span>
          </button>
        `).join("")}
      </div>
    `;

    $("#blitz-quit").onclick = () => {
      this.isOver = true;
      this.locked = true;
      clearInterval(this.timerInterval);
      clearTimeout(this.nextTimeout);
      this.intro();
    };

    $$(".blitz-opt-btn").forEach(btn => {
      btn.onclick = () => {
        if (this.locked || this.isOver || this.timeLeft <= 0) return;
        const key = btn.dataset.key;
        this.handleAnswer(key, btn);
      };
    });
  },

  handleAnswer(selectedKey, btnEl) {
    if (this.locked || this.isOver || this.timeLeft <= 0) return;
    this.locked = true;

    const q = this.questions[this.currentIndex];
    const correctOpt = q.options.find(o => o.is_correct);
    const selectedOpt = q.options.find(o => o.key === selectedKey);
    const isCorrect = selectedOpt && selectedOpt.is_correct;

    // Track for post-game consolidation
    this.history.push({
      question: q.question,
      selectedKey: selectedKey,
      selectedText: selectedOpt ? selectedOpt.text : "",
      correctKey: correctOpt ? correctOpt.key : "",
      correctText: correctOpt ? correctOpt.text : "",
      isCorrect: isCorrect,
      explanation: (selectedOpt && selectedOpt.explanation) || (correctOpt && correctOpt.explanation) || ""
    });

    if (isCorrect) {
      btnEl.classList.add("correct");
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const pts = 100 * Math.min(this.combo, 4);
      this.score += pts;
      this.correctCount++;
      Sfx.correct();
      Fx.confetti(30);
      toast(`+${pts} pts! 🔥`, false);
    } else {
      btnEl.classList.add("wrong");
      this.combo = 0;
      Sfx.wrong();
      // Highlight the correct answer
      const correctBtn = $(`#blitz-options [data-key="${correctOpt.key}"]`);
      if (correctBtn) correctBtn.classList.add("reveal-correct");
    }

    $("#blitz-score").textContent = fmt(this.score);
    $("#blitz-combo").textContent = `x${this.combo || 1}`;

    clearTimeout(this.nextTimeout);
    this.nextTimeout = setTimeout(() => {
      if (this.isOver || this.timeLeft <= 0) return;
      this.locked = false;
      this.currentIndex++;
      if (this.currentIndex < this.questions.length) {
        this.renderGame();
      } else {
        clearInterval(this.timerInterval);
        this.finish("complete");
      }
    }, 450);
  },

  // 3. RESULTS & CONSOLIDATION STATION
  finish(reason) {
    this.isOver = true;
    this.locked = true;
    clearInterval(this.timerInterval);
    clearTimeout(this.nextTimeout);

    const el = $("#screen-blitz");
    if (!el) return;

    // Time bonus
    const timeBonus = reason === "complete" ? Math.max(0, this.timeLeft) * 10 : 0;
    const finalScore = this.score + timeBonus;

    // Award XP and record play
    const xpEarned = Math.round(finalScore * 0.4) + (this.correctCount * 15);
    Store.addXP(xpEarned);
    Store.recordPlay();

    // Update Best Score (per unit and overall Blitz)
    Store.d.best = Store.d.best || {};
    Store.d.best.blitz = Store.d.best.blitz || {};
    if ([4, 5, 6].includes(this.currentUnit)) {
      [4, 5, 6].forEach(uid => {
        if (!Store.d.best.blitz[uid] || finalScore > Store.d.best.blitz[uid]) {
          Store.d.best.blitz[uid] = finalScore;
        }
      });
    } else {
      if (!Store.d.best.blitz[this.currentUnit] || finalScore > Store.d.best.blitz[this.currentUnit]) {
        Store.d.best.blitz[this.currentUnit] = finalScore;
      }
    }
    Store.setBest("blitz", finalScore);

    // Add to local Leaderboard
    Store.addLB("blitz", finalScore);
    Store.save();

    // Submit to School-wide Cloud Hall of Fame
    if (typeof Leaderboard !== "undefined" && Leaderboard.submitScore) {
      Leaderboard.submitScore("blitz", finalScore);
    }

    if (reason === "complete") {
      Sfx.fanfare();
      Fx.confetti(120);
    }

    const accuracyPct = Math.round((this.correctCount / Math.max(this.questions.length, 1)) * 100);
    const isTimeout = reason === "time";
    const headerEmoji = isTimeout ? "⏰" : "🎉";
    const headerTitle = isTimeout ? "Time's Up!" : "Blitz Finished!";
    const isCombined = [4, 5, 6].includes(this.currentUnit);
    const unitLabel = isCombined ? "Units 4–6 (Infinitives & Gerunds)" : `Unit ${this.currentUnit}`;
    const headerSubtitle = isTimeout
      ? `Time expired on ${unitLabel} · Great effort!`
      : `${unitLabel} Complete · Great effort!`;

    el.innerHTML = `
      <div class="blitz-summary-card card">
        <div style="font-size:3.2rem;margin-bottom:8px">${headerEmoji}</div>
        <h1 style="font-size:1.8rem;margin-bottom:6px">${headerTitle}</h1>
        <p class="muted" style="margin-bottom:18px">${esc(headerSubtitle)}</p>

        <div class="blitz-stats-row">
          <div class="blitz-stat-pill">
            <span class="muted">Final Score</span>
            <b class="grad-text">${fmt(finalScore)}</b>
          </div>
          <div class="blitz-stat-pill">
            <span class="muted">Accuracy</span>
            <b style="color:var(--emerald)">${this.correctCount} / ${this.questions.length} (${accuracyPct}%)</b>
          </div>
          <div class="blitz-stat-pill">
            <span class="muted">Max Streak</span>
            <b style="color:var(--amber)">${this.maxCombo}x 🔥</b>
          </div>
          <div class="blitz-stat-pill">
            <span class="muted">XP Earned</span>
            <b style="color:var(--cyan)">+${xpEarned} XP</b>
          </div>
        </div>

        <div class="blitz-actions-row">
          <button class="btn primary" id="btn-blitz-again">⚡ Blitz Again</button>
          <button class="btn secondary" id="btn-blitz-units">📖 Other Units</button>
          <button class="btn" id="btn-blitz-hof">👑 Hall of Fame</button>
          <button class="btn" id="btn-blitz-home">🏠 Home</button>
        </div>

        <!-- CONSOLIDATION & RULE REVIEW STATION -->
        <div class="blitz-review-section">
          <div class="blitz-review-header">
            <h3>📚 Grammar Rule Review &amp; Consolidation</h3>
            <p class="muted" style="font-size:0.85rem">Review all rules and caution traps to lock them into long-term memory:</p>
          </div>

          <div class="blitz-review-list">
            ${this.history.map((h, i) => `
              <div class="blitz-review-card ${h.isCorrect ? "was-correct" : "was-wrong"}">
                <div class="review-status-bar">
                  <span class="review-tag">${h.isCorrect ? "✅ Correct" : "❌ Review Needed"}</span>
                  <span class="muted" style="font-size:0.8rem">Q${i + 1}</span>
                </div>
                <div class="review-q-text">${esc(h.question)}</div>
                <div class="review-answers-box">
                  <div class="review-choice ${h.isCorrect ? "good" : "bad"}">
                    <b>Your Answer:</b> (${h.selectedKey}) ${esc(h.selectedText)}
                  </div>
                  ${!h.isCorrect ? `
                    <div class="review-choice correct-choice">
                      <b>Correct Answer:</b> (${h.correctKey}) ${esc(h.correctText)}
                    </div>
                  ` : ""}
                </div>
                <div class="review-explanation">
                  💡 <b>Grammar Rule:</b> ${esc(h.explanation)}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    $("#btn-blitz-again").onclick = () => this.start(this.currentUnit);
    $("#btn-blitz-units").onclick = () => this.intro();
    $("#btn-blitz-hof").onclick = () => {
      showScreen("home");
      if (typeof App !== "undefined" && App.renderScoreboard) {
        App.renderScoreboard("blitz");
        const sb = $("#main-scoreboard");
        if (sb) sb.scrollIntoView({ behavior: "smooth" });
      }
    };
    $("#btn-blitz-home").onclick = () => showScreen("home");
  }
};
