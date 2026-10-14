/* ===================================================================
   MODE 1 — CRYPTIC RUSH (Unified Time Rush + Context Cryptic)
   No Multiple Choice! High-speed contextual deduction under time pressure.
   Type each letter into interactive slots.
   Long words provide 1 or a few hint letters, but students still type
   through them to enforce motor memory and prevent spelling mistakes.
   Correct answers ADD time (+4s to +8s with combos).
   =================================================================== */
const Rush = {
  START: 60,
  BASE_ADD: 4,

  intro() {
    const el = $("#screen-rush");
    el.innerHTML = `<button class="back-btn" id="rush-back">← Home</button>
      <div class="card intro"><div class="mode-icon" style="background:var(--g-rush)">⚡</div>
      <h1>Cryptic Rush</h1><p class="muted">Contextual deduction meets ticking adrenaline.</p>
      <ul>
        <li>⏳ You start with <b>${this.START}s</b> on the clock</li>
        <li>📝 Read the context sentence &amp; deduce the missing academic expression</li>
        <li>⌨️ <b>Type the exact spelling</b> letter-by-letter. No multiple choice!</li>
        <li>💡 Long words occasionally reveal <b>1–2 hint letters</b>, but you still type them to master the spelling</li>
        <li>✅ Each solved expression adds <b style="color:var(--emerald)">+${this.BASE_ADD}s to +8s</b> to your clock</li>
        <li>⚡ Build combos to multiply your score &amp; survive higher speed levels</li>
        <li>📱 Works with your physical keyboard or the on-screen keypad</li>
      </ul>
      <div class="row"><button class="btn rush" id="rush-start">▶ Start Rush</button></div>
      <p class="muted" style="margin-top:14px">Personal Best: ${fmt(Store.d.best.rush || 0)} pts</p></div>`;
    $("#rush-back").onclick = () => showScreen("home");
    $("#rush-start").onclick = () => this.start();
    showScreen("rush");
  },

  start() {
    showScreen("rush");
    Object.assign(this, {
      time: this.START,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      level: 1,
      elapsed: 0,
      missed: new Map(),
      recent: [],
      locked: false,
      lastSec: null,
      over: false,
      activeIdx: 0,
      slots: [],
      typed: [],
      hintIndices: new Set()
    });

    const el = $("#screen-rush");
    el.innerHTML = `<div class="game-head">
        <button class="back-btn" id="rush-quit" style="margin:0">✕ Quit</button>
        <div class="hud">
          <div class="pill">Lv <b id="r-level">1</b></div>
          <div class="pill">x<b id="r-mult">1</b></div>
          <div class="pill">⭐ <b id="r-score">0</b></div>
        </div>
      </div>
      <div class="timer-wrap" id="r-timer">
        <div class="timer-num" id="r-time">${this.START}</div>
        <div class="timer-bar"><i id="r-bar"></i></div>
      </div>
      <div class="combo" id="r-combo"></div>
      
      <div class="card cr-card" id="r-card">
        <div class="cr-meta">
          <span class="chip" id="r-pos"></span>
          <span class="muted" id="r-topic"></span>
        </div>
        <div class="cr-sentence" id="r-sentence"></div>
        <div class="cr-clues" id="r-clues"></div>
      </div>

      <div class="cr-typing-area">
        <div class="cr-slots-container" id="r-slots"></div>
        <div class="cr-actions">
          <button class="btn small" id="r-hint-btn">💡 Hint Letter <small>(−2s)</small></button>
          <button class="btn small" id="r-skip-btn">⏩ Skip <small>(−5s)</small></button>
        </div>
      </div>

      <!-- Virtual Keyboard for mobile / tablet / click -->
      <div class="cr-keyboard" id="r-keyboard">
        <div class="cr-kb-row">
          ${["Q","W","E","R","T","Y","U","I","O","P"].map(k => `<button class="cr-key" data-k="${k}">${k}</button>`).join("")}
        </div>
        <div class="cr-kb-row">
          ${["A","S","D","F","G","H","J","K","L"].map(k => `<button class="cr-key" data-k="${k}">${k}</button>`).join("")}
        </div>
        <div class="cr-kb-row">
          <button class="cr-key wide" data-k="SPACE">SPACE</button>
          ${["Z","X","C","V","B","N","M"].map(k => `<button class="cr-key" data-k="${k}">${k}</button>`).join("")}
          <button class="cr-key wide" data-k="BACK">⌫</button>
        </div>
      </div>`;

    $("#rush-quit").onclick = () => { this.stop(); this.intro(); };
    $("#r-hint-btn").onclick = () => this.useHintLetter();
    $("#r-skip-btn").onclick = () => this.skipCard();

    const triggerKey = (k) => {
      if (k === "BACK") this.handleBackspace();
      else if (k === "SPACE") this.handleSpace();
      else this.handleKey(k);
    };

    $$("#r-keyboard .cr-key").forEach(btn => {
      let lastTap = 0;
      const onAction = (e) => {
        const now = Date.now();
        if (now - lastTap < 60) return;
        lastTap = now;
        if (e.cancelable) e.preventDefault();
        triggerKey(btn.dataset.k);
      };

      btn.addEventListener("pointerdown", onAction, { passive: false });
      btn.addEventListener("click", (e) => {
        if (Date.now() - lastTap > 250) {
          triggerKey(btn.dataset.k);
        }
      });
    });

    this.keyHandler = (e) => {
      if (this.over || this.locked) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        this.handleBackspace();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        this.handleSpace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        this.handleKey(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", this.keyHandler);

    currentCleanup = () => this.stop();
    this.nextCard();
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  },

  stop() {
    this.over = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.keyHandler);
  },

  drain() {
    return Math.min(1.85, 1.0 + (this.level - 1) * 0.15);
  },

  loop(t) {
    if (this.over) return;
    const dt = (t - this.last) / 1000;
    this.last = t;
    this.time -= dt * this.drain();
    this.elapsed += dt;

    if (this.time <= 0) {
      this.time = 0;
      this.renderTimer();
      return this.end();
    }

    const sec = Math.ceil(this.time);
    if (this.time < 10 && sec !== this.lastSec) Sfx.tick();
    this.lastSec = sec;
    this.renderTimer();
    this.raf = requestAnimationFrame((tt) => this.loop(tt));
  },

  renderTimer() {
    $("#r-time").textContent = this.time < 10 ? this.time.toFixed(1) : Math.ceil(this.time);
    $("#r-bar").style.width = Math.min(100, (this.time / 60) * 100) + "%";
    $("#r-timer").classList.toggle("danger", this.time < 10);
  },

  mult() {
    return Math.min(5, 1 + Math.floor(this.combo / 3));
  },

  floatTime(txt, cls) {
    const f = document.createElement("div");
    f.className = `float-time ${cls}`;
    f.textContent = txt;
    $("#r-timer").appendChild(f);
    setTimeout(() => f.remove(), 1000);
  },

  nextCard() {
    const exclude = new Set(this.recent);
    const target = Store.pickWords(1, exclude)[0];
    this.recent.push(target.id);
    if (this.recent.length > 10) this.recent.shift();

    this.card = target;
    this.qStart = performance.now();
    this.locked = false;

    $("#r-pos").textContent = target.pos;
    $("#r-topic").textContent = target.topic ? `• ${target.topic}` : "";
    
    // Format context sentence with animated blank
    const sent = esc(target.context).replace(/___/g, `<span class="cr-blank">[ ________ ]</span>`);
    $("#r-sentence").innerHTML = sent;
    $("#r-clues").innerHTML = `<b>Meaning:</b> ${esc(target.meaning)}<br><b>Synonyms:</b> ${esc(target.synonyms.join(", "))}`;

    this.setupSlots(target.word);
  },

  setupSlots(rawWord) {
    // Parse word/phrase into character objects
    // Punctuation like dashes, spaces, ellipsis are fixed
    this.slots = [];
    this.hintIndices = new Set();
    const chars = [...rawWord.toUpperCase()];
    
    // Determine hint letters for long words or phrases
    // Requirement: "for long words, occasionally 1 or a few letters are giving as hints.
    // Show what letter the user type, for the given letter, they may still have to type to avoid typing mistakes."
    const letterIndices = [];
    chars.forEach((ch, idx) => {
      if (/[A-Z]/.test(ch)) letterIndices.push(idx);
    });

    // User Requirement:
    // 1. For phrases: give the first letter for EACH word.
    // 2. For words longer than 6 letters: also give one hint in the middle (and 1st letter).
    const words = rawWord.split(/\s+/);
    const isPhrase = words.length > 1;

    if (isPhrase) {
      // Give the first letter for each word in the phrase
      let cursor = 0;
      words.forEach(w => {
        // Find position of this word starting from cursor
        const wUpper = w.toUpperCase();
        const startPos = rawWord.toUpperCase().indexOf(wUpper, cursor);
        if (startPos >= 0) {
          // Find first letter inside this word (skipping any leading non-letters like quotes or brackets)
          for (let i = 0; i < w.length; i++) {
            if (/[A-Z]/.test(wUpper[i])) {
              this.hintIndices.add(startPos + i);
              break;
            }
          }
          // If any individual word in the phrase has > 6 letters, also reveal a middle hint for it
          const subLetters = [];
          for (let i = 0; i < w.length; i++) {
            if (/[A-Z]/.test(wUpper[i])) subLetters.push(startPos + i);
          }
          if (subLetters.length > 6) {
            const midLetterIdx = subLetters[Math.floor(subLetters.length / 2)];
            this.hintIndices.add(midLetterIdx);
          }
          cursor = startPos + w.length;
        }
      });
    } else {
      // Single word
      if (letterIndices.length > 6) {
        // Longer than 6 letters: give first letter AND one in the middle
        if (letterIndices.length > 0) this.hintIndices.add(letterIndices[0]);
        const midIdx = letterIndices[Math.floor(letterIndices.length / 2)];
        this.hintIndices.add(midIdx);
      }
    }

    this.typed = [];
    chars.forEach((ch, idx) => {
      const isLetter = /[A-Z]/.test(ch);
      this.slots.push({
        ch,
        isLetter,
        isHint: this.hintIndices.has(idx),
        typedCh: isLetter ? null : ch,
        correct: !isLetter
      });
      this.typed.push(isLetter ? "" : ch);
    });

    // Set active cursor to the first unsolved letter
    this.activeIdx = this.slots.findIndex(s => s.isLetter);
    this.renderSlots();
  },

  renderSlots() {
    const container = $("#r-slots");
    const existingSlots = container.querySelectorAll(".cr-slot[data-idx]");

    // High performance in-place DOM update if slots already built
    if (existingSlots.length > 0 && existingSlots.length === this.slots.filter(s => s.ch !== " ").length) {
      existingSlots.forEach(el => {
        const idx = +el.dataset.idx;
        const s = this.slots[idx];
        if (!s) return;
        const isActive = idx === this.activeIdx;
        const isDone = s.correct && s.typedCh;
        const isHint = s.isHint;
        const displayChar = s.typedCh || (isHint ? s.ch : "");

        let cls = "cr-slot";
        if (isActive) cls += " active";
        if (isDone) cls += " correct";
        if (isHint) cls += " hint-slot";
        if (s.hasError) cls += " error";
        if (el.className !== cls) el.className = cls;

        const charEl = el.querySelector(".cr-char");
        if (charEl && charEl.textContent !== displayChar) {
          charEl.textContent = displayChar;
        }

        const badge = el.querySelector(".cr-hint-badge");
        if (isHint && !isDone) {
          if (!badge) el.insertAdjacentHTML("beforeend", '<span class="cr-hint-badge">HINT</span>');
        } else if (badge) {
          badge.remove();
        }
      });
      return;
    }

    // Initial card setup: build slot elements
    let wordsHtml = [];
    let curWordHtml = [];

    this.slots.forEach((s, idx) => {
      if (s.ch === " ") {
        if (curWordHtml.length) {
          wordsHtml.push(`<div class="cr-word-group">${curWordHtml.join("")}</div>`);
          curWordHtml = [];
        }
        wordsHtml.push(`<div class="cr-space-sep"></div>`);
        return;
      }

      if (!s.isLetter) {
        // Punctuation like dash or dot
        curWordHtml.push(`<div class="cr-slot punct" data-idx="${idx}">${esc(s.ch)}</div>`);
        return;
      }

      const isActive = idx === this.activeIdx;
      const isDone = s.correct && s.typedCh;
      const isHint = s.isHint;
      const displayChar = s.typedCh || (isHint ? s.ch : "");

      let cls = "cr-slot";
      if (isActive) cls += " active";
      if (isDone) cls += " correct";
      if (isHint) cls += " hint-slot";
      if (s.hasError) cls += " error";

      curWordHtml.push(`
        <div class="${cls}" data-idx="${idx}">
          <span class="cr-char">${esc(displayChar)}</span>
          ${isHint && !isDone ? '<span class="cr-hint-badge">HINT</span>' : ''}
        </div>
      `);
    });

    if (curWordHtml.length) {
      wordsHtml.push(`<div class="cr-word-group">${curWordHtml.join("")}</div>`);
    }

    container.innerHTML = wordsHtml.join("");
  },

  handleKey(key) {
    if (this.locked || this.over) return;
    if (this.activeIdx < 0 || this.activeIdx >= this.slots.length) return;

    const slot = this.slots[this.activeIdx];
    if (!slot.isLetter) {
      this.advanceCursor();
      return this.handleKey(key);
    }

    // Check if the typed key matches the expected character
    if (key === slot.ch) {
      slot.typedCh = key;
      slot.correct = true;
      slot.hasError = false;
      Sfx.click();
      this.advanceCursor();
      this.renderSlots();
      this.checkCompletion();
    } else {
      // Typing mistake!
      // Show error on the active slot so user sees the mistake and can re-type
      slot.typedCh = key;
      slot.hasError = true;
      Sfx.wrong();
      this.renderSlots();
      // Clear after brief visual indicator
      setTimeout(() => {
        if (!this.locked && !this.over && slot.hasError) {
          slot.typedCh = null;
          slot.hasError = false;
          this.renderSlots();
        }
      }, 450);
    }
  },

  handleBackspace() {
    if (this.locked || this.over) return;
    
    // Find previous letter slot
    let prev = this.activeIdx - 1;
    while (prev >= 0 && !this.slots[prev].isLetter) {
      prev--;
    }

    if (prev >= 0) {
      const target = this.slots[this.activeIdx].hasError ? this.slots[this.activeIdx] : this.slots[prev];
      target.typedCh = null;
      target.correct = false;
      target.hasError = false;
      this.activeIdx = this.slots[this.activeIdx].hasError ? this.activeIdx : prev;
      Sfx.click();
      this.renderSlots();
    } else if (this.activeIdx >= 0 && this.slots[this.activeIdx].hasError) {
      this.slots[this.activeIdx].typedCh = null;
      this.slots[this.activeIdx].hasError = false;
      this.renderSlots();
    }
  },

  handleSpace() {
    if (this.locked || this.over) return;
    // If currently on a non-letter (space or punctuation), advance to next letter
    if (this.activeIdx < this.slots.length && !this.slots[this.activeIdx].isLetter) {
      this.advanceCursor();
      this.renderSlots();
    }
    // If already on a letter, do nothing so letters are never accidentally skipped
  },

  advanceCursor() {
    let next = this.activeIdx + 1;
    while (next < this.slots.length && (!this.slots[next].isLetter || (this.slots[next].correct && this.slots[next].typedCh))) {
      next++;
    }
    this.activeIdx = next;
  },

  useHintLetter() {
    if (this.locked || this.over) return;
    
    // Find either:
    // 1) An unsolved letter that hasn't been revealed as a hint yet (prioritize current cursor, then subsequent)
    let targetIdx = -1;
    if (this.activeIdx >= 0 && this.activeIdx < this.slots.length && this.slots[this.activeIdx].isLetter && !this.slots[this.activeIdx].correct && !this.slots[this.activeIdx].isHint) {
      targetIdx = this.activeIdx;
    } else {
      // Find first unsolved letter that is not already marked as hint
      targetIdx = this.slots.findIndex(s => s.isLetter && !s.correct && !s.isHint);
    }

    // If all remaining unsolved letters are already hinted, then auto-fill the current active letter!
    if (targetIdx === -1) {
      targetIdx = this.slots.findIndex(s => s.isLetter && !s.correct);
      if (targetIdx >= 0) {
        const slot = this.slots[targetIdx];
        slot.typedCh = slot.ch;
        slot.correct = true;
        slot.hasError = false;
        this.time = Math.max(1, this.time - 2);
        this.floatTime("−2s", "minus");
        Sfx.correct(1);
        this.advanceCursor();
        this.renderSlots();
        this.checkCompletion();
        return;
      }
    }

    if (targetIdx >= 0) {
      const slot = this.slots[targetIdx];
      slot.isHint = true;
      this.time = Math.max(1, this.time - 2);
      this.floatTime("−2s", "minus");
      Sfx.click();
      this.renderSlots();
      // Briefly animate the newly hinted slot
      const el = $(`#r-slots .cr-slot[data-idx="${targetIdx}"]`);
      if (el) {
        el.style.transform = "scale(1.2)";
        setTimeout(() => { if (el) el.style.transform = ""; }, 250);
      }
    }
  },

  skipCard() {
    if (this.locked || this.over) return;
    this.locked = true;
    this.time = Math.max(1, this.time - 5);
    this.floatTime("−5s", "minus");
    this.combo = 0;
    $("#r-combo").innerHTML = "";
    Sfx.wrong();
    
    // Reveal all letters
    this.slots.forEach(s => {
      s.typedCh = s.ch;
      s.correct = true;
    });
    this.renderSlots();
    this.missed.set(this.card.id, this.card);
    Store.review(this.card.id, 1);

    setTimeout(() => {
      if (!this.over) this.nextCard();
    }, 1200);
  },

  checkCompletion() {
    const allDone = this.slots.every(s => !s.isLetter || s.correct);
    if (!allDone) return;

    this.locked = true;
    const rt = (performance.now() - this.qStart) / 1000;
    this.combo++;
    this.correct++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    // Calculate time addition
    const add = Math.min(8, this.BASE_ADD + Math.floor(this.combo / 3));
    const speedBonus = rt < 5.0 ? 80 : rt < 8.0 ? 30 : 0;
    const gained = 120 * this.mult() + speedBonus;

    this.time += add;
    this.score += gained;
    this.floatTime(`+${add}s`, "plus");
    Sfx.correct(this.combo);
    Fx.confetti(40, innerWidth / 2, innerHeight / 2.5);

    Store.review(this.card.id, rt < 6 ? 5 : 4);

    if (this.combo >= 2) {
      $("#r-combo").innerHTML = `<span>🔥 ${this.combo} COMBO! (+${add}s)</span>`;
    }
    if (this.combo === 5) Store.unlock("combo10");
    if (this.combo === 15) Store.unlock("combo25");
    if (this.correct % 4 === 0) this.levelUp();

    $("#r-score").textContent = fmt(this.score);
    $("#r-mult").textContent = this.mult();

    setTimeout(() => {
      if (!this.over) this.nextCard();
    }, 380);
  },

  levelUp() {
    this.level++;
    $("#r-level").textContent = this.level;
    Sfx.levelup();
    const b = document.createElement("div");
    b.className = "level-banner";
    b.innerHTML = `<span>LEVEL ${this.level}</span><div style="font-size:1rem;color:var(--muted);font-weight:600">The clock drains faster!</div>`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  },

  end() {
    this.stop();
    if (this.score >= 2000) Store.unlock("rush2k");
    if (this.elapsed >= 90) Store.unlock("marathon");
    if (this.score >= 1000) Store.quest("rush");

    showResults({
      mode: "rush",
      emoji: this.score >= 2000 ? "⚡" : this.score >= 1000 ? "🔥" : "⏰",
      title: "Time's Up!",
      score: this.score,
      xp: Math.max(20, Math.round(this.score / 8)),
      stats: [
        ["Solved", this.correct],
        ["Max Combo", `${this.maxCombo}x`],
        ["Survived", `${Math.round(this.elapsed)}s`],
        ["Level Reached", this.level]
      ],
      review: [...this.missed.values()],
      replay: () => this.start()
    });
  }
};
