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

  return { lbSheet, logSheet, profileSheet };
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
  return { room: meta.room, seed: meta.seed, set: meta.set, host: meta.host, status: meta.status,
           startAt: meta.startAt || 0, now: Date.now(), players: players };
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
    const meta = { room: room, seed: String(p.seed || ""), set: String(p.set || "all"),
                   host: String(p.name || "Teacher").substring(0, 40), status: "lobby", startAt: 0, created: Date.now() };
    cache.put(base, JSON.stringify(meta), ARENA_TTL);
    cache.put(base + ":roster", "[]", ARENA_TTL);
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

  if (action === "arena_start" || action === "arena_end" || action === "arena_reset") {
    if (String(p.role || "") !== "staff") return { status: "error", msg: "Teacher only." };
    const meta = readJson(cache, base);
    if (action === "arena_start") { meta.status = "live"; meta.startAt = Date.now() + 5000; }
    if (action === "arena_end") { meta.status = "ended"; }
    if (action === "arena_reset") { meta.status = "lobby"; meta.startAt = 0; meta.seed = String(p.seed || meta.seed); }
    cache.put(base, JSON.stringify(meta), ARENA_TTL);
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  if (action === "arena_state") {
    return { status: "success", arena: arenaSnapshot(cache, room) };
  }

  return { status: "error", msg: "Unknown action" };
}
