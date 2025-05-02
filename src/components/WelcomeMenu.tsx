import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, MessageSquare, Image, Search, BookOpen, CheckSquare, ChevronRight } from 'lucide-react';
import { useTheme } from '../lib/ThemeProvider';

interface WelcomeMenuProps {
  onContinue: () => void;
}

const WelcomeMenu: React.FC<WelcomeMenuProps> = ({ onContinue }) => {
  const { isDarkMode } = useTheme();

  const featureItems = [
    { icon: MessageSquare, text: 'Friendly Hinglish Explanations' },
    { icon: Image, text: 'Image Support' },
    { icon: BookOpen, text: 'Flashcards, MCQs, and Quizzes' },
    { icon: Search, text: 'Web Search for Syllabus & Info' },
    { icon: CheckSquare, text: 'Strict Syllabus Adherence' },
  ];

  const bgColor = isDarkMode ? 'bg-app-bg-dark' : 'bg-gradient-to-br from-app-bg-light to-app-bg';
  const cardColor = isDarkMode ? 'bg-app-card-dark border-gray-700' : 'bg-app-card-light border-app-bg';
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const featureTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const buttonColor = 'bg-app-purple text-white hover:bg-app-purple-dark';

  return (
    <motion.div
      className={`min-h-screen flex items-center justify-center p-4 ${bgColor}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`${cardColor} shadow-app dark:shadow-app-dark rounded-2xl p-8 max-w-lg w-full text-center border`}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GraduationCap className="h-16 w-16 mx-auto mb-6 text-app-purple" />
        <h1 className={`text-3xl font-bold mb-4 ${textColor}`}>Welcome to WisdomCore!</h1>
        <p className={`text-lg mb-8 ${featureTextColor}`}>
          Your personal AI tutor for ICSE/CISCE curriculum. Here's what I can do:
        </p>

        <ul className="text-left space-y-4 mb-8">
          {featureItems.map((feature, index) => (
            <motion.li
              key={index}
              className={`flex items-center ${featureTextColor}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <feature.icon className="h-6 w-6 text-app-purple mr-3 flex-shrink-0" />
              <span>{feature.text}</span>
            </motion.li>
          ))}
          <motion.li
             className={`flex items-center ${featureTextColor}`}
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ duration: 0.3, delay: 0.4 + featureItems.length * 0.1 }}
          >
             <ChevronRight className="h-6 w-6 text-app-purple mr-3 flex-shrink-0" />
             <span>And more coming soon!</span>
          </motion.li>
        </ul>

        <motion.button
          onClick={onContinue}
          className={`w-full px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${buttonColor}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + (featureItems.length + 1) * 0.1 }}
        >
          Continue to Chat
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeMenu;