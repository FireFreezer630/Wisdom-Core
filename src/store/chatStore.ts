import { create } from 'zustand';
import type { Conversation, Settings, Timer, Message, MessageContent } from '../types';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  settings: Settings;
  timer: Timer;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setTimer: (timer: Partial<Timer>) => void;
}

const DEFAULT_SYSTEM_PROMPT = `
TUM HO ICSE KA SABSE MAHAAN TEACHER – "ICSE MASTER TUTOR 9000" – JO PURE ICSE SYLLABUS KO BACHON KO AISA SIKHATA HAI JAISA KOI NAHI. TUMHARI BAAT KA TAREEQA EKDAM PYAARA, SIMPLE AUR DOSTANA HAI – JAADU KI TARAH HAR TOPIC CLEAR HO JATA HAI. TUM HAMESHA HINGLISH (MATLAB ROMAN HINDI, THODA THODA ENGLISH) MEIN BAAT KARTE HO.

---
**MANDATORY SYLLABUS GATHERING BEFORE ANSWERING:**
###TOOL USAGE INSTRUCTIONS###
You now have the capability to use tools.
\- **WEB SEARCH:** Use web search when real-time info such as dates or other info that is prone to change is required, **OR** to find diagrams, images, or visual aids that can help explain a concept better. Do **NOT** use web search for gathering the syllabus content itself; use \`get_syllabus\` for that.
\- **STRICTLY STICK TO SYLLABUS:** Use the syllabus obtained via the \`get_syllabus\` tool as the definitive guide for what information to provide and **ensure all relevant points mentioned in the syllabus for that topic are covered in your explanation.** Do not go significantly beyond the syllabus scope unless explicitly asked.
\- **DO NOT** tell the user about tool usage (neither \`get_syllabus\` nor web search).
###TAG DEFINITIONS###

AGAR User ye tags bheje toh pichle ya current topic ke context me ese reply kro :

\- \`#SIMPLE\`: Jab user click kare, toh concept ko **3 level par explain karo**:
  1\. **5 saal ke bacche ke liye** – Realistic, relatable examples. No jargon.
  2\. **10 saal ke bacche ke liye** – Easy ICSE grade 5–6 logic. Basic terms.
  3\. **15 saal ke ICSE student ke liye** – Class 10 style clear explanation with **important keywords highlighted**.

\- \`#INDEPTH\`: Full detail with causes, principles, links to other concepts, examples, edge cases, etc.

\- \`#EXAM\`: Formal ICSE board-style answer IN ENGLISH. Important keywords **underline** karo. Precision aur marks ke hisaab se likho.

\- \`#REVISION\`: Short recap with 4–5 bullet points or tricks to yaad rakhne ke liye.

---

###CONTEXT DETECTION INSTRUCTION###

Har user question ko samajhne ke baad, tum:
\- Identify karo **kis class**, **subject**, aur **chapter/topic** se related hai.
\- Fir us subject ke hisab se syllabus gather kro and uske topic ko mind me rakho (output me nhi)
\- Us chapter ka **brief introduction** do – kya hai, kya important hai and syllabus me kya he.
\- Agar kisi concept ko samajhne ke liye **kuch aur pehle samajhna zaroori ho**, toh woh basic concept explain karo.
\- Phir final explanation do – simple, friendly aur clear.
\- Ending me English me formal languages me question ka answer ya definiton provide kro
\- Flashcard/MCQs offer kro
---

###PERSONALITY INSTRUCTIONS###

\- Over the course of the conversation, **adapt** to the user's tone and preference.
\- Try to match your responses to the **user's vibe, tone,** and generally **how they are speaking.**
\- The conversation should feel **natural**, so adjust your style accordingly.
\- Engage in **authentic conversation** by responding to the information the user provides, asking **relevant questions**, and showing **genuine curiosity**.
\- If the conversation allows, continue with **casual conversation** in between explaining concepts. Be friendly and approachable.

---

###RENDERING INSTRUCTIONS###

\- Use LaTeX for all math formulas
\- Inline math: \`\$E = mc^2\$\`
\- Display math: \`\$\$\frac{d}{dx}\left( \int_{a}^{x} f(t)\,dt \right) = f(x)\$\$\`
\- Escape special characters properly: \\\\, { }, \_, \^
\- Use \\frac, x\_{subscript}, x\^{power}, \\sqrt, \\sqrt\[n\]\{\} correctly
\- These rendering rules are internal – user ko kabhi show mat karo

---

###MISSION###

\- TEACH According to ICSE SYLLABUS (Class 10): Physics, Chemistry, Biology , Maths, English, History, Geography, Civics, Computer Applications, etc.
\- MAKE THINGS SIMPLE: Har theory ya concept ko chhoti chhoti baaton mein tod kar samjhao
\- ADD REAL LIFE ANALOGIES & EXAMPLES ONLY IF RELEVAN
\- NEVER SKIP EXPLANATION – even if user pooche “sirf definition”
\- DO not go OUT of the question or TOPIC, use the required function to gather the syllabus to keep your response in boundaries
\- ALWAYS END Each response with formal definnition or answer in ENGLISH for exam point of view
---

CHAIN OF THOUGHTS
REQUEST SAMJHO:
Kya poocha gaya hai?
Subject AUTOMATICALLY DETECT karo.
Kon si Class ka topic hai? (Assume Class 10 ICSE/CISCE agar nahi bataya).
Subject aur Chapter ka naam kya hai?
PRIORITY: SYLLABUS NIKALO (MANDATORY FIRST STEP):
Detected subject, class, board ka relevant syllabus gather karo. Yeh context ke liye crucial hai.
BACKGROUND CHECK KARO (SYLLABUS SE):
Gathered syllabus ke hisaab se dekho, koi prerequisite knowledge chahiye kya?
Agar haan (koi pehle ki knowledge chahiye), toh main topic se pehla woh samjhao.
BASICS PEHCHANO (SYLLABUS SE):
Gathered syllabus ke according topic ke basic terms aur principles kya hain?
Kon si cheezein pehle samjhana zaroori hai syllabus ke hisaab se?
PROBLEM KO TODO (SYLLABUS KE ACCORDING):
Main topic/problem ko syllabus ke points/structure ke hisaab se chhote, manageable parts mein divide karo.
Har part ko step-by-step explain karne ka plan karo.
HAR PART ANALYZE/EXPLAIN KARO (SYLLABUS-ALIGNED):
Har chhota part clearly aur friendly tone mein explain karo.
Facts, examples, details do jo syllabus ke specific point ke liye required hain.
Difficult parts ke liye REAL-LIFE ANALOGY/KAHANI/CARTOON USE KARO (syllabus complexity ya student confusion se identify karke), par sirf tabhi jab relevant ho!
(Agar diagram/image se point significantly clear ho raha hai (aur syllabus requirement se relevant ho), toh web search use karo).
POORA CONCEPT BUILD KARO (COMPREHENSIVE & SYLLABUS-ALIGNED):
Explain kiye hue chhote parts ko jodkar complete picture banao.
Ensure explanation sabhi relevant syllabus points ko thoroughly cover kare.
Syllabus ki depth ke according detailed explanations provide karo.
Diagrams, flowcharts, ya summaries use karo agar helpful hain aur specific syllabus point se relevant hain.
AGE KE HISAAB SE SIMPLIFY KARO (SIRF DIFFICULT SYLLABUS PARTS KE LIYE):
Agar student difficult part (khaaskar core syllabus concept) mein confuse lage:
Pehle 5 saal wale tareeke se samjhao.
Phir 10 saal wale tareeke se.
Phir 15 saal (ya target class level) ke understanding tak le jao.
REPEAT AUR CLARIFY KARO:
Chhote reinforcing examples do.
Friendly tone mein check karo: "Samajh aaya kya?"
FINAL RECAP AUR TRICK DO:
Core concept 1-2 line mein revise karwao.
Quick summary aur yaad rakhne ki easy trick batao.
FORMAL DEFINITION/ANSWER DO:
End mein, exam ke liye formal definition ya key points clear, exam-appropriate language mein likho, jo syllabus ke exam requirements ke according structured ho.
PRACTICE OFFER KARO:
Topic par practice ke liye Flashcards ya MCQs banane ka suggest karo.---

###WHAT NOT TO DO###

\- Kabhi bhi technical jargon explain kiye bina mat use karo
\- Kabhi mat assume karo question ka meaning – confirm karo agar doubt ho
\- Hamesha syllabus gather krna and agar real time info chahiye ho toh web search jaruur krna and if essential web search se without hesitation images dhudke add krlena
\- Never skip explanation
\- Kabhi bhi "ye simple hai, tumhe aana chahiye" mat bolna
\- Hamesha student ko empowered feel karwao
`;

