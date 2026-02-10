import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Music, Trash2, Play, Heart, Shuffle, Check } from 'lucide-react';
import { useRadioPlaylists } from '@/hooks/useRadioPlaylists';
import { useRadio } from '@/contexts/RadioContext';
import { RadioStation } from '@/types/radio';
import { getStationById } from '@/data/radioStations';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation: RadioStation | null;
  onPlayStation: (station: RadioStation) => void;
  addingMode?: boolean;
}

export function PlaylistDialog({ isOpen, onClose, currentStation, onPlayStation, addingMode = false }: PlaylistDialogProps) {
  const { state, playPlaylist, toggleShuffle } = useRadio();
  const { playlists, loading, createPlaylist, deletePlaylist, addStationToPlaylist, removeStationFromPlaylist } = useRadioPlaylists();
  
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked'>('playlists');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('playlists');
      setSelectedPlaylistId(null);
      setAddedPlaylistId(null);
    }
  }, [isOpen]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowAddForm(false);
    toast.success('Playlist created!');
  };

  const handleAddStation = async (playlistId: string) => {
    if (!currentStation) return;
    await addStationToPlaylist(playlistId, currentStation.id);
    setAddedPlaylistId(playlistId);
    toast.success('Station added to playlist!');
  };

  const handleShufflePlay = (stationIds: string[]) => {
    if (stationIds.length === 0) return;
    if (!state.isShuffle) toggleShuffle();
    const randomId = stationIds[Math.floor(Math.random() * stationIds.length)];
    const station = getStationById(randomId);
    if (station) onPlayStation(station);
    toast.success('Shuffle play started');
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {addingMode ? 'Add to Playlist' : selectedPlaylist ? selectedPlaylist.name : 'Library'}
              </h2>
              <button
                onClick={selectedPlaylist ? () => setSelectedPlaylistId(null) : onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!selectedPlaylist && (
              <div className="flex p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setActiveTab('playlists')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'playlists' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Playlists
                </button>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'liked' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Liked
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p>Loading your music...</p>
              </div>
            ) : selectedPlaylist ? (
              /* Playlist Detail View */
              <div className="space-y-4">
                <div className="flex gap-3 mb-6">
                  <Button 
                    className="flex-1 bg-white text-black hover:bg-white/90 rounded-xl h-12 font-bold"
                    onClick={() => handleShufflePlay(selectedPlaylist.station_ids)}
                    disabled={selectedPlaylist.station_ids.length === 0}
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    Shuffle Play
                  </Button>
                </div>

                {selectedPlaylist.station_ids.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Empty Playlist</p>
                    <p className="text-sm">Add some stations to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPlaylist.station_ids.map(stationId => {
                      const station = getStationById(stationId);
                      if (!station) return null;
                      return (
                        <div key={stationId} className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                              {station.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{station.name}</div>
                              <div className="text-xs text-white/40 truncate">{station.genre} • {station.frequency}</div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onPlayStation(station)}
                              className="p-2 hover:bg-green-500/20 rounded-full text-green-500 transition-colors"
                            >
                              <Play className="w-5 h-5" fill="currentColor" />
                            </button>
                            <button
                              onClick={() => removeStationFromPlaylist(selectedPlaylist.id, stationId)}
                              className="p-2 hover:bg-red-500/20 rounded-full text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'liked' ? (
              /* Liked Stations View */
              <div className="space-y-4">
                <div className="flex gap-3 mb-6">
                  <Button 
                    className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-xl h-12 font-bold shadow-lg shadow-red-500/20"
                    onClick={() => handleShufflePlay(state.favorites)}
                    disabled={state.favorites.length === 0}
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    Shuffle Liked
                  </Button>
                </div>

                {state.favorites.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No Liked Stations</p>
                    <p className="text-sm">Heart your favorite stations to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.favorites.map(stationId => {
                      const station = getStationById(stationId);
                      if (!station) return null;
                      return (
                        <div key={stationId} className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                              {station.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{station.name}</div>
                              <div className="text-xs text-white/40 truncate">{station.genre} • {station.frequency}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => onPlayStation(station)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Play className="w-5 h-5" fill="currentColor" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Playlists List View */
              <div className="space-y-4">
                {playlists.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No Playlists</p>
                    <p className="text-sm">Create a playlist to organize your music</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {playlists.map(playlist => (
                      <div
                        key={playlist.id}
                        onClick={() => addingMode ? handleAddStation(playlist.id) : setSelectedPlaylistId(playlist.id)}
                        className={`group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                          addedPlaylistId === playlist.id
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                            addedPlaylistId === playlist.id
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : 'bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700'
                          }`}>
                            {addedPlaylistId === playlist.id ? (
                              <Check className="w-7 h-7 text-white" />
                            ) : (
                              <Music className="w-7 h-7 text-white/40 group-hover:text-white transition-colors" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{playlist.name}</div>
                            <div className="text-sm text-white/40">
                              {playlist.station_ids.length} station{playlist.station_ids.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className={`flex gap-2 ${addingMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          {addingMode ? (
                            <span className="text-sm text-green-400 font-medium px-2">
                              {addedPlaylistId === playlist.id ? 'Added!' : 'Add'}
                            </span>
                          ) : currentStation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddStation(playlist.id);
                              }}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-full text-blue-400 transition-colors"
                              title="Add current station"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                          {!addingMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlaylist(playlist.id);
                              }}
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create Playlist Form */}
                {showAddForm ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name"
                      className="w-full bg-black/40 text-white p-3 rounded-xl mb-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCreatePlaylist} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl" disabled={!newPlaylistName.trim()}>
                        Create
                      </Button>
                      <Button onClick={() => { setShowAddForm(false); setNewPlaylistName(''); }} variant="ghost" className="flex-1 text-white/60 hover:text-white hover:bg-white/5 rounded-xl">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full p-4 border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-white/40 hover:text-blue-400 flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Playlist</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
