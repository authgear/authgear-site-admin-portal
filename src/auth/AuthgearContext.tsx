import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import authgear, { PromptOption, UserInfo } from "@authgear/web";
import { AUTHGEAR_REDIRECT_URL } from "../config";

interface AuthgearContextValue {
  sessionState: string;
  userInfo: UserInfo | null;
  userInfoLoading: boolean;
  startLogin: () => void;
  logout: () => Promise<void>;
  refreshSessionState: () => void;
}

const AuthgearContext = createContext<AuthgearContextValue>({
  sessionState: authgear.sessionState,
  userInfo: null,
  userInfoLoading: false,
  startLogin: () => {},
  logout: async () => {},
  refreshSessionState: () => {},
});

export const AuthgearProvider: React.FC<{ children: React.ReactNode }> =
  function AuthgearProvider({ children }) {
    const [sessionState, setSessionState] = useState<string>(
      authgear.sessionState
    );
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [userInfoLoading, setUserInfoLoading] = useState(
      authgear.sessionState === "AUTHENTICATED"
    );

    useEffect(() => {
      if (sessionState === "AUTHENTICATED") {
        setUserInfoLoading(true);
        authgear.fetchUserInfo().then(
          (info) => {
            setUserInfo(info);
            setUserInfoLoading(false);
          },
          (err) => {
            console.error("fetchUserInfo failed:", err);
            setUserInfoLoading(false);
          }
        );
      } else {
        setUserInfo(null);
        setUserInfoLoading(false);
      }
    }, [sessionState]);

    const refreshSessionState = useCallback(() => {
      setSessionState(authgear.sessionState);
    }, []);

    const startLogin = useCallback(() => {
      authgear
        .startAuthentication({
          redirectURI: AUTHGEAR_REDIRECT_URL,
          prompt: PromptOption.Login,
        })
        .catch((err) => console.error("startAuthentication failed:", err));
    }, []);

    const logout = useCallback(async () => {
      try {
        await authgear.logout({
          redirectURI: window.location.origin + "/",
        });
        // Reached only if logout did not redirect (no redirect URI configured in portal).
        // Update state so the UI switches to the login page immediately.
        setSessionState(authgear.sessionState);
        setUserInfo(null);
      } catch (err) {
        console.error("logout failed:", err);
      }
    }, []);

    return (
      <AuthgearContext.Provider
        value={{
          sessionState,
          userInfo,
          userInfoLoading,
          startLogin,
          logout,
          refreshSessionState,
        }}
      >
        {children}
      </AuthgearContext.Provider>
    );
  };

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthgear(): AuthgearContextValue {
  return useContext(AuthgearContext);
}
