import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRadioPlaylists } from '@/hooks/useRadioPlaylists';
import { useRadio } from '@/contexts/RadioContext';
import { getStationById, getStationsByCity } from '@/data/radioStations';
import { ArrowLeft, Plus, Music, Trash2, Play, Shuffle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RadioPlaylistsPage() {
  const navigate = useNavigate();
  const { state, play, toggleShuffle } = useRadio();
  const { playlists, loading, createPlaylist, deletePlaylist, removeStationFromPlaylist } = useRadioPlaylists();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowAddForm(false);
    toast.success('Playlist created');
  };

  const handleShufflePlay = (stationIds: string[]) => {
    if (stationIds.length === 0) return;
    if (!state.isShuffle) toggleShuffle();
    const randomId = stationIds[Math.floor(Math.random() * stationIds.length)];
    const station = getStationById(randomId);
    if (station) {
      play(station);
      toast.success('Shuffle play started');
    }
  };

  const handlePlayStation = (stationId: string) => {
    const station = getStationById(stationId);
    if (station) play(station);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-lg z-10 border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Playlists</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {/* Create Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="flex-1 bg-black/40 text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <Button
                  onClick={handleCreatePlaylist}
                  className="bg-white text-black rounded-xl px-6"
                  disabled={!newPlaylistName.trim()}
                >
                  Create
                </Button>
                <button
                  onClick={() => { setShowAddForm(false); setNewPlaylistName(''); }}
                  className="p-3 text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Music className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-medium mb-2">No Playlists</p>
            <p className="text-sm text-center max-w-xs">Create a playlist to organize your stations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {playlists.map((playlist) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
              >
                {/* Playlist Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                      <Music className="w-7 h-7 text-white/40" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{playlist.name}</h3>
                      <p className="text-sm text-white/40">
                        {playlist.station_ids.length} station{playlist.station_ids.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShufflePlay(playlist.station_ids)}
                      disabled={playlist.station_ids.length === 0}
                      className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center disabled:opacity-30"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePlaylist(playlist.id)}
                      className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stations */}
                {playlist.station_ids.length > 0 && (
                  <div className="border-t border-white/5">
                    {playlist.station_ids.slice(0, 5).map((stationId) => {
                      const station = getStationById(stationId);
                      if (!station) return null;
                      return (
                        <button
                          key={stationId}
                          onClick={() => handlePlayStation(stationId)}
                          className="w-full flex items-center gap-4 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {station.name[0]}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-white text-sm">{station.name}</div>
                            <div className="text-xs text-white/40">{station.genre}</div>
                          </div>
                          <Play className="w-4 h-4 text-white/40" fill="currentColor" />
                        </button>
                      );
                    })}
                    {playlist.station_ids.length > 5 && (
                      <div className="p-3 text-center text-sm text-white/30">
                        +{playlist.station_ids.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
