'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

export function ProjectChat({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // Setup smart polling (every 3 seconds)
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(true);
      }, 3000);
      
      // Mark as read or other init stuff could go here
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, projectId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const tmpContent = inputValue.trim();
    setInputValue('');
    
    // Optimistic update
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: tmpContent,
      createdAt: new Date().toISOString(),
      sender: {
        id: (session?.user as any)?.id as string,
        name: session?.user?.name || 'Me',
        image: session?.user?.image || null
      }
    };
    setMessages((prev) => [...prev, tempMsg]);

    setIsSending(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tmpContent }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Swap temp with real message seamlessly
        setMessages((prev) => prev.map(m => m.id === tempMsg.id ? data.data : m));
      } else {
        // Remove optimistic if failed
        setMessages((prev) => prev.filter(m => m.id !== tempMsg.id));
      }
    } catch {
      setMessages((prev) => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Slide-out Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm sm:hidden"
            />
            
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl sm:w-[400px]"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Project Chat</h2>
                    <p className="text-xs text-primary">● Live</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <MessageCircle className="mb-2 h-10 w-10 opacity-20" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => {
                      const isMe = msg.sender.id === (session?.user as any)?.id;
                      const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender.id !== msg.sender.id);
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}
                        >
                          {!isMe && (
                            <div className="w-8 shrink-0">
                              {showAvatar && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                  {msg.sender.image ? (
                                    <img src={msg.sender.image} alt={msg.sender.name} className="rounded-full" />
                                  ) : (
                                    getInitials(msg.sender.name)
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className={cn('flex flex-col max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
                            {showAvatar && (
                              <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">{msg.sender.name}</span>
                            )}
                            <div
                              className={cn(
                                'rounded-2xl px-4 py-2 text-sm shadow-sm',
                                isMe 
                                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                  : 'bg-muted text-foreground rounded-bl-sm border border-border/50'
                              )}
                            >
                              {msg.content}
                            </div>
                            <span className="mt-1 text-[9px] text-muted-foreground opacity-70">
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="border-t border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full rounded-full border border-border bg-card pl-4 pr-12 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isSending}
                    className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 bg-gradient-to-tr from-primary to-primary/80"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
