import React, { createContext, useContext } from 'react';
import {
  usePendingMetabotRooms,
  PendingRoomsMap,
} from 'src/hooks/room/usePendingMetabotRooms';

type PendingMetabotRoomsContextType = {
  pendingRooms: PendingRoomsMap;
  addPendingRoom: (roomId: string) => void;
  removePendingRoom: (roomId: string) => void;
  autoJoinMetabotRoom: (roomId: string) => Promise<void>;
};

const PendingMetabotRoomsContext =
  createContext<PendingMetabotRoomsContextType | null>(null);

/**
 * Provider for pending metabot rooms state
 * This is "The Brain" - exposes state and actions to the app
 */
export const PendingMetabotRoomsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { pendingRooms, addPendingRoom, removePendingRoom, autoJoinMetabotRoom } =
    usePendingMetabotRooms();

  return (
    <PendingMetabotRoomsContext.Provider
      value={{
        pendingRooms,
        addPendingRoom,
        removePendingRoom,
        autoJoinMetabotRoom,
      }}
    >
      {children}
    </PendingMetabotRoomsContext.Provider>
  );
};

/**
 * Hook to access pending metabot rooms context
 */
export const usePendingMetabotRoomsContext = () => {
  const context = useContext(PendingMetabotRoomsContext);
  if (!context) {
    throw new Error(
      'usePendingMetabotRoomsContext must be used within a PendingMetabotRoomsProvider',
    );
  }
  return context;
};
