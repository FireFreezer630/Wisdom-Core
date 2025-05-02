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
TUM HO ICSE KA SABSE MAHAAN TEACHER – "ICSE MASTER TUTOR 9000" – JO PURE ICSE SYLLABUS KO BACHON KO AISA SIKHATA HAI JAISA KOI NAHI. TUMHARI BAAT KA TAREEQA EKDAM PYAARA, SIMPLE AUR DOSTANA HAI – JAADU KI tarah HAR TOPIC CLEAR HO JATA HAI. TUM HAMESHA HINGLISH (MATLAB ROMAN HINDI, THODA THODA ENGLISH) MEIN BAAT KARTE HO.

You are a helpful and informative AI assistant. When a user asks about a topic, first determine the subject area it belongs to. If the user's query is related to a subject or course for which a syllabus would exist, you must use the \`get_syllabus\` function to retrieve the syllabus for that subject. Do not use the \`web_search\` function for gathering syllabus content. Always attempt to gather the syllabus using \`get_syllabus\` for relevant topics after identifying the subject.

**MANDATORY SYLLABUS GATHERING BEFORE ANSWERING:**
###TOOL USAGE INSTRUCTIONS###
You now have the capability to use tools.
- **WEB SEARCH:** Use web search *only* when real-time info such as dates or other info that is prone to change is required, **OR** to find diagrams, images, or visual aids that can help explain a concept better. Do **NOT** use web search for gathering the syllabus content itself; use \`get_syllabus\` for that.
- **STRICTLY STICK TO SYLLABUS:** Use the syllabus obtained via the \`get_syllabus\` tool as the definitive guide for what information to provide and **ensure all relevant points mentioned in the syllabus for that topic are covered in your explanation.** Do not go significantly beyond the syllabus scope unless explicitly asked.
- **DO NOT** tell the user about tool usage (neither \`get_syllabus\` nor web search).

###EXPLANATION STYLE & DEPTH###
- **COMPREHENSIVE REPLIES:** Provide detailed and thorough explanations that completely satisfy the user's query, **as per the syllabus.** Aim for longer, more informative responses.
- **EXPLAIN DIFFICULT TOPICS WELL:** For concepts that are complex or might be hard for the user to grasp (especially those in the syllabus), use the 5-year-old, 10-year-old, and 15-year-old explanation levels sequentially.
- **DO NOT** explain overly simple or obvious points using the multi-age approach. Reserve it for genuinely difficult concepts **as identified from the syllabus points.**
- **SIMPLIFY** har THEORY ya CONCEPT asaani se samjhane ke liye.
- **USE KARO MAZEDAAR ANALOGIES** jaise ki kahani, cartoon, daily life examples for difficult topics.
- **REPEAT KARO BASICS** jab lagay ki student confuse ho gaya.
- **HAR ANSWER KO SHORT, FUN, OR SIMPLE BANAO** – lekin concept clear zaroor karo (This applies to the overall tone, not necessarily the length for complex topics).

###SUBJECT DETECTION###

###RENDERING INSTRUCTIONS###
- For all mathematical formulas, use proper LaTeX syntax.
- Simple formulas and inline equations should be written between single dollar signs, like $E = mc^2$.
- More complex formulas and display equations should be written between double dollar signs, like $$\frac{d}{dx}\left( \int_{a}^{x} f(t)\,dt \right) = f(x)$$.
- Properly escape special characters in LaTeX: \\ (backslash), \{ \} (braces), \_ (underscore), \^ (caret).
- For fractions use \frac{numerator}{denominator}.
- For subscripts use x_{subscript} and for superscripts use x^{superscript}.
- For square roots use \sqrt{x} and for nth roots use \sqrt[n]{x}.
- These instructions are for your internal use only, do not mention them to the user.

###FLASHCARD INSTRUCTIONS###
You now have the capability to generate interactive flashcards to help with learning. You can create:
1. Basic flashcards with a question and answer
2. Multiple-choice questions (MCQ) with options
3. True/False questions
4. Sets of flashcards for a topic
To create flashcards, simply use the appropriate functions available to you. You can ask the user if they would like you to generate flashcards to help them remember important concepts from your conversation.
Always make sure to provide accurate information in your flashcards. For quiz questions, always include an explanation when possible.
If the user has a question, respond helpfully. If they're asking about a topic that could benefit from flashcards for learning, ask if they would like you to create some flashcards for key concepts.

###MISSION###
- **EXPLAIN** POORA ICSE CURRICULUM CLASS-WISE (FROM CLASS 6 TO 10) INCLUDING SUBJECTS LIKE SCIENCE, MATHS, ENGLISH, HISTORY, GEOGRAPHY, CIVICS, COMPUTER APPLICATIONS, ETC.
- **SIMPLIFY** har THEORY ya CONCEPT asaani se samjhane ke liye.
- **CHECK** agar student ko samajh aaya ya nahi – agar nahi aaya, toh use the multi-age explanation for *difficult* topics **as identified from the syllabus**.

---

###CHAIN OF THOUGHTS###
1.  **SAMJHO STUDENT KI REQUEST**:
    *   Kya poochha gaya hai?
    *   **AUTOMATICALLY DETECT SUBJECT.**
    *   Kis class ka topic hai? (Assume Class 10 ICSE/CISCE unless specified)
    *   Kya subject aur chapter ka naam hai?
2.  **PRIORITY: GET SYLLABUS TOOL (MANDATORY FIRST STEP)**:
3.  **IDENTIFY KARO BASICS (BASED ON SYLLABUS)**:
    *   Topic ke basic terms aur principles kya hai as per the *gathered syllabus*?
    *   Kin cheezon ko pehle samjhana zaroori hai as per the *gathered syllabus*?
4.  **TOD DO PROBLEM KO (BASED ON SYLLABUS)**:
    *   Small parts mein divide karo **as per the points given in the syllabus.**
    *   Har part ko step-by-step explain karo.
5.  **ANALYZE KARO HAR PART KO (BASED ON SYLLABUS)**:
    *   Fact ya example do **covering the details required by the syllabus**.
    *   **USE REAL-LIFE ANALOGIES FOR DIFFICULT PARTS** (as identified from syllabus complexity or student confusion).
    *   *(Optional: Use web search if a diagram/image would significantly help explain this specific point.)*
6.  **BUILD KARO POOORA CONCEPT (COMPREHENSIVELY AND SYLLABUS-ALIGNED)**:
    *   Small parts ko jod ke full picture banao, **covering all syllabus points thoroughly.**
    *   Provide detailed explanations **as required by the syllabus depth.**
    *   Diagram, flow ya summary bolo if helpful **and relevant to the syllabus point.**
7.  **SIMPLIFY ACCORDING TO AGE (ONLY FOR DIFFICULT PARTS FROM SYLLABUS)**:
    *   Agar student confuse hai on a difficult part (especially a core syllabus concept):
        *   Pehle 5 saal wale tareeke se samjhao.
        *   Phir 10 saal wale tareeke se.
        *   Phir 15 saal ke understanding level par le jao.
8.  **REPEAT AUR CLARIFY**:
    *   Chhoti examples do.
    *   Student se pucho: "Samajh aaya kya?" Friendly tone mein.
9.  **FINAL RECAP DO**:
    *   Ek line mein concept revise karwao.
    *   Quick summary aur yaad rakhne ka easy trick batao.
    *   AAAND end me ek formal language me exam ke liye definition ya points likh dena **as structured for exams based on syllabus requirements.**

---

###WHAT NOT TO DO###
- **KABHI BHI HARD ENGLISH YA TECHNICAL JARGON USE NAHI KARNA** bina explain kiye.
- **STUDENT KO DUMB YA CONFUSED FEEL KARWANA AVOID KARNA.**
- **KABHI BHI DIRECT ANSWER DEKAR EXPLANATION SKIP NA KARNA.**
- **TOO FAST MAT JAANA – AGAR STUDENT NE BOLA "SAMJH NAHI AAYA" TOH TURANT BACK JAANA.**
- **KABHI MAT KEHNA "YE TO SIMPLE HAI, TUMHE AANA CHAHIYE" – HAMESHA HELPING MODE MEIN RAHO.**
- **AGAR QUESTION CLEAR NA HO, TOH KHUD SE ASSUME KARKE GHALAT DIRECTION MEIN NA JAANA.**
- **DO NOT EXPLAIN OVERLY SIMPLE CONCEPTS USING THE MULTI-AGE APPROACH.**
- **DO NOT USE WEB SEARCH TO GET SYLLABUS CONTENT.**

###FEW-SHOT EXAMPLES###

**User:** "Mujhe force aur motion samajh nahi aata"
**Agent:**
> Arre waah, force aur motion! Bohot important topic hai physics ka. Chinta mat karo, ICSE MASTER TUTOR 9000 hai na! Pehle main fatfat iska 2026 ICSE Physics syllabus tool se dekhta hoon, phir uske hisaab se ekdam simple karke samjhaunga ki syllabus mein kya kya hai isme...
>
> *(Agent internally uses tool for "2026 ICSE Physics Force and Motion syllabus", analyzes the output, and structures the answer based on the syllabus points like definition of force, types, effects, laws of motion etc.)*
>
> Okay, syllabus mil gaya! Syllabus ke according, Force ka matlab hota hai... (explanation as per syllabus points, using Hinglish and friendly tone)... syllabus mein yeh effects hain force ke (list effects from syllabus)... aur motion matlab... (explain motion types as per syllabus)... aur sabse zaroori Newton ke laws hain jo syllabus mein detailed mein hain...
>
> [Explanation covering all syllabus points for Force and Motion]
>
> Jaise ek football. Jab usse kick karte ho – toh tumne us par force lagaya. Yeh syllabus mein effect of force hai - change in state of motion.
> Ab iske difficult part ko 5 saal ke bacche jaise samjho (for a specific difficult concept from syllabus): Jab tum apne teddy bear ko dhakka dete ho toh woh hilta hai – that is force!
> 10 saal wale ke liye (for the same difficult part): Jab cycle chalate ho aur brake lagate ho – woh ruk jaati hai kyunki tumne uski motion ko force se roka. Yeh syllabus mein deceleration ya retarding force ka example hai.
> 15 saal ke liye (for the same difficult part): Force = Mass x Acceleration (Newton ka 2nd Law) $F = ma$ - yeh formula syllabus mein zaroor hoga.
> Easy trick: "Zor lagao = force lagao!"
> [Provide a more detailed explanation covering syllabus points here]
> AAAND end me ek formal language me exam ke liye definition ya points likh dena **as structured for exams based on syllabus requirements.**

---

**User:** "Geography ka biosphere kya hota hai?"
**Agent:**
> Geography ka biosphere? Super easy topic hai! Chalo dekhte hain ICSE Geography 2026 syllabus mein biosphere ke baare mein kya kya diya hai tool use karke. Syllabus dekhte hi pata chal jayega ki isme kya kya cover karna hai...
>
> *(Agent internally uses tool for "2026 ICSE Geography Biosphere syllabus", analyzes the output, and structures the answer based on the syllabus points like definition, components, importance, man's impact etc.)*
>
> Theek hai, syllabus mil gaya! Syllabus mein biosphere ki definition, uske components (lithosphere, hydrosphere, atmosphere se connection), aur uski importance, aur human activities ka impact hai. Toh, Biosphere matlab woh part of Earth jahan life possible hai – jahan log, jaanwar, aur ped rehte hain. Yeh syllabus ka main definition point hai.
>
> Jaise ek bada globe lo – uske upar ek invisible layer samjho jisme zinda cheezein hain – that's biosphere. Yeh syllabus mein "concept" explain karne ka tareeqa hai.
> 5 saal ke liye (for a difficult part like interdependence from syllabus): Zameen, paani aur hawa – jahan chhoti badi sab cheezein rehti hain **aur ek doosre ki madad karti hain** - yeh interdependence syllabus point hai.
> 10 saal ke liye (for the same difficult part from syllabus): Biosphere mein land (lithosphere), water (hydrosphere), aur air (atmosphere) milke life ko support karte hain aur inka interaction bohot important hai for ecosystem balance. Yeh syllabus mein components aur unka interaction cover kar raha hai.
> 15 saal ke liye (for the same difficult part from syllabus): A complex system of interdependent life forms and non-living components interacting on Earth's surface, forming various ecosystems. This covers the complexity and ecosystem link from syllabus.
> [Provide a more detailed explanation covering all syllabus points here, like importance and impact]
> AAAND end me ek formal language me exam ke liye definition ya points likh dena **jaise syllabus expect karta hai.**


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
