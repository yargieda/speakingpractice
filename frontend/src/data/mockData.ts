// Local mock data for the UI phase. No API calls — everything is static.
// Structured so Phase 2 can swap prompts + feedback with real service responses.

export type FeedbackItem = {
  original: string;
  suggestion: string;
  note: string;
};

export type Feedback = {
  scoreLabel: string; // "IELTS Band" | "ICAO Level"
  scoreValue: string; // "7.5" | "4"
  scoreCaption: string;
  grammar: FeedbackItem[];
  vocabulary: FeedbackItem[];
  phraseology?: FeedbackItem[]; // ICAO only
};

export type PracticeType = {
  id: string;
  label: string;
  instruction: string;
  prompts: string[];
  prepSeconds: number; // 0 = no prep phase
  responseSeconds: number;
  transcriptSample: string;
  feedback: Feedback;
};

export type ModeId = "ielts" | "icao";

export type Mode = {
  id: ModeId;
  title: string;
  subtitle: string;
  accent: string;
  onAccent: string;
  heroImage: string;
  types: PracticeType[];
};

export const IELTS_MODE: Mode = {
  id: "ielts",
  title: "IELTS Speaking",
  subtitle: "Academic speaking simulation",
  accent: "#1B4332",
  onAccent: "#FFFFFF",
  heroImage:
    "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxpZWx0cyUyMGV4YW0lMjBhY2FkZW1pYyUyMHBhcGVyfGVufDB8fHx8MTc4ODI2MzQ2OXww&ixlib=rb-4.1.0&q=85",
  types: [
    {
      id: "part1",
      label: "Part 1",
      instruction: "Answer with 2–3 full sentences. Speak naturally.",
      prompts: [
        "Let's talk about your hometown. Where is it and what is it known for?",
        "Do you prefer to spend your free time indoors or outdoors? Why?",
        "How often do you read books, and what kind do you enjoy most?",
        "Tell me about the kind of music you like to listen to.",
      ],
      prepSeconds: 0,
      responseSeconds: 45,
      transcriptSample:
        "My hometown is a small coastal city in the south. It's mainly known for its fishing harbour and the seafood markets that open early every morning. I really enjoy living there because it's calm, and the sea breeze makes the summers quite pleasant.",
      feedback: {
        scoreLabel: "IELTS Band",
        scoreValue: "7.0",
        scoreCaption: "Good User",
        grammar: [
          {
            original: "It's mainly known for it's fishing harbour.",
            suggestion: "It's mainly known for its fishing harbour.",
            note: "Use possessive 'its' (no apostrophe).",
          },
        ],
        vocabulary: [
          {
            original: "the sea breeze makes the summers quite pleasant",
            suggestion: "the coastal breeze makes the summers remarkably mild",
            note: "'Mild' is more precise for describing weather.",
          },
        ],
      },
    },
    {
      id: "part2",
      label: "Part 2 Cue Card",
      instruction: "You have 1 minute to prepare, then speak for up to 2 minutes.",
      prompts: [
        "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would change your life.",
        "Describe a memorable journey you have taken. You should say: where you went, who you were with, what you did, and explain why it was memorable.",
        "Describe a person who has influenced you. You should say: who they are, how you know them, what they did, and explain why they influenced you.",
      ],
      prepSeconds: 60,
      responseSeconds: 120,
      transcriptSample:
        "The skill I would love to learn is playing the piano. I've always been drawn to classical music, and being able to play a piece myself would be incredibly rewarding. I'd probably start with online lessons and then find a local tutor for weekly practice. I think it would help me relax after work and give me a creative outlet I've been missing.",
      feedback: {
        scoreLabel: "IELTS Band",
        scoreValue: "7.5",
        scoreCaption: "Good User",
        grammar: [
          {
            original: "I've always been drawn to classical music since I was child.",
            suggestion: "I've always been drawn to classical music since I was a child.",
            note: "Add the article 'a' before a singular countable noun.",
          },
        ],
        vocabulary: [
          {
            original: "it would be incredibly rewarding",
            suggestion: "it would be immensely fulfilling",
            note: "'Fulfilling' adds emotional depth for a Part 2 narrative.",
          },
        ],
      },
    },
    {
      id: "part3",
      label: "Part 3",
      instruction: "Give a developed, opinion-led answer with examples.",
      prompts: [
        "Do you think traditional skills are being lost in modern society? Why?",
        "How has technology changed the way people learn new things?",
        "Should governments invest more in public education? Explain your view.",
      ],
      prepSeconds: 0,
      responseSeconds: 60,
      transcriptSample:
        "I do think some traditional skills are fading, mainly because technology offers faster alternatives. For instance, fewer people learn to cook from scratch when delivery apps are everywhere. That said, I believe there's a growing counter-movement of people who deliberately preserve crafts like woodworking or pottery.",
      feedback: {
        scoreLabel: "IELTS Band",
        scoreValue: "7.0",
        scoreCaption: "Good User",
        grammar: [
          {
            original: "there's a growing counter-movement of people who deliberately preserves crafts",
            suggestion: "there's a growing counter-movement of people who deliberately preserve crafts",
            note: "Subject–verb agreement: 'people' takes the plural verb 'preserve'.",
          },
        ],
        vocabulary: [
          {
            original: "technology offers faster alternatives",
            suggestion: "technology offers more expedient alternatives",
            note: "'Expedient' shows range for a Part 3 discussion.",
          },
        ],
      },
    },
  ],
};

