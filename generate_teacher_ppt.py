import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Initialize Presentation in 16:9 Widescreen
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

# Define Color Palette (Dark Blue, Crimson Red, Crisp White & Slate Accents)
BG_DARK_BLUE   = RGBColor(11, 19, 43)    # #0B132B
CARD_BLUE      = RGBColor(28, 37, 65)    # #1C2541
BORDER_BLUE    = RGBColor(51, 65, 85)    # #334155
ACCENT_RED     = RGBColor(230, 57, 70)   # #E63946 (Crimson Red)
BRIGHT_RED     = RGBColor(239, 68, 68)   # #EF4444 (Vibrant Red)
TEXT_WHITE     = RGBColor(255, 255, 255) # Pure White
TEXT_MUTED     = RGBColor(203, 213, 225) # Slate / Ice White
EMERALD_ACCENT = RGBColor(16, 185, 129)  # #10B981 (House Chi Emerald)
GOLD_ACCENT    = RGBColor(250, 204, 21)  # #FACC15

BRAIN_DIR = '/Users/kelvinluimacbookair/.gemini/antigravity/brain/fecaff07-0990-418f-a7da-cf6289cd5aa9'

def set_slide_background(slide):
    # Base dark blue background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_DARK_BLUE
    bg.line.fill.background()
    return bg

def add_header(slide, category_tag, main_title, subtitle=""):
    # Category tag (Crimson Red accent)
    tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_bottom = tf_tag.margin_right = 0
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = category_tag.upper()
    p_tag.font.bold = True
    p_tag.font.size = Pt(11)
    p_tag.font.color.rgb = ACCENT_RED

    # Main Title (Bold White)
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.65))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_bottom = tf_title.margin_right = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = main_title
    p_title.font.bold = True
    p_title.font.size = Pt(28)
    p_title.font.color.rgb = TEXT_WHITE

    # Subtitle if present
    if subtitle:
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(11.7), Inches(0.4))
        tf_sub = sub_box.text_frame
        tf_sub.word_wrap = True
        tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_bottom = tf_sub.margin_right = 0
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle
        p_sub.font.size = Pt(13)
        p_sub.font.color.rgb = TEXT_MUTED

def add_card(slide, left, top, width, height, title, body_lines, accent_color=None):
    # Card Background shape
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BLUE
    card.line.color.rgb = accent_color or BORDER_BLUE
    card.line.width = Pt(1.5 if accent_color else 1)

    # Content
    tb = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.2), Inches(width - 0.5), Inches(height - 0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_bottom = tf.margin_right = 0
    
    # Title
    p_title = tf.paragraphs[0]
    p_title.text = title
    p_title.font.bold = True
    p_title.font.size = Pt(17)
    p_title.font.color.rgb = accent_color or TEXT_WHITE
    p_title.space_after = Pt(10)

    # Body lines
    for item in body_lines:
        p = tf.add_paragraph()
        p.space_after = Pt(8)
        if isinstance(item, tuple):
            strong, normal = item
            run_strong = p.add_run()
            run_strong.text = strong + ": "
            run_strong.font.bold = True
            run_strong.font.size = Pt(13)
            run_strong.font.color.rgb = TEXT_WHITE
            
            run_norm = p.add_run()
            run_norm.text = normal
            run_norm.font.size = Pt(12)
            run_norm.font.color.rgb = TEXT_MUTED
        else:
            run = p.add_run()
            run.text = item
            run.font.size = Pt(12)
            run.font.color.rgb = TEXT_MUTED

# ==========================================
# SLIDE 1: Title Slide (Grand Entrance)
# ==========================================
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1)

# Decorative Red Accent Bar on Left
accent_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(0.12), Inches(3.8))
accent_bar.fill.solid()
accent_bar.fill.fore_color.rgb = ACCENT_RED
accent_bar.line.fill.background()

tb1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.6), Inches(11.0), Inches(4.2))
tf1 = tb1.text_frame
tf1.word_wrap = True

p_badge = tf1.paragraphs[0]
p_badge.text = "✦ HPCCSS ACADEMIC ENGLISH INNOVATION ✦"
p_badge.font.bold = True
p_badge.font.size = Pt(14)
p_badge.font.color.rgb = ACCENT_RED
p_badge.space_after = Pt(12)

