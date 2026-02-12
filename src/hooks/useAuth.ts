import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  createElement,
} from 'react';

import { useToast } from './use-toast';
import {
  SupabaseSession,
  getStoredSession,
  getEmailByDocument,
  onAuthStateChange,
  signInWithPassword,
  signOut as supabaseSignOut,
  signUpWithDocument,
  resendEmailConfirmation,
  SupabaseAuthError,
} from '@/lib/supabaseAuth';

import { isDocumentIdentifier } from '@/lib/validators';

interface AuthContextValue {
  session: SupabaseSession | null;
  user: SupabaseSession['user'] | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, document: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resendConfirmation: (identifier: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(() => getStoredSession());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setSession(getStoredSession());
    setLoading(false);

    const unsubscribe = onAuthStateChange((nextSession) => {
      setSession(nextSession);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const normalized = identifier.trim();
      if (!normalized) {
        throw new Error('Informe o CPF, CNPJ ou email.');
      }

      const shouldResolveDocument = isDocumentIdentifier(normalized);
      const loginIdentifier = shouldResolveDocument ? await getEmailByDocument(normalized) : normalized;

      try {
        const authenticated = await signInWithPassword(loginIdentifier, password);
        setSession(authenticated);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao efetuar login.';
        toast({
          variant: 'destructive',
          title: 'Não conseguimos autenticar',
          description: message,
        });
        throw error;
      }
    },
    [toast],
  );

  const resendConfirmation = useCallback(
    async (identifier: string) => {
      const normalized = identifier.trim();
      if (!normalized) {
        throw new Error('Informe o CPF, CNPJ ou email.');
      }

      const shouldResolveDocument = isDocumentIdentifier(normalized);
      const email = shouldResolveDocument ? await getEmailByDocument(normalized) : normalized;

      try {
        await resendEmailConfirmation(email);

        toast({
          title: 'Confirmação enviada',
          description: `Se o e-mail existir, enviamos um link de confirmação para ${email}.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao reenviar confirmação.';
        toast({
          variant: 'destructive',
          title: 'Não conseguimos reenviar',
          description: message,
        });
        throw error;
      }
    },
    [toast],
  );

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setSession(null);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, document: string): Promise<boolean> => {
      try {
        const authenticated = await signUpWithDocument(email, password, document);
        if (authenticated) {
          setSession(authenticated);
          return false; // no confirmation needed
        }
        return true; // needs email confirmation
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao criar o usuário.';
        toast({
          variant: 'destructive',
          title: 'Não conseguimos criar a conta',
          description: message,
        });
        throw error;
      }
    },
    [toast],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      resendConfirmation,
    }),
    [loading, session, signIn, signUp, signOut, resendConfirmation],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}