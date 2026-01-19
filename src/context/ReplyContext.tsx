import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { ReplyToData } from '../components/room/types';

type ReplyContextType = {
  replyingTo: ReplyToData | null;
  setReplyingTo: (message: ReplyToData | null) => void;
  clearReply: () => void;
};

const ReplyContext = createContext<ReplyContextType | undefined>(undefined);

type ReplyProviderProps = {
  children: ReactNode;
};

export function ReplyProvider({ children }: ReplyProviderProps) {
  const [replyingTo, setReplyingToState] = useState<ReplyToData | null>(null);

  const setReplyingTo = useCallback((message: ReplyToData | null) => {
    setReplyingToState(message);
  }, []);

  const clearReply = useCallback(() => {
    setReplyingToState(null);
  }, []);

  const value: ReplyContextType = useMemo(
    () => ({
      replyingTo,
      setReplyingTo,
      clearReply,
    }),
    [replyingTo, setReplyingTo, clearReply],
  );

  return (
    <ReplyContext.Provider value={value}>{children}</ReplyContext.Provider>
  );
}

export function useReply() {
  const context = useContext(ReplyContext);
  if (context === undefined) {
    throw new Error('useReply must be used within a ReplyProvider');
  }
  return context;
}
