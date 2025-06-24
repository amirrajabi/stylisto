import { router } from 'expo-router';
import React from 'react';

export default function ForgotPasswordScreen() {
  // Redirect to login since we only use phone/OTP authentication
  React.useEffect(() => {
    router.replace('/(auth)/login');
  }, []);

  return null;
}
