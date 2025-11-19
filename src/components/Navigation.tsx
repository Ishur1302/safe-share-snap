import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, MessageCircle, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const navItems = [
    { path: "/feed", icon: Home, label: "Feed" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/safety", icon: Shield, label: "Safety" },
    { path: "/test-moderation", icon: Shield, label: "Test AI" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b shadow-soft">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            SafeConnect
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={isActive ? "shadow-glow" : ""}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