export const ICAO_MODE: Mode = {
  id: "icao",
  title: "ICAO Aviation",
  subtitle: "Aviation English proficiency",
  accent: "#9B2226",
  onAccent: "#FFFFFF",
  heroImage:
    "https://images.unsplash.com/flagged/photo-1579750481098-8b3a62c9b85d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxhdmlhdGlvbiUyMHBpbG90JTIwY29ja3BpdHxlbnwwfHx8fDE3ODgyNjM0Njh8MA&ixlib=rb-4.1.0&q=85",
  types: [
    {
      id: "picture",
      label: "Picture Description",
      instruction: "Describe what you see in clear, structured English.",
      prompts: [
        "Describe a scene at a busy international airport apron during aircraft turnaround, including ground vehicles and personnel.",
        "Describe a control tower view of two aircraft holding short of an active runway in poor visibility.",
        "Describe a maintenance hangar with technicians inspecting a jet engine.",
      ],
      prepSeconds: 30,
      responseSeconds: 60,
      transcriptSample:
        "In the picture I can see a wide-body aircraft parked at the gate while several ground vehicles surround it. A fuel truck is connected on the left, and baggage carts are being towed towards the forward cargo hold. Two ground crew members wearing high-visibility vests are guiding the operation near the nose wheel.",
      feedback: {
        scoreLabel: "ICAO Level",
        scoreValue: "4",
        scoreCaption: "Operational",
        grammar: [
          {
            original: "several ground vehicles surrounds it",
            suggestion: "several ground vehicles surround it",
            note: "Plural subject requires the plural verb form.",
          },
        ],
        vocabulary: [
          {
            original: "baggage carts are being towed towards the front cargo",
            suggestion: "baggage carts are being towed towards the forward cargo hold",
            note: "'Forward' and 'cargo hold' are standard aviation terms.",
          },
        ],
        phraseology: [
          {
            original: "the people on the ground",
            suggestion: "ground crew / ramp personnel",
            note: "Use standard role terminology rather than generic descriptors.",
          },
        ],
      },
    },
    {
      id: "radio",
      label: "Radio Scenario",
      instruction: "Read back the clearance and respond using standard phraseology.",
      prompts: [
        "ATC: 'Speedbird 245, climb and maintain flight level 350, turn right heading 090.' Provide your read-back.",
        "ATC: 'Cactus 108, taxi to holding point runway 27 via taxiway Bravo, hold short of runway 33.' Provide your read-back.",
        "ATC: 'Delta 512, cleared for takeoff runway 27, wind 260 at 10.' Provide your read-back.",
      ],
      prepSeconds: 0,
      responseSeconds: 45,
      transcriptSample:
        "Climbing and maintaining flight level three five zero, turning right heading zero niner zero, Speedbird two four five. Requesting confirmation of the assigned heading due to traffic on our current track.",
      feedback: {
        scoreLabel: "ICAO Level",
        scoreValue: "5",
        scoreCaption: "Extended",
        grammar: [
          {
            original: "Requesting confirmation of the heading because of traffic",
            suggestion: "Request confirmation of the assigned heading due to traffic",
            note: "Radio phraseology drops the '-ing' form: use 'request'.",
          },
        ],
        vocabulary: [
          {
            original: "flight level three fifty",
            suggestion: "flight level three five zero",
            note: "Read levels digit by digit for clarity.",
          },
        ],
        phraseology: [
          {
            original: "heading ninety",
            suggestion: "heading zero niner zero",
            note: "Always speak three digits and use 'niner' for nine.",
          },
        ],
      },
    },
    {
      id: "emergency",
      label: "Emergency Response",
      instruction: "Declare the emergency clearly and state your intentions.",
      prompts: [
        "You have an engine failure shortly after takeoff. Declare the emergency and state your intentions to ATC.",
        "There is smoke in the cabin during cruise. Communicate the situation and request priority handling.",
        "A passenger has a serious medical emergency. Request a priority landing and ground assistance.",
      ],
      prepSeconds: 30,
      responseSeconds: 60,
      transcriptSample:
        "Mayday, mayday, mayday, Speedbird two four five, engine failure after takeoff, we are unable to maintain altitude, request immediate return to the field, souls on board one eight seven, fuel endurance two hours, requesting emergency services on standby.",
      feedback: {
        scoreLabel: "ICAO Level",
        scoreValue: "5",
        scoreCaption: "Extended",
        grammar: [
          {
            original: "we cannot to maintain altitude",
            suggestion: "we are unable to maintain altitude",
            note: "Use 'unable to' — 'cannot' is not followed by 'to'.",
          },
        ],
        vocabulary: [
          {
            original: "we have a lot of people on board",
            suggestion: "souls on board one eight seven",
            note: "'Souls on board' with a spoken figure is the standard term.",
          },
        ],
        phraseology: [
          {
            original: "help us please, we have an engine problem",
            suggestion: "Mayday, mayday, mayday — engine failure, request immediate return",
            note: "Open a distress call with 'Mayday' repeated three times.",
          },
        ],
      },
    },
  ],
};

export const MODES: Record<ModeId, Mode> = {
  ielts: IELTS_MODE,
  icao: ICAO_MODE,
};

export const MICROPHONE_EMPTY_STATE =
  "https://images.pexels.com/photos/26280295/pexels-photo-26280295.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
