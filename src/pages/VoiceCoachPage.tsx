import { Mic, Sparkles, MessageCircle, Calendar } from 'lucide-react';

export function VoiceCoachPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-soft-lg p-8 sm:p-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <Mic className="w-20 h-20 text-primary-500 relative z-10" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Voice Coach Coming Soon
          </h1>

          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Get ready for an AI-powered voice coaching experience that will transform how you plan and review your days.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Natural Conversations</h3>
              <p className="text-sm text-gray-600">Talk through your goals and plans naturally</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Smart Insights</h3>
              <p className="text-sm text-gray-600">Get personalized coaching and feedback</p>
            </div>

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Daily Rituals</h3>
              <p className="text-sm text-gray-600">Voice-guided planning and reviews</p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-primary-50 to-amber-50 rounded-2xl border border-primary-200">
            <p className="text-sm font-medium text-primary-900 mb-2">
              What to Expect:
            </p>
            <ul className="text-left text-sm text-primary-800 space-y-2 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>Voice-activated daily planning and evening reviews</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>AI coaching to help you clarify your purpose and results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>Hands-free action capture and scheduling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>Personalized insights based on your patterns</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            We're working hard to bring this feature to you. Stay tuned for updates!
          </div>
        </div>
      </div>
    </div>
  );
}