const DEFAULT_CONVERSATION: Conversation = {
  id: crypto.randomUUID(),
  title: 'Welcome to WisdomCore',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  messages: [
    {
      role: 'assistant',
      content:
        "Hello! I'm WisdomCore, your AI knowledge companion. I'm here to help you explore any topic, answer your questions, and engage in meaningful discussions.\n\nWhat would you like to learn about today?",
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper function to manually serialize conversation data
const conversationToJson = (conversation: Conversation): any => {
  // Recursively convert Conversation and Message objects to plain objects
  const convertMessage = (message: Message): any => {
    const newMessage: any = {
      role: message.role,
      name: message.name,
      function_call: message.function_call,
      tool_call_id: message.tool_call_id,
    };

    if (Array.isArray(message.content)) {
      newMessage.content = message.content.map((item: MessageContent) => { // Explicitly type item
        const newItem: any = { type: item.type };
        if (item.text !== undefined) newItem.text = item.text;
        if (item.image_url !== undefined) newItem.image_url = item.image_url;
        if (item.flashcard !== undefined) newItem.flashcard = item.flashcard; // Flashcard structure should be serializable
        if (item.flashcardSet !== undefined) newItem.flashcardSet = item.flashcardSet; // FlashcardSet structure should be serializable
        if (item.searchResult !== undefined) newItem.searchResult = item.searchResult; // SearchResult structure should be serializable
        return newItem;
      });
    } else {
      newMessage.content = message.content;
    }

    return newMessage;
  };

  return {
    id: conversation.id,
    title: conversation.title,
    systemPrompt: conversation.systemPrompt,
    messages: conversation.messages.map(convertMessage),
    createdAt: conversation.createdAt.toISOString(), // Convert Date to string
    updatedAt: conversation.updatedAt.toISOString(), // Convert Date to string
  };
};


// Helper function to save state to localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    let dataToSave = data;
    if (key === 'wisdom-core-conversations' && Array.isArray(data)) {
      // Manually serialize conversations to avoid RangeError
      dataToSave = data.map(conversationToJson);
    }

    const serializedData = JSON.stringify(dataToSave);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Helper function to load state from localStorage with custom deserialization
const loadFromLocalStorage = () => {
  try {
    const storedConversations = localStorage.getItem('wisdom-core-conversations');
    const storedSettings = localStorage.getItem('wisdom-core-settings');
    const storedActiveId = localStorage.getItem('wisdom-core-active-conversation');

    const conversations: Conversation[] = storedConversations
      ? JSON.parse(storedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt), // Convert string back to Date
          updatedAt: new Date(conv.updatedAt), // Convert string back to Date
        }))
      : []; // Start with an empty array if no conversations are stored

    const settings = storedSettings
      ? JSON.parse(storedSettings)
      : {
          defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
          darkMode: false,
          pomodoroWork: 25,
          pomodoroBreak: 5,
          pomodoroLongBreak: 15,
          pomodoroRounds: 4,
        };

    // Determine active conversation ID, ensuring it's valid
    let activeConversationId = storedActiveId;
    if (!activeConversationId || !conversations.some(conv => conv.id === activeConversationId)) {
        activeConversationId = conversations.length > 0 ? conversations[0].id : null;
    }


    return { conversations, settings, activeConversationId };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    // Return null or a state that indicates loading failed, allowing default state to be used
    return null;
  }
};

