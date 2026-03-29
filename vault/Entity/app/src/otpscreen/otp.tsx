import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton } from './../../../components/Backbutton';

// AMENDMENT: Import your color root from your theme file. 
// (Adjust the path '../../constants/theme' if your folder structure differs)
import { COLORS } from '../../../constants/theme'; 

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const { email } = useLocalSearchParams();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Refs & Animations
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // --- Timer Logic ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); 
    }
  };

  // --- Input Logic ---
  const handleOtpChange = (text: string, index: number) => {
    const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (cleanedText.length > 1) {
      const pasteArray = cleanedText.slice(0, 6).split('');
      const newOtp = [...otp];
      pasteArray.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      
      const nextFocus = Math.min(index + pasteArray.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanedText;
    setOtp(newOtp);

    if (cleanedText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  // --- Action Handlers ---
  const handleVerify = async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    setErrorMessage(null); 

    try {
      const response = await fetch("https://subtarsal-kathyrn-untreated.ngrok-free.dev/nexasoft/users/verifyOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email, 
          otp: otp.join('') 
        }),
      });
      
      const result = await response.json().catch(() => ({})); 

      if (response.ok) {
        setIsLoading(false);
        setIsSuccess(true);
      
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          router.replace('/'); 
        }, 1500);

      } else {
        setIsLoading(false);
        setErrorMessage(result.message || "Invalid OTP code. Please try again.");
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Network error. Please check your connection.");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setOtp(['', '', '', '', '', '']); 
    setErrorMessage(null);
    setSuccessMessage(null);
    setResendCooldown(60);            
    inputRefs.current[0]?.focus();    

    try {
      const response = await fetch("https://subtarsal-kathyrn-untreated.ngrok-free.dev/nexasoft/users/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email 
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
       setSuccessMessage("A new OTP has been sent to your email.");
      } else {
        setErrorMessage(result.message || "Failed to resend OTP. Please try again.");
        setResendCooldown(0); 
      }
    } catch (error) {
      setErrorMessage("Network error. Could not connect to the server.");
      setResendCooldown(0); 
    }
  };

  const isButtonDisabled = otp.join('').length !== 6 || isLoading;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.header}>
        <BackButton onPress={handleGoBack} />
      </View>

      <View style={styles.contentWrapper}>
        {!isSuccess ? (
          <Animated.View style={{ width: '100%', opacity: isSuccess ? 0 : 1 }}>
            
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.pageTitle}>Verify your Email</Text>
              <Text style={styles.subtitleText}>Enter the 6-character code sent to your email</Text>
            </View>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = digit.length > 0;
                
                return (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      (isFocused || isFilled) && styles.otpInputActive,
                      errorMessage && styles.otpInputError 
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    keyboardType="default"
                    autoCapitalize="characters"
                    maxLength={Platform.OS === 'android' ? undefined : 6} 
                    textContentType="oneTimeCode" 
                    selectionColor={COLORS.activeBlue} // AMENDMENT: Changed to activeBlue cursor
                    keyboardAppearance="dark" // AMENDMENT: Forces iOS keyboard to be dark mode
                  />
                );
              })}
            </View>

            {/* Resend Link */}
            <View style={styles.resendContainer}>
              <TouchableOpacity 
                onPress={handleResend} 
                disabled={resendCooldown > 0}
                activeOpacity={0.6}
              >
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyBtn, isButtonDisabled && styles.verifyBtnDisabled]}
              onPress={handleVerify}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
              ) : (
                <Text style={[styles.verifyBtnText, isButtonDisabled && styles.verifyBtnTextDisabled]}>
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>

            {/* --- ERROR MESSAGE UI --- */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            {/* --- SUCCESS MESSAGE UI (FOR RESEND) --- */}
            {successMessage && (
              <View style={styles.successMessageContainer}>
                <Text style={styles.successMessageText}>{successMessage}</Text>
              </View>
            )}

          </Animated.View>
        ) : (
          /* --- SUCCESS STATE --- */
          <View style={styles.successState}>
            <Animated.View style={[styles.successIconWrapper, { transform: [{ scale: scaleAnim }] }]}>
              {/* AMENDMENT: SVG checkmark color updated to match dark theme */}
              <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.background2}>
                <Path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7" 
                />
              </Svg>
            </Animated.View>
            <Text style={styles.successTitle}>Verified!</Text>
            <Text style={styles.subtitleText}>Your email has been successfully verified.</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background2, // AMENDMENT: Deep black background
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight, // AMENDMENT: Subtle dark separator
    marginTop: 5, 
    top: 3,
    marginBottom: -15,
    backgroundColor: 'transparent' // AMENDMENT: Removed white background
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
    maxWidth: 450, 
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary, // AMENDMENT: White text
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 15,
    color: COLORS.textSecondary, // AMENDMENT: Grey text
    textAlign: 'center',
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8, 
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1, 
    borderColor: COLORS.surfaceLight, // AMENDMENT: Darker border by default
    borderRadius: 12,
    backgroundColor: COLORS.surface, // AMENDMENT: Dark grey surface box
    fontSize: 24,
    fontWeight: '500', // Slightly bolder for better legibility on dark
    color: COLORS.textPrimary, // AMENDMENT: White input text
    textAlign: 'center',
  },
  otpInputActive: {
    borderColor: COLORS.activeBlue, // AMENDMENT: Glows blue when typing
    borderWidth: 1.5, 
    backgroundColor: COLORS.background1, // Slight shift in background on focus
  },
  otpInputError: {
    borderColor: COLORS.error, 
    borderWidth: 1.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.activeBlue, // AMENDMENT: Professional active blue
  },
  resendTextDisabled: {
    color: COLORS.textSecondary, // AMENDMENT: Dimmed grey when disabled
  },
  verifyBtn: {
    backgroundColor: COLORS.activeBlue, // AMENDMENT: Main action color
    height: 56, // AMENDMENT: Matched height of your other Auth buttons
    borderRadius: 16, // AMENDMENT: Smoother, more modern radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    backgroundColor: COLORS.surfaceLight, // AMENDMENT: Deep grey when disabled
  },
  verifyBtnText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  verifyBtnTextDisabled: {
    color: COLORS.textSecondary, // AMENDMENT: Dim text when disabled
  },
  
  /* --- ERROR/SUCCESS MESSAGE STYLES --- */
  errorContainer: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(234, 67, 53, 0.1)', // AMENDMENT: Transparent red background
    borderWidth: 1,
    borderColor: 'rgba(234, 67, 53, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  successMessageContainer: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(58, 228, 103, 0.1)', // AMENDMENT: Transparent green background
    borderWidth: 1,
    borderColor: 'rgba(58, 228, 103, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  successState: {
    alignItems: 'center',
    paddingTop: 185
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary, // AMENDMENT: White title
    marginBottom: 8,
  },
});