import { useState, useEffect, useRef } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const initialConversations: Conversation[] = [
  {
    id: "1",
    title: "Conversation 1",
    messages: [
      {
        id: "m1",
        content: "Hello! How can I help you today?",
        role: "assistant",
        timestamp: new Date("2024-01-15T10:00:00")
      },
      {
        id: "m2",
        content: "I'd like to learn about React development",
        role: "user",
        timestamp: new Date("2024-01-15T10:01:00")
      },
      {
        id: "m3",
        content: "Great! React is a popular JavaScript library for building user interfaces. What specific aspect would you like to explore?",
        role: "assistant",
        timestamp: new Date("2024-01-15T10:01:30")
      }
    ]
  },
  {
    id: "2",
    title: "Conversation 2",
    messages: [
      {
        id: "m4",
        content: "What's the weather like today?",
        role: "user",
        timestamp: new Date("2024-01-14T15:30:00")
      },
      {
        id: "m5",
        content: "I don't have access to real-time weather data, but I'd be happy to help you find weather information or assist with other questions!",
        role: "assistant",
        timestamp: new Date("2024-01-14T15:30:15")
      }
    ]
  },
  {
    id: "3",
    title: "Conversation 3",
    messages: [
      {
        id: "m6",
        content: "Can you help me with a coding problem?",
        role: "user",
        timestamp: new Date("2024-01-13T09:15:00")
      },
      {
        id: "m7",
        content: "Absolutely! I'd be happy to help you with your coding problem. Please share the details of what you're working on.",
        role: "assistant",
        timestamp: new Date("2024-01-13T09:15:10")
      }
    ]
  },
  {
    id: "4",
    title: "Conversation 4",
    messages: [
      {
        id: "m8",
        content: "What are some good practices for web development?",
        role: "user",
        timestamp: new Date("2024-01-12T14:20:00")
      }
    ]
  },
  {
    id: "5",
    title: "Conversation 5",
    messages: []
  }
];

const mockResponses = [
  "This is a mock GPT response.",
  "I understand what you're asking. This is a simulated AI response for demonstration purposes.",
  "That's an interesting question! Here's a mock response to show how the chat interface works.",
  "Thank you for your message. This is an automated response to simulate AI interaction.",
  "I'm here to help! This is a placeholder response while we demonstrate the chat functionality.",
  "Great point! This mock response shows how the conversation flow works in this demo.",
  "I see what you mean. This is a simulated response to keep the conversation going.",
  "That's a thoughtful message. Here's a mock AI response to demonstrate the interface."
];

export default function Index() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(initialConversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation.messages]);

  // Generate a unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Generate conversation title from first message
  const generateTitle = (firstMessage: string) => {
    const words = firstMessage.split(' ').slice(0, 4);
    return words.length > 0 ? words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '') : 'New Conversation';
  };

  // Create new conversation
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "New Conversation",
      messages: []
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setSidebarOpen(false);
  };

  // Add message to conversation
  const addMessageToConversation = (conversationId: string, message: Message) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedConv = { ...conv, messages: [...conv.messages, message] };
          
          // Update title if this is the first user message
          if (conv.messages.length === 0 && message.role === "user") {
            updatedConv.title = generateTitle(message.content);
          }
          
          return updatedConv;
        }
        return conv;
      })
    );

    // Update selected conversation if it's the current one
    if (selectedConversation.id === conversationId) {
      setSelectedConversation(prev => {
        const updatedConv = { ...prev, messages: [...prev.messages, message] };
        
        // Update title if this is the first user message
        if (prev.messages.length === 0 && message.role === "user") {
          updatedConv.title = generateTitle(message.content);
        }
        
        return updatedConv;
      });
    }
  };

  // Get random mock response
  const getMockResponse = () => {
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      content: messageInput.trim(),
      role: "user",
      timestamp: new Date()
    };

    // Add user message
    addMessageToConversation(selectedConversation.id, userMessage);
    setMessageInput("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const assistantMessage: Message = {
        id: generateId(),
        content: getMockResponse(),
        role: "assistant",
        timestamp: new Date()
      };

      addMessageToConversation(selectedConversation.id, assistantMessage);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Update selected conversation when conversations change
  useEffect(() => {
    const currentConv = conversations.find(conv => conv.id === selectedConversation.id);
    if (currentConv) {
      setSelectedConversation(currentConv);
    }
  }, [conversations, selectedConversation.id]);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <button 
            onClick={createNewConversation}
            className="flex items-center gap-2 w-full p-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">New chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full text-left p-3 rounded-lg mb-1 transition-colors
                  hover:bg-gray-800 flex items-center gap-2
                  ${selectedConversation.id === conversation.id ? 'bg-gray-800' : ''}
                `}
              >
                <MessageCircle size={16} className="flex-shrink-0" />
                <span className="text-sm truncate">{conversation.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {selectedConversation.title}
          </h1>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {selectedConversation.messages.length > 0 ? (
              <>
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-2xl ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${message.role === "user" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-200 text-gray-700"
                        }
                      `}>
                        {message.role === "user" ? "U" : "AI"}
                      </div>

                      {/* Message Content */}
                      <div className={`
                        p-4 rounded-2xl
                        ${message.role === "user" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-900"
                        }
                      `}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-2xl">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-700">
                        AI
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-100 text-gray-900">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-500">Send a message to begin chatting</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full p-3 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{
                    minHeight: "48px",
                    maxHeight: "120px",
                  }}
                  disabled={isTyping}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isTyping}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
