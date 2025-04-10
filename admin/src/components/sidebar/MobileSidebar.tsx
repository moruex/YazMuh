import * as React from 'react';

import logo from "@assets/logo2.svg";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { SidebarItem } from './SidebarItem';
import { LucideSquareDashedBottomCode, Film, Users, UserCog, Newspaper, MessageSquare, Settings, List, LucideNotebookText, MessageCircleQuestionIcon, Server, VenetianMask } from 'lucide-react';
import { AdminRole } from '@interfaces/index';


interface MobileSidebarProps {
  clicked: boolean;
  setClicked: (open: boolean) => void;
  adminRole: AdminRole;
}

export default function MobileSidebar({
  clicked,
  setClicked,
  adminRole,
}: MobileSidebarProps) {
  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }

    setClicked(open);
  };

  // Determine which menu items to show based on admin role
  const isSuperAdmin = adminRole === AdminRole.SUPER_ADMIN;
  // const isAdmin = adminRole === AdminRole.ADMIN;

  const list = () => (
    <div style={{
      display: 'flex',
      width: '250px',
      height: '100%',
      overflowX: 'hidden',
      backgroundColor: 'var(--sidebar-background)',
      color: 'var(--text-primary)'
    }}>
      <ul className="sidebar-items">
        <div className="sidebar-header1">
          <img src={logo} className="sidebar-logo" alt="Logo" />
        </div>
        <SidebarItem to='/' icon={<LucideSquareDashedBottomCode size={20} />} text="Dashboard" expanded={false} />
        <SidebarItem to='/movies' icon={<Film size={20} />} text="Movies" expanded={false} />
        <SidebarItem to='/recommendations' icon={<LucideNotebookText size={20} />} text="Recommendations" expanded={false} />
        <SidebarItem to='/actors' icon={<VenetianMask size={20} />} expanded={false} text="Actors / Directors" />
        <SidebarItem to='/genres' icon={<List size={20} />} text="Genres" expanded={false} />
        <SidebarItem to='/news' icon={<Newspaper size={20} />} text="News" expanded={false} />
        <SidebarItem to='/quiz' icon={<MessageCircleQuestionIcon size={20} />} text="Quiz" expanded={false} />
        <SidebarItem to='/comments' icon={<MessageSquare size={20} />} text="Comments" expanded={false} />
        <SidebarItem to='/users' icon={<Users size={20} />} text="Users" expanded={false} />
        
        {isSuperAdmin && (
          <SidebarItem to='/roles' icon={<UserCog size={20} />} text="Roles & Permissions" expanded={false} />
        )}
        
        <SidebarItem to='/storage' icon={<Server size={20} />} text="Storage" expanded={false} />
        
        {isSuperAdmin && (
          <SidebarItem to='/settings' icon={<Settings size={20} />} text="Settings" expanded={false} />
        )}
      </ul>
    </div>
  );

  return (
    <SwipeableDrawer
      anchor="left"
      open={clicked}
      onClose={toggleDrawer(false)}
      onOpen={toggleDrawer(true)}
    >
      {list()}
    </SwipeableDrawer>
  );
}