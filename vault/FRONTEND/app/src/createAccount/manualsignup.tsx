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
  ActivityIndicator, // <-- NEW: Imported for loading spinner
  Image
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { auth, database } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail, 
} from 'firebase/auth';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');


// --- Reusable Floating Label Input ---
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  icon,
  rightIcon
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
    outputRange: [COLORS.textGray, COLORS.primaryBlue],
  });

  return (
    <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
      <Animated.View style={[styles.labelContainer, { top }]}>
        <Animated.Text style={[styles.label, { fontSize, color }]}>{label}</Animated.Text>
      </Animated.View>
      <View style={styles.inputInner}>
        {icon && <View style={styles.leftIconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor={COLORS.textGray}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
    </View>
  );
};

// --- Main Screen Component ---
export default function AuthScreen() {
  const [currentView, setCurrentView] = useState<'selector' | 'signIn' | 'signUp'>('selector');
  const [errorMessage, seterrorMessage] = useState<string | null>(null);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Loading & Success States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation States
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle');
  const [passwordScore, setPasswordScore] = useState<0 | 1 | 2 | 3>(0); 

  // --- Real-time Email Checker ---
  useEffect(() => {
    const checkEmail = async () => {
      if (currentView !== 'signUp' || !email.includes('@') || !email.includes('.')) {
        setEmailStatus('idle');
        return;
      }
      setEmailStatus('checking');
      try {
        // fetchSignInMethodsForEmail returns an array of sign-in methods linked to this email 
        // (e.g., ['password'], ['google.com']). If it's > 0, the email exists.
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          setEmailStatus('exists');
        } else {
          setEmailStatus('available');
        }
      } catch (error) {
        console.log("Error checking email:", error);
        setEmailStatus('idle');
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkEmail();
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [email, currentView]);

  // --- Real-time Password Checker ---
  useEffect(() => {
    if (password.length === 0) {
      setPasswordScore(0);
      return;
    }
    let score = 1; 
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    if (password.length >= 8 && (hasLower || hasUpper) && hasNumber) {
      score = 2; 
    }
    if (password.length >= 8 && hasLower && hasUpper && hasNumber && hasSpecial) {
      score = 3; 
    }
    setPasswordScore(score as 1 | 2 | 3);
  }, [password]);

  const handleSignup = async () => {
    if (emailStatus === 'exists') return;
    
    setIsSubmitting(true);
    seterrorMessage(null);
    
    try {
      const UserRef = await createUserWithEmailAndPassword(auth, email, password);
      const user = UserRef.user;

      await setDoc(doc(database, "users", user.uid), {
        email: email,
        createdAt: new Date().toISOString(),
        user_id: user.uid
      });
      
      setIsSubmitting(false);
      setIsSuccess(true);
      
     setTimeout(() => {
      // 1. Reset the success/loading states so the Sign In button looks normal
      setIsSuccess(false);
      // 2. Clear the password for security, but keep the email for convenience
      setPassword(''); 
      // 3. Switch the view
      setCurrentView('signIn');
    }, 1500); // 1.5 seconds delay

    } catch(error: any) {
      setIsSubmitting(false);
      
      // Highly valid error checking
      switch (error.code) {
        case 'auth/email-already-in-use':
          seterrorMessage("This email is already registered to another account.");
          break;
        case 'auth/invalid-email':
          seterrorMessage("The email address is improperly formatted.");
          break;
        case 'auth/weak-password':
          seterrorMessage("Your password is too weak. Please use a stronger password.");
          break;
        case 'auth/network-request-failed':
          seterrorMessage("Network error. Please check your internet connection.");
          break;
        default:
          seterrorMessage(error.message || "An unexpected error occurred during sign up.");
          break;
      }
    }
  };

  const handleSignin = async() => {
    setIsSubmitting(true);
    seterrorMessage(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      setIsSubmitting(false);
      setIsSuccess(true);
      getToken();
      setTimeout(() => {
        // router.push('/otp'); 
      }, 1000);

    } catch(error: any) {
      setIsSubmitting(false);
      
      // Highly valid error checking
      switch (error.code) {
        case 'auth/invalid-email':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          seterrorMessage("Invalid email or password. Please try again.");
          break;
        case 'auth/user-disabled':
          seterrorMessage("This account has been disabled. Contact support.");
          break;
        case 'auth/network-request-failed':
          seterrorMessage("Network error. Please check your internet connection.");
          break;
        case 'auth/too-many-requests':
          seterrorMessage("Too many attempts. Please try again later.");
          break;
        default:
          seterrorMessage("An unexpected error occurred during sign in.");
          break;
      }
    }
  };

  const resetForms = () => {
    setEmail('');
    setPassword('');
    seterrorMessage(null); // Clears error message on back button
    setEmailStatus('idle');
    setPasswordScore(0);
    setIsSubmitting(false);
    setIsSuccess(false);
  };


  // Handle backend communication--------
 // get idtoken from currently signed in user
   const getToken = async () => {
     const user = auth.currentUser;
     if (user) {
       const idToken = await user.getIdToken();
       console.log("ID Token:", idToken);
       SendIdtokentoServer(idToken, email);
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
             pathname: '/src/otpscreen/otp',
             params: { email: email} 
           });
         }, 500);
       } else {
         alert(result.message || "Failed to initialize OTP verification");
        
       }
     } catch(error) {
       console.log(" Backend error", error);
       seterrorMessage(" Server Error! Contact your developer");
       
     }
   };
 

  // --- Icons ---
  const EmailIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></Svg>;
  const LockIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.textGray}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></Svg>;
  const BackArrowIcon = <Svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={COLORS.white}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18L9 12L15 6" /></Svg>;
  
  // Success state checkmark inside button
  const WhiteCheck = <Svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={COLORS.white}><Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></Svg>;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.imageContainer}>
            <Image 
             source={require( "./../../../assets/images/android-icon-foreground.png")}
              style={styles.headerImage} 
              resizeMode="contain"
            />
          </View>

          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* 1. SELECTOR VIEW */}
          {currentView === 'selector' && (
            <Animated.View style={styles.formPanel}>
              <Text style={styles.titleText}>Protect your files and access them anywhere</Text>
              
              <Pressable style={styles.primaryBtn} onPress={() => { resetForms(); setCurrentView('signIn'); }}>
                <Text style={styles.primaryBtnText}>Sign in</Text>
              </Pressable>

              <Pressable style={styles.outlineBtn} onPress={() => { resetForms(); setCurrentView('signUp'); }}>
                <Text style={styles.outlineBtnText}>Create new account</Text>
              </Pressable>

              <Pressable style={styles.returnBtn} onPress={()=> router.back('/../vault/app/src/Authscreen/authscreenhandler.tsx')}>
                {BackArrowIcon}
                <Text style={styles.returnBtnText}>Back</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 2. SIGN IN VIEW */}
          {currentView === 'signIn' && (
            <Animated.View style={styles.formPanel}>
              <FloatingInput 
                label="Email Address" 
                keyboardType="email-address" 
                value={email} 
                onChangeText={setEmail} 
                icon={EmailIcon} 
              />
              <FloatingInput 
                label="Password" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
                icon={LockIcon} 
              />
              
              <Pressable 
                style={[styles.primaryBtn, isSuccess && styles.successBtn]} 
                onPress={handleSignin}
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : isSuccess ? (
                  WhiteCheck
                ) : (
                  <Text style={styles.primaryBtnText}>Sign in</Text>
                )}
              </Pressable>

              <Pressable style={styles.returnBtn} onPress={() =>{ resetForms(); setCurrentView('selector'); }}>
                {BackArrowIcon}
                <Text style={styles.returnBtnText}>Return To Selector</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 3. SIGN UP VIEW */}
          {currentView === 'signUp' && (
            <Animated.View style={styles.formPanel}>
              
              <FloatingInput 
                label="Email Address" 
                keyboardType="email-address" 
                value={email} 
                onChangeText={setEmail} 
                icon={EmailIcon} 
              />
              
              {/* Dynamic Email Text Validation */}
              {emailStatus === 'exists' && (
                <Text style={styles.validationErrorText}>Email in use.</Text>
              )}
              {emailStatus === 'available' && (
                <Text style={styles.validationSuccessText}>available.</Text>
              )}
              {emailStatus === 'checking' && (
                <Text style={styles.validationCheckingText}> Checking email availability...</Text>
              )}

              <FloatingInput 
                label="Password" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
                icon={LockIcon} 
              />
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={[styles.strengthBar, passwordScore >= 1 ? { backgroundColor: COLORS.error } : null]} />
                  <View style={[styles.strengthBar, passwordScore >= 2 ? { backgroundColor: COLORS.warning } : null]} />
                  <View style={[styles.strengthBar, passwordScore >= 3 ? { backgroundColor: COLORS.success } : null]} />
                </View>
              )}

              <Pressable 
                style={[
                  styles.primaryBtn, 
                  emailStatus === 'exists' && { opacity: 0.5 },
                  isSuccess && styles.successBtn
                ]} 
                onPress={handleSignup}
                disabled={emailStatus === 'exists' || isSubmitting || isSuccess}
              >
                 {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : isSuccess ? (
                  WhiteCheck
                ) : (
                  <Text style={styles.primaryBtnText}>Create Account</Text>
                )}
              </Pressable>

              <Pressable style={styles.returnBtn} onPress={() => { resetForms(); setCurrentView('selector'); }}>
                {BackArrowIcon}
                <Text style={styles.returnBtnText}>Return To Selector</Text>
              </Pressable>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerImage: {
    width: 250,
    height: 200,
  },
  titleText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
  },
  formPanel: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.googleBorder,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  inputContainerFocused: {
    borderColor: COLORS.primaryBlue,
    borderWidth: 2,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  labelContainer: {
    position: 'absolute',
    left: 12,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  label: {
    fontWeight: '400',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
  },
  // Validation Styles
  validationErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 16,
    marginLeft: 4,
  },
  validationSuccessText: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 16,
    marginLeft: 4,
  },
  validationCheckingText: {
    color: COLORS.textGray,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 16,
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    backgroundColor: COLORS.googleBorder,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  // Button Styles
  primaryBtn: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  successBtn: {
    backgroundColor: COLORS.success, 
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
  },
  outlineBtnText: {
    color: COLORS.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.googleBorder,
    borderRadius: 8,
    height: 52,
    backgroundColor: 'transparent',
    width: '100%',
    marginTop: 16,
  },
  returnBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
  }
});