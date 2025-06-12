// Sidebar.tsx
import React, { useState, useEffect, useRef } from 'react';

import logo from "@assets/logo2.svg";

import { VenetianMask, MessageCircleQuestionIcon, UserCog, Settings, ChevronFirst, ChevronLast, LucideSquareDashedBottomCode, Film, List, Users, MessageSquare, Newspaper, LucideNotebookText, Server } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { AdminRole } from '@interfaces/enums';
// import { AdminRole } from '@interfaces/index';


interface SidebarProps {
  responsive: string;
  setResponsive: (state: string) => void;
  adminRole: AdminRole;
}

const Sidebar: React.FC<SidebarProps> = ({
  responsive,
  setResponsive,
  adminRole,
}) => {

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [tmpState, setTmpState] = useState(responsive);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        // Restore last user-selected state (tmpState)
        setResponsive(tmpState === 'expanded' ? 'expanded' : 'minimized');
      } else if (window.innerWidth <= 768) {
        setResponsive('hidden1'); // Hide sidebar on small screens
      } else {
        setResponsive('minimized'); // Default to minimized if in the middle range
      }
    };
  
    // Run once on mount
    handleResize();
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tmpState]); // Depend on tmpState to restore the correct state
  

  const toggleSidebar = () => {
    setTmpState((prevState) => {
      const newState = prevState === 'expanded' ? 'minimized' : 'expanded';

      if (window.innerWidth > 1024) {
        setResponsive(newState); // Change when enough space
      } else if (window.innerWidth > 768) {
        setResponsive('minimized'); // Force minimized if between 768px-1024px
      } else {
        setResponsive('hidden1'); // Force hidden on small screens
      }

      return newState;
    });
  };

  // Determine which menu items to show based on admin role
  const isSuperAdmin = adminRole === AdminRole.SUPER_ADMIN;
  // const isAdmin = adminRole === AdminRole.ADMIN;

  return (
    <aside ref={sidebarRef} className={`sidebar ${responsive}`}>
      <nav className="sidebar-nav">
        <div className="sidebar-header">
          <img src={logo} className="sidebar-logo" alt="Logo" />
          <button onClick={toggleSidebar} className="sidebar-toggle">
            {responsive === 'expanded' ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>
        <ul className="sidebar-items">
          <SidebarItem to='/' icon={<LucideSquareDashedBottomCode size={20} />} expanded={responsive === 'expanded'} text="Dashboard" />
          <SidebarItem to='/movies' icon={<Film size={20} />} expanded={responsive === 'expanded'} text="Movies" />
          <SidebarItem to='/recommendations' icon={<LucideNotebookText size={20} />} expanded={responsive === 'expanded'} text="Recommendations" />
          <SidebarItem to='/actors' icon={<VenetianMask size={20} />} expanded={responsive === 'expanded'} text="Actors / Directors" />
          <SidebarItem to='/genres' icon={<List size={20} />} expanded={responsive === 'expanded'} text="Genres" />
          <SidebarItem to='/news' icon={<Newspaper size={20} />} expanded={responsive === 'expanded'} text="News" />
          <SidebarItem to='/quiz' icon={<MessageCircleQuestionIcon size={20} />} expanded={responsive === 'expanded'} text="Quiz" />
          <SidebarItem to='/comments' icon={<MessageSquare size={20} />} expanded={responsive === 'expanded'} text="Comments" />
          {/* <SidebarItem to='/analytics' icon={<BarChart size={20} />} expanded={responsive === 'expanded'} text="Analytics" /> */}
          <SidebarItem to='/users' icon={<Users size={20} />} expanded={responsive === 'expanded'} text="Users" />
          
          {isSuperAdmin && (
            <SidebarItem to='/roles' icon={<UserCog size={20} />} expanded={responsive === 'expanded'} text="Admins" />
          )}
          
          <SidebarItem to='/storage' icon={<Server size={20} />} expanded={responsive === 'expanded'} text="Storage" />
          <div className="flex-grow" />
          
          {isSuperAdmin && (
            <SidebarItem to='/settings' icon={<Settings size={20} />} expanded={responsive === 'expanded'} text="Settings" />
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;