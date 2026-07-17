import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { entries, toggleResonance, toggleReplyResonance, session, profile, signOut, updateProfile } = useApp();
  const router = useRouter();

  // Tab State: 'Thoughts' or 'Resonances'
  const [activeTab, setActiveTab] = useState<'Thoughts' | 'Resonances'>('Thoughts');

  // Edit Profile State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [updating, setUpdating] = useState(false);

  // Sign out handle
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sign out.');
    }
  };

  const handleOpenEditModal = () => {
    if (profile) {
      setEditDisplayName(profile.display_name);
      setEditUsername(profile.username);
      setEditBio(profile.bio || '');
    } else {
      // Sandbox fallback defaults
      setEditDisplayName('Thoughtful Scribe');
      setEditUsername('scribe_123');
      setEditBio('Writing down raw thoughts.');
    }
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      Alert.alert('Error', 'Display Name cannot be empty.');
      return;
    }
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores.');
      return;
    }

    setUpdating(true);
    try {
      await updateProfile({
        display_name: editDisplayName.trim(),
        username: cleanUsername,
        bio: editBio.trim(),
      });
      setIsEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  // 1. Filter user's thoughts
  const myThoughts = entries.filter(e => {
    if (profile) {
      return e.author_id === profile.id;
    }
    return e.author === 'You';
  });

  // 2. Filter user's resonated entries (entries by others that have been resonated with)
  const myResonated = entries.filter(e => {
    if (profile) {
      // Check if entry author is not current user and has been resonated with
      return e.author_id !== profile.id && e.hasResonated;
    }
    return e.author !== 'You' && e.hasResonated;
  });

  // Helpers to display display_name & username
  const currentDisplayName = profile?.display_name || 'You';
  const currentUsername = profile?.username || 'quiet_scribe';
  const currentBio = profile?.bio || 'Writing down raw thoughts without the pressure of metrics.';
  const currentAvatarColor = profile?.avatar_color || '#F0706A';
  const currentAvatarText = currentDisplayName.charAt(0).toUpperCase();

  const renderEntryCard = (entry: any) => {
    return (
      <View key={entry.id} style={styles.postContainer}>
        <View style={styles.entryRow}>
          {/* Avatar column */}
          <View style={styles.leftColumn}>
            <View style={[styles.avatarCircle, { backgroundColor: entry.avatarColor }]}>
              <Text style={styles.avatarText}>{entry.avatar}</Text>
            </View>
          </View>

          {/* Right column */}
          <View style={styles.rightColumn}>
            <View style={styles.authorRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.authorName}>{entry.author}</Text>
                <Text style={styles.timestampMuted}>  {entry.timestamp}</Text>
              </View>
              {entry.isPrivate && (
                <View style={styles.privateBadge}>
                  <Feather name="lock" size={10} color="#ffffff" strokeWidth={2.2} style={{ marginRight: 4 }} />
                  <Text style={styles.privateBadgeText}>Private</Text>
                </View>
              )}
            </View>

            <Text style={styles.entryText}>{entry.text}</Text>

            {/* Action icons */}
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => toggleResonance(entry.id)}
                activeOpacity={0.6}
              >
                <Feather 
                  name="activity" 
                  size={18} 
                  color={entry.hasResonated ? '#F0706A' : '#ffffff'} 
                  strokeWidth={2.2}
                />
                {entry.hasResonated && <View style={styles.resonanceDot} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="message-circle" size={18} color="#ffffff" strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="repeat" size={18} color="#ffffff" strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="send" size={18} color="#ffffff" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Profile Header Card */}
        <View style={styles.profileHeader}>
          <View style={styles.profileRow}>
            {/* Large Avatar */}
            <View style={[styles.largeAvatarCircle, { backgroundColor: currentAvatarColor }]}>
              <Text style={styles.largeAvatarText}>{currentAvatarText}</Text>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{currentDisplayName}</Text>
              <Text style={styles.username}>@{currentUsername}</Text>
            </View>
          </View>

          <Text style={styles.bio}>{currentBio}</Text>

          {/* Action Row: Edit & Sign Out */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleOpenEditModal}
              activeOpacity={0.6}
            >
              <Feather name="edit-3" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
              activeOpacity={0.6}
            >
              <Feather name="log-out" size={14} color="#ff453a" style={{ marginRight: 6 }} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Thoughts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Thoughts')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'Thoughts' && styles.tabTextActive]}>
              Thoughts ({myThoughts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Resonances' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Resonances')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'Resonances' && styles.tabTextActive]}>
              Resonated ({myResonated.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feed Area */}
        <View style={styles.feedContainer}>
          {activeTab === 'Thoughts' ? (
            myThoughts.length > 0 ? (
              myThoughts.map(renderEntryCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="feather" size={28} color="#636366" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>Your notebook is empty.</Text>
                <Text style={styles.emptySubtext}>Use the Drop tab to save your first thought.</Text>
              </View>
            )
          ) : (
            myResonated.length > 0 ? (
              myResonated.map(renderEntryCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="activity" size={28} color="#636366" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>Nothing resonated yet.</Text>
                <Text style={styles.emptySubtext}>Explore other public thoughts and tap the activity icon to see them here.</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setIsEditModalVisible(false)} 
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity 
              onPress={handleSaveProfile} 
              style={styles.modalSaveButton}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#F0706A" />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Daniel"
                  placeholderTextColor="#636366"
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username / Handle</Text>
                <View style={styles.usernameInputWrapper}>
                  <Text style={styles.atSymbol}>@</Text>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, paddingLeft: 4 }]}
                    placeholder="e.g. quiet_scribe"
                    placeholderTextColor="#636366"
                    value={editUsername}
                    onChangeText={setEditUsername}
                    autoCapitalize="none"
                    maxLength={30}
                  />
                </View>
                <Text style={styles.inputHelper}>Only letters, numbers, and underscores are allowed.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Short Bio</Text>
                <TextInput
                  style={[styles.modalInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="Tell us how you think..."
                  placeholderTextColor="#636366"
                  multiline
                  value={editBio}
                  onChangeText={setEditBio}
                  maxLength={160}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  largeAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  displayName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  username: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  bio: {
    color: '#d1d1d6',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 12,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  signOutButtonText: {
    color: '#ff453a',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    backgroundColor: '#000000',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#ffffff',
  },
  tabText: {
    color: '#636366',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  feedContainer: {
    paddingLeft: 8,
    paddingRight: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  postContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    backgroundColor: 'transparent',
  },
  entryRow: {
    flexDirection: 'row',
  },
  leftColumn: {
    alignItems: 'center',
    width: 44,
    marginRight: 6,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  rightColumn: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  privateBadgeText: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  entryText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  thinkingTimestamp: {
    color: '#636366',
    fontSize: 12,
    marginTop: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  timestampMuted: {
    color: '#636366',
    fontSize: 12,
    marginLeft: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  actionBar: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 32,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  resonanceDot: {
    position: 'absolute',
    bottom: 2,
    right: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0706A',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  emptySubtext: {
    color: '#636366',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  modalCancelText: {
    color: '#ffffff',
    fontSize: 15,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingLeft: 8,
  },
  modalSaveText: {
    color: '#F0706A',
    fontSize: 15,
    fontWeight: '600',
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalInput: {
    backgroundColor: '#1c1c1e',
    color: '#ffffff',
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    height: 48,
  },
  atSymbol: {
    color: '#636366',
    fontSize: 15,
    paddingLeft: 16,
    fontWeight: '600',
  },
  inputHelper: {
    color: '#636366',
    fontSize: 11,
    marginTop: 6,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
});
