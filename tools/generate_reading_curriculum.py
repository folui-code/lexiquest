"""
Curriculum generator for HKDSE Reading Oracle (November 2026 Calendar Days).
Calibrated strictly to HKDSE English Paper 1 Part B2 Standard (1180L-1220L).
"""

import json

CURRICULUM = [
  {
    "id": "2026-11-01",
    "date": "2026-11-01",
    "displayDate": "1 Nov 2026",
    "dayLabel": "1 Nov",
    "dayOfWeek": "Sun",
    "title": "The Architecture of Digital Distraction",
    "theme": "Digital Culture & Behavioral Psychology",
    "source": "Adapted from The Guardian & The Atlantic",
    "lexile": "1200L (DSE Part B2)",
    "lines": [
      "When engineers first conceived the \"infinite scroll\" in 2006, it was heralded as",
      "a triumph of user design—an elegant mechanism that eliminated the tedious friction",
      "of clicking between pages. Yet two decades later, this ubiquitous feature has",
      "metastasized into one of modern technology's most insidious psychological traps.",
      "By removing natural stopping cues, social media platforms deliberately exploit",
      "our brain's craving for intermittent rewards, keeping users suspended in a state",
      "of perpetual anticipation. Rather than empowering human connection, this endless",
      "loop breeds a subtle restlessness, where minutes dissolve into hours of mindless",
      "consumption. While tech executives often dismiss excessive screen time as a failure",
      "of personal willpower, critics argue that expecting individuals to resist algorithms",
      "calibrated by armies of behavioral scientists is not merely unrealistic—it is a cynical",
      "abdication of corporate responsibility."
    ],
    "questions": [
      {
        "id": "nov01-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 4, the word \"metastasized\" suggests that the infinite scroll has...",
        "targetLines": [3, 4],
        "options": [
          { "letter": "A", "text": "spread uncontrollably and evolved into a harmful problem.", "correct": True, "trap": "Correct: Metastasize (figuratively from oncology) denotes rapid, invasive spread with destructive consequences." },
          { "letter": "B", "text": "improved steadily through user feedback and technical refinement.", "correct": False, "trap": "Positive Meaning Trap: Overlooks the overtly negative context of 'insidious traps'." },
          { "letter": "C", "text": "disappeared completely from modern mobile application interfaces.", "correct": False, "trap": "Opposite Trap: The passage states the feature is 'ubiquitous' (everywhere), not extinct." },
          { "letter": "D", "text": "been legally licensed to competing commercial organizations.", "correct": False, "trap": "Plausible Business Trap: Sounds corporate, but ignores the figurative meaning of toxic proliferation." }
        ],
        "examinerNote": "Line 4 pairs 'metastasized' with 'insidious psychological traps'. While the medical term refers to malignant cells spreading, here it highlights how a once-convenient design feature spread aggressively across apps and became deeply harmful."
      },
      {
        "id": "nov01-q2",
        "skill": "Reference & Deixis",
        "q": "In lines 7–8, \"this endless loop\" refers to...",
        "targetLines": [5, 6, 7, 8],
        "options": [
          { "letter": "A", "text": "software developers constantly rewriting algorithm code.", "correct": False, "trap": "Keyword Distractor: Mentions engineers/developers, but the text describes the user's consumption cycle." },
          { "letter": "B", "text": "users being kept in constant anticipation without natural stopping cues.", "correct": True, "trap": "Correct: Traces back to lines 5-7: 'removing natural stopping cues... suspended in a state of perpetual anticipation'." },
          { "letter": "C", "text": "social media corporations hiring teams of behavioral scientists.", "correct": False, "trap": "Misplaced Detail: Scientists are mentioned in line 11 regarding algorithm calibration, not the loop itself." },
          { "letter": "D", "text": "individuals repeatedly attempting to delete their digital accounts.", "correct": False, "trap": "Unstated Real-World Assumption: A common modern anecdote, but entirely unsupported by the text." }
        ],
        "examinerNote": "Trace the referent backward from lines 7-8 to the preceding clause in lines 5-7. The 'loop' is created when apps eliminate natural stopping cues, trapping the user's attention in perpetual anticipation."
      },
      {
        "id": "nov01-q3",
        "skill": "Argument & Contrast",
        "q": "According to lines 9–12, how do tech executives and critics differ in their explanation of excessive screen time?",
        "targetLines": [9, 10, 11, 12],
        "options": [
          { "letter": "A", "text": "Executives blame technological bugs, while critics blame slow internet connections.", "correct": False, "trap": "Fabricated Detail: Neither bugs nor internet speed is mentioned in the paragraph." },
          { "letter": "B", "text": "Executives blame individual lack of discipline, whereas critics blame deliberate corporate design.", "correct": True, "trap": "Correct: Executives cite 'failure of personal willpower'; critics cite 'algorithms calibrated by armies of behavioral scientists'." },
          { "letter": "C", "text": "Executives admit their apps are addictive, whereas critics argue screen time is harmless.", "correct": False, "trap": "Direct Inversion Trap: Reverses the stance of both parties." },
          { "letter": "D", "text": "Executives focus on adolescent habits, whereas critics focus on workplace productivity.", "correct": False, "trap": "Out-of-Scope Trap: Age cohorts and workplace productivity are not contrasted in lines 9-12." }
        ],
        "examinerNote": "Lines 9-10 state executives view it as 'a failure of personal willpower' (self-discipline), contrasted with critics who argue users face 'algorithms calibrated by armies of behavioral scientists' (intentional corporate design)."
      },
      {
        "id": "nov01-q4",
        "skill": "Tone & Writer's Stance",
        "q": "In the final sentence (lines 11–12), the writer's attitude towards tech companies is best described as...",
        "targetLines": [11, 12],
        "options": [
          { "letter": "A", "text": "enthusiastic and encouraging", "correct": False, "trap": "Direct Opposite: The vocabulary expresses severe disapproval, not encouragement." },
          { "letter": "B", "text": "sharply critical and accusatory", "correct": True, "trap": "Correct: Words like 'unrealistic', 'cynical', and 'abdication of corporate responsibility' convey strong moral condemnation." },
          { "letter": "C", "text": "cautiously optimistic", "correct": False, "trap": "Misleading Tone: No hope or positive resolution is offered regarding corporate self-regulation." },
          { "letter": "D", "text": "impartial and detached", "correct": False, "trap": "Neutrality Trap: The author takes an explicit, impassioned moral stand against corporate evasion." }
        ],
        "examinerNote": "The diction in lines 11-12 ('cynical abdication of corporate responsibility') is unambiguous. The author explicitly condemns corporations for evading their moral duties."
      }
    ]
  },
  {
    "id": "2026-11-02",
    "date": "2026-11-02",
    "displayDate": "2 Nov 2026",
    "dayLabel": "2 Nov",
    "dayOfWeek": "Mon",
    "title": "The Phantom Cost of \"Free\" Online Returns",
    "theme": "Consumer Culture & Reverse Logistics",
    "source": "Adapted from The Guardian",
    "lexile": "1190L (DSE Part B2)",
    "lines": [
      "For millions of online consumers, the ubiquity of \"free returns\" has fundamentally",
      "altered purchasing psychology. Without financial liability, buyers routinely order",
      "multiple sizes of a single garment, converting their private residences into temporary",
      "fitting rooms. Yet environmental analysts warn that this seamless convenience",
      "conceals an ecological catastrophe. The prevailing consumer assumption is that",
      "returned inventory effortlessly returns to the sales floor. In reality, the complex logistics",
      "of assessing, repackaging, and sanitizing discounted apparel often exceed the cost of",
      "fabricating a new item. Consequently, millions of tons of returned garments are quietly",
      "routed to incinerators or distant landfills. By shielding shoppers from the genuine",
      "consequences of over-ordering, e-commerce giants have institutionalized waste,",
      "ensuring that true retail sustainability remains little more than an unfulfilled public relations",
      "platitude."
    ],
    "questions": [
      {
        "id": "nov02-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 12, the word \"platitude\" most closely means...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "an empty or overused statement that lacks sincerity.", "correct": True, "trap": "Correct: A platitude is a banal, clichéd moral remark made to sound meaningful without practical action." },
          { "letter": "B", "text": "a legally binding corporate commitment.", "correct": False, "trap": "Opposite Trap: The passage says it is 'unfulfilled' public relations, not a binding policy." },
          { "letter": "C", "text": "a groundbreaking environmental innovation.", "correct": False, "trap": "Positive Connotation Trap: Contradicts the critical tone regarding PR spin." },
          { "letter": "D", "text": "a financial penalty imposed by regulators.", "correct": False, "trap": "Contextual Mismatch: Companies use it in PR, so it cannot be an external legal fine." }
        ],
        "examinerNote": "In line 12, 'platitude' is modified by 'unfulfilled public relations' and contrasted with 'true retail sustainability'. The author implies corporate sustainability claims are hollow slogans."
      },
      {
        "id": "nov02-q2",
        "skill": "Inference & Cause-and-Effect",
        "q": "According to lines 6–8, returned clothes are frequently destroyed because...",
        "targetLines": [6, 7, 8],
        "options": [
          { "letter": "A", "text": "shoppers inflict severe structural damage on garments before returning them.", "correct": False, "trap": "Unwarranted Assumption: The text does not claim customers destroy the clothes." },
          { "letter": "B", "text": "processing returns costs companies more than manufacturing brand-new stock.", "correct": True, "trap": "Correct: Directly stated in lines 6-8: 'the complex logistics... often exceed the cost of fabricating a new item'." },
          { "letter": "C", "text": "international trade agreements strictly prohibit the resale of apparel.", "correct": False, "trap": "Fabricated Legal Trap: No such trade legislation is cited in the passage." },
          { "letter": "D", "text": "warehouses are overwhelmed by sudden customs delays.", "correct": False, "trap": "Logistical Distractor: Plausible real-world issue, but unrelated to the economic rationale in the text." }
        ],
        "examinerNote": "Lines 6-8 state that assessing, repackaging, and sanitizing discounted apparel 'often exceed the cost of fabricating a new item'. Destruction is an economic decision driven by reverse-logistics overhead."
      },
      {
        "id": "nov02-q3",
        "skill": "Reference & Deixis",
        "q": "In lines 9–10, \"the genuine consequences of over-ordering\" primarily refers to...",
        "targetLines": [8, 9, 10],
        "options": [
          { "letter": "A", "text": "the loss of customer loyalty suffered by high-street retailers.", "correct": False, "trap": "Wrong Subject: The text focuses on environmental waste, not traditional physical stores." },
          { "letter": "B", "text": "the financial bankruptcy of small domestic courier firms.", "correct": False, "trap": "Irrelevant Detail: Delivery companies' finances are not discussed." },
          { "letter": "C", "text": "the massive volume of unsold goods being dumped or burned.", "correct": True, "trap": "Correct: Follows immediately from lines 8-9: 'millions of tons of returned garments are quietly routed to incinerators or distant landfills'." },
          { "letter": "D", "text": "the introduction of mandatory restocking surcharges for consumers.", "correct": False, "trap": "Inversion Trap: The text states companies 'shield' shoppers from costs; surcharges are absent." }
        ],
        "examinerNote": "Lines 8-9 specify that goods are routed to incinerators and landfills; line 9 connects this to 'By shielding shoppers from the genuine consequences...'. The consequence is environmental devastation."
      },
      {
        "id": "nov02-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The overall tone of the writer towards current e-commerce return practices is...",
        "targetLines": [9, 10, 11, 12],
        "options": [
          { "letter": "A", "text": "indignant and skeptical", "correct": True, "trap": "Correct: Words like 'conceals an ecological catastrophe', 'institutionalized waste', and 'PR platitude' show deep concern and disbelief in corporate claims." },
          { "letter": "B", "text": "nonchalant and amused", "correct": False, "trap": "Wrong Emotional Register: The topic is treated with serious environmental gravity." },
          { "letter": "C", "text": "sympathetic to retail retailers", "correct": False, "trap": "Opposite Stance: Retail giants are accused of creating institutionalized waste." },
          { "letter": "D", "text": "hesitant and uncertain", "correct": False, "trap": "Degree Trap: The author writes with firm assertiveness, not hesitation." }
        ],
        "examinerNote": "The author deploys heavy evaluative terms ('catastrophe', 'quietly dumped', 'institutionalized waste', 'platitude'), reflecting moral indignation at the environmental cost and skepticism of corporate PR."
      }
    ]
  },
  {
    "id": "2026-11-03",
    "date": "2026-11-03",
    "displayDate": "3 Nov 2026",
    "dayLabel": "3 Nov",
    "dayOfWeek": "Tue",
    "title": "The Smart City Paradox: Efficiency vs Human Dignity",
    "theme": "Urban Technology & Surveillance",
    "source": "Adapted from Financial Times",
    "lexile": "1210L (DSE Part B2)",
    "lines": [
      "In the vision of contemporary urban planners, the \"smart city\" is an automated utopia.",
      "Ubiquitous sensors regulate traffic flows, optimize power distribution, and automate",
      "waste disposal, transforming chaotic metropolises into frictionless machines. Yet urban",
      "sociologists argue that this relentless obsession with computational efficiency neglects",
      "the messy, unquantifiable human dimensions of civic life. When streets are optimized",
      "solely for throughput and throughput alone, public squares lose their traditional function",
      "as unpredictable forums for social interaction. Furthermore, the pervasive infrastructure",
      "required to monitor urban activity establishes a regime of perpetual surveillance.",
      "Under the benign pretext of civic convenience, citizens are gradually conditioned to",
      "accept continuous biometric tracking as the baseline of modern residency. The critical",
      "question is whether we are designing cities that nurture communal flourishing, or merely",
      "constructing technologically sophisticated enclosures for passive inhabitants."
    ],
    "questions": [
      {
        "id": "nov03-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 9, the word \"pretext\" implies that \"civic convenience\" is...",
        "targetLines": [8, 9, 10],
        "options": [
          { "letter": "A", "text": "an insurmountable technical barrier to smart cities.", "correct": False, "trap": "Definition Mismatch: Pretext does not mean an obstacle or barrier." },
          { "letter": "B", "text": "an excuse used to conceal a more intrusive agenda.", "correct": True, "trap": "Correct: A pretext is a false or superficial reason put forward to hide the real purpose (in this case, mass biometric monitoring)." },
          { "letter": "C", "text": "a universally acknowledged benefit celebrated by all sociologists.", "correct": False, "trap": "Extreme / Opposite Trap: Sociologists in the text are criticizing, not celebrating, this convenience." },
          { "letter": "D", "text": "a temporary financial subsidy offered by municipal councils.", "correct": False, "trap": "Literal Financial Trap: Conflates policy terminology with political excuse." }
        ],
        "examinerNote": "In line 9, 'pretext' indicates that 'civic convenience' is a cover or superficial justification used by authorities to normalize biometric surveillance."
      },
      {
        "id": "nov03-q2",
        "skill": "Inference & Subtext",
        "q": "In lines 5–7, what do sociologists believe is lost when public spaces are \"optimized solely for throughput\"?",
        "targetLines": [5, 6, 7],
        "options": [
          { "letter": "A", "text": "The architectural structural integrity of surrounding skyscrapers.", "correct": False, "trap": "Physical Trap: The concern is social, not structural engineering." },
          { "letter": "B", "text": "The revenue generated by roadside commercial vendors.", "correct": False, "trap": "Economic Distractor: Commercial retail revenue is not the point of public forums in line 7." },
          { "letter": "C", "text": "Spontaneous, unpredictable interpersonal exchanges between citizens.", "correct": True, "trap": "Correct: Directly paraphrases 'unpredictable forums for social interaction' and 'messy, unquantifiable human dimensions'." },
          { "letter": "D", "text": "The punctuality of high-speed public transit fleets.", "correct": False, "trap": "Opposite Meaning: Transit punctuality is improved by optimization, not lost." }
        ],
        "examinerNote": "Line 6-7 states public squares lose their function as 'unpredictable forums for social interaction' when streets prioritize throughput. Sociologists value spontaneous civic encounters."
      },
      {
        "id": "nov03-q3",
        "skill": "Reference & Deixis",
        "q": "In lines 11–12, \"technologically sophisticated enclosures\" refers metaphorically to...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "smart cities where residents are constantly monitored and deprived of civic spontaneity.", "correct": True, "trap": "Correct: Synthesizes the surveillance regime and loss of unpredictable civic life into the metaphor of an enclosure/cage." },
          { "letter": "B", "text": "automated laboratories where artificial intelligence models are tested.", "correct": False, "trap": "Literal Technical Trap: Confuses urban environments with scientific laboratories." },
          { "letter": "C", "text": "soundproof phone booths installed in pedestrian walkways.", "correct": False, "trap": "Literal Concrete Trap: Interprets 'enclosures' as physical small booths." },
          { "letter": "D", "text": "server farms housing government cloud infrastructure.", "correct": False, "trap": "Hardware Distractor: Server buildings house machines, not 'inhabitants'." }
        ],
        "examinerNote": "The final contrast poses 'communal flourishing' against 'technologically sophisticated enclosures for passive inhabitants', characterizing over-monitored smart cities as gilded cages."
      },
      {
        "id": "nov03-q4",
        "skill": "Rhetorical Purpose",
        "q": "The writer concludes the passage with a question in lines 10–12 primarily to...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "admit ignorance regarding how sensor networks operate in practice.", "correct": False, "trap": "False Modesty Trap: The author clearly understands smart city mechanisms." },
          { "letter": "B", "text": "urge readers to critically assess the human cost of modern urban automation.", "correct": True, "trap": "Correct: The rhetorical question forces the reader to confront whether convenience justifies loss of freedom." },
          { "letter": "C", "text": "demand an immediate increase in municipal funding for surveillance technology.", "correct": False, "trap": "Stance Reversal: The author expresses caution about surveillance, not a demand for more." },
          { "letter": "D", "text": "advise municipal planners to abolish all traffic management systems.", "correct": False, "trap": "DSE Extreme Trap: The passage questions excessive surveillance, not basic traffic safety." }
        ],
        "examinerNote": "Rhetorical concluding questions in DSE Part B2 texts challenge the reader to reconsider conventional assumptions—here, confronting whether smart cities dehumanize their inhabitants."
      }
    ]
  },
  {
    "id": "2026-11-04",
    "date": "2026-11-04",
    "displayDate": "4 Nov 2026",
    "dayLabel": "4 Nov",
    "dayOfWeek": "Wed",
    "title": "The Quiet Quitting Re-evaluation",
    "theme": "Modern Labor & Workplace Sociology",
    "source": "Adapted from BBC Worklife & The Economist",
    "lexile": "1180L (DSE Part B2)",
    "lines": [
      "When the phrase \"quiet quitting\" gained viral traction across social media, corporate",
      "executives swiftly branded it as a crisis of workplace laziness—a covert rebellion by",
      "disengaged employees who refuse to pull their weight. Yet organizational psychologists",
      "present a decidedly different diagnosis. Far from slacking off, the majority of self-described",
      "quiet quitters are simply completing their contracted duties while establishing clear",
      "boundaries against unpaid overtime and weekend communication. In an era where",
      "smartphones have obliterated the physical boundary between the office and the home,",
      "relentless hustle culture had effectively normalized chronic burnout. By declining to",
      "equate their self-worth with institutional martyrdom, these workers are not sabotaging",
      "their employers; they are recalibrating a toxic imbalance. The dilemma for management",
      "is not how to coerce compliance, but whether corporate culture can accommodate",
      "workers who view employment as a professional contract rather than an all-consuming identity."
    ],
    "questions": [
      {
        "id": "nov04-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 9, the phrase \"institutional martyrdom\" refers to...",
        "targetLines": [8, 9, 10],
        "options": [
          { "letter": "A", "text": "sacrificing one's personal health and time for corporate demands.", "correct": True, "trap": "Correct: Martyrdom denotes self-sacrifice for a cause; here, sacrificing personal well-being for an employer." },
          { "letter": "B", "text": "filing a formal legal lawsuit against company mismanagement.", "correct": False, "trap": "Legal Trap: Has nothing to do with sacrificing one's personal time." },
          { "letter": "C", "text": "accepting a leadership position in a charity organization.", "correct": False, "trap": "Literal Institutional Trap: Confuses corporate employer with a non-profit institution." },
          { "letter": "D", "text": "undergoing compulsory safety training in a hazardous factory.", "correct": False, "trap": "Irrelevant Scenario: Not relevant to office overtime culture." }
        ],
        "examinerNote": "In lines 8-9, the author links 'declining to equate their self-worth with institutional martyrdom' with resisting 'chronic burnout' and 'unpaid overtime', meaning excessive self-sacrifice for a firm."
      },
      {
        "id": "nov04-q2",
        "skill": "Inference & Author Stance",
        "q": "Which of the following would the writer most likely AGREE with regarding quiet quitters?",
        "targetLines": [3, 4, 5, 9, 10],
        "options": [
          { "letter": "A", "text": "They are actively neglecting their core contractual obligations.", "correct": False, "trap": "Direct Textual Contradiction: Line 5 explicitly states they are 'simply completing their contracted duties'." },
          { "letter": "B", "text": "They are responding reasonably to years of uncompensated corporate encroachment.", "correct": True, "trap": "Correct: Lines 7-10 argue workers are 'recalibrating a toxic imbalance' caused by smartphones and normalized burnout." },
          { "letter": "C", "text": "They should face immediate termination from forward-thinking firms.", "correct": False, "trap": "Executive Bias Trap: Aligns with the hostile executive view rejected by the author." },
          { "letter": "D", "text": "They are primarily motivated by a desire to damage company profitability.", "correct": False, "trap": "Misattribution: Line 9 states 'they are not sabotaging their employers'." }
        ],
        "examinerNote": "The author explicitly sides with psychologists (lines 3-10), depicting quiet quitting as a healthy boundary-setting reaction to invasive work culture rather than sabotage."
      },
      {
        "id": "nov04-q3",
        "skill": "Reference & Deixis",
        "q": "In line 10, \"a toxic imbalance\" refers to the imbalance between...",
        "targetLines": [6, 7, 8, 9, 10],
        "options": [
          { "letter": "A", "text": "senior executive bonuses and junior staff wages.", "correct": False, "trap": "Plausible Real-World Grievance: Pay inequality is real, but not the topic of lines 6-10." },
          { "letter": "B", "text": "demands for employee sacrifice and the boundaries of personal life.", "correct": True, "trap": "Correct: Captures the erosion between office and home, unpaid overtime, and burnout." },
          { "letter": "C", "text": "the number of male and female managers in executive suites.", "correct": False, "trap": "Gender Diversity Trap: Completely unmentioned in this passage." },
          { "letter": "D", "text": "remote working options and in-person office mandates.", "correct": False, "trap": "Remote Work Trap: While smartphones blurred lines, the imbalance is personal life vs work intrusion." }
        ],
        "examinerNote": "Trace the context of lines 6-10: smartphones 'obliterated the physical boundary between the office and the home' causing burnout. The toxic imbalance is life swallowed by work."
      },
      {
        "id": "nov04-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards corporate executives who label quiet quitting as \"slacking off\" is...",
        "targetLines": [1, 2, 3, 10, 11],
        "options": [
          { "letter": "A", "text": "dismissive of their simplistic diagnosis.", "correct": True, "trap": "Correct: The author counters executive claims ('Far from slacking off... decidedly different diagnosis') and reframes the real management dilemma." },
          { "letter": "B", "text": "wholly supportive of their disciplinary measures.", "correct": False, "trap": "Opposite Trap: The author explicitly rejects coercive compliance." },
          { "letter": "C", "text": "uncertain about which side has stronger empirical data.", "correct": False, "trap": "Ambivalence Trap: The author takes a clear stand with psychologists, not an ambivalent one." },
          { "letter": "D", "text": "indifferent to labor relations altogether.", "correct": False, "trap": "Neutrality Trap: The text engages deeply with the sociology of work." }
        ],
        "examinerNote": "The author directly rejects the executive narrative ('swiftly branded it as a crisis of workplace laziness... Far from slacking off') and urges management to self-reflect."
      }
    ]
  },
  {
    "id": "2026-11-05",
    "date": "2026-11-05",
    "displayDate": "5 Nov 2026",
    "dayLabel": "5 Nov",
    "dayOfWeek": "Thu",
    "title": "The Vanishing Night: The Unseen Cost of Light Pollution",
    "theme": "Environmental Science & Human Biology",
    "source": "Adapted from National Geographic & Nature",
    "lexile": "1190L (DSE Part B2)",
    "lines": [
      "For almost all of evolutionary history, life on Earth unfolded in strict synchronization",
      "with the natural rhythm of day and night. In the brief span of a single century, however,",
      "humanity has waged an unthinking war against the dark. The rampant proliferation of",
      "artificial illumination—from ubiquitous LED streetlamps to luminous digital billboards—",
      "has effectively banished genuine night from modern human settlements. While lighted",
      "streets undoubtedly enhance urban safety, this perpetual twilight carries severe biological",
      "repercussions. Ecologists warn that nocturnal ecosystems are unraveling: migratory birds",
      "are fatally disoriented by urban glares, while pollinating insects perish in droves around",
      "blazing fixtures. For humans, nocturnal light exposure disrupts the synthesis of melatonin,",
      "a critical hormone regulating cellular repair and circadian health. Light pollution is not",
      "merely an aesthetic nuisance for frustrated stargazers; it is an insidious environmental",
      "disruptor that threatens both ecological stability and human physiological resilience."
    ],
    "questions": [
      {
        "id": "nov05-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 6, \"perpetual twilight\" describes...",
        "targetLines": [4, 5, 6],
        "options": [
          { "letter": "A", "text": "a rare natural atmospheric phenomenon occurring only at high latitudes.", "correct": False, "trap": "Literal Science Trap: Confuses artificial light pollution with polar midnight sun." },
          { "letter": "B", "text": "an artificial state of constant semi-darkness caused by excessive city lighting.", "correct": True, "trap": "Correct: Captures the human-made condition where genuine darkness is permanently replaced by dim illumination." },
          { "letter": "C", "text": "an electrical blackout that disables city streetlamps.", "correct": False, "trap": "Opposite Trap: Twilight here is caused by lights remaining on, not going off." },
          { "letter": "D", "text": "the gradual dimming of astronomical telescope lenses over time.", "correct": False, "trap": "Astronomy Distractor: While stargazers are mentioned later, twilight refers to city ambient glow." }
        ],
        "examinerNote": "Line 5-6 states artificial lights have 'banished genuine night', replacing true darkness with an unending artificial glow ('perpetual twilight')."
      },
      {
        "id": "nov05-q2",
        "skill": "Inference & Main Idea",
        "q": "According to lines 10–12, why does the writer mention \"frustrated stargazers\"?",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "To praise their scientific contributions to modern space exploration.", "correct": False, "trap": "Irrelevant Commendation: Space exploration achievements are not discussed." },
          { "letter": "B", "text": "To argue that astronomers are the only group harmed by urban lighting.", "correct": False, "trap": "DSE Extreme Trap: Notice 'only group'—the text explicitly says it is NOT merely their nuisance." },
          { "letter": "C", "text": "To contrast a minor inconvenience with the much graver biological dangers of light pollution.", "correct": True, "trap": "Correct: 'Light pollution is not merely an aesthetic nuisance for frustrated stargazers; it is an insidious environmental disruptor'." },
          { "letter": "D", "text": "To demand that government funding be redirected to public observatories.", "correct": False, "trap": "Policy Distractor: Observatory funding is completely outside the scope of the passage." }
        ],
        "examinerNote": "The construction 'not merely X... but Y' is a staple DSE rhetorical pattern used to contrast a trivial aesthetic complaint with severe physiological and ecological harm."
      },
      {
        "id": "nov05-q3",
        "skill": "Specific Detail & Cause-and-Effect",
        "q": "According to the passage, nocturnal light pollution harms humans biologically by...",
        "targetLines": [8, 9, 10],
        "options": [
          { "letter": "A", "text": "damaging optical retinas through direct exposure to laser billboards.", "correct": False, "trap": "Exaggerated Eye Damage: Laser retina burns are never mentioned; hormone disruption is." },
          { "letter": "B", "text": "impairing the body's natural production of melatonin.", "correct": True, "trap": "Correct: Directly stated in lines 9-10: 'disrupts the synthesis of melatonin, a critical hormone'." },
          { "letter": "C", "text": "eliminating the food supply produced by insect-eating birds.", "correct": False, "trap": "Ecosystem Confusion: Bird deaths impact ecology, but human physiological damage is hormonal." },
          { "letter": "D", "text": "inducing severe daytime heat exhaustion in metropolitan areas.", "correct": False, "trap": "Thermal Distortion: Confuses light pollution with the urban heat island effect." }
        ],
        "examinerNote": "Lines 9-10 explicitly connect nocturnal light exposure in humans to disrupted 'synthesis of melatonin, a critical hormone regulating cellular repair and circadian health'."
      },
      {
        "id": "nov05-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's stance on artificial illumination in urban spaces can best be characterized as...",
        "targetLines": [5, 6, 11, 12],
        "options": [
          { "letter": "A", "text": "wholly unconcerned about animal extinction.", "correct": False, "trap": "Direct Contradiction: The author highlights birds and insects dying in droves." },
          { "letter": "B", "text": "acknowledging its public safety utility while urging awareness of its severe ecological hazards.", "correct": True, "trap": "Correct: Balanced DSE Part B2 stance: 'While lighted streets undoubtedly enhance urban safety, this perpetual twilight carries severe biological repercussions'." },
          { "letter": "C", "text": "demanding the immediate shutoff of all urban electrical power grids.", "correct": False, "trap": "Extreme Abolition Trap: The author does not demand total blackout or grid shutdown." },
          { "letter": "D", "text": "optimistic that modern LEDs will soon eliminate biological harm.", "correct": False, "trap": "Misplaced Optimism: Line 4 explicitly lists LED lamps as a key contributor to the problem." }
        ],
        "examinerNote": "Notice the concession in line 5-6 ('While lighted streets undoubtedly enhance urban safety...'), followed by urgent warnings of biological damage. This demonstrates a nuanced, cautionary stance."
      }
    ]
  },
  {
    "id": "2026-11-06",
    "date": "2026-11-06",
    "displayDate": "6 Nov 2026",
    "dayLabel": "6 Nov",
    "dayOfWeek": "Fri",
    "title": "Algorithmic Monoculture: The Death of Cultural Discovery",
    "theme": "Media & Artificial Intelligence",
    "source": "Adapted from The New Yorker & Wired",
    "lexile": "1210L (DSE Part B2)",
    "lines": [
      "Streaming platforms once promised an unprecedented golden age of cultural democracy,",
      "granting ordinary listeners instantaneous access to every recorded sound in human",
      "history. In practice, however, predictive recommendation engines have achieved precisely",
      "the inverse. Governed by engagement algorithms designed to maximize platform retention,",
      "these systems shepherd vast global audiences into narrow, self-reinforcing stylistic corridors.",
      "Rather than exposing listeners to radical novelty, streaming models prioritize audio tracks",
      "engineered to function as ambient sonic wallpaper—unobtrusive, mid-tempo, and devoid of",
      "jarring artistic idiosyncrasies that might provoke a user to skip. The consequence is an",
      "insidious musical monoculture, where regional genres are homogenized into algorithmic slurry.",
      "When cultural consumption is mediated solely by mathematical prediction, serendipity is",
      "strangled. We are left with an illusion of limitless choice that masks an increasingly",
      "standardized artistic landscape."
    ],
    "questions": [
      {
        "id": "nov06-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 8, the word \"idiosyncrasies\" most closely refers to...",
        "targetLines": [7, 8, 9],
        "options": [
          { "letter": "A", "text": "distinctive, peculiar stylistic characteristics.", "correct": True, "trap": "Correct: An idiosyncrasy is a distinctive or eccentric feature of a person or artwork." },
          { "letter": "B", "text": "sound recording errors caused by faulty microphones.", "correct": False, "trap": "Literal Technical Error: Confuses artistic distinctiveness with equipment failure." },
          { "letter": "C", "text": "marketing slogans printed on vinyl album covers.", "correct": False, "trap": "Commercial Trap: Completely unsuited to musical style." },
          { "letter": "D", "text": "copyright violations committed by amateur composers.", "correct": False, "trap": "Legal Trap: Conflates artistic individuality with intellectual property theft." }
        ],
        "examinerNote": "Lines 7-8 describe tracks devoid of 'jarring artistic idiosyncrasies that might provoke a user to skip', meaning unique or unconventional creative quirks."
      },
      {
        "id": "nov06-q2",
        "skill": "Reference & Deixis",
        "q": "In lines 3–4, \"precisely the inverse\" refers to...",
        "targetLines": [1, 2, 3, 4, 5],
        "options": [
          { "letter": "A", "text": "platforms becoming bankrupt instead of profitable.", "correct": False, "trap": "Financial Fallacy: Commercial profitability is not the contrast in lines 1-3." },
          { "letter": "B", "text": "engines narrowing cultural exposure instead of broadening it.", "correct": True, "trap": "Correct: Reverses 'an unprecedented golden age of cultural democracy' with 'narrow, self-reinforcing stylistic corridors'." },
          { "letter": "C", "text": "musicians refusing to upload songs to digital streaming servers.", "correct": False, "trap": "Artist Boycott Distractor: The text discusses user consumption, not artist boycotts." },
          { "letter": "D", "text": "listeners deleting streaming applications from mobile smartphones.", "correct": False, "trap": "User Action Trap: The passage says users are retained, not leaving." }
        ],
        "examinerNote": "Trace back to lines 1-3: streaming promised 'cultural democracy' (unlimited access to all music history), but engines did the opposite by herding users into narrow corridors."
      },
      {
        "id": "nov06-q3",
        "skill": "Inference & Subtext",
        "q": "Why do streaming algorithms favour \"unobtrusive, mid-tempo\" tracks (lines 6–8)?",
        "targetLines": [6, 7, 8],
        "options": [
          { "letter": "A", "text": "They consume far less bandwidth across cellular network towers.", "correct": False, "trap": "Technical Distortion: Bandwidth depends on file bitrate, not musical tempo." },
          { "letter": "B", "text": "They minimize the chance that a distracted user will change the track.", "correct": True, "trap": "Correct: Lines 7-8 explicitly state they avoid anything that 'might provoke a user to skip', maximizing retention." },
          { "letter": "C", "text": "They are cheaper for streaming services to license from record labels.", "correct": False, "trap": "Licensing Assumption: Plausible in business, but unmentioned in the text." },
          { "letter": "D", "text": "They are exclusively produced by classical European symphony orchestras.", "correct": False, "trap": "Genre Trap: The text mentions 'algorithmic slurry', not European classical music." }
        ],
        "examinerNote": "Lines 7-8 explicitly link mid-tempo background tracks to avoiding 'jarring artistic idiosyncrasies that might provoke a user to skip', keeping users listening without interruption."
      },
      {
        "id": "nov06-q4",
        "skill": "Tone & Writer's Stance",
        "q": "In lines 10–12, the writer's attitude towards the \"illusion of limitless choice\" is...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "reverent and appreciative", "correct": False, "trap": "Direct Opposite: The author deplores the uniformity beneath the illusion." },
          { "letter": "B", "text": "cynical and sorrowful regarding the loss of genuine cultural diversity", "correct": True, "trap": "Correct: Words like 'serendipity is strangled' and 'standardized artistic landscape' reflect mourning over lost cultural variety." },
          { "letter": "C", "text": "optimistic that independent artists will soon overcome the algorithms", "correct": False, "trap": "Unfounded Hope: The passage ends without an optimistic resolution." },
          { "letter": "D", "text": "baffled as to why people still listen to recorded music", "correct": False, "trap": "Absurd Extreme: The author analyzes streaming mechanics, not confusion over music itself." }
        ],
        "examinerNote": "The closing phrase ('serendipity is strangled... masks an increasingly standardized artistic landscape') expresses grave concern and disillusionment with the homogenization of culture."
      }
    ]
  },
  {
    "id": "2026-11-07",
    "date": "2026-11-07",
    "displayDate": "7 Nov 2026",
    "dayLabel": "7 Nov",
    "dayOfWeek": "Sat",
    "title": "The Resurgence of the Analog: Tactile Longing in a Screen Age",
    "theme": "Material Culture & Digital Fatigue",
    "source": "Adapted from The Atlantic & The Financial Times",
    "lexile": "1190L (DSE Part B2)",
    "lines": [
      "In an era where virtually every human artefact can be dematerialized into cloud-hosted",
      "code, an unexpected counter-revolution has taken root: the stubborn revival of the",
      "analog. Vinyl record sales have outstripped compact discs for the first time in decades;",
      "fountain pens, mechanical watches, and 35mm film cameras enjoy an unprecedented renaissance",
      "among digital natives. Sociologists often dismiss this trend as mere hipster nostalgia—a",
      "superficial aesthetic pose orchestrated by retro-marketing agencies. Yet this cynical",
      "reading fundamentally misjudges the psychological impulse at play. In a world saturated",
      "by frictionless, ephemeral digital streams, humans crave the grounding resistance of physical",
      "matter. To play a vinyl record requires deliberate ceremony: sliding the disc from its sleeve,",
      "inspecting the grooves, and gently dropping the needle. Unlike digital media, which demands",
      "passive reception, analog artefacts demand conscious presence. In embracing the imperfect",
      "and the tactile, people are seeking refuge from the relentless exhaustion of the disembodied screen."
    ],
    "questions": [
      {
        "id": "nov07-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 8, the word \"ephemeral\" most closely means...",
        "targetLines": [7, 8],
        "options": [
          { "letter": "A", "text": "extremely costly to purchase.", "correct": False, "trap": "Financial Trap: Ephemeral relates to time and fleetingness, not financial expense." },
          { "letter": "B", "text": "lasting for only a very brief period and lacking permanence.", "correct": True, "trap": "Correct: Ephemeral describes fleeting, transitory digital content contrasted with durable physical matter." },
          { "letter": "C", "text": "technologically flawless and perfectly designed.", "correct": False, "trap": "Quality Trap: Digital media may be convenient, but ephemeral addresses its lack of physical permanence." },
          { "letter": "D", "text": "difficult to download over wireless networks.", "correct": False, "trap": "Technical Distortion: The passage calls digital streams 'frictionless', not difficult." }
        ],
        "examinerNote": "Line 8 contrasts 'frictionless, ephemeral digital streams' with the 'grounding resistance of physical matter'. Fleeting, intangible streams lack permanence."
      },
      {
        "id": "nov07-q2",
        "skill": "Argument & Contrast",
        "q": "How does the writer's view of the analog revival differ from the view of sociologists (lines 5–7)?",
        "targetLines": [5, 6, 7, 8],
        "options": [
          { "letter": "A", "text": "Sociologists blame manufacturing monopolies, whereas the writer blames consumer poverty.", "correct": False, "trap": "Fabricated Economics: Neither monopolies nor poverty is cited in the passage." },
          { "letter": "B", "text": "Sociologists regard it as a superficial marketing fad, whereas the writer sees it as a genuine human need for physical presence.", "correct": True, "trap": "Correct: Sociologists see 'mere hipster nostalgia... superficial aesthetic pose'; the writer identifies a profound craving for 'grounding resistance' and 'conscious presence'." },
          { "letter": "C", "text": "Sociologists believe analog products will fail, whereas the writer claims digital tech will vanish.", "correct": False, "trap": "Extreme Future Prediction: The writer never suggests digital technology will disappear entirely." },
          { "letter": "D", "text": "Sociologists focus on vinyl records, whereas the writer examines only mechanical wristwatches.", "correct": False, "trap": "Detail Distortion: Both mention multiple analog items." }
        ],
        "examinerNote": "Lines 5-7 state sociologists view the trend as 'mere hipster nostalgia—a superficial aesthetic pose', which the author directly counters by explaining the deep psychological need for tactile grounding."
      },
      {
        "id": "nov07-q3",
        "skill": "Reference & Deixis",
        "q": "In line 9, \"deliberate ceremony\" refers to...",
        "targetLines": [8, 9, 10],
        "options": [
          { "letter": "A", "text": "a formal legal celebration held in Japanese manufacturing plants.", "correct": False, "trap": "Literal Legal Ceremony: Misinterprets personal habit as a state ceremony." },
          { "letter": "B", "text": "the intentional physical actions involved in playing a vinyl record.", "correct": True, "trap": "Correct: Follows immediately in lines 9-10: 'sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle'." },
          { "letter": "C", "text": "an advertising ritual broadcast across social media channels.", "correct": False, "trap": "Marketing Distractor: The ceremony is private and tactile, not an online marketing stunt." },
          { "letter": "D", "text": "the process of converting analog audio into digital MP3 files.", "correct": False, "trap": "Opposite Process: The ceremony is about enjoying vinyl, not digitizing it." }
        ],
        "examinerNote": "The colon in line 9 directly introduces the explanation of the ceremony: 'sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle'."
      },
      {
        "id": "nov07-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards people buying analog goods in the digital age is...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "scornful and condescending", "correct": False, "trap": "Opposite Stance: The author defends them against sociologists' scorn." },
          { "letter": "B", "text": "deeply empathetic and validating", "correct": True, "trap": "Correct: The author validates their choices as a healthy search for 'refuge from the relentless exhaustion of the disembodied screen'." },
          { "letter": "C", "text": "indifferent and detached", "correct": False, "trap": "Neutrality Trap: The author is emotionally invested in explaining the tactile human need." },
          { "letter": "D", "text": "skeptical of their mechanical competence", "correct": False, "trap": "Irrelevant Skepticism: The author describes users carefully dropping needles, not incompetent." }
        ],
        "examinerNote": "The writer defends analog buyers against cynical critics, describing their actions warmly as seeking 'conscious presence' and 'refuge from... relentless exhaustion'."
      }
    ]
  },
  {
    "id": "2026-11-08",
    "date": "2026-11-08",
    "displayDate": "8 Nov 2026",
    "dayLabel": "8 Nov",
    "dayOfWeek": "Sun",
    "title": "The Mirage of Carbon Offsets: Corporate Greenwashing",
    "theme": "Environmental Economics & Climate Policy",
    "source": "Adapted from The Guardian & Financial Times",
    "lexile": "1210L (DSE Part B2)",
    "lines": [
      "In the glitzy brochures of multinational corporations, achieving \"net-zero\" emissions",
      "is routinely depicted as a solved equation. By purchasing carbon offsets—investing",
      "in distant reforestation schemes or renewable energy grids—firms claim to neutralize",
      "their environmental footprint while altering almost nothing about their core operations.",
      "Yet independent climate audits reveal this lucrative market to be largely a statistical",
      "fiction. The vast majority of forest conservation credits are issued for woodlands that",
      "were never under genuine threat of deforestation, creating \"phantom reductions\" on",
      "balance sheets. Rather than catalyzing structural decarbonization, offsets serve as an",
      "affordable moral indulgence, granting polluting enterprises a public relations license to",
      "expand emissions unabated. Until international regulatory frameworks mandate genuine,",
      "verifiable operational emission cuts, corporate net-zero pledges remain an elaborate",
      "exercise in commercial greenwashing."
    ],
    "questions": [
      {
        "id": "nov08-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 9, the phrase \"moral indulgence\" suggests that carbon offsets function like...",
        "targetLines": [8, 9, 10],
        "options": [
          { "letter": "A", "text": "a fee paid to relieve guilt without demanding genuine behavioral sacrifice.", "correct": True, "trap": "Correct: Alluding to historical religious indulgences, it denotes paying money to pardon moral wrongdoing without changing one's sins." },
          { "letter": "B", "text": "a legally mandatory fine imposed by international environmental courts.", "correct": False, "trap": "Legal Distortion: The passage notes credits are voluntary PR mechanisms, not court fines." },
          { "letter": "C", "text": "a highly profitable investment that yields guaranteed dividend returns.", "correct": False, "trap": "Financial Trap: Focuses on monetary returns rather than ethical evasion." },
          { "letter": "D", "text": "a scientific technique for directly capturing carbon from the upper atmosphere.", "correct": False, "trap": "Technical Trap: Confuses an accounting metaphor with atmospheric engineering." }
        ],
        "examinerNote": "In line 9, 'moral indulgence' describes companies buying cheap offsets so they feel ethically justified to 'expand emissions unabated', evading real decarbonization."
      },
      {
        "id": "nov08-q2",
        "skill": "Reference & Deixis",
        "q": "In lines 7–8, \"phantom reductions\" refers to...",
        "targetLines": [5, 6, 7, 8],
        "options": [
          { "letter": "A", "text": "emission decreases that appear on accounting ledgers but do not exist in the atmosphere.", "correct": True, "trap": "Correct: 'Phantom' means illusory; credits issued for forests that were never endangered count on paper but save zero real carbon." },
          { "letter": "B", "text": "unexplained power outages across industrial manufacturing zones.", "correct": False, "trap": "Irrelevant Scenario: Power blackouts are not referenced in the text." },
          { "letter": "C", "text": "the rapid cancellation of corporate air travel tickets.", "correct": False, "trap": "Corporate Anecdote: Air travel is unmentioned." },
          { "letter": "D", "text": "the physical disappearance of trees due to unexpected wildfires.", "correct": False, "trap": "Wildfire Distractor: The problem is paper accounting, not physical tree loss." }
        ],
        "examinerNote": "Trace lines 6-7: credits issued for trees 'that were never under genuine threat of deforestation' produce 'phantom reductions on balance sheets'—fake accounting figures."
      },
      {
        "id": "nov08-q3",
        "skill": "Inference & Subtext",
        "q": "What do independent audits imply about corporate net-zero campaigns in lines 5–10?",
        "targetLines": [5, 6, 7, 8, 9, 10],
        "options": [
          { "letter": "A", "text": "They allow companies to continue polluting while projecting an eco-friendly image.", "correct": True, "trap": "Correct: Directly synthesizes lines 8-10: 'granting polluting enterprises a public relations license to expand emissions unabated'." },
          { "letter": "B", "text": "They have successfully eliminated global greenhouse gas emissions ahead of schedule.", "correct": False, "trap": "Extreme Positive Trap: Contradicts the entire critical thrust of the passage." },
          { "letter": "C", "text": "They cost so much money that multinational corporations are facing bankruptcy.", "correct": False, "trap": "Economic Inversion Trap: Line 9 explicitly describes offsets as 'an affordable moral indulgence'." },
          { "letter": "D", "text": "They are exclusively organized and funded by non-profit charities.", "correct": False, "trap": "Charity Trap: The text focuses on corporate purchasing to protect balance sheets." }
        ],
        "examinerNote": "Lines 8-10 explain offsets grant companies 'a public relations license to expand emissions unabated'—permitting real pollution under the cover of green marketing."
      },
      {
        "id": "nov08-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards the carbon offset market in lines 10–12 can best be described as...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "skeptical and demanding accountability", "correct": True, "trap": "Correct: Characterizing pledges as 'an elaborate exercise in commercial greenwashing' and insisting on 'genuine, verifiable' cuts shows sharp skepticism and demand for reform." },
          { "letter": "B", "text": "apologetic on behalf of corporations", "correct": False, "trap": "Opposite Stance: The author attacks, not defends, corporate pledges." },
          { "letter": "C", "text": "mildly bewildered by accounting terminology", "correct": False, "trap": "Ignorance Trap: The author demonstrates command of offset accounting." },
          { "letter": "D", "text": "celebratory of corporate voluntary self-policing", "correct": False, "trap": "Stance Reversal: The author explicitly demands mandatory regulation instead of voluntary pledges." }
        ],
        "examinerNote": "Concluding with 'commercial greenwashing' and calling for mandatory international frameworks indicates deep skepticism of voluntary corporate claims and a demand for rigorous accountability."
      }
    ]
  },
  {
    "id": "2026-11-09",
    "date": "2026-11-09",
    "displayDate": "9 Nov 2026",
    "dayLabel": "9 Nov",
    "dayOfWeek": "Mon",
    "title": "The Fragmented Mind: How Hyperlinks Alter Deep Reading",
    "theme": "Cognitive Science & Literacy",
    "source": "Adapted from The Atlantic",
    "lexile": "1190L (DSE Part B2)",
    "lines": [
      "When hypertext was first introduced to the internet, educational theorists predicted a",
      "democratizing intellectual revolution. By embedding clickable links directly within text,",
      "readers could traverse boundless repositories of knowledge at their own discretion.",
      "Yet cognitive neuroscientists now observe that the online reading architecture encourages",
      "mental fragmentation rather than intellectual depth. Every hyperlink introduces a subtle",
      "cognitive decision: to click or to continue reading. While imperceptible to the reader,",
      "these continuous micro-evaluations consume finite working memory resources, interrupting",
      "the sustained immersion necessary for conceptual synthesis. The human brain, inherently",
      "plastic, rapidly adapts to the brisk skimming demanded by web interfaces, but at a severe",
      "cost. The capacity for linear, contemplative deep reading—the quiet intellectual crucible",
      "in which critical reasoning and empathy are cultivated—is steadily being eclipsed by the",
      "frenetic impulse to graze upon scattered fragments of information."
    ],
    "questions": [
      {
        "id": "nov09-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 12, the word \"graze\" is used figuratively to describe...",
        "targetLines": [10, 11, 12],
        "options": [
          { "letter": "A", "text": "superficially sampling small pieces of information without deep comprehension.", "correct": True, "trap": "Correct: Borrowed from cattle nibbling grass, 'graze' here means scanning superficial snippets without intellectual digestion." },
          { "letter": "B", "text": "purchasing organic agricultural produce in suburban supermarkets.", "correct": False, "trap": "Literal Meaning Trap: Confuses figurative grazing with literal farming/dietary habits." },
          { "letter": "C", "text": "memorizing every single sentence in an academic textbook.", "correct": False, "trap": "Opposite Meaning: Grazing is the exact opposite of rigorous memorization." },
          { "letter": "D", "text": "erasing historical data from digital storage servers.", "correct": False, "trap": "Technical Distortion: Graze does not mean deleting or erasing data." }
        ],
        "examinerNote": "Line 12 contrasts 'contemplative deep reading' with 'the frenetic impulse to graze upon scattered fragments of information'. Grazing denotes superficial, scattered browsing."
      },
      {
        "id": "nov09-q2",
        "skill": "Inference & Cause-and-Effect",
        "q": "According to lines 5–8, why do hyperlinks impair reading comprehension?",
        "targetLines": [5, 6, 7, 8],
        "options": [
          { "letter": "A", "text": "They force readers to solve complex mathematical puzzles before proceeding.", "correct": False, "trap": "Absurd Exaggeration: Links are simple clicks, not math puzzles." },
          { "letter": "B", "text": "The subconscious decision of whether to click drains brain working memory.", "correct": True, "trap": "Correct: Lines 6-8: 'these continuous micro-evaluations consume finite working memory resources, interrupting sustained immersion'." },
          { "letter": "C", "text": "They cause computer display monitors to overheat and flicker erratically.", "correct": False, "trap": "Hardware Distractor: Hardware failures are not mentioned." },
          { "letter": "D", "text": "They transmit computer viruses that corrupt personal digital files.", "correct": False, "trap": "Cybersecurity Trap: Unrelated to cognitive psychology." }
        ],
        "examinerNote": "Lines 6-8 explicitly link cognitive friction to 'continuous micro-evaluations' that consume working memory, which prevents sustained mental immersion."
      },
      {
        "id": "nov09-q3",
        "skill": "Reference & Deixis",
        "q": "In line 10, \"the quiet intellectual crucible\" refers to...",
        "targetLines": [9, 10, 11],
        "options": [
          { "letter": "A", "text": "uninterrupted, contemplative linear reading.", "correct": True, "trap": "Correct: The phrase stands in apposition to 'The capacity for linear, contemplative deep reading'." },
          { "letter": "B", "text": "a soundproof room built inside university libraries.", "correct": False, "trap": "Literal Architecture Trap: Confuses an intellectual metaphor with a physical laboratory/room." },
          { "letter": "C", "text": "the high-speed processing unit of a quantum computer.", "correct": False, "trap": "Computing Trap: Misattributes biological cognitive terms to hardware." },
          { "letter": "D", "text": "the collaborative comment section of an online newspaper.", "correct": False, "trap": "Web Feature Trap: The author argues web comment sections promote distraction, not quiet crucibles." }
        ],
        "examinerNote": "Trace lines 10-11: 'The capacity for linear, contemplative deep reading—the quiet intellectual crucible in which critical reasoning and empathy are cultivated'. The crucible is deep reading."
      },
      {
        "id": "nov09-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards the decline of traditional deep reading is best described as...",
        "targetLines": [9, 10, 11, 12],
        "options": [
          { "letter": "A", "text": "sorrowful and apprehensive", "correct": True, "trap": "Correct: Words like 'severe cost', 'eclipsed', and mourning the loss of 'critical reasoning and empathy' reflect deep concern and lament." },
          { "letter": "B", "text": "exhilarated by digital speed", "correct": False, "trap": "Direct Inversion Trap: The author warns against 'frenetic impulse', not celebrating it." },
          { "letter": "C", "text": "completely indifferent to educational outcomes", "correct": False, "trap": "Neutrality Trap: The entire argument advocates for the preservation of deep literacy." },
          { "letter": "D", "text": "scornful towards educational theorists only", "correct": False, "trap": "Narrow Focus Trap: The author analyzes cognitive neuroscience, not personal contempt for theorists." }
        ],
        "examinerNote": "The final sentence mourns that contemplative deep reading is 'steadily being eclipsed' by superficial grazing, expressing genuine apprehension for human critical thought."
      }
    ]
  },
  {
    "id": "2026-11-10",
    "date": "2026-11-10",
    "displayDate": "10 Nov 2026",
    "dayLabel": "10 Nov",
    "dayOfWeek": "Tue",
    "title": "The Street Hawker Dilemma: Heritage vs Modern Hygiene",
    "theme": "Cultural Heritage & Urban Governance",
    "source": "Adapted from SCMP & The Straits Times",
    "lexile": "1200L (DSE Part B2)",
    "lines": [
      "In the dense alleyways of post-war Asian metropolises, street hawkers were once the",
      "indispensable lifeblood of community sustenance, serving affordable culinary traditions",
      "over open charcoal flames. In recent decades, however, municipal authorities have",
      "systematically curtailed street vending, citing stringent hygiene regulations, pedestrian",
      "congestion, and the modernization of urban infrastructure. While organized municipal",
      "food courts have undeniably eradicated cholera and standardized sanitation, they have also",
      "sterilized the intangible cultural vitality of the streets. When culinary artisans are",
      "relocated into identical, air-conditioned stalls with soaring rental overheads, the social fabric",
      "of neighbourhood interaction inevitably frays. Traditional culinary knowledge, passed down",
      "through generations of apprentice cooks, is discarded as younger generations abandon the",
      "exhausting trade. The dilemma confronting urban administrators is whether modern governance",
      "must treat street heritage as an unsanitary nuisance to be extinguished, or as living history",
      "worthy of institutional accommodation."
    ],
    "questions": [
      {
        "id": "nov10-q1",
        "skill": "Vocabulary in Context",
        "q": "In line 7, the word \"sterilized\" is used figuratively to mean...",
        "targetLines": [6, 7, 8],
        "options": [
          { "letter": "A", "text": "stripped of authentic charm, spontaneity, and cultural life.", "correct": True, "trap": "Correct: Playing on medical sterilization (killing germs), the author means removing the vibrant, messy soul and character of street culture." },
          { "letter": "B", "text": "sprayed with chemical pesticides to eliminate rodents.", "correct": False, "trap": "Literal Sanitation Trap: Interprets the medical sense of spraying disinfectants rather than cultural draining." },
          { "letter": "C", "text": "expanded dramatically in physical floor area.", "correct": False, "trap": "Opposite Meaning: Stalls were constricted, not expanded." },
          { "letter": "D", "text": "subsidized entirely by central government tourism departments.", "correct": False, "trap": "Financial Fallacy: Stalls face 'soaring rental overheads', not government subsidies." }
        ],
        "examinerNote": "Line 7 pairs 'sterilized' with 'the intangible cultural vitality of the streets'. Modern food courts are medically clean, but culturally sterile and devoid of authentic street character."
      },
      {
        "id": "nov10-q2",
        "skill": "Argument & Contrast",
        "q": "According to lines 5–9, what trade-off occurred when hawkers were moved into modern food centres?",
        "targetLines": [5, 6, 7, 8, 9],
        "options": [
          { "letter": "A", "text": "Sanitation improved, but community social interaction and affordability deteriorated.", "correct": True, "trap": "Correct: Lines 6-9: 'undeniably eradicated cholera... but social fabric of neighbourhood interaction inevitably frays' amid 'soaring rental overheads'." },
          { "letter": "B", "text": "Food prices dropped significantly, while cooking preparation times tripled.", "correct": False, "trap": "Economic Inversion: Rents soared, making food more expensive, not cheaper." },
          { "letter": "C", "text": "Customer foot traffic doubled, but hygiene standards collapsed.", "correct": False, "trap": "Hygiene Reversal: Hygiene improved, not collapsed." },
          { "letter": "D", "text": "Young people rushed to become hawkers, displacing senior master chefs.", "correct": False, "trap": "Generational Inversion: Line 10 states 'younger generations abandon the exhausting trade'." }
        ],
        "examinerNote": "The passage balances public health benefits ('eradicated cholera') against cultural and social loss ('soaring rental overheads', fraying social fabric, vanishing artisan lineage)."
      },
      {
        "id": "nov10-q3",
        "skill": "Inference & Subtext",
        "q": "Why is traditional street food culture disappearing according to lines 9–11?",
        "targetLines": [9, 10, 11],
        "options": [
          { "letter": "A", "text": "Young people are reluctant to endure the grueling physical labour required by the trade.", "correct": True, "trap": "Correct: Paraphrases lines 10-11: 'younger generations abandon the exhausting trade'." },
          { "letter": "B", "text": "Municipal governments have officially made traditional recipes illegal to prepare.", "correct": False, "trap": "Absurd Legal Trap: Recipes are not banned; hygiene and vending locations are regulated." },
          { "letter": "C", "text": "Local residents prefer imported fast food over indigenous culinary dishes.", "correct": False, "trap": "Western Fast Food Trap: Resident preference shifts are not mentioned." },
          { "letter": "D", "text": "Charcoal fuel can no longer be legally imported into the region.", "correct": False, "trap": "Literal Fuel Distractor: Fuel supply issues are unmentioned." }
        ],
        "examinerNote": "Lines 9-11 state traditional knowledge is lost because 'younger generations abandon the exhausting trade', finding long hours of kitchen toil unappealing."
      },
      {
        "id": "nov10-q4",
        "skill": "Tone & Writer's Stance",
        "q": "In lines 11–13, the writer's attitude towards street hawking is...",
        "targetLines": [11, 12, 13],
        "options": [
          { "letter": "A", "text": "sympathetic to its cultural worth and supportive of preservation.", "correct": True, "trap": "Correct: Framing street food as 'living history worthy of institutional accommodation' shows respect and advocacy for preservation." },
          { "letter": "B", "text": "strictly hostile towards all uninspected food stalls.", "correct": False, "trap": "Bureaucratic Stance: Aligns with strict municipal inspectors, which the author questions." },
          { "letter": "C", "text": "indifferent to the architectural design of food courts.", "correct": False, "trap": "Neutrality Trap: The author actively critiques identical, sterile stalls." },
          { "letter": "D", "text": "optimistic that hawking will automatically thrive without policy support.", "correct": False, "trap": "False Complacency: The author stresses hawking is facing extinction unless accommodated." }
        ],
        "examinerNote": "The closing question contrasts treating hawkers as 'an unsanitary nuisance' with 'living history worthy of institutional accommodation', indicating clear empathy for its heritage value."
      }
    ]
  }
]

# Output JS file
js_content = f"""/* ===================================================================
   LexiQuest - HKDSE Daily Reading Oracle Dataset (November 2026 Calendar)
   Calibrated strictly to HKDSE English Paper 1 Part B2 Standard (~1180L-1220L)
   Each entry corresponds to an authentic calendar day (e.g. 1 Nov 2026).
   =================================================================== */

const DSE_READING_DATA = {json.dumps(CURRICULUM, indent=2)};

if (typeof module !== "undefined" && module.exports) {{
  module.exports = {{ DSE_READING_DATA }};
}}
"""

with open('/Users/kelvinluimacbookair/.gemini/antigravity-ide/scratch/vocab-game/data/dse_reading.js', 'w') as f:
  f.write(js_content)

print(f"Generated data/dse_reading.js with {len(CURRICULUM)} daily calendar passages!")