p_main = tf1.add_paragraph()
p_main.text = "LEXIQUEST"
p_main.font.bold = True
p_main.font.size = Pt(56)
p_main.font.color.rgb = TEXT_WHITE
p_main.space_after = Pt(8)

p_sub = tf1.add_paragraph()
p_sub.text = "Gamified Academic Vocabulary Mastery Powered by Cognitive Science"
p_sub.font.size = Pt(20)
p_sub.font.color.rgb = TEXT_MUTED
p_sub.space_after = Pt(28)

p_tags = tf1.add_paragraph()
run1 = p_tags.add_run()
run1.text = "ACTIVE RECALL  ·  SPACED REPETITION (SM-2)  ·  FOUR HOUSES ARENA  ·  GOOGLE CLOUD"
run1.font.bold = True
run1.font.size = Pt(12)
run1.font.color.rgb = GOLD_ACCENT

# Footer metadata
p_foot = tf1.add_paragraph()
p_foot.text = "A Pedagogical Introduction for Secondary English Teachers"
p_foot.font.size = Pt(13)
p_foot.font.color.rgb = TEXT_MUTED
p_foot.space_before = Pt(24)

# ==========================================
# SLIDE 2: Cognitive Science: The Forgetting Curve
# ==========================================
s2 = prs.slides.add_slide(blank_layout)
set_slide_background(s2)
add_header(s2, "COGNITIVE ARCHITECTURE", "Why Traditional Cramming Fails: The Forgetting Curve", 
           "Ebbinghaus Cognitive Law: Over 80% of newly learned words are lost within 48 hours without scheduled active recall.")

# Left Card: Core Scientific Pillars
add_card(s2, 0.8, 1.8, 5.6, 5.0, "The Cognitive Breakthrough", [
    ("The Passive Learning Illusion", "Reading wordlists creates false confidence. Working memory drops vocabulary rapidly without retrieval stress."),
    ("The Ebbinghaus Cliff", "Retention falls exponentially to ~10% within 7 days unless intervened by spaced retrieval cues."),
    ("Active Retrieval Effect", "Forcing the brain to retrieve meaning from memory solidifies neural synaptic strength 300% faster than passive re-reading."),
    ("SM-2 Spaced Algorithm", "Intervenes at the exact mathematical moment of imminent decay, converting fragile words into permanent long-term storage.")
], accent_color=BRIGHT_RED)

# Right: Insert Chart Image
chart_img = f'{BRAIN_DIR}/forgetting_curve_chart.png'
if os.path.exists(chart_img):
    s2.shapes.add_picture(chart_img, Inches(6.7), Inches(1.8), Inches(5.8), Inches(5.0))

# ==========================================
# SLIDE 3: Engine 1: Word Vault & Cryptic Rush
# ==========================================
s3 = prs.slides.add_slide(blank_layout)
set_slide_background(s3)
add_header(s3, "CORE RETRIEVAL ENGINES", "Word Vault & Cryptic Rush: Precision & Speed", 
           "Balancing deliberate, algorithmically-scheduled study with rapid-fire, high-pressure competitive retrieval.")

add_card(s3, 0.8, 1.8, 5.6, 5.0, "1. WORD VAULT (Precision SRS)", [
    ("Adaptive SM-2 Engine", "Every vocabulary item maintains an individual Easiness Factor (EF) and interval schedule."),
    ("Due Card Curation", "Students only review words precisely when their memory interval is expiring—maximizing time efficiency."),
    ("Four Self-Assessment Tiers", "'Again' (1d reset), 'Hard' (3d), 'Good' (7d), and 'Easy' (14d) dynamically calibrate review schedules."),
    ("Mastery Certification", "Words reaching consecutive successful recalls graduate to 'Mastered' status with permanent XP badges.")
], accent_color=GOLD_ACCENT)

add_card(s3, 6.7, 1.8, 5.8, 5.0, "2. CRYPTIC RUSH (Speed Retrieval)", [
    ("60-Second Arena Duel", "High-intensity timed challenge forcing instantaneous contextual recognition under pressure."),
    ("Combo Multiplier Stress", "3x, 5x, and 15x streak combos reward fluency and penalize hesitation, simulating examination conditions."),
    ("Automated Remediation Loop", "Any word missed during Cryptic Rush is immediately injected into the student's personal Word Vault for reinforcement."),
    ("Loss Aversion Timers", "Real-time clock benders and countdown tension induce optimal arousal state for rapid synaptic encoding.")
], accent_color=BRIGHT_RED)

