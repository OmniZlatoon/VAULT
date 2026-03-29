import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../constants/theme';

export default function AlbumsView() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="notebook-outline" size={80} color="#B57EDC" />
      </View>
      <Text style={styles.title}>Your albums will show up here</Text>
      <Text style={styles.subtitle}>Tap + to create your first album.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 100 },
  iconContainer: { marginBottom: 24, padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: '#B57EDC', borderStyle: 'dashed' },
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14 },
});