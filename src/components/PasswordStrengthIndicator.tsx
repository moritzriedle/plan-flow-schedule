
import React from 'react';
import { Check, X } from 'lucide-react';
import { 
  passwordRequirements, 
  calculatePasswordStrength, 
  getPasswordStrengthLevel 
} from '@/utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showRequirements = true 
}) => {
  const strength = calculatePasswordStrength(password);
  const level = getPasswordStrengthLevel(strength);

  const getStrengthColor = () => {
    switch (level) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (level) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const getStrengthTextColor = () => {
    switch (level) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      {showRequirements && (
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Requirements:</p>
          <ul className="space-y-1">
            {passwordRequirements.map((requirement) => {
              const isMet = requirement.test(password);
              return (
                <li key={requirement.id} className="flex items-center text-sm">
                  {isMet ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className={isMet ? 'text-green-600' : 'text-red-600'}>
                    {requirement.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
