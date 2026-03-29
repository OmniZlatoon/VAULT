import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../constants/theme';

export default function GalleryView() {
  return (
    <View style={styles.container}>
      <Icon name="image-off-outline" size={100} color={COLORS.surfaceLight} style={styles.icon} />
      <Text style={styles.title}>No Gallery content found</Text>
      <Text style={styles.subtitle}>Photos and videos on your device will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 100 },
  icon: { marginBottom: 24 },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
});