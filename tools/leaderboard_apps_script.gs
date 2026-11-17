/**
 * ===================================================================
 * HPCCSS LexiQuest — Real-time Google Sheets Leaderboard & Cross-Device Sync
 * ===================================================================
 * 
 * Features:
 * 1. "Leaderboard" sheet: Live top-10 Hall of Fame per mode.
 * 2. "PlayLogs" sheet: Chronological audit trail of all student game attempts.
 * 3. "UserProfiles" sheet: Cross-device synchronization of Word Vault mastery, XP & streaks.
 * 
 * Instructions to update your deployment:
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Replace all code with this file.
 * 4. Click "Deploy" -> "Manage deployments" -> Click the Pencil (Edit) icon.
 * 5. Change "Version" to "New version" -> Click "Deploy".
 * ===================================================================
 */

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🎮 LexiQuest Admin")
      .addItem("🔄 Update Whitelist Summary Sheet", "updateUserSummarySheet")
      .addItem("🏆 Rebuild All Leaderboards", "rebuildLeaderboardsMenu")
      .addToUi();
  } catch (e) {}
}

function rebuildLeaderboardsMenu() {
  const { lbSheet, logSheet } = setupSheets();
  cleanLegacyModesInPlayLogs(logSheet);
  ["rush", "alchemy", "blitz", "reading"].forEach(m => {
    updateLeaderboard(lbSheet, logSheet, m);
  });
  if (SpreadsheetApp.getActiveSpreadsheet()) {
    SpreadsheetApp.getActiveSpreadsheet().toast("🏆 Leaderboards refreshed successfully!", "LexiQuest", 4);
  }
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Leaderboard Sheet
  let lbSheet = ss.getSheetByName("Leaderboard");
  if (!lbSheet) {
    lbSheet = ss.insertSheet("Leaderboard");
    lbSheet.appendRow(["Mode", "Rank", "Player Name", "Score", "Role", "Last Updated"]);
    lbSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#38bdf8");
    lbSheet.setFrozenRows(1);
  }

  // 2. PlayLogs Sheet (records every single attempt)
  let logSheet = ss.getSheetByName("PlayLogs");
  if (!logSheet) {
    logSheet = ss.insertSheet("PlayLogs");
    logSheet.appendRow(["Timestamp", "Mode", "Player Name", "Score", "Role", "Email Hash"]);
    logSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#34d399");
    logSheet.setFrozenRows(1);
  }

  // 3. UserProfiles Sheet (cross-device Word Vault mastery, Reading Oracle & XP)
  let profileSheet = ss.getSheetByName("UserProfiles");
  if (!profileSheet) {
    profileSheet = ss.insertSheet("UserProfiles");
    profileSheet.appendRow(["Email Hash", "Player Name", "Role", "XP", "Streak", "Words Data", "Last Updated", "Reading Data", "Best Scores"]);
    profileSheet.getRange("A1:I1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#fbbf24");
    profileSheet.setFrozenRows(1);
  } else {
    // Ensure header row has columns for Reading and Best Scores if older sheet
    if (profileSheet.getLastColumn() < 8) {
      profileSheet.getRange(1, 8).setValue("Reading Data").setFontWeight("bold").setBackground("#1e293b").setFontColor("#38bdf8");
    }
    if (profileSheet.getLastColumn() < 9) {
      profileSheet.getRange(1, 9).setValue("Best Scores").setFontWeight("bold").setBackground("#1e293b").setFontColor("#a855f7");
    }
  }

  // 4. WhitelistSummary Sheet (all 236 users, latest XP, game scores & last sign in)
  let summarySheet = ss.getSheetByName("WhitelistSummary");
  if (!summarySheet) {
    summarySheet = updateUserSummarySheet();
  }

  return { lbSheet, logSheet, profileSheet, summarySheet };
}

function doGet(e) {
  return handleRequest(e ? e.parameter : {});
}

function doPost(e) {
  let params = {};
  if (e && e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      params = e.parameter || {};
    }
  } else if (e && e.parameter) {
    params = e.parameter;
  }
  return handleRequest(params);
}

function handleRequest(params) {
  const { lbSheet, logSheet, profileSheet } = setupSheets();
  const action = params.action || "get";
  // Always strictly normalize mode: strips any _s1, _s2, etc. so it's always clean 'rush', 'alchemy', 'blitz', 'reading'
  const mode = String(params.mode || "rush").toLowerCase().trim().split("_")[0];

  // Action: Admin / Teacher Launch Reset - Reset XP and Leaderboard while preserving Word Vault learning records!
  if (action === "admin_reset_xp") {
    const key = String(params.key || "").trim();
    if (key === "hpccss_launch_2026") {
      const verifiedLaunchStudents = {
        "LI TSZ YU": 2618,
        "TSAI TSZ CHING": 1860,
        "LEE SHING YU": 1250,
        "SUEN HO YAN": 100
      };

      // 1. Reset all student XP to 0 in UserProfiles sheet while keeping verified launch scholars and words intact!
      const pData = profileSheet.getDataRange().getValues();
      for (let i = 1; i < pData.length; i++) {
        const rawName = String(pData[i][1] || "");
        const cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
        if (verifiedLaunchStudents[cleanName] !== undefined) {
          profileSheet.getRange(i + 1, 4).setValue(verifiedLaunchStudents[cleanName]);
        } else {
          profileSheet.getRange(i + 1, 4).setValue(0);
        }
      }

      // 2. Rebuild Leaderboard sheet cleanly from PlayLogs
      cleanLegacyModesInPlayLogs(logSheet);
      ["rush", "alchemy", "blitz", "reading"].forEach(m => {
        updateLeaderboard(lbSheet, logSheet, m);
      });

      return jsonOut({ status: "success", message: "All student XP reset to 0 (except verified launch scholars); Word Vault mastery safely preserved!" });
    } else {
      return jsonOut({ status: "error", message: "Unauthorized key." });
    }
  }

  // Action: Pull student profile for cross-device Word Vault sync
  if (action === "sync_pull") {
    const hash = String(params.hash || "").trim();
    touchUserSignIn(profileSheet, hash, params.name);
    const profile = getUserProfile(profileSheet, hash);
    const output = {
      status: "success",
      profile: profile
    };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Action: Push student profile for cross-device Word Vault, Reading Oracle & Personal Bests sync
  if (action === "sync_push") {
    const hash = String(params.hash || "").trim();
    const name = String(params.name || "").trim().substring(0, 30);
    const role = String(params.role || "student").trim();
    const xp = parseInt(params.xp, 10) || 0;
    const streak = parseInt(params.streak, 10) || 0;
    const wordsJson = String(params.words || "{}");
    const readingJson = String(params.reading || "{}");
    const bestJson = String(params.best || "{}");

    saveUserProfile(profileSheet, hash, name, role, xp, streak, wordsJson, readingJson, bestJson);
    const output = { status: "success" };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Cryptic Rush multiplayer: 1v1 duel short codes + live Class Arena rooms
  if (String(action).indexOf("duel_") === 0 || String(action).indexOf("arena_") === 0) {
    return jsonOut(handleMultiplayer(action, params));
  }

  // Action: Submit a score
  if (action === "submit") {
    const name = String(params.name || "Scholar").trim().substring(0, 30);
    const score = parseInt(params.score, 10) || 0;
    const role = String(params.role || "student").trim();
    const hash = String(params.hash || "").trim();

    if (score > 0) {
      // Log attempt
      logSheet.appendRow([new Date(), mode, name, score, role, hash]);

      // Update Top Leaderboard (keep highest score per player or best runs)
      updateLeaderboard(lbSheet, logSheet, mode);
    }
  }

  // Action: Reset legacy trial XP in UserProfiles sheet to 0 while keeping Word Vault vocabulary data intact!
  if (action === "clean_profiles" || action === "reset_trial_xp") {
    const verifiedLaunchStudents = {
      "LI TSZ YU": 2618,
      "TSAI TSZ CHING": 1860,
      "LEE SHING YU": 1250,
      "SUEN HO YAN": 100
    };
    const pData = profileSheet.getDataRange().getValues();
    let cleanedCount = 0;
    for (let i = 1; i < pData.length; i++) {
      const rawName = String(pData[i][1] || "");
      const cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
      if (verifiedLaunchStudents[cleanName] !== undefined) {
        profileSheet.getRange(i + 1, 4).setValue(verifiedLaunchStudents[cleanName]);
      } else {
        profileSheet.getRange(i + 1, 4).setValue(0);
        cleanedCount++;
      }
    }
    const output = {
      status: "success",
      message: "Reset " + cleanedCount + " legacy trial user profiles to 0 XP while preserving launch scholars and Word Vault cards!"
    };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Action: Update or refresh WhitelistSummary sheet
  if (action === "update_summary" || action === "refresh_summary") {
    const res = updateUserSummarySheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "WhitelistSummary sheet updated successfully!",
      totalUsers: res.totalUsers,
      activeUsers: res.activeUsers
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Action: Force rebuild all leaderboard modes & clean any legacy _s1 in PlayLogs
  if (action === "rebuild" || action === "refresh" || action === "clean_modes") {
    cleanLegacyModesInPlayLogs(logSheet);
    ["rush", "alchemy", "blitz", "reading"].forEach(m => {
      updateLeaderboard(lbSheet, logSheet, m);
    });
    const output = {
      status: "success",
      message: "Unified all legacy _s1 records into clean base modes and refreshed Leaderboard sheet!",
      leaderboard: getAllLeaderboards(lbSheet, logSheet)
    };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Always return the latest Top 10 leaderboard for all 4 active modes
  const leaderboard = getAllLeaderboards(lbSheet, logSheet);

  const output = {
    status: "success",
    timestamp: new Date().toISOString(),
    leaderboard: leaderboard
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllProfiles(profileSheet) {
  if (!profileSheet) return [];
  const data = profileSheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][1] || "").trim();
    const role = String(data[i][2] || "student").trim();
    const xp = Number(data[i][3]) || 0;
    if (!name || xp <= 0) continue;
    if (role === "staff" || name.indexOf("(VP)") !== -1 || name.indexOf("(Staff)") !== -1) continue;
    list.push({ n: name, xp: xp, role: role });
  }
  return list;
}

function getUserProfile(profileSheet, hash) {
  if (!hash) return null;
  const data = profileSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === hash.toLowerCase()) {
      let words = {};
      try { words = JSON.parse(data[i][5]); } catch (e) {}
      let reading = {};
      if (data[i][7]) {
        try { reading = JSON.parse(data[i][7]); } catch (e) {}
      } else if (words && words._reading) {
        reading = words._reading;
      }
      let best = {};
      if (data[i][8]) {
        try { best = JSON.parse(data[i][8]); } catch (e) {}
      } else if (words && words._best) {
        best = words._best;
      }
      return {
        hash: data[i][0],
        name: data[i][1],
        role: data[i][2],
        xp: Number(data[i][3]) || 0,
        streak: Number(data[i][4]) || 0,
        words: words,
        reading: reading,
        best: best
      };
    }
  }
  return null;
}

function saveUserProfile(profileSheet, hash, name, role, xp, streak, wordsJson, readingJson, bestJson) {
  if (!hash) return;
  const data = profileSheet.getDataRange().getValues();
  const rd = readingJson || "{}";
  const bs = bestJson || "{}";
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === hash.toLowerCase()) {
      // Guard against race conditions: never let incoming 0 or lower XP overwrite existing verified progress
      const existXP = Number(data[i][3]) || 0;
      const finalXP = Math.max(existXP, Number(xp) || 0);
      const existStreak = Number(data[i][4]) || 0;
      const finalStreak = Math.max(existStreak, Number(streak) || 0);

      // Union/merge reading completed map so a device with partial or empty completions never wipes completions done on another device
      let mergedReading = rd;
      try {
        let existRd = {};
        if (data[i][7]) {
          existRd = typeof data[i][7] === "string" ? JSON.parse(data[i][7]) : data[i][7];
        }
        let inRd = {};
        if (rd) {
          inRd = typeof rd === "string" ? JSON.parse(rd) : rd;
        }
        const existCompleted = (existRd && existRd.completed) || {};
        const inCompleted = (inRd && inRd.completed) || {};
        const unionCompleted = Object.assign({}, existCompleted);
        for (const passId in inCompleted) {
          if (!unionCompleted[passId] || (inCompleted[passId].score || 0) > (unionCompleted[passId].score || 0)) {
            unionCompleted[passId] = inCompleted[passId];
          }
        }
        const finalReadingObj = {
          completed: unionCompleted,
          streak: Math.max(existRd.streak || 0, inRd.streak || 0),
          lastDate: (inRd.lastDate && (!existRd.lastDate || inRd.lastDate > existRd.lastDate)) ? inRd.lastDate : (existRd.lastDate || inRd.lastDate || null)
        };
        mergedReading = JSON.stringify(finalReadingObj);
      } catch (e) {
        mergedReading = rd;
      }

      // Merge personal bests
      let mergedBest = bs;
      try {
        let existBs = {};
        if (data[i][8]) {
          existBs = typeof data[i][8] === "string" ? JSON.parse(data[i][8]) : data[i][8];
        }
        let inBs = {};
        if (bs) {
          inBs = typeof bs === "string" ? JSON.parse(bs) : bs;
        }
        const unionBest = Object.assign({}, existBs);
        for (const m in inBs) {
          unionBest[m] = Math.max(Number(unionBest[m]) || 0, Number(inBs[m]) || 0);
        }
        mergedBest = JSON.stringify(unionBest);
      } catch (e) {
        mergedBest = bs;
      }

      profileSheet.getRange(i + 1, 2, 1, 8).setValues([[name, role, finalXP, finalStreak, wordsJson, new Date(), mergedReading, mergedBest]]);
      return;
    }
  }
  profileSheet.appendRow([hash, name, role, xp, streak, wordsJson, new Date(), rd, bs]);
}

