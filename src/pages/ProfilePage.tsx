import { useState, useEffect } from 'react';
import { User, Mail, Building, Calendar, Save, LogOut, Volume2, Play, Loader, Mic } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '../lib/supabase';
import { elevenlabsService, POPULAR_VOICES } from '../lib/elevenlabs-service';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [voiceSettings, setVoiceSettings] = useState({
    voice_mode: 'browser' as 'browser' | 'elevenlabs',
    elevenlabs_voice_id: 'EXAVITQu4vr4xnSDxMaL',
    browser_voice: null as string | null,
    speech_rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
  const [voiceCoachSettings, setVoiceCoachSettings] = useState({
    auto_delay_seconds: 5,
    silence_timeout: 10,
    audio_cues: false,
  });
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, email, voice_settings, voice_coach_auto_delay_seconds, voice_coach_silence_timeout, voice_coach_audio_cues')
        .eq('id', user?.id)
        .maybeSingle();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
        });
        if (data.voice_settings) {
          setVoiceSettings(data.voice_settings);
        }
        setVoiceCoachSettings({
          auto_delay_seconds: data.voice_coach_auto_delay_seconds || 5,
          silence_timeout: data.voice_coach_silence_timeout || 10,
          audio_cues: data.voice_coach_audio_cues || false,
        });
      } else {
        setFormData({
          full_name: '',
          email: user?.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          voice_settings: voiceSettings,
          voice_coach_auto_delay_seconds: voiceCoachSettings.auto_delay_seconds,
          voice_coach_silence_timeout: voiceCoachSettings.silence_timeout,
          voice_coach_audio_cues: voiceCoachSettings.audio_cues,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const testVoice = async (voiceId: string) => {
    setTestingVoice(voiceId);
    try {
      const testText = 'Hello! This is how I sound. I\'m here to help you achieve your goals and stay focused on what matters most.';
      const audioUrl = await elevenlabsService.textToSpeech(testText, voiceId);
      await elevenlabsService.playAudio(audioUrl);
    } catch (error) {
      console.error('Failed to test voice:', error);
      setMessage('Failed to test voice');
    } finally {
      setTestingVoice(null);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account information</p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {formData.full_name || 'User'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base ${
            message.includes('success')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {organization && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organization
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={organization.name}
                  disabled
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Member Since
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
                disabled
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg text-sm sm:text-base min-h-touch-target"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <Volume2 className="w-6 h-6 text-primary-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Voice Coach Settings</h2>
            <p className="text-sm text-gray-600">Customize your AI coach's voice</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Voice Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVoiceSettings({ ...voiceSettings, voice_mode: 'browser' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  voiceSettings.voice_mode === 'browser'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">Browser Voice</div>
                <div className="text-xs">Free, system voices</div>
              </button>
              <button
                type="button"
                onClick={() => setVoiceSettings({ ...voiceSettings, voice_mode: 'elevenlabs' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  voiceSettings.voice_mode === 'elevenlabs'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">ElevenLabs</div>
                <div className="text-xs">Premium AI voices</div>
              </button>
            </div>
          </div>

          {voiceSettings.voice_mode === 'elevenlabs' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Voice
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_VOICES.map((voice) => (
                  <div
                    key={voice.voice_id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      voiceSettings.elevenlabs_voice_id === voice.voice_id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setVoiceSettings({ ...voiceSettings, elevenlabs_voice_id: voice.voice_id })}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{voice.name}</div>
                        <div className="text-xs text-gray-600 capitalize">
                          {voice.labels?.gender} • {voice.labels?.age}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          testVoice(voice.voice_id);
                        }}
                        disabled={testingVoice !== null}
                        className="p-2 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {testingVoice === voice.voice_id ? (
                          <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 text-primary-500" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{voice.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Speech Rate: {voiceSettings.speech_rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.speech_rate}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, speech_rate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slower (0.5x)</span>
              <span>Faster (2x)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pitch: {voiceSettings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Volume: {Math.round(voiceSettings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Quiet</span>
              <span>Loud</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <Mic className="w-6 h-6 text-primary-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Voice Coach Interaction</h2>
            <p className="text-sm text-gray-600">Configure microphone and conversation behavior</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Auto-Activation Delay: {voiceCoachSettings.auto_delay_seconds} seconds
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Time to wait after coach finishes speaking before automatically activating your microphone
            </p>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={voiceCoachSettings.auto_delay_seconds}
              onChange={(e) => setVoiceCoachSettings({ ...voiceCoachSettings, auto_delay_seconds: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Quick (3s)</span>
              <span>Slower (10s)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Silence Timeout: {voiceCoachSettings.silence_timeout} seconds
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Automatically stop recording after this many seconds of silence
            </p>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={voiceCoachSettings.silence_timeout}
              onChange={(e) => setVoiceCoachSettings({ ...voiceCoachSettings, silence_timeout: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Short (5s)</span>
              <span>Long (30s)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">Audio Cues</div>
              <div className="text-xs text-gray-600">
                Play a sound when recording stops automatically due to silence
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVoiceCoachSettings({ ...voiceCoachSettings, audio_cues: !voiceCoachSettings.audio_cues })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                voiceCoachSettings.audio_cues ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  voiceCoachSettings.audio_cues ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg text-sm sm:text-base min-h-touch-target"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
