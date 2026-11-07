/* ===================================================================
   LexiQuest - HKDSE Daily Reading Oracle Dataset
   Calibrated strictly to HKDSE English Paper 1 Part B2 Standard (~1180L-1220L)
   Adapted from The Economist, The Guardian, The Atlantic, Financial Times & BBC.
   Includes Line Numbers, Core DSE Question Typologies & HKEAA Distractor Traps.
   =================================================================== */

const DSE_READING_DATA = [
  {
    id: "day-1",
    day: 1,
    title: "The Architecture of Digital Distraction",
    theme: "Digital Culture & Behavioral Psychology",
    source: "Adapted from The Guardian & The Atlantic",
    lexile: "1200L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "d1-q1",
        skill: "Vocabulary in Context",
        q: "In line 4, the word \"metastasized\" suggests that the infinite scroll has...",
        targetLines: [3, 4],
        options: [
          { letter: "A", text: "spread uncontrollably and evolved into a harmful problem.", correct: true, trap: "Correct: Metastasize (figuratively from oncology) denotes rapid, invasive spread with destructive consequences." },
          { letter: "B", text: "improved steadily through user feedback and technical refinement.", correct: false, trap: "Positive Meaning Trap: Overlooks the overtly negative context of 'insidious traps'." },
          { letter: "C", text: "disappeared completely from modern mobile application interfaces.", correct: false, trap: "Opposite Trap: The passage states the feature is 'ubiquitous' (everywhere), not extinct." },
          { letter: "D", text: "been legally licensed to competing commercial organizations.", correct: false, trap: "Plausible Business Trap: Sounds corporate, but ignores the figurative meaning of toxic proliferation." }
        ],
        examinerNote: "Line 4 pairs 'metastasized' with 'insidious psychological traps'. While the medical term refers to malignant cells spreading, here it highlights how a once-convenient design feature spread aggressively across apps and became deeply harmful."
      },
      {
        id: "d1-q2",
        skill: "Reference & Deixis",
        q: "In lines 7–8, \"this endless loop\" refers to...",
        targetLines: [5, 6, 7, 8],
        options: [
          { letter: "A", text: "software developers constantly rewriting algorithm code.", correct: false, trap: "Keyword Distractor: Mentions engineers/developers, but the text describes the user's consumption cycle." },
          { letter: "B", text: "users being kept in constant anticipation without natural stopping cues.", correct: true, trap: "Correct: Traces back to lines 5-7: 'removing natural stopping cues... suspended in a state of perpetual anticipation'." },
          { letter: "C", text: "social media corporations hiring teams of behavioral scientists.", correct: false, trap: "Misplaced Detail: Scientists are mentioned in line 11 regarding algorithm calibration, not the loop itself." },
          { letter: "D", text: "individuals repeatedly attempting to delete their digital accounts.", correct: false, trap: "Unstated Real-World Assumption: A common modern anecdote, but entirely unsupported by the text." }
        ],
        examinerNote: "Trace the referent backward from lines 7-8 to the preceding clause in lines 5-7. The 'loop' is created when apps eliminate natural stopping cues, trapping the user's attention in perpetual anticipation."
      },
      {
        id: "d1-q3",
        skill: "Argument & Contrast",
        q: "According to lines 9–12, how do tech executives and critics differ in their explanation of excessive screen time?",
        targetLines: [9, 10, 11, 12],
        options: [
          { letter: "A", text: "Executives blame technological bugs, while critics blame slow internet connections.", correct: false, trap: "Fabricated Detail: Neither bugs nor internet speed is mentioned in the paragraph." },
          { letter: "B", text: "Executives blame individual lack of discipline, whereas critics blame deliberate corporate design.", correct: true, trap: "Correct: Executives cite 'failure of personal willpower'; critics cite 'algorithms calibrated by armies of behavioral scientists'." },
          { letter: "C", text: "Executives admit their apps are addictive, whereas critics argue screen time is harmless.", correct: false, trap: "Direct Inversion Trap: Reverses the stance of both parties." },
          { letter: "D", text: "Executives focus on adolescent habits, whereas critics focus on workplace productivity.", correct: false, trap: "Out-of-Scope Trap: Age cohorts and workplace productivity are not contrasted in lines 9-12." }
        ],
        examinerNote: "Lines 9-10 state executives view it as 'a failure of personal willpower' (self-discipline), contrasted with critics who argue users face 'algorithms calibrated by armies of behavioral scientists' (intentional corporate design)."
      },
      {
        id: "d1-q4",
        skill: "Tone & Writer's Stance",
        q: "In the final sentence (lines 11–12), the writer's attitude towards tech companies is best described as...",
        targetLines: [11, 12],
        options: [
          { letter: "A", text: "enthusiastic and encouraging", correct: false, trap: "Direct Opposite: The vocabulary expresses severe disapproval, not encouragement." },
          { letter: "B", text: "sharply critical and accusatory", correct: true, trap: "Correct: Words like 'unrealistic', 'cynical', and 'abdication of corporate responsibility' convey strong moral condemnation." },
          { letter: "C", text: "cautiously optimistic", correct: false, trap: "Misleading Tone: No hope or positive resolution is offered regarding corporate self-regulation." },
          { letter: "D", text: "impartial and detached", correct: false, trap: "Neutrality Trap: The author takes an explicit, impassioned moral stand against corporate evasion." }
        ],
        examinerNote: "The diction in lines 11-12 ('cynical abdication of corporate responsibility') is unambiguous. The author explicitly condemns corporations for evading their moral duties."
      }
    ]
  },
  {
    id: "day-2",
    day: 2,
    title: "The Phantom Cost of \"Free\" Online Returns",
    theme: "Consumer Culture & Reverse Logistics",
    source: "Adapted from The Guardian",
    lexile: "1190L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "d2-q1",
        skill: "Vocabulary in Context",
        q: "In line 12, the word \"platitude\" most closely means...",
        targetLines: [10, 11, 12],
        options: [
          { letter: "A", text: "an empty or overused statement that lacks sincerity.", correct: true, trap: "Correct: A platitude is a banal, clichéd moral remark made to sound meaningful without practical action." },
          { letter: "B", text: "a legally binding corporate commitment.", correct: false, trap: "Opposite Trap: The passage says it is 'unfulfilled' public relations, not a binding policy." },
          { letter: "C", text: "a groundbreaking environmental innovation.", correct: false, trap: "Positive Connotation Trap: Contradicts the critical tone regarding PR spin." },
          { letter: "D", text: "a financial penalty imposed by regulators.", correct: false, trap: "Contextual Mismatch: Companies use it in PR, so it cannot be an external legal fine." }
        ],
        examinerNote: "In line 12, 'platitude' is modified by 'unfulfilled public relations' and contrasted with 'true retail sustainability'. The author implies corporate sustainability claims are hollow slogans."
      },
      {
        id: "d2-q2",
        skill: "Inference & Cause-and-Effect",
        q: "According to lines 6–8, returned clothes are frequently destroyed because...",
        targetLines: [6, 7, 8],
        options: [
          { letter: "A", text: "shoppers inflict severe structural damage on garments before returning them.", correct: false, trap: "Unwarranted Assumption: The text does not claim customers destroy the clothes." },
          { letter: "B", text: "processing returns costs companies more than manufacturing brand-new stock.", correct: true, trap: "Correct: Directly stated in lines 6-8: 'the complex logistics... often exceed the cost of fabricating a new item'." },
          { letter: "C", text: "international trade agreements strictly prohibit the resale of apparel.", correct: false, trap: "Fabricated Legal Trap: No such trade legislation is cited in the passage." },
          { letter: "D", text: "warehouses are overwhelmed by sudden customs delays.", correct: false, trap: "Logistical Distractor: Plausible real-world issue, but unrelated to the economic rationale in the text." }
        ],
        examinerNote: "Lines 6-8 state that assessing, repackaging, and sanitizing discounted apparel 'often exceed the cost of fabricating a new item'. Destruction is an economic decision driven by reverse-logistics overhead."
      },
      {
        id: "d2-q3",
        skill: "Reference & Deixis",
        q: "In lines 9–10, \"the genuine consequences of over-ordering\" primarily refers to...",
        targetLines: [8, 9, 10],
        options: [
          { letter: "A", text: "the loss of customer loyalty suffered by high-street retailers.", correct: false, trap: "Wrong Subject: The text focuses on environmental waste, not traditional physical stores." },
          { letter: "B", text: "the financial bankruptcy of small domestic courier firms.", correct: false, trap: "Irrelevant Detail: Delivery companies' finances are not discussed." },
          { letter: "C", text: "the massive volume of unsold goods being dumped or burned.", correct: true, trap: "Correct: Follows immediately from lines 8-9: 'millions of tons of returned garments are quietly routed to incinerators or distant landfills'." },
          { letter: "D", text: "the introduction of mandatory restocking surcharges for consumers.", correct: false, trap: "Inversion Trap: The text states companies 'shield' shoppers from costs; surcharges are absent." }
        ],
        examinerNote: "Lines 8-9 specify that goods are routed to incinerators and landfills; line 9 connects this to 'By shielding shoppers from the genuine consequences...'. The consequence is environmental devastation."
      },
      {
        id: "d2-q4",
        skill: "Tone & Writer's Stance",
        q: "The overall tone of the writer towards current e-commerce return practices is...",
        targetLines: [9, 10, 11, 12],
        options: [
          { letter: "A", text: "indignant and skeptical", correct: true, trap: "Correct: Words like 'conceals an ecological catastrophe', 'institutionalized waste', and 'PR platitude' show deep concern and disbelief in corporate claims." },
          { letter: "B", text: "nonchalant and amused", correct: false, trap: "Wrong Emotional Register: The topic is treated with serious environmental gravity." },
          { letter: "C", text: "sympathetic to retail retailers", correct: false, trap: "Opposite Stance: Retail giants are accused of creating institutionalized waste." },
          { letter: "D", text: "hesitant and uncertain", correct: false, trap: "Degree Trap: The author writes with firm assertiveness, not hesitation." }
        ],
        examinerNote: "The author deploys heavy evaluative terms ('catastrophe', 'quietly dumped', 'institutionalized waste', 'platitude'), reflecting moral indignation at the environmental cost and skepticism of corporate PR."
      }
    ]
  },
  {
    id: "day-3",
    day: 3,
    title: "The Smart City Paradox: Efficiency vs Human Dignity",
    theme: "Urban Technology & Surveillance",
    source: "Adapted from Financial Times",
    lexile: "1210L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "d3-q1",
        skill: "Vocabulary in Context",
        q: "In line 9, the word \"pretext\" implies that \"civic convenience\" is...",
        targetLines: [8, 9, 10],
        options: [
          { letter: "A", text: "an insurmountable technical barrier to smart cities.", correct: false, trap: "Definition Mismatch: Pretext does not mean an obstacle or barrier." },
          { letter: "B", text: "an excuse used to conceal a more intrusive agenda.", correct: true, trap: "Correct: A pretext is a false or superficial reason put forward to hide the real purpose (in this case, mass biometric monitoring)." },
          { letter: "C", text: "a universally acknowledged benefit celebrated by all sociologists.", correct: false, trap: "Extreme / Opposite Trap: Sociologists in the text are criticizing, not celebrating, this convenience." },
          { letter: "D", text: "a temporary financial subsidy offered by municipal councils.", correct: false, trap: "Literal Financial Trap: Conflates policy terminology with political excuse." }
        ],
        examinerNote: "In line 9, 'pretext' indicates that 'civic convenience' is a cover or superficial justification used by authorities to normalize biometric surveillance."
      },
      {
        id: "d3-q2",
        skill: "Inference & Subtext",
        q: "In lines 5–7, what do sociologists believe is lost when public spaces are \"optimized solely for throughput\"?",
        targetLines: [5, 6, 7],
        options: [
          { letter: "A", text: "The architectural structural integrity of surrounding skyscrapers.", correct: false, trap: "Physical Trap: The concern is social, not structural engineering." },
          { letter: "B", text: "The revenue generated by roadside commercial vendors.", correct: false, trap: "Economic Distractor: Commercial retail revenue is not the point of public forums in line 7." },
          { letter: "C", text: "Spontaneous, unpredictable interpersonal exchanges between citizens.", correct: true, trap: "Correct: Directly paraphrases 'unpredictable forums for social interaction' and 'messy, unquantifiable human dimensions'." },
          { letter: "D", text: "The punctuality of high-speed public transit fleets.", correct: false, trap: "Opposite Meaning: Transit punctuality is improved by optimization, not lost." }
        ],
        examinerNote: "Line 6-7 states public squares lose their function as 'unpredictable forums for social interaction' when streets prioritize throughput. Sociologists value spontaneous civic encounters."
      },
      {
        id: "d3-q3",
        skill: "Reference & Deixis",
        q: "In lines 11–12, \"technologically sophisticated enclosures\" refers metaphorically to...",
        targetLines: [10, 11, 12],
        options: [
          { letter: "A", text: "smart cities where residents are constantly monitored and deprived of civic spontaneity.", correct: true, trap: "Correct: Synthesizes the surveillance regime and loss of unpredictable civic life into the metaphor of an enclosure/cage." },
          { letter: "B", text: "automated laboratories where artificial intelligence models are tested.", correct: false, trap: "Literal Technical Trap: Confuses urban environments with scientific laboratories." },
          { letter: "C", text: "soundproof phone booths installed in pedestrian walkways.", correct: false, trap: "Literal Concrete Trap: Interprets 'enclosures' as physical small booths." },
          { letter: "D", text: "server farms housing government cloud infrastructure.", correct: false, trap: "Hardware Distractor: Server buildings house machines, not 'inhabitants'." }
        ],
        examinerNote: "The final contrast poses 'communal flourishing' against 'technologically sophisticated enclosures for passive inhabitants', characterizing over-monitored smart cities as gilded cages."
      },
      {
        id: "d3-q4",
        skill: "Rhetorical Purpose",
        q: "The writer concludes the passage with a question in lines 10–12 primarily to...",
        targetLines: [10, 11, 12],
        options: [
          { letter: "A", text: "admit ignorance regarding how sensor networks operate in practice.", correct: false, trap: "False Modesty Trap: The author clearly understands smart city mechanisms." },
          { letter: "B", text: "urge readers to critically assess the human cost of modern urban automation.", correct: true, trap: "Correct: The rhetorical question forces the reader to confront whether convenience justifies loss of freedom." },
          { letter: "C", text: "demand an immediate increase in municipal funding for surveillance technology.", correct: false, trap: "Stance Reversal: The author expresses caution about surveillance, not a demand for more." },
          { letter: "D", text: "advise municipal planners to abolish all traffic management systems.", correct: false, trap: "DSE Extreme Trap: The passage questions excessive surveillance, not basic traffic safety." }
        ],
        examinerNote: "Rhetorical concluding questions in DSE Part B2 texts challenge the reader to reconsider conventional assumptions—here, confronting whether smart cities dehumanize their inhabitants."
      }
    ]
  },
  {
    id: "day-4",
    day: 4,
    title: "The Quiet Quitting Re-evaluation",
    theme: "Modern Labor & Workplace Sociology",
    source: "Adapted from BBC Worklife & The Economist",
    lexile: "1180L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "d4-q1",
        skill: "Vocabulary in Context",
        q: "In line 9, the phrase \"institutional martyrdom\" refers to...",
        targetLines: [8, 9, 10],
        options: [
          { letter: "A", text: "sacrificing one's personal health and time for corporate demands.", correct: true, trap: "Correct: Martyrdom denotes self-sacrifice for a cause; here, sacrificing personal well-being for an employer." },
          { letter: "B", text: "filing a formal legal lawsuit against company mismanagement.", correct: false, trap: "Legal Trap: Has nothing to do with sacrificing one's personal time." },
          { letter: "C", text: "accepting a leadership position in a charity organization.", correct: false, trap: "Literal Institutional Trap: Confuses corporate employer with a non-profit institution." },
          { letter: "D", text: "undergoing compulsory safety training in a hazardous factory.", correct: false, trap: "Irrelevant Scenario: Not relevant to office overtime culture." }
        ],
        examinerNote: "In lines 8-9, the author links 'declining to equate their self-worth with institutional martyrdom' with resisting 'chronic burnout' and 'unpaid overtime', meaning excessive self-sacrifice for a firm."
      },
      {
        id: "d4-q2",
        skill: "Inference & Author Stance",
        q: "Which of the following would the writer most likely AGREE with regarding quiet quitters?",
        targetLines: [3, 4, 5, 9, 10],
        options: [
          { letter: "A", text: "They are actively neglecting their core contractual obligations.", correct: false, trap: "Direct Textual Contradiction: Line 5 explicitly states they are 'simply completing their contracted duties'." },
          { letter: "B", text: "They are responding reasonably to years of uncompensated corporate encroachment.", correct: true, trap: "Correct: Lines 7-10 argue workers are 'recalibrating a toxic imbalance' caused by smartphones and normalized burnout." },
          { letter: "C", text: "They should face immediate termination from forward-thinking firms.", correct: false, trap: "Executive Bias Trap: Aligns with the hostile executive view rejected by the author." },
          { letter: "D", text: "They are primarily motivated by a desire to damage company profitability.", correct: false, trap: "Misattribution: Line 9 states 'they are not sabotaging their employers'." }
        ],
        examinerNote: "The author explicitly sides with psychologists (lines 3-10), depicting quiet quitting as a healthy boundary-setting reaction to invasive work culture rather than sabotage."
      },
      {
        id: "d4-q3",
        skill: "Reference & Deixis",
        q: "In line 10, \"a toxic imbalance\" refers to the imbalance between...",
        targetLines: [6, 7, 8, 9, 10],
        options: [
          { letter: "A", text: "senior executive bonuses and junior staff wages.", correct: false, trap: "Plausible Real-World Grievance: Pay inequality is real, but not the topic of lines 6-10." },
          { letter: "B", text: "demands for employee sacrifice and the boundaries of personal life.", correct: true, trap: "Correct: Captures the erosion between office and home, unpaid overtime, and burnout." },
          { letter: "C", text: "the number of male and female managers in executive suites.", correct: false, trap: "Gender Diversity Trap: Completely unmentioned in this passage." },
          { letter: "D", text: "remote working options and in-person office mandates.", correct: false, trap: "Remote Work Trap: While smartphones blurred lines, the imbalance is personal life vs work intrusion." }
        ],
        examinerNote: "Trace the context of lines 6-10: smartphones 'obliterated the physical boundary between the office and the home' causing burnout. The toxic imbalance is life swallowed by work."
      },
      {
        id: "d4-q4",
        skill: "Tone & Writer's Stance",
        q: "The writer's attitude towards corporate executives who label quiet quitting as \"slacking off\" is...",
        targetLines: [1, 2, 3, 10, 11],
        options: [
          { letter: "A", text: "dismissive of their simplistic diagnosis.", correct: true, trap: "Correct: The author counters executive claims ('Far from slacking off... decidedly different diagnosis') and reframes the real management dilemma." },
          { letter: "B", text: "wholly supportive of their disciplinary measures.", correct: false, trap: "Opposite Trap: The author explicitly rejects coercive compliance." },
          { letter: "C", text: "uncertain about which side has stronger empirical data.", correct: false, trap: "Ambivalence Trap: The author takes a clear stand with psychologists, not an ambivalent one." },
          { letter: "D", text: "indifferent to labor relations altogether.", correct: false, trap: "Neutrality Trap: The text engages deeply with the sociology of work." }
        ],
        examinerNote: "The author directly rejects the executive narrative ('swiftly branded it as a crisis of workplace laziness... Far from slacking off') and urges management to self-reflect."
      }
    ]
  },
  {
    id: "day-5",
    day: 5,
    title: "The Vanishing Night: The Unseen Cost of Light Pollution",
    theme: "Environmental Science & Human Biology",
    source: "Adapted from National Geographic & Nature",
    lexile: "1190L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "d5-q1",
        skill: "Vocabulary in Context",
        q: "In line 6, \"perpetual twilight\" describes...",
        targetLines: [4, 5, 6],
        options: [
          { letter: "A", text: "a rare natural atmospheric phenomenon occurring only at high latitudes.", correct: false, trap: "Literal Science Trap: Confuses artificial light pollution with polar midnight sun." },
          { letter: "B", text: "an artificial state of constant semi-darkness caused by excessive city lighting.", correct: true, trap: "Correct: Captures the human-made condition where genuine darkness is permanently replaced by dim illumination." },
          { letter: "C", text: "an electrical blackout that disables city streetlamps.", correct: false, trap: "Opposite Trap: Twilight here is caused by lights remaining on, not going off." },
          { letter: "D", text: "the gradual dimming of astronomical telescope lenses over time.", correct: false, trap: "Astronomy Distractor: While stargazers are mentioned later, twilight refers to city ambient glow." }
        ],
        examinerNote: "Line 5-6 states artificial lights have 'banished genuine night', replacing true darkness with an unending artificial glow ('perpetual twilight')."
      },
      {
        id: "d5-q2",
        skill: "Inference & Main Idea",
        q: "According to lines 10–12, why does the writer mention \"frustrated stargazers\"?",
        targetLines: [10, 11, 12],
        options: [
          { letter: "A", text: "To praise their scientific contributions to modern space exploration.", correct: false, trap: "Irrelevant Commendation: Space exploration achievements are not discussed." },
          { letter: "B", text: "To argue that astronomers are the only group harmed by urban lighting.", correct: false, trap: "DSE Extreme Trap: Notice 'only group'—the text explicitly says it is NOT merely their nuisance." },
          { letter: "C", text: "To contrast a minor inconvenience with the much graver biological dangers of light pollution.", correct: true, trap: "Correct: 'Light pollution is not merely an aesthetic nuisance for frustrated stargazers; it is an insidious environmental disruptor'." },
          { letter: "D", text: "To demand that government funding be redirected to public observatories.", correct: false, trap: "Policy Distractor: Observatory funding is completely outside the scope of the passage." }
        ],
        examinerNote: "The construction 'not merely X... but Y' is a staple DSE rhetorical pattern used to contrast a trivial aesthetic complaint with severe physiological and ecological harm."
      },
      {
        id: "d5-q3",
        skill: "Specific Detail & Cause-and-Effect",
        q: "According to the passage, nocturnal light pollution harms humans biologically by...",
        targetLines: [8, 9, 10],
        options: [
          { letter: "A", text: "damaging optical retinas through direct exposure to laser billboards.", correct: false, trap: "Exaggerated Eye Damage: Laser retina burns are never mentioned; hormone disruption is." },
          { letter: "B", text: "impairing the body's natural production of melatonin.", correct: true, trap: "Correct: Directly stated in lines 9-10: 'disrupts the synthesis of melatonin, a critical hormone'." },
          { letter: "C", text: "eliminating the food supply produced by insect-eating birds.", correct: false, trap: "Ecosystem Confusion: Bird deaths impact ecology, but human physiological damage is hormonal." },
          { letter: "D", text: "inducing severe daytime heat exhaustion in metropolitan areas.", correct: false, trap: "Thermal Distortion: Confuses light pollution with the urban heat island effect." }
        ],
        examinerNote: "Lines 9-10 explicitly connect nocturnal light exposure in humans to disrupted 'synthesis of melatonin, a critical hormone regulating cellular repair and circadian health'."
      },
      {
        id: "d5-q4",
        skill: "Tone & Writer's Stance",
        q: "The writer's stance on artificial illumination in urban spaces can best be characterized as...",
        targetLines: [5, 6, 11, 12],
        options: [
          { letter: "A", text: "wholly unconcerned about animal extinction.", correct: false, trap: "Direct Contradiction: The author highlights birds and insects dying in droves." },
          { letter: "B", text: "acknowledging its public safety utility while urging awareness of its severe ecological hazards.", correct: true, trap: "Correct: Balanced DSE Part B2 stance: 'While lighted streets undoubtedly enhance urban safety, this perpetual twilight carries severe biological repercussions'." },
          { letter: "C", text: "demanding the immediate shutoff of all urban electrical power grids.", correct: false, trap: "Extreme Abolition Trap: The author does not demand total blackout or grid shutdown." },
          { letter: "D", text: "optimistic that modern LEDs will soon eliminate biological harm.", correct: false, trap: "Misplaced Optimism: Line 4 explicitly lists LED lamps as a key contributor to the problem." }
        ],
        examinerNote: "Notice the concession in line 5-6 ('While lighted streets undoubtedly enhance urban safety...'), followed by urgent warnings of biological damage. This demonstrates a nuanced, cautionary stance."
      }
    ]
  },
  {
    id: "day-6",
    day: 6,
    title: "Algorithmic Monoculture: The Death of Cultural Discovery",
    theme: "Media & Artificial Intelligence",
    source: "Adapted from The New Yorker & Wired",
    lexile: "1210L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "d6-q1",
        skill: "Vocabulary in Context",
        q: "In line 8, the word \"idiosyncrasies\" most closely refers to...",
        targetLines: [7, 8, 9],
        options: [
          { letter: "A", text: "distinctive, peculiar stylistic characteristics.", correct: true, trap: "Correct: An idiosyncrasy is a distinctive or eccentric feature of a person or artwork." },
          { letter: "B", text: "sound recording errors caused by faulty microphones.", correct: false, trap: "Literal Technical Error: Confuses artistic distinctiveness with equipment failure." },
          { letter: "C", text: "marketing slogans printed on vinyl album covers.", correct: false, trap: "Commercial Trap: Completely unsuited to musical style." },
          { letter: "D", text: "copyright violations committed by amateur composers.", correct: false, trap: "Legal Trap: Conflates artistic individuality with intellectual property theft." }
        ],
        examinerNote: "Lines 7-8 describe tracks devoid of 'jarring artistic idiosyncrasies that might provoke a user to skip', meaning unique or unconventional creative quirks."
      },
      {
        id: "d6-q2",
        skill: "Reference & Deixis",
        q: "In lines 3–4, \"precisely the inverse\" refers to...",
        targetLines: [1, 2, 3, 4, 5],
        options: [
          { letter: "A", text: "platforms becoming bankrupt instead of profitable.", correct: false, trap: "Financial Fallacy: Commercial profitability is not the contrast in lines 1-3." },
          { letter: "B", text: "engines narrowing cultural exposure instead of broadening it.", correct: true, trap: "Correct: Reverses 'an unprecedented golden age of cultural democracy' with 'narrow, self-reinforcing stylistic corridors'." },
          { letter: "C", text: "musicians refusing to upload songs to digital streaming servers.", correct: false, trap: "Artist Boycott Distractor: The text discusses user consumption, not artist boycotts." },
          { letter: "D", text: "listeners deleting streaming applications from mobile smartphones.", correct: false, trap: "User Action Trap: The passage says users are retained, not leaving." }
        ],
        examinerNote: "Trace back to lines 1-3: streaming promised 'cultural democracy' (unlimited access to all music history), but engines did the opposite by herding users into narrow corridors."
      },
      {
        id: "d6-q3",
        skill: "Inference & Subtext",
        q: "Why do streaming algorithms favour \"unobtrusive, mid-tempo\" tracks (lines 6–8)?",
        targetLines: [6, 7, 8],
        options: [
          { letter: "A", text: "They consume far less bandwidth across cellular network towers.", correct: false, trap: "Technical Distortion: Bandwidth depends on file bitrate, not musical tempo." },
          { letter: "B", text: "They minimize the chance that a distracted user will change the track.", correct: true, trap: "Correct: Lines 7-8 explicitly state they avoid anything that 'might provoke a user to skip', maximizing retention." },
          { letter: "C", text: "They are cheaper for streaming services to license from record labels.", correct: false, trap: "Licensing Assumption: Plausible in business, but unmentioned in the text." },
          { letter: "D", text: "They are exclusively produced by classical European symphony orchestras.", correct: false, trap: "Genre Trap: The text mentions 'algorithmic slurry', not European classical music." }
        ],
        examinerNote: "Lines 7-8 explicitly link mid-tempo background tracks to avoiding 'jarring artistic idiosyncrasies that might provoke a user to skip', keeping users listening without interruption."
      },
      {
        id: "d6-q4",
        skill: "Tone & Writer's Stance",
        q: "In lines 10–12, the writer's attitude towards the \"illusion of limitless choice\" is...",
        targetLines: [10, 11, 12],
        options: [
          { letter: "A", text: "reverent and appreciative", correct: false, trap: "Direct Opposite: The author deplores the uniformity beneath the illusion." },
          { letter: "B", text: "cynical and sorrowful regarding the loss of genuine cultural diversity", correct: true, trap: "Correct: Words like 'serendipity is strangled' and 'standardized artistic landscape' reflect mourning over lost cultural variety." },
          { letter: "C", text: "optimistic that independent artists will soon overcome the algorithms", correct: false, trap: "Unfounded Hope: The passage ends without an optimistic resolution." },
          { letter: "D", text: "baffled as to why people still listen to recorded music", correct: false, trap: "Absurd Extreme: The author analyzes streaming mechanics, not confusion over music itself." }
        ],
        examinerNote: "The closing phrase ('serendipity is strangled... masks an increasingly standardized artistic landscape') expresses grave concern and disillusionment with the homogenization of culture."
      }
    ]
  },
  {
    id: "day-7",
    day: 7,
    title: "The Resurgence of the Analog: Tactile Longing in a Screen Age",
    theme: "Material Culture & Digital Fatigue",
    source: "Adapted from The Atlantic & The Financial Times",
    lexile: "1190L (DSE Part B2)",
    lines: [
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
    questions: [
      {
        id: "day7-q1",
        skill: "Vocabulary in Context",
        q: "In line 8, the word \"ephemeral\" most closely means...",
        targetLines: [7, 8],
        options: [
          { letter: "A", text: "extremely costly to purchase.", correct: false, trap: "Financial Trap: Ephemeral relates to time and fleetingness, not financial expense." },
          { letter: "B", text: "lasting for only a very brief period and lacking permanence.", correct: true, trap: "Correct: Ephemeral describes fleeting, transitory digital content contrasted with durable physical matter." },
          { letter: "C", text: "technologically flawless and perfectly designed.", correct: false, trap: "Quality Trap: Digital media may be convenient, but ephemeral addresses its lack of physical permanence." },
          { letter: "D", text: "difficult to download over wireless networks.", correct: false, trap: "Technical Distortion: The passage calls digital streams 'frictionless', not difficult." }
        ],
        examinerNote: "Line 8 contrasts 'frictionless, ephemeral digital streams' with the 'grounding resistance of physical matter'. Fleeting, intangible streams lack permanence."
      },
      {
        id: "day7-q2",
        skill: "Argument & Contrast",
        q: "How does the writer's view of the analog revival differ from the view of sociologists (lines 5–7)?",
        targetLines: [5, 6, 7, 8],
        options: [
          { letter: "A", text: "Sociologists blame manufacturing monopolies, whereas the writer blames consumer poverty.", correct: false, trap: "Fabricated Economics: Neither monopolies nor poverty is cited in the passage." },
          { letter: "B", text: "Sociologists regard it as a superficial marketing fad, whereas the writer sees it as a genuine human need for physical presence.", correct: true, trap: "Correct: Sociologists see 'mere hipster nostalgia... superficial aesthetic pose'; the writer identifies a profound craving for 'grounding resistance' and 'conscious presence'." },
          { letter: "C", text: "Sociologists believe analog products will fail, whereas the writer claims digital tech will vanish.", correct: false, trap: "Extreme Future Prediction: The writer never suggests digital technology will disappear entirely." },
          { letter: "D", text: "Sociologists focus on vinyl records, whereas the writer examines only mechanical wristwatches.", correct: false, trap: "Detail Distortion: Both mention multiple analog items." }
        ],
        examinerNote: "Lines 5-7 state sociologists view the trend as 'mere hipster nostalgia—a superficial aesthetic pose', which the author directly counters by explaining the deep psychological need for tactile grounding."
      },
      {
        id: "day7-q3",
        skill: "Reference & Deixis",
        q: "In line 9, \"deliberate ceremony\" refers to...",
        targetLines: [8, 9, 10],
        options: [
          { letter: "A", text: "a formal legal celebration held in Japanese manufacturing plants.", correct: false, trap: "Literal Legal Ceremony: Misinterprets personal habit as a state ceremony." },
          { letter: "B", text: "the intentional physical actions involved in playing a vinyl record.", correct: true, trap: "Correct: Follows immediately in lines 9-10: 'sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle'." },
          { letter: "C", text: "an advertising ritual broadcast across social media channels.", correct: false, trap: "Marketing Distractor: The ceremony is private and tactile, not an online marketing stunt." },
          { letter: "D", text: "the process of converting analog audio into digital MP3 files.", correct: false, trap: "Opposite Process: The ceremony is about enjoying vinyl, not digitizing it." }
        ],
        examinerNote: "The colon in line 9 directly introduces the explanation of the ceremony: 'sliding the disc from its sleeve, inspecting the grooves, and gently dropping the needle'."
      },
      {
        id: "day7-q4",
        skill: "Tone & Writer's Stance",
        q: "The writer's attitude towards people buying analog goods in the digital age is...",
        targetLines: [10, 11, 12],
        options: [
          { letter: "A", text: "scornful and condescending", correct: false, trap: "Opposite Stance: The author defends them against sociologists' scorn." },
          { letter: "B", text: "deeply empathetic and validating", correct: true, trap: "Correct: The author validates their choices as a healthy search for 'refuge from the relentless exhaustion of the disembodied screen'." },
          { letter: "C", text: "indifferent and detached", correct: false, trap: "Neutrality Trap: The author is emotionally invested in explaining the tactile human need." },
          { letter: "D", text: "skeptical of their mechanical competence", correct: false, trap: "Irrelevant Skepticism: The author describes users carefully dropping needles, not incompetent." }
        ],
        examinerNote: "The writer defends analog buyers against cynical critics, describing their actions warmly as seeking 'conscious presence' and 'refuge from... relentless exhaustion'."
      }
    ]
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DSE_READING_DATA };
}
