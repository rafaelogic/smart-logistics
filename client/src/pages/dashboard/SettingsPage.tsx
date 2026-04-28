import { LogOut, RefreshCw, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { initialsFor } from "../../lib/profile";
import type { AuthUser, UserProfile } from "../../types/logistics";
import type { ThemeMode } from "../../lib/theme";

type SettingsPageProps = {
  signedIn: boolean;
  user: AuthUser | null;
  profile: UserProfile;
  theme: ThemeMode;
  onRefresh: () => void | Promise<void>;
  onLogout: () => void;
  onProfileChange: (profile: UserProfile) => void;
  onThemeChange: (theme: ThemeMode) => void;
};

export function SettingsPage({
  signedIn,
  user,
  profile,
  theme,
  onRefresh,
  onLogout,
  onProfileChange,
  onThemeChange
}: SettingsPageProps) {
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>User info</CardTitle>
          <CardDescription>Authenticated API identity and local dashboard profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
              <AvatarFallback>{initialsFor(profile, user)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="text-xs text-muted-foreground">{user?.username ?? "Demo"} · {user?.role ?? "api-client"}</p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Dark mode</p>
              <p className="text-sm text-muted-foreground">Switch dashboard colors for this browser.</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")} />
          </div>

          <Separator className="my-5" />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw data-icon="inline-start" />Refresh data
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut data-icon="inline-start" />Sign out
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Auth session: {signedIn ? "Active" : "Demo"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update profile</CardTitle>
          <CardDescription>Profile edits are stored locally for this dashboard session.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onProfileChange({
                displayName: String(form.get("displayName") ?? ""),
                email: String(form.get("email") ?? ""),
                avatarUrl: String(form.get("avatarUrl") ?? "")
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={profile.displayName} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={profile.email} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl} placeholder="https://example.com/avatar.png" />
            </div>
            <Button type="submit">
              <Save data-icon="inline-start" />Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
