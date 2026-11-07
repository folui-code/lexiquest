"""
Generates Reading Oracle passages starting from 7 Nov 2026.
Removes all line numbers and replaces line references with clean bold/* markers.
"""

import json

PASSAGES = [
  {
    "id": "2026-11-07",
    "date": "2026-11-07",
    "displayDate": "7 Nov 2026",
    "dayLabel": "7 Nov",
    "dayOfWeek": "Sat",
    "title": "The Resurgence of the Analog: Tactile Longing in a Screen Age",
    "theme": "Material Culture & Digital Fatigue",
    "source": "Adapted from The Atlantic & Financial Times",
    "lexile": "1190L (DSE Part B2)",
    "text": "In an era where virtually every human artefact can be dematerialized into cloud-hosted code, an unexpected counter-revolution has taken root: the stubborn revival of the analog. Vinyl record sales have outstripped compact discs for the first time in decades; fountain pens, mechanical watches, and 35mm film cameras enjoy an unprecedented renaissance among digital natives. Sociologists often dismiss this trend as mere hipster nostalgia—a superficial aesthetic pose orchestrated by retro-marketing agencies. Yet this cynical reading fundamentally misjudges the psychological impulse at play. In a world saturated by frictionless, **ephemeral** [*] digital streams, humans crave the grounding resistance of physical matter. To play a vinyl record requires ***deliberate ceremony*** [**]: sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle. Unlike digital media, which demands passive reception, analog artefacts demand conscious presence. In embracing the imperfect and the tactile, people are seeking refuge from the relentless exhaustion of the disembodied screen.",
    "questions": [
      {
        "id": "nov07-q1",
        "skill": "Vocabulary in Context",
        "q": "The word \"ephemeral\" [*] most closely means...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "extremely costly to purchase.", "correct": False, "trap": "Financial Trap: Ephemeral relates to time and transience, not financial expense." },
          { "letter": "B", "text": "lasting for only a brief period and lacking physical permanence.", "correct": True, "trap": "Correct: Ephemeral describes fleeting, transitory digital content contrasted with durable physical matter." },
          { "letter": "C", "text": "technologically flawless and perfectly designed.", "correct": False, "trap": "Quality Trap: Digital media may be convenient, but ephemeral addresses its lack of permanence." },
          { "letter": "D", "text": "difficult to download over wireless networks.", "correct": False, "trap": "Technical Distortion: The passage calls digital streams 'frictionless', not difficult." }
        ],
        "examinerNote": "The word 'ephemeral' [*] is contrasted with the 'grounding resistance of physical matter'. Fleeting, intangible digital streams lack lasting permanence."
      },
      {
        "id": "nov07-q2",
        "skill": "Argument & Contrast",
        "q": "How does the writer's view of the analog revival differ from the view of sociologists?",
        "options": [
          { "letter": "A", "text": "Sociologists blame manufacturing monopolies, whereas the writer blames consumer poverty.", "correct": False, "trap": "Fabricated Economics: Neither monopolies nor poverty is cited in the passage." },
          { "letter": "B", "text": "Sociologists regard it as a superficial marketing fad, whereas the writer sees it as a genuine human need for physical presence.", "correct": True, "trap": "Correct: Sociologists see 'mere hipster nostalgia—a superficial aesthetic pose'; the writer identifies a profound craving for 'grounding resistance' and 'conscious presence'." },
          { "letter": "C", "text": "Sociologists believe analog products will fail, whereas the writer claims digital tech will vanish.", "correct": False, "trap": "Extreme Future Prediction: The writer never suggests digital technology will disappear entirely." },
          { "letter": "D", "text": "Sociologists focus on vinyl records, whereas the writer examines only mechanical wristwatches.", "correct": False, "trap": "Detail Distortion: Both mention multiple analog items." }
        ],
        "examinerNote": "Sociologists view the trend as 'mere hipster nostalgia—a superficial aesthetic pose', which the author directly counters by explaining the deep psychological need for tactile grounding."
      },
      {
        "id": "nov07-q3",
        "skill": "Reference & Deixis",
        "q": "The phrase \"deliberate ceremony\" [**] refers to...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "a formal legal celebration held in manufacturing plants.", "correct": False, "trap": "Literal Legal Ceremony: Misinterprets personal habit as an official state ceremony." },
          { "letter": "B", "text": "the intentional physical actions involved in playing a vinyl record.", "correct": True, "trap": "Correct: Follows immediately after the colon: 'sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle'." },
          { "letter": "C", "text": "an advertising ritual broadcast across social media channels.", "correct": False, "trap": "Marketing Distractor: The ceremony is private and tactile, not an online marketing stunt." },
          { "letter": "D", "text": "the technical process of converting analog audio into digital MP3 files.", "correct": False, "trap": "Opposite Process: The ceremony is about enjoying vinyl, not digitizing it." }
        ],
        "examinerNote": "The colon after 'deliberate ceremony' [**] directly introduces the physical actions: 'sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle'."
      },
      {
        "id": "nov07-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards people buying analog goods in the digital age is...",
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
    "title": "The Architecture of Digital Distraction",
    "theme": "Digital Culture & Behavioral Psychology",
    "source": "Adapted from The Guardian & The Atlantic",
    "lexile": "1200L (DSE Part B2)",
    "text": "When engineers first conceived the \"infinite scroll\" in 2006, it was heralded as a triumph of user design—an elegant mechanism that eliminated the tedious friction of clicking between pages. Yet two decades later, this ubiquitous feature has **metastasized** [*] into one of modern technology's most insidious psychological traps. By removing natural stopping cues, social media platforms deliberately exploit our brain's craving for intermittent rewards, keeping users suspended in a state of perpetual anticipation. Rather than empowering human connection, ***this endless loop*** [**] breeds a subtle restlessness, where minutes dissolve into hours of mindless consumption. While tech executives often dismiss excessive screen time as a failure of personal willpower, critics argue that expecting individuals to resist algorithms calibrated by armies of behavioral scientists is not merely unrealistic—it is a ****cynical abdication of corporate responsibility**** [***].",
    "questions": [
      {
        "id": "nov08-q1",
        "skill": "Vocabulary in Context",
        "q": "The word \"metastasized\" [*] suggests that the infinite scroll has...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "spread uncontrollably and evolved into a harmful problem.", "correct": True, "trap": "Correct: Metastasize (figuratively from oncology) denotes rapid, invasive spread with destructive consequences." },
          { "letter": "B", "text": "improved steadily through user feedback and technical refinement.", "correct": False, "trap": "Positive Meaning Trap: Overlooks the overtly negative context of 'insidious traps'." },
          { "letter": "C", "text": "disappeared completely from modern mobile application interfaces.", "correct": False, "trap": "Opposite Trap: The passage states the feature is 'ubiquitous' (everywhere), not extinct." },
          { "letter": "D", "text": "been legally licensed to competing commercial organizations.", "correct": False, "trap": "Plausible Business Trap: Sounds corporate, but ignores the figurative meaning of toxic proliferation." }
        ],
        "examinerNote": "'Metastasized' [*] is paired with 'insidious psychological traps'. Figuratively, it highlights how a once-convenient design feature spread aggressively across apps and became deeply harmful."
      },
      {
        "id": "nov08-q2",
        "skill": "Reference & Deixis",
        "q": "The phrase \"this endless loop\" [**] refers to...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "software developers constantly rewriting algorithm code.", "correct": False, "trap": "Keyword Distractor: Mentions engineers/developers, but the text describes the user's consumption cycle." },
          { "letter": "B", "text": "users being kept in constant anticipation without natural stopping cues.", "correct": True, "trap": "Correct: Refers directly to the previous sentence: 'removing natural stopping cues... suspended in a state of perpetual anticipation'." },
          { "letter": "C", "text": "social media corporations hiring teams of behavioral scientists.", "correct": False, "trap": "Misplaced Detail: Scientists are mentioned later regarding algorithm calibration, not the loop itself." },
          { "letter": "D", "text": "individuals repeatedly attempting to delete their digital accounts.", "correct": False, "trap": "Unstated Real-World Assumption: A common modern anecdote, but entirely unsupported by the text." }
        ],
        "examinerNote": "The referent traces back to the preceding sentence: apps eliminate natural stopping cues, trapping the user's attention in a loop of perpetual anticipation."
      },
      {
        "id": "nov08-q3",
        "skill": "Argument & Contrast",
        "q": "How do tech executives and critics differ in their explanation of excessive screen time?",
        "options": [
          { "letter": "A", "text": "Executives blame technological bugs, while critics blame slow internet connections.", "correct": False, "trap": "Fabricated Detail: Neither bugs nor internet speed is mentioned in the paragraph." },
          { "letter": "B", "text": "Executives blame individual lack of discipline, whereas critics blame deliberate corporate design.", "correct": True, "trap": "Correct: Executives cite 'failure of personal willpower'; critics cite 'algorithms calibrated by armies of behavioral scientists'." },
          { "letter": "C", "text": "Executives admit their apps are addictive, whereas critics argue screen time is harmless.", "correct": False, "trap": "Direct Inversion Trap: Reverses the stance of both parties." },
          { "letter": "D", "text": "Executives focus on adolescent habits, whereas critics focus on workplace productivity.", "correct": False, "trap": "Out-of-Scope Trap: Age cohorts and workplace productivity are not contrasted in this text." }
        ],
        "examinerNote": "Executives view excessive screen time as 'a failure of personal willpower' (self-discipline), contrasted with critics who argue users face 'algorithms calibrated by armies of behavioral scientists' (deliberate corporate design)."
      },
      {
        "id": "nov08-q4",
        "skill": "Tone & Writer's Stance",
        "q": "In the phrase \"cynical abdication of corporate responsibility\" [***], the writer's attitude towards tech companies is...",
        "targetMarker": "[***]",
        "options": [
          { "letter": "A", "text": "enthusiastic and encouraging", "correct": False, "trap": "Direct Opposite: The vocabulary expresses severe disapproval, not encouragement." },
          { "letter": "B", "text": "sharply critical and accusatory", "correct": True, "trap": "Correct: Words like 'cynical' and 'abdication of corporate responsibility' convey strong moral condemnation." },
          { "letter": "C", "text": "cautiously optimistic", "correct": False, "trap": "Misleading Tone: No hope or positive resolution is offered regarding corporate self-regulation." },
          { "letter": "D", "text": "impartial and detached", "correct": False, "trap": "Neutrality Trap: The author takes an explicit moral stand against corporate evasion." }
        ],
        "examinerNote": "The diction in 'cynical abdication of corporate responsibility' [***] is unambiguous. The author explicitly condemns corporations for evading their moral duties."
      }
    ]
  },
  {
    "id": "2026-11-09",
    "date": "2026-11-09",
    "displayDate": "9 Nov 2026",
    "dayLabel": "9 Nov",
    "dayOfWeek": "Mon",
    "title": "The Phantom Cost of \"Free\" Online Returns",
    "theme": "Consumer Culture & Reverse Logistics",
    "source": "Adapted from The Guardian",
    "lexile": "1190L (DSE Part B2)",
    "text": "For millions of online consumers, the ubiquity of \"free returns\" has fundamentally altered purchasing psychology. Without financial liability, buyers routinely order multiple sizes of a single garment, converting their private residences into temporary fitting rooms. Yet environmental analysts warn that this seamless convenience conceals an ecological catastrophe. The prevailing consumer assumption is that returned inventory effortlessly returns to the sales floor. In reality, the complex logistics of assessing, repackaging, and sanitizing discounted apparel often exceed the cost of fabricating a new item. Consequently, millions of tons of returned garments are quietly routed to incinerators or distant landfills. By ***shielding shoppers from the genuine consequences of over-ordering*** [*], e-commerce giants have institutionalized waste, ensuring that true retail sustainability remains little more than an unfulfilled public relations **platitude** [**].",
    "questions": [
      {
        "id": "nov09-q1",
        "skill": "Vocabulary in Context",
        "q": "The word \"platitude\" [**] most closely means...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "an empty or overused statement that lacks sincerity.", "correct": True, "trap": "Correct: A platitude is a banal, clichéd remark made to sound meaningful without real substance." },
          { "letter": "B", "text": "a legally binding corporate commitment.", "correct": False, "trap": "Opposite Trap: The passage says it is 'unfulfilled' public relations, not a binding commitment." },
          { "letter": "C", "text": "a groundbreaking environmental innovation.", "correct": False, "trap": "Positive Connotation Trap: Contradicts the critical tone regarding PR spin." },
          { "letter": "D", "text": "a financial penalty imposed by government regulators.", "correct": False, "trap": "Contextual Mismatch: Companies use it in PR, so it cannot be a legal fine." }
        ],
        "examinerNote": "'Platitude' [**] is modified by 'unfulfilled public relations' and contrasted with 'true retail sustainability'. The author implies corporate sustainability claims are hollow slogans."
      },
      {
        "id": "nov09-q2",
        "skill": "Inference & Cause-and-Effect",
        "q": "According to the passage, returned clothes are frequently destroyed because...",
        "options": [
          { "letter": "A", "text": "shoppers inflict severe structural damage on garments before returning them.", "correct": False, "trap": "Unwarranted Assumption: The text does not claim customers destroy the clothes." },
          { "letter": "B", "text": "processing returns costs companies more than manufacturing brand-new stock.", "correct": True, "trap": "Correct: Directly stated: 'the complex logistics... often exceed the cost of fabricating a new item'." },
          { "letter": "C", "text": "international trade agreements strictly prohibit the resale of apparel.", "correct": False, "trap": "Fabricated Legal Trap: No such trade legislation is cited in the passage." },
          { "letter": "D", "text": "logistics warehouses are overwhelmed by sudden customs delays.", "correct": False, "trap": "Logistical Distractor: Plausible real-world issue, but unrelated to the economic rationale in the text." }
        ],
        "examinerNote": "The text states that assessing, repackaging, and sanitizing discounted apparel 'often exceed the cost of fabricating a new item'. Destruction is an economic decision driven by reverse-logistics overhead."
      },
      {
        "id": "nov09-q3",
        "skill": "Reference & Deixis",
        "q": "In the phrase \"shielding shoppers from the genuine consequences of over-ordering\" [*], the \"genuine consequences\" primarily refers to...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "the loss of customer loyalty suffered by high-street retailers.", "correct": False, "trap": "Wrong Subject: The text focuses on environmental waste, not traditional physical stores." },
          { "letter": "B", "text": "the financial bankruptcy of small domestic courier firms.", "correct": False, "trap": "Irrelevant Detail: Delivery companies' finances are not discussed." },
          { "letter": "C", "text": "the massive volume of unsold goods being dumped into landfills or burned.", "correct": True, "trap": "Correct: Connects directly with the preceding sentence: 'millions of tons of returned garments are quietly routed to incinerators or distant landfills'." },
          { "letter": "D", "text": "the introduction of mandatory restocking surcharges for consumers.", "correct": False, "trap": "Inversion Trap: The text states companies 'shield' shoppers from costs; surcharges are absent." }
        ],
        "examinerNote": "The text specifies that goods are routed to incinerators and landfills, immediately followed by 'By shielding shoppers from the genuine consequences...'. The consequence is environmental devastation."
      },
      {
        "id": "nov09-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The overall tone of the writer towards current e-commerce return practices is...",
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
    "id": "2026-11-10",
    "date": "2026-11-10",
    "displayDate": "10 Nov 2026",
    "dayLabel": "10 Nov",
    "dayOfWeek": "Tue",
    "title": "The Smart City Paradox: Efficiency vs Human Dignity",
    "theme": "Urban Technology & Surveillance",
    "source": "Adapted from Financial Times",
    "lexile": "1210L (DSE Part B2)",
    "text": "In the vision of contemporary urban planners, the \"smart city\" is an automated utopia. Ubiquitous sensors regulate traffic flows, optimize power distribution, and automate waste disposal, transforming chaotic metropolises into frictionless machines. Yet urban sociologists argue that this relentless obsession with computational efficiency neglects the messy, unquantifiable human dimensions of civic life. When streets are optimized solely for throughput and throughput alone, public squares lose their traditional function as unpredictable forums for social interaction. Furthermore, the pervasive infrastructure required to monitor urban activity establishes a regime of perpetual surveillance. Under the benign **pretext** [*] of civic convenience, citizens are gradually conditioned to accept continuous biometric tracking as the baseline of modern residency. The critical question is whether we are designing cities that nurture communal flourishing, or merely constructing ***technologically sophisticated enclosures*** [**] for passive inhabitants.",
    "questions": [
      {
        "id": "nov10-q1",
        "skill": "Vocabulary in Context",
        "q": "The word \"pretext\" [*] implies that \"civic convenience\" is...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "an insurmountable technical barrier to smart cities.", "correct": False, "trap": "Definition Mismatch: Pretext does not mean an obstacle or barrier." },
          { "letter": "B", "text": "an excuse used to conceal a more intrusive agenda.", "correct": True, "trap": "Correct: A pretext is a false or superficial reason put forward to hide the real purpose (mass biometric tracking)." },
          { "letter": "C", "text": "a universally acknowledged benefit celebrated by all sociologists.", "correct": False, "trap": "Extreme / Opposite Trap: Sociologists in the text are criticizing, not celebrating, this convenience." },
          { "letter": "D", "text": "a temporary financial subsidy offered by municipal councils.", "correct": False, "trap": "Literal Financial Trap: Conflates policy terminology with political excuse." }
        ],
        "examinerNote": "'Pretext' [*] indicates that 'civic convenience' is a cover or superficial justification used by authorities to normalize biometric surveillance."
      },
      {
        "id": "nov10-q2",
        "skill": "Inference & Subtext",
        "q": "What do sociologists believe is lost when public spaces are \"optimized solely for throughput\"?",
        "options": [
          { "letter": "A", "text": "The architectural structural integrity of surrounding skyscrapers.", "correct": False, "trap": "Physical Trap: The concern is social, not structural engineering." },
          { "letter": "B", "text": "The revenue generated by roadside commercial vendors.", "correct": False, "trap": "Economic Distractor: Commercial retail revenue is not the point of public forums in the text." },
          { "letter": "C", "text": "Spontaneous, unpredictable interpersonal exchanges between citizens.", "correct": True, "trap": "Correct: Directly paraphrases 'unpredictable forums for social interaction' and 'messy, unquantifiable human dimensions'." },
          { "letter": "D", "text": "The punctuality of high-speed public transit fleets.", "correct": False, "trap": "Opposite Meaning: Transit punctuality is improved by optimization, not lost." }
        ],
        "examinerNote": "The passage notes public squares lose their function as 'unpredictable forums for social interaction' when streets prioritize throughput. Sociologists value spontaneous civic encounters."
      },
      {
        "id": "nov10-q3",
        "skill": "Reference & Deixis",
        "q": "The phrase \"technologically sophisticated enclosures\" [**] refers metaphorically to...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "smart cities where residents are constantly monitored and deprived of civic spontaneity.", "correct": True, "trap": "Correct: Synthesizes the surveillance regime and loss of unpredictable civic life into the metaphor of an enclosure/cage." },
          { "letter": "B", "text": "automated laboratories where artificial intelligence models are tested.", "correct": False, "trap": "Literal Technical Trap: Confuses urban environments with scientific laboratories." },
          { "letter": "C", "text": "soundproof phone booths installed in pedestrian walkways.", "correct": False, "trap": "Literal Concrete Trap: Interprets 'enclosures' as physical small booths." },
          { "letter": "D", "text": "server farms housing government cloud infrastructure.", "correct": False, "trap": "Hardware Distractor: Server buildings house machines, not 'inhabitants'." }
        ],
        "examinerNote": "The final contrast poses 'communal flourishing' against 'technologically sophisticated enclosures for passive inhabitants' [**], characterizing over-monitored smart cities as gilded cages."
      },
      {
        "id": "nov10-q4",
        "skill": "Rhetorical Purpose",
        "q": "The writer concludes the passage with a question primarily to...",
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
    "id": "2026-11-11",
    "date": "2026-11-11",
    "displayDate": "11 Nov 2026",
    "dayLabel": "11 Nov",
    "dayOfWeek": "Wed",
    "title": "The Quiet Quitting Re-evaluation",
    "theme": "Modern Labor & Workplace Sociology",
    "source": "Adapted from BBC Worklife & The Economist",
    "lexile": "1180L (DSE Part B2)",
    "text": "When the phrase \"quiet quitting\" gained viral traction across social media, corporate executives swiftly branded it as a crisis of workplace laziness—a covert rebellion by disengaged employees who refuse to pull their weight. Yet organizational psychologists present a decidedly different diagnosis. Far from slacking off, the majority of self-described quiet quitters are simply completing their contracted duties while establishing clear boundaries against unpaid overtime and weekend communication. In an era where smartphones have obliterated the physical boundary between the office and the home, relentless hustle culture had effectively normalized chronic burnout. By declining to equate their self-worth with **institutional martyrdom** [*], these workers are not sabotaging their employers; they are recalibrating ***a toxic imbalance*** [**]. The dilemma for management is not how to coerce compliance, but whether corporate culture can accommodate workers who view employment as a professional contract rather than an all-consuming identity.",
    "questions": [
      {
        "id": "nov11-q1",
        "skill": "Vocabulary in Context",
        "q": "The phrase \"institutional martyrdom\" [*] refers to...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "sacrificing one's personal health and time for corporate demands.", "correct": True, "trap": "Correct: Martyrdom denotes self-sacrifice for a cause; here, sacrificing personal well-being for an employer." },
          { "letter": "B", "text": "filing a formal legal lawsuit against company mismanagement.", "correct": False, "trap": "Legal Trap: Has nothing to do with sacrificing one's personal time." },
          { "letter": "C", "text": "accepting a leadership position in a charity organization.", "correct": False, "trap": "Literal Institutional Trap: Confuses corporate employer with a non-profit institution." },
          { "letter": "D", "text": "undergoing compulsory safety training in a hazardous factory.", "correct": False, "trap": "Irrelevant Scenario: Not relevant to office overtime culture." }
        ],
        "examinerNote": "The author links 'declining to equate their self-worth with institutional martyrdom' [*] with resisting 'chronic burnout' and 'unpaid overtime', meaning excessive self-sacrifice for a firm."
      },
      {
        "id": "nov11-q2",
        "skill": "Inference & Author Stance",
        "q": "Which of the following would the writer most likely AGREE with regarding quiet quitters?",
        "options": [
          { "letter": "A", "text": "They are actively neglecting their core contractual obligations.", "correct": False, "trap": "Direct Textual Contradiction: Explicitly states they are 'simply completing their contracted duties'." },
          { "letter": "B", "text": "They are responding reasonably to years of uncompensated corporate encroachment.", "correct": True, "trap": "Correct: Argues workers are 'recalibrating a toxic imbalance' caused by smartphones and normalized burnout." },
          { "letter": "C", "text": "They should face immediate termination from forward-thinking firms.", "correct": False, "trap": "Executive Bias Trap: Aligns with the hostile executive view rejected by the author." },
          { "letter": "D", "text": "They are primarily motivated by a desire to damage company profitability.", "correct": False, "trap": "Misattribution: The text states 'they are not sabotaging their employers'." }
        ],
        "examinerNote": "The author explicitly sides with psychologists, depicting quiet quitting as a healthy boundary-setting reaction to invasive work culture rather than sabotage."
      },
      {
        "id": "nov11-q3",
        "skill": "Reference & Deixis",
        "q": "The phrase \"a toxic imbalance\" [**] refers to the imbalance between...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "senior executive bonuses and junior staff wages.", "correct": False, "trap": "Plausible Real-World Grievance: Pay inequality is real, but not the topic here." },
          { "letter": "B", "text": "demands for employee sacrifice and the boundaries of personal life.", "correct": True, "trap": "Correct: Captures the erosion between office and home, unpaid overtime, and burnout." },
          { "letter": "C", "text": "the number of male and female managers in executive suites.", "correct": False, "trap": "Gender Diversity Trap: Completely unmentioned in this passage." },
          { "letter": "D", "text": "remote working options and in-person office mandates.", "correct": False, "trap": "Remote Work Trap: While smartphones blurred lines, the imbalance is personal life vs work intrusion." }
        ],
        "examinerNote": "Smartphones 'obliterated the physical boundary between the office and the home' causing burnout. The toxic imbalance [**] is life swallowed by work."
      },
      {
        "id": "nov11-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards corporate executives who label quiet quitting as \"slacking off\" is...",
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
    "id": "2026-11-12",
    "date": "2026-11-12",
    "displayDate": "12 Nov 2026",
    "dayLabel": "12 Nov",
    "dayOfWeek": "Thu",
    "title": "The Vanishing Night: The Unseen Cost of Light Pollution",
    "theme": "Environmental Science & Human Biology",
    "source": "Adapted from National Geographic & Nature",
    "lexile": "1190L (DSE Part B2)",
    "text": "For almost all of evolutionary history, life on Earth unfolded in strict synchronization with the natural rhythm of day and night. In the brief span of a single century, however, humanity has waged an unthinking war against the dark. The rampant proliferation of artificial illumination—from ubiquitous LED streetlamps to luminous digital billboards—has effectively banished genuine night from modern human settlements. While lighted streets undoubtedly enhance urban safety, this **perpetual twilight** [*] carries severe biological repercussions. Ecologists warn that nocturnal ecosystems are unraveling: migratory birds are fatally disoriented by urban glares, while pollinating insects perish in droves around blazing fixtures. For humans, nocturnal light exposure disrupts the synthesis of melatonin, a critical hormone regulating cellular repair and circadian health. Light pollution is ***not merely an aesthetic nuisance for frustrated stargazers*** [**]; it is an insidious environmental disruptor that threatens both ecological stability and human physiological resilience.",
    "questions": [
      {
        "id": "nov12-q1",
        "skill": "Vocabulary in Context",
        "q": "The phrase \"perpetual twilight\" [*] describes...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "a rare natural atmospheric phenomenon occurring only at high latitudes.", "correct": False, "trap": "Literal Science Trap: Confuses artificial light pollution with polar midnight sun." },
          { "letter": "B", "text": "an artificial state of constant semi-darkness caused by excessive city lighting.", "correct": True, "trap": "Correct: Captures the human-made condition where genuine darkness is permanently replaced by dim illumination." },
          { "letter": "C", "text": "an electrical blackout that disables city streetlamps.", "correct": False, "trap": "Opposite Trap: Twilight here is caused by lights remaining on, not going off." },
          { "letter": "D", "text": "the gradual dimming of astronomical telescope lenses over time.", "correct": False, "trap": "Astronomy Distractor: While stargazers are mentioned later, twilight refers to city ambient glow." }
        ],
        "examinerNote": "Artificial lights have 'banished genuine night', replacing true darkness with an unending artificial glow ('perpetual twilight' [*])."
      },
      {
        "id": "nov12-q2",
        "skill": "Inference & Main Idea",
        "q": "Why does the writer mention \"frustrated stargazers\" [**]?",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "To praise their scientific contributions to modern space exploration.", "correct": False, "trap": "Irrelevant Commendation: Space exploration achievements are not discussed." },
          { "letter": "B", "text": "To argue that astronomers are the only group harmed by urban lighting.", "correct": False, "trap": "DSE Extreme Trap: Notice 'only group'—the text explicitly says it is NOT merely their nuisance." },
          { "letter": "C", "text": "To contrast a minor inconvenience with the much graver biological dangers of light pollution.", "correct": True, "trap": "Correct: 'Light pollution is not merely an aesthetic nuisance for frustrated stargazers; it is an insidious environmental disruptor'." },
          { "letter": "D", "text": "To demand that government funding be redirected to public observatories.", "correct": False, "trap": "Policy Distractor: Observatory funding is completely outside the scope of the passage." }
        ],
        "examinerNote": "The construction 'not merely X... but Y' contrasts a trivial aesthetic complaint [**] with severe physiological and ecological harm."
      },
      {
        "id": "nov12-q3",
        "skill": "Specific Detail & Cause-and-Effect",
        "q": "According to the passage, nocturnal light pollution harms humans biologically by...",
        "options": [
          { "letter": "A", "text": "damaging optical retinas through direct exposure to laser billboards.", "correct": False, "trap": "Exaggerated Eye Damage: Laser retina burns are never mentioned; hormone disruption is." },
          { "letter": "B", "text": "impairing the body's natural production of melatonin.", "correct": True, "trap": "Correct: Directly stated: 'disrupts the synthesis of melatonin, a critical hormone'." },
          { "letter": "C", "text": "eliminating the food supply produced by insect-eating birds.", "correct": False, "trap": "Ecosystem Confusion: Bird deaths impact ecology, but human physiological damage is hormonal." },
          { "letter": "D", "text": "inducing severe daytime heat exhaustion in metropolitan areas.", "correct": False, "trap": "Thermal Distortion: Confuses light pollution with the urban heat island effect." }
        ],
        "examinerNote": "The text explicitly connects nocturnal light exposure in humans to disrupted 'synthesis of melatonin, a critical hormone regulating cellular repair and circadian health'."
      },
      {
        "id": "nov12-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's stance on artificial illumination in urban spaces can best be characterized as...",
        "options": [
          { "letter": "A", "text": "wholly unconcerned about animal extinction.", "correct": False, "trap": "Direct Contradiction: The author highlights birds and insects dying in droves." },
          { "letter": "B", "text": "acknowledging its public safety utility while urging awareness of its severe ecological hazards.", "correct": True, "trap": "Correct: Balanced DSE Part B2 stance: 'While lighted streets undoubtedly enhance urban safety, this perpetual twilight carries severe biological repercussions'." },
          { "letter": "C", "text": "demanding the immediate shutoff of all urban electrical power grids.", "correct": False, "trap": "Extreme Abolition Trap: The author does not demand total blackout or grid shutdown." },
          { "letter": "D", "text": "optimistic that modern LEDs will soon eliminate biological harm.", "correct": False, "trap": "Misplaced Optimism: LED lamps are explicitly listed as a key contributor to the problem." }
        ],
        "examinerNote": "Notice the concession ('While lighted streets undoubtedly enhance urban safety...'), followed by urgent warnings of biological damage. This demonstrates a nuanced, cautionary stance."
      }
    ]
  },
  {
    "id": "2026-11-13",
    "date": "2026-11-13",
    "displayDate": "13 Nov 2026",
    "dayLabel": "13 Nov",
    "dayOfWeek": "Fri",
    "title": "Algorithmic Monoculture: The Death of Cultural Discovery",
    "theme": "Media & Artificial Intelligence",
    "source": "Adapted from The New Yorker & Wired",
    "lexile": "1210L (DSE Part B2)",
    "text": "Streaming platforms once promised an unprecedented golden age of cultural democracy, granting ordinary listeners instantaneous access to every recorded sound in human history. In practice, however, predictive recommendation engines have achieved ***precisely the inverse*** [*]. Governed by engagement algorithms designed to maximize platform retention, these systems shepherd vast global audiences into narrow, self-reinforcing stylistic corridors. Rather than exposing listeners to radical novelty, streaming models prioritize audio tracks engineered to function as ambient sonic wallpaper—unobtrusive, mid-tempo, and devoid of jarring artistic **idiosyncrasies** [**] that might provoke a user to skip. The consequence is an insidious musical monoculture, where regional genres are homogenized into algorithmic slurry. When cultural consumption is mediated solely by mathematical prediction, serendipity is strangled. We are left with an illusion of limitless choice that masks an increasingly standardized artistic landscape.",
    "questions": [
      {
        "id": "nov13-q1",
        "skill": "Vocabulary in Context",
        "q": "The word \"idiosyncrasies\" [**] most closely refers to...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "distinctive, peculiar stylistic characteristics.", "correct": True, "trap": "Correct: An idiosyncrasy is a distinctive or eccentric feature of a person or artwork." },
          { "letter": "B", "text": "sound recording errors caused by faulty microphones.", "correct": False, "trap": "Literal Technical Error: Confuses artistic distinctiveness with equipment failure." },
          { "letter": "C", "text": "marketing slogans printed on vinyl album covers.", "correct": False, "trap": "Commercial Trap: Completely unsuited to musical style." },
          { "letter": "D", "text": "copyright violations committed by amateur composers.", "correct": False, "trap": "Legal Trap: Conflates artistic individuality with intellectual property theft." }
        ],
        "examinerNote": "The text describes tracks devoid of 'jarring artistic idiosyncrasies [**] that might provoke a user to skip', meaning unique or unconventional creative quirks."
      },
      {
        "id": "nov13-q2",
        "skill": "Reference & Deixis",
        "q": "The phrase \"precisely the inverse\" [*] refers to...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "platforms becoming bankrupt instead of profitable.", "correct": False, "trap": "Financial Fallacy: Commercial profitability is not the contrast in the passage." },
          { "letter": "B", "text": "engines narrowing cultural exposure instead of broadening it.", "correct": True, "trap": "Correct: Reverses 'an unprecedented golden age of cultural democracy' with 'narrow, self-reinforcing stylistic corridors'." },
          { "letter": "C", "text": "musicians refusing to upload songs to digital streaming servers.", "correct": False, "trap": "Artist Boycott Distractor: The text discusses user consumption, not artist boycotts." },
          { "letter": "D", "text": "listeners deleting streaming applications from mobile smartphones.", "correct": False, "trap": "User Action Trap: The passage says users are retained, not leaving." }
        ],
        "examinerNote": "Streaming promised 'cultural democracy' (unlimited access to all music history), but engines did the opposite [*] by herding users into narrow corridors."
      },
      {
        "id": "nov13-q3",
        "skill": "Inference & Subtext",
        "q": "Why do streaming algorithms favour \"unobtrusive, mid-tempo\" tracks?",
        "options": [
          { "letter": "A", "text": "They consume far less bandwidth across cellular network towers.", "correct": False, "trap": "Technical Distortion: Bandwidth depends on file bitrate, not musical tempo." },
          { "letter": "B", "text": "They minimize the chance that a distracted user will change the track.", "correct": True, "trap": "Correct: Explicitly stated: they avoid anything that 'might provoke a user to skip', maximizing retention." },
          { "letter": "C", "text": "They are cheaper for streaming services to license from record labels.", "correct": False, "trap": "Licensing Assumption: Plausible in business, but unmentioned in the text." },
          { "letter": "D", "text": "They are exclusively produced by classical European symphony orchestras.", "correct": False, "trap": "Genre Trap: The text mentions 'algorithmic slurry', not European classical music." }
        ],
        "examinerNote": "The text links mid-tempo background tracks to avoiding 'jarring artistic idiosyncrasies that might provoke a user to skip', keeping users listening without interruption."
      },
      {
        "id": "nov13-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards the \"illusion of limitless choice\" is...",
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
    "id": "2026-11-14",
    "date": "2026-11-14",
    "displayDate": "14 Nov 2026",
    "dayLabel": "14 Nov",
    "dayOfWeek": "Sat",
    "title": "The Mirage of Carbon Offsets: Corporate Greenwashing",
    "theme": "Environmental Economics & Climate Policy",
    "source": "Adapted from The Guardian & Financial Times",
    "lexile": "1210L (DSE Part B2)",
    "text": "In the glitzy brochures of multinational corporations, achieving \"net-zero\" emissions is routinely depicted as a solved equation. By purchasing carbon offsets—investing in distant reforestation schemes or renewable energy grids—firms claim to neutralize their environmental footprint while altering almost nothing about their core operations. Yet independent climate audits reveal this lucrative market to be largely a statistical fiction. The vast majority of forest conservation credits are issued for woodlands that were never under genuine threat of deforestation, creating ***phantom reductions*** [*] on balance sheets. Rather than catalyzing structural decarbonization, offsets serve as an affordable **moral indulgence** [**], granting polluting enterprises a public relations license to expand emissions unabated. Until international regulatory frameworks mandate genuine, verifiable operational emission cuts, corporate net-zero pledges remain an elaborate exercise in commercial greenwashing.",
    "questions": [
      {
        "id": "nov14-q1",
        "skill": "Vocabulary in Context",
        "q": "The phrase \"moral indulgence\" [**] suggests that carbon offsets function like...",
        "targetMarker": "[**]",
        "options": [
          { "letter": "A", "text": "a fee paid to relieve guilt without demanding genuine behavioral sacrifice.", "correct": True, "trap": "Correct: Alluding to historical religious indulgences, it denotes paying money to pardon moral wrongdoing without changing one's sins." },
          { "letter": "B", "text": "a legally mandatory fine imposed by international environmental courts.", "correct": False, "trap": "Legal Distortion: The passage notes credits are voluntary PR mechanisms, not court fines." },
          { "letter": "C", "text": "a highly profitable investment that yields guaranteed dividend returns.", "correct": False, "trap": "Financial Trap: Focuses on monetary returns rather than ethical evasion." },
          { "letter": "D", "text": "a scientific technique for directly capturing carbon from the upper atmosphere.", "correct": False, "trap": "Technical Trap: Confuses an accounting metaphor with atmospheric engineering." }
        ],
        "examinerNote": "'Moral indulgence' [**] describes companies buying cheap offsets so they feel ethically justified to 'expand emissions unabated', evading real decarbonization."
      },
      {
        "id": "nov14-q2",
        "skill": "Reference & Deixis",
        "q": "The phrase \"phantom reductions\" [*] refers to...",
        "targetMarker": "[*]",
        "options": [
          { "letter": "A", "text": "emission decreases that appear on accounting ledgers but do not exist in the atmosphere.", "correct": True, "trap": "Correct: 'Phantom' means illusory; credits issued for forests that were never endangered count on paper but save zero real carbon." },
          { "letter": "B", "text": "unexplained power outages across industrial manufacturing zones.", "correct": False, "trap": "Irrelevant Scenario: Power blackouts are not referenced in the text." },
          { "letter": "C", "text": "the rapid cancellation of corporate air travel tickets.", "correct": False, "trap": "Corporate Anecdote: Air travel is unmentioned." },
          { "letter": "D", "text": "the physical disappearance of trees due to unexpected wildfires.", "correct": False, "trap": "Wildfire Distractor: The problem is paper accounting, not physical tree loss." }
        ],
        "examinerNote": "Credits issued for trees 'that were never under genuine threat of deforestation' produce 'phantom reductions [*] on balance sheets'—fake accounting figures."
      },
      {
        "id": "nov14-q3",
        "skill": "Inference & Subtext",
        "q": "What do independent audits imply about corporate net-zero campaigns?",
        "options": [
          { "letter": "A", "text": "They allow companies to continue polluting while projecting an eco-friendly image.", "correct": True, "trap": "Correct: Synthesizes: 'granting polluting enterprises a public relations license to expand emissions unabated'." },
          { "letter": "B", "text": "They have successfully eliminated global greenhouse gas emissions ahead of schedule.", "correct": False, "trap": "Extreme Positive Trap: Contradicts the entire critical thrust of the passage." },
          { "letter": "C", "text": "They cost so much money that multinational corporations are facing bankruptcy.", "correct": False, "trap": "Economic Inversion Trap: The text explicitly describes offsets as 'an affordable moral indulgence'." },
          { "letter": "D", "text": "They are exclusively organized and funded by non-profit charities.", "correct": False, "trap": "Charity Trap: The text focuses on corporate purchasing to protect balance sheets." }
        ],
        "examinerNote": "The text explains offsets grant companies 'a public relations license to expand emissions unabated'—permitting real pollution under the cover of green marketing."
      },
      {
        "id": "nov14-q4",
        "skill": "Tone & Writer's Stance",
        "q": "The writer's attitude towards the carbon offset market can best be described as...",
        "options": [
          { "letter": "A", "text": "skeptical and demanding accountability", "correct": True, "trap": "Correct: Characterizing pledges as 'an elaborate exercise in commercial greenwashing' and insisting on 'genuine, verifiable' cuts shows sharp skepticism." },
          { "letter": "B", "text": "apologetic on behalf of corporations", "correct": False, "trap": "Opposite Stance: The author attacks, not defends, corporate pledges." },
          { "letter": "C", "text": "mildly bewildered by accounting terminology", "correct": False, "trap": "Ignorance Trap: The author demonstrates command of offset accounting." },
          { "letter": "D", "text": "celebratory of corporate voluntary self-policing", "correct": False, "trap": "Stance Reversal: The author explicitly demands mandatory regulation instead of voluntary pledges." }
        ],
        "examinerNote": "Concluding with 'commercial greenwashing' and calling for mandatory international frameworks indicates deep skepticism of voluntary corporate claims and a demand for rigorous accountability."
      }
    ]
  }
]

js_content = f"""/* ===================================================================
   LexiQuest - HKDSE Daily Reading Oracle Dataset
   Starts strictly from 7 Nov 2026 onwards (No earlier dates).
   No line numbers: clean formatted paragraphs with bold / asterisk markers.
   Calibrated strictly to HKDSE English Paper 1 Part B2 Standard (~1180L-1220L)
   =================================================================== */

const DSE_READING_DATA = {json.dumps(PASSAGES, indent=2)};

if (typeof module !== "undefined" && module.exports) {{
  module.exports = {{ DSE_READING_DATA }};
}}
"""

with open('/Users/kelvinluimacbookair/.gemini/antigravity-ide/scratch/vocab-game/data/dse_reading.js', 'w') as f:
  f.write(js_content)

print(f"Generated clean calendar passages starting from 7 Nov 2026! Total: {len(PASSAGES)}")

