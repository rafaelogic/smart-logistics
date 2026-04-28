import { UserMenu } from "./dashboard/UserMenu";
import { Brand } from "./Brand";
import { Button } from "./Button";
import type { ThemeMode } from "../lib/theme";
import type { AuthUser, UserProfile } from "../types/logistics";

type SiteHeaderProps = {
  signedIn: boolean;
  user: AuthUser | null;
  profile: UserProfile;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
  onOpenOps: () => void;
  onLogout: () => void;
};

export function SiteHeader({
  signedIn,
  user,
  profile,
  theme,
  onThemeChange,
  onOpenDashboard,
  onOpenLogin,
  onOpenSettings,
  onOpenOps,
  onLogout
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-6 border-b border-border bg-background/90 px-5 text-foreground backdrop-blur-lg md:px-10 xl:px-14">
      <Brand />
      <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex" aria-label="Primary navigation">
        <a className="hover:text-foreground" href="#platform">Platform</a>
        <a className="hover:text-foreground" href="#operations">Operations</a>
        <a className="hover:text-foreground" href="/openapi.json">API</a>
        <a className="hover:text-foreground" href="/docs">Docs</a>
      </nav>
      <div className="flex items-center gap-2.5">
        {signedIn ? (
          <UserMenu
            user={user}
            profile={profile}
            theme={theme}
            onThemeChange={onThemeChange}
            onSelectSettings={onOpenSettings}
            onSelectOps={onOpenOps}
            onLogout={onLogout}
          />
        ) : (
          <Button variant="ghost" onClick={onOpenLogin}>Sign in</Button>
        )}
        {signedIn ? <Button variant="ghost" onClick={onOpenDashboard}>Dashboard</Button> : null}
      </div>
    </header>
  );
}
