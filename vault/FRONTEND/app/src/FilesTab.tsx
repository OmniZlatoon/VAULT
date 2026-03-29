import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal, 
  Pressable, 
  PanResponder 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants/theme';

export default function FilesTab() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false); // Added State

  const navItems = [
    { name: 'Home', icon: 'home' },
    { name: 'My files', icon: 'folder-outline' },
    { name: 'Shared', icon: 'account-multiple-outline' },
    { name: 'Vault', icon: 'safe-square-outline' },
    { name: 'Offline', icon: 'check-circle-outline' }
  ];

  const recentFiles = [
    { id: '1', title: 'Liberty_University_Essay', size: '35 KB', date: '19 Aug 2025' },
    { id: '2', title: 'Signal_Strength..._AI_Equations', size: '37 KB', date: '30 Jul 2025' },
    { id: '3', title: 'Secure edge an...werpoint point', size: '19 KB', date: '23 Jul 2025', shared: true },
    { id: '4', title: 'Green cloud questions', size: '38 KB', date: '18 Jul 2025', shared: true },
    { id: '5', title: 'energy tracking', size: '23 KB', date: '17 Jul 2025' },
  ];

  // PanResponder to detect swipe down gesture to close the drawer
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) { // If swiped down more than 50 pixels
          setIsDrawerVisible(false);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Top File Nav */}
      <View style={styles.navContainer}>
        {navItems.map((item) => (
          <TouchableOpacity key={item.name} style={styles.navItem} onPress={() => setActiveTab(item.name)}>
            <Icon 
              name={item.icon} 
              size={24} 
              color={activeTab === item.name ? COLORS.activeBlue : COLORS.textSecondary} 
            />
            <Text style={[styles.navText, activeTab === item.name && styles.navTextActive]}>
              {item.name}
            </Text>
            {activeTab === item.name && <View style={styles.activeBorder} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Recent Files Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent files</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
        </View>

        {recentFiles.map((file) => (
          <View key={file.id} style={styles.fileRow}>
            <Icon name="file-word-box" size={40} color="#2B579A" style={styles.fileIcon} />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>{file.title}</Text>
              <View style={styles.fileMeta}>
                {file.shared && <Icon name="account-multiple" size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />}
                <Text style={styles.fileMetaText}>{file.size} · {file.date}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Icon name="dots-horizontal" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Offline Files Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Offline files</Text>
        </View>
        <View style={styles.fileRow}>
          <Icon name="file-word-box" size={40} color="#2B579A" style={styles.fileIcon} />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>footfall and loca...otion overview</Text>
            <Text style={styles.fileMetaText}>Waiting for Wi-Fi</Text>
          </View>
          <TouchableOpacity>
            <Icon name="dots-vertical" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar (Search & FAB) */}
      <View style={styles.bottomOverlay}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={COLORS.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search your files" 
            placeholderTextColor={COLORS.textPrimary}
          />
        </View>
        {/* Added onPress to open the drawer */}
        <TouchableOpacity style={styles.fab} onPress={() => setIsDrawerVisible(true)}>
          <Icon name="plus" size={30} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM ACTION DRAWER --- */}
      <Modal
        visible={isDrawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDrawerVisible(false)} // Handles Android hardware back button
      >
        <View style={styles.modalOverlay}>
          {/* Tapping the backdrop closes the modal */}
          <Pressable style={styles.modalBackdrop} onPress={() => setIsDrawerVisible(false)} />
          
          {/* Drawer Content */}
          <View style={styles.drawerContent} {...panResponder.panHandlers}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>Add new</Text>
            
            <View style={styles.drawerActionsRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="folder-plus-outline" size={25} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>Folder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="image-filter-center-focus" size={25} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>Scan photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="upload-outline" size={25} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background2 || '#000000' },
  navContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface || '#1E1E1E' },
  navItem: { alignItems: 'center', paddingVertical: 12, flex: 1 },
  navText: { color: COLORS.textSecondary || '#A0A0A0', fontSize: 12, marginTop: 4 },
  navTextActive: { color: COLORS.activeBlue || '#3B82F6', fontWeight: 'bold' },
  activeBorder: { position: 'absolute', bottom: -1, width: '60%', height: 3, backgroundColor: COLORS.activeBlue || '#3B82F6', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  scrollContent: { paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  sectionTitle: { color: COLORS.textPrimary || '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  seeAllText: { color: COLORS.activeBlue || '#3B82F6', fontSize: 14, fontWeight: 'bold' },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  fileIcon: { marginRight: 16, backgroundColor: '#FFFFFF', borderRadius: 4 },
  fileDetails: { flex: 1, justifyContent: 'center' },
  fileName: { color: COLORS.textPrimary || '#FFFFFF', fontSize: 16, marginBottom: 4 },
  fileMeta: { flexDirection: 'row', alignItems: 'center' },
  fileMetaText: { color: COLORS.textSecondary || '#A0A0A0', fontSize: 13 },
  bottomOverlay: { position: 'absolute', bottom: 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  searchContainer: { width: 250,  flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A192F', borderRadius: 30, paddingHorizontal: 16, height: 56, marginRight: 16 },
  searchInput: { flex: 1, color: COLORS.textPrimary || '#FFFFFF', marginLeft: 12, fontSize: 16 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.activeBlue || '#3B82F6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  // Drawer & Modal Styles added here
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
  },
  drawerContent: {
    backgroundColor: '#1E1E1E', // Dark surface color
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 29, // Padding for safe area/bottom screen edge
    paddingTop: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#555555',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  drawerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS.bottomAction, // Slightly lighter gray for the buttons
    width: 120, // Gives them equal spacing
    height: 3,
    aspectRatio: 1.4, // Makes them perfectly square
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 8,
  },
});