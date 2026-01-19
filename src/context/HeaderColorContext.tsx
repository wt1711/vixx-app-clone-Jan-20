import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

type HeaderColorContextType = {
  tintColor: string | null;
  setTintColor: (color: string | null) => void;
};

const HeaderColorContext = createContext<HeaderColorContextType | undefined>(
  undefined,
);

type HeaderColorProviderProps = {
  children: ReactNode;
};

export function HeaderColorProvider({ children }: HeaderColorProviderProps) {
  const [tintColor, setTintColorState] = useState<string | null>(null);

  const setTintColor = useCallback((color: string | null) => {
    setTintColorState(color);
  }, []);

  const value: HeaderColorContextType = useMemo(
    () => ({
      tintColor,
      setTintColor,
    }),
    [tintColor, setTintColor],
  );

  return (
    <HeaderColorContext.Provider value={value}>
      {children}
    </HeaderColorContext.Provider>
  );
}

export function useHeaderColor() {
  const context = useContext(HeaderColorContext);
  if (context === undefined) {
    throw new Error('useHeaderColor must be used within a HeaderColorProvider');
  }
  return context;
}
