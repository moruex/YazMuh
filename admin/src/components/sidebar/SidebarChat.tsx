import React, { useState, useRef, useEffect } from 'react';

import { MoreHorizontal, Share, Download, Edit, Trash, MessageCircle } from "lucide-react";

interface SidebarChatProps {
    title: string;
    expanded: boolean;
    onClick: () => void;
    onShare: () => void;
    onDownload: () => void;
    onRename: () => void;
    onDelete: () => void;
}

export function SidebarChat({ title, expanded, onClick, onShare, onDownload, onRename, onDelete }: SidebarChatProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleButtonClick = (e: React.MouseEvent) => {
        // Stop propagation for all buttons inside the menu
        e.stopPropagation();
    };

    return (
        <div onClick={onClick}>
            {/* <SidebarItem icon={} text={title} /> */}
            <li className="sidebar-chat-item">
                {!expanded && <p className='mci'><MessageCircle size={20} /></p>}
                {!expanded && <div className={`sidebar-tooltip`}>{title}</div>}
                <h2 className='title'>{title}</h2>
                {expanded && <div ref={menuRef} className='menu'>
                    <button
                        className="menu-button"
                        onClick={(e) => {
                            setMenuOpen(!menuOpen);
                            e.stopPropagation();
                        }}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                        <div className="dropdown-menu2">
                            <button onClick={(e) => { handleButtonClick(e); onShare(); }} className="dropdown-item2">
                                <Share size={18} className="dropdown-icon" /> Share
                            </button>
                            <button onClick={(e) => { handleButtonClick(e); onDownload(); }} className="dropdown-item2">
                                <Download size={18} className="dropdown-icon" /> Download
                            </button>
                            <button onClick={(e) => { handleButtonClick(e); onRename(); }} className="dropdown-item2">
                                <Edit size={18} className="dropdown-icon" /> Rename
                            </button>
                            <button onClick={(e) => { handleButtonClick(e); onDelete(); }} className="dropdown-item2 delete-button">
                                <Trash size={18} className="dropdown-icon" /> Delete
                            </button>
                        </div>
                    )}
                </div>
                }
            </li>
        </div>
    );
}
