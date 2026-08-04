import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Compass, Map, LogOut, LayoutDashboard, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
    { label: "旅程一覧", href: "/trips", icon: Map },
  ];

  const NavLinks = () => (
    <>
      <div className="flex-1 space-y-2 py-4">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setIsOpen(false)}
              className={buttonVariants({
                variant: isActive ? "secondary" : "ghost",
                className: `w-full justify-start gap-3 rounded-xl transition-all ${
                  isActive ? "bg-secondary text-secondary-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              })}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="pt-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            {user?.firstName?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName || "旅行者"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="w-5 h-5" />
          ログアウト
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="w-6 h-6" />
          <span className="font-serif font-bold text-lg text-foreground">旅行プランナー</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 text-foreground">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6 flex flex-col bg-white">
            <div className="flex items-center gap-2 text-primary mb-8">
              <Compass className="w-8 h-8" />
              <span className="font-serif font-bold text-xl text-foreground">旅行プランナー</span>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-white p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-primary mb-10 pl-2">
          <Compass className="w-8 h-8" />
          <span className="font-serif font-bold text-xl text-foreground">旅行プランナー</span>
        </div>
        <NavLinks />
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
