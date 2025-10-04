import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';
import { 
  Home, 
  Map, 
  BarChart3, 
  Bell, 
  Sun, 
  Moon, 
  Zap,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const Navbar = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Map View', href: '/map', icon: Map },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Alerts', href: '/alerts', icon: Bell },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">DisasterWatch</span>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className={`
                      flex items-center space-x-2 px-4 py-2
                      ${isActive(item.href) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Search & Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search incidents..."
                className="pl-10 w-64 bg-muted/50"
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="hover:bg-muted"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t pt-2 pb-3">
          <div className="flex justify-around">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.href} className="flex-1">
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className={`
                      w-full flex flex-col items-center space-y-1 py-3 h-auto
                      ${isActive(item.href) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;