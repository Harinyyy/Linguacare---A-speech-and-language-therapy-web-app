import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Updated Page type import to use the centralized types.ts file.
import type { Page, User, ChatMessage, Language } from '../types';
import { ChatBubbleIcon, XIcon, SendIcon, MicIcon, StopCircleIcon } from './Icons';
import { createChatbotSession } from '../services/chatbotService';
import { transcribeAudio } from '../services/geminiService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface ChatbotProps {
  user: User;
  onNavigate: (page: Page) => void;
  language: Language;
}

const GREETINGS: Record<Language, string> = {
    english: "Hello! I'm the navigation assistant. How can I help you find your way around the app today?",
    tamil: "வணக்கம்! நான் வழிசெலுத்தல் உதவியாளர். இன்று செயலியில் உங்கள் வழியைக் கண்டறிய நான் எப்படி உதவ முடியும்?",
    malayalam: "നമസ്കാരം! ഞാൻ നാവിഗേഷൻ അസിസ്റ്റന്റാണ്. ഇന്ന് ആപ്പിൽ നിങ്ങളുടെ വഴി കണ്ടെത്താൻ ഞാൻ എങ്ങനെ സഹായിക്കും?"
};

const SUGGESTIONS: Record<Language, string[]> = {
    english: ["Go to Exercises", "My Dashboard", "Settings"],
    tamil: ["பயிற்சிகளுக்குச் செல்", "எனது டாஷ்போர்டு", "அமைப்புகள்"],
    malayalam: ["വ്യായാമങ്ങളിലേക്ക് പോകുക", "എൻ്റെ ഡാഷ്‌ബോർഡ്", "ക്രമീകരണങ്ങൾ"]
};


