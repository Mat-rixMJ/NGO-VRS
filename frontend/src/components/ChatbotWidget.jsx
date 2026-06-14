import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { MessageSquare, X, Send, Sparkles, HelpCircle, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRIMARY = '#006e2f';
const PRIMARY_LIGHT = '#22c55e';
const GRADIENT = 'linear-gradient(135deg, #006e2f 0%, #22c55e 100%)';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Namaste! 👋 I am your NayePankh assistant. Ask me anything about volunteering, our missions, or how you can make an impact!',
      source: 'system'
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const { token } = useAuth();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, isOpen, typing]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setTyping(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axiosClient.post('/chatbot/ask',
        { question: userMessage.text },
        { headers }
      );

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.data.answer,
        source: response.data.source
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Sorry, I am having trouble connecting right now. Please contact us at contact@nayepankh.org or call +91 83770 04040.',
          source: 'error'
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const quickQuestions = [
    'How do I register?',
    'What skills are needed?',
    'Contact NayePankh?',
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: "'DM Sans', Inter, sans-serif" }}>

      {/* Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Chat with NayePankh Assistant"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: GRADIENT,
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,110,47,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: 'chatPulse 2.5s ease-in-out infinite',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,110,47,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,110,47,0.35)'; }}
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,110,47,0.15)',
          overflow: 'hidden',
          background: '#ffffff',
          animation: 'chatSlideUp 0.25s ease-out',
        }}>

          {/* Header */}
          <div style={{
            background: GRADIENT,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>
                  NayePankh Assistant
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '7px', height: '7px', background: '#86efac', borderRadius: '50%', display: 'inline-block' }}></span>
                  Online • Instantly Helpful
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '8px',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8faf8',
          }}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                    gap: '4px',
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    background: isBot ? '#ffffff' : GRADIENT,
                    color: isBot ? '#1a2e1a' : '#ffffff',
                    border: isBot ? '1px solid #e2f0e7' : 'none',
                    boxShadow: isBot
                      ? '0 1px 4px rgba(0,0,0,0.06)'
                      : '0 2px 8px rgba(0,110,47,0.25)',
                    wordBreak: 'break-word',
                    fontWeight: 400,
                  }}>
                    {msg.text}
                  </div>

                  {/* Source badge */}
                  {isBot && msg.source && msg.source !== 'system' && (
                    <span style={{
                      fontSize: '0.62rem',
                      color: msg.source === 'faq' ? PRIMARY : msg.source === 'error' ? '#dc2626' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      paddingLeft: '2px',
                    }}>
                      {msg.source === 'faq' ? (
                        <><HelpCircle size={10} /> FAQ Match</>
                      ) : msg.source === 'ai' ? (
                        <><Sparkles size={10} /> AI Answer</>
                      ) : msg.source === 'error' ? (
                        <>⚠ Connection Error</>
                      ) : null}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {typing && (
              <div style={{
                alignSelf: 'flex-start',
                display: 'flex',
                gap: '5px',
                padding: '12px 16px',
                background: '#ffffff',
                borderRadius: '4px 16px 16px 16px',
                border: '1px solid #e2f0e7',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {[0, 0.18, 0.36].map((delay, i) => (
                  <span key={i} style={{
                    width: '7px', height: '7px',
                    background: PRIMARY,
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: `typingDot 1s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (only show if just 1 message - welcome) */}
          {messages.length === 1 && (
            <div style={{
              padding: '8px 14px',
              background: '#f8faf8',
              borderTop: '1px solid #e8f0e8',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}>
              {quickQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => {
                      const fakeEvent = { preventDefault: () => {} };
                      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: q }]);
                      setInput('');
                      setTyping(true);
                      axiosClient.post('/chatbot/ask', { question: q })
                        .then(res => {
                          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: res.data.answer, source: res.data.source }]);
                        })
                        .catch(() => {
                          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Sorry, could not connect. Please try again.', source: 'error' }]);
                        })
                        .finally(() => setTyping(false));
                    }, 10);
                  }}
                  style={{
                    background: '#ffffff',
                    border: `1.5px solid ${PRIMARY}`,
                    color: PRIMARY,
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = PRIMARY; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = PRIMARY; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form onSubmit={handleSend} style={{
            padding: '12px 14px',
            borderTop: '1px solid #e8f0e8',
            display: 'flex',
            gap: '8px',
            background: '#ffffff',
            flexShrink: 0,
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '0.875rem',
                borderRadius: '10px',
                border: '1.5px solid #d1e8d1',
                background: '#f8faf8',
                color: '#1a2e1a',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#d1e8d1'}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                width: '40px', height: '40px',
                borderRadius: '10px',
                background: input.trim() ? GRADIENT : '#e5e7eb',
                border: 'none',
                color: input.trim() ? '#fff' : '#9ca3af',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
                boxShadow: input.trim() ? '0 2px 8px rgba(0,110,47,0.3)' : 'none',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Keyframe Animations */}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,110,47,0.35); }
          50% { box-shadow: 0 4px 28px rgba(0,110,47,0.6), 0 0 0 8px rgba(0,110,47,0.08); }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatbotWidget;
