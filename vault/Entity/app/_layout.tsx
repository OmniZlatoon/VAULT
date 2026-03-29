import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from './src/GlobalVariables/AuthContext'; // Adjust path if needed

export default function RootLayout() {
  return (
    // The AuthProvider wraps the entire app
    <AuthProvider>
      {/* Slot acts as a placeholder for index.tsx, otp.tsx, etc. */}
      <Slot /> 
    </AuthProvider>
  );
}