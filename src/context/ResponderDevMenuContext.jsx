import { createContext, useContext, useMemo, useState } from "react";

const ResponderDevMenuContext = createContext(null);

export function ResponderDevMenuProvider({ children }) {
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showResponseModeTestPanel, setShowResponseModeTestPanel] =
    useState(false);
  const [enableResponderSimulation, setEnableResponderSimulation] =
    useState(false);

  const value = useMemo(
    () => ({
      showDevMenu,
      setShowDevMenu,
      showResponseModeTestPanel,
      setShowResponseModeTestPanel,
      enableResponderSimulation,
      setEnableResponderSimulation,
    }),
    [
      showDevMenu,
      showResponseModeTestPanel,
      enableResponderSimulation,
      setShowDevMenu,
      setShowResponseModeTestPanel,
      setEnableResponderSimulation,
    ],
  );

  return (
    <ResponderDevMenuContext.Provider value={value}>
      {children}
    </ResponderDevMenuContext.Provider>
  );
}

export function useResponderDevMenu() {
  const context = useContext(ResponderDevMenuContext);

  if (!context) {
    return {
      showDevMenu: false,
      setShowDevMenu: () => {},
      showResponseModeTestPanel: false,
      setShowResponseModeTestPanel: () => {},
      enableResponderSimulation: false,
      setEnableResponderSimulation: () => {},
    };
  }

  return context;
}
