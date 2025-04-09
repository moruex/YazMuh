import React from 'react';

interface SidebarDateLabelProps {
    date: string;
}

const SidebarDateLabel: React.FC<SidebarDateLabelProps> = ({ date }) => {
    return (
        <div className='sidebar-data-label-container'>
            <h4 className="sidebar-date-label">{date}</h4>
            <p className="sidebar-date-label2">■</p>
            <div className="sidebar-tooltip2">{date}</div>
        </div>
    );
};

export default SidebarDateLabel;