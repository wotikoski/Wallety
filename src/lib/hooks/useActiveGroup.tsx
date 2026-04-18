"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GroupContextValue {
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
}

const GroupContext = createContext<GroupContextValue>({
  activeGroupId: null,
  setActiveGroupId: () => {},
});

export function GroupProvider({ children }: { children: ReactNode }) {
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("wallety_active_group");
    if (stored) setActiveGroupIdState(stored);
  }, []);

  function setActiveGroupId(id: string | null) {
    setActiveGroupIdState(id);
    if (id) {
      localStorage.setItem("wallety_active_group", id);
    } else {
      localStorage.removeItem("wallety_active_group");
    }
  }

  return (
    <GroupContext.Provider value={{ activeGroupId, setActiveGroupId }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useActiveGroup() {
  return useContext(GroupContext);
}
