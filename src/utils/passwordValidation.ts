
export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 12 characters',
    test: (password: string) => password.length >= 12
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'At least one number',
    test: (password: string) => /[0-9]/.test(password)
  },
  {
    id: 'special',
    label: 'At least one special character',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  const metRequirements = passwordRequirements.filter(req => req.test(password));
  return Math.round((metRequirements.length / passwordRequirements.length) * 100);
};

export const getPasswordStrengthLevel = (strength: number): 'weak' | 'medium' | 'strong' => {
  if (strength < 40) return 'weak';
  if (strength < 80) return 'medium';
  return 'strong';
};

export const isPasswordValid = (password: string): boolean => {
  return passwordRequirements.every(req => req.test(password));
};

export const getUnmetRequirements = (password: string): PasswordRequirement[] => {
  return passwordRequirements.filter(req => !req.test(password));
};
