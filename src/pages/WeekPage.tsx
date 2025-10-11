import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { WeeklyPlanner } from '../components/WeeklyPlanner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { OutcomeWithRelations } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

export function WeekPage() {
  const { user } = useAuth();
  const [outcomes, setOutcomes] = useState<OutcomeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('week');

  useEffect(() => {
    if (user) {
      loadOutcomes();
    }
  }, [user]);

  const loadOutcomes = async () => {
    try {
      const { data: outcomesData } = await supabase
        .from('outcomes')
        .select(`
          *,
          areas (*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (!outcomesData) {
        setOutcomes([]);
        setLoading(false);
        return;
      }

      const outcomesWithActions = await Promise.all(
        outcomesData.map(async (outcome) => {
          const { data: actionsData } = await supabase
            .from('actions')
            .select('*')
            .eq('outcome_id', outcome.id)
            .order('created_at', { ascending: false });

          return {
            ...outcome,
            actions: actionsData || [],
          } as OutcomeWithRelations;
        })
      );

      setOutcomes(outcomesWithActions);
    } catch (error) {
      console.error('Error loading outcomes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <BackgroundHeroSection
        imageUrl={getBackgroundUrl()}
        imagePosition={getBackgroundPosition()}
        overlayOpacity={getOverlayOpacity()}
        height="h-48"
        onEditClick={() => setShowImageModal(true)}
      >
        <div className="text-center text-white px-4">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-4xl font-bold mb-2">Week View</h1>
          <p className="text-lg text-white/90">Plan and track your weekly outcomes</p>
        </div>
      </BackgroundHeroSection>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-8">
        <WeeklyPlanner outcomes={outcomes} onRefresh={loadOutcomes} />
      </div>

      {showImageModal && (
        <ImageUploadModal
          currentImageUrl={getBackgroundUrl()}
          currentPosition={getBackgroundPosition()}
          currentOpacity={getOverlayOpacity()}
          onSave={updateBackground}
          onUpload={uploadImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}
