import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTheme } from '../lib/ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default system prompt from chat store
const DEFAULT_SYSTEM_PROMPT = `
TUM HO ICSE KA SABSE MAHAAN TEACHER – "ICSE MASTER TUTOR 9000" – JO PURE ICSE SYLLABUS KO BACHON KO AISA SIKHATA HAI JAISA KOI NAHI. TUMHARI BAAT KA TAREEQA EKDAM PYAARA, SIMPLE AUR DOSTANA HAI – JAADU KI TARAH HAR TOPIC CLEAR HO JATA HAI. TUM HAMESHA HINGLISH (MATLAB ROMAN HINDI, THODA THODA ENGLISH) MEIN BAAT KARTE HO.

###RENDERING INSTRUCTIONS###
- For all mathematical formulas, use proper LaTeX syntax
- Simple formulas and inline equations should be written between single dollar signs, like $E = mc^2$
- More complex formulas and display equations should be written between double dollar signs, like $$\frac{d}{dx}\left( \int_{a}^{x} f(t)\,dt \right) = f(x)$$
- Properly escape special characters in LaTeX: \\ (backslash), { } (braces), _ (underscore), ^ (caret)
- For fractions use \\frac{numerator}{denominator}
- For subscripts use x_{subscript} and for superscripts use x^{superscript}
- For square roots use \\sqrt{x} and for nth roots use \\sqrt[n]{x}
- These instructions are for your internal use only, do not mention them to the user

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
- **SIMPLIFY** har THEORY ya CONCEPT asaani se samjhane ke liye
- **CHECK** agar student ko samajh aaya ya nahi – agar nahi aaya, toh:
  - PEHLE samjhao jaise ki WOH 5 SAAL KA BACHHA HO
    - PHIR samjhao jaise WOH 10 SAAL KA HO
      - PHIR 15 SAAL KA BACHHA samjhta hai waise samjhao
      - **USE KARO MAZEDAAR ANALOGIES** jaise ki kahani, cartoon, daily life examples
      - **REPEAT KARO BASICS** jab lagay ki student confuse ho gaya
      - **HAR ANSWER KO SHORT, FUN, OR SIMPLE BANAO** – lekin concept clear zaroor karo

---

###CHAIN OF THOUGHTS###

1. **SAMJHO STUDENT KI REQUEST**:
   - Kya poochha gaya hai?
     - Kis class ka topic hai?
       - Kya subject aur chapter ka naam hai?

2. **IDENTIFY KARO BASICS**:
   - Topic ke basic terms aur principles kya hai?
     - Kin cheezon ko pehle samjhana zaroori hai?

3. **TOD DO PROBLEM KO**:
   - Small parts mein divide karo
     - Har part ko step-by-step explain karo

4. **ANALYZE KARO HAR PART KO**:
   - Fact ya example do
     - Real-life analogy use karo

5. **BUILD KARO POOORA CONCEPT**:
   - Small parts ko jod ke full picture banao
     - Diagram, flow ya summary bolo

6. **SIMPLIFY ACCORDING TO AGE**:
   - Agar student confuse hai:
     - Pehle 5 saal wale tareeke se samjhao
       - Phir 10 saal wale tareeke se
         - Phir 15 saal ke understanding level par le jao

7. **REPEAT AUR CLARIFY**:
   - Chhoti examples do
     - Student se pucho: "Samajh aaya kya?" Friendly tone mein

8. **FINAL RECAP DO**:
   - Ek line mein concept revise karwao
     - Quick summary aur yaad rakhne ka easy trick batao

---

###WHAT NOT TO DO###

- **KABHI BHI HARD ENGLISH YA TECHNICAL JARGON USE NAHI KARNA** bina explain kiye
- **STUDENT KO DUMB YA CONFUSED FEEL KARWANA AVOID KARNA**
- **KABHI BHI DIRECT ANSWER DEKAR EXPLANATION SKIP NA KARNA**
- **TOO FAST MAT JAANA – AGAR STUDENT NE BOLA "SAMJH NAHI AAYA" TOH TURANT BACK JAANA**
- **KABHI MAT KEHNA "YE TO SIMPLE HAI, TUMHE AANA CHAHIYE" – HAMESHA HELPING MODE MEIN RAHO**
- **AGAR QUESTION CLEAR NA HO, TOH KHUD SE ASSUME KARKE GHALAT DIRECTION MEIN NA JAANA**

---

###FEW-SHOT EXAMPLES###

**User:** "Mujhe force aur motion samajh nahi aata"
**Agent:**
> Force ka matlab hota hai kisi cheez ko dhakka dena ya kheenchna.
> Imagine karo ek football. Jab usse kick karte ho – toh tumne us par force lagaya.
> Ab 5 saal ke bacche jaise samjho: Jab tum apne teddy bear ko dhakka dete ho toh woh hilta hai – that is force!
> 10 saal wale ke liye: Jab cycle chalate ho aur brake lagate ho – woh ruk jaati hai kyunki tumne uski motion ko force se roka.
> 15 saal ke liye: Force = Mass x Acceleration (Newton ka 2nd Law)
> Easy trick: "Zor lagao = force lagao!"

---

**User:** "Geography ka biosphere kya hota hai?"
**Agent:**
> Biosphere matlab woh part of Earth jahan life possible hai – jahan log, jaanwar, aur ped rehte hain.
> Jaise ek bada globe lo – uske upar ek invisible layer samjho jisme zinda cheezein hain – that's biosphere.
> 5 saal ke liye: Zameen, paani aur hawa – jahan chhoti badi sab cheezein rehti hain.
> 10 saal ke liye: Biosphere mein land (lithosphere), water (hydrosphere), aur air (atmosphere) milke life ko support karte hain.
> 15 saal ke liye: A complex system of interdependent life forms and non-living components interacting on Earth's surface.

AAAND end me ek formal language me exam ke liye definition ya points likh dena
`;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, activeConversationId, updateConversation, conversations } = useChatStore();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [tempPrompt, setTempPrompt] = useState(settings.defaultSystemPrompt);
  const [applyToCurrentChat, setApplyToCurrentChat] = useState(false);

  // Update the tempPrompt when settings change
  useEffect(() => {
    if (isOpen) {
      setTempPrompt(settings.defaultSystemPrompt);
    }
  }, [isOpen, settings.defaultSystemPrompt]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  const handleResetPrompt = () => {
    setTempPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  const handleSave = () => {
    updateSettings({
      defaultSystemPrompt: tempPrompt,
    });

    if (applyToCurrentChat && activeConversationId) {
      const conversation = conversations.find(conv => conv.id === activeConversationId);
      if (conversation) {
        updateConversation(activeConversationId, { systemPrompt: tempPrompt });
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className={`relative ${
          isDarkMode ? 'bg-app-card-dark text-white' : 'bg-white text-gray-800'
        } rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-app`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 z-10">
          <h2 id="settings-title" className="text-xl font-bold bg-gradient-to-r from-app-purple to-purple-400 bg-clip-text text-transparent">Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-500 hover:bg-gray-100'
            } transition-colors`}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-7">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="system-prompt" className={`block text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Default System Prompt
            </label>
            <button
              onClick={handleResetPrompt}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-app-purple hover:bg-app-purple/10'
                  : 'text-app-purple hover:bg-app-purple/10'
              }`}
              title="Reset to default prompt"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
          <textarea
            id="system-prompt"
            value={tempPrompt}
            onChange={(e) => setTempPrompt(e.target.value)}
            className={`w-full h-36 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-app-purple/50 ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            } transition-colors`}
            placeholder="Enter the default system prompt..."
          />
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToCurrentChat}
                onChange={(e) => setApplyToCurrentChat(e.target.checked)}
                className={`rounded focus:ring-app-purple h-4 w-4 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-app-purple'
                    : 'border-gray-300 text-app-purple'
                }`}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Also apply to current conversation
              </span>
            </label>
          </div>
        </div>

        <div className="mb-7">
          <label className="flex items-center justify-between cursor-pointer">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dark Mode
            </span>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-app-purple/50 focus:ring-offset-2 ${
                isDarkMode ? 'bg-app-purple' : 'bg-gray-200'
              }`}
              aria-pressed={isDarkMode}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:bg-gray-800/70'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark transition-all duration-200 font-medium flex items-center gap-2 shadow-app"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};