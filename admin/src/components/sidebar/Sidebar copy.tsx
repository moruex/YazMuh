import React, { useState, useEffect, useRef } from 'react';

import logo from "@assets/logo2.svg";
import '@styles/components/Sidebar.css';

import { MessageCircleQuestionIcon, UserCog, Settings, ChevronFirst, ChevronLast, LucideSquareDashedBottomCode, Film, List, Users, BarChart, Bell, MessageSquare, Newspaper, LucideNotebookText } from "lucide-react";
import { SidebarItem } from "./SidebarItem";


interface SidebarProps {
  responsive: string;
  setResponsive: (state: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  responsive,
  setResponsive,
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
          <SidebarItem icon={<LucideSquareDashedBottomCode size={20} />} expanded={responsive === 'expanded'} text="Dashboard" />
          <SidebarItem icon={<Film size={20} />} expanded={responsive === 'expanded'} text="Movies" />
          <SidebarItem icon={<LucideNotebookText size={20} />} expanded={responsive === 'expanded'} text="Recommendations" />
          <SidebarItem icon={<List size={20} />} expanded={responsive === 'expanded'} text="Genres" />
          <SidebarItem icon={<Newspaper size={20} />} expanded={responsive === 'expanded'} text="News" />
          <SidebarItem icon={<MessageCircleQuestionIcon size={20} />} expanded={responsive === 'expanded'} text="Quizzes" />
          <SidebarItem icon={<MessageSquare size={20} />} expanded={responsive === 'expanded'} text="Comments" />
          <SidebarItem icon={<BarChart size={20} />} expanded={responsive === 'expanded'} text="Analytics" />
          <SidebarItem icon={<Users size={20} />} expanded={responsive === 'expanded'} text="Users" />
          <SidebarItem icon={<UserCog size={20} />} expanded={responsive === 'expanded'} text="Roles & Permissions" />
          <SidebarItem icon={<Bell size={20} />} expanded={responsive === 'expanded'} text="Notifications" />
          <div className="flex-grow" />
          <SidebarItem icon={<Settings size={20} />} expanded={responsive === 'expanded'} text="Settings" />
        </ul>

      </nav>
    </aside>
  );
};

export default Sidebar;