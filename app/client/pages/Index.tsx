import { useState, useEffect, useRef } from "react";
import { MessageCircle, Plus, Send, Trash2 } from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

export default function ChatInterface() {
  const [conversations, setConversations] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationTitles, setConversationTitles] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchHistory(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateTitleFromMessage = (message) => {
    const words = message.split(' ');
    if (words.length <= 5) {
      return message;
    }
    return words.slice(0, 5).join(' ') + '...';
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`);
      const data = await response.json();
      setConversations(data);

      const titlesPromises = data.map(async (conv) => {
        if (!conversationTitles[conv.session_id]) {
          try {
            const historyResponse = await fetch(`${API_BASE_URL}/history/${conv.session_id}`);
            const historyData = await historyResponse.json();
            if (historyData.length > 0) {
              const firstUserMessage = historyData.find(msg => msg.role === 'human');
              if (firstUserMessage) {
                return {
                  sessionId: conv.session_id,
                  title: generateTitleFromMessage(firstUserMessage.content)
                };
              }
            }
          } catch (error) {
            console.error("Failed to fetch history for title:", error);
          }
        }
        return null;
      });

      const titles = await Promise.all(titlesPromises);
      const newTitles = { ...conversationTitles };
      titles.forEach(item => {
        if (item) {
          newTitles[item.sessionId] = item.title;
        }
      });
      setConversationTitles(newTitles);

      if (data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].session_id);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchHistory = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${sessionId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const createNewConversation = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSelectedSessionId(newSessionId);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    const userMessage = messageInput.trim();
    setMessageInput("");
    setIsLoading(true);

    const tempMessages = [...messages, { role: "human", content: userMessage }];
    setMessages(tempMessages);

    if (messages.length === 0) {
      setConversationTitles(prev => ({
        ...prev,
        [selectedSessionId]: generateTitleFromMessage(userMessage)
      }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: selectedSessionId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      setMessages([...tempMessages, { role: "ai", content: data.answer }]);

      await fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (sessionId) => {
    try {
      await fetch(`${API_BASE_URL}/reset/${sessionId}`, {
        method: "POST",
      });

      setConversationTitles(prev => {
        const newTitles = { ...prev };
        delete newTitles[sessionId];
        return newTitles;
      });

      if (sessionId === selectedSessionId) {
        setMessages([]);
        const remainingConversations = conversations.filter(c => c.session_id !== sessionId);
        if (remainingConversations.length > 0) {
          setSelectedSessionId(remainingConversations[0].session_id);
        } else {
          createNewConversation();
        }
      }

      await fetchConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationTitle = (sessionId) => {
    return conversationTitles[sessionId] || "New Conversation";
  };

  return (
      <div className="flex h-screen bg-white">
        <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
        w-72 bg-gray-900 text-white transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
          <div className="p-4 border-b border-gray-700">
            <button
                onClick={createNewConversation}
                className="flex items-center gap-2 w-full p-3 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
              <span>New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {conversations.map((conversation) => (
                  <div
                      key={conversation.session_id}
                      className={`
                  group flex items-center gap-2 mb-1 rounded-lg transition-colors
                  ${selectedSessionId === conversation.session_id ? 'bg-gray-800' : 'hover:bg-gray-800'}
                `}
                  >
                    <button
                        onClick={() => {
                          setSelectedSessionId(conversation.session_id);
                          setSidebarOpen(false);
                        }}
                        className="flex-1 text-left p-3 flex items-center gap-2"
                    >
                      <MessageCircle size={16} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">
                          {getConversationTitle(conversation.session_id)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {conversation.messages} messages
                        </div>
                      </div>
                    </button>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.session_id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-700 rounded transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        <div className="flex-1 flex flex-col">
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
              {getConversationTitle(selectedSessionId)}
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.length > 0 ? (
                  <>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === "human" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex gap-3 max-w-2xl ${message.role === "human" ? "flex-row-reverse" : ""}`}>
                            <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${message.role === "human"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700"
                            }
                      `}>
                              {message.role === "human" ? "U" : "AI"}
                            </div>

                            <div className={`
                        p-4 rounded-2xl
                        ${message.role === "human"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }
                      `}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        </div>
                    ))}

                    {isLoading && (
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
                    disabled={isLoading}
                />
                </div>
                <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isLoading}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
