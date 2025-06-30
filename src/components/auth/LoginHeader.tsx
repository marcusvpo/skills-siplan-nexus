
import React from 'react';
import { BookOpen } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';

const LoginHeader = () => {
  return (
    <CardHeader className="text-center">
      <div className="flex items-center justify-center mb-4">
        <BookOpen className="h-12 w-12 text-red-500" />
      </div>
      <CardTitle className="text-3xl font-bold text-white">Siplan Skills</CardTitle>
      <p className="text-gray-300 mt-2">
        Insira suas credenciais para acessar a plataforma
      </p>
    </CardHeader>
  );
};

export default LoginHeader;
