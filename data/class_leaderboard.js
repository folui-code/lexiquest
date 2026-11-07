/* ===================================================================
   HPCCSS LexiQuest — Class Honor Roll Data (Top 3 per Class)
   Verified real student scores only. Classes without plays display "/".
   =================================================================== */

const CLASS_HONOR_ROLL = {
  "S4": {
    "4A": [],
    "4B": [
      {
        "rank": 1,
        "name": "YAN JACKY TSZ HIM",
        "house": "KAN",
        "xp": 72990
      }
    ],
    "4C": [],
    "4D": [
      {
        "rank": 1,
        "name": "LEE SHING YU",
        "house": "CHI",
        "xp": 318520
      },
      {
        "rank": 2,
        "name": "WAN CHEUK NAM",
        "house": "TAK",
        "xp": 300430
      },
      {
        "rank": 3,
        "name": "SIU HOI CHUN",
        "house": "TAK",
        "xp": 218970
      }
    ],
    "4E": []
  },
  "S5": {
    "5A": [],
    "5B": [],
    "5C": [],
    "5D": [],
    "5E": []
  },
  "S6": {
    "6A": [],
    "6B": [],
    "6C": [],
    "6D": [],
    "6E": []
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CLASS_HONOR_ROLL };
}
