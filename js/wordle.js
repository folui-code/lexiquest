/* ===================================================================
   MODE 2 — LEXIWORDLE (Academic Wordle)
   Deductive letter guessing in 6 attempts with color feedback.
   Targets are HKDSE Band 1 academic words.
   Daily Puzzle (same for the whole class) + Unlimited Practice.
   =================================================================== */
const Wordle = {
  MAX_GUESSES: 6,
  validGuessesSet: null,

  initDictionary() {
    if (!this.validGuessesSet) {
      this.validGuessesSet = new Set(
        (window.WORDLE_VALID_GUESSES || []).map(w => w.toUpperCase())
      );
      (window.WORDLE_TARGETS || []).forEach(t => {
        this.validGuessesSet.add(t.word.toUpperCase());
      });
    }
  },

  intro() {
    this.initDictionary();
    const dailyState = Store.d.daily.wordle;
    const el = $("#screen-wordle");
    el.innerHTML = `<button class="back-btn" id="wordle-back">← Home</button>
      <div class="card intro">
        <div class="mode-icon" style="background:linear-gradient(135deg, #10b981, #059669)">🟩</div>
        <h1>LexiWordle</h1>
        <p class="muted">Academic Wordle for Band 1 Scholars.</p>
        <ul>
          <li>🎯 Guess the secret <b>academic word</b> in <b>6 tries</b></li>
          <li>🟩 <b>Green:</b> Letter is in the word and in the correct spot</li>
          <li>🟨 <b>Yellow:</b> Letter is in the word but in the wrong spot</li>
          <li>⬛ <b>Dark Gray:</b> Letter is not in the word</li>
          <li>💡 Stuck? Tap the <b>Clue</b> button for the definition</li>
          <li>📅 <b>Daily Wordle</b> is identical for your whole class!</li>
        </ul>
        <div class="row">
          <button class="btn" style="background:#10b981;color:#fff;border:none" id="wordle-daily" ${dailyState ? "disabled" : ""}>
            📅 ${dailyState ? "Daily Solved ✓" : "Daily Wordle"}
          </button>
          <button class="btn" id="wordle-practice">🎲 Practice</button>
        </div>
        ${dailyState ? `<div class="share-grid" style="margin-top:14px">${dailyState.grid}</div><p class="muted">Come back tomorrow for a new Daily Wordle!</p>` : ""}
      </div>`;

    $("#wordle-back").onclick = () => showScreen("home");
    $("#wordle-daily").onclick = () => this.start(true);
    $("#wordle-practice").onclick = () => this.start(false);
    showScreen("wordle");
  },

  pickTarget(daily) {
    const list = window.WORDLE_TARGETS || [];
    if (daily) {
      const rng = seededRng("wordle-" + todayKey());
      const idx = Math.floor(rng() * list.length);
      return list[idx];
    }
    return list[Math.floor(Math.random() * list.length)];
  },

  start(daily) {
    this.initDictionary();
    showScreen("wordle");
    const targetObj = this.pickTarget(daily);
    this.target = targetObj.word.toUpperCase();
    this.targetData = targetObj;
    this.wordLen = this.target.length;
    this.daily = daily;

    Object.assign(this, {
      guesses: [],
      currentGuess: "",
      statuses: {}, // letter -> 'correct' | 'present' | 'absent'
      over: false,
      won: false,
      clueRevealed: false
    });

    const el = $("#screen-wordle");
    el.innerHTML = `
      <div class="game-head">
        <button class="back-btn" id="wordle-quit" style="margin:0">✕ Quit</button>
        <h1>${daily ? "📅 Daily Wordle" : "🎲 Practice Wordle"}</h1>
        <div class="hud">
          <button class="pill icon-btn" id="wordle-clue-btn" title="Show meaning clue">💡 Clue</button>
        </div>
      </div>

      <div class="w-hint-box hidden" id="w-hint-box"></div>

      <div class="w-board-wrap">
        <div class="w-board" id="w-board" style="--cols:${this.wordLen}"></div>
      </div>

      <div class="w-keyboard" id="w-keyboard">
        <div class="w-kb-row">
          ${["Q","W","E","R","T","Y","U","I","O","P"].map(k => `<button class="w-key" data-k="${k}">${k}</button>`).join("")}
        </div>
        <div class="w-kb-row">
          ${["A","S","D","F","G","H","J","K","L"].map(k => `<button class="w-key" data-k="${k}">${k}</button>`).join("")}
        </div>
        <div class="w-kb-row">
          <button class="w-key wide" data-k="ENTER">ENTER</button>
          ${["Z","X","C","V","B","N","M"].map(k => `<button class="w-key" data-k="${k}">${k}</button>`).join("")}
          <button class="w-key wide" data-k="BACK">⌫</button>
        </div>
      </div>
    `;

    $("#wordle-quit").onclick = () => this.intro();
    $("#wordle-clue-btn").onclick = () => this.toggleClue();

    $$("#w-keyboard .w-key").forEach(b => {
      b.onclick = () => {
        const k = b.dataset.k;
        if (k === "ENTER") this.submitGuess();
        else if (k === "BACK") this.removeLetter();
        else this.addLetter(k);
      };
    });

    this.keyHandler = (e) => {
      if (this.over) return;
      if (e.key === "Enter") {
        e.preventDefault();
        this.submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        this.removeLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        this.addLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", this.keyHandler);
    currentCleanup = () => window.removeEventListener("keydown", this.keyHandler);

    this.renderBoard();
  },

  toggleClue() {
    this.clueRevealed = true;
    const box = $("#w-hint-box");
    box.classList.remove("hidden");
    box.innerHTML = `<b>${esc(this.targetData.pos)}:</b> ${esc(this.targetData.meaning)}`;
    Sfx.click();
  },

  renderBoard() {
    const board = $("#w-board");
    let rowsHtml = "";

    for (let r = 0; r < this.MAX_GUESSES; r++) {
      const isCurrentRow = r === this.guesses.length;
      const guess = this.guesses[r] || (isCurrentRow ? this.currentGuess : "");
      
      let cellsHtml = "";
      for (let c = 0; c < this.wordLen; c++) {
        const ch = guess[c] || "";
        let cellClass = "w-cell";
        if (ch) cellClass += " filled";
        
        // If this row was already submitted, evaluate status
        if (r < this.guesses.length) {
          const evalRes = this.evaluateRow(this.guesses[r]);
          cellClass += " " + evalRes[c];
        }

        cellsHtml += `<div class="${cellClass}"><span class="w-cell-char">${ch}</span></div>`;
      }
      rowsHtml += `<div class="w-row ${isCurrentRow ? "active-row" : ""}">${cellsHtml}</div>`;
    }

    board.innerHTML = rowsHtml;
  },

  addLetter(letter) {
    if (this.over) return;
    if (this.currentGuess.length < this.wordLen) {
      this.currentGuess += letter;
      Sfx.click();
      this.renderBoard();
    }
  },

  removeLetter() {
    if (this.over) return;
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      Sfx.click();
      this.renderBoard();
    }
  },

  evaluateRow(guess) {
    const targetArr = [...this.target];
    const guessArr = [...guess];
    const res = Array(this.wordLen).fill("absent");
    const counts = {};

    targetArr.forEach(ch => counts[ch] = (counts[ch] || 0) + 1);

    // Pass 1: find correct letters
    for (let i = 0; i < this.wordLen; i++) {
      if (guessArr[i] === targetArr[i]) {
        res[i] = "correct";
        counts[guessArr[i]]--;
      }
    }

    // Pass 2: find present letters
    for (let i = 0; i < this.wordLen; i++) {
      if (res[i] === "correct") continue;
      const ch = guessArr[i];
      if (counts[ch] > 0) {
        res[i] = "present";
        counts[ch]--;
      }
    }

    return res;
  },

  submitGuess() {
    if (this.over) return;
    if (this.currentGuess.length !== this.wordLen) {
      toast(`Word must be ${this.wordLen} letters!`);
      this.shakeRow();
      Sfx.wrong();
      return;
    }

    // Check dictionary validity
    const guess = this.currentGuess;
    if (!this.validGuessesSet.has(guess)) {
      toast("Not in academic dictionary!");
      this.shakeRow();
      Sfx.wrong();
      return;
    }

    const rowIdx = this.guesses.length;
    this.guesses.push(guess);
    const evalRes = this.evaluateRow(guess);

    // Update keyboard statuses
    evalRes.forEach((st, idx) => {
      const ch = guess[idx];
      const cur = this.statuses[ch];
      if (st === "correct") {
        this.statuses[ch] = "correct";
      } else if (st === "present" && cur !== "correct") {
        this.statuses[ch] = "present";
      } else if (!cur) {
        this.statuses[ch] = "absent";
      }
    });

    this.currentGuess = "";
    this.animateRowFlip(rowIdx, evalRes, () => {
      this.updateKeyboard();
      if (guess === this.target) {
        this.won = true;
        this.end();
      } else if (this.guesses.length >= this.MAX_GUESSES) {
        this.won = false;
        this.end();
      }
    });
  },

  shakeRow() {
    const curRow = $$(".w-row")[this.guesses.length];
    if (curRow) {
      curRow.classList.remove("shake");
      void curRow.offsetWidth;
      curRow.classList.add("shake");
    }
  },

  animateRowFlip(rowIdx, evalRes, onDone) {
    const rowEl = $$(".w-row")[rowIdx];
    if (!rowEl) return onDone();
    const cells = $$(".w-cell", rowEl);

    cells.forEach((cell, idx) => {
      setTimeout(() => {
        cell.classList.add("flip");
        setTimeout(() => {
          cell.classList.add(evalRes[idx]);
          if (idx === cells.length - 1) {
            setTimeout(onDone, 300);
          }
        }, 250);
      }, idx * 120);
    });
  },

  updateKeyboard() {
    $$("#w-keyboard .w-key").forEach(k => {
      const ch = k.dataset.k;
      const st = this.statuses[ch];
      if (st) {
        k.className = `w-key ${st}`;
      }
    });
  },

  shareGrid() {
    const em = { correct: "🟩", present: "🟨", absent: "⬛" };
    return this.guesses.map(g => {
      return this.evaluateRow(g).map(s => em[s]).join("");
    }).join("<br>");
  },

  end() {
    this.over = true;
    window.removeEventListener("keydown", this.keyHandler);

    const tries = this.guesses.length;
    const score = this.won ? Math.max(100, 700 - (tries - 1) * 100) : 0;
    const xp = this.won ? 50 + (this.MAX_GUESSES - tries + 1) * 15 : 15;

    if (this.daily) {
      Store.d.daily.wordle = {
        won: this.won,
        grid: this.shareGrid(),
        tries
      };
      Store.save();
      if (this.won) Store.quest("wordle");
    }

    if (this.won) {
      Store.unlock("wordleWin");
      if (tries <= 3) Store.unlock("wordleGenius");
      Sfx.correct(5);
      Fx.confetti(120);
    } else {
      Sfx.wrong();
    }

    const tData = this.targetData;
    const grid = this.shareGrid();

    showResults({
      mode: "wordle",
      emoji: this.won ? (tries <= 2 ? "🎯" : tries <= 4 ? "🟩" : "😅") : "🫠",
      title: this.won ? `Cracked in ${tries}/${this.MAX_GUESSES}!` : `The word was: ${this.target}`,
      score,
      xp,
      stats: [
        ["Tries", this.won ? `${tries}/6` : "X/6"],
        ["Target Word", this.target],
        ["Status", this.won ? "Solved ✓" : "Unsolved"]
      ],
      review: [{
        word: tData.word,
        pos: tData.pos,
        meaning: tData.meaning,
        context: tData.example,
        synonyms: []
      }],
      replay: () => this.start(false)
    });

    // Add Wordle share box to results screen
    $(".results .stat-row").insertAdjacentHTML("afterend", `
      <div class="card" style="margin:16px 0;text-align:center">
        <h4 style="margin-bottom:8px">LexiWordle Breakdown</h4>
        <div class="share-grid" style="letter-spacing:4px;font-size:1.8rem;line-height:1.3">${grid}</div>
        <button class="btn small primary" id="w-share-btn" style="margin-top:12px">📋 Copy Emoji Grid</button>
      </div>
    `);

    $("#w-share-btn").onclick = () => {
      const shareText = `LexiWordle ${todayKey()} ${this.won ? tries : "X"}/6\n\n` + grid.replace(/<br>/g, "\n");
      navigator.clipboard?.writeText(shareText);
      toast("Wordle grid copied! Share with your class 📤");
    };
  }
};
