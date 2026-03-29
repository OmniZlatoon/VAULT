import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants/theme';
import PhotosTab from './PhotosTab';
import FilesTab from './FilesTab';
import { useAuth } from './GlobalVariables/AuthContext';

export default function HomeScreen({ navigation }) {
  const [activeMainTab, setActiveMainTab] = useState('Photos');

  const { user}= useAuth();
  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Image
            src={user?.photoURL}
            style={styles.profileIcon} 
          />
        </TouchableOpacity>
        
        {/* Main Toggle (Photos / Files) */}
        <View style={styles.pillContainer}>
          <TouchableOpacity 
            style={activeMainTab === 'Photos' ? styles.pillActive : styles.pillInactive}
            onPress={() => setActiveMainTab('Photos')}
          >
            <Text style={activeMainTab === 'Photos' ? styles.pillTextActive : styles.pillTextInactive}>
              Photos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeMainTab === 'Files' ? styles.pillActive : styles.pillInactive}
            onPress={() => setActiveMainTab('Files')}
          >
            <Text style={activeMainTab === 'Files' ? styles.pillTextActive : styles.pillTextInactive}>
              Files
            </Text>
          </TouchableOpacity>
        </View>

        <Icon name="diamond-outline" size={24} color={COLORS.textSecondary} />
      </View>

      {/* Conditionally Render Parent Tabs */}
      {activeMainTab === 'Photos' ? <PhotosTab /> : <FilesTab />}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 25, backgroundColor: COLORS.background2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  profileIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface },
  pillContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 20, padding: 4 },
  pillActive: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  pillInactive: { paddingHorizontal: 16, paddingVertical: 6 },
  pillTextActive: { color: COLORS.textPrimary, fontWeight: '600' },
  pillTextInactive: { color: COLORS.textSecondary, fontWeight: '600' },
});