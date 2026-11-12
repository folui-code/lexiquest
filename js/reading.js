/* ===================================================================
   LexiQuest - Reading Oracle (HKDSE Daily Reading Challenge)
   Starts from 7 Nov 2026.
   Auto-locking for future dates (8 Nov onwards unlock automatically on their date).
   No line numbers: clean responsive paragraphs with bold & asterisk markers.
   Allows seamless back-and-forth switching between passage and MC answers.
   =================================================================== */

const Reading = {
  activeDateId: null,
  activeQIdx: 0,
  userAnswers: {},   // { [qId]: "A" | "B" | "C" | "D" }
  submitted: false,
  mobileTab: "split", // "split" | "passage" | "questions"

  getStore() {
    Store.d.reading = Store.d.reading || {
      completed: {}, // { [dateId]: { score, total, date, answers } }
      streak: 0,
      lastDate: null
    };
    return Store.d.reading;
  },

  /* ---------------------------------------------------------------
     INTRO / CALENDAR VIEW (STARTING 7 NOV 2026)
     --------------------------------------------------------------- */
  intro() {
    showScreen("reading");
    const container = $("#screen-reading");
    if (!container) return;

    const data = typeof DSE_READING_DATA !== "undefined" ? DSE_READING_DATA : [];
    const rStore = this.getStore();
    const completedMap = rStore.completed || {};

    const completedCount = Object.keys(completedMap).length;
    const currentStreak = rStore.streak || 0;

    // Calculate total score percentage across completed
    let totalScore = 0, totalMax = 0;
    Object.values(completedMap).forEach(c => {
      totalScore += (c.score || 0);
      totalMax += (c.total || 4);
    });
    const avgAcc = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    // Today's ISO date string: YYYY-MM-DD (e.g. "2026-11-07")
    const todayStr = todayKey();

    container.innerHTML = `
      <div class="reading-wrap">
        <!-- TOP NAV / STATS HEADER -->
        <div class="reading-header card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px">
            <button class="btn ghost small" id="btn-reading-back">← Back to Hub</button>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="alch-cat-badge" style="background:rgba(56,189,248,0.18);border-color:#38bdf8;color:#e0f2fe">
                📅 November 2026 · HKDSE Paper 1 (1200L)
              </span>
            </div>
          </div>

          <div class="reading-title-row">
            <div>
              <h1 style="margin:0 0 4px;font-family:var(--font-h);font-size:1.8rem;color:#f8fafc;display:flex;align-items:center;gap:10px">
                <span>📜</span> Reading Oracle
              </h1>
              <p class="muted" style="margin:0;font-size:0.92rem">
                Daily 140-word analytical micro-passages adapted from <i>The Economist</i>, <i>The Guardian</i> &amp; <i>The Atlantic</i>.
              </p>
            </div>

            <!-- STAT PILLS -->
            <div class="reading-stat-pills">
              <div class="rd-stat-pill">
                <span class="rd-sp-icon">📅</span>
                <div>
                  <div class="rd-sp-val">${completedCount}</div>
                  <div class="rd-sp-lbl">Completed</div>
                </div>
              </div>
              <div class="rd-stat-pill">
                <span class="rd-sp-icon">🔥</span>
                <div>
                  <div class="rd-sp-val">${currentStreak} Days</div>
                  <div class="rd-sp-lbl">Reading Streak</div>
                </div>
              </div>
              <div class="rd-stat-pill">
                <span class="rd-sp-icon">🎯</span>
                <div>
                  <div class="rd-sp-val">${avgAcc}%</div>
                  <div class="rd-sp-lbl">Average Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CALENDAR INSTRUCTIONS & AUTO-SCHEDULE NOTICE -->
        <div class="reading-banner card" style="margin:16px 0;background:rgba(30,41,59,0.5);border-color:rgba(56,189,248,0.25);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px 18px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:1.6rem">📆</span>
            <div>
              <div style="font-weight:700;color:#f8fafc;font-size:0.96rem">Daily Automated Calendar (Starts 7 Nov 2026)</div>
              <div class="muted" style="font-size:0.85rem">Each challenge unlocks automatically on its date. Missed a day? Past passages remain open so you can always catch up!</div>
            </div>
          </div>
          <button class="btn primary small" id="btn-jump-today" style="background:#0284c7;border-color:#38bdf8">⚡ Jump to Today's Passage</button>
        </div>

        <!-- CALENDAR GRID -->
        <div class="reading-calendar-grid">
          ${data.map(item => {
            const isCompleted = !!completedMap[item.id];
            const compData = completedMap[item.id] || {};
            const isToday = item.date === todayStr;
            const isFuture = item.date > todayStr;
            const isMissed = !isCompleted && item.date < todayStr;

            let statusBadge = "";
            let cardClass = "rd-card";
            let btnLabel = "";
            let btnClass = "btn small ";

            if (isCompleted) {
              cardClass += " completed";
              statusBadge = `<span class="rd-badge comp">✓ Completed (${compData.score}/${compData.total})</span>`;
              btnLabel = "Review Analysis";
              btnClass += "ghost";
            } else if (isToday) {
              cardClass += " today";
              statusBadge = `<span class="rd-badge today">🔥 Today's Challenge</span>`;
              btnLabel = "Start Today";
              btnClass += "primary";
            } else if (isMissed) {
              cardClass += " missed";
              statusBadge = `<span class="rd-badge missed">⏳ Catch Up (Missed)</span>`;
              btnLabel = "Catch Up";
              btnClass += "secondary";
            } else if (isFuture) {
              cardClass += " locked";
              statusBadge = `<span class="rd-badge locked">🔒 Unlocks ${esc(item.dayLabel)}</span>`;
              btnLabel = "Locked";
              btnClass += "ghost disabled";
            }

            return `
              <div class="${cardClass} card" data-id="${item.id}" data-date="${item.date}" data-locked="${isFuture ? "1" : "0"}">
                <div class="rd-card-top">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="rd-day-num">${esc(item.displayDate)}</span>
                    <span class="muted" style="font-size:0.75rem;font-weight:700">(${item.dayOfWeek})</span>
                  </div>
                  ${statusBadge}
                </div>
                <h3 class="rd-card-title">${esc(item.title)}</h3>
                <div class="rd-card-meta">
                  <span class="muted" style="font-size:0.8rem">🏷️ ${esc(item.theme)}</span>
                  <span class="muted" style="font-size:0.8rem">📰 ${esc(item.source)}</span>
                </div>
                <div class="rd-card-foot">
                  <span class="rd-q-count">❓ ${item.questions.length} DSE Questions</span>
                  <button class="${btnClass}" style="padding:6px 14px">
                    ${btnLabel}
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    $("#btn-reading-back").onclick = () => showScreen("home");

    const jumpBtn = $("#btn-jump-today");
    if (jumpBtn) {
      jumpBtn.onclick = () => {
        const todayItem = data.find(d => d.date === todayStr) || data[0];
        if (todayItem) this.openDay(todayItem.id);
      };
    }

    $$(".rd-card").forEach(card => {
      card.onclick = () => {
        const isLocked = card.dataset.locked === "1";
        if (isLocked) {
          Sfx.wrong();
          const targetItem = data.find(d => d.id === card.dataset.id);
          toast(`🔒 This passage unlocks on ${targetItem ? targetItem.displayDate : "its date"}. Check back then!`);
          return;
        }
        Sfx.click();
        this.openDay(card.dataset.id);
      };
    });
  },

  /* ---------------------------------------------------------------
     FORMAT PASSAGE PARAGRAPH (HIGHLIGHT TARGETS WITHOUT LINE NUMBERS)
     --------------------------------------------------------------- */
  formatPassage(rawText, activeMarker) {
    if (!rawText) return "";
    let s = esc(rawText);

    // Format markdown bold: ***phrase*** and **phrase**
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, `<b class="rd-bold-heavy">$1</b>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, `<b class="rd-bold-term">$1</b>`);

    // Format markers like [*], [**], [***]
    s = s.replace(/\[(\*{1,3})\]/g, (match, stars) => {
      const isTarget = activeMarker === `[${stars}]`;
      const cls = isTarget ? "rd-marker-pill active-marker" : "rd-marker-pill";
      return `<span class="${cls}">${stars}</span>`;
    });

    return s;
  },

  /* ---------------------------------------------------------------
     OPEN A SPECIFIC CALENDAR DAY'S PASSAGE
     --------------------------------------------------------------- */
  openDay(id) {
    const data = typeof DSE_READING_DATA !== "undefined" ? DSE_READING_DATA : [];
    const item = data.find(d => d.id === id) || data[0];
    if (!item) return;

    // Safety check: Cannot open future locked days
    if (item.date > todayKey()) {
      toast(`🔒 This passage unlocks on ${item.displayDate}!`);
      return;
    }

    this.activeDateId = item.id;
    this.activeQIdx = 0;
    this.mobileTab = "split";

    const rStore = this.getStore();
    const existing = rStore.completed[item.id];

    if (existing) {
      this.submitted = true;
      this.userAnswers = Object.assign({}, existing.answers || {});
    } else {
      this.submitted = false;
      this.userAnswers = {};
    }

    this.renderChamber(item);
  },

  /* ---------------------------------------------------------------
     RENDER ACTIVE READING CHAMBER (SPLIT VIEW & SWITCHER)
     --------------------------------------------------------------- */
  renderChamber(item) {
    const container = $("#screen-reading");
    if (!container) return;

    const q = item.questions[this.activeQIdx];
    const totalQ = item.questions.length;
    const isAnswered = this.userAnswers[q.id] !== undefined;
    const activeMarker = q.targetMarker || null;

    container.innerHTML = `
      <div class="reading-wrap chamber">
        <!-- TOP CONTROL BAR -->
        <div class="reading-chamber-nav card">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:10px">
              <button class="btn ghost small" id="btn-chamber-back">← Calendar</button>
              <div>
                <span class="alch-cat-badge" style="font-size:0.75rem;padding:2px 8px;background:rgba(56,189,248,0.2);color:#38bdf8;border-color:#38bdf8">
                  📅 ${esc(item.displayDate)}
                </span>
                <span style="font-weight:700;color:#f8fafc;margin-left:6px;font-size:0.95rem">${esc(item.title)}</span>
              </div>
            </div>

            <!-- SWITCHER CONTROLS (CRITICAL FOR BACK & FORTH READING) -->
            <div class="reading-view-switcher">
              <button class="rd-view-btn ${this.mobileTab === "passage" ? "active" : ""}" id="btn-view-passage" title="View Full Passage">
                📜 Passage Only
              </button>
              <button class="rd-view-btn ${this.mobileTab === "split" ? "active" : ""}" id="btn-view-split" title="Split Screen">
                ◫ Split Screen
              </button>
              <button class="rd-view-btn ${this.mobileTab === "questions" ? "active" : ""}" id="btn-view-questions" title="View Questions">
                📝 Questions (${this.activeQIdx + 1}/${totalQ})
              </button>
            </div>
          </div>

          <!-- QUESTION PILLS PROGRESS -->
          <div class="rd-q-pills-row">
            ${item.questions.map((ques, idx) => {
              const answered = this.userAnswers[ques.id] !== undefined;
              const isActive = idx === this.activeQIdx;
              let cls = "rd-q-step-pill";
              if (isActive) cls += " active";
              if (answered) cls += " answered";
              if (this.submitted) {
                const isCorrect = this.userAnswers[ques.id] === ques.options.find(o => o.correct)?.letter;
                cls += isCorrect ? " correct" : " wrong";
              }
              return `<button class="${cls}" data-qidx="${idx}">Q${idx + 1}</button>`;
            }).join("")}
          </div>
        </div>

        <!-- MAIN STAGE (SPLIT OR FOCUSED) -->
        <div class="reading-stage-layout ${this.mobileTab}">
          <!-- LEFT: THE CLEAN RESPONSIVE PARAGRAPH (NO LINE NUMBERS) -->
          <div class="reading-passage-panel card" id="passage-panel">
            <div class="rd-panel-header">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:1.1rem">📜</span>
                <span style="font-weight:700;color:#f8fafc">Reading Passage</span>
                <span class="muted" style="font-size:0.8rem">(${item.source})</span>
              </div>
              <span class="alch-cat-badge" style="font-size:0.75rem">${item.lexile}</span>
            </div>

            <!-- CLEAN FORMATTED PARAGRAPH -->
            <div class="rd-passage-text-scroll">
              <div class="rd-passage-prose">
                ${this.formatPassage(item.text, activeMarker)}
              </div>
            </div>

            <div class="rd-panel-footer">
              ${activeMarker ? `
                <div class="rd-target-notice">
                  💡 This question examines target marked with <span class="rd-marker-pill active-marker">${activeMarker.replace(/[\[\]]/g, "")}</span> in the passage.
                </div>
              ` : `
                <div class="rd-target-notice muted">
                  💡 Read the passage carefully, then select the best option on the right.
                </div>
              `}
            </div>
          </div>

          <!-- RIGHT: ACTIVE QUESTION & OPTIONS -->
          <div class="reading-question-panel card" id="question-panel">
            <div class="rd-panel-header">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="rd-skill-badge">${esc(q.skill)}</span>
                ${activeMarker ? `
                  <span class="alch-cat-badge" style="font-size:0.75rem;background:rgba(56,189,248,0.15);color:#38bdf8;border-color:#38bdf8">
                    Target: ${activeMarker}
                  </span>
                ` : ""}
              </div>
              <span class="muted" style="font-size:0.85rem">Question ${this.activeQIdx + 1} of ${totalQ}</span>
            </div>

            <div class="rd-q-body">
              <h3 class="rd-q-text">${esc(q.q)}</h3>

              <!-- 4 MULTIPLE CHOICE OPTIONS -->
              <div class="rd-options-list">
                ${q.options.map(opt => {
                  const isSelected = this.userAnswers[q.id] === opt.letter;
                  let optCls = "rd-opt-card";

                  if (this.submitted) {
                    if (opt.correct) optCls += " is-correct";
                    else if (isSelected && !opt.correct) optCls += " is-wrong";
                  } else if (isSelected) {
                    optCls += " selected";
                  }

                  return `
                    <button class="${optCls}" data-letter="${opt.letter}">
                      <div class="rd-opt-letter">${opt.letter}</div>
                      <div class="rd-opt-text">
                        <div>${esc(opt.text)}</div>
                        ${this.submitted ? `
                          <div class="rd-trap-tag ${opt.correct ? "correct" : "trap"}">${esc(opt.trap)}</div>
                        ` : ""}
                      </div>
                    </button>
                  `;
                }).join("")}
              </div>

              <!-- EXAMINER'S NOTE COLLAPSIBLE (DSE PEDAGOGICAL BREAKDOWN) -->
              ${this.submitted ? `
                <div class="rd-examiner-box card">
                  <div class="rd-ex-header" id="btn-toggle-ex">
                    <div style="display:flex;align-items:center;gap:8px">
                      <span>💡</span>
                      <b>Official Examiner's Report &amp; Trap Breakdown</b>
                    </div>
                    <span style="font-size:0.85rem;color:#38bdf8">Detailed Rationale ▼</span>
                  </div>
                  <div class="rd-ex-body" id="ex-body">
                    <p style="margin:0 0 8px;line-height:1.5">${esc(q.examinerNote)}</p>
                  </div>
                </div>
              ` : ""}
            </div>

            <!-- QUESTION BOTTOM NAVIGATION -->
            <div class="rd-q-bottom-nav">
              <button class="btn secondary small" id="btn-prev-q" ${this.activeQIdx === 0 ? "disabled" : ""}>
                ← Previous
              </button>

              <div style="display:flex;gap:8px">
                ${!this.submitted && this.allAnswered(item) ? `
                  <button class="btn primary small" id="btn-submit-day" style="background:#059669;border-color:#10b981">
                    ✓ Submit (${esc(item.displayDate)})
                  </button>
                ` : ""}

                ${this.activeQIdx < totalQ - 1 ? `
                  <button class="btn primary small" id="btn-next-q">Next Question →</button>
                ` : `
                  ${this.submitted ? `
                    <button class="btn primary small" id="btn-finish-review">Done Reviewing</button>
                  ` : ""}
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event Handlers
    $("#btn-chamber-back").onclick = () => this.intro();

    // View switchers (switching back and forth between passage and answers)
    $("#btn-view-passage").onclick = () => {
      this.mobileTab = "passage";
      this.renderChamber(item);
    };
    $("#btn-view-split").onclick = () => {
      this.mobileTab = "split";
      this.renderChamber(item);
    };
    $("#btn-view-questions").onclick = () => {
      this.mobileTab = "questions";
      this.renderChamber(item);
    };

    // Question steps
    $$(".rd-q-step-pill").forEach(p => {
      p.onclick = () => {
        Sfx.click();
        this.activeQIdx = +p.dataset.qidx;
        this.renderChamber(item);
      };
    });

    // Options selection
    $$(".rd-opt-card").forEach(optCard => {
      optCard.onclick = () => {
        if (this.submitted) return;
        Sfx.click();
        this.userAnswers[q.id] = optCard.dataset.letter;
        this.renderChamber(item);
      };
    });

    // Next / Prev buttons
    const prevBtn = $("#btn-prev-q");
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.activeQIdx > 0) {
          Sfx.click();
          this.activeQIdx--;
          this.renderChamber(item);
        }
      };
    }

    const nextBtn = $("#btn-next-q");
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.activeQIdx < totalQ - 1) {
          Sfx.click();
          this.activeQIdx++;
          this.renderChamber(item);
        }
      };
    }

    // Submit day button
    const submitBtn = $("#btn-submit-day");
    if (submitBtn) {
      submitBtn.onclick = () => this.submitDay(item);
    }

    const finishReviewBtn = $("#btn-finish-review");
    if (finishReviewBtn) {
      finishReviewBtn.onclick = () => this.intro();
    }
  },

  allAnswered(item) {
    return item.questions.every(q => this.userAnswers[q.id] !== undefined);
  },

  /* ---------------------------------------------------------------
     SUBMIT DAILY PASSAGE & AWARD HOUSE POINTS
     --------------------------------------------------------------- */
  submitDay(item) {
    let score = 0;
    const total = item.questions.length;

    item.questions.forEach(q => {
      const correctOpt = q.options.find(o => o.correct)?.letter;
      if (this.userAnswers[q.id] === correctOpt) score++;
    });

    this.submitted = true;
    const rStore = this.getStore();

    // Check if new completion
    const isNew = !rStore.completed[item.id];
    rStore.completed[item.id] = {
      score,
      total,
      date: item.date,
      answers: Object.assign({}, this.userAnswers)
    };

    // Calculate streak
    if (isNew) {
      const last = rStore.lastDate;
      const tKey = todayKey();
      if (!last) {
        rStore.streak = 1;
      } else {
        const diff = dayDiff(last, tKey);
        if (diff === 1) rStore.streak = (rStore.streak || 0) + 1;
        else if (diff > 1) rStore.streak = 1;
      }
      rStore.lastDate = tKey;

      // Award XP and House Points
      const xpEarned = score * 50 + (score === total ? 50 : 0);
      Store.addXP(xpEarned);
      Store.recordPlay();

      const readingScore = score * 100 + (score === total ? 100 : 0);
      Store.setBest("reading", readingScore);
      Store.addLB("reading", readingScore);
      if (typeof Leaderboard !== "undefined" && Leaderboard.submitScore) {
        Leaderboard.submitScore("reading", readingScore);
      }

      Store.quest("reading");
      Store.unlock("oracleReader");

      // If user belongs to a house, award points
      if (typeof HouseSync !== "undefined" && HouseSync.getUserHouse) {
        const h = HouseSync.getUserHouse();
        if (h) HouseSync.addPoints(h, xpEarned);
      }
    }

    Store.save();

    // Immediately synchronize Reading Oracle completion to the cloud profile
    if (typeof Leaderboard !== "undefined" && Leaderboard.syncProfilePush) {
      Leaderboard.syncProfilePush();
    }

    if (score >= total / 2) {
      Sfx.correct();
      if (typeof fx !== "undefined" && fx.confetti) fx.confetti();
    } else {
      Sfx.wrong();
    }

    // Start review from the first question (Q1)
    this.activeQIdx = 0;
    this.renderChamber(item);
  }
};

window.Reading = Reading;
