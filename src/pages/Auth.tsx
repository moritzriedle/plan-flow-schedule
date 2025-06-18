
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { isPasswordValid } from '@/utils/passwordValidation';

const Auth = () => {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Developer');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(mode === 'reset' ? 'reset' : 'signin');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (mode === 'reset') {
      setActiveTab('reset');
    }
  }, [mode]);

  const validateEmail = (email: string) => {
    return email.endsWith('@proglove.de') || email.endsWith('@proglove.com');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      return;
    }
    
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      return;
    }
    
    if (!isPasswordValid(password)) {
      return;
    }
    
    if (password !== confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    await signUp(email, password, name, role);
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      return;
    }
    
    setIsLoading(true);
    await resetPassword(email);
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">ProGlove Resource Planner</h1>
          <p className="text-gray-600 mt-2">Manage your team resources efficiently</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in to access the resource planner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@proglove.de"
                      required
                    />
                    {email && !validateEmail(email) && (
                      <p className="text-sm text-red-600 mt-1">
                        Only @proglove.de and @proglove.com emails are allowed
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || !validateEmail(email)}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-role">Role</Label>
                    <Input
                      id="signup-role"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Developer"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@proglove.de"
                      required
                    />
                    {email && !validateEmail(email) && (
                      <p className="text-sm text-red-600 mt-1">
                        Only @proglove.de and @proglove.com emails are allowed
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || !validateEmail(email) || !isPasswordValid(password) || password !== confirmPassword}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="reset" className="space-y-4">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@proglove.de"
                      required
                    />
                    {email && !validateEmail(email) && (
                      <p className="text-sm text-red-600 mt-1">
                        Only @proglove.de and @proglove.com emails are allowed
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || !validateEmail(email)}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
