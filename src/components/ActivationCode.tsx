import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import moonLogo from '@/assets/moon-logo.png';

const ActivationCode = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !code.trim()) return;

    setLoading(true);
    setError(null);

    const normalised = code.trim().toUpperCase();

    // Check the code exists and is unused
    const { data, error: fetchError } = await (supabase as any)
      .from('activation_codes')
      .select('id, used')
      .eq('code', normalised)
      .maybeSingle();

    if (fetchError || !data) {
      setError('This code is not recognised. Please check and try again.');
      setLoading(false);
      return;
    }

    if (data.used) {
      setError('This code has already been used. Each code is valid for one account.');
      setLoading(false);
      return;
    }

    // Claim the code
    const { error: updateError } = await (supabase as any)
      .from('activation_codes')
      .update({ used: true, used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', data.id)
      .eq('used', false); // extra guard: only update if still unused (race-condition safety)

    if (updateError) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    navigate('/', { replace: true });
  };

  const inputClass =
    'w-full bg-transparent border-b border-input py-3 font-serif text-lg text-center tracking-[0.25em] uppercase text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-foreground/30 placeholder:tracking-widest placeholder:uppercase placeholder:font-serif';

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 sm:p-8 pt-16 sm:pt-20 bg-subtle-gradient">

      {/* Logo + wordmark */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: 80, height: 80 }}>
          <img src={moonLogo} alt="Séjour" className="w-full h-full object-contain" />
        </div>
        <span
          className="font-serif"
          style={{ fontSize: 28, letterSpacing: '0.4em', fontWeight: 300, color: '#52210e' }}
        >
          SÉJOUR
        </span>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-[380px] space-y-10"
      >
        <div className="text-center space-y-2">
          <p className="font-serif text-foreground/70" style={{ fontSize: 20 }}>
            Enter your access code
          </p>
          <p className="text-label text-foreground/40">
            Your code was provided at time of purchase.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="XXXX-XXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={inputClass}
              required
            />
            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center font-body text-xs text-destructive/80 pt-1 leading-relaxed"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-5 bg-primary pill-shape font-script text-2xl text-primary-foreground shadow-arch transition-shadow hover:shadow-lift disabled:opacity-50"
          >
            {loading ? (
              <span className="font-body text-sm tracking-widest uppercase animate-pulse">verifying...</span>
            ) : (
              'unlock séjour'
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Footer spacer */}
      <div />
    </div>
  );
};

export default ActivationCode;
