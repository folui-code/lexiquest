"""
Builds data/class_leaderboard.js with ONLY verified real student scores.
If no student has played in a class, it remains empty ([]), displaying "/" in the UI.
Teachers/staff are strictly excluded.
"""

import json

# Verified real student scores reset to 0 for official Form launch (all classes start fresh at 0 / empty)
real_student_scores = {
    'S4': {
        '4A': [],
        '4B': [],
        '4C': [],
        '4D': [],
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
