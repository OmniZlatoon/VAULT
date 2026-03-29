import { useState} from 'react';
// 1. FIXED: Imported Image from 'react-native' instead of 'react-native-svg'
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native'; 
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants/theme';
import { useGoogleAuth } from './googlesignin/googlesignin';
import { useAuth } from './GlobalVariables/AuthContext';
import { router } from 'expo-router';

// --- Helper Component for Menu Items ---
function DrawerMenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={24} color={COLORS.textSecondary} />
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

// --- Main Drawer Component ---
export default function CustomDrawerContent(props) {
    const { handleGoogleSignIn, handleGoogleSignout, handleaddaccount } = useGoogleAuth();
    const { user } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [ isLoggingIn, setIsLoggingIn]= useState(false);

    const onSignOutPress = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          setIsLoggingOut(true); // 1. Start the spinner
          try {
            await handleGoogleSignout(); // 2. Call the external function
            
            
            // 3. Reset states and navigate
            // (If you have global states like setUserInfo, call them here)
            
            router.replace('/src/Authscreen/authscreenhandler');
            console.log (" user logged out!");
          } catch (error) {
            setIsLoggingOut(false); // Hide spinner if it fails
            Alert.alert("Error", "Logout failed.");
          }
        }
      }
    ]);
  };

  // 2. ADD ACCOUNT LOGIC (The 2-way trigger)
  const onAddAccountPress = async () => {
    try {
       setIsLoggingIn(true);
       // sign out user from Google only

       if (user){
        await handleaddaccount();
       }
      // Step B: Trigger Google Sign In modal for new account
      const result = await handleGoogleSignIn(); 
     
      // Step C: If sign-in fails or is cancelled, kick them back to auth screen
      setIsLoggingIn(false);
      if ( result === null) {
         console.log("Account switch cancelled");
      }
      else{
        setIsLoggingIn(false);
      }
      
    } catch (error) {
      setIsLoggingIn(false);
      console.log("Add account failed/cancelled:", error);
      // Optional: Redirect to auth screen if they cancel mid-switch
     // router.replace('/src/Authscreen/authscreenhandler');
    }
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        
        {/* Account Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.accountTabs}>
            <View style={styles.activeAccountTab}>
              
              <View style={styles.avatarPlaceholder}>
                {/* 2. FIXED: Conditional rendering for Profile Pic */}
                {user?.photoURL ? (
                  <Image 
                    source={{ uri: user.photoURL }} 
                    style={styles.profileIcon} 
                  />
                ) : (
                  <Icon name="account-circle" size={48} color={COLORS.textSecondary} />
                )}
              </View>

              <Text style={[styles.accountTabText, { color: COLORS.primary }]}>
                {user ? "Personal" : "Guest"}
              </Text>
              <View style={styles.activeTabIndicator} />
            </View>

            <TouchableOpacity style={styles.inactiveAccountTab} onPress={onAddAccountPress}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.surfaceLight }]}>
                <Icon name="plus" size={24} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.accountTabText}>Add account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. FIXED: Display Email if logged in, otherwise show "Not signed in" */}
        <Text style={styles.emailText}>
          {user ? (user.email || user.displayName) : "Not signed in"}
        </Text>

        {/* Camera Backup Banner */}
        <View style={styles.drawerBanner}>
          <Icon name="camera-off-outline" size={24} color={COLORS.textSecondary} />
          <View style={styles.drawerBannerTextContainer}>
            <Text style={styles.bannerTitle}>Camera backup is off</Text>
            <Text style={styles.bannerSubtitle}>
              Turn on camera backup to automatically back up your photos and videos.
            </Text>
            <TouchableOpacity style={styles.turnOnButtonOutline}>
              <Text style={styles.turnOnText}>Turn on</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <DrawerMenuItem icon="trash-can-outline" label="Recycle bin" onPress={null} />
          <DrawerMenuItem icon="cog-outline" label="Settings" onPress={null} />
          <DrawerMenuItem icon="help-circle-outline" label="Help and feedback" onPress={null} />
          
          {/* 4. FIXED: Only show the sign-out button if a user is currently signed in */}
          {user && (
            <DrawerMenuItem icon="logout" onPress={onSignOutPress} label="Sign out" />
          )}
        </View>

      </DrawerContentScrollView>

      {/* Bottom Storage Section */}
      <View style={styles.storageSection}>
        <View style={styles.storageHeader}>
          <Icon name="cloud-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.storageTitle}>Cloud storage</Text>
        </View>
        <Text style={styles.storageUsageText}>
          <Text style={{ color: COLORS.primary }}>102.4 MB</Text> used of 5 GB (2%)
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>
        <TouchableOpacity style={styles.premiumButton}>
          <Icon name="diamond-outline" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.premiumButtonText}>Go premium</Text>
        </TouchableOpacity>
      </View>

      {/* --- THE OVERLAY STAYS HERE ( FOR LOGGING OUT) --- */}
      <Modal transparent visible={isLoggingOut}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Signing out...</Text>
          </View>
        </View>
      </Modal>
    {/* ------ FOR ADD ACCOUNT ( SIGN IN)*/}
    <Modal transparent visible={isLoggingIn}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Signing in...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    borderRadius: 30, 
    paddingRight: 1,
    backgroundColor: COLORS.background1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  accountTabs: {
    flexDirection: 'row',
  },
  activeAccountTab: {
    alignItems: 'center',
    marginRight: 24,
  },
  inactiveAccountTab: {
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden', // 5. FIXED: Ensures the image doesn't bleed out of the circle
  },
  profileIcon: { 
    width: 48, // 6. FIXED: Changed to 48 to perfectly fill the avatarPlaceholder
    height: 48, 
    borderRadius: 24, 
    backgroundColor: COLORS.surface 
  },
  accountTabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabIndicator: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  emailText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  drawerBanner: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  drawerBannerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  bannerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  bannerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  turnOnButtonOutline: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  turnOnText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginLeft: 16,
  },
  storageSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginLeft: 12,
  },
  storageUsageText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginBottom: 24,
  },
  progressBarFill: {
    width: '2%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  premiumButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.activeBlue,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darken the whole screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#1E1E1E', 
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: 200,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
});