function cleanLegacyModesInPlayLogs(logSheet) {
  if (!logSheet) return;
  const data = logSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][1]).toLowerCase().trim();
    if (raw.indexOf("_") !== -1) {
      const clean = raw.split("_")[0];
      logSheet.getRange(i + 1, 2).setValue(clean);
    }
  }
}

function updateLeaderboard(lbSheet, logSheet, targetMode) {
  const data = logSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const baseTarget = String(targetMode || "rush").toLowerCase().trim().split("_")[0];

  // Filter logs for target mode (matching both "mode" and "mode_s1"), keep max score per student
  const scoresByPlayer = {};
  for (let i = 1; i < data.length; i++) {
    const rowRaw = String(data[i][1]).toLowerCase().trim();
    const rowBase = rowRaw.split("_")[0];
    if (rowBase === baseTarget) {
      const pName = String(data[i][2]);
      const pScore = Number(data[i][3]) || 0;
      const pRole = String(data[i][4]) || "student";
      const pDate = data[i][0];

      // Exclude teachers/staff from student top score list
      if (pRole === "staff" || pName.indexOf("(VP)") !== -1 || pName.indexOf("(Staff)") !== -1) continue;

      if (!scoresByPlayer[pName] || pScore > scoresByPlayer[pName].s) {
        scoresByPlayer[pName] = { n: pName, s: pScore, role: pRole, date: pDate };
      }
    }
  }

  // Sort descending
  const sorted = Object.values(scoresByPlayer).sort((a, b) => b.s - a.s).slice(0, 10);

  // Clear existing rows for this mode in Leaderboard sheet
  const lbData = lbSheet.getDataRange().getValues();
  for (let i = lbData.length - 1; i >= 1; i--) {
    const curBase = String(lbData[i][0]).toLowerCase().trim().split("_")[0];
    if (curBase === baseTarget) {
      lbSheet.deleteRow(i + 1);
    }
  }

  // Re-insert top 10 under clean base name
  sorted.forEach((entry, idx) => {
    lbSheet.appendRow([baseTarget, idx + 1, entry.n, entry.s, entry.role, new Date()]);
  });
}

function getAllLeaderboards(lbSheet, logSheet) {
  const data = lbSheet.getDataRange().getValues();
  const res = { rush: [], alchemy: [], blitz: [], reading: [] };

  for (let i = 1; i < data.length; i++) {
    const rawMode = String(data[i][0]).toLowerCase().trim();
    // Exclude deprecated Wordle and Matrix modes
    if (rawMode.indexOf("wordle") !== -1 || rawMode.indexOf("matrix") !== -1) continue;
    const rank = Number(data[i][1]);
    const name = String(data[i][2]);
    const score = Number(data[i][3]);
    const role = String(data[i][4]);

    // Exclude teachers/staff from student top score list
    if (role === "staff" || name.indexOf("(VP)") !== -1 || name.indexOf("(Staff)") !== -1) continue;

    // Normalize modes: whether saved as "rush" or "rush_s1", group into base mode
    const mode = rawMode.split("_")[0];

    if (!res[mode]) {
      res[mode] = [];
    }
    res[mode].push({ n: name, s: score, rank: rank, role: role });
  }

  // If any active game mode has 0 entries in Leaderboard sheet, automatically backfill from PlayLogs!
  if (logSheet) {
    const logData = logSheet.getDataRange().getValues();
    ["rush", "alchemy", "blitz", "reading"].forEach(m => {
      if (!res[m] || res[m].length === 0) {
        const topForMode = {};
        for (let j = 1; j < logData.length; j++) {
          const lMode = String(logData[j][1]).toLowerCase().trim().split("_")[0];
          if (lMode === m) {
            const pName = String(logData[j][2]).trim();
            const pScore = Number(logData[j][3]) || 0;
            const pRole = String(logData[j][4]) || "student";
            if (pRole === "staff" || pName.indexOf("(VP)") !== -1 || pName.indexOf("(Staff)") !== -1) continue;
            if (!topForMode[pName] || pScore > topForMode[pName].s) {
              topForMode[pName] = { n: pName, s: pScore, role: pRole };
            }
          }
        }
        const sorted = Object.values(topForMode).sort((a, b) => b.s - a.s).slice(0, 10);
        sorted.forEach((e, idx) => { e.rank = idx + 1; });
        res[m] = sorted;
      }
    });
  }

  // Ensure sorted by score
  for (const m in res) {
    res[m].sort((a, b) => b.s - a.s);
  }

  return res;
}

/* ===================================================================
 * CRYPTIC RUSH MULTIPLAYER (added v3.8)
 * - duel_save / duel_get : short 6-char codes for 1v1 challenge runs
 *   (stored in the "Duels" sheet so codes survive for weeks)
 * - arena_create / arena_join / arena_start / arena_update / arena_state / arena_end
 *   Live Class Arena rooms held in CacheService (fast, auto-expire after 6h).
 *   Each player writes to their own cache key, so 30+ students can update
 *   simultaneously without overwriting each other.
 * =================================================================== */
function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

const ARENA_TTL = 21600; // 6 hours (CacheService maximum)

function arenaKey(room) { return "arena:" + String(room).replace(/[^0-9A-Za-z]/g, "").toUpperCase(); }

