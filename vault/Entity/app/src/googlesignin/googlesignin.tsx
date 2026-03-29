import { useState } from "react";
import { Alert } from "react-native";
import { 
  GoogleSignin, 
  statusCodes ,
  
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth"; 
// 1. ADDED: Imported getDoc
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { auth, database } from "../../firebaseConfig"; 

GoogleSignin.configure({
  webClientId: "60475244724-rgtssfve9fnj9l5cagab1isqc283qiqg.apps.googleusercontent.com",
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export const useGoogleAuth = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage(null);
      setAuthSuccess(null);
      
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const { data } = response;

      const credential = GoogleAuthProvider.credential(data.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // 2. CHECK IF USER EXISTS IN FIRESTORE
      const userDocRef = doc(database, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // 3. ONLY CREATE IF DOCUMENT DOES NOT EXIST
        await setDoc(userDocRef, {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          createdAt: new Date().toISOString(), // Good practice to track when they joined
          lastLogin: new Date().toISOString()
        });
        console.log("New user document created in Firestore!");
      } else {
        console.log("User already exists in Firestore. Bypassing creation.");
        // Optional: You could update just the lastLogin time here using updateDoc if you wanted to track activity.
      }

      setUserInfo(data);
      setAuthSuccess(true);

      return firebaseUser;
    } catch (error) {
      setAuthSuccess(false);
      const errorCode = error?.code;

      if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User canceled sign-in.");
        return false; 
      } else if (errorCode === statusCodes.IN_PROGRESS) {
        setErrorMessage("Sign-in is already in progress.");
        return false;
      } else {
        setErrorMessage("Google Sign-In failed.");
        Alert.alert("Sign In Error", "Something went wrong with Google Sign-In.");
        console.log(error);
        return false; 
      }
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
    try{
      await GoogleSignin.signOut();
    }
    catch(error){
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