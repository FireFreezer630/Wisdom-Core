import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const {
    conversations,
    activeConversationId,
    addConversation,
    deleteConversation,
    setActiveConversation,
    updateConversation,
    settings,
  } = useChatStore();

  const handleNewConversation = () => {
    const newConversation = {
      id: crypto.randomUUID(),
      title: `New Chat`,
      systemPrompt: settings.defaultSystemPrompt,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addConversation(newConversation);
    setEditingId(newConversation.id);
    setEditTitle('New Chat');
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

  return (
    <div 
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-white h-screen border-r border-gray-200 flex flex-col transition-all duration-300 relative`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      <button
        onClick={handleNewConversation}
        className={`flex items-center gap-2 mx-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-4 ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <Plus className="h-5 w-5" />
        {!isCollapsed && <span>New Chat</span>}
      </button>

      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
              activeConversationId === conversation.id
                ? 'bg-purple-100'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setActiveConversation(conversation.id)}
          >
            <MessageSquare className="h-5 w-5 text-gray-600 flex-shrink-0" />
            
            {!isCollapsed && (
              editingId === conversation.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(conversation.id);
                    }}
                    className="p-1 hover:text-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                    className="p-1 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate">{conversation.title}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(conversation.id, conversation.title);
                      }}
                      className="p-1 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="p-1 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};