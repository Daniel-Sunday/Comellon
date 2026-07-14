import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function CaptureScreen() {
  const { addEntry, draftText, setDraftText } = useApp();
  const router = useRouter();
  const [author, setAuthor] = useState('You');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCapture = () => {
    if (!draftText.trim()) return;
    addEntry(draftText.trim(), author.trim() || 'You', isPrivate);
    setDraftText(''); // Clear draft state on publish
    setIsPrivate(false); // Reset private toggle
    router.push('/?posted=true'); // Redirect to feed and trigger toast
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Minimalist header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Drop your thoughts</Text>
              <Text style={styles.headerSubtitle}>Write a raw thought. Let it stand.</Text>
            </View>

            {/* Distraction-free two-column composer */}
            <View style={styles.composerRow}>
              {/* Left Column: Avatar & Fade-out Thread Line */}
              <View style={styles.leftColumn}>
                <View style={[styles.avatarCircle, { backgroundColor: '#F0706A' }]}>
                  <Text style={styles.avatarText}>Y</Text>
                </View>
                <View style={styles.fadingThreadLine} />
              </View>

              {/* Right Column: User identity & Input area */}
              <View style={styles.rightColumn}>
                <Text style={styles.authorName}>{author}</Text>
                
                <TextInput
                  style={styles.textInput}
                  placeholder="What are you thinking? Keep it raw..."
                  placeholderTextColor="#636366"
                  multiline
                  value={draftText}
                  onChangeText={setDraftText}
                  maxLength={1000}
                  autoFocus
                />
              </View>
            </View>

            {/* Composer Footer Action Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.attachmentIcons}>
                <TouchableOpacity style={styles.attachmentIcon} activeOpacity={0.6}>
                  <Feather name="image" size={16} color="#636366" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentIcon} activeOpacity={0.6}>
                  <Feather name="paperclip" size={16} color="#636366" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentIcon} activeOpacity={0.6}>
                  <Feather name="hash" size={16} color="#636366" />
                </TouchableOpacity>
              </View>

              {/* Subtle Character Count (appears only near limit) */}
              {draftText.length > 900 && (
                <Text style={[
                  styles.characterCount,
                  draftText.length >= 1000 && styles.characterCountLimit
                ]}>
                  {1000 - draftText.length}
                </Text>
              )}
            </View>

            {/* Subtle Author Identity editor */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Writing as:</Text>
              <TextInput
                style={styles.authorInput}
                value={author}
                onChangeText={setAuthor}
                placeholder="You"
                placeholderTextColor="#636366"
                maxLength={30}
              />
            </View>

            {/* Lock thought option */}
            <View style={styles.privacyRow}>
              <View style={styles.privacyLabelContainer}>
                <Feather name={isPrivate ? "lock" : "unlock"} size={14} color="#636366" style={{ marginRight: 6 }} />
                <Text style={styles.privacyLabel}>Lock to Private Notebook</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#2c2c2e', true: '#F0706A' }}
                thumbColor={isPrivate ? '#ffffff' : '#8e8e93'}
                ios_backgroundColor="#2c2c2e"
              />
            </View>

            {/* Action pill button */}
            <TouchableOpacity
              style={[
                styles.captureButton,
                !draftText.trim() && styles.captureButtonDisabled
              ]}
              onPress={handleCapture}
              disabled={!draftText.trim()}
            >
              <Text style={styles.captureButtonText}>Drop Thought</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  headerSubtitle: {
    color: '#636366',
    fontSize: 14,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  composerRow: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 200,
  },
  leftColumn: {
    alignItems: 'center',
    width: 44,
    marginRight: 6,
    position: 'relative',
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
  fadingThreadLine: {
    position: 'absolute',
    top: 44,
    bottom: 0,
    width: 2,
    backgroundColor: '#1c1c1e',
    opacity: 0.5,
  },
  rightColumn: {
    flex: 1,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: 'top',
    padding: 0,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    marginBottom: 20,
  },
  attachmentIcons: {
    flexDirection: 'row',
  },
  attachmentIcon: {
    marginRight: 16,
    padding: 4,
  },
  characterCount: {
    color: '#636366',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  characterCountLimit: {
    color: '#F0706A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1c1c1e',
    paddingVertical: 12,
  },
  metaLabel: {
    color: '#636366',
    fontSize: 14,
    marginRight: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  authorInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1c1c1e',
    marginBottom: 24,
  },
  privacyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyLabel: {
    color: '#8e8e93',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  captureButton: {
    backgroundColor: '#F0706A',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
});
