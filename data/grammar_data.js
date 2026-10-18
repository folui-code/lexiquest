// Grammar & Usage (3rd Edition) Book B Units Data & Question Bank
window.GRAMMAR_UNITS = [
  { id: 1, title: "Present Simple & Present Continuous", unlocked: true },
  { id: 2, title: "Transitive & Intransitive Verbs", unlocked: true },
  { id: 3, title: "Active & Passive Voice", unlocked: true },
  { id: 4, title: "The to-infinitive", unlocked: true },
  { id: 5, title: "The Bare Infinitive", unlocked: true },
  { id: 6, title: "The Gerund and its Forms", unlocked: true },
  { id: 7, title: "Uses of Modals", unlocked: false },
  { id: 8, title: "Subject-Verb Agreement", unlocked: false },
  { id: 9, title: "Articles (a/an/the/zero)", unlocked: false },
  { id: 10, title: "Prepositions of Time", unlocked: false },
  { id: 11, title: "Prepositions of Place", unlocked: false },
  { id: 12, title: "Prepositions after Verbs/Adjectives", unlocked: false },
  { id: 13, title: "Direct & Reported Speech", unlocked: false },
  { id: 14, title: "Reporting Verbs & Patterns", unlocked: false },
  { id: 15, title: "Inversion", unlocked: false },
  { id: 16, title: "Subjunctive & Unreal Past", unlocked: false },
  { id: 17, title: "Participle Clauses", unlocked: false },
  { id: 18, title: "Comparatives & Superlatives", unlocked: false },
  { id: 19, title: "Defining & Non-defining Relative Clauses", unlocked: false },
  { id: 20, title: "Obligation: Must & Have to", unlocked: false },
  { id: 21, title: "Advice: Should & Ought to", unlocked: false },
  { id: 22, title: "Deduction: May, Might, Could, Must", unlocked: false },
  { id: 23, title: "Adverbial Clauses", unlocked: false },
  { id: 24, title: "Cause and Effect Expressions", unlocked: false },
  { id: 25, title: "Purpose Clauses (so that / in order to)", unlocked: false },
  { id: 26, title: "Contrast Connectors (Although / Despite)", unlocked: false },
  { id: 27, title: "Conditionals (Type 0, 1, 2, 3 & Mixed)", unlocked: false },
  { id: 28, title: "Cohesive Devices & Discourse Markers", unlocked: false }
];

