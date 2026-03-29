import React, { useState, useRef, useEffect } from 'react';
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import {Svg, Path, Circle } from 'react-native-svg';
import { auth, database } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode
} from "@react-native-google-signin/google-signin"

GoogleSignin.configure({
   webClientId: "60475244724-rgtssfve9fnj9l5cagab1isqc283qiqg.apps.googleusercontent.com",
   offlineAccess: true, // <--- THIS is the magic trigger
   forceCodeForRefreshToken: true, // Forces the explicit consent UI
});

const { width } = Dimensions.get('window');

// --- Color Palette ---
const COLORS = {
  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  primarySoft: '#EDE9FE',
  white: '#FFFFFF',
  grayLight: '#F9FAFB',
  greyIcon: '#5F6368',
  googleBorder: '#DADCE0', // Thin Google-style border
  textDark: '#3C4043',     // Google-style text
  textGray: '#80868B',     // Google-style placeholder
  success: '#10B981',
  successSoft: '#e3fdf0',  // Light green background
  error: '#fc7d7d',        // Red error text/border
  errorSoft: '#fff7f7',    // Light red error background
};

 export const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.backButtonContainer}
    activeOpacity={0.6}
  >
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path 
        d="M15 18L9 12L15 6" 
        stroke={COLORS.greyIcon} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </Svg>
    <Text style={styles.backButtonText}>Back</Text>
  </TouchableOpacity>
);

// --- Reusable Floating Label Input ---
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon: React.ReactNode;
  editable?: boolean;
  onPress?: () => void;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  icon,
  editable = true,
  onPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const top = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -10],
  });

  const fontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const color = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.textGray, COLORS.primary],
  });

  const inputWrapper = (
    <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
      <Animated.View style={[styles.labelContainer, { top }]}>
        <Animated.Text style={[styles.label, { fontSize, color }]}>{label}</Animated.Text>
      </Animated.View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        pointerEvents={editable ? 'auto' : 'none'}
      />
      <View style={styles.iconContainer}>{icon}</View>
    </View>
  );

  if (!editable && onPress) {
    return <Pressable onPress={onPress}>{inputWrapper}</Pressable>;
  }
  return inputWrapper;
};

// --- Main Screen Component ---
export default function AuthScreen() {
  const [userInfo, setuserinfo] = useState<any>(null);
  const [isSignIn, setIsSignIn] = useState(false);
  const [errorMessage, seterrorMessage] = useState<string | null | any>(null);
  const [authSuccess, setAuthSuccess] = useState(false); // <--- NEW STATE FOR BUTTON SUCCESS
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // GOOGLE SIGN-IN LOGIC -----------------------//
 const googlesignin = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();
    
    // 1. Exchange Google ID Token for Firebase Credential
    const credential = GoogleAuthProvider.credential(data.idToken);
    
    // 2. Sign into Firebase
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    // 3. Now save to Firestore using the Firebase UID
    await setDoc(doc(database, "users", firebaseUser.uid), {
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photo: firebaseUser.photoURL,
      lastLogin: new Date().toISOString()
    }, { merge: true }); // Merge prevents overwriting existing data

    console.log("User successfully stored in Firestore!");
    setuserinfo(data);

  } catch (error) {
    console.log("--- FULL ERROR DATA ---");
    console.log("Error Code:", error?.code);
    console.log("Error Message:", error?.message);
    console.log("Is it recognized by library?", isErrorWithCode(error));

    const errorCode = error?.code;

    if (errorCode === statusCodes.SIGN_IN_CANCELLED || errorCode === '12501') {
      console.log("User has canceled the request (Handled via code check).");
    } else if (errorCode === statusCodes.IN_PROGRESS) {
      console.log("Sign-in is already in progress.");
    } else if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert("Google Play Services", "Please update your Google Play Services to sign in.");
    } else {
      console.log("A real, non-cancellation error occurred:", error);
      Alert.alert("Sign In Error", "Something went wrong. Please try again.");
    }
  }
};