function readJson(cache, key) {
  const raw = cache.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function arenaSnapshot(cache, room) {
  const base = arenaKey(room);
  const meta = readJson(cache, base);
  if (!meta) return null;
  const roster = readJson(cache, base + ":roster") || [];
  const keys = roster.map(function (pid) { return base + ":p:" + pid; });
  const got = keys.length ? cache.getAll(keys) : {};
  const players = [];
  roster.forEach(function (pid) {
    const raw = got[base + ":p:" + pid];
    if (!raw) return;
    try { players.push(JSON.parse(raw)); } catch (e) {}
  });
  players.sort(function (a, b) { return (b.s || 0) - (a.s || 0); });
  const answers = readJson(cache, base + ":answers") || {};
  return {
    room: meta.room,
    seed: meta.seed,
    set: meta.set,
    cat: meta.cat || "all",
    host: meta.host,
    status: meta.status,
    startAt: meta.startAt || 0,
    qIndex: meta.qIndex !== undefined ? meta.qIndex : 0,
    qPhase: meta.qPhase || "question",
    qStartAt: meta.qStartAt || 0,
    qDuration: meta.qDuration || 10,
    totalQ: meta.totalQ || 10,
    answers: answers,
    now: Date.now(),
    players: players
  };
}

function handleMultiplayer(action, p) {
  const cache = CacheService.getScriptCache();

  // ---------- 1v1 Duel short codes ----------
  if (action === "duel_save") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName("Duels");
    if (!sh) { sh = ss.insertSheet("Duels"); sh.appendRow(["Code", "Payload", "Created"]); sh.setFrozenRows(1); }
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    const payload = String(p.payload || "").substring(0, 4000);
    sh.appendRow([code, payload, new Date()]);
    cache.put("duel:" + code, payload, ARENA_TTL);
    return { status: "success", code: code };
  }
  if (action === "duel_get") {
    const code = String(p.code || "").trim().toUpperCase();
    let payload = cache.get("duel:" + code);
    if (!payload) {
      const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Duels");
      if (sh) {
        const rows = sh.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][0]).toUpperCase() === code) { payload = String(rows[i][1]); break; }
        }
      }
    }
    return payload ? { status: "success", payload: payload } : { status: "error", msg: "Duel code not found" };
  }

  // ---------- Live Class Arena ----------
  const room = String(p.room || "").trim().toUpperCase();
  const base = arenaKey(room);

  if (action === "arena_create") {
    if (String(p.role || "") !== "staff") return { status: "error", msg: "Only teachers can host a Class Arena." };
    const meta = {
      room: room,
      seed: String(p.seed || ""),
      set: String(p.set || "all"),
      cat: String(p.cat || "all"),
      host: String(p.name || "Teacher").substring(0, 40),
      status: "lobby",
      startAt: 0,
      qIndex: 0,
      qPhase: "question",
      qStartAt: 0,
      qDuration: 10,
      totalQ: parseInt(p.totalQ, 10) || 10,
      created: Date.now()
    };
    cache.put(base, JSON.stringify(meta), ARENA_TTL);
    cache.put(base + ":roster", "[]", ARENA_TTL);
    cache.put(base + ":answers", "{}", ARENA_TTL);
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  if (!readJson(cache, base)) return { status: "error", msg: "Room not found or expired." };

  if (action === "arena_join" || action === "arena_update") {
    const pid = String(p.pid || "").replace(/[^0-9A-Za-z_-]/g, "").substring(0, 24);
    if (!pid) return { status: "error", msg: "Missing player id" };
    const player = { pid: pid, n: String(p.name || "Scholar").substring(0, 30), h: String(p.house || "").substring(0, 4),
                     s: parseInt(p.score, 10) || 0, c: parseInt(p.correct, 10) || 0, d: p.done === "1" ? 1 : 0, t: Date.now() };
    if (action === "arena_join") {
      const lock = LockService.getScriptLock();
      lock.waitLock(8000);
      try {
        const roster = readJson(cache, base + ":roster") || [];
        if (roster.indexOf(pid) === -1) { roster.push(pid); cache.put(base + ":roster", JSON.stringify(roster), ARENA_TTL); }
      } finally { lock.releaseLock(); }
    }
    cache.put(base + ":p:" + pid, JSON.stringify(player), ARENA_TTL);
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  if (action === "arena_sync_state") {
    const meta = readJson(cache, base);
    if (!meta) return { status: "error", msg: "Room not found" };
    if (p.status) meta.status = String(p.status);
    if (p.qIndex !== undefined) meta.qIndex = parseInt(p.qIndex, 10);
    if (p.qPhase) meta.qPhase = String(p.qPhase);
    if (p.qStartAt !== undefined) meta.qStartAt = parseInt(p.qStartAt, 10);
    if (p.qDuration !== undefined) meta.qDuration = parseInt(p.qDuration, 10);
    if (p.totalQ !== undefined) meta.totalQ = parseInt(p.totalQ, 10);
    cache.put(base, JSON.stringify(meta), ARENA_TTL);
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  if (action === "arena_submit") {
    const pid = String(p.pid || "").replace(/[^0-9A-Za-z_-]/g, "").substring(0, 24);
    if (!pid) return { status: "error", msg: "Missing player id" };
    const qIndex = parseInt(p.qIndex, 10) || 0;
    const choice = String(p.choice || "");
    const isCorrect = p.isCorrect === true || p.isCorrect === "true" || p.isCorrect === 1;

    const lock = LockService.getScriptLock();
    lock.waitLock(8000);
    try {
      const answers = readJson(cache, base + ":answers") || {};
      if (!answers[qIndex]) answers[qIndex] = {};
      answers[qIndex][pid] = { choice: choice, isCorrect: isCorrect, t: Date.now() };
      cache.put(base + ":answers", JSON.stringify(answers), ARENA_TTL);

      // Update player score (+100 if correct)
      let player = readJson(cache, base + ":p:" + pid);
      if (player) {
        if (isCorrect) {
          player.s = (player.s || 0) + 100;
          player.c = (player.c || 0) + 1;
        }
        player.t = Date.now();
        cache.put(base + ":p:" + pid, JSON.stringify(player), ARENA_TTL);
      }
    } finally {
      lock.releaseLock();
    }
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  if (action === "arena_start" || action === "arena_end" || action === "arena_reset") {
    if (String(p.role || "") !== "staff") return { status: "error", msg: "Teacher only." };
    const meta = readJson(cache, base);
    if (action === "arena_start") { meta.status = "live"; meta.startAt = Date.now() + 5000; }
    if (action === "arena_end") { meta.status = "ended"; }
    if (action === "arena_reset") {
      meta.status = "lobby";
      meta.startAt = 0;
      meta.qIndex = 0;
      meta.qPhase = "question";
      meta.qStartAt = 0;
      meta.seed = String(p.seed || meta.seed);
      cache.put(base + ":answers", "{}", ARENA_TTL);
    }
    cache.put(base, JSON.stringify(meta), ARENA_TTL);
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  if (action === "arena_state") {
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  return { status: "error", msg: "Unknown action" };
}


/* ===================================================================
   WHITELIST USER SUMMARY & PROGRESS AUDIT
   Automatically populates the "WhitelistSummary" sheet with all 236 students & staff,
   their latest XP, game scores across all 4 modes, and last sign-in timestamp.
   =================================================================== */

function touchUserSignIn(profileSheet, hash, name) {
  if (!hash || !profileSheet) return;
  const data = profileSheet.getDataRange().getValues();
  const now = new Date();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === hash.toLowerCase()) {
      profileSheet.getRange(i + 1, 7).setValue(now); // Column G: Last Updated / Active
      return;
    }
  }
  if (name) {
    profileSheet.appendRow([hash, name, "student", 0, 0, "{}", now, "{}", "{}"]);
  }
}

function cleanPlayerName(raw) {
  return String(raw || "").replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
}

function updateUserSummarySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove VaultDifficultWords sheet if it exists to keep workbook clean
  const oldDiff = ss.getSheetByName("VaultDifficultWords");
  if (oldDiff) {
    try { ss.deleteSheet(oldDiff); } catch (e) {}
  }

  let summarySheet = ss.getSheetByName("WhitelistSummary");
  if (!summarySheet) {
    summarySheet = ss.insertSheet("WhitelistSummary");
  }

  const profileSheet = ss.getSheetByName("UserProfiles");
  const logSheet = ss.getSheetByName("PlayLogs");

  // 1. Build lookup from UserProfiles
  const profilesByHash = {};
  const profilesByName = {};

  if (profileSheet && profileSheet.getLastRow() > 1) {
    const pData = profileSheet.getDataRange().getValues();
    for (let i = 1; i < pData.length; i++) {
      const row = pData[i];
      const h = String(row[0] || "").toLowerCase().trim();
      const rawName = String(row[1] || "").trim();
      const cName = cleanPlayerName(rawName);
      const role = String(row[2] || "").trim();
      const xp = Number(row[3]) || 0;
      const streak = Number(row[4]) || 0;
      let words = {};
      try { words = typeof row[5] === "string" ? JSON.parse(row[5]) : (row[5] || {}); } catch (e) {}
      const lastUp = row[6] ? new Date(row[6]) : null;

      let reading = {};
      if (row[7]) {
        try { reading = typeof row[7] === "string" ? JSON.parse(row[7]) : (row[7] || {}); } catch (e) {}
      } else if (words && words._reading) {
        reading = words._reading;
      }

      let best = {};
      if (row[8]) {
        try { best = typeof row[8] === "string" ? JSON.parse(row[8]) : (row[8] || {}); } catch (e) {}
      } else if (words && words._best) {
        best = words._best;
      }

      const profObj = { hash: h, rawName: rawName, cleanName: cName, role: role, xp: xp, streak: streak, lastUpdated: lastUp, reading: reading, best: best };

      if (h) {
        if (!profilesByHash[h] || (profObj.xp > profilesByHash[h].xp)) {
          profilesByHash[h] = profObj;
        }
      }
      if (cName) {
        if (!profilesByName[cName] || (profObj.xp > profilesByName[cName].xp)) {
          profilesByName[cName] = profObj;
        }
      }
    }
  }

  // 2. Build lookup from PlayLogs
  const logsByHash = {};
  const logsByName = {};

  if (logSheet && logSheet.getLastRow() > 1) {
    const lData = logSheet.getDataRange().getValues();
    for (let i = 1; i < lData.length; i++) {
      const row = lData[i];
      const ts = row[0] ? new Date(row[0]) : null;
      let rawMode = String(row[1] || "").toLowerCase().trim().split("_")[0];
      const rawName = String(row[2] || "").trim();
      const cName = cleanPlayerName(rawName);
      const score = Number(row[3]) || 0;
      const h = String(row[5] || "").toLowerCase().trim();

      function recordLog(targetMap, key) {
        if (!key) return;
        if (!targetMap[key]) {
          targetMap[key] = { rush: 0, alchemy: 0, blitz: 0, reading: 0, lastPlayed: null, count: 0 };
        }
        const entry = targetMap[key];
        entry.count++;
        if (rawMode === "rush" || rawMode === "alchemy" || rawMode === "blitz" || rawMode === "reading") {
          entry[rawMode] = Math.max(entry[rawMode], score);
        }
        if (ts && !isNaN(ts.getTime()) && (!entry.lastPlayed || ts > entry.lastPlayed)) {
          entry.lastPlayed = ts;
        }
      }

      if (h) recordLog(logsByHash, h);
      if (cName) recordLog(logsByName, cName);
    }
  }

  // Verified launch scholars baseline protection
  const verifiedLaunchStudents = {
    "LI TSZ YU": 2618,
    "TSAI TSZ CHING": 1860,
    "LEE SHING YU": 1250,
    "SUEN HO YAN": 100
  };

  const headers = [
    "Class", "Class No.", "Name (EN)", "Name (CH)", "House", "Role", "Email",
    "Latest XP", "Cryptic Rush (Pts)", "Collocation Alchemy (Pts)", "Grammar Blitz (Pts)", "Reading Oracle (Pts)", "Word Vault",
    "Last Sign In / Active", "Status"
  ];

  const rows = [];
  let totalActive = 0;

  for (let i = 0; i < HPCCSS_WHITELIST_USERS.length; i++) {
    const u = HPCCSS_WHITELIST_USERS[i];
    const uCls = u[0];
    const uCno = u[1];
    const uName = u[2];
    const uChin = u[3];
    const uHouse = u[4];
    const uRole = u[5];
    const uEmail = u[6];
    const uHash = u[7];
    const cName = cleanPlayerName(uName);

    // Profile match (by hash or clean name)
    const p = profilesByHash[uHash] || profilesByName[cName] || null;
    // Log match (by hash or clean name)
    const l = logsByHash[uHash] || logsByName[cName] || null;

    let xp = p ? p.xp : 0;
    if (verifiedLaunchStudents[cName] && xp < verifiedLaunchStudents[cName]) {
      xp = verifiedLaunchStudents[cName];
    }

    const pBest = (p && p.best) || {};
    const rushPts = Math.max(Number(pBest.rush) || 0, (l && l.rush) || 0);
    const alchemyPts = Math.max(Number(pBest.alchemy) || 0, (l && l.alchemy) || 0);
    const blitzPts = Math.max(Number(pBest.blitz) || 0, (l && l.blitz) || 0);
    const readingPts = Math.max(Number(pBest.reading) || 0, (l && l.reading) || 0);

    // Calculate XP gained from Word Vault self-assessments and card practice
    let vaultXP = 0;
    let vaultWordsCount = 0;
    const pWords = (p && p.words) || {};
    let totalReps = 0;
    for (const wKey in pWords) {
      if (wKey.startsWith("_")) continue;
      const wObj = pWords[wKey];
      if (!wObj) continue;
      const seen = Number(wObj.seen) || 0;
      if (seen > 0 || wObj.status) {
        vaultWordsCount++;
        totalReps += (Number(wObj.reps) || 1);
        const st = wObj.status;
        if (st === "mastered") {
          vaultXP += 3;
        } else if (st === "familiar" || st === "challenging") {
          vaultXP += 1;
        } else {
          const reps = Number(wObj.reps) || 0;
          const ok = Number(wObj.ok) || 0;
          if (reps >= 2 || ok >= 3) {
            vaultXP += 3;
          } else {
            vaultXP += 1;
          }
        }
      }
    }
    // Add revision deck completion bonus (+20 XP per 10 cards completed)
    if (totalReps >= 10) {
      vaultXP += Math.floor(totalReps / 10) * 20;
    }

    let lastActive = null;
    if (p && p.lastUpdated && !isNaN(p.lastUpdated.getTime())) {
      lastActive = p.lastUpdated;
    }
    if (l && l.lastPlayed && !isNaN(l.lastPlayed.getTime())) {
      if (!lastActive || l.lastPlayed > lastActive) {
        lastActive = l.lastPlayed;
      }
    }

    let lastActiveStr = "Not Signed In Yet";
    let status = "Not Active";
    if (lastActive) {
      lastActiveStr = Utilities.formatDate(lastActive, "Asia/Hong_Kong", "yyyy-MM-dd HH:mm:ss");
      status = (xp > 0 || rushPts > 0 || alchemyPts > 0 || blitzPts > 0 || readingPts > 0 || vaultXP > 0) ? "Active" : "Signed In";
      totalActive++;
    } else if (xp > 0 || vaultXP > 0) {
      status = "Active";
      totalActive++;
    }

    rows.push([
      uCls,
      uCno,
      uName,
      uChin,
      uHouse,
      uRole,
      uEmail,
      xp,
      rushPts,
      alchemyPts,
      blitzPts,
      readingPts,
      vaultXP,
      lastActiveStr,
      status
    ]);
  }

  // Clear previous data and formatting
  summarySheet.clear();

  // Write headers + data in one batch
  const allData = [headers].concat(rows);
  const fullRange = summarySheet.getRange(1, 1, allData.length, headers.length);
  fullRange.setValues(allData);

  // Formatting & Aesthetics
  summarySheet.setFrozenRows(1);
  summarySheet.setFrozenColumns(3);

  // Header styling
  const headerRange = summarySheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setBackground("#0f172a")
             .setFontColor("#38bdf8")
             .setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  summarySheet.getRange("C1").setHorizontalAlignment("left");
  summarySheet.getRange("G1").setHorizontalAlignment("left");
  summarySheet.getRange("M1").setFontColor("#34d399"); // Highlight Word Vault header in emerald green

  // Alignments & Number formats for data rows
  if (rows.length > 0) {
    const dataRange = summarySheet.getRange(2, 1, rows.length, headers.length);
    dataRange.setFontSize(9);

    // Alignments
    summarySheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment("center"); // Class, Class No
    summarySheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("left");   // Name EN
    summarySheet.getRange(2, 4, rows.length, 3).setHorizontalAlignment("center"); // Name CH, House, Role
    summarySheet.getRange(2, 7, rows.length, 1).setHorizontalAlignment("left");   // Email
    // Numerical columns: XP (8), Games (9-12), Word Vault (13)
    summarySheet.getRange(2, 8, rows.length, 6).setHorizontalAlignment("right").setNumberFormat("#,##0");
    summarySheet.getRange(2, 14, rows.length, 2).setHorizontalAlignment("center"); // Last Active, Status

    // Alternating zebra row shading
    for (let r = 2; r <= rows.length + 1; r++) {
      const bg = (r % 2 === 0) ? "#ffffff" : "#f8fafc";
      summarySheet.getRange(r, 1, 1, headers.length).setBackground(bg);
    }
  }

  // Column widths
  const colWidths = [70, 75, 230, 95, 70, 80, 240, 95, 110, 140, 110, 110, 110, 165, 100];
  for (let c = 0; c < colWidths.length; c++) {
    summarySheet.setColumnWidth(c + 1, colWidths[c]);
  }

  // Set filter
  try {
    const existingFilter = summarySheet.getFilter();
    if (existingFilter) existingFilter.remove();
    summarySheet.getRange(1, 1, rows.length + 1, headers.length).createFilter();
  } catch (e) {}

  if (SpreadsheetApp.getActiveSpreadsheet()) {
    SpreadsheetApp.getActiveSpreadsheet().toast("✅ Whitelist Summary updated! (" + totalActive + " active of " + rows.length + " users)", "LexiQuest", 5);
  }

  return { totalUsers: rows.length, activeUsers: totalActive };
}

const HPCCSS_WHITELIST_USERS = [["4A", 1, "AU-YEUNG SZE YAN SALINA", "歐陽思炘", "KIN", "student", "s230037@student.hpccss.edu.hk", "65b4a1d631bec49a06c89bb2ed532d28dfae6af82cf73face6ab2207845b9831"], ["4A", 2, "CHEN JENNIFER", "陳樂兒", "KAN", "student", "s230144@student.hpccss.edu.hk", "66e0e0512df0b806485894e55ff1b54a852d6a17c003f1d8361a390732ad1667"], ["4A", 3, "CHEN YIN HIU", "陳彥曉", "KAN", "student", "s2210195@student.hpccss.edu.hk", "d58b7fd530fde95b8c6c761638a8ec06ddd7ef6c38ffe58e75e0c9be501937ec"], ["4A", 4, "CHEUNG TING MAN", "張汀敏", "TAK", "student", "s2210229@student.hpccss.edu.hk", "d14ff5af0189bae9f4645ad117a15255d17c4d64872a40b3d6ab69469f0d47fe"], ["4A", 5, "CHOI HIU TUNG", "蔡曉銅", "KIN", "student", "s230219@student.hpccss.edu.hk", "919acc86087f29acec6232a5e6cd62f28217326dc1c8d37eece26b6521817641"], ["4A", 6, "HU RUI JIE", "胡瑞婕", "KAN", "student", "s2110542@student.hpccss.edu.hk", "3e834af7f7369cb3516dcd4da6410ec6ea66a65f23c516cedaa22aa28e870f82"], ["4A", 7, "HUANG JINGYAN", "黃靖言", "KIN", "student", "s230383@student.hpccss.edu.hk", "69a1c934970e2650677fff71397285b9712f08afc573a4d490065ffd5e53e6ef"], ["4A", 8, "LAI YEE LEE ADELAIDE", "黎懿莉", "CHI", "student", "s2210610@student.hpccss.edu.hk", "d0f2b3b915dee0087742fa3ffba15830a8fe0c6f4cbb838293e2dcf1e2a7fbcd"], ["4A", 9, "LAM HOI YU KATRINA", "林海瑜", "CHI", "student", "s230557@student.hpccss.edu.hk", "dec29a6b78ec09ab9a57cecd3414cae5dc574f05e6582e6205fcabbf67454fd5"], ["4A", 10, "LI SUM YU", "李心愉", "TAK", "student", "s230714@student.hpccss.edu.hk", "71dddf3e15e6e348e308aebfab47b3b67313799363e507c24154a4d0fa1945db"], ["4A", 11, "LING HEI YAN YANNIS", "林熙恩", "KAN", "student", "s230755@student.hpccss.edu.hk", "3849b2cb19758190c04a3c671875e1bffa23c8e9539d551010f27113ba9a356d"], ["4A", 12, "NG CHEUK LAM CHERRY", "吳卓琳", "KIN", "student", "s230870@student.hpccss.edu.hk", "a3565947b8f302fc53d6fba72434c7ac2d5a27d2f7d2bb954487714d847eecd9"], ["4A", 13, "NG TIN YAN", "吳天恩", "CHI", "student", "s230912@student.hpccss.edu.hk", "0173ac7d8cd816c4300b018d2e0740a46c5198c5e01a6592687ae1f811140084"], ["4A", 14, "XU LE XUAN", "許樂旋", "TAK", "student", "s231399@student.hpccss.edu.hk", "29de26cbe6b6d4bc39e04588933ce7b6f35163ee4e5def7e1615a5232e7882e3"], ["4A", 15, "YAN CHI QIU", "殷子翹", "KIN", "student", "s231415@student.hpccss.edu.hk", "05f872e953864232aa7e835ec69ee0c7e4c3ad4858cd1ba45e3d4bd8cae51372"], ["4A", 16, "YEUNG KA YU", "楊珈妤", "KAN", "student", "s231431@student.hpccss.edu.hk", "fd3890d6eadbec058251725f86785aedbc11dded6cb5a752f888cb92a29cd30c"], ["4A", 17, "CHAN MING CHI", "陳明治", "TAK", "student", "s2210072@student.hpccss.edu.hk", "3b47fe5cff5cd19ca912857760205a4f29708b2c0a29c69e010632e52f8bf0f9"], ["4A", 18, "CHEN AIDEN KWANYIN", "陳鈞彥", "KIN", "student", "s230128@student.hpccss.edu.hk", "f50ecb33d1b9ff117361671e32a27f6ed87bae11b1cb79d7d9f2796f89a28f57"], ["4A", 19, "CHENG WAI LOK", "鄭偉諾", "TAK", "student", "s230177@student.hpccss.edu.hk", "1c326be4c8f23f0d84c218b94a3ef3d3192201d05c0304a4f61dd893775ecc04"], ["4A", 20, "LAU SHING CHEUNG", "栁承彰", "KIN", "student", "s2210712@student.hpccss.edu.hk", "ca4cb5dc035a09521f621d8660998983bd4639062b32875ac3ee80be5f660278"], ["4A", 21, "LEE CHEUK LAM", "李卓霖", "KAN", "student", "s2210749@student.hpccss.edu.hk", "bff0ae67c9790272472fe19c91bf69add5889e473d6435bfdfe6acf512e3ff4c"], ["4A", 22, "LEUNG CHUN KI", "梁鎮麒", "CHI", "student", "s2210796@student.hpccss.edu.hk", "ebde3a9a6199bdb1d53920e371d032b03180f0cb4dd56dc1f607d0460cabf656"], ["4A", 23, "LIU RAYMOND", "劉燁明", "KAN", "student", "s230763@student.hpccss.edu.hk", "ff1bb495f8fd8b8c5d309c331814317193f3fa1ca55385081a985bd363fa1251"], ["4A", 24, "LUNG LOK TING", "龍洛霆", "KAN", "student", "s230839@student.hpccss.edu.hk", "22312047ebcca99dd37befea8397bdc6259ce5b535aa5209805c08ff0ca16dc1"], ["4A", 25, "QUE VIC", "闕毅", "KIN", "student", "s231001@student.hpccss.edu.hk", "f1444455bd2ea05fd9be7c52def074d98829d8ca54fa4d527ab7f9291e7cb3ad"], ["4A", 26, "SO WING CHUN", "蘇永俊", "CHI", "student", "s231043@student.hpccss.edu.hk", "54bbd9d2efa9ee37e7a7ef816f94eca6fa6040c2b3298a93fb8174451e806ee7"], ["4A", 27, "TAN TSUN HEI", "譚峻熙", "KIN", "student", "s231126@student.hpccss.edu.hk", "393fb86466bca11866cc9e1c55e993d845b0f787036d28ad508db63da3bef8df"], ["4A", 28, "WONG ANSLY LAP YAN", "黃立昕", "KAN", "student", "s231258@student.hpccss.edu.hk", "3f86478797ecaaa0b05ac467e1a69c594b588a62eb9ad1648bc3274bbc236cbc"], ["4A", 29, "WONG TSZ LUNG", "黃子龍", "CHI", "student", "s231308@student.hpccss.edu.hk", "7d25dece64bbf40c1cd07e36d736fedbc3843aa7d2e5a94744be763558199e5a"], ["4A", 30, "ZHANG JIN ZHI", "張進之", "TAK", "student", "s2111580@student.hpccss.edu.hk", "36d45f3f924b429bf4bf053cb5b52c8c834c330386f364855a3e733c2ca22cb1"], ["4A", 31, "ZHAO SHEUNG KWAN", "趙尚錕", "TAK", "student", "s231514@student.hpccss.edu.hk", "f9c31e86b35efd437578f079d9c2f3e3742cec42acd81a59fc186ca2ccdcb330"], ["4B", 1, "AU YEUNG HOI MAN", "歐陽凱雯", "CHI", "student", "s230029@student.hpccss.edu.hk", "f0ac7b88893fcdfb3e38323d7af1d500accebc77f3efd25bac34471af273a7c5"], ["4B", 2, "CHAN PO KA", "陳保嘉", "KIN", "student", "s230078@student.hpccss.edu.hk", "9f8e8c70b58b8bd665917cf80a4e59e098851629e4d2cf8077de8eafd0214d18"], ["4B", 3, "CHAN TING YAN", "陳葶恩", "TAK", "student", "s230094@student.hpccss.edu.hk", "51a137f10a778376f5bff6842775219b8c4d9dce92f99c3d8ef2aff3e512fcf5"], ["4B", 4, "CHEN YI TUNG", "陳依彤", "CHI", "student", "s230169@student.hpccss.edu.hk", "29f1dd99f2d2ea9a110f57334223a92e5ca2921797bcef27c2742b634a3623eb"], ["4B", 5, "HUEN TSZ LAM", "禤紫臨", "KAN", "student", "s230391@student.hpccss.edu.hk", "a2bf496128d0062b3fb32ed8baeb2aa63851990f9a091b479f4cc56a493c022f"], ["4B", 6, "HUI NGA PING", "許雅萍", "TAK", "student", "s230425@student.hpccss.edu.hk", "365f94d8fd95b0bed0effb6cd52a2b220b9ab5378a0c09d58c934dd24fb3a2a1"], ["4B", 7, "HUNG WING KI", "洪詠琪", "KAN", "student", "s230466@student.hpccss.edu.hk", "92141bd7f2e259e722721ed1af6a592c924f5f8f37018cf2dcb484541ead7bcd"], ["4B", 8, "INLOR NAPAPHA", "羅凱儀", "TAK", "student", "s2210519@student.hpccss.edu.hk", "028ba9df5bbf475c94d2def557676511bb5cbc3b5ba57220dd9ad3cc3b596aaa"], ["4B", 9, "LEUNG YING SHAN", "梁熒珊", "KAN", "student", "s230680@student.hpccss.edu.hk", "3a8365a719990831159838c731c82979095eabf34982444a2a2b1198c3b32169"], ["4B", 10, "LUO HEI TUNG", "羅晞童", "TAK", "student", "s230847@student.hpccss.edu.hk", "0b00e374a45e6ed26aecca0b435cd49b72400f406f1ee283d2a42d5ad3bd53d0"], ["4B", 11, "NGAN CHUN YEE", "顏津儀", "KIN", "student", "s230946@student.hpccss.edu.hk", "a89276f5ed68347c5102a3c34fe36c580df6612987d694bee60a6ae465d1d1aa"], ["4B", 12, "TAM TSZ YAN AGNES", "譚紫茵", "KIN", "student", "s231100@student.hpccss.edu.hk", "af8a25cd37c8ba5b909fd366698bdf86aa8dae4a43b52e200742bd3b3609fb12"], ["4B", 13, "TSOI PUI YING", "蔡珮盈", "CHI", "student", "s231209@student.hpccss.edu.hk", "fa24bb446ee07ae3c65f8ef6e7fc32e32f166fb85ab7720da995f7f541bb0465"], ["4B", 14, "TSUI CHEUK TUNG", "徐綽彤", "KIN", "student", "s231217@student.hpccss.edu.hk", "247b4b90ce50fc65cd965ecabf2bfc11953c77dac7f2376a29e249d8bb92c16a"], ["4B", 15, "XU ZITING", "許紫婷", "CHI", "student", "s231407@student.hpccss.edu.hk", "b3b8aec183d2283d3f2b74de8c9c43584fdeee0d5d9c1b1abb6b4c24b59f24a8"], ["4B", 16, "YEUNG SUNG YAN", "楊崇茵", "KIN", "student", "s2211460@student.hpccss.edu.hk", "b06fded6b0307fe1d5a3c5d90df7cf6994bf91048d318284c5f80a0b70739946"], ["4B", 17, "CHAN CHUN MAN", "陳焌文", "KAN", "student", "s230045@student.hpccss.edu.hk", "54ba50f8b7d5384db92cbc603103266e0eb3b478eca4e28cc66d4d6ebf306728"], ["4B", 18, "CHAN SHEUNG YIN", "陳尚言", "KAN", "student", "s2210106@student.hpccss.edu.hk", "90f754c8e6a99023115f2c5775cb84e4913b928a374cfef9c18f85805601d56a"], ["4B", 19, "CHIU DEX HOI TING", "趙鎧霆", "KIN", "student", "s230201@student.hpccss.edu.hk", "1b6fb817d96feec4d88ecdf8b91a11f37e42106ba913722c2cc6999b15106f89"], ["4B", 20, "CHU YAT CHUN", "朱逸駿", "KAN", "student", "s2211601@student.hpccss.edu.hk", "7af482ab6bc08c56ffd5e10956f1cc650ee0982d90acc9d65c5baa88a9e6abf7"], ["4B", 21, "FU CHUN LOK ETHAN", "傅俊樂", "KIN", "student", "s230284@student.hpccss.edu.hk", "ae6cfb6d88c0ab274ecc0242610ce85db6c387ec041d9ec93acd55258c039bc1"], ["4B", 22, "HAU CHIT LONG", "侯喆朗", "KIN", "student", "s230326@student.hpccss.edu.hk", "e499e7717ba53e7e31d2f7f12e995bbdccc0c9bcae963d12277ff2c13eabaf9c"], ["4B", 23, "LAU HIU YUI", "劉曉叡", "TAK", "student", "s230573@student.hpccss.edu.hk", "00049f5d2f5fe56d88f5b54cc976ce8756e838bf01344e87f97ee77185a88a54"], ["4B", 24, "ON YIK YU TONY", "安億宇", "TAK", "student", "s230953@student.hpccss.edu.hk", "bd627202c408121d285f3bce921eaaf6881cf9c054bfda7ba439962f91f8c129"], ["4B", 25, "SO WING CHUNG", "蘇永聰", "KIN", "student", "s231050@student.hpccss.edu.hk", "7ca1273a71dd340c4fbe755c7308cbd207340f8c112cc9247e0e88253eecc3e8"], ["4B", 26, "TAN HUNG YU", "譚洪羽", "CHI", "student", "s231118@student.hpccss.edu.hk", "122a78019d62752ce310a9ba162d7f45bdad435999ae197017b5a2ca52e223d7"], ["4B", 27, "TSANG CHEUK LAM", "曾卓霖", "CHI", "student", "s2211170@student.hpccss.edu.hk", "6b1797d79499ba26c3a7994ad4e719844f2fdcde1586a2769807a6090204c06c"], ["4B", 28, "WU YAU SAN", "胡佑燊", "CHI", "student", "s231373@student.hpccss.edu.hk", "73122d300632937f6150101acf3f5ee75bf2529d4c361f1f95236f6eb6d5a873"], ["4B", 29, "XIE YU TUNG", "謝雨桐", "KIN", "student", "s231381@student.hpccss.edu.hk", "e22cf312ee60b4b8e44afb5521e628f327e95dbd12a097fdeaf10df92b6c266b"], ["4B", 30, "YAN JACKY TSZ HIM", "燕梓謙", "KAN", "student", "s231423@student.hpccss.edu.hk", "9b8bf70f64b1c84700d87ae77ffddd1b931770165075192e11af4790a73b4738"], ["4C", 1, "CHEN HONGRAN", "陳泓然", "TAK", "student", "s230136@student.hpccss.edu.hk", "2c9e8bff14d79bd7e144a6eda3de33e96db7ecb6ed67dca3d03c39ba4a5c22b7"], ["4C", 2, "CHEUNG SUM YUET", "張心月", "KIN", "student", "s230193@student.hpccss.edu.hk", "23368e11bfe6e4a6749b4210e59adea9d3ac88ce6e638c0867f6118ca384611d"], ["4C", 3, "CHEUNG VERONICA", "章文力", "TAK", "student", "s2110312@student.hpccss.edu.hk", "bff5dc1b5d5727db4240f7ad170fe57c689c5d949f2b70e506487c77f8f21e2f"], ["4C", 4, "CHOY KA YEE", "蔡嘉儀", "KAN", "student", "s230227@student.hpccss.edu.hk", "0654d39d9ca40e3fb9c48184097e5d41dd3c295c26767a8d7ed8674c85c5dd99"], ["4C", 5, "HUANG TSZ WAI", "黃子慧", "TAK", "student", "s2210464@student.hpccss.edu.hk", "832eaffb99394708ec0ce7453b39de4f09aade95af822750faeaeb31983bc808"], ["4C", 6, "HUNG TSZ YI", "孔子怡", "KIN", "student", "s230458@student.hpccss.edu.hk", "c7311ce7f8658e49d562024a70b9c00886c312a5a626375d17338ba7ee56fa60"], ["4C", 7, "KWOK KA YUET CONSTANCE", "郭家悅", "CHI", "student", "s230508@student.hpccss.edu.hk", "2b30809ae7123096fe1a4abfe8084ce855cb5b9734212a4283642e34e62395be"], ["4C", 8, "LEE YING TUNG", "李映彤", "KAN", "student", "s230631@student.hpccss.edu.hk", "c202c2aa385b1e8a936aaddcaa6220f6c5a3452aa9c4704be3bcbf07846e6879"], ["4C", 9, "LEUNG HOI LAM", "梁凱琳", "CHI", "student", "s2210814@student.hpccss.edu.hk", "77dba62591a505c344b16380c885a78098f89788a469f77f150275043f86c2fc"], ["4C", 10, "LIMBU LAXMI", "周心如", "KIN", "student", "s230748@student.hpccss.edu.hk", "f99673515914b741f229c41305a513f3b0817f5c56d7ee1e8f7c57153750dbf6"], ["4C", 11, "LIU WING SUM VINCY", "廖泳芯", "TAK", "student", "s230789@student.hpccss.edu.hk", "136ca1dd1b15151bc20ecf27fa23113507d037ed0673eda70a6321f219875f69"], ["4C", 12, "LO HAU YI", "羅巧怡", "CHI", "student", "s230797@student.hpccss.edu.hk", "c702935b2df0aeba30b5f437f121cb24ac8d0c6e0914494b3fc2fe5782364a64"], ["4C", 13, "MAK HO CHING", "麥可晴", "CHI", "student", "s230854@student.hpccss.edu.hk", "7776f793ab5a4ccbeee89ec74e0b08c7cf04d6b4a88bb852315cdaa61ab0177d"], ["4C", 14, "PONG YI CHING", "龐懿婧", "TAK", "student", "s230979@student.hpccss.edu.hk", "1217c2290b4c52f33d743957daa8aa247b0753e542cc5c8a8c8c2f1a83c39522"], ["4C", 15, "QIU SHIHAN", "邱詩涵", "CHI", "student", "s230987@student.hpccss.edu.hk", "153749ad029c7a78f17f6fd01639e3bd4bfc0bc992914e34033b7e09a8d369b0"], ["4C", 16, "TAI CHUNG YAN CHERRY", "戴頌恩", "CHI", "student", "s231076@student.hpccss.edu.hk", "a83f57cc140b73d83fb8966d1cda4ca14ba39a02f0171002c4c959cae39a3da0"], ["4C", 17, "TSANG YEUK HAM", "曾若涵", "TAK", "student", "s231191@student.hpccss.edu.hk", "7c9430dfe782d1f62d467542bfb6324042b6b20fd4fabe3cdaf201ff29c4b7ff"], ["4C", 18, "WONG HO YAN", "王皓殷", "KAN", "student", "s231274@student.hpccss.edu.hk", "19cd9ef3421de455a61244c5a9398414fa0f8ce25f462357aaa23f748ec60644"], ["4C", 19, "WONG LOK YEE", "黃烙怡", "TAK", "student", "s231282@student.hpccss.edu.hk", "185d9ef0341e756bfea5a47e5976e38e2151e817b2f8706b3a4a694c455318eb"], ["4C", 20, "YIU CHING TUNG", "姚靖彤", "KIN", "student", "s231498@student.hpccss.edu.hk", "fa60b37945e7b4c6b0d4f456bb18c953b09982b19497da62af2d930142fddfa0"], ["4C", 21, "CHEN JIANLIN", "陳建霖", "KAN", "student", "s230151@student.hpccss.edu.hk", "b848f02e1e4b442f04bf48311e65bb403ea6f1dffb58cab18ccc360cb18a5aa0"], ["4C", 22, "FAN CHUN TING", "樊峻庭", "CHI", "student", "s230276@student.hpccss.edu.hk", "e35eaa2bfb8cd83a4f3bcb3dea6f6108d6e5824ac04d088c6528564bfdba0c26"], ["4C", 23, "LAM HEI HIN", "林熙軒", "KIN", "student", "s230540@student.hpccss.edu.hk", "b2cff4812f93b337f435dfdb387d8d7dbf0978db35102d0e5434bfd0b34e072d"], ["4C", 24, "LAU WAI LOK TERRENCE", "劉韋樂", "CHI", "student", "s230581@student.hpccss.edu.hk", "64eff4c854f9aa4d84df789540a8aa68f7892efee0568176a2ae70981d0c8606"], ["4C", 25, "LEUNG CHEUK HEI", "梁卓禧", "KIN", "student", "s230649@student.hpccss.edu.hk", "904a8d300be4d9c6e13b367bc454b992748d89515c2453e101c44ae1ce101718"], ["4C", 26, "LI PAK KIU", "李柏翹", "CHI", "student", "s230706@student.hpccss.edu.hk", "eecd8f3245a09bffaa5fd0107d5325c18fd1b47f9ab18a6587c45d6c1fedf215"], ["4C", 27, "LOK TIMOTHY HO TIM", "樂可添", "KIN", "student", "s230805@student.hpccss.edu.hk", "d95179c8c8b22bdbf841dac047c13d188e566b23112d98a33eac259109fe4410"], ["4C", 28, "TO CHEUK YIN", "杜卓彥", "KAN", "student", "s231134@student.hpccss.edu.hk", "d88aca44d74b4ebda7bd44d527b1ba53571477254709fcdec640bfeb5a5fdc09"], ["4C", 29, "TSANG HIN CHUN", "曾憲晉", "CHI", "student", "s231167@student.hpccss.edu.hk", "5f78ec09b1237a5864adbd473c734132d5385eb0dab04e2915042e9307eae087"], ["4C", 30, "WANG SZE HANG", "王思行", "CHI", "student", "s231233@student.hpccss.edu.hk", "e1fff9cb6df603baa66f09ff216347e9b42b254d4d7fd9da200d0da3fa056bab"], ["4C", 31, "WONG HO HEI", "黃灝熹", "CHI", "student", "s2211293@student.hpccss.edu.hk", "c190047af038de9fc35743aaac1267678b49db16a9d0834d1582190050261249"], ["4C", 32, "WONG TSZ YUI", "黃子睿", "KIN", "student", "s231316@student.hpccss.edu.hk", "700e2cf7fcde6f4ad83a2689d4c41d9d658c07a2892299d6d0fe669ec7722827"], ["4C", 33, "WONG YAT HEI", "黃溢曦", "KAN", "student", "s231324@student.hpccss.edu.hk", "a0b035f4fa70ee1473076de2ba704ec0d02ee709555ae74b4cdeeeb945e59349"], ["4D", 1, "CHUI TSZ KI", "徐子琪", "TAK", "student", "s230243@student.hpccss.edu.hk", "15baadd3f2f15424568d52c67c234b9c0670a3bfd55a898c7e8df1534f470c31"], ["4D", 2, "FU WING YI", "符詠怡", "KIN", "student", "s230292@student.hpccss.edu.hk", "5f2120cc7f37d96c279f925ff79bf23f93126095373d000a8ab5af3c703351f5"], ["4D", 3, "HO YUK YEE", "何鈺儀", "CHI", "student", "s230367@student.hpccss.edu.hk", "95f0d486081f334c3096fc01df4cefb2a448daa06774888e3f0c208fa47a24bc"], ["4D", 4, "HUANG YI", "黃怡", "KAN", "student", "s251595@student.hpccss.edu.hk", "518cde997550581abdebddc37a0e1772e83c574df67f8693579f3d57b557b001"], ["4D", 5, "LEE KWOK HUEN", "李幗烜", "KIN", "student", "s230599@student.hpccss.edu.hk", "fb1ed5a4a73a6732cb16f54947f38f3763aa8ddb7a99b08a39ce78ae869730e3"], ["4D", 6, "LEUNG WAI KIU", "梁惠喬", "KIN", "student", "s230664@student.hpccss.edu.hk", "1680f0c023789b7b377b46123c523faa5b6bbbbc802cf7c0955bf1b4b96cfabe"], ["4D", 7, "LI TSZ YU", "李芷如", "CHI", "student", "s230722@student.hpccss.edu.hk", "9d0af3494a650542901b1f8d0ca7221a28be3f6893f15f86adb8419b9bc8a67b"], ["4D", 8, "QIU WING LAM", "邱泳琳", "KIN", "student", "s230995@student.hpccss.edu.hk", "3a76987b18a99432bf5d4600cf255febcfd7937bcb3a32bfd142d4fba9e27f83"], ["4D", 9, "TSAI TSZ CHING", "蔡紫晴", "KAN", "student", "s231159@student.hpccss.edu.hk", "047ab2dadf2ec1a87f47a8da404d519a7222a5cb013de8761737fa59a640f8e0"], ["4D", 10, "WONG YEE MAN", "黃綺珉", "CHI", "student", "s231332@student.hpccss.edu.hk", "96b0271bf61eee17f100f612f020ae788ef1ed56eede829c6d1e1d87a04e2962"], ["4D", 11, "WU PEI JIN", "吳佩瑾", "KAN", "student", "s231365@student.hpccss.edu.hk", "f74b15f5bb49cf88e17319e076a8b872aeea4bf5b374c3abd6483d67df06c98d"], ["4D", 12, "CHAN MAN HEI HAYDEN", "陳泯羲", "TAK", "student", "s230060@student.hpccss.edu.hk", "5a31d17d5a939145021718bc4a691aaa096e2cd5568b3c1def1f5a84effae9a7"], ["4D", 13, "CHUI TSZ KO", "徐子高", "TAK", "student", "s230250@student.hpccss.edu.hk", "167ca1d2ef85c7d86b50d57d9475818caf296171729bbd84abe8da113848355a"], ["4D", 14, "GUO JIANQIU", "郭澗秋", "KIN", "student", "s241620@student.hpccss.edu.hk", "03587fa2f089514b1e61ec89274233ad42c3945c4ba86d847297a6bf8d518fdb"], ["4D", 15, "HO CHEUK LAM JACK", "何卓霖", "TAK", "student", "s230334@student.hpccss.edu.hk", "0f807594d39af81c406ce6776487dc7e37f81853e525e5f5752c62366ab7aa0b"], ["4D", 16, "HO CHO ON", "何祖安", "CHI", "student", "s230342@student.hpccss.edu.hk", "051f1756cbdf51ebb7813579c4a459e813204a06c641925ae244e5e1b81f86ed"], ["4D", 17, "HONG TSZ HO", "洪子豪", "KIN", "student", "s230375@student.hpccss.edu.hk", "b1ddf7cf043cdd841a05f0ad3b9f9ac491000e40ecef8bdeb0c6d7fc24a58ba5"], ["4D", 18, "HUI YUN HIN", "許潤軒", "KIN", "student", "s230433@student.hpccss.edu.hk", "9092565fc95f62e67fa551337d4549849205687efcef61ecfacb578c2e6329ce"], ["4D", 19, "KAN PUI KEI", "簡培基", "TAK", "student", "s230490@student.hpccss.edu.hk", "9d8c2096d76c00622a071f58f35d6834d54b0ed84dd78efa8833af6007a0b81a"], ["4D", 20, "LAN ZE CHENG", "蘭澤成", "KAN", "student", "s230565@student.hpccss.edu.hk", "932b9222c6b5e2ec702211bce9b385fa6d75e1a8c328768ff1f78ec581a4923b"], ["4D", 21, "LEE NGO CHIT", "李傲哲", "TAK", "student", "s230615@student.hpccss.edu.hk", "ec16b855e888fdde8b4ea7ef3669682f62d2231cb9da856ae51a7838e7035148"], ["4D", 22, "LEE SHING YU", "李承裕", "CHI", "student", "s230623@student.hpccss.edu.hk", "37532ce24e95abcedf52356e5bb41e25932da8c416e322429d007f54d795fb17"], ["4D", 23, "LI HAU SIN", "李厚善", "TAK", "student", "s230698@student.hpccss.edu.hk", "5105cf7576393e6f221897e65b1c50274404a3795f2d35ac162fb515109db7a9"], ["4D", 24, "LIU WAI LAP", "劉爲立", "CHI", "student", "s230771@student.hpccss.edu.hk", "8b9fd87d56ce76051f9796bb79e4bfc3365fee03d5f34d304575429ef9a6bf1b"], ["4D", 25, "NG YAT KIU", "吳逸橋", "KAN", "student", "s230938@student.hpccss.edu.hk", "b369ab1ff332acae584b31465a61ccaa32f2735472231078f426bcb671a887a2"], ["4D", 26, "PENG WEI FENG", "彭偉峰", "CHI", "student", "s230961@student.hpccss.edu.hk", "b0969ee5c3fd23da507b5b184a455f222e5a81639a9ae2c10fe276f7c47d7d62"], ["4D", 27, "SIU HOI CHUN", "蕭凱駿", "TAK", "student", "s231035@student.hpccss.edu.hk", "61abf484797b2de718ce5dd93eff2bc64ea3a0c341a83743c9df7ae57ce6e668"], ["4D", 28, "SONG GUORUN", "宋國潤", "KIN", "student", "s241695@student.hpccss.edu.hk", "0fcac7d5d4876593ef9c7859391d21c39e88845d34f08308b7fab241e2469a2c"], ["4D", 29, "TAN ZHENGTING", "譚正庭", "KAN", "student", "s231597@student.hpccss.edu.hk", "93d358928689fdb36d3f35d98281b49a2676c852de379dc8a5870ced1a91b865"], ["4D", 30, "WAN CHEUK NAM", "溫綽楠", "TAK", "student", "s231225@student.hpccss.edu.hk", "9229b302a270846ff23351384894c432daf5a46d89db7d7abc1ac9ddda296aa7"], ["4D", 31, "WONG YIN HO", "黃彥豪", "TAK", "student", "s231340@student.hpccss.edu.hk", "907b5a44d89c8daf45581d4f6cf85968fd71e907de8b9624657012020a4a2da2"], ["4D", 32, "YEUNG MARCUS MAN CHUN", "楊汶晉", "TAK", "student", "s231449@student.hpccss.edu.hk", "67a50633878a18a4396fec6c39514054436cda0096ea9016fd8b0fb527179395"], ["4D", 33, "YEUNG TZE LOK", "楊子樂", "CHI", "student", "s231464@student.hpccss.edu.hk", "4b0d650e95776ce2144bc56ea34ab452b518e676d2a596ac84356eabe252c817"], ["4D", 34, "ZHUO ZIYUE BILL", "卓梓岳", "TAK", "student", "s241612@student.hpccss.edu.hk", "4b1b561d975075cc72586a8d413eb9702ca6f4603e35f46971a1e4651809109d"], ["4E", 1, "CHAN KA LAM", "陳加林", "CHI", "student", "s230052@student.hpccss.edu.hk", "cada84ca3f94288a7f7bf09b78affcb6b9bfabb891b8060372218a56a28c6014"], ["4E", 2, "CHUNG SUM YU", "鍾芯茹", "CHI", "student", "s230268@student.hpccss.edu.hk", "5c09d66488d1b11240c5e6a5467bb41879d3673e2b7ff73ff035ddc9d52a063d"], ["4E", 3, "HO YI KIU", "何伊翹", "TAK", "student", "s230359@student.hpccss.edu.hk", "7c41782791060dbbe056233dcbb3a0e2897ab1ed47585b7088ec3b64abcc971a"], ["4E", 4, "LAI SUI YING", "賴瑞瀅", "KIN", "student", "s230516@student.hpccss.edu.hk", "340cb57c60711904029d259b23a272bac6a7c06f4bd98fa6ff330b5cdcaa1603"], ["4E", 5, "LEUNG HIN CHING", "梁衍晴", "TAK", "student", "s230656@student.hpccss.edu.hk", "66d24963d9fc70eb13f948128befc745432a5da480d862a89fa42d0c3723e1ba"], ["4E", 6, "NG JING HEI", "吳婧僖", "KAN", "student", "s230888@student.hpccss.edu.hk", "6514dab527919e1bd609a78dfa163a9e7f614995eb8fb75b1f6b3c0cecf1e729"], ["4E", 7, "SHIH NGA NING", "施雅寧", "KAN", "student", "s231019@student.hpccss.edu.hk", "a39715429abe4327f04143e06b7b50a3d89abaed87cc510cede4b809a5802ebe"], ["4E", 8, "SUEN HO YAN", "孫澔恩", "TAK", "student", "s231068@student.hpccss.edu.hk", "181e3cd00c2c583b907f8cd0733f5adbc53a8c2edfc23eae036a28bf4bc004f5"], ["4E", 9, "WONG YU KA", "黃裕嘉", "KIN", "student", "s231357@student.hpccss.edu.hk", "68fb4ccb7f21040e6542dc99541bbfdf71355fec18d02de35269fc53dbf43cf1"], ["4E", 10, "YEUNG SUM YAU EUNIS", "楊心悠", "TAK", "student", "s231456@student.hpccss.edu.hk", "d8c176a1ac9a6510e216025447ab1f455abc7a56a87756b62a46dca98be5c831"], ["4E", 11, "YIP YI SHA BRIANA", "葉伊莎", "CHI", "student", "s231480@student.hpccss.edu.hk", "26fbddc9b59c2241aada02082508bbeef33f146554c3b1900521f6f90bcc95f0"], ["4E", 12, "ZHONG CHING CLARICE", "鍾澄", "TAK", "student", "s231522@student.hpccss.edu.hk", "766404805da35b36742d6e96de8e07c4473a4769ee80aecbd7d9df8b5153a2ca"], ["4E", 13, "ZHOU HOHING KATHY", "周可馨", "KAN", "student", "s231530@student.hpccss.edu.hk", "f63e57a8eae3db837f51d44be045a7549ff56a38224f65014e43307ce28e2cb0"], ["4E", 14, "ZHUO ZHIQING CATHERINE", "卓芷青", "TAK", "student", "s231548@student.hpccss.edu.hk", "b95ed8194e18b6e0fe7159df8a472d0315359ef70ce677976a1f60a2da8b7b59"], ["4E", 15, "AU KAI LAM CALEB", "歐啟霖", "CHI", "student", "s230011@student.hpccss.edu.hk", "d81c05df3c862c03c2e54dd3bd4ea5e77c0a0955a115fa7b0ba85774d21e342b"], ["4E", 16, "CHAN WAI YIN MARCUS", "陳煒彥", "CHI", "student", "s230102@student.hpccss.edu.hk", "40dc811ff7a996eecbdd81cf02a22a537861b0937c1706e0a2563ab1548d6eca"], ["4E", 17, "CHAN WAI YIP", "陳緯業", "KAN", "student", "s230110@student.hpccss.edu.hk", "a27cfd6499b4c2fe5838d1c225447ad4c215da900226d02045acb7632fd2e0e3"], ["4E", 18, "CHU TAK HIM", "諸德謙", "KAN", "student", "s230235@student.hpccss.edu.hk", "560ee154d62037fa5fd0a411338cbb41a351c35e27d9cd2c5e7c1b9f30f14dba"], ["4E", 19, "FUNG TSZ SUM", "馮梓琛", "KAN", "student", "s230318@student.hpccss.edu.hk", "39636d989c9ddd2365fe4fb8dfc63fd48de0761f48d0ff85709c906ca1615086"], ["4E", 20, "HUI CHENG WAI", "許鄭維", "TAK", "student", "s230409@student.hpccss.edu.hk", "3b1b1c5b97d42f397289544de02f96d5862f4141135a175ff5232a2bee4769d1"], ["4E", 21, "HUI CHUN KIU", "許晉橋", "CHI", "student", "s230417@student.hpccss.edu.hk", "f81bd976c17823821e04a8c70d09bcd7cb1e6ef233699507aeb2d636801d0495"], ["4E", 22, "JIANG HO CHING", "蔣皓程", "KAN", "student", "s230482@student.hpccss.edu.hk", "06a390066edbb8bec07289ca14d6e29fa57610505a4297b8cccff7482b607081"], ["4E", 23, "LAI YAT LONG", "黎溢朗", "CHI", "student", "s230524@student.hpccss.edu.hk", "12770db9b05f9b274e1e7d2ae7d13980086fe09674d2e3e86dd5be183bd60385"], ["4E", 24, "LEE MAN HIN", "李汶軒", "KAN", "student", "s230607@student.hpccss.edu.hk", "6bf7258b52e8cd517696a2e242b73821d13731c2f02f0edfd511138f2847cb4f"], ["4E", 25, "LEUNG YEE SHUN EASON", "梁爾信", "KAN", "student", "s230672@student.hpccss.edu.hk", "e5f9865ebf66c8551fc620e0847bfd6cfe615a1d454534f14a5c1753bbd671fc"], ["4E", 26, "LI YIK HIN", "李易軒", "KIN", "student", "s230730@student.hpccss.edu.hk", "defd484885c75fd38a2d96bdff02bf02615865b31cadd9ced05a6698c5dba02e"], ["4E", 27, "MAN TUNG TAK", "萬垌德", "TAK", "student", "s230862@student.hpccss.edu.hk", "99c05eee7590cf563e764b2f50d58b4976ea66fcad6a7936e22ed834a276e931"], ["4E", 28, "NG TAK LONG", "伍德朗", "CHI", "student", "s230904@student.hpccss.edu.hk", "ca86d2a4950ae18b8d2446bd1ee3dcfd4664c611b8e60a6690a394a5c6dc07e3"], ["4E", 29, "SIT ALVIN", "薛仲翹", "KAN", "student", "s231027@student.hpccss.edu.hk", "3f6b6b14f028e6c65bef568d51987a43aba0f5cfb91e30060ebfac629d6d03fd"], ["4E", 30, "TAI YU HO", "戴裕豪", "KAN", "student", "s231084@student.hpccss.edu.hk", "e4505f1abc1148970a949a2d072a8c26f698b0f17b4837f7f8bba8db06ca0640"], ["4E", 31, "TAM TSZ CHUNG", "譚梓聰", "TAK", "student", "s231092@student.hpccss.edu.hk", "2a549fcb7aad3746a95d907abdd34c0ff1687e35671e138f34f189b3973afbb6"], ["4E", 32, "TSANG HO LAM", "曾浩霖", "KIN", "student", "s231175@student.hpccss.edu.hk", "c7665378b72c2e27745af3a70e61b0cf8ae85f7f48f68963efff56e60faaa907"], ["4E", 33, "TSANG PAK HEI", "曾柏熙", "KAN", "student", "s231183@student.hpccss.edu.hk", "1eee24dd72dbae0f90af318c959447588b130188db2140aa1b471bf5a06d010d"], ["4E", 34, "WANG ZI SHEN", "王子燊", "KIN", "student", "s231241@student.hpccss.edu.hk", "b3b078918ef26f148af5fe9ab7c41c5cead59f939f02705276e1be74aff349fc"], ["4E", 35, "WONG TSZ LONG", "黃祉朗", "TAK", "student", "s231290@student.hpccss.edu.hk", "65e89480416c28c870a6e131ff7b1a0365618af3b7611c04c6f94738773f08db"], ["Supervisor", "", "SZETO WAI TUN", "", "", "supervisor", "wtszeto@hpccss.edu.hk", "190d8b4272614a707dddd3604dd28eb7a754edccb530b1a7c9c2ffa58b609652"], ["P", "(CTN)", "CHEN TAK NAM", "陳得南", "", "p", "tnchen@hpccss.edu.hk", "87761ed5521e169eac9c021ef843f2dc51edb2d64628a9d037ea27d59a24a425"], ["VP", "(LU)", "LUI FU ON", "呂富安", "", "vp", "folui@teacher.hpccss.edu.hk", "bc69b6fe08db245353ba92605619770f00cebe47f8afff146eed642dea906c13"], ["VP", "(MKM)", "MAK KA MAN", "麥嘉文", "", "vp", "kmmak@teacher.hpccss.edu.hk", "717294a3e09d65d89547ab1a708ded2f43f36fd399678c1142a6760edff7432b"], ["VP", "(CHI)", "CHEUNG HAU CHI", "張巧芝", "", "vp", "hccheung@teacher.hpccss.edu.hk", "05e2e0a03557aeb9c71bc22af0d53e0d39b9551a4d8b20706e75678648da5e72"], ["AP", "(LHT)", "LEUNG HOI TIN", "梁皚鈿", "", "staff", "htleung@teacher.hpccss.edu.hk", "a0a3893e575fcce6ce1b95f9809c83b894761957df523208525336cfc03d0ebd"], ["1A", "(LA)", "LAM YUEN MAN", "林婉雯", "", "staff", "ymlam@teacher.hpccss.edu.hk", "63e5070a5cfca70000bd73a6df0f21a0d52d20c1375521ad1ad01d56ddf9eb55"], ["1A", "(OCY)", "OR CHEUK YIN JEFF", "柯焯然", "", "staff", "cyor@teacher.hpccss.edu.hk", "3247c525ca2089f770fe230e76450e758121e1fa9df26b47f8735d68f8b6709f"], ["1B", "(YSY)", "YAU SHEUNG YUNG PETER", "丘尚融", "", "staff", "syyau@teacher.hpccss.edu.hk", "771981a0b32d1b17f69a7e6c711943de415cd4daaa4733f8c58770012b84e4db"], ["1B", "(TST)", "TANG SIN TING", "鄧倩婷", "", "staff", "sttang@teacher.hpccss.edu.hk", "9eacf76d5fbf6b3c834527e797c7afe8d8585544de90047b54fc7ab0f8b0797e"], ["1C", "(MT)", "MAN HOI TING", "文凱婷", "", "staff", "htman@teacher.hpccss.edu.hk", "5f11bc1efde51d6eb463593f18970e7d2d0d2700db9246fe09f62d3f24ec183b"], ["1C", "(DJW)", "WOO DAVID JAMES", "馮振雄", "", "staff", "djwoo@teacher.hpccss.edu.hk", "7eccfdc957f4a306434daab59a4a8effcbbaf3e569f4ef21be89b96ed9db6b2c"], ["1D", "(CY)", "CHAU SAU YING", "周秀英", "", "staff", "sychau@teacher.hpccss.edu.hk", "f0309b8200ecac8d747995e01241f6edd710e044dcf97c4a689bdb93ef6ed150"], ["1D", "(WCK)", "WU CHING KWAN", "胡靖昀", "", "staff", "ckwu@teacher.hpccss.edu.hk", "5dd37344e6040f133a5cadb6cf70774715e7c854630f4dfbd3cc04387b6ce832"], ["1E", "(FNY)", "FUNG NGA YAT MICHELLE", "馮雅逸", "", "staff", "nyfung@teacher.hpccss.edu.hk", "66baea5aada2ec9848384687a7ca2085ae4124e0f7fa689377def22868b45e70"], ["1E", "(NSM)", "NG SAU MAN", "吳秀雯", "", "staff", "smng@teacher.hpccss.edu.hk", "0083d3f5190a96d264c338cf462ea9da0bccb69d28eac8b5bd13a529d1933f48"], ["2A", "(CSY)", "CHAN SHU YAN CLEMENT", "陳澍昕", "", "staff", "sychan@teacher.hpccss.edu.hk", "0dac8839ffb801281ad09c9778e3bc185082d16702c1cf9c07fb472269607699"], ["2A", "(THY)", "TSE HOI YAN", "謝凱欣", "", "staff", "hytse@teacher.hpccss.edu.hk", "3618bc78f1df0ddda696a922e3cf7f45d4354daa68d0b5d9d50d6a46c5f70208"], ["2B", "(CTL)", "CHOI TSZ LEONG", "蔡子亮", "", "staff", "tlchoi@teacher.hpccss.edu.hk", "37f552669350953800ba7affff2130ec2533b3b3c6c3f17e2ef1b1ee7b57f7e6"], ["2B", "(LHK)", "LI HING KA", "李慶嘉", "", "staff", "hkli@teacher.hpccss.edu.hk", "63f77ba851dec31bc109ab964116dfc6716b97d731bed8f89b7d33fab8e58c4f"], ["2C", "(LHL)", "LAM HOI LAI", "林海麗", "", "staff", "hllam@teacher.hpccss.edu.hk", "a61a15a0620c0bbc12bb33dffa6dca122b311c88203d4a60748fc6cdc4919103"], ["2C", "(CCY)", "CHONG CHUNG YI", "莊琮懿", "", "staff", "cychong@teacher.hpccss.edu.hk", "5b9f337b2935b3714e8d241a8d8a5c83625113a982795beb9859af25051d2ad0"], ["2D", "(NPY)", "NG PUI YING DEBBIE", "伍珮瑩", "", "staff", "pyng@teacher.hpccss.edu.hk", "fcf51be899974350c34835a34d0a4d9521b507677d7a91d077a1c7501755f235"], ["2D", "(WTY)", "WONG TIN YUEN", "王天緣", "", "staff", "tywong@teacher.hpccss.edu.hk", "f9f89803744c8998649992aed5394ee0c4546902de9ba549465f286081f9994e"], ["2E", "(WYH)", "WONG YUEN HING", "王婉馨", "", "staff", "yhwong@teacher.hpccss.edu.hk", "1200f8f436324aa6044b5081821405311b98cac9859d47b4bfc928144235d591"], ["2E", "(WCH)", "WAN CHI HO", "尹志豪", "", "staff", "chwan@teacher.hpccss.edu.hk", "772c12db732fd4f1508d1121fe421877648834c78dde66802b29ddecf140564d"], ["3A", "(WWC)", "WONG WING CHEUNG", "黃穎璋", "", "staff", "wcwong@teacher.hpccss.edu.hk", "75815624742e8c9282eb69b2084693b55976475953ef0b645797782bbdd44a87"], ["3A", "(HMS)", "HUI MEI SHAN", "許美珊", "", "staff", "mshui@teacher.hpccss.edu.hk", "0d09d600603aebf283a3c38a563bf9180663eb7dd519269f3b01e206d6350c80"], ["3B", "(CKW)", "CHOW KA WING", "周嘉榮", "", "staff", "kwchow@teacher.hpccss.edu.hk", "6118f4dd10a0b4a0dcc4084854754ed4326c54743ead647748f4f6bbc0017e93"], ["3B", "(HYL)", "HO YIU LAM", "何曉琳", "", "staff", "ylho@teacher.hpccss.edu.hk", "652d5ed7d543aec4f94aefe9e091e0492bd09c340f24d3c33840325a1caee33c"], ["3C", "(NK)", "NG KA HUNG", "吳嘉鴻", "", "staff", "khng@teacher.hpccss.edu.hk", "742e4c6d5440f5ab7ccb9a0d6aabc3b8dbafb40c5f9f3fedfcc8f876c735ad9c"], ["3C", "(CKYC)", "CHAN KA YING", "陳嘉盈", "", "staff", "kycchan@teacher.hpccss.edu.hk", "d69a0ede52c903180d3dbef3f73af79294e7a26154b801faeabcdf04621b547b"], ["3D", "(LYL)", "LAM YAN LEONG", "林恩亮", "", "staff", "yllam@teacher.hpccss.edu.hk", "08aa21a25f6f09f992a196542058545d455f20eb9ed568c22ed6a9547a1d077a"], ["3D", "(CWSA)", "CHEUNG WING SZE", "張詠斯", "", "staff", "wscheung@teacher.hpccss.edu.hk", "a341beab628b63278fbb6b844976d21a2ad4467913031b40f718425395c23dbb"], ["3E", "(LCH)", "LAU CHUN HUNG BARRY", "劉俊雄", "", "staff", "chlau@teacher.hpccss.edu.hk", "b2bd7f2917e6fa31a462cfc4d78d35770786a7343c0c957684af4f9d0770435e"], ["3E", "(CWL)", "CHAN WAI LAM", "陳蔚琳", "", "staff", "wlchan@teacher.hpccss.edu.hk", "dabdf5a6ea0f637f6402801695e1072f966ddad0629c8d36d4c5cc82a0d9c6bc"], ["4A", "(TYM)", "TAM YEE MAN", "譚綺雯", "", "staff", "ymtam@teacher.hpccss.edu.hk", "e1accaeeaca6a5c3c81f96b153911a04dbfe85cfc7dd7fb326379e1e59f8a44f"], ["4B", "(CTT)", "CHEUNG TSZ TUNG", "張子彤", "", "staff", "ttcheung@teacher.hpccss.edu.hk", "53682186d74822468fece7448058945b04c49e0325ed74cc5b3cd506db2d6287"], ["4C", "(YH)", "LAU YIN HUNG", "劉燕虹", "", "staff", "yhlau@teacher.hpccss.edu.hk", "61cc7d0bd68c9dc56b7406447d72851dc56670de86bd48a44b053a73835ac354"], ["4D", "(LYS)", "LEUNG YUEN SHAN", "梁婉珊", "", "staff", "ysleung@teacher.hpccss.edu.hk", "ad9f92dad51958c007f9b78a57e22cdbc85dfe3ac1a44723ea0aec9411285a5e"], ["4E", "(LSY)", "LI SIN YEE", "李倩宜", "", "staff", "syli@teacher.hpccss.edu.hk", "efcea81e15f8ab0b3ed512f77b56f5319d9db2f5d6dd1befb5b6f135d00e3bcf"], ["5A", "(CWS)", "CHAN VINCENT WING SHUN", "陳頴舜", "", "staff", "wschan@teacher.hpccss.edu.hk", "aea44860c69caf2b3a116323ce539e62268025ec8d8d3eb1031d571831309a5b"], ["5B", "(QW)", "QIAN WANJUN", "錢婉君", "", "staff", "wjqian@teacher.hpccss.edu.hk", "72506441001d19a5ef0e822d4bb0713e501e2482ff5fcd4ade35bd11ffa8213f"], ["5C", "(LKL)", "LI KA LEE", "李家莉", "", "staff", "klli@teacher.hpccss.edu.hk", "f605bf9de5a05c35213115aadb18b280cfcae9872872dbb162877fae645d2368"], ["5D", "(LPC)", "LAM PUI CHUNG", "林沛聰", "", "staff", "pclam@teacher.hpccss.edu.hk", "0f8aab307fd2acb1b71ff5e0f48588577bbe0210a424a2be9e60f7e83776696c"], ["5E", "(WHL)", "WU CARMEN HIU LAM", "胡曉琳", "", "staff", "hlwu@teacher.hpccss.edu.hk", "a7860bff6a374d8eb8a49be63e0185a6b2b79fff0b915779e330acf72a4458bb"], ["6A", "(CC)", "CHONG CHOI", "莊  賽", "", "staff", "cchoi@teacher.hpccss.edu.hk", "578a404196e194aef59bf6b465201c54d3518c7f4c8c5371c5dab04a797d0fce"], ["6B", "(LML)", "LO MEI LING", "羅美玲", "", "staff", "mllo@teacher.hpccss.edu.hk", "4ca99ec7916c25263f7de4d8a42858ce39632fe83ab661d60b7f551f65ada261"], ["6C", "(CYM)", "CHAU YUEN MAN", "周苑文", "", "staff", "ymchau@teacher.hpccss.edu.hk", "700c952be62ca333495478f1797a854d477e7b56941976770812812807e24145"], ["6D", "(WKT)", "WAN KWOK TUNG", "尹國棟", "", "staff", "ktwan@teacher.hpccss.edu.hk", "c140736033d706c6ec05ccae805e4b01ed52b1c2946d8f67234ed1ea7248ee32"], ["6E", "(FKY)", "FUNG KA YENG", "馮葭瀅", "", "staff", "kyfung@teacher.hpccss.edu.hk", "4c7675f7a6cd3acf2badcac063b7db958ac07592d5c2bad7840dcbed2b15e80a"], ["Staff", "(AT)", "AU MING TAK", "區明德", "", "staff", "mtau@teacher.hpccss.edu.hk", "64ca94a956ade3e11dfc245152383bc310fd30754c7f7561c6df729ff86171d7"], ["Staff", "(CK)", "CHAN KWUN TAT", "陳冠達", "", "staff", "ktchan@teacher.hpccss.edu.hk", "90db9fd3b6cb134ce3978ad37fca35d8bc5a380c50175ec3b34f6f267f231584"], ["Staff", "(CCK)", "CHOI KA LAI CARRIE", "蔡嘉麗", "", "staff", "klchoi@teacher.hpccss.edu.hk", "78b465160edf9fff6ecfa4323d72d6561c5b8014170fb5e1504bfcc4827c73ab"], ["Staff", "(CU)", "CHU HAU YING", "朱巧英", "", "staff", "hychu@teacher.hpccss.edu.hk", "145ee4ea8e32ee9eeaf056df39c9d8cb803f9abf9c50116382f7ad2bae49c025"], ["Staff", "(CWK)", "CHU WAI KEE GEORGE", "朱煒基", "", "staff", "wkchu@teacher.hpccss.edu.hk", "c76030dc9cef8e546ec290dd5176ba7ae1f772d079808937a1a0baa508fc3b52"], ["Staff", "(FHP)", "FONG HING PAN", "方慶斌", "", "staff", "hpfong@teacher.hpccss.edu.hk", "c575d7615b8e140db0b5823aec6e59838be444faf197fd07b94524a3ae027e72"], ["Staff", "(HTL)", "HSU TING LANG", "許庭朗", "", "staff", "tlhsu@teacher.hpccss.edu.hk", "c7293bb57e2e3f520f9fb1125034e6669d10d90737281426662e31cd65f80efe"], ["Staff", "(HYW)", "HUI YUK WAH", "許玉華", "", "staff", "ywhui@teacher.hpccss.edu.hk", "6a6c735480bd88212bdac662d10fda27d17d6cfbf336898128d2a44fdcf4c4c1"], ["Staff", "(ICW)", "IP CHOI WAN", "葉彩雲", "", "staff", "cwip@teacher.hpccss.edu.hk", "23f818bb0d45c94ead511bdda21d65d938fe9abd2c9892d9545264017be0f2d0"], ["Staff", "(KL)", "KONG KWOK LING", "江國玲", "", "staff", "klkong@teacher.hpccss.edu.hk", "539152b01270a025001f86cba57fe26b096488b3210ad22c672d538fee5f63d9"], ["Staff", "(LYC)", "LO YIU CHUEN", "盧耀泉", "", "staff", "yclo@teacher.hpccss.edu.hk", "09621b07c0be7a6b5f46481d2a06db28fc77678dbb6954e6eb9332e8eaf2db70"], ["Staff", "(NKM)", "NGAI KWAI MING", "倪桂明", "", "staff", "kmngai@teacher.hpccss.edu.hk", "f89d76c81bc51c4ad73a3ca522672c52767ddd24e83ba14d66f9731ac18cd532"], ["Staff", "(PL)", "POON KAM LUN", "潘錦麟", "", "staff", "klpoon@teacher.hpccss.edu.hk", "9bf15f905d44d46e17791e66669592e9b356786775b8d659f52d311a67d1a642"], ["Staff", "(SWH)", "STEPHEN WILLIAM HENRY", "", "", "staff", "swhenry@teacher.hpccss.edu.hk", "608d1dc7bf96397c45539d4e8756c2e81ebda591f769652115d918f66c9600f5"], ["Staff", "(TYY)", "TSE YUEN YING", "謝婉盈", "", "staff", "yytse@teacher.hpccss.edu.hk", "9989b2edde36e760aa9e8eda3a378b914332c366efe92b4acc770fbbf3a4f316"], ["Staff", "(WCL)", "WONG CHIN LEUNG", "黃展樑", "", "staff", "clwong@teacher.hpccss.edu.hk", "4b6e355808dab8b0f1033d8797ad69f18487b07b6f2164e005ad509f44cbb402"], ["Staff", "(YYL)", "YICK YING LIN AUDREY", "易穎琳", "", "staff", "ylyick@teacher.hpccss.edu.hk", "2e02915f52ca47e4448df408b85ac0130158ebeef6c9a8af73960241a1293782"], ["Staff", "(LWC)", "LEE WING CHEUNG ALISTAIR", "李頴翔", "", "staff", "wlee@teacher.hpccss.edu.hk", "c6b1a03778bacc5b9a39974fe7784af6b15918d61a853b143c05cded4fbb1c77"], ["Staff", "(WPS)", "WONG PUI SZE", "黃珮斯", "", "staff", "pswong@teacher.hpccss.edu.hk", "67c47f06e5868446fa9265d9c17a1e0f8358f0c4169063f6d28e770f23546a37"], ["Staff", "(NCH)", "NG CHUNG HIN", "吳仲軒", "", "staff", "chng@staff.hpccss.edu.hk", "718c495c0989f6559dc246363c7c2d5f059807298e4683182d7754ccf954de93"], ["Staff", "(TLS)", "TSANG LAI SHEUNG", "曾麗嫦", "", "staff", "lstsang@staff.hpccss.edu.hk", "46001ac6e8ba8a9f0fa774ed22436d9df8a7e3665b9761282cbb84265fce1694"], ["Staff", "(WLK)", "WONG LEUNG KEE", "黃良基", "", "staff", "lkwong@teacher.hpccss.edu.hk", "32935beeba95e6ab180ce2896f7825dee56b2dd1d45d3ca3264afdf6847aac89"]];