# ==========================================
# SLIDE 4: Expanding Horizons: Alchemy, Blitz & Oracle
# ==========================================
s4 = prs.slides.add_slide(blank_layout)
set_slide_background(s4)
add_header(s4, "MULTI-MODAL CURRICULUM", "Beyond Single Words: Alchemy, Blitz & Oracle", 
           "Targeting the comprehensive DSE English syllabus: collocations, syntactic structures, and contextual reading.")

add_card(s4, 0.8, 1.8, 3.65, 5.0, "Word Alchemy", [
    ("Collocation Compounding", "Students fuse academic headwords with authentic collocates (e.g., profound + syntax)."),
    ("DSE Writing Impact", "Directly addresses unnatural phrasing by reinforcing native lexical bundles required for Level 5+ essays."),
    ("Arcane Fusion", "Visual feedback turns collocation mastery into magical elemental synthesis.")
], accent_color=GOLD_ACCENT)

add_card(s4, 4.8, 1.8, 3.65, 5.0, "Grammar Blitz", [
    ("Syntactic Fluency", "Rapid-fire structural recognition under speed pressure."),
    ("Error Detection", "Targets common secondary blunders: verb tense shifts, agreement, relative clauses, and inversion."),
    ("Pattern Instinct", "Builds automated reflex accuracy rather than tedious theoretical memorization.")
], accent_color=BRIGHT_RED)

add_card(s4, 8.8, 1.8, 3.7, 5.0, "Reading Oracle", [
    ("Contextual Application", "Curated passages aligned with HKDSE reading text types and academic themes."),
    ("Active Passage Search", "Questions demand precise contextual vocabulary inference and comprehension under time limits."),
    ("Cross-Device Verification", "Passage completions and scores are permanently logged to cloud profile.")
], accent_color=TEXT_WHITE)

# ==========================================
# SLIDE 5: Arena Formats: Solo, 1v1 & Class Honor Roll
# ==========================================
s5 = prs.slides.add_slide(blank_layout)
set_slide_background(s5)
add_header(s5, "FLEXIBLE DEPLOYMENT", "Three Battle Arenas: Solo, 1v1 Live & Class League", 
           "Seamlessly adapting to autonomous home practice, live interactive classroom duels, and school-wide leagues.")

add_card(s5, 0.8, 1.8, 3.65, 5.0, "Solo Arena", [
    ("Autonomous Practice", "Ideal for daily homework, morning reading, or commute micro-learning."),
    ("Zero Social Pressure", "Allows struggling scholars to drill at their own pace without fear of public mistakes."),
    ("Self-Paced Mastery", "Students focus purely on their personal due cards and daily streak maintenance.")
])

add_card(s5, 4.8, 1.8, 3.65, 5.0, "1 vs 1 Live Duel", [
    ("Instant Room Codes & QR", "Two students enter a live peer-to-peer arena in seconds via mobile or laptop."),
    ("Synchronized Problem Feeds", "Identical question sequences ensure 100% fair, real-time head-to-head competition."),
    ("Live Scoreboard Drama", "Instant lead changes and combo breaks generate intense classroom excitement and engagement.")
], accent_color=BRIGHT_RED)

add_card(s5, 8.8, 1.8, 3.7, 5.0, "Class Honor Roll", [
    ("Inter-Class Tournament", "Classes (4A, 4B, 4C, 4D, 4E) compete collectively on weekly XP totals."),
    ("Collective Peer Motivation", "High-performing students inspire peers to play, lifting the entire cohort's engagement."),
    ("Top Scholar Podium", "Weekly recognition of top scorers in morning assembly and school digital displays.")
], accent_color=GOLD_ACCENT)

# ==========================================
# SLIDE 6: Enterprise Backend: Google Cloud Architecture
# ==========================================
s6 = prs.slides.add_slide(blank_layout)
set_slide_background(s6)
add_header(s6, "INFRASTRUCTURE & DATA", "Zero-Cost Enterprise Cloud: Google Sheets Backend", 
           "High-performance architecture built on Google Apps Script Web App: zero server costs, zero maintenance, total data ownership.")