export const Chatbot: React.FC<ChatbotProps> = ({ user, onNavigate, language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const { isRecording, startRecording, stopRecording, audioBlob, recorderError, volume } = useAudioRecorder();
    const chatSession = useRef(createChatbotSession(user.role, language));
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Re-create session if user role or language changes
        chatSession.current = createChatbotSession(user.role, language);
    }, [user.role, language]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);


    const handleSendMessage = useCallback(async (messageText?: string) => {
        const textToSend = (messageText || inputValue).trim();
        if (!textToSend || isLoading) return;

        setShowSuggestions(false);
        const newUserMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text: textToSend,
        };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const stream = await chatSession.current.sendMessageStream(textToSend);
            
            let finalResponse = '';
            let botMessageId: string | null = null;
            
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    finalResponse += chunkText;
                    if (!botMessageId) {
                        setIsLoading(false); // Hide typing indicator
                        const newBotMessage: ChatMessage = {
                            id: crypto.randomUUID(),
                            role: 'bot',
                            text: finalResponse
                        };
                        botMessageId = newBotMessage.id;
                        setMessages(prev => [...prev, newBotMessage]);
                    } else {
                        setMessages(prev => prev.map(msg => 
                            msg.id === botMessageId ? { ...msg, text: finalResponse } : msg
                        ));
                    }
                }
            }

            if (isLoading) setIsLoading(false); // Failsafe if stream is empty

            const actionRegex = /\[action:(\w+),page:([\w_]+)\]/;
            const match = finalResponse.match(actionRegex);
            
            if (botMessageId) {
                const cleanResponse = finalResponse.replace(actionRegex, '').trim();
                 setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId ? { ...msg, text: cleanResponse } : msg
                ));
            }

            if (match) {
                const [, action, page] = match;
                if (action === 'navigate' && page) {
                    setTimeout(() => {
                        onNavigate(page as Page);
                        setIsOpen(false);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error("Failed to handle chatbot stream:", error);
             setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: 'An unexpected error occurred.'}]);
        } finally {
            if (isLoading) setIsLoading(false);
        }
    }, [inputValue, isLoading, onNavigate]);

    // Effect to handle transcription and auto-send
    useEffect(() => {
        if (audioBlob) {
            const transcribeAndSend = async () => {
                setIsTranscribing(true);
                try {
                    const transcribedText = await transcribeAudio(audioBlob);
                    if (transcribedText.trim()) {
                        handleSendMessage(transcribedText);
                    }
                } catch (error) {
                    console.error("Transcription failed:", error);
                    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: 'Sorry, I couldn\'t understand that. Please try again.'}]);
                } finally {
                    setIsTranscribing(false);
                }
            };
            transcribeAndSend();
        }
    }, [audioBlob, handleSendMessage]);

    // Effect to handle recorder errors
    useEffect(() => {
        if (recorderError) {
            console.error("Recorder Error:", recorderError);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', text: `Mic error: ${recorderError}`}]);
        }
    }, [recorderError]);


    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };
    
    const handleMicPress = () => {
        if (isLoading || isTranscribing) return;
        setInputValue('');
        startRecording();
    };

    const handleMicRelease = () => {
        if (isRecording) {
            stopRecording();
        }
    };

    const openChat = () => {
        setIsOpen(true);
        setMessages([{ id: crypto.randomUUID(), role: 'bot', text: GREETINGS[language] }]);
        setShowSuggestions(true);
    };
    
    const showSendButton = inputValue.trim() !== '' && !isRecording;
    const currentSuggestions = SUGGESTIONS[language] || SUGGESTIONS.english;

    return (
        <>
            <div className={`fixed bottom-6 right-6 z-30 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <button
                    onClick={openChat}
                    className="bg-teal-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 focus:ring-offset-2 transform hover:scale-110 transition-transform"
                    aria-label="Open navigation chatbot"
                >
                    <ChatBubbleIcon className="h-8 w-8" />
                </button>
            </div>
            
            <div
                className={`fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out border border-slate-200 ${
                    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="chatbot-heading"
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 id="chatbot-heading" className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <div className="relative">
                            <ChatBubbleIcon className="h-6 w-6 text-teal-600" />
                            <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                        </div>
                        <span>Navigation Helper</span>
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full"
                        aria-label="Close chatbot"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto h-96 bg-slate-50/50" aria-live="polite">
                    {messages.map(message => (
                        <div key={message.id} className={`flex items-end gap-2 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.role === 'bot' && <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>}
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${message.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>
                            <div className="px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-none">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    {showSuggestions && !isLoading && (
                        <div className="flex flex-wrap gap-2 justify-start pl-10 pt-2 animate-fade-in">
                            {currentSuggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSendMessage(suggestion)}
                                    className="px-3 py-1.5 bg-slate-200 text-slate-800 text-sm font-medium rounded-full hover:bg-slate-300 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-slate-200 bg-white rounded-b-2xl">
                    <div className="relative">
                        <label htmlFor="chatbot-input" className="sr-only">Chat message</label>
                        <input
                            id="chatbot-input"
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isRecording ? 'Listening...' : isTranscribing ? 'Transcribing...' : "Type or use the mic..."}
                            className="w-full pl-4 pr-12 py-2.5 border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition"
                            disabled={isLoading || isRecording || isTranscribing}
                        />
                         {/* Pulsating Visualizer Ring */}
                        {isRecording && (
                            <div
                                className="absolute right-1.5 top-1/2 w-9 h-9 bg-teal-400/40 rounded-full transition-transform duration-100 ease-out pointer-events-none"
                                style={{
                                    transform: `translateY(-50%) scale(${1 + volume * 1.5})`,
                                }}
                                aria-hidden="true"
                            />
                        )}
                         <button
                            onClick={showSendButton ? () => handleSendMessage() : undefined}
                            onMouseDown={!showSendButton ? handleMicPress : undefined}
                            onMouseUp={!showSendButton ? handleMicRelease : undefined}
                            onMouseLeave={!showSendButton ? handleMicRelease : undefined}
                            onTouchStart={!showSendButton ? handleMicPress : undefined}
                            onTouchEnd={!showSendButton ? handleMicRelease : undefined}
                            disabled={isLoading || isTranscribing}
                            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 text-white rounded-full flex items-center justify-center transition-all duration-300 ease-in-out disabled:bg-slate-400 disabled:cursor-not-allowed transform active:scale-90 ${
                                isRecording
                                ? 'bg-red-500'
                                : 'bg-teal-600 hover:bg-teal-700'
                            }`}
                            aria-label={showSendButton ? "Send message" : "Hold to record and speak"}
                        >
                            {showSendButton ? (
                                <SendIcon className="h-5 w-5" />
                            ) : (
                                <MicIcon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};