window.GRAMMAR_QUESTIONS = {
  1: [
    {
      id: 101,
      question: "This residential flat has stood empty ever since the Chan family ______ out.",
      options: [
        { key: "A", text: "moved", is_correct: true, explanation: "When 'since' introduces a specific starting point time clause, the verb must be in the past simple ('moved')." },
        { key: "B", text: "have moved", is_correct: false, explanation: "Common error: present perfect cannot be used inside a simple 'since' time clause." },
        { key: "C", text: "had moved", is_correct: false, explanation: "Past perfect is unnecessary for a simple starting point in the past." },
        { key: "D", text: "move", is_correct: false, explanation: "Present simple fails to indicate an action completed in past time." }
      ]
    },
    {
      id: 102,
      question: "Listen! The school principal ______ an urgent announcement over the intercom.",
      options: [
        { key: "A", text: "makes", is_correct: false, explanation: "'Listen!' indicates an action occurring right at this moment of speaking." },
        { key: "B", text: "is making", is_correct: true, explanation: "Use the present continuous for actions happening at the moment of speech ('Listen!')." },
        { key: "C", text: "has made", is_correct: false, explanation: "The announcement is currently in progress, not already completed." },
        { key: "D", text: "made", is_correct: false, explanation: "Past simple does not describe a live, ongoing event." }
      ]
    },
    {
      id: 103,
      question: "Water ______ at 100 degrees Celsius under normal atmospheric pressure.",
      options: [
        { key: "A", text: "is boiling", is_correct: false, explanation: "Present continuous is for temporary actions, not universal scientific facts." },
        { key: "B", text: "boils", is_correct: true, explanation: "Scientific truths, general laws of nature, and permanent facts use the present simple tense." },
        { key: "C", text: "has boiled", is_correct: false, explanation: "Present perfect implies a specific completed occurrence." },
        { key: "D", text: "boiled", is_correct: false, explanation: "Scientific facts are timeless and must use present simple." }
      ]
    },
    {
      id: 104,
      question: "I ______ what you mean, but I still disagree with your conclusion.",
      options: [
        { key: "A", text: "am understanding", is_correct: false, explanation: "'Understand' is a stative verb of cognition and is rarely used in continuous tenses." },
        { key: "B", text: "understand", is_correct: true, explanation: "Stative verbs expressing mental states (understand, believe, know) take present simple." },
        { key: "C", text: "have been understanding", is_correct: false, explanation: "Stative verbs do not take continuous aspect." },
        { key: "D", text: "understood", is_correct: false, explanation: "The mental realization is happening in the present conversation." }
      ]
    },
    {
      id: 105,
      question: "Our class teacher ______ always ______ us with surprise quizzes on Friday mornings!",
      options: [
        { key: "A", text: "is ... bombarding", is_correct: true, explanation: "Present continuous with 'always' conveys annoyance or mild complaint about an exaggerated habit." },
        { key: "B", text: "has ... bombarded", is_correct: false, explanation: "Does not express the recurring irritating habit idiom." },
        { key: "C", text: "does ... bombard", is_correct: false, explanation: "Grammatically awkward in standard affirmative statements." },
        { key: "D", text: "was ... bombarding", is_correct: false, explanation: "The context describes ongoing school habits." }
      ]
    },
    {
      id: 106,
      question: "According to the official timetable, the inter-school debate competition ______ at 9:00 a.m. tomorrow.",
      options: [
        { key: "A", text: "starts", is_correct: true, explanation: "Present simple is used for fixed scheduled future events based on timetables or official programmes." },
        { key: "B", text: "is going to start", is_correct: false, explanation: "Official timetables prefer present simple over 'going to'." },
        { key: "C", text: "started", is_correct: false, explanation: "'Tomorrow' refers to a future event." },
        { key: "D", text: "will have started", is_correct: false, explanation: "Future perfect is used for completion before a certain point." }
      ]
    },
    {
      id: 107,
      question: "Currently, our research team ______ the impact of artificial intelligence on student writing skills.",
      options: [
        { key: "A", text: "investigates", is_correct: false, explanation: "'Currently' signals a temporary project happening around now, requiring continuous tense." },
        { key: "B", text: "is investigating", is_correct: true, explanation: "Use present continuous for temporary activities in progress around the present time ('Currently')." },
        { key: "C", text: "investigated", is_correct: false, explanation: "The research is active now, not concluded in the past." },
        { key: "D", text: "has investigated", is_correct: false, explanation: "Present perfect would mean the study is already finished." }
      ]
    },
    {
      id: 108,
      question: "The soup ______ delicious; did you add any secret herbs into the broth?",
      options: [
        { key: "A", text: "is tasting", is_correct: false, explanation: "When 'taste' describes a sensory quality/state ('has a delicious flavor'), it is stative and cannot be continuous." },
        { key: "B", text: "tastes", is_correct: true, explanation: "Sensory verbs describing intrinsic qualities (taste, smell, look, sound) use the present simple." },
        { key: "C", text: "tasted", is_correct: false, explanation: "Present conversation context ('is/did you') calls for present sensory state." },
        { key: "D", text: "has been tasting", is_correct: false, explanation: "Stative sense cannot be used in continuous form." }
      ]
    },
    {
      id: 109,
      question: "My father rarely ______ coffee after 6:00 p.m. because it disrupts his sleep.",
      options: [
        { key: "A", text: "is drinking", is_correct: false, explanation: "Frequency adverbs (rarely, seldom, usually) with habitual routines take present simple." },
        { key: "B", text: "drinks", is_correct: true, explanation: "Habitual actions modified by frequency adverbs ('rarely') require present simple." },
        { key: "C", text: "drank", is_correct: false, explanation: "Describes an enduring ongoing lifestyle rule, not past history." },
        { key: "D", text: "drink", is_correct: false, explanation: "Subject-verb agreement: third-person singular ('My father') requires 'drinks'." }
      ]
    },
    {
      id: 110,
      question: "Economic indicators show that inflation in the city ______ gradually.",
      options: [
        { key: "A", text: "is slowing down", is_correct: true, explanation: "Use present continuous to describe dynamic changes, trends, and evolving situations ('gradually')." },
        { key: "B", text: "slows down", is_correct: false, explanation: "Present simple expresses static facts; ongoing trends take present continuous." },
        { key: "C", text: "has slowed down", is_correct: false, explanation: "The gradual trend is actively unfolding." },
        { key: "D", text: "slow down", is_correct: false, explanation: "Incorrect agreement with singular noun 'inflation'." }
      ]
    }
  ],
  2: [
    {
      id: 201,
      question: "The comprehensive training programme ______ eight specialized modules covering digital marketing skills.",
      options: [
        { key: "A", text: "comprises", is_correct: true, explanation: "'Comprise' is a transitive verb meaning 'consist of' and takes a direct object without 'of'." },
        { key: "B", text: "comprises of", is_correct: false, explanation: "The active verb 'comprise' is transitive and should NOT be followed by 'of'." },
        { key: "C", text: "consists", is_correct: false, explanation: "'Consist' is intransitive and requires the preposition 'of'." },
        { key: "D", text: "is comprised", is_correct: false, explanation: "Passive 'is comprised' requires 'of' ('is comprised of')." }
      ]
    },
    {
      id: 202,
      question: "Due to heavy fog, the morning flight to London ______ for over three hours before clearing customs.",
      options: [
        { key: "A", text: "delayed", is_correct: false, explanation: "'Delay' is transitive; flights do not delay themselves, they are delayed." },
        { key: "B", text: "was delayed", is_correct: true, explanation: "'Delay' requires an object in active voice; here the subject receives the action, requiring passive voice." },
        { key: "C", text: "has delayed", is_correct: false, explanation: "Active voice incorrectly implies the flight caused the delay to someone else." },
        { key: "D", text: "was delaying", is_correct: false, explanation: "Incorrect continuous aspect for flight status." }
      ]
    },
    {
      id: 203,
      question: "The little girl ______ down on the grass to read her favorite storybook.",
      options: [
        { key: "A", text: "laid", is_correct: false, explanation: "'Laid' is the past tense of transitive 'lay' (to put something down), which requires an object." },
        { key: "B", text: "lay", is_correct: true, explanation: "'Lay' is the past tense of intransitive 'lie' (to recline), which takes no object." },
        { key: "C", text: "lied", is_correct: false, explanation: "'Lied' is the past tense of 'lie' meaning to tell an untruth." },
        { key: "D", text: "has lain", is_correct: false, explanation: "Simple past narrative action." }
      ]
    },
    {
      id: 204,
      question: "After thorough investigation, the detectives ______ the missing files under the floorboards.",
      options: [
        { key: "A", text: "located", is_correct: true, explanation: "'Locate' is a transitive verb taking the direct object 'the missing files'." },
        { key: "B", text: "located at", is_correct: false, explanation: "Transitive verbs take direct objects without unneeded prepositions." },
        { key: "C", text: "were located", is_correct: false, explanation: "The detectives performed the action (active voice needed)." },
        { key: "D", text: "disappeared", is_correct: false, explanation: "Intransitive verb incompatible with direct object." }
      ]
    },
    {
      id: 205,
      question: "The sudden price hike has ______ significant anxiety among local residents.",
      options: [
        { key: "A", text: "raised", is_correct: true, explanation: "'Raise' is transitive and requires a direct object ('significant anxiety')." },
        { key: "B", text: "risen", is_correct: false, explanation: "'Rise' is intransitive and cannot take a direct object." },
        { key: "C", text: "arisen", is_correct: false, explanation: "'Arise' is intransitive; problems arise, but one cannot 'arise anxiety'." },
        { key: "D", text: "aroused of", is_correct: false, explanation: "'Arouse' takes a direct object without 'of'." }
      ]
    }
  ],
  3: [
    {
      id: 301,
      question: "The elderly patient ______ peacefully in her sleep late last night.",
      options: [
        { key: "A", text: "passed away", is_correct: true, explanation: "Intransitive verbs like 'pass away' or 'die' cannot be used in the passive voice." },
        { key: "B", text: "was passed away", is_correct: false, explanation: "'Pass away' is intransitive and cannot be made passive." },
        { key: "C", text: "was died", is_correct: false, explanation: "'Die' is strictly intransitive and never takes passive voice." },
        { key: "D", text: "had been died", is_correct: false, explanation: "Intransitive verbs have no passive voice forms." }
      ]
    },
    {
      id: 302,
      question: "A rare species of butterfly was ______ in the remote mountain valley last month.",
      options: [
        { key: "A", text: "discovered", is_correct: true, explanation: "Passive voice (was + past participle) is used when the receiver of the action is the subject." },
        { key: "B", text: "discovering", is_correct: false, explanation: "Butterflies do not discover; they are discovered." },
        { key: "C", text: "discover", is_correct: false, explanation: "Passive requires past participle." },
        { key: "D", text: "been discovered", is_correct: false, explanation: "'Was' must be followed by past participle directly, not 'been'." }
      ]
    },
    {
      id: 303,
      question: "The unfortunate incident ______ right in front of the convenience store.",
      options: [
        { key: "A", text: "occurred", is_correct: true, explanation: "'Occur' and 'happen' are intransitive verbs and can NEVER be used in the passive voice." },
        { key: "B", text: "was occurred", is_correct: false, explanation: "Common student trap: 'occur' cannot be passive ('was occurred')." },
        { key: "C", text: "has been occurred", is_correct: false, explanation: "Intransitive verbs cannot be made passive." },
        { key: "D", text: "was happening", is_correct: false, explanation: "Simple narrative action." }
      ]
    }
  ],
  4: [
    {
      id: 401,
      question: "The headmaster refused ______ any further comments regarding the leaked examination paper.",
      options: [
        { key: "A", text: "to make", is_correct: true, explanation: "'Refuse' is followed by a to-infinitive ('refuse to do something')." },
        { key: "B", text: "making", is_correct: false, explanation: "'Refuse' does not take a gerund." },
        { key: "C", text: "make", is_correct: false, explanation: "'Refuse' requires 'to' before the base verb." },
        { key: "D", text: "for making", is_correct: false, explanation: "Incorrect prepositional construction." }
      ]
    },
    {
      id: 402,
      question: "CAUTION TRAP: All board members are looking forward to ______ the annual financial report at the summit.",
      options: [
        { key: "A", text: "receiving", is_correct: true, explanation: "In 'look forward to', 'to' is a preposition and MUST be followed by a gerund ('receiving'), NOT an infinitive." },
        { key: "B", text: "receive", is_correct: false, explanation: "A major student error: 'to' here is a preposition, not an infinitive marker." },
        { key: "C", text: "be receiving", is_correct: false, explanation: "Continuous infinitive cannot follow preposition 'to'." },
        { key: "D", text: "have received", is_correct: false, explanation: "Gerund required." }
      ]
    }
  ],
  5: [
    {
      id: 501,
      question: "The security officer made the trespasser ______ all photographs from his digital camera.",
      options: [
        { key: "A", text: "delete", is_correct: true, explanation: "Causative verb 'make' (active voice: make + someone + bare infinitive) takes a bare infinitive without 'to'." },
        { key: "B", text: "to delete", is_correct: false, explanation: "Active causative 'make someone do' takes a bare infinitive." },
        { key: "C", text: "deleted", is_correct: false, explanation: "Past tense cannot follow causative 'make'." },
        { key: "D", text: "deleting", is_correct: false, explanation: "Present participle is incorrect here." }
      ]
    },
    {
      id: 502,
      question: "PASSIVE PERCEPTION TRAP: The suspect was seen ______ out of the jewelry shop by several passersby.",
      options: [
        { key: "A", text: "to run", is_correct: true, explanation: "PASSIVE RULE: When perception verbs are passive ('was seen'), the bare infinitive changes into a to-infinitive ('to run')." },
        { key: "B", text: "run", is_correct: false, explanation: "In the passive voice, perception verbs require 'to' ('was seen to run')." },
        { key: "C", text: "ran", is_correct: false, explanation: "Past tense cannot follow passive perception verbs." },
        { key: "D", text: "for running", is_correct: false, explanation: "Incorrect construction." }
      ]
    }
  ],
  6: [
    {
      id: 601,
      question: "Despite feeling exhausted, the marathon runner insisted on ______ the final lap.",
      options: [
        { key: "A", text: "completing", is_correct: true, explanation: "Verbs followed by prepositions ('insist on') MUST take a gerund (-ing form)." },
        { key: "B", text: "complete", is_correct: false, explanation: "Prepositions cannot be followed by bare base verbs." },
        { key: "C", text: "to complete", is_correct: false, explanation: "Prepositions cannot be followed by to-infinitives." },
        { key: "D", text: "completed", is_correct: false, explanation: "Gerund is required after prepositions." }
      ]
    },
    {
      id: 602,
      question: "It is simply no use ______ over spilt milk; we need a proactive recovery plan.",
      options: [
        { key: "A", text: "crying", is_correct: true, explanation: "The idiom 'It is no use' is always followed by a gerund ('crying')." },
        { key: "B", text: "to cry", is_correct: false, explanation: "'It is no use' takes a gerund, not an infinitive." },
        { key: "C", text: "cry", is_correct: false, explanation: "Base verb cannot follow 'no use'." },
        { key: "D", text: "in crying", is_correct: false, explanation: "Preposition 'in' is ungrammatical here." }
      ]
    }
  ]
};