add_card(s6, 0.8, 1.8, 3.65, 5.0, "Zero Server Cost", [
    ("Google Web App API", "Runs 100% on school's existing Google Workspace. Zero monthly hosting or database bills."),
    ("Serverless Reliability", "Google Apps Script handles hundreds of simultaneous requests with zero infrastructure configuration."),
    ("Full School Privacy", "Student names, hashes, and records reside exclusively inside the teacher's protected Google Drive.")
])

add_card(s6, 4.8, 1.8, 3.65, 5.0, "Flawless Multi-Device Sync", [
    ("Cross-Device Handshake", "MacBook, iPad, and iPhone seamlessly synchronize with pull-before-push cloud validation."),
    ("Data Loss Prevention", "Server-side union merging ensures completions on phone never overwrite progress from laptop."),
    ("Offline Resilience", "Local storage preserves game state and uploads automatically once connection restores.")
], accent_color=GOLD_ACCENT)

add_card(s6, 8.8, 1.8, 3.7, 5.0, "Teacher Live Dashboard", [
    ("Real-Time PlayLogs", "Every single game session, mode, score, and timestamp is logged automatically."),
    ("Cohort Diagnostics", "Teachers immediately spot vocabulary items with high error rates across the form."),
    ("Export & Report Ready", "One-click export to Excel/PDF for term evaluations and student learning portfolio records.")
], accent_color=BRIGHT_RED)

# ==========================================
# SLIDE 7: Gamification: The Four Houses & Wizardry
# ==========================================
s7 = prs.slides.add_slide(blank_layout)
set_slide_background(s7)
add_header(s7, "INTRINSIC MOTIVATION", "The Academy of Wizardry: Four Houses & Faculty Dragon", 
           "Transforming repetitive vocabulary drilling into an epic collective quest steeped in school identity and belonging.")

# Insert 5-crest banner in center
crest_banner = f'{BRAIN_DIR}/five_houses_crests_banner.png'
if os.path.exists(crest_banner):
    s7.shapes.add_picture(crest_banner, Inches(0.8), Inches(1.8), Inches(11.733), Inches(2.6))

# Description cards below
add_card(s7, 0.8, 4.6, 2.2, 2.3, "TAK · PEGASUS", ["Emerald Order", "Intuitive wit & skyborne eloquence", "Color: #10B981"])
add_card(s7, 3.2, 4.6, 2.2, 2.3, "CHI · PHOENIX", ["Crimson Order", "Tenacity & fiery precision", "Color: #EF4444"])
add_card(s7, 5.6, 4.6, 2.2, 2.3, "KIN · GRIFFIN", ["Amber Order", "Steadfast logic & fortified recall", "Color: #F59E0B"])
add_card(s7, 8.0, 4.6, 2.2, 2.3, "KAN · SCHOLAR", ["Sapphire Order", "Profound syntax & manuscripts", "Color: #3B82F6"])
add_card(s7, 10.4, 4.6, 2.1, 2.3, "FACULTY DRAGON", ["Shadow Council", "Masters of Arcane & Faculty Staff", "Color: #C084FC"], accent_color=BRIGHT_RED)

# ==========================================
# SLIDE 8: Habit Formation: Daily Streaks & Loss Aversion
# ==========================================
s8 = prs.slides.add_slide(blank_layout)
set_slide_background(s8)
add_header(s8, "BEHAVIORAL PSYCHOLOGY", "The Habit Loop: Daily Streaks & Loss Aversion", 
           "Applying behavioral economics to turn sporadic English study into an automatic, lifelong daily routine.")

add_card(s8, 0.8, 1.8, 3.65, 5.0, "1. Micro-Commitment", [
    ("5-Minute Daily Threshold", "Students only need to complete 1 quick session per day to secure their daily fire streak."),
    ("Low Cognitive Barrier", "Removes procrastination friction: 'I just need 5 minutes before leaving for school.'"),
    ("Compounding Consistency", "5 minutes daily = 35 minutes weekly = 30 hours of focused active recall per academic year.")
], accent_color=GOLD_ACCENT)

add_card(s8, 4.8, 1.8, 3.65, 5.0, "2. Loss Aversion Trigger", [
    ("Midnight Streak Expiry", "Streaks expire at midnight. The fear of losing a 14-day or 30-day streak drives action."),
    ("Urgency Warning System", "Dynamic alerts notify scholars when their streak is 'At Risk' in evening hours."),
    ("Loss Aversion Over Gain", "Behavioral economics confirms people work twice as hard to protect an achievement than to gain one.")
], accent_color=BRIGHT_RED)