// GOOGLE SIGN-OUT LOGIC ---------------------------------/
const handleSwitchAccount = async () => {
  try {
    seterrorMessage(null);
    setAuthSuccess(false); // Reset success state
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    setuserinfo(null);
    
    setData({
      email: '',
      password: '',
      name: '',
      gender: '',
      phone: ''
    });

    console.log("User signed out and state cleared.");
    seterrorMessage(null);
  } catch (error) {
    console.error("Logout Error:", error);
    Alert.alert("Error", "Could not sign out properly.");
  }
};

  // Form States
 const [data, setData] = useState({
    email: '',
    password: '',
    name: '',
    gender: '',
    phone: ''
  });

  const handleInput = (name: string, value: string) => {
    setData({ ...data, [name]: value });
    seterrorMessage(null);
    setAuthSuccess(false); // Reset button success on input change
  };
  
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const toggleAuthMode = (toSignIn: boolean) => {
    setIsSignIn(toSignIn);
    seterrorMessage(null); // Clear errors when switching
    setAuthSuccess(false); // Reset success button state when switching
    Animated.spring(slideAnimation, {
      toValue: toSignIn ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  };

  const sliderLeft = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  const handleSignup = async () => {
    try {
      seterrorMessage(null);
      const UserRef = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = UserRef.user;

      await setDoc(doc(database, "users", user.uid), {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
      });
      
      console.log('Signing up with', data);
      setAuthSuccess(true); // <--- Set Button to Green Success
      // Optional: Add a slight delay before navigating or alerting
      setTimeout(() => {
          alert(`user ${data.name} has been registered successfully`);
      }, 500);

    } catch(error) {
      seterrorMessage("An account already uses that email!");
      setAuthSuccess(false);
      console.log("Unable to sign in user ", error)
    }
  };

  const handleSignin = async() => {
    try {
      seterrorMessage(null);
      const response = await signInWithEmailAndPassword(auth, data.email, data.password)
      if (response.user) {
      //router.push('/otp');
        console.log(" User signed in successfully")
      }
      setAuthSuccess(true); // <--- Set Button to Green Success
      getToken();
      console.log(data);
    } catch(error) {
      seterrorMessage("Invalid email and Password!");
      setAuthSuccess(false);
      console.log(" Invalid email and password", error);
    }
  };

  // get idtoken from currently signed in user
  const getToken = async () => {
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      console.log("ID Token:", idToken);
      SendIdtokentoServer(idToken, data.email);
    } else {
      console.log("No user is signed in.");
    }
  };

  // send the IdToken to my NodeJs server for validation
  const SendIdtokentoServer = async (idToken: string, email: string) => {
    try {
      const response = await fetch("https://subtarsal-kathyrn-untreated.ngrok-free.dev/nexasoft/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${idToken}`,
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({email})
      });

      const result = await response.json();

      if (response.ok) {
        seterrorMessage(null);
        // Add a slight delay to let the green button animation be visible
        setTimeout(() => {
          router.push({
            pathname: '/otp',
            params: { email: email} 
          });
        }, 500);
      } else {
        alert(result.message || "Failed to initialize OTP verification");
        setAuthSuccess(false);
      }
    } catch(error) {
      console.log(" Backend error", error);
      seterrorMessage(" Server Error! Contact your developer");
      setAuthSuccess(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); 
    }
  };

  // --- Icons ---
  const UserIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></Svg>;
  const EmailIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></Svg>;
  const PhoneIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></Svg>;
  const LockIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></Svg>;
  const GenderIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></Svg>;
  
  // NEW: Success Check SVG
  const SuccessCheckIcon = <Svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={COLORS.success}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></Svg>;

  return (
    <View style={styles.container}>
    {/* Navigation Action */}
    <View style={styles.header}>
    <BackButton onPress={handleGoBack} />
    </View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          <Animated.View style={[styles.toggleSlider, { left: sliderLeft }]} />
          <Pressable style={styles.toggleBtn} onPress={() => toggleAuthMode(false)}>
            <Text style={[styles.toggleText, !isSignIn && styles.toggleTextActive]}>Sign Up</Text>
          </Pressable>
          <Pressable style={styles.toggleBtn} onPress={() => toggleAuthMode(true)}>
            <Text style={[styles.toggleText, isSignIn && styles.toggleTextActive]}>Sign In</Text>
          </Pressable>
        </View>

        {/* Dynamic Forms Container */}
        <View style={styles.formContainer}>
            {userInfo && (
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                {userInfo.user.photo && (
                  <Image 
                    source={{ uri: userInfo.user.photo }} 
                    style={styles.profileImage} 
                  />
                )}
                <View>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.userName}>{userInfo.user.name}</Text>
                </View>
              </View>
              
              <View style={styles.emailContainer}>
                <Text style={styles.userEmail}>{userInfo.user.email}</Text>
              </View>

              <TouchableOpacity onPress={handleSwitchAccount} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Not you? Switch Account</Text>
              </TouchableOpacity>
            </View>
          )}

           {errorMessage && (
        <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

          {!isSignIn ? 
          
          (
            /* SIGN UP FORM */
            <Animated.View style={styles.formPanel}>
              <FloatingInput label="name" value={data.name} onChangeText={(val) => handleInput('name', val)} icon={UserIcon} />
              <FloatingInput label="Email Address" keyboardType="email-address" value={data.email} onChangeText={(val) => handleInput('email', val)} icon={EmailIcon} />
              <FloatingInput label="Phone Number" keyboardType="phone-pad" value={data.phone} onChangeText={(val) => handleInput('phone', val)} icon={PhoneIcon} />
              <FloatingInput label="Password" secureTextEntry value={data.password} onChangeText={(val) => handleInput('password', val)} icon={LockIcon} />
              
              <FloatingInput 
                label="Gender" 
                value={data.gender} 
                onChangeText={(val) => handleInput('gender', val)}
                icon={GenderIcon} 
                editable={false} 
                onPress={() => setGenderModalVisible(true)} 
              />

              {/* NEW SUCCESS/NORMAL BTN STYLE */}
              <Pressable 
                style={({ pressed }) => [
                  styles.primaryBtn, 
                  pressed && !authSuccess && styles.primaryBtnPressed,
                  authSuccess && styles.primaryBtnSuccess 
                ]} 
                onPress={authSuccess ? undefined : handleSignup}
              >
                {authSuccess ? SuccessCheckIcon : <Text style={styles.primaryBtnText}>Create Account</Text>}
              </Pressable>

              <Text style={styles.termsText}>
                By signing up, you agree to our <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          ) : (
            /* SIGN IN FORM */
            <Animated.View style={styles.formPanel}>
              <FloatingInput label="Email Address" keyboardType="email-address" value={data.email} onChangeText={(val) => handleInput('email', val)} icon={EmailIcon} />
              <FloatingInput label="Password" secureTextEntry value={data.password} onChangeText={(val) => handleInput('password', val)} icon={LockIcon} />
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* NEW SUCCESS/NORMAL BTN STYLE */}
              <Pressable 
                style={({ pressed }) => [
                  styles.primaryBtn, 
                  pressed && !authSuccess && styles.primaryBtnPressed,
                  authSuccess && styles.primaryBtnSuccess 
                ]} 
                onPress={authSuccess ? undefined : handleSignin}
              >
                {authSuccess ? SuccessCheckIcon : <Text style={styles.primaryBtnText}>Sign In</Text>}
              </Pressable>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]} onPress={googlesignin} >
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </Svg>
                <Text style={styles.googleBtnText}>Sign in with Google</Text>
                
              </Pressable>
            </Animated.View>

            
          )}
        </View>

        <Text style={styles.footerText}>© 2024 StyleVerse. All rights reserved.</Text>
      </ScrollView>

      {/* Gender Selection Modal */}
      <Modal visible={genderModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setGenderModalVisible(false)}>
          <View style={styles.modalContent}>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={styles.modalOption} 
                onPress={() => { setData({ ...data, gender: option }); setGenderModalVisible(false); }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      

    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white, // No background, completely clean
  },
   header: { flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   padding: 32,
   borderBottomWidth: 1,
   borderBottomColor: COLORS.googleBorder,
   marginTop: 5, 
   top: 3,
   marginBottom: 2,
   backgroundColor: 'rgba(255,255,255,0.9)' },
          
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', // Keeps it at the top left regardless of form scroll
    top: Platform.OS === 'ios' ? 50 : 20, // Adjusts for notch/status bar
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.greyIcon,
    marginLeft: 4,
    fontWeight: '400',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24, // Responsive Google-like spacing
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 50,
    padding: 4,
    width: '100%',
    marginBottom: 32,
    position: 'relative',
    height: 48,
  },
  toggleSlider: {
    position: 'absolute',
    width: '48%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    top: 4,
  },
  toggleBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  formContainer: {
    width: '100%',
  },
  formPanel: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    height: 56,
    borderWidth: 1, // Thin Google-style border
    borderColor: COLORS.googleBorder,
    borderRadius: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  labelContainer: {
    position: 'absolute',
    left: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  label: {
    fontWeight: '300',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    paddingRight: 32, 
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primaryBtnPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnSuccess: {
    backgroundColor: COLORS.successSoft,
    borderColor: COLORS.success,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  termsText: {
    textAlign: 'center',
    color: COLORS.textGray,
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.googleBorder,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: COLORS.textGray,
    fontSize: 14,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.googleBorder,
    borderRadius: 8,
    height: 52,
    backgroundColor: COLORS.white,
    width: '100%',
  },
  googleBtnPressed: {
    backgroundColor: COLORS.grayLight,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textDark,
    marginLeft: 12,
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.textGray,
    fontSize: 12,
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  //Styles for the user details form
  profileCard: {
    backgroundColor: COLORS.grayLight,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.googleBorder,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: COLORS.primarySoft,
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emailContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.googleBorder,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  logoutBtn: {
    marginTop: 10,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  /* --- NEW ERROR STYLES --- */
  errorContainer: {
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.errorSoft,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});