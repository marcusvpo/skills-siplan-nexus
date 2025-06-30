
import React from 'react';
import { Link } from 'react-router-dom';

const LoginActions = () => {
  return (
    <div className="text-center">
      <Link 
        to="/admin-login"
        className="text-sm text-red-400 hover:text-red-300 transition-colors"
      >
        Acesso Administrativo
      </Link>
    </div>
  );
};

export default LoginActions;