add_card(s8, 8.8, 1.8, 3.7, 5.0, "3. Social Validation", [
    ("Visible Flame Badges", "Streaks 🔥 are broadcasted on wizard profile cards and class leaderboards."),
    ("Teacher Celebrations", "Teachers praise top streak holders weekly, reinforcing positive cohort peer norms."),
    ("Permanent Mastery Identity", "Students view themselves not as 'struggling learners', but as dedicated academic wizards.")
])

# ==========================================
# SLIDE 9: Visual Progression: House Chi 5-Tier Character Skins
# ==========================================
s9 = prs.slides.add_slide(blank_layout)
set_slide_background(s9)
add_header(s9, "TANGIBLE RECOGNITION", "Avatar Wardrobe: 5-Tier Character Progression", 
           "Visual proof of academic mastery: House Chi scholars evolve dynamically across 5 distinguished wizard ranks.")

chi_tiers_data = [
    {
        "tier": "TIER 1",
        "rank": "Apprentice",
        "xp": "0+ XP",
        "img": "assets/houses/avatars/chi_t1.png",
        "bullets": [
            ("Crisp White Shirt", "Baseline academy uniform upon enrollment."),
            ("Novice Scholar", "Building daily active retrieval habits.")
        ]
    },
    {
        "tier": "TIER 2",
        "rank": "Seeker",
        "xp": "1,000+ XP",
        "img": "assets/houses/avatars/chi_t2.png",
        "bullets": [
            ("House Tie & Vest", "Earned formal emerald silk tie and knit vest."),
            ("Streak Keeper", "Consolidating core high-frequency words.")
        ]
    },
    {
        "tier": "TIER 3",
        "rank": "Scholar",
        "xp": "10,000+ XP",
        "img": "assets/houses/avatars/chi_t3.png",
        "bullets": [
            ("Hooded Robes", "Junior wizard robe with subtle arcane aura."),
            ("Collocation Fluency", "Mastering collocations and syntactic speed.")
        ]
    },
    {
        "tier": "TIER 4",
        "rank": "Sorcerer",
        "xp": "50,000+ XP",
        "img": "assets/houses/avatars/chi_t4.png",
        "bullets": [
            ("Silver Clasp & Crest", "Ceremonial robe with House Chi heraldic badge."),
            ("Arena Champion", "Consistently victorious in live duels.")
        ]
    },
    {
        "tier": "TIER 5",
        "rank": "Grand Magus",
        "xp": "150,000+ XP",
        "img": "assets/houses/avatars/chi_t5.png",
        "bullets": [
            ("Grand Magus Regalia", "Holding glowing elixir in the Great Hall."),
            ("Lifelong Mastery", "Permanent retention; legendary status.")
        ]
    }
]

