import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserPlaylist } from '@/types/radio';
import { logger } from '@/utils/prodLogger';
import { toast } from 'sonner';

export function useRadioPlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user playlists
  useEffect(() => {
    loadPlaylists();
  }, [user?.id]);

  const loadPlaylists = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_radio_playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[RadioPlaylists] Error loading playlists:', error);
        setError('Failed to load playlists');
        toast.error('Could not load playlists');
        return;
      }

      setPlaylists(data || []);
    } catch (err) {
      logger.error('[RadioPlaylists] Error loading playlists:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (name: string, description?: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to create playlists');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_radio_playlists')
        .insert({
          user_id: user.id,
          name,
          description,
          station_ids: []
        })
        .select()
        .single();

      if (error) {
        logger.error('[RadioPlaylists] Error creating playlist:', error);
        toast.error('Failed to create playlist');
        return null;
      }

      setPlaylists(prev => [data, ...prev]);
      toast.success(`Playlist "${name}" created`);
      return data;
    } catch (err) {
      logger.error('[RadioPlaylists] Error creating playlist:', err);
      toast.error('Failed to create playlist');
      return null;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_radio_playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('[RadioPlaylists] Error deleting playlist:', error);
        toast.error('Failed to delete playlist');
        return;
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      toast.success('Playlist deleted');
    } catch (err) {
      logger.error('[RadioPlaylists] Error deleting playlist:', err);
      toast.error('Failed to delete playlist');
    }
  };

  const addStationToPlaylist = async (playlistId: string, stationId: string) => {
    if (!user?.id) return;

    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      // Check if station already in playlist
      if (playlist.station_ids.includes(stationId)) {
        toast.info('Station already in playlist');
        return;
      }

      const updatedStationIds = [...playlist.station_ids, stationId];

      const { error } = await supabase
        .from('user_radio_playlists')
        .update({ station_ids: updatedStationIds })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('[RadioPlaylists] Error adding station:', error);
        toast.error('Failed to add station');
        return;
      }

      setPlaylists(prev => prev.map(p =>
        p.id === playlistId
          ? { ...p, station_ids: updatedStationIds }
          : p
      ));
      toast.success('Station added to playlist');
    } catch (err) {
      logger.error('[RadioPlaylists] Error adding station:', err);
      toast.error('Failed to add station');
    }
  };

  const removeStationFromPlaylist = async (playlistId: string, stationId: string) => {
    if (!user?.id) return;

    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedStationIds = playlist.station_ids.filter(id => id !== stationId);

      const { error } = await supabase
        .from('user_radio_playlists')
        .update({ station_ids: updatedStationIds })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('[RadioPlaylists] Error removing station:', error);
        toast.error('Failed to remove station');
        return;
      }

      setPlaylists(prev => prev.map(p =>
        p.id === playlistId
          ? { ...p, station_ids: updatedStationIds }
          : p
      ));
      toast.success('Station removed from playlist');
    } catch (err) {
      logger.error('[RadioPlaylists] Error removing station:', err);
      toast.error('Failed to remove station');
    }
  };

  const updatePlaylist = async (playlistId: string, updates: { name?: string; description?: string }) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_radio_playlists')
        .update(updates)
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('[RadioPlaylists] Error updating playlist:', error);
        toast.error('Failed to update playlist');
        return;
      }

      setPlaylists(prev => prev.map(p =>
        p.id === playlistId
          ? { ...p, ...updates }
          : p
      ));
      toast.success('Playlist updated');
    } catch (err) {
      logger.error('[RadioPlaylists] Error updating playlist:', err);
      toast.error('Failed to update playlist');
    }
  };

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    deletePlaylist,
    addStationToPlaylist,
    removeStationFromPlaylist,
    updatePlaylist,
    reload: loadPlaylists
  };
}
