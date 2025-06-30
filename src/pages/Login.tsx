
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import LoginHeader from '@/components/auth/LoginHeader';
import LoginForm from '@/components/auth/LoginForm';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
import LoginActions from '@/components/auth/LoginActions';

const Login = () => {
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 border-gray-600 shadow-modern backdrop-blur-sm">
        <LoginHeader />
        
        <CardContent className="space-y-6">
          <ErrorDisplay error={error} />
          
          <LoginForm onError={setError} />
          
          <LoginActions />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
