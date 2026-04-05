import { useState } from "react";
import { Alert } from "react-native";
import { 
  GoogleSignin, 
  statusCodes ,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth"; 
import { auth } from "../../firebaseConfig";

GoogleSignin.configure({
  webClientId: "60475244724-rgtssfve9fnj9l5cagab1isqc283qiqg.apps.googleusercontent.com",
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export const useGoogleAuth = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<boolean | null>(null);


  // handle google sign in by getting the idtoken from google, sending it to the backend end, and then await response.ok from before setting the user info and auth success states to true

 
  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 1. Trigger Google account picker
      const googleUser = await GoogleSignin.signIn();

      // 2. We get idToken from Google SignIn result
      const idToken = (googleUser as any).idToken || (googleUser as any)?.data?.idToken;
      console.log(idToken);
      if (!idToken) {
        throw new Error("Google Sign-In did not return an idToken");
      }
    
      // 3. Exchange Google ID token for Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseUserCredential = await signInWithCredential(auth, credential);
      const firebaseUser = firebaseUserCredential.user;

      // 4. Get Firebase ID token (to send to backend for server-side verification)
      const serverIdToken = await firebaseUser.getIdToken(true);
      console.log("Signed-in Firebase user", firebaseUser.uid);

      const backendData = await SendIdTokenToBackend(serverIdToken);
      if (backendData) {
        setUserInfo(firebaseUser);
        setAuthSuccess(true);
      }
      return backendData;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
        console.log("User cancelled the login flow.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign-in already in progress.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Google Play Services", "Please update your Google Play Services to sign in.");
      } else {
        Alert.alert("Login Failed", error.message || "An unexpected error occurred.");
        console.log("Sign-in Error:", error);
      }
      setErrorMessage("Server Error!");
      setAuthSuccess(false);
      return null;
    }
  };


      // 2. Send Token to Backend for Verification
    const SendIdTokenToBackend = async (idToken: string) => {
     try {
    const response = await fetch('https://subtarsal-kathyrn-untreated.ngrok-free.dev/nexasoft/users/google-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`, // Standard Bearer token format
        'ngrok-skip-browser-warning': '69420' // Optional: Skip ngrok browser warning if using ngrok
      },
    });

    // 3. Handle the Backend Response
    if (response.ok) {
      const backendData = await response.json();
      
      // Successfully verified by your Node.js/NestJS server
      setUserInfo(backendData.user); 
      setAuthSuccess(true);
      
      console.log("Authentication successful and verified by backend.");
      return backendData;
    } else {
      // Backend rejected the token (status 401, 500, etc.)
      const errorData = await response.json();
      throw new Error(errorData.message || "Backend verification failed.");
    }

  } catch (error: any) {
    // Handle specific Google Sign-In cancellation
    if (error.code === 'SIGN_IN_CANCELLED') {
      console.log("User cancelled the login flow.");
    } else {
      Alert.alert("Login Failed", error.message || "An unexpected error occurred.");
      console.log("Sign-in Error:", error);
    }
    setErrorMessage(" Server Error!");
    setAuthSuccess(false);
    return null;
  } finally {
    setErrorMessage(" Server Error!");
  }
};

  const handleGoogleSignout = async () => {
    try {

      // check if user is signed in from google before revoking Access to avoid errors
        const IsSignedin= await GoogleSignin.hasPreviousSignIn();
        if(IsSignedin){
              try{
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
          }
        catch(googleError)
        {
          console.log(" user not signed in to google: Bypassing...", googleError);
        }
      }
      await signOut(auth); // sign-out from Database
      
      setUserInfo(null);
      setAuthSuccess(false);
      return true;
  
    } catch (error) {
      Alert.alert("Sign-out Error", "We couldn't sign you out. Please try again.");
      console.log(error);
      return false;
    }
  };

// handle Add Account ....
  const handleaddaccount= async()=>{
    try {
      const isSignedIn = await GoogleSignin.hasPreviousSignIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
      // If not signed in, do nothing (just proceed to sign-in flow)
    } catch (error) {
      console.log(" error adding new account", error);
    }
  }

  return {
    userInfo,
    errorMessage,
    authSuccess,
    handleGoogleSignIn,
    handleGoogleSignout,
    handleaddaccount
  };
};