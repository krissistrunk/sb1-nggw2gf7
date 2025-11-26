import { useState } from 'react';
import { Mic, Sparkles, MessageCircle, Calendar, Target, Heart, TrendingUp, Play } from 'lucide-react';
import { VoiceCoachModal } from '../components/VoiceCoachModal';

type CoachingMode = 'PLANNING' | 'REFLECTION' | 'COACHING' | 'MOTIVATION' | 'CLARIFICATION';

interface CoachingOption {
  id: CoachingMode;
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  prompt: string;
}

export function VoiceCoachPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<CoachingMode>('COACHING');
  const [selectedPrompt, setSelectedPrompt] = useState('');

  const coachingOptions: CoachingOption[] = [
    {
      id: 'PLANNING',
      title: 'Planning Session',
      description: 'Plan your day, week, or specific outcomes with guided questions',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      prompt: "Let's plan together! Tell me what you want to accomplish. What are your top priorities right now?",
    },
    {
      id: 'REFLECTION',
      title: 'Reflection Session',
      description: 'Process your experiences, extract insights, and celebrate wins',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      prompt: "Let's reflect on your recent experiences. What would you like to talk about - your wins, challenges, or learnings?",
    },
    {
      id: 'COACHING',
      title: 'General Coaching',
      description: 'Work through challenges, clarify goals, or explore new ideas',
      icon: Sparkles,
      color: 'from-primary-500 to-orange-600',
      prompt: "I'm here to support you. What's on your mind today? What would you like to explore or work through?",
    },
    {
      id: 'MOTIVATION',
      title: 'Motivation Boost',
      description: 'Connect with your drive, celebrate progress, and build confidence',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      prompt: "Let's tap into your motivation! Tell me about something you're working on. What excites you about it?",
    },
    {
      id: 'CLARIFICATION',
      title: 'Purpose Clarification',
      description: 'Define your why, refine your purpose, and gain clarity',
      icon: Target,
      color: 'from-red-500 to-pink-600',
      prompt: "Let's get clear on what matters most. What goal or area of your life would you like to clarify the purpose behind?",
    },
  ];

  const handleStartSession = (option: CoachingOption) => {
    setSelectedMode(option.id);
    setSelectedPrompt(option.prompt);
    setIsModalOpen(true);
  };

  const handleComplete = (transcript: string, insights: any) => {
    console.log('Session completed:', { transcript, insights });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
                <Mic className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            AI Voice Coach
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have natural, conversational coaching sessions powered by AI. Speak your thoughts,
            get guided questions, and gain clarity through voice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {coachingOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleStartSession(option)}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-full h-full" />
                </div>

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
                  {option.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                  {option.description}
                </p>

                <div className="mt-6 flex items-center text-primary-600 font-medium text-sm group-hover:text-primary-700 relative z-10">
                  <Play className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Start Session
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How Voice Coaching Works</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Choose a coaching mode based on what you need right now</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Press the microphone and speak naturally - share what's on your mind</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>The AI coach listens, asks clarifying questions, and provides guidance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Continue the conversation as long as you need - it's your session</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Your sessions are saved so you can review insights anytime</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Voice coaching sessions are private and secure. Your recordings are encrypted and only accessible by you.
          </p>
        </div>
      </div>

      <VoiceCoachModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionType={selectedMode}
        prompt={selectedPrompt}
        onComplete={handleComplete}
      />
    </div>
  );
}
