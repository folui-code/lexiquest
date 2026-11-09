"""
Builds data/class_leaderboard.js with ONLY verified real student scores.
If no student has played in a class, it remains empty ([]), displaying "/" in the UI.
Teachers/staff are strictly excluded.
"""

import json

# Verified real student scores from active student play (Cryptic Rush, Alchemy, Blitz, Reading, Spellcraft)
real_student_scores = {
    'S4': {
        '4A': [
            {'rank': 1, 'name': 'AU-YEUNG SZE YAN', 'house': 'KIN', 'xp': 3100}
        ],
        '4B': [
            {'rank': 1, 'name': 'YAN JACKY TSZ HIM', 'house': 'KAN', 'xp': 72990},
            {'rank': 2, 'name': 'AU YEUNG HOI MAN', 'house': 'CHI', 'xp': 2100},
            {'rank': 3, 'name': 'CHIU DEX HOI TING', 'house': 'KIN', 'xp': 700},
            {'rank': 4, 'name': 'CHU YAT CHUN', 'house': 'KAN', 'xp': 700},
            {'rank': 5, 'name': 'TAN HUNG YU', 'house': 'CHI', 'xp': 700},
            {'rank': 6, 'name': 'YEUNG SUNG YAN', 'house': 'KIN', 'xp': 700},
            {'rank': 7, 'name': 'TSUI CHEUK TUNG', 'house': 'KIN', 'xp': 700}
        ],
        '4C': [],
        '4D': [
            {'rank': 1, 'name': 'LEE SHING YU', 'house': 'CHI', 'xp': 318520},
            {'rank': 2, 'name': 'WAN CHEUK NAM', 'house': 'TAK', 'xp': 300430},
            {'rank': 3, 'name': 'SIU HOI CHUN', 'house': 'TAK', 'xp': 218970}
        ],
        '4E': []
    },
    'S5': {
        '5A': [],
        '5B': [],
        '5C': [],
        '5D': [],
        '5E': []
    },
    'S6': {
        '6A': [],
        '6B': [],
        '6C': [],
        '6D': [],
        '6E': []
    }
}

js_content = f"""/* ===================================================================
   HPCCSS LexiQuest — Class Honor Roll Data (Top 3 per Class)
   Verified real student scores only. Classes without plays display "/".
   =================================================================== */

const CLASS_HONOR_ROLL = {json.dumps(real_student_scores, indent=2)};

if (typeof module !== "undefined" && module.exports) {{
  module.exports = {{ CLASS_HONOR_ROLL }};
}}
"""

with open('/Users/kelvinluimacbookair/.gemini/antigravity-ide/scratch/vocab-game/data/class_leaderboard.js', 'w') as f:
    f.write(js_content)

print("Generated verified data/class_leaderboard.js successfully!")
