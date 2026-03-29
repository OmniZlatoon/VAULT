import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform 
} from 'react-native';
import { Svg, Path } from "react-native-svg";
import { COLORS } from "./../constants/theme";

// Defining the Interface for Props
interface BackButtonProps {
  onPress: () => void;
}

export const BackButton = ({ onPress }: BackButtonProps) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.backButtonContainer}
    activeOpacity={0.6}
  >
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path 
        d="M15 18L9 12L15 6" 
        stroke={COLORS.textSecondary || '#A0A0A0'} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </Svg>
    <Text style={styles.backButtonText}>Back</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 60 : 20, 
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary || '#A0A0A0',
    marginLeft: 4,
    fontWeight: '400',
  },
});