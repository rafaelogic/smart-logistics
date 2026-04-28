import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LoginDialog } from "./components/LoginDialog";
import { SiteHeader } from "./components/SiteHeader";
import { demoWarehouses, getCurrentUser, loadOperationsData, requestToken, tokenKey } from "./lib/api";
import { loadProfile, saveProfile } from "./lib/profile";
import { applyTheme, loadTheme } from "./lib/theme";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import type { AuthUser, InventoryReport, UserProfile, Warehouse } from "./types/logistics";

type DashboardPageKey = "overview" | "warehouses" | "items" | "inventory" | "ops" | "settings";

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [theme, setTheme] = useState(loadTheme);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>(demoWarehouses);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport>({ warehouses: [] });
  const [reportRows, setReportRows] = useState(720);
  const [statusMessage, setStatusMessage] = useState("Sign in to connect live API data.");

  const signedIn = Boolean(token);
  const dashboardOpen = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setProfile(loadProfile(null));
      return;
    }

    getCurrentUser(token)
      .then((payload) => {
        setUser(payload.user);
        setProfile(loadProfile(payload.user));
      })
      .catch(() => {
        setUser(null);
      });
  }, [token]);

  const refreshDashboard = useCallback(async () => {
    if (!token) {
      setWarehouses(demoWarehouses);
      setInventoryReport({ warehouses: [] });
      setReportRows(720);
      setStatusMessage("Sign in to connect live API data.");
      return;
    }

    try {
      const data = await loadOperationsData(token);
      setWarehouses(data.warehouses);
      setInventoryReport(data.inventoryReport);
      setReportRows(data.reportRows);
      setStatusMessage("Live data loaded from protected API endpoints.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to load protected dashboard data.");
      setToken(null);
      sessionStorage.removeItem(tokenKey);
    }
  }, [token]);

  useEffect(() => {
    if (dashboardOpen) {
      void refreshDashboard();
    }
  }, [dashboardOpen, refreshDashboard]);

  function openDashboard() {
    if (!token) {
      setLoginOpen(true);
      return;
    }

    navigate("/dashboard/overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDashboardPage(page: DashboardPageKey) {
    if (!token) {
      setLoginOpen(true);
      return;
    }

    navigate(`/dashboard/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitLogin(form: FormData) {
    setLoginMessage("Signing in...");

    try {
      const payload = await requestToken(form.get("username"), form.get("password"));
      setToken(payload.accessToken);
      sessionStorage.setItem(tokenKey, payload.accessToken);
      setLoginMessage("");
      setLoginOpen(false);
      navigate("/dashboard/overview");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem(tokenKey);
    setWarehouses(demoWarehouses);
    setInventoryReport({ warehouses: [] });
    setReportRows(720);
    setStatusMessage("Sign in to connect live API data.");
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateProfile(nextProfile: UserProfile) {
    setProfile(nextProfile);
    saveProfile(nextProfile);
  }

  function updateTheme(nextTheme: typeof theme) {
    setTheme(nextTheme);
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SiteHeader
                signedIn={signedIn}
                user={user}
                profile={profile}
                theme={theme}
                onThemeChange={updateTheme}
                onOpenDashboard={openDashboard}
                onOpenLogin={() => setLoginOpen(true)}
                onOpenSettings={() => openDashboardPage("settings")}
                onOpenOps={() => openDashboardPage("ops")}
                onLogout={logout}
              />
              <LandingPage onOpenDashboard={openDashboard} />
            </>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
        <Route
          path="/dashboard/:page"
          element={
            token ? (
              <DashboardPage
                token={token}
                signedIn={signedIn}
                statusMessage={statusMessage}
                warehouses={warehouses}
                inventoryReport={inventoryReport}
                reportRows={reportRows}
                user={user}
                profile={profile}
                theme={theme}
                onRefresh={refreshDashboard}
                onLogout={logout}
                onProfileChange={updateProfile}
                onThemeChange={updateTheme}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginDialog open={loginOpen} message={loginMessage} onClose={() => setLoginOpen(false)} onSubmit={submitLogin} />
    </>
  );
}
