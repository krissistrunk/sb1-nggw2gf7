import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { getDefaultBackgroundByPageId } from '../lib/default-backgrounds';

export interface PageBackground {
  id: string;
  user_id: string;
  organization_id: string;
  page_identifier: string;
  image_url: string;
  image_position: string | null;
  overlay_opacity: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export function usePageBackground(pageIdentifier: string) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [background, setBackground] = useState<PageBackground | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && organization) {
      loadBackground();
    }
  }, [user, organization, pageIdentifier]);

  const loadBackground = async () => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('page_backgrounds')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('page_identifier', pageIdentifier)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading background:', error);
      }

      setBackground(data);
    } catch (error) {
      console.error('Error loading background:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBackground = async (
    imageUrl: string,
    imagePosition: string = 'center',
    overlayOpacity: number = 0.5
  ) => {
    if (!user || !organization) return;

    try {
      setSaving(true);

      if (background) {
        const { error } = await supabase
          .from('page_backgrounds')
          .update({
            image_url: imageUrl,
            image_position: imagePosition,
            overlay_opacity: overlayOpacity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', background.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('page_backgrounds')
          .insert({
            user_id: user.id,
            organization_id: organization.id,
            page_identifier: pageIdentifier,
            image_url: imageUrl,
            image_position: imagePosition,
            overlay_opacity: overlayOpacity,
            is_active: true,
          });

        if (error) throw error;
      }

      await loadBackground();
    } catch (error) {
      console.error('Error updating background:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('page-backgrounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('page-backgrounds')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const deleteBackground = async () => {
    if (!background) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('page_backgrounds')
        .delete()
        .eq('id', background.id);

      if (error) throw error;

      setBackground(null);
    } catch (error) {
      console.error('Error deleting background:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const getBackgroundUrl = (): string => {
    return background?.image_url || getDefaultBackgroundByPageId(pageIdentifier);
  };

  const getBackgroundPosition = (): string => {
    return background?.image_position || 'center';
  };

  const getOverlayOpacity = (): number => {
    return background?.overlay_opacity ?? 0.5;
  };

  return {
    background,
    loading,
    saving,
    updateBackground,
    uploadImage,
    deleteBackground,
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
  };
}
