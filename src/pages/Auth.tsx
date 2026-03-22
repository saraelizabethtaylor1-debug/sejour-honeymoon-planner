import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email to confirm your account');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };

  const inputClass =
    'w-full bg-transparent border-b border-input py-3 font-serif text-lg text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/40';

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-8 pt-16 sm:pt-20 bg-subtle-gradient">
      <div className="space-y-10 sm:space-y-14 max-w-[430px] mx-auto w-full">
        <header className="text-center">
          <h1 className="font-script text-5xl sm:text-6xl text-primary-foreground leading-none">
            honeymoon
          </h1>
          <p className="text-label mt-4">The Planning Suite</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="space-y-1.5">
            <label className="text-label pl-1">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label pl-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          <motion.button
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary pill-shape font-script text-2xl text-primary-foreground shadow-arch mt-6 transition-shadow hover:shadow-lift disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'create account' : 'sign in'}
          </motion.button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-serif text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