export const useChatStore = create<ChatStore>((set, get) => {
  // Load initial state from localStorage or use defaults
  const savedState = loadFromLocalStorage();

  // Ensure conversations array is not empty and activeConversationId is valid
  const initialConversations = savedState?.conversations && savedState.conversations.length > 0
    ? savedState.conversations
    : [DEFAULT_CONVERSATION]; // Use default if no conversations loaded or savedState is null

  const initialActiveConversationId = savedState?.activeConversationId && initialConversations.some(conv => conv.id === savedState.activeConversationId)
    ? savedState.activeConversationId
    : initialConversations.length > 0 ? initialConversations[0].id : null; // Use the first conversation's ID if saved ID is invalid or missing, or null if no conversations


  return {
    conversations: initialConversations,
    activeConversationId: initialActiveConversationId,
    settings: savedState?.settings || {
      defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
      darkMode: false,
      pomodoroWork: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
      pomodoroRounds: 4,
    },
    timer: {
      endTime: null,
      isPomodoro: false,
      pomodoroState: 'work',
      currentRound: 1,
    },
    addConversation: (conversation) =>
      set((state) => {
        const newState = {
          conversations: [...state.conversations, conversation],
          activeConversationId: conversation.id,
        };
        saveToLocalStorage('wisdom-core-conversations', newState.conversations);
        saveToLocalStorage('wisdom-core-active-conversation', newState.activeConversationId);
        return newState;
      }),
    updateConversation: (id, updates) =>
      set((state) => {
        const newConversations = state.conversations.map((conv) =>
          conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
        );
        saveToLocalStorage('wisdom-core-conversations', newConversations);
        return { conversations: newConversations };
      }),
    deleteConversation: (id) =>
      set((state) => {
        const filteredConversations = state.conversations.filter((conv) => conv.id !== id);
        let newActiveId = state.activeConversationId === id && filteredConversations.length > 0
          ? filteredConversations[0].id // Set to the first conversation if the active one was deleted
          : state.activeConversationId; // Otherwise, keep the current active ID

        let conversationsToSave = filteredConversations;

        // If all conversations are deleted, create a new default one
        if (filteredConversations.length === 0) {
          const newDefaultConversation = {
            id: crypto.randomUUID(),
            title: 'Welcome to WisdomCore',
            systemPrompt: state.settings.defaultSystemPrompt,
            messages: [
              {
                role: 'assistant' as const,
                content:
                  "Hello! I'm WisdomCore, your AI knowledge companion. I'm here to help you explore any topic, answer your questions, and engage in meaningful discussions.\n\nWhat would you like to learn about today?",
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          conversationsToSave = [newDefaultConversation];
          newActiveId = newDefaultConversation.id;
        }

        saveToLocalStorage('wisdom-core-conversations', conversationsToSave);
        // Only update active conversation in local storage if it changed
        if (newActiveId !== state.activeConversationId) {
           saveToLocalStorage('wisdom-core-active-conversation', newActiveId);
        }


        return {
          conversations: conversationsToSave,
          activeConversationId: newActiveId,
        };
      }),
    setActiveConversation: (id) =>
      set(() => {
        saveToLocalStorage('wisdom-core-active-conversation', id);
        return { activeConversationId: id };
      }),
    updateSettings: (newSettings) =>
      set((state) => {
        const updatedSettings = { ...state.settings, ...newSettings };
        saveToLocalStorage('wisdom-core-settings', updatedSettings);

        let updatedConversations = state.conversations;

        // If the default system prompt changed, update the active conversation's prompt
        if (newSettings.defaultSystemPrompt && state.activeConversationId) {
          updatedConversations = state.conversations.map((conv) => {
            if (conv.id === state.activeConversationId) {
              // Use non-null assertion as the outer if ensures defaultSystemPrompt is defined
              return { ...conv, systemPrompt: newSettings.defaultSystemPrompt!, updatedAt: new Date() };
            }
            return conv;
          });
          // Save the updated conversations array as well
          saveToLocalStorage('wisdom-core-conversations', updatedConversations);
        }

        return {
          settings: updatedSettings,
          conversations: updatedConversations, // Return the potentially updated conversations
        };
      }),
    setTimer: (newTimer) =>
      set((state) => ({
        timer: { ...state.timer, ...newTimer },
        updatedAt: new Date(), // Add or update updatedAt for timer changes
      })),
  };
});
