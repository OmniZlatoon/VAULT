import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  TextInput,
  Modal,
  Pressable,
  PanResponder
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants/theme'; // Adjust this import based on your actual path

// Import the 4 Sub-view components
import RecentView from './PhotoSubTab/RecentView';
import GalleryView from './PhotoSubTab/GalleryView';
import AlbumsView from './PhotoSubTab/AlbumView';
import FavouritesView from './PhotoSubTab/FavouritesView';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PhotosTab() {
  const [activeSubTab, setActiveSubTab] = useState(2); // Default to 'Albums' (Index 2)
  const [isDrawerVisible, setIsDrawerVisible] = useState(false); // State for the bottom drawer
  const scrollViewRef = useRef(null);

  const tabs = [
    { name: 'Recent', icon: 'star-four-points-outline' },
    { name: 'Gallery', icon: 'view-grid' },
    { name: 'Albums', icon: 'book-open-page-variant-outline' },
    { name: 'Favourites', icon: 'star-outline' }
  ];

  // PanResponder to detect swipe down gesture to close the drawer
  const panResponder = useRef(
    PanResponder.create({
      // Only claim the responder if the user is dragging downwards clearly
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) { // If swiped down more than 50 pixels
          setIsDrawerVisible(false);
        }
      },
    })
  ).current;

  // Function to handle clicking a tab button
  const handleTabPress = (index) => {
    setActiveSubTab(index);
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  // Function to update the tab index when the user swipes manually
  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollOffset / SCREEN_WIDTH);
    if (currentIndex !== activeSubTab) {
      setActiveSubTab(currentIndex);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- CUSTOM TAB BAR --- */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => {
          const isActive = activeSubTab === index;
          return (
            <TouchableOpacity 
              key={tab.name} 
              style={styles.tabItem} 
              onPress={() => handleTabPress(index)}
            >
              <Icon 
                name={tab.icon} 
                size={24} 
                color={isActive ? COLORS.primary : COLORS.textSecondary} 
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.name}
              </Text>
              {isActive && <View style={styles.activeTabBottomBorder} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- SWIPEABLE CONTENT AREA --- */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll} 
        contentOffset={{ x: 2 * SCREEN_WIDTH, y: 0 }} 
        style={styles.scrollViewStyle}
      >
        <View style={{ width: SCREEN_WIDTH }}><RecentView /></View>
        <View style={{ width: SCREEN_WIDTH }}><GalleryView /></View>
        <View style={{ width: SCREEN_WIDTH }}><AlbumsView /></View>
        <View style={{ width: SCREEN_WIDTH }}><FavouritesView /></View>
      </ScrollView>

      {/* --- FLOATING SEARCH BAR & FAB --- */}
      <View style={styles.bottomOverlay}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={COLORS.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search your photos" 
            placeholderTextColor={COLORS.textPrimary}
          />
        </View>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setIsDrawerVisible(true)} // Open the Drawer
        >
          <Icon name="plus" size={30} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM ACTION DRAWER --- */}
      <Modal
        visible={isDrawerVisible}
        animationType= "slide"
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
                <Text style={styles.actionText}>Album</Text>
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
  
  // Tab Bar Styles
  tabsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.surface || '#1E1E1E' 
  },
  tabItem: { alignItems: 'center', position: 'relative', paddingBottom: 8, flex: 1 },
  tabText: { color: COLORS.textSecondary || '#A0A0A0', fontSize: 12, marginTop: 4 },
  tabTextActive: { color: COLORS.textPrimary || '#FFFFFF', fontWeight: 'bold' },
  activeTabBottomBorder: { 
    position: 'absolute', 
    bottom: -1, 
    width: '60%', 
    height: 3, 
    backgroundColor: COLORS.primary || '#7C3AED', 
    borderTopLeftRadius: 3, 
    borderTopRightRadius: 3 
  },

  // Scroll Area
  scrollViewStyle: { flex: 1 },

  // Footer Styles
  bottomOverlay: { 
    position: 'absolute', 
    bottom: 20, 
    left: 16, 
    right: 16, 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center' ,
    marginBottom: 20
  },
  searchContainer: { 
    width: 250, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0A192F', 
    borderRadius: 30, 
    paddingHorizontal: 16, 
    height: 56, 
    marginRight: 16 
  },
  searchInput: { flex: 1, color: COLORS.textPrimary || '#FFFFFF', marginLeft: 12, fontSize: 16 },
  fab: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: COLORS.primaryDark || '#5B21B6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5 
  },

  // Bottom Drawer Styles
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