/* ===================================================================
   HPCCSS LexiQuest — Class Honor Roll Data (Top 3 per Class)
   Verified real student scores only. Classes without plays display "/".
   =================================================================== */

const CLASS_HONOR_ROLL = {
  "S4": {
    "4A": [],
    "4B": [],
    "4C": [],
    "4D": [
      {
        "rank": 1,
        "name": "LI TSZ YU",
        "house": "CHI",
        "xp": 2618
      },
      {
        "rank": 2,
        "name": "TSAI TSZ CHING",
        "house": "TAK",
        "xp": 1860
      },
      {
        "rank": 3,
        "name": "LEE SHING YU",
        "house": "CHI",
        "xp": 1250
      }
    ],
    "4E": [
      {
        "rank": 1,
        "name": "SUEN HO YAN",
        "house": "TAK",
        "xp": 100
      }
    ]
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
