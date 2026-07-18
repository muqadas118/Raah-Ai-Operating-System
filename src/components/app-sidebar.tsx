import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Dna,
  MessageCircle,
  Map,
  FolderKanban,
  Network,
  Sparkles,
  Trophy,
  BookOpen,
  GraduationCap,
  BarChart3,
  User,
  LogOut,
  FileText,
  Briefcase,
  Sun,
  Moon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";

const main = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Growth DNA", url: "/growth-dna", icon: Dna },
  { title: "Raahbar AI", url: "/raahbar", icon: MessageCircle },
];

const growth = [
  { title: "Leadership Hub", url: "/leadership", icon: Trophy },
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Evaluation", url: "/evaluation", icon: GraduationCap },
  { title: "Project Forge", url: "/projects", icon: FolderKanban },
  { title: "Portfolio Builder", url: "/portfolio", icon: Briefcase },
  { title: "Learning", url: "/learning", icon: BookOpen },
];

const outreach = [
  { title: "Networking", url: "/networking", icon: Network },
  { title: "Brand Builder", url: "/brand", icon: Sparkles },
  { title: "Resume Builder", url: "/resume", icon: FileText },
  { title: "Opportunities", url: "/opportunities", icon: Trophy },
];

const insights = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  const isActive = (url: string) => pathname === url;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await firebaseSignOut(auth);
    navigate({ to: "/auth", replace: true });
  }

  const renderGroup = (label: string, items: typeof main) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/20 border border-primary/30">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && <span className="font-display text-lg font-bold">RaahAI</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Main", main)}
        {renderGroup("Growth", growth)}
        {renderGroup("Outreach", outreach)}
        {renderGroup("You", insights)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip="Toggle Theme">
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                  {!collapsed && <span>Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
                  {!collapsed && <span>Dark Mode</span>}
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
