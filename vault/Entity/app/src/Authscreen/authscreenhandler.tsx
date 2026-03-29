import {useState} from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar ,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../../../constants/theme'; // Adjust path as needed
import {Svg, Path} from 'react-native-svg';
import { useGoogleAuth } from './../googlesignin/googlesignin';
import { router } from 'expo-router';

export default function AuthHandlerScreen({ navigation }: any) {

const { handleGoogleSignIn } = useGoogleAuth();
 const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    
        const onSignInPress = async () => {
              setIsLoggingOut(true); // 1. Start the spinner
              try {
               const response=  await handleGoogleSignIn(); // 2. Call the external function
                
                // 3. Reset states and navigate
                // (If you have global states like setUserInfo, call them here)
                if (response){
                    router.replace('/');
                }
                else{
                    
                    setIsLoggingOut(false); 
                }
              } catch (error) {
                // Hide spinner if it fails
                Alert.alert("Error", "LogIn failed.");
              }
            }
          
            const manualsignup = async ()=>{
                try{
                router.push('/src/createAccount/manualsignup');
                }
                catch(error){
                    console.log(" page not found");
                }
            }
     
    
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
     

      {/* Professional Graphic Section */}
      <View style={styles.imageContainer}>
        {/* Replace the source with your AI-generated asset */}
        <Image 
          source={require('../../../assets/images/android-icon-foreground.png')} 
          style={styles.mainImage}
          resizeMode="contain"
        />
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.title}>All your files in one place</Text>
        <Text style={styles.subtitle}>
          Securely store, share, and manage your documents with advanced encryption and AI optimization.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={manualsignup}
        >
          <Text style={styles.primaryButtonText}>Create account</Text>
        </TouchableOpacity>

       <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={onSignInPress}
        >
        <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </Svg>
        <Text style={styles.secondaryButtonText}>Sign in with Google</Text>
</TouchableOpacity>

        {/* Branding Footer */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>Powered by </Text>
          <Text style={[styles.brandText, { fontWeight: 'bold', color: COLORS.activeBlue }]}>
            Vault
          </Text>
        </View>
      </View>

      {/* --- THE OVERLAY STAYS HERE --- */}
            <Modal transparent visible={isLoggingOut}>
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={{ color: '#fff', marginTop: 10 }}>Signing in...</Text>
                </View>
              </View>
            </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Deep black for professional contrast
    paddingBottom: 40
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  skipText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    top: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center',
    
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#A0A0A0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#3B82F6', // Professional Active Blue
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
 secondaryButton: {
    flexDirection: 'row', // Aligns children horizontally
    backgroundColor: 'transparent',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center', // Centers the row content horizontally
    alignItems: 'center',     // Centers the row content vertically
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12, // Adds space between the icon and the text
  },
  brandContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  brandText: {
    color: '#555555',
    fontSize: 14,
  },
//Overlay styles for loading...
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