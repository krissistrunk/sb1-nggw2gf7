import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { WeeklyPlanner } from '../components/WeeklyPlanner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Action, Area, Outcome, OutcomeWithRelations } from '../lib/database.types';
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
    const userId = user?.id;
    if (!userId) return;

    try {
      const { data: outcomesData, error: outcomesError } = await supabase
        .from('outcomes')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (outcomesError) throw outcomesError;
      if (!outcomesData || outcomesData.length === 0) {
        setOutcomes([]);
        setLoading(false);
        return;
      }

      const outcomeIds = outcomesData.map((o) => o.id);
      const areaIds = Array.from(
        new Set(outcomesData.map((o) => o.area_id).filter((id): id is string => Boolean(id)))
      );

      const [{ data: actionsData, error: actionsError }, { data: areasData, error: areasError }] =
        await Promise.all([
          supabase.from('actions').select('*').in('outcome_id', outcomeIds).order('created_at', { ascending: false }),
          areaIds.length ? supabase.from('areas').select('*').in('id', areaIds) : Promise.resolve({ data: [] as Area[], error: null }),
        ]);

      if (actionsError) throw actionsError;
      if (areasError) throw areasError;

      const actionsByOutcomeId = new Map<string, Action[]>();
      for (const action of actionsData || []) {
        const list = actionsByOutcomeId.get(action.outcome_id) || [];
        list.push(action);
        actionsByOutcomeId.set(action.outcome_id, list);
      }

      const areasById = new Map<string, Area>((areasData || []).map((a) => [a.id, a]));

      const outcomesWithRelations: OutcomeWithRelations[] = (outcomesData as Outcome[]).map((outcome) => ({
        ...outcome,
        area: outcome.area_id ? areasById.get(outcome.area_id) || null : null,
        goal: null,
        actions: actionsByOutcomeId.get(outcome.id) || [],
      }));

      setOutcomes(outcomesWithRelations);
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
