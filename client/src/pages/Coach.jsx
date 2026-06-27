import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useVoice } from '../hooks/useVoice.js';
import {
  MessageSquare, Send, Mic, MicOff, Sparkles, ChevronRight, Award, Info
} from 'lucide-react';
import clsx from 'clsx';

export const Coach = () => {
  const { coachHistory, fetchCoachHistory, sendMessageToCoach } = useStore();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCoachHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachHistory]);

  const {
    isListening,
    startListening,
    stopListening,
    error: voiceError
  } = useVoice((text) => {
    setInputText(text);
  });

  const handleSend = async (textToSend) => {
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    setSending(true);
    setInputText('');
    try {
      await sendMessageToCoach(msg);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handlePresetClick = (prompt) => {
    handleSend(prompt);
  };

  const presets = [
    "Plan my day",
    "I'm overwhelmed",
    "What should I do first?",
    "I keep procrastinating",
    "Review my week"
  ];

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] items-start">
        
        {/* Left Column: Chat Console */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <Card className="flex flex-col justify-between h-[calc(100vh-160px)] overflow-hidden p-6">
            
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/5 mb-4 select-none">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-accentPurple to-accentBlue flex items-center justify-center text-white shadow-lg">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-textPrimary uppercase tracking-wider">
                  Last-Minute Guru
                </h3>
                <span className="text-[10px] text-textMuted font-medium uppercase">AI Productivity Coach</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin">
              {coachHistory.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-8 select-none">
                  <MessageSquare size={36} className="text-accentPurple mb-4 animate-bounce" />
                  <h4 className="text-sm font-semibold text-white mb-1.5 uppercase tracking-wider">Begin Your Coaching Session</h4>
                  <p className="text-xs text-textMuted max-w-sm leading-relaxed">
                    Say hello or pick a preset chip prompt below. The Last-Minute Guru will guide you past blockages and structure focus workflows.
                  </p>
                </div>
              ) : (
                coachHistory.map((msg, idx) => {
                  const isCoach = msg.role === 'coach';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[85%] ${
                        isCoach ? 'self-start items-start' : 'self-end items-end ml-auto'
                      }`}
                    >
                      <div
                        className={clsx(
                          "p-4 rounded-2xl text-xs leading-relaxed border shadow-xl",
                          isCoach
                            ? 'bg-darkSurface border-white/5 text-textPrimary'
                            : 'bg-gradient-to-tr from-accentPurple to-accentBlue border-white/10 text-white'
                        )}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Actions steps parser */}
                        {isCoach && msg.action_steps && msg.action_steps.length > 0 && (
                          <div className="mt-3.5 pt-3.5 border-t border-white/5 space-y-2 select-none">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-textMuted block">
                              Action steps:
                            </span>
                            {msg.action_steps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2 text-xs text-textPrimary pl-1.5 font-medium">
                                <ChevronRight size={12} className="text-accentPurple mt-0.5 flex-shrink-0" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-[9px] text-textMuted mt-1 select-none font-medium uppercase">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Presets row */}
            <div className="py-3.5 flex flex-wrap gap-2 overflow-x-auto border-t border-white/5 mt-4 select-none">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(preset)}
                  disabled={sending}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-textMuted hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-medium whitespace-nowrap"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Form input console */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-3 pt-3.5 border-t border-white/5"
            >
              <div className="relative flex-1 w-full">
                <Input
                  placeholder="Tell me what you are working on or ask for help..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  className="pr-12"
                />
                
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-3 top-3.5 p-1 rounded-lg text-textMuted hover:text-white transition-all ${
                    isListening ? 'bg-danger/20 text-danger animate-pulse' : 'hover:bg-white/5'
                  }`}
                  title={isListening ? "Stop voice listening" : "Record voice prompt"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="h-12 w-12 p-0 flex items-center justify-center shadow-lg active:scale-95"
              >
                <Send size={16} />
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Recommendations Playbook */}
        <div className="lg:col-span-4 flex flex-col gap-6 hidden lg:flex">
          <Card className="border border-accentPurple/20 bg-accentPurple/5 select-none">
            <h4 className="font-semibold uppercase text-accentPurple text-sm flex items-center gap-1.5 border-b border-accentPurple/10 pb-2 mb-4">
              <Award size={14} />
              <span>COACHING PLAYBOOK</span>
            </h4>
            
            <div className="space-y-4 text-xs text-textMuted leading-relaxed">
              <div>
                <p className="font-semibold text-textPrimary uppercase mb-1">Overwhelmed? 🌀</p>
                <p>Type "I'm overwhelmed". The coach will scan your pending list and help you isolate a single priority block.</p>
              </div>
              
              <div>
                <p className="font-semibold text-textPrimary uppercase mb-1">Procrastination loop? 🔄</p>
                <p>Ask the coach "I keep procrastinating". You will get three actionable micro-goals that take under 5 minutes to start.</p>
              </div>

              <div>
                <p className="font-semibold text-textPrimary uppercase mb-1">Voice Input 🎤</p>
                <p>Press the microphone icon inside the text input to dictate your query naturally in English or Hindi.</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </PageWrapper>
  );
};

export default Coach;
