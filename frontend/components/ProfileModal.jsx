'use client';

import { useState } from 'react';
import { X, User, Mail, Trophy, Swords, Star, Edit3, Check } from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'warrior', name: 'Warrior', color: 'from-orange-500 to-red-600' },
  { id: 'mage', name: 'Mage', color: 'from-purple-500 to-indigo-600' },
  { id: 'archer', name: 'Archer', name: 'Archer', color: 'from-green-500 to-emerald-600' },
  { id: 'rogue', name: 'Rogue', color: 'from-slate-500 to-slate-700' },
  { id: 'paladin', name: 'Paladin', color: 'from-yellow-500 to-orange-600' },
  { id: 'necromancer', name: 'Necromancer', color: 'from-red-700 to-pink-700' },
];

export default function ProfileModal({ user, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || '',
    bio: user.bio || '',
    avatar: user.avatar || 'warrior',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate({ ...user, ...updatedUser });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAvatarGradient = (avatarId) => {
    const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
    return avatar ? avatar.color : 'from-orange-500 to-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarGradient(formData.avatar)} flex items-center justify-center text-white text-3xl font-bold shadow-2xl`}>
              {formData.username[0].toUpperCase()}
            </div>
            
            {isEditing && (
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setFormData({ ...formData, avatar: avatar.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.avatar === avatar.id
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatar.color} mx-auto mb-2`}></div>
                    <p className="text-xs text-slate-300">{avatar.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-4">
            {/* Username */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Display Name</span>
                </div>
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 text-orange-400 hover:text-orange-300 text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  maxLength={20}
                />
              ) : (
                <p className="text-xl font-bold text-white">{user.username}</p>
              )}
            </div>

            {/* Email (Read Only) */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </div>
              <p className="text-white">{user.email || 'Not provided'}</p>
            </div>

            {/* Bio */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Bio / Tagline</span>
                {isEditing && (
                  <span className="text-xs text-slate-500">{formData.bio.length}/100</span>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
                  rows={3}
                  maxLength={100}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-slate-300 italic">
                  {user.bio || 'No bio yet. Click Edit to add one!'}
                </p>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">Battle Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{user.rating || 1200}</p>
                <p className="text-xs text-slate-400">Rating</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700">
                <Swords className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{user.totalMatches || 0}</p>
                <p className="text-xs text-slate-400">Matches</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700">
                <Star className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{user.wins || 0}</p>
                <p className="text-xs text-slate-400">Wins</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 text-center border border-slate-700">
                <div className="w-6 h-6 mx-auto mb-2 text-red-500">×</div>
                <p className="text-2xl font-bold text-white">{user.losses || 0}</p>
                <p className="text-xs text-slate-400">Losses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
