/* ===================================================================
   MODE 1 — CRYPTIC RUSH (Scrambled Tile Bank / Anagram Mode)
   - Fast-paced contextual deduction under time pressure.
   - For single words: Scrambled letter tiles (unscramble the letters).
   - For phrases: Scrambled word tiles (arrange words in syntactic order).
   - Desktop: Click tiles or type on physical keyboard.
   - Mobile: Zero-lag tactile tap on large scrambled tiles.
   - Correct answers ADD time (+4s to +8s with combos).
   =================================================================== */

const Rush = {
  START: 60,
  BASE_ADD: 4,

  intro() {
    const el = $("#screen-rush");
    el.innerHTML = `
      <button class="back-btn" id="rush-back">← Home</button>
      <div class="card intro">
        <div class="mode-icon" style="background:var(--g-rush)">⚡</div>
        <h1>Cryptic Rush</h1>
        <p class="muted">Contextual deduction meets ticking adrenaline.</p>
        <ul>
          <li>⏳ You start with <b>${this.START}s</b> on the clock</li>
          <li>📝 Read the context sentence &amp; deduce the missing academic expression</li>
          <li>🧩 <b>Unscramble the tiles:</b> Scrambled word-by-word with the 1st letter hint pre-pressed</li>
          <li>💻 <b>Desktop:</b> Click tiles or type on your physical keyboard</li>
          <li>📱 <b>Phone:</b> Tap the scrambled tiles — fast, tactile, zero typing lag!</li>
          <li>💡 <b>Hint (−2s):</b> Autoplaces the next tile · <b>⌫ Undo:</b> Returns last tile</li>
          <li>✅ Each solved expression adds <b style="color:var(--emerald)">+${this.BASE_ADD}s to +8s</b> to your clock</li>
          <li>⚡ Build combos to multiply your score &amp; survive higher speed levels</li>
        </ul>
        <div class="row"><button class="btn rush" id="rush-start">▶ Start Rush</button></div>
        <p class="muted" style="margin-top:14px">Personal Best: ${fmt(Store.d.best.rush || 0)} pts</p>
      </div>
    `;
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
      tiles: [],
      isPhrase: false
    });

    const el = $("#screen-rush");
    el.innerHTML = `
      <div class="game-head">
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
          <button class="btn small" id="r-hint-btn">💡 Hint <small>(−2s)</small></button>
          <button class="btn small" id="r-undo-btn">⌫ Undo</button>
          <button class="btn small" id="r-skip-btn">⏩ Skip <small>(−5s)</small></button>
        </div>
      </div>

      <!-- Scrambled Tiles Bank (Letter tiles for words, Word tiles for phrases) -->
      <div class="cr-tile-bank-wrap">
        <div class="cr-tiles-bank" id="r-tiles"></div>
      </div>
    `;

    $("#rush-quit").onclick = () => { this.stop(); this.intro(); };
    $("#r-hint-btn").onclick = () => this.useHintLetter();
    $("#r-undo-btn").onclick = () => this.handleBackspace();
    $("#r-skip-btn").onclick = () => this.skipCard();

    // Physical desktop keyboard support
    this.keyHandler = (e) => {
      if (this.over || this.locked) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        this.handleBackspace();
      } else if (e.key.length === 1 && /[a-zA-Z0-9'-]/.test(e.key)) {
        e.preventDefault();
        this.handleKey(e.key);
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
    this.slots = [];
    this.tiles = [];
    this.activeIdx = 0;

    const trimmed = rawWord.trim();
    const words = trimmed.split(/\s+/);
    this.isPhrase = words.length > 1;

    let globalSlotId = 0;
    let globalTileId = 0;

    words.forEach((w, wIdx) => {
      const chars = [...w.toUpperCase()];
      const wordLetterTiles = [];
      let firstLetterSlot = null;

      chars.forEach((ch) => {
        const isLetter = /[A-Z0-9]/.test(ch);
        const slot = {
          id: globalSlotId++,
          wIdx: wIdx,
          ch: ch,
          norm: ch,
          isLetter: isLetter,
          typedCh: isLetter ? null : ch,
          tileId: null,
          correct: !isLetter,
          isHint: false,
          hasError: false
        };
        this.slots.push(slot);

        if (isLetter) {
          const tile = {
            id: globalTileId++,
            wIdx: wIdx,
            val: ch,
            norm: ch,
            used: false,
            isHint: false
          };
          wordLetterTiles.push(tile);
          if (!firstLetterSlot) {
            firstLetterSlot = slot;
          }
        }
      });

      // Scramble letter tiles for this word
      const scrambled = this.scrambleWordTiles(wordLetterTiles);

      // Pre-fill the first letter of this word as a hint
      // Its virtual keyboard key will be pre-pressed and cannot be clicked
      if (firstLetterSlot && wordLetterTiles.length > 0) {
        const hintTile = scrambled.find(t => t.val === firstLetterSlot.norm && !t.used);
        if (hintTile) {
          hintTile.used = true;
          hintTile.isHint = true;
          firstLetterSlot.typedCh = hintTile.val;
          firstLetterSlot.tileId = hintTile.id;
          firstLetterSlot.correct = true;
          firstLetterSlot.isHint = true;
        }
      }

      this.tiles.push(...scrambled);
    });

    // Advance cursor to first unsolved slot
    this.advanceCursorToStart();

    // Render slots & tiles
    this.renderSlots();
    this.renderTiles();
  },

  advanceCursorToStart() {
    const firstUnsolved = this.slots.findIndex(s => s.isLetter && !s.correct);
    this.activeIdx = firstUnsolved !== -1 ? firstUnsolved : 0;
  },

  scrambleWordTiles(wordTiles) {
    if (wordTiles.length <= 1) return [...wordTiles];
    if (wordTiles.length === 2) {
      // e.g. "AT" -> "T A"
      return [wordTiles[1], wordTiles[0]];
    }
    const originalStr = wordTiles.map(t => t.val).join("");
    const firstVal = wordTiles[0].val;
    let arr = [...wordTiles];
    let attempts = 0;
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      attempts++;
    } while (attempts < 30 && (arr.map(t => t.val).join("") === originalStr || arr[0].val === firstVal));

    // Ensure scrambled word tiles do not match original string or start with original first letter
    if (arr.map(t => t.val).join("") === originalStr || arr[0].val === firstVal) {
      arr.push(arr.shift());
    }
    return arr;
  },

  renderSlots() {
    const container = $("#r-slots");
    if (!container) return;

    // Group slots by wIdx
    const wordGroups = [];
    let curGroup = [];
    let lastWIdx = null;

    this.slots.forEach((s) => {
      if (lastWIdx !== null && s.wIdx !== lastWIdx) {
        if (curGroup.length) wordGroups.push(curGroup);
        curGroup = [];
      }
      lastWIdx = s.wIdx;
      curGroup.push(s);
    });
    if (curGroup.length) wordGroups.push(curGroup);

    let html = [];
    wordGroups.forEach((group, gIdx) => {
      if (gIdx > 0) {
        html.push(`<div class="cr-space-sep"></div>`);
      }
      let groupHtml = `<div class="cr-word-group">`;
      group.forEach((s) => {
        if (!s.isLetter) {
          groupHtml += `<div class="cr-slot punct" data-idx="${s.id}">${esc(s.ch)}</div>`;
          return;
        }
        const isActive = s.id === this.activeIdx;
        const isDone = s.correct && s.typedCh !== null;
        const isHint = s.isHint;
        const display = s.typedCh || "";

        let cls = "cr-slot";
        if (isActive) cls += " active";
        if (isDone) cls += " correct";
        if (isHint) cls += " hint-slot";
        if (s.hasError) cls += " error";
        if (display && !isHint) cls += " has-content";

        groupHtml += `
          <div class="${cls}" data-idx="${s.id}" title="${display && !isHint ? "Tap to remove" : ""}">
            <span class="cr-char">${esc(display)}</span>
            ${isHint ? '<span class="cr-hint-badge">HINT</span>' : ''}
          </div>
        `;
      });
      groupHtml += `</div>`;
      html.push(groupHtml);
    });

    container.innerHTML = html.join("");

    // Clicking any non-hint filled slot returns the tile back to the bank
    $$("#r-slots .cr-slot[data-idx]").forEach(slotEl => {
      slotEl.onclick = () => {
        const idx = +slotEl.dataset.idx;
        this.unpickSlot(idx);
      };
    });
  },

  renderTiles() {
    const container = $("#r-tiles");
    if (!container) return;

    // Group tiles by wIdx so scrambled words are neatly arranged
    const wordGroups = [];
    let curGroup = [];
    let lastWIdx = null;

    this.tiles.forEach(t => {
      if (lastWIdx !== null && t.wIdx !== lastWIdx) {
        if (curGroup.length) wordGroups.push(curGroup);
        curGroup = [];
      }
      lastWIdx = t.wIdx;
      curGroup.push(t);
    });
    if (curGroup.length) wordGroups.push(curGroup);

    let html = [];
    wordGroups.forEach((group, gIdx) => {
      if (gIdx > 0) {
        html.push(`<div class="cr-tile-group-sep"></div>`);
      }
      let groupHtml = `<div class="cr-tile-group">`;
      group.forEach(t => {
        let cls = "cr-tile";
        if (t.used) cls += " used";
        if (t.isHint) cls += " hint-tile";
        groupHtml += `<button class="${cls}" data-tid="${t.id}" ${t.used ? "disabled" : ""}>${esc(t.val)}</button>`;
      });
      groupHtml += `</div>`;
      html.push(groupHtml);
    });

    container.innerHTML = html.join("");

    // Zero-lag touch listeners
    $$("#r-tiles .cr-tile:not(.used)").forEach(btn => {
      let lastTap = 0;
      const onAction = (e) => {
        const now = Date.now();
        if (now - lastTap < 80) return;
        lastTap = now;
        if (e.cancelable) e.preventDefault();
        const tid = +btn.dataset.tid;
        this.pickTile(tid);
      };

      btn.addEventListener("pointerdown", onAction, { passive: false });
      btn.addEventListener("click", onAction);
    });
  },

  pickTile(tileId) {
    if (this.locked || this.over) return;
    const tile = this.tiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;

    if (this.activeIdx < 0 || this.activeIdx >= this.slots.length) return;
    const slot = this.slots[this.activeIdx];
    if (!slot || !slot.isLetter || slot.correct) return;

    // Matching condition: same letter character
    if (tile.norm === slot.norm) {
      tile.used = true;
      slot.typedCh = tile.val;
      slot.tileId = tile.id;
      slot.correct = true;
      slot.hasError = false;
      Sfx.click();

      this.advanceCursor();
      this.renderSlots();
      this.renderTiles();
      this.checkCompletion();
    } else {
      // Wrong tile placed
      slot.hasError = true;
      Sfx.wrong();
      this.renderSlots();
      setTimeout(() => {
        if (!this.locked && !this.over && slot.hasError) {
          slot.hasError = false;
          this.renderSlots();
        }
      }, 400);
    }
  },

  unpickSlot(idx) {
    if (this.locked || this.over) return;
    const slot = this.slots[idx];
    if (!slot || slot.typedCh === null || slot.isHint) return; // hints cannot be unpicked!

    if (slot.tileId !== null) {
      const tile = this.tiles.find(t => t.id === slot.tileId);
      if (tile) tile.used = false;
    }
    slot.typedCh = null;
    slot.tileId = null;
    slot.correct = false;
    slot.hasError = false;
    this.activeIdx = idx;
    Sfx.click();

    this.renderSlots();
    this.renderTiles();
  },

  handleBackspace() {
    if (this.locked || this.over) return;

    // Find previous filled non-hint slot
    let targetIdx = this.activeIdx - 1;
    while (targetIdx >= 0) {
      const s = this.slots[targetIdx];
      if (s.isLetter && !s.isHint && s.typedCh !== null) {
        break;
      }
      targetIdx--;
    }

    if (targetIdx < 0) {
      if (this.slots[this.activeIdx] && this.slots[this.activeIdx].hasError) {
        this.slots[this.activeIdx].hasError = false;
        this.renderSlots();
      }
      return;
    }

    this.unpickSlot(targetIdx);
  },

  handleKey(rawKey) {
    if (this.locked || this.over) return;
    const key = rawKey.toUpperCase();

    if (this.activeIdx < 0 || this.activeIdx >= this.slots.length) return;
    const slot = this.slots[this.activeIdx];
    if (!slot || !slot.isLetter || slot.correct) return;

    if (key === slot.norm) {
      // Match unused tile for this letter (prefer same word group first)
      const match = this.tiles.find(t => !t.used && t.wIdx === slot.wIdx && t.norm === key)
                 || this.tiles.find(t => !t.used && t.norm === key);
      if (match) {
        this.pickTile(match.id);
        return;
      }
    }

    // Wrong key typed
    slot.hasError = true;
    Sfx.wrong();
    this.renderSlots();
    setTimeout(() => {
      if (!this.locked && !this.over && slot.hasError) {
        slot.hasError = false;
        this.renderSlots();
      }
    }, 400);
  },

  advanceCursor() {
    let next = this.activeIdx + 1;
    while (next < this.slots.length && (!this.slots[next].isLetter || (this.slots[next].correct && this.slots[next].typedCh !== null))) {
      next++;
    }
    if (next >= this.slots.length) {
      const firstUnsolved = this.slots.findIndex(s => s.isLetter && !s.correct);
      next = firstUnsolved !== -1 ? firstUnsolved : this.slots.length;
    }
    this.activeIdx = next;
  },

  useHintLetter() {
    if (this.locked || this.over) return;

    // Find first unsolved slot
    const targetIdx = this.slots.findIndex(s => s.isLetter && !s.correct);
    if (targetIdx === -1) return;

    const slot = this.slots[targetIdx];
    // Find unused tile matching this slot
    const tile = this.tiles.find(t => !t.used && t.wIdx === slot.wIdx && t.norm === slot.norm)
              || this.tiles.find(t => !t.used && t.norm === slot.norm);

    if (tile) {
      tile.used = true;
      tile.isHint = true;
      slot.typedCh = tile.val;
      slot.tileId = tile.id;
      slot.correct = true;
      slot.isHint = true;
      slot.hasError = false;

      this.time = Math.max(1, this.time - 2);
      this.floatTime("−2s", "minus");
      Sfx.click();

      this.advanceCursor();
      this.renderSlots();
      this.renderTiles();
      this.checkCompletion();
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
    
    // Reveal all slots
    this.slots.forEach(s => {
      s.typedCh = s.ch;
      s.correct = true;
    });
    this.tiles.forEach(t => t.used = true);
    this.renderSlots();
    this.renderTiles();
    this.missed.set(this.card.id, this.card);
    Store.review(this.card.id, 1);

    setTimeout(() => {
      if (!this.over) this.nextCard();
    }, 1200);
  },

  checkCompletion() {
    const allDone = this.slots.every(s => !s.isLetter || (s.correct && s.typedCh !== null));
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
    }, 450);
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
