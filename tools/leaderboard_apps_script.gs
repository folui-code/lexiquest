/**
 * ===================================================================
 * HPCCSS LexiQuest — Real-time Google Sheets Leaderboard & Activity Log
 * ===================================================================
 * 
 * Instructions to deploy:
 * 1. Open your Google Sheet (or create a new one: sheets.new).
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor and paste this entire file.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app" (click gear icon next to "Select type").
 * 6. Set Description: "LexiQuest Leaderboard API"
 * 7. Set "Execute as": "Me" (your school account)
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL so students can submit scores
 * 9. Click "Deploy" and authorize permissions.
 * 10. Copy the "Web app URL" (ends in /exec).
 * 11. Paste that URL into LexiQuest (or configure it in js/leaderboard.js).
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

  return { lbSheet, logSheet };
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
  const { lbSheet, logSheet } = setupSheets();
  const action = params.action || "get";
  const mode = (params.mode || "rush").toLowerCase();

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

  // Always return the latest Top 10 leaderboard for all modes
  const leaderboard = getAllLeaderboards(lbSheet);

  const output = {
    status: "success",
    timestamp: new Date().toISOString(),
    leaderboard: leaderboard
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateLeaderboard(lbSheet, logSheet, targetMode) {
  const data = logSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  // Filter logs for the target mode, group by player name (keep their max score)
  const scoresByPlayer = {};
  for (let i = 1; i < data.length; i++) {
    const rowMode = String(data[i][1]).toLowerCase();
    if (rowMode === targetMode) {
      const pName = String(data[i][2]);
      const pScore = Number(data[i][3]) || 0;
      const pRole = String(data[i][4]) || "student";
      const pDate = data[i][0];

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
    if (String(lbData[i][0]).toLowerCase() === targetMode) {
      lbSheet.deleteRow(i + 1);
    }
  }

  // Re-insert top 10
  sorted.forEach((entry, idx) => {
    lbSheet.appendRow([targetMode, idx + 1, entry.n, entry.s, entry.role, new Date()]);
  });
}

function getAllLeaderboards(lbSheet) {
  const data = lbSheet.getDataRange().getValues();
  const res = { rush: [], wordle: [], matrix: [] };

  for (let i = 1; i < data.length; i++) {
    const mode = String(data[i][0]).toLowerCase();
    const rank = Number(data[i][1]);
    const name = String(data[i][2]);
    const score = Number(data[i][3]);
    const role = String(data[i][4]);

    if (res[mode]) {
      res[mode].push({ n: name, s: score, rank: rank, role: role });
    }
  }

  // Ensure sorted by score
  for (const m in res) {
    res[m].sort((a, b) => b.s - a.s);
  }

  return res;
}
