'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/personality', label: 'Cool Stuff' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
];

export function NavigationMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu when route changes
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-sm border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/"
            className="text-lg font-pixel hover:text-primary transition-colors"
          >
            テトラスラム
          </Link>
          
          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-sm relative inline-block transition-colors',
                    'before:content-[""] before:absolute before:inset-0 before:border before:border-primary/20 before:rounded-sm',
                    'hover:before:border-primary hover:text-primary',
                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && 
                    'text-primary before:border-primary'
                  )}
                >
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-primary/10 rounded-sm transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border"
          >
            <div className="container mx-auto px-4 py-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'block px-4 py-3 rounded-sm relative transition-colors',
                        'before:content-[""] before:absolute before:inset-0 before:border before:border-primary/20 before:rounded-sm',
                        'hover:before:border-primary hover:text-primary',
                        (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && 
                        'text-primary before:border-primary bg-primary/5'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
} 