card_w = 2.18
gap = 0.208
for i, tdata in enumerate(chi_tiers_data):
    cx = 0.8 + i * (card_w + gap)
    cy = 1.80
    ch = 5.25
    
    # Outer card shape
    card_shape = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx), Inches(cy), Inches(card_w), Inches(ch))
    card_shape.fill.solid()
    card_shape.fill.fore_color.rgb = CARD_BLUE
    card_shape.line.color.rgb = EMERALD_ACCENT if i == 4 else BORDER_BLUE
    card_shape.line.width = Pt(1.5) if i == 4 else Pt(1.0)
    
    # Tier Pill / Badge
    tb_badge = s9.shapes.add_textbox(Inches(cx + 0.12), Inches(cy + 0.12), Inches(card_w - 0.24), Inches(0.3))
    tf_b = tb_badge.text_frame
    tf_b.word_wrap = True
    tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = tdata["tier"]
    p_b.font.bold = True
    p_b.font.size = Pt(11)
    p_b.font.color.rgb = GOLD_ACCENT if i == 4 else ACCENT_RED
    
    # Avatar Image (300x360 -> aspect ratio 5:6)
    img_path = tdata["img"]
    if os.path.exists(img_path):
        s9.shapes.add_picture(img_path, Inches(cx + 0.15), Inches(cy + 0.48), Inches(1.88), Inches(2.256))
        
    # Rank Title & XP
    tb_rank = s9.shapes.add_textbox(Inches(cx + 0.1), Inches(cy + 2.82), Inches(card_w - 0.2), Inches(0.6))
    tf_r = tb_rank.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = tf_r.margin_right = tf_r.margin_top = tf_r.margin_bottom = 0
    p_r1 = tf_r.paragraphs[0]
    p_r1.alignment = PP_ALIGN.CENTER
    p_r1.text = tdata["rank"]
    p_r1.font.bold = True
    p_r1.font.size = Pt(13)
    p_r1.font.color.rgb = TEXT_WHITE
    
    p_r2 = tf_r.add_paragraph()
    p_r2.alignment = PP_ALIGN.CENTER
    p_r2.text = f"{tdata['xp']} Required"
    p_r2.font.bold = True
    p_r2.font.size = Pt(9.5)
    p_r2.font.color.rgb = GOLD_ACCENT
    
    # Bullets / Details
    tb_bullets = s9.shapes.add_textbox(Inches(cx + 0.12), Inches(cy + 3.52), Inches(card_w - 0.24), Inches(1.6))
    tf_bl = tb_bullets.text_frame
    tf_bl.word_wrap = True
    tf_bl.margin_left = tf_bl.margin_right = tf_bl.margin_top = tf_bl.margin_bottom = 0
    for j, (header, desc) in enumerate(tdata["bullets"]):
        p = tf_bl.paragraphs[0] if j == 0 else tf_bl.add_paragraph()
        p.space_after = Pt(4)
        run_h = p.add_run()
        run_h.text = f"• {header}: "
        run_h.font.bold = True
        run_h.font.size = Pt(8.5)
        run_h.font.color.rgb = TEXT_WHITE
        
        run_d = p.add_run()
        run_d.text = desc
        run_d.font.size = Pt(8.0)
        run_d.font.color.rgb = TEXT_MUTED

# ==========================================
# SLIDE 10: Teacher Next Steps: Rollout & Impact
# ==========================================
s10 = prs.slides.add_slide(blank_layout)
set_slide_background(s10)
add_header(s10, "IMPLEMENTATION ROADMAP", "How Teachers Can Deploy LexiQuest Tomorrow", 
           "Ready out-of-the-box: Zero installation friction, immediate pedagogical visibility, and measurable student progress.")

add_card(s10, 0.8, 1.8, 3.65, 5.0, "1. In the Classroom", [
    ("Morning Warm-Up (5 Mins)", "Begin English lesson with a 60-second Cryptic Rush or a live 1v1 duel to activate focus."),
    ("Interactive Class Battles", "Display leaderboard on projector screen; pit row vs row or class vs class."),
    ("Exit Ticket Review", "Assign a quick Word Vault session to consolidate the day's target academic collocations.")
], accent_color=BRIGHT_RED)

add_card(s10, 4.8, 1.8, 3.65, 5.0, "2. Homework & Holidays", [
    ("Replaces Passive Wordlists", "Assign daily streak maintenance instead of static paper vocabulary copying."),
    ("Holiday Retention Shield", "Prevents severe holiday learning loss during Christmas and Lunar New Year breaks."),
    ("Universal Accessibility", "Runs seamlessly on any smartphone, iPad, or Chromebook without App Store friction.")
], accent_color=GOLD_ACCENT)

add_card(s10, 8.8, 1.8, 3.7, 5.0, "3. Teacher Action Items", [
    ("Access Live Web App", "Launch: folui-code.github.io/lexiquest in your browser."),
    ("Inspect Form Leaderboard", "Review live Google Sheet PlayLogs and form standings with one click."),
    ("Join House Dragon", "Teachers automatically receive House Dragon faculty status—challenge your students today!")
], accent_color=TEXT_WHITE)

# Save PPTX to destination
output_pptx = '/Users/kelvinluimacbookair/.gemini/antigravity-ide/scratch/vocab-game/LexiQuest_Teacher_Introduction.pptx'
prs.save(output_pptx)
print('PPTX presentation successfully generated at:', output_pptx)

# Also copy to conversation artifacts directory for persistence
artifact_pptx = f'{BRAIN_DIR}/LexiQuest_Teacher_Introduction.pptx'
prs.save(artifact_pptx)
print('PPTX also saved to artifacts:', artifact_pptx)

