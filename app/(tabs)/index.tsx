import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp, MatchResult } from '@/context/AppContext';

export default function FeedScreen() {
  const { entries, addReply, toggleResonance, replyDrafts, setReplyDraft, getMatches, draftText, shareEntryPublicly } = useApp();
  const { posted } = useLocalSearchParams<{ posted?: string }>();
  const router = useRouter();

  // Scroll View reference to scroll-to-top on Toast "View" click
  const scrollViewRef = useRef<ScrollView>(null);

  // Track which entries have their threads expanded
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({
    '3': true, // Pre-expand Elon Musk's thread
  });
  
  // Track input text for replies per entry ID
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Flash highlight state for the top/first item
  const [highlightFirst, setHighlightFirst] = useState(false);

  // Focused Reply Modal State
  const [activeReplyEntryId, setActiveReplyEntryId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // 3-Dots Options Menu State
  const [optionsEntryId, setOptionsEntryId] = useState<string | null>(null);

  // Related Search State
  const [searchEntryId, setSearchEntryId] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'Aligned' | 'Complementary' | 'Challenging' | null>(null);

  const handleOpenOptions = (entryId: string) => {
    setOptionsEntryId(entryId);
  };

  const handleCloseOptions = () => {
    setOptionsEntryId(null);
  };

  const handleSelectSearch = (type: 'Aligned' | 'Complementary' | 'Challenging') => {
    if (optionsEntryId) {
      setSearchEntryId(optionsEntryId);
      setSearchType(type);
    }
    setOptionsEntryId(null); // Close options menu
  };

  const handleCloseSearchModal = () => {
    setSearchEntryId(null);
    setSearchType(null);
  };

  const handleOpenReplyModal = (entryId: string) => {
    setActiveReplyEntryId(entryId);
    setReplyInputText(replyDrafts[entryId] || '');
  };

  const handleCloseReplyModal = () => {
    setActiveReplyEntryId(null);
    setReplyInputText('');
  };

  const handleReplyInputChange = (text: string) => {
    setReplyInputText(text);
    if (activeReplyEntryId) {
      setReplyDraft(activeReplyEntryId, text);
    }
  };

  const handleSendModalReply = () => {
    if (!activeReplyEntryId || !replyInputText.trim()) return;
    addReply(activeReplyEntryId, replyInputText.trim(), 'You');
    setActiveReplyEntryId(null);
    setReplyInputText('');
    
    // Trigger toast in feed screen
    router.setParams({ posted: 'true' });
  };

  const parentEntry = entries.find(e => e.id === activeReplyEntryId);

  useEffect(() => {
    if (posted === 'true') {
      setShowToast(true);
      // Fade in toast
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Clean up search params
      router.setParams({ posted: undefined });

      const dismissTimer = setTimeout(() => {
        handleDismissToast();
      }, 4000);

      return () => clearTimeout(dismissTimer);
    }
  }, [posted]);

  const handleDismissToast = () => {
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowToast(false);
    });
  };

  const handleViewPost = () => {
    // Scroll to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Trigger flash highlight
    setHighlightFirst(true);
    handleDismissToast();
    setTimeout(() => {
      setHighlightFirst(false);
    }, 2000);
  };

  const toggleThread = (entryId: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const handleSendReply = (entryId: string) => {
    const text = replyTexts[entryId];
    if (!text || !text.trim()) return;
    
    addReply(entryId, text.trim(), 'You');
    setReplyTexts(prev => ({
      ...prev,
      [entryId]: ''
    }));
  };

  const handleNavigateToCompose = () => {
    router.push('/capture');
  };

  // 1. Filter out user's private entries
  const notebookEntries = entries.filter(e => e.author === 'You');

  // 2. Fetch matches based on latest notebook entry, draft, or default seed
  const referenceText = notebookEntries.length > 0
    ? notebookEntries[0].text
    : (draftText.trim().length > 0
        ? draftText
        : 'A quiet notebook app where writing down thoughts feels low-stakes, completely free from algorithms, vanity likes, and social metrics.');

  const matches = getMatches(referenceText);
  const activeMatches = matches.filter(m => m.entry.author !== 'You' && m.score > 5);

  // Model 3: Resonance Spark (top match score >= 70%)
  const topMatch = activeMatches.length > 0 && activeMatches[0].score >= 70 ? activeMatches[0] : null;
  const otherMatches = topMatch ? activeMatches.slice(1) : activeMatches;

  const renderFeedEntry = (entry: any, index: number, isExpanded: boolean, hasReplies: boolean, isFirst: boolean) => {
    return (
      <View 
        key={entry.id} 
        style={[
          styles.postContainer,
          isFirst && highlightFirst && styles.highlightedPost
        ]}
      >
        {/* Main Post Row */}
        <View style={styles.entryRow}>
          {/* Left Column: Avatar & Line */}
          <View style={styles.leftColumn}>
            <View style={[styles.avatarCircle, { backgroundColor: entry.avatarColor }]}>
              <Text style={styles.avatarText}>{entry.avatar}</Text>
            </View>
            {isExpanded && (
              <View style={styles.verticalThreadLine} />
            )}
          </View>

          {/* Right Column: Content & Details */}
          <View style={styles.rightColumn}>
            {/* Header: Author Info */}
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{entry.author}</Text>
              <TouchableOpacity 
                style={styles.moreOptionsButton}
                onPress={() => handleOpenOptions(entry.id)}
                activeOpacity={0.6}
              >
                <Feather name="more-horizontal" size={16} color="#636366" />
              </TouchableOpacity>
            </View>

            {/* Post Body */}
            <Text style={styles.entryText}>{entry.text}</Text>

            {/* Quiet Timestamp (Bottom of text) */}
            <Text style={styles.thinkingTimestamp}>
              Notebook Entry · {entry.timestamp}
            </Text>

            {/* Horizontal Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => toggleResonance(entry.id)}
                activeOpacity={0.6}
              >
                <Feather 
                  name="activity" 
                  size={18} 
                  color={entry.hasResonated ? '#F0706A' : '#8e8e93'} 
                />
                {entry.hasResonated && <View style={styles.resonanceDot} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => handleOpenReplyModal(entry.id)}
                activeOpacity={0.6}
              >
                <Feather name="message-square" size={18} color="#8e8e93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="repeat" size={18} color="#8e8e93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="send" size={18} color="#8e8e93" />
              </TouchableOpacity>
            </View>

            {/* Collapsed Reply Count Metadata */}
            {!isExpanded && hasReplies && (
              <TouchableOpacity
                style={styles.metadataRow}
                onPress={() => toggleThread(entry.id)}
              >
                <Text style={styles.metadataText}>
                  {entry.replies.length} {entry.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Expanded Thread Replies Container */}
        {isExpanded && (
          <View style={styles.repliesContainer}>
            <View style={styles.repliesConnectorLine} />

            {entry.replies.map((reply: any) => (
              <View key={reply.id} style={styles.replyRow}>
                {/* Left Column (Reply Avatar) */}
                <View style={styles.replyLeftColumn}>
                  <View style={[styles.avatarCircle, { backgroundColor: reply.avatarColor, width: 32, height: 32, borderRadius: 16 }]}>
                    <Text style={[styles.avatarText, { fontSize: 12 }]}>{reply.avatar}</Text>
                  </View>
                </View>

                {/* Right Column (Reply Content) */}
                <View style={styles.replyRightColumn}>
                  <View style={styles.replyHeader}>
                    <Text style={styles.replyAuthor}>{reply.author}</Text>
                    <Text style={styles.replyTimestamp}>{reply.timestamp}</Text>
                  </View>
                  <Text style={styles.replyText}>{reply.text}</Text>
                </View>
              </View>
            ))}

            {/* Inline Reply Composer Box aligned to the grid */}
            <View style={styles.replyRow}>
              <View style={styles.replyLeftColumn}>
                <View style={[styles.avatarCircle, { backgroundColor: '#F0706A', width: 26, height: 26, borderRadius: 13 }]}>
                  <Text style={[styles.avatarText, { fontSize: 10 }]}>Y</Text>
                </View>
              </View>

              <View style={styles.replyRightColumn}>
                <View style={styles.inlineReplyWrapper}>
                  <View style={styles.inlineReplyBox}>
                    <TextInput
                      style={styles.inlineReplyInput}
                      placeholder="Add a reply..."
                      placeholderTextColor="#636366"
                      value={replyTexts[entry.id] || ''}
                      onChangeText={val => setReplyTexts(prev => ({ ...prev, [entry.id]: val }))}
                      maxLength={300}
                    />
                    <TouchableOpacity style={styles.inlineExpandButton} activeOpacity={0.6}>
                      <Feather name="maximize-2" size={14} color="#8e8e93" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.inlineSendButtonWhite}
                    onPress={() => handleSendReply(entry.id)}
                    activeOpacity={0.6}
                  >
                    <Feather name="arrow-up" size={18} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderMatchedEntry = (match: MatchResult, isExpanded: boolean, hasReplies: boolean) => {
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
        {/* Match Header Insight */}
        <View style={styles.matchHeaderInsight}>
          <Feather name="compass" size={11} color={matchColor} style={styles.insightIcon} />
          <Text style={[styles.insightText, { color: matchColor }]}>
            {matchLabel} · {reason}
          </Text>
        </View>

        {/* Main Post Row */}
        <View style={styles.entryRow}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            <View style={[styles.avatarCircle, { backgroundColor: entry.avatarColor }]}>
              <Text style={styles.avatarText}>{entry.avatar}</Text>
            </View>
            {isExpanded && (
              <View style={styles.verticalThreadLine} />
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{entry.author}</Text>
              <TouchableOpacity 
                style={styles.moreOptionsButton}
                onPress={() => handleOpenOptions(entry.id)}
                activeOpacity={0.6}
              >
                <Feather name="more-horizontal" size={16} color="#636366" />
              </TouchableOpacity>
            </View>

            <Text style={styles.entryText}>{entry.text}</Text>

            <Text style={styles.thinkingTimestamp}>
              Notebook Entry · {entry.timestamp}
            </Text>

            {/* Horizontal Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => toggleResonance(entry.id)}
                activeOpacity={0.6}
              >
                <Feather 
                  name="activity" 
                  size={18} 
                  color={entry.hasResonated ? '#F0706A' : '#8e8e93'} 
                />
                {entry.hasResonated && <View style={styles.resonanceDot} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionIcon} 
                onPress={() => handleOpenReplyModal(entry.id)}
                activeOpacity={0.6}
              >
                <Feather name="message-square" size={18} color="#8e8e93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="repeat" size={18} color="#8e8e93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} activeOpacity={0.6}>
                <Feather name="send" size={18} color="#8e8e93" />
              </TouchableOpacity>
            </View>

            {/* Collapsed Reply Count Metadata */}
            {!isExpanded && hasReplies && (
              <TouchableOpacity
                style={styles.metadataRow}
                onPress={() => toggleThread(entry.id)}
              >
                <Text style={styles.metadataText}>
                  {entry.replies.length} {entry.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Expanded Thread Replies Container */}
        {isExpanded && (
          <View style={styles.repliesContainer}>
            <View style={styles.repliesConnectorLine} />

            {entry.replies.map((reply: any) => (
              <View key={reply.id} style={styles.replyRow}>
                <View style={styles.replyLeftColumn}>
                  <View style={[styles.avatarCircle, { backgroundColor: reply.avatarColor, width: 32, height: 32, borderRadius: 16 }]}>
                    <Text style={[styles.avatarText, { fontSize: 12 }]}>{reply.avatar}</Text>
                  </View>
                </View>

                <View style={styles.replyRightColumn}>
                  <View style={styles.replyHeader}>
                    <Text style={styles.replyAuthor}>{reply.author}</Text>
                    <Text style={styles.replyTimestamp}>{reply.timestamp}</Text>
                  </View>
                  <Text style={styles.replyText}>{reply.text}</Text>
                </View>
              </View>
            ))}

            {/* Inline Reply Composer Box aligned to the grid */}
            <View style={styles.replyRow}>
              <View style={styles.replyLeftColumn}>
                <View style={[styles.avatarCircle, { backgroundColor: '#F0706A', width: 26, height: 26, borderRadius: 13 }]}>
                  <Text style={[styles.avatarText, { fontSize: 10 }]}>Y</Text>
                </View>
              </View>

              <View style={styles.replyRightColumn}>
                <View style={styles.inlineReplyWrapper}>
                  <View style={styles.inlineReplyBox}>
                    <TextInput
                      style={styles.inlineReplyInput}
                      placeholder="Add a reply..."
                      placeholderTextColor="#636366"
                      value={replyTexts[entry.id] || ''}
                      onChangeText={val => setReplyTexts(prev => ({ ...prev, [entry.id]: val }))}
                      maxLength={300}
                    />
                    <TouchableOpacity style={styles.inlineExpandButton} activeOpacity={0.6}>
                      <Feather name="maximize-2" size={14} color="#8e8e93" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.inlineSendButtonWhite}
                    onPress={() => handleSendReply(entry.id)}
                    activeOpacity={0.6}
                  >
                    <Feather name="arrow-up" size={18} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Calculate search results matches
  const searchEntry = entries.find(e => e.id === searchEntryId);
  const searchMatches = searchEntry ? getMatches(searchEntry.text) : [];
  const filteredSearchMatches = searchMatches.filter(m => m.entry.id !== searchEntryId && m.type === searchType && m.score > 5);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      {/* Centered Borderless Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <View style={[styles.avatarCircle, { backgroundColor: '#F0706A', width: 28, height: 28 }]}>
              <Text style={[styles.avatarText, { fontSize: 12 }]}>Y</Text>
            </View>
          </View>
          
          <Text style={styles.headerTitle}>Comellon</Text>
          
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="more-horizontal" size={20} color="#636366" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {entries.map((entry, index) => {
            // Render Private Notebook Card
            if (entry.isPrivate) {
              return (
                <View key={entry.id} style={styles.privateCardContainer}>
                  <View style={styles.privateCardHeader}>
                    <View style={styles.privateCardLockRow}>
                      <Feather name="lock" size={14} color="#8e8e93" style={{ marginRight: 6 }} />
                      <Text style={styles.privateCardLockText}>Private Notebook</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.privateCardShareButton} 
                      onPress={() => shareEntryPublicly(entry.id)}
                      activeOpacity={0.6}
                    >
                      <Feather name="share-2" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.privateCardShareText}>Share Publicly</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.privateCardBody}>{entry.text}</Text>
                  
                  <Text style={styles.privateCardTimestamp}>
                    Timestamp · {entry.timestamp}
                  </Text>
                </View>
              );
            }

            // Render standard public timeline feed row
            const isExpanded = !!expandedEntries[entry.id];
            const hasReplies = entry.replies.length > 0;
            const isFirst = index === 0;

            return renderFeedEntry(entry, index, isExpanded, hasReplies, isFirst);
          })}
        </View>
      </ScrollView>

      {/* Threads Web-Style Bottom Toast Notification */}
      {showToast && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>Thought dropped.</Text>
          <TouchableOpacity onPress={handleViewPost} style={styles.toastButton}>
            <Text style={styles.toastButtonText}>View</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Focused Reply Modal Overlay */}
      <Modal
        visible={activeReplyEntryId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseReplyModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseReplyModal} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reply</Text>
            <View style={{ width: 56 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            {parentEntry && (
              <View style={styles.modalBody}>
                {/* Parent Post Row */}
                <View style={styles.modalParentRow}>
                  {/* Left Column: Avatar & Continuous Line */}
                  <View style={styles.modalLeftColumn}>
                    <View style={[styles.avatarCircle, { backgroundColor: parentEntry.avatarColor }]}>
                      <Text style={styles.avatarText}>{parentEntry.avatar}</Text>
                    </View>
                    <View style={styles.modalThreadLine} />
                  </View>

                  {/* Right Column: Author Info & Text */}
                  <View style={styles.modalRightColumn}>
                    <View style={styles.replyHeader}>
                      <Text style={styles.authorName}>{parentEntry.author}</Text>
                      <Text style={styles.timestampMuted}>{parentEntry.timestamp}</Text>
                    </View>
                    <Text style={styles.modalParentText}>{parentEntry.text}</Text>
                  </View>
                </View>

                {/* User Reply Row */}
                <View style={styles.modalReplyRow}>
                  {/* Left Column: User Avatar */}
                  <View style={styles.modalLeftColumn}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#F0706A' }]}>
                      <Text style={styles.avatarText}>Y</Text>
                    </View>
                  </View>

                  {/* Right Column: Reply input area */}
                  <View style={styles.modalRightColumn}>
                    <Text style={styles.authorName}>You</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder={`Reply to ${parentEntry.author}...`}
                      placeholderTextColor="#636366"
                      multiline
                      autoFocus
                      value={replyInputText}
                      onChangeText={handleReplyInputChange}
                      maxLength={1000}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Optional Attachment Icons & Post Button at bottom */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalFooter}>
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

              <View style={styles.modalFooterRight}>
                {replyInputText.length > 900 && (
                  <Text style={styles.characterCount}>
                    {1000 - replyInputText.length}
                  </Text>
                )}
                <TouchableOpacity 
                  onPress={handleSendModalReply} 
                  disabled={!replyInputText.trim()} 
                  style={[styles.modalFooterPostButton, !replyInputText.trim() && styles.modalFooterPostButtonDisabled]}
                  activeOpacity={0.6}
                >
                  <Text style={styles.modalFooterPostText}>Drop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 3-Dots Options Bottom Sheet Modal */}
      <Modal
        visible={optionsEntryId !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseOptions}
      >
        <TouchableOpacity 
          style={styles.optionsOverlay} 
          activeOpacity={1} 
          onPress={handleCloseOptions}
        >
          <View style={styles.optionsContent}>
            <Text style={styles.optionsHeaderTitle}>Thought Connections</Text>
            
            <TouchableOpacity 
              style={styles.optionsItem} 
              onPress={() => handleSelectSearch('Aligned')}
            >
              <Feather name="compass" size={16} color="#F0706A" style={{ marginRight: 12 }} />
              <Text style={styles.optionsItemText}>Search Aligned thoughts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionsItem} 
              onPress={() => handleSelectSearch('Complementary')}
            >
              <Feather name="compass" size={16} color="#8e8e93" style={{ marginRight: 12 }} />
              <Text style={styles.optionsItemText}>Search Complementary perspectives</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionsItem} 
              onPress={() => handleSelectSearch('Challenging')}
            >
              <Feather name="compass" size={16} color="#E28743" style={{ marginRight: 12 }} />
              <Text style={styles.optionsItemText}>Search Challenging takes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionsItem, styles.optionsItemCancel]} 
              onPress={handleCloseOptions}
            >
              <Text style={styles.optionsCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Related Search Results Modal Sheet */}
      <Modal
        visible={searchEntryId !== null && searchType !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseSearchModal}
      >
        <SafeAreaView style={styles.searchModalSafeArea}>
          {/* Header */}
          <View style={styles.searchModalHeader}>
            <TouchableOpacity onPress={handleCloseSearchModal} style={styles.searchModalBackButton}>
              <Feather name="chevron-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.searchModalTitle}>
              {searchType} Takes
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.searchModalScrollContent} keyboardShouldPersistTaps="handled">
            {searchEntry && (
              <View style={styles.searchModalBody}>
                {/* Parent Post locked at top of search results */}
                <View style={styles.searchModalParentCard}>
                  <View style={styles.entryRow}>
                    <View style={styles.leftColumn}>
                      <View style={[styles.avatarCircle, { backgroundColor: searchEntry.avatarColor }]}>
                        <Text style={styles.avatarText}>{searchEntry.avatar}</Text>
                      </View>
                      <View style={styles.searchModalThreadLine} />
                    </View>
                    <View style={styles.rightColumn}>
                      <Text style={styles.authorName}>{searchEntry.author}</Text>
                      <Text style={styles.searchParentText}>{searchEntry.text}</Text>
                    </View>
                  </View>
                </View>

                {/* Matches List */}
                <View style={{ marginTop: 12 }}>
                  {filteredSearchMatches.length > 0 ? (
                    filteredSearchMatches.map(match => {
                      const { entry, score, reason } = match;
                      
                      let matchColor = '#8e8e93';
                      if (searchType === 'Aligned') matchColor = '#F0706A';
                      if (searchType === 'Challenging') matchColor = '#E28743';

                       return (
                         <View key={entry.id} style={styles.postContainer}>
                           <View style={styles.matchHeaderInsight}>
                             <Feather name="compass" size={11} color={matchColor} style={styles.insightIcon} />
                             <Text style={[styles.insightText, { color: matchColor }]}>
                               {score}% {searchType} · {reason}
                             </Text>
                           </View>

                           <View style={styles.entryRow}>
                             <View style={styles.leftColumn}>
                               <View style={[styles.avatarCircle, { backgroundColor: entry.avatarColor }]}>
                                 <Text style={styles.avatarText}>{entry.avatar}</Text>
                               </View>
                             </View>
                             <View style={styles.rightColumn}>
                               <Text style={styles.authorName}>{entry.author}</Text>
                               <Text style={styles.entryText}>{entry.text}</Text>
                               <Text style={styles.thinkingTimestamp}>Notebook Entry · {entry.timestamp}</Text>
                             </View>
                           </View>
                         </View>
                       );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Feather name="compass" size={28} color="#636366" style={{ marginBottom: 12 }} />
                      <Text style={styles.emptyText}>No {searchType?.toLowerCase()} takes found on this thought.</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
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
    position: 'relative',
    height: 40,
  },
  headerAvatar: {
    position: 'absolute',
    left: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  headerButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingLeft: 8,
    paddingRight: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  taglineSection: {
    marginVertical: 20,
    alignItems: 'center',
  },
  taglineText: {
    color: '#636366',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  quietDivider: {
    height: 1,
    backgroundColor: '#1c1c1e',
    width: '30%',
    marginTop: 14,
  },
  postContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    backgroundColor: 'transparent',
  },
  highlightedPost: {
    backgroundColor: '#141414',
    borderRadius: 8,
  },
  entryRow: {
    flexDirection: 'row',
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
  verticalThreadLine: {
    position: 'absolute',
    top: 44,
    bottom: -20, // Connect down into the expanded replies
    width: 2,
    backgroundColor: '#1c1c1e',
  },
  rightColumn: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 20,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  moreOptionsButton: {
    padding: 2,
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
  metadataRow: {
    marginTop: 10,
  },
  metadataText: {
    color: '#636366',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  repliesContainer: {
    marginTop: 16,
    position: 'relative',
  },
  repliesConnectorLine: {
    position: 'absolute',
    left: 21, // 44px width / 2 = 22 minus 1px half-width of line = 21
    top: -16,
    bottom: 26, // stop before the inline reply box avatar
    width: 2,
    backgroundColor: '#1c1c1e',
  },
  replyRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  replyLeftColumn: {
    alignItems: 'center',
    width: 44,
    marginRight: 6,
  },
  replyRightColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  replyAuthor: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  replyTimestamp: {
    color: '#636366',
    fontSize: 11,
    marginLeft: 6,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  replyText: {
    color: '#d1d1d6',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  inlineReplyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineReplyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 10,
    height: 40,
    borderWidth: 0,
    flex: 1,
    marginRight: 8,
  },
  inlineReplyInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    padding: 0,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  inlineExpandButton: {
    padding: 4,
    marginLeft: 4,
  },
  inlineSendButtonWhite: {
    backgroundColor: '#ffffff',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Toast container styling matching Threads Web layout (bottom-left) vs Mobile layout (bottom-center)
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 100, // Above bottom tabs on mobile
    left: Platform.OS === 'web' ? 24 : 16,
    right: Platform.OS === 'web' ? undefined : 16,
    width: Platform.OS === 'web' ? 320 : undefined,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  toastButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toastButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  privateCardContainer: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1c1c1e',
  },
  privateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  privateCardLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateCardLockText: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  privateCardShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0706A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  privateCardShareText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  privateCardBody: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  privateCardTimestamp: {
    color: '#636366',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  optionsContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 16,
  },
  optionsHeaderTitle: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  optionsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  optionsItemCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
    justifyContent: 'center',
  },
  optionsItemText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  optionsCancelText: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  searchModalSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  searchModalBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  searchModalTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  searchModalScrollContent: {
    paddingBottom: 40,
  },
  searchModalBody: {
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  searchModalParentCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1c1c1e',
    opacity: 0.85,
  },
  searchModalThreadLine: {
    width: 2,
    backgroundColor: '#2c2c2e',
    flex: 1,
    alignSelf: 'center',
    marginVertical: 4,
  },
  searchParentText: {
    color: '#d1d1d6',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  toggleTabActive: {
    borderBottomColor: '#ffffff',
  },
  toggleTabText: {
    color: '#636366',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  toggleTabTextActive: {
    color: '#ffffff',
  },
  sparkCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1c1c1e',
  },
  sparkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkTitle: {
    color: '#F0706A',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  sparkScoreContainer: {
    backgroundColor: '#3b2512',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 'auto',
  },
  sparkScoreText: {
    color: '#E28743',
    fontSize: 10,
    fontWeight: '700',
  },
  sparkSubtitle: {
    color: '#8e8e93',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  sparkBody: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  sparkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1c1c1e',
    paddingTop: 10,
  },
  sparkInsightText: {
    color: '#E28743',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  sparkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sparkActionText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
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
  emptyLink: {
    marginTop: 14,
    backgroundColor: '#1c1c1e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  emptyLinkText: {
    color: '#F0706A',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  matchHeaderInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 50, // 44px left column + 6px gap
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
  pillContainer: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
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
  modalFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFooterPostButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#F0706A',
    borderRadius: 16,
    marginLeft: 12,
  },
  modalFooterPostButtonDisabled: {
    opacity: 0.5,
  },
  modalFooterPostText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalBody: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  modalParentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  modalLeftColumn: {
    alignItems: 'center',
    width: 44,
    marginRight: 6,
    position: 'relative',
  },
  modalThreadLine: {
    position: 'absolute',
    top: 44,
    bottom: -16,
    width: 2,
    backgroundColor: '#1c1c1e',
  },
  modalRightColumn: {
    flex: 1,
  },
  timestampMuted: {
    color: '#636366',
    fontSize: 12,
    marginLeft: 8,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalParentText: {
    color: '#8e8e93',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalReplyRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  modalTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    padding: 0,
    marginTop: 4,
    minHeight: 120,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
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
});
