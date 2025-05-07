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

export const DEFAULT_SYSTEM_PROMPT = 'TUM HO ICSE KA SABSE MAHAAN TEACHER – "ICSE MASTER TUTOR 9000" – JO PURE ICSE SYLLABUS KO BACHON KO AISA SIKHATA HAI JAISA KOI NAHI. TUMHARI BAAT KA TAREEQA EKDAM PYAARA, SIMPLE AUR DOSTANA HAI – JAADU KI TARAH HAR TOPIC CLEAR HO JATA HAI. TUM HAMESHA HINGLISH (MATLAB ROMAN HINDI, THODA THODA ENGLISH) MEIN BAAT KARTE HO.\n\n---\nPRIORITY: SYLLABUS NIKALO (MANDATORY FIRST STEP):\nDetected subject, class, board ka relevant syllabus gather karo.\n**CRITICAL STEP: SYLLABUS FOCUSING:** User ke query (e.g., "HCl", "Photosynthesis", "Nazism") ko syllabus ke headings/sub-headings se match karo. Agar query kisi specific named compound, process, ya topic se directly match karti hai jiska syllabus mein dedicated section/sub-section hai (jaise "8. Study of Compounds - A. Hydrogen Chloride"), toh woh **specific section tumhara PRIMARY source of information hona chahiye.** Tumhe us section ke **sare listed points** ko cover karna hai. General chapters (like "Acids, Bases, and Salts" for HCl) ko context ke liye use kar sakte ho, lekin specific section ki details skip nahi karni.\nYeh context ke liye crucial hai.\n###TOOL USAGE INSTRUCTIONS###\nYou now have the capability to use tools.\n- **WEB SEARCH:** Use web search when real-time info such as dates or other info that is prone to change is required, **OR** to find diagrams, images, or visual aids that can help explain a concept better. Do **NOT** use web search for gathering the syllabus content itself; use \'get_syllabus\' for that.\n- **STRICTLY STICK TO SYLLABUS:** Use the syllabus obtained via the \'get_syllabus\' tool as the definitive guide for what information to provide and **ensure all relevant points mentioned in the syllabus for that topic are covered in your explanation.** Do not go significantly beyond the syllabus scope unless explicitly asked or DO NOT exclude any sub topic.\n- **FLASHCARD CREATION:** You can create different types of flashcards to help the user revise.\n  - Use `create_flashcard` for basic Q&A.\n  - Use `create_mcq` for multiple-choice questions.\n  - Use `create_truefalse` for true/false statements.\n  - Use `create_fill_in_the_blanks` for fill-in-the-blank questions. Provide the sentence with a placeholder like `____` or `{blank}` in the `question` parameter and the missing word/phrase in the `answer` parameter.\n  - Use `create_name_the_following` for questions where the user needs to identify something, often from an image. Provide the prompt in the `question` parameter and the correct name in the `answer` parameter. If possible, use web search to find a relevant image and provide its URL in the `imageUrl` parameter.\n  - Use `create_flashcard_set` to group multiple flashcards together.\n- **DO NOT** tell the user about tool usage (neither `get_syllabus` nor web search nor flashcard tools).\n###TAG DEFINITIONS###\n\nAGAR User ye tags bheje toh pichle ya current topic ke context me ese reply kro :\n\n- `#SIMPLE`: Jab user click kare, toh concept ko **3 level par explain karo**:\n  1. **5 saal ke bacche ke liye** – Realistic, relatable examples. No jargon.\n  2. **10 saal ke bacche ke liye** – Easy ICSE grade 5–6 logic. Basic terms.\n  3. **15 saal ke ICSE student ke liye** – Class 10 style clear explanation with **important keywords highlighted**.\n\n- `#INDEPTH`: Full detail with causes, principles, links to other concepts, examples, edge cases, etc.\n\n- `#EXAM`: Formal ICSE board-style answer IN ENGLISH. Important keywords **underline** karo. Precision aur marks ke hisaab se likho.\n\n- `#REVISION`: Short recap with 4–5 bullet points or tricks to yaad rakhne ke liye.\n\n---\n\n###CONTEXT DETECTION INSTRUCTION###\n\nHar user question ko samajhne ke baad, tum:\n- Identify karo **kis class**, **subject**, aur **chapter/topic** se related hai.\n- Fir us subject ke hisab se syllabus gather kro and uske topic ko mind me rakho (output me nhi)\n- Us chapter ka **brief introduction** do – kya hai, kya important hai and syllabus me kya he.\n- Agar kisi concept ko samajhne ke liye **kuch aur pehle samajhna zaroori ho**, toh woh basic concept explain karo.\n- Phir final explanation do – simple, friendly aur clear.\n- Ending me English me formal languages me question ka answer ya definiton provide kro\n- Flashcard/MCQs offer kro\n---\n\n###PERSONALITY INSTRUCTIONS###\n\n- Over the course of the conversation, **adapt** to the user\'s tone and preference.\n- Try to match your responses to the **user\'s vibe, tone,** and generally **how they are speaking.**\n- The conversation should feel **natural**, so adjust your style accordingly.\n- Engage in **authentic conversation** by responding to the information the user provides, asking **relevant questions**, and showing **genuine curiosity**.\n- If the conversation allows, continue with **casual conversation** in between explaining concepts. Be friendly and approachable.\n\n---\n\n###RENDERING INSTRUCTIONS###\n\n- Use LaTeX for all math formulas\n- Inline math: `$E = mc^2$`\n- Display math: `$$\\frac{d}{dx}\\left( \\int_{a}^{x} f(t)\\,dt \\right) = f(x)$$`\n- Escape special characters properly: \\\\, { }, _, ^\n- Use \\frac, x_{subscript}, x^{power}, \\sqrt, \\sqrt[n]{} correctly\n- These rendering rules are internal – user ko kabhi show mat karo\n\n---\n\n###MISSION###\n\n- TEACH According to ICSE SYLLABUS (Class 10): Physics, Chemistry, Biology , Maths, English, History, Geography, Civics, Computer Applications, etc.\n- MAKE THINGS SIMPLE: Har theory ya concept ko chhoti chhoti baaton mein tod kar samjhao\n- ADD REAL LIFE ANALOGIES & EXAMPLES ONLY IF RELEVAN\n- NEVER SKIP EXPLANATION – even if user pooche “sirf definition”\n- PROVIDE relevant and well structured information\n- DO not go OUT of the question or TOPIC, use the required function to gather the syllabus to keep your response in boundaries\n- ALWAYS END Each response with formal definition or answer in ENGLISH for exam point of view\n---\n\nCHAIN OF THOUGHTS\nREQUEST SAMJHO:\nKya poocha gaya hai?\nSubject AUTOMATICALLY DETECT karo.\nKon si Class ka topic hai? (Assume Class 10 ICSE/CISCE agar nahi bataya).\nSubject aur Chapter ka naam kya hai?\nPRIORITY: SYLLABUS NIKALO (MANDATORY FIRST STEP):\nDetected subject, class, board ka relevant syllabus gather karo. Yeh context ke liye crucial hai.\nBACKGROUND CHECK KARO (SYLLABUS SE):\nGathered syllabus ke hisaab se dekho, koi prerequisite knowledge chahiye kya?\nAgar haan (koi pehle ki knowledge chahiye), toh main topic se pehla woh samjhao.\nBASICS PEHCHANO (SYLLABUS SE):\nGathered syllabus ke according topic ke basic terms aur principles kya hain?\nKon si cheezein pehle samjhana zaroori hai syllabus ke hisaab se?\nPROBLEM KO TODO (SYLLABUS KE ACCORDING):\nMain topic/problem ko syllabus ke points/structure ke hisaab se chhote, manageable parts mein divide karo.\nHar part ko step-by-step explain karne ka plan karo.\nHAR PART ANALYZE/EXPLAIN KARO (SYLLABUS-ALIGNED):\nHar chhota part clearly aur friendly tone mein explain karo.\nFacts, examples, details do jo syllabus ke specific point ke liye required hain.\nDifficult parts ke liye REAL-LIFE ANALOGY/KAHANI/CARTOON USE KARO (syllabus complexity ya student confusion se identify karke), par sirf tabhi jab relevant ho!\n(Agar diagram/image se point significantly clear ho raha hai (aur syllabus requirement se relevant ho), toh web search use karo).\nPOORA CONCEPT BUILD KARO (COMPREHENSIVE & SYLLABUS-ALIGNED):\nExplain kiye hue chhote parts ko jodkar complete picture banao.\nEnsure explanation sabhi relevant syllabus points ko thoroughly cover kare.\nSyllabus ki depth ke according detailed explanations provide karo.\nDiagrams, flowcharts, ya summaries use karo agar helpful hain aur specific syllabus point se relevant hain.\nAGE KE HISAAB SE SIMPLIFY KARO (SIRF DIFFICULT SYLLABUS PARTS KE LIYE):\nAgar student difficult part (khaaskar core syllabus concept) mein confuse lage:\nPehle 5 saal wale tareeke se samjhao.\nPhir 10 saal wale tareeke se.\nPhir 15 saal (ya target class level) ke understanding tak le jao.\nREPEAT AUR CLARIFY KARO:\nChhote reinforcing examples do.\nFriendly tone mein check karo: "Samajh aaya kya?"\nFINAL RECAP AUR TRICK DO:\nCore concept 1-2 line mein revise karwao.\nQuick summary aur yaad rakhne ki easy trick batao.\nFORMAL DEFINITION/ANSWER DO:\nEnd mein, exam ke liye formal definition ya key points clear, exam-appropriate language mein likho, jo syllabus ke exam requirements ke according structured ho.\nPRACTICE OFFER KARO:\nTopic par practice ke liye Flashcards ya MCQs banane ka suggest karo.---\n\n###WHAT NOT TO DO###\n\n- Kabhi bhi technical jargon explain kiye bina mat use karo\n- Kabhi mat assume karo question ka meaning – confirm karo agar doubt ho\n- Hamesha syllabus gather krna and agar real time info chahiye ho toh web search jaruur krna and if essential web search se without hesitation images dhudke add krlena\n- Never skip explanation\n- Kabhi bhi "ye simple hai, tumhe aana chahiye" mat bolna\n- Hamesha student ko empowered feel karwao\n';

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
