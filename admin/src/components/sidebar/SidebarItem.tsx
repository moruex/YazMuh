import { NavLink } from "react-router-dom";

interface SidebarItemProps {
    icon: React.ReactNode;
    expanded: boolean;
    to: string;
    text: string;
    active?: boolean;
    alert?: boolean;
    onClick?: () => void;
}

export function SidebarItem({ icon, expanded, to, text, active, alert, onClick }: SidebarItemProps) {
    return (
        <NavLink to={to} className={`sidebar-item group${active ? ' active' : ''}`} onClick={onClick}>
                <p className='mci'>{icon}</p>
                <span className='title'>{text}</span>
                {alert && <div className={`sidebar-item-alert`} />}
                {!expanded && <div className="sidebar-tooltip">{text}</div>}
        </NavLink>
    );
}
