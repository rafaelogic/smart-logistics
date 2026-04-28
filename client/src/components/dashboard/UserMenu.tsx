import { BookOpen, ChevronDown, LogOut, Moon, Settings, ShieldCheck, Sun } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFor } from "../../lib/profile";
import type { ThemeMode } from "../../lib/theme";
import type { AuthUser, UserProfile } from "../../types/logistics";

type UserMenuProps = {
  user: AuthUser | null;
  profile: UserProfile;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onSelectSettings: () => void;
  onSelectOps: () => void;
  onLogout: () => void;
};

export function UserMenu({
  user,
  profile,
  theme,
  onThemeChange,
  onSelectSettings,
  onSelectOps,
  onLogout
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function closeAndRun(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="inline-flex items-center gap-1 rounded-full bg-transparent p-0 text-foreground outline-none transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        type="button"
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
          <Avatar className="size-9">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback>{initialsFor(profile, user)}</AvatarFallback>
          </Avatar>
        <ChevronDown className={`transition ${open ? "rotate-180" : ""}`} size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-[80] w-72 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-foreground/10"
          role="menu"
        >
          <div className="px-3 py-2">
            <span className="block text-sm font-semibold text-foreground">{profile.displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{profile.email}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.username ?? "Demo"} · {user?.role ?? "api-client"}</span>
          </div>
          <div className="my-1 h-px bg-border" />
          <MenuButton onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Moon /> : <Sun />}
            <span>Dark mode</span>
            <span className={`ml-auto inline-flex h-5 w-9 items-center rounded-full p-0.5 transition ${theme === "dark" ? "bg-primary" : "bg-input"}`}>
              <span className={`size-4 rounded-full bg-background transition ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
            </span>
          </MenuButton>
          <MenuButton onClick={() => closeAndRun(onSelectSettings)}>
            <Settings />
            <span>Settings</span>
          </MenuButton>
          <MenuButton onClick={() => closeAndRun(onSelectOps)}>
            <ShieldCheck />
            <span>Ops</span>
          </MenuButton>
          <a className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground" href="/docs" role="menuitem">
            <BookOpen />
            <span>API Docs</span>
          </a>
          <div className="my-1 h-px bg-border" />
          <MenuButton destructive onClick={() => closeAndRun(onLogout)}>
            <LogOut />
            <span>Logout</span>
          </MenuButton>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  children,
  destructive = false,
  onClick
}: {
  children: ReactNode;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm outline-none hover:bg-accent focus:bg-accent ${
        destructive ? "text-destructive hover:bg-destructive/10 focus:bg-destructive/10" : "hover:text-accent-foreground focus:text-accent-foreground"
      }`}
      type="button"
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
