import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../constants/theme';

export default function FavouritesView() {
  return (
    <View style={styles.container}>
      <Icon name="star-circle" size={100} color="#B57EDC" style={styles.icon} />
      <Text style={styles.title}>No favourites yet</Text>
      <Text style={styles.subtitle}>Mark photos and videos as favourites to see them here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 100 },
  icon: { marginBottom: 24 },
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});