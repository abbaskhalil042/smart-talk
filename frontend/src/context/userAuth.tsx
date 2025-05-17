import React, { createContext, useEffect, useState } from "react";

interface UserAuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  token: string | null;
}

export const UserAuthContext = createContext<UserAuthContextType>({
  user: null,
  setUser: () => {},
  token: null,
});

interface UserAuthContextProviderProps {
  children: React.ReactNode;
}

export const UserAuthContextProvider: React.FC<
  UserAuthContextProviderProps
> = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Optional: Keep localStorage in sync
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <UserAuthContext.Provider value={{ user, setUser, token }}>
      {children}
    </UserAuthContext.Provider>
  );
};
