import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Edit2, Check, X, Menu } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTheme } from '../lib/ThemeProvider';
import { motion } from 'framer-motion'; // Import motion

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { isDarkMode } = useTheme();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    activeConversationId,
    addConversation,
    deleteConversation,
    setActiveConversation,
    updateConversation,
    settings,
  } = useChatStore();

  // Check screen size for mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Set to collapsed by default on mobile
        setIsCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isCollapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);

  const handleNewConversation = () => {
    const newConversation = {
      id: crypto.randomUUID(),
      title: `New Chat ${new Date().toLocaleString()}`, // Use a default title with timestamp
      systemPrompt: settings.defaultSystemPrompt,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addConversation(newConversation);
    // Removed setEditingId and setEditTitle to prevent immediate naming prompt

    // Open sidebar when creating new conversation
    setIsCollapsed(false);
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      updateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Hide sidebar when conversation is selected on mobile
  const handleConversationSelect = (id: string) => {
    setActiveConversation(id);
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  const sidebarBg = isDarkMode ? 'bg-app-card-dark' : 'bg-app-card-light';

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed z-50 top-4 left-4 p-2 rounded-xl bg-app-purple text-white shadow-md hover:bg-app-purple-dark transition-colors"
        aria-label="Toggle sidebar"
        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isCollapsed ? (
          <Menu className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>

      {/* Overlay backdrop for mobile - only visible when sidebar is open */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out md:hidden ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <motion.div // Use motion.div for animation
        ref={sidebarRef}
        className={`fixed md:fixed top-0 left-0 h-full z-40 ${sidebarBg}
          ${isDarkMode ? 'border-r border-gray-800' : 'border-r border-gray-200'}
          shadow-lg rounded-tr-2xl rounded-br-2xl overflow-hidden`}
        initial={{ x: '-100%' }} // Initial state: off-screen to the left
        animate={{ x: isCollapsed ? '-100%' : '0%' }} // Animate based on isCollapsed state
        transition={{ duration: 0.3, ease: "easeOut" }} // Animation duration and easing
        style={{ width: '16rem' }} // Keep a fixed width and use transform for animation
      >
        {/* Content */}
        <div className="h-full flex flex-col pt-16 overflow-x-hidden px-3">
          <button
            onClick={handleNewConversation}
            className="flex items-center justify-center gap-2 mx-1 px-4 py-3 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark mb-6 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">New Chat</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 p-1 pb-32 scrollbar-thin">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeConversationId === conversation.id
                    ? isDarkMode ? 'bg-app-purple/30 text-white' : 'bg-app-purple/10 text-gray-800'
                    : isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleConversationSelect(conversation.id)}
              >
                <MessageSquare className={`h-5 w-5 ${
                  activeConversationId === conversation.id
                    ? 'text-app-purple'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                } flex-shrink-0`} />

                {editingId === conversation.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`flex-1 px-3 py-1 text-sm border rounded-lg transition-colors ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit(conversation.id);
                      }}
                      className="p-1 hover:text-green-600 transition-colors"
                      aria-label="Save edit"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      className="p-1 hover:text-red-600 transition-colors"
                      aria-label="Cancel edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate font-medium">{conversation.title}</span>
                    <div className="group-hover:opacity-100 flex gap-1 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(conversation.id, conversation.title);
                        }}
                        className="p-1 hover:text-app-purple transition-colors"
                        aria-label="Edit conversation title"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="p-1 hover:text-red-600 transition-colors"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div> {/* Close motion.div */}
    </>
  );
};