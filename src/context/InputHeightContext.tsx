import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';

type InputHeightContextType = {
  inputHeight: number;
  setInputHeight: (height: number) => void;
};

const InputHeightContext = createContext<InputHeightContextType | undefined>(undefined);

type InputHeightProviderProps = {
  children: ReactNode;
};

export function InputHeightProvider({ children }: InputHeightProviderProps) {
  // Default to approximate base input height (container padding + input row)
  const [inputHeight, setInputHeight] = useState(60);

  const value: InputHeightContextType = useMemo(
    () => ({
      inputHeight,
      setInputHeight,
    }),
    [inputHeight],
  );

  return <InputHeightContext.Provider value={value}>{children}</InputHeightContext.Provider>;
}

export function useInputHeight() {
  const context = useContext(InputHeightContext);
  if (context === undefined) {
    throw new Error('useInputHeight must be used within an InputHeightProvider');
  }
  return context;
}
