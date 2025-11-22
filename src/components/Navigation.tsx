import { Link, useLocation } from "react-router-dom";
import { Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
      {location.pathname !== "/" && (
        <Link to="/">
          <Button variant="outline" size="sm" className="glass-card">
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      )}
      {location.pathname !== "/reports" && (
        <Link to="/reports">
          <Button variant="outline" size="sm" className="glass-card">
            <FileText className="w-4 h-4 mr-2" />
            Report History
          </Button>
        </Link>
      )}
    </nav>
  );
};

export default Navigation;
