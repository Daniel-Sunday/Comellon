import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp, MatchResult } from '@/context/AppContext';

export default function MatchesScreen() {
  const { entries, getMatches, draftText } = useApp();

  // Find user's thoughts
  const userEntries = entries.filter(e => e.author === 'You');

  // Personalize matches based on user's latest post, falling back to draft or default seed
  const referenceText = userEntries.length > 0
    ? userEntries[0].text
    : (draftText.trim().length > 0 
        ? draftText 
        : 'A quiet notebook app where writing down thoughts feels low-stakes, completely free from algorithms, vanity likes, and social metrics.');

  // Calculate matching minds from reference text
  const matches = getMatches(referenceText);
  const activeMatches = matches.filter(m => m.entry.author !== 'You' && m.score > 5);

  const renderMatchRow = (match: MatchResult) => {
    const { entry, score, type, reason } = match;

    let matchColor = '#8e8e93';
    let matchLabel = 'Complementary Take';

    if (type === 'Aligned') {
      matchColor = '#F0706A';
      matchLabel = `${score}% Aligned`;
    } else if (type === 'Challenging') {
      matchColor = '#E28743';
      matchLabel = `${score}% Challenge`;
    }

    return (
      <View key={entry.id} style={styles.postContainer}>
        {/* Align match details with text column (44px avatar + 6px margin = 50px offset) */}
        <View style={styles.matchHeaderInsight}>
          <Feather name="compass" size={11} color={matchColor} style={styles.insightIcon} />
          <Text style={[styles.insightText, { color: matchColor }]}>
            {matchLabel} · {reason}
          </Text>
        </View>

        <View style={styles.row}>
          {/* Column 1: Avatar */}
          <View style={styles.leftColumn}>
            <View style={[styles.avatarCircle, { backgroundColor: entry.avatarColor }]}>
              <Text style={styles.avatarText}>{entry.avatar}</Text>
            </View>
          </View>

          {/* Column 2: Content */}
          <View style={styles.rightColumn}>
            <View style={styles.userHeader}>
              <Text style={styles.authorName}>{entry.author}</Text>
            </View>
            <Text style={styles.entryText}>{entry.text}</Text>
            <Text style={styles.thinkingTimestamp}>Notebook Entry · {entry.timestamp}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar aligned with main Feed */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Matches</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Banner when the user hasn't posted anything yet */}
        {userEntries.length === 0 && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Write a thought in the composer to personalize matches. Currently showing matching minds for your draft or default seed:
            </Text>
            <Text style={styles.seedText}>
              "{referenceText}"
            </Text>
          </View>
        )}

        {/* Matches Feed Listing */}
        <View style={styles.resultsContainer}>
          {activeMatches.length > 0 ? (
            activeMatches.map(match => renderMatchRow(match))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching thoughts found. Try writing a longer thought draft.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#000000',
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    height: 40,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#000000',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 10,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  infoBanner: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1c1c1e',
  },
  infoBannerText: {
    color: '#8e8e93',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  seedText: {
    color: '#ffffff',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  resultsContainer: {
    marginTop: 5,
  },
  postContainer: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    backgroundColor: 'transparent',
  },
  matchHeaderInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 50, // 44px avatar column + 6px gap
  },
  insightIcon: {
    marginRight: 6,
  },
  insightText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  row: {
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  rightColumn: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  entryText: {
    color: '#e5e5ea',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  thinkingTimestamp: {
    color: '#636366',
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#636366',
    fontSize: 14,
    textAlign: 'center',
  },
});
