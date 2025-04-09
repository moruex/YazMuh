import { useState } from 'react';
import '@styles/components/LogTable.css';

export const LogTable = ({ title = 'Logs', hideExpand = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  // Sample log data with more entries
  const logData = [
    { id: "#1023", event: "Login", user: "User123", timestamp: "10:45 AM" },
    { id: "#1024", event: "Movie Rated", user: "User456", timestamp: "11:15 AM" },
    { id: "#1025", event: "Comment Added", user: "User789", timestamp: "12:30 PM" },
    { id: "#1026", event: "Logout", user: "User123", timestamp: "01:20 PM" },
    { id: "#1027", event: "Password Reset", user: "User234", timestamp: "02:05 PM" },
    { id: "#1028", event: "Profile Updated", user: "User567", timestamp: "02:45 PM" },
    { id: "#1029", event: "Video Watched", user: "User890", timestamp: "03:15 PM" },
    { id: "#1030", event: "Search Query", user: "User345", timestamp: "04:10 PM" },
    { id: "#1031", event: "Subscription Renewed", user: "User678", timestamp: "05:30 PM" },
    { id: "#1032", event: "Feedback Submitted", user: "User901", timestamp: "06:15 PM" },
    { id: "#1033", event: "Login", user: "User123", timestamp: "10:45 AM" },
    { id: "#1034", event: "Movie Rated", user: "User456", timestamp: "11:15 AM" },
    { id: "#1035", event: "Comment Added", user: "User789", timestamp: "12:30 PM" },
    { id: "#1036", event: "Logout", user: "User123", timestamp: "01:20 PM" },
    { id: "#1037", event: "Password Reset", user: "User234", timestamp: "02:05 PM" },
    { id: "#1038", event: "Profile Updated", user: "User567", timestamp: "02:45 PM" },
    { id: "#1039", event: "Video Watched", user: "User890", timestamp: "03:15 PM" },
    { id: "#1040", event: "Search Query", user: "User345", timestamp: "04:10 PM" },
    { id: "#1041", event: "Subscription Renewed", user: "User678", timestamp: "05:30 PM" },
    { id: "#1042", event: "Feedback Submitted", user: "User901", timestamp: "06:15 PM" },
    { id: "#1043", event: "Login", user: "User123", timestamp: "10:45 AM" },
    { id: "#1044", event: "Movie Rated", user: "User456", timestamp: "11:15 AM" },
    { id: "#1045", event: "Comment Added", user: "User789", timestamp: "12:30 PM" },
    { id: "#1046", event: "Logout", user: "User123", timestamp: "01:20 PM" },
    { id: "#1047", event: "Password Reset", user: "User234", timestamp: "02:05 PM" },
    { id: "#1048", event: "Profile Updated", user: "User567", timestamp: "02:45 PM" },
    { id: "#1049", event: "Video Watched", user: "User890", timestamp: "03:15 PM" },
    { id: "#1050", event: "Search Query", user: "User345", timestamp: "04:10 PM" },
    { id: "#1051", event: "Subscription Renewed", user: "User678", timestamp: "05:30 PM" },
    { id: "#1052", event: "Feedback Submitted", user: "User901", timestamp: "06:15 PM" },
    { id: "#1053", event: "Login", user: "User123", timestamp: "10:45 AM" },
    { id: "#1054", event: "Movie Rated", user: "User456", timestamp: "11:15 AM" },
    { id: "#1055", event: "Comment Added", user: "User789", timestamp: "12:30 PM" },
    { id: "#1056", event: "Logout", user: "User123", timestamp: "01:20 PM" },
    { id: "#1057", event: "Password Reset", user: "User234", timestamp: "02:05 PM" },
    { id: "#1058", event: "Profile Updated", user: "User567", timestamp: "02:45 PM" },
    { id: "#1059", event: "Video Watched", user: "User890", timestamp: "03:15 PM" },
    { id: "#1060", event: "Search Query", user: "User345", timestamp: "04:10 PM" },
    { id: "#1061", event: "Subscription Renewed", user: "User678", timestamp: "05:30 PM" },
    { id: "#1062", event: "Feedback Submitted", user: "User901", timestamp: "06:15 PM" },
    { id: "#1063", event: "Login", user: "User123", timestamp: "10:45 AM" },
    { id: "#1064", event: "Movie Rated", user: "User456", timestamp: "11:15 AM" },
    { id: "#1065", event: "Comment Added", user: "User789", timestamp: "12:30 PM" },
    { id: "#1066", event: "Logout", user: "User123", timestamp: "01:20 PM" },
    { id: "#1067", event: "Password Reset", user: "User234", timestamp: "02:05 PM" },
    { id: "#1068", event: "Profile Updated", user: "User567", timestamp: "02:45 PM" },
    { id: "#1069", event: "Video Watched", user: "User890", timestamp: "03:15 PM" },
    { id: "#1070", event: "Search Query", user: "User345", timestamp: "04:10 PM" },
    { id: "#1071", event: "Subscription Renewed", user: "User678", timestamp: "05:30 PM" },
    { id: "#1072", event: "Feedback Submitted", user: "User901", timestamp: "06:15 PM" },
    { id: "#1073", event: "Login", user: "User123", timestamp: "10:45 AM" },
    { id: "#1074", event: "Movie Rated", user: "User456", timestamp: "11:15 AM" },
    { id: "#1075", event: "Comment Added", user: "User789", timestamp: "12:30 PM" },
    { id: "#1076", event: "Logout", user: "User123", timestamp: "01:20 PM" },
    { id: "#1077", event: "Password Reset", user: "User234", timestamp: "02:05 PM" },
    { id: "#1078", event: "Profile Updated", user: "User567", timestamp: "02:45 PM" },
    { id: "#1079", event: "Video Watched", user: "User890", timestamp: "03:15 PM" },
    { id: "#1080", event: "Search Query", user: "User345", timestamp: "04:10 PM" }
  ];

  const toggleExpand = () => {
    const newExpandedState = !expanded;
    setExpanded(newExpandedState);
    // Reset visible count based on expanded state
    setVisibleCount(newExpandedState ? 10 : 5);
  };

  const loadMore = () => {
    setVisibleCount(Math.min(visibleCount + 10, logData.length));
  };

  const showLess = () => {
    setVisibleCount(10);
  };

  const loadAll = () => {
    setVisibleCount(logData.length);
  };

  // Get only the rows we want to display
  const visibleData = logData.slice(0, visibleCount);

  return (
    <div className={`table-container ${expanded ? 'expanded' : ''}`}>
      <div className="log-table">
        <div className="log-header">
          <h2>{title}</h2>
          {!hideExpand && (
            <button
              className="log-action-button ce-button-use"
              onClick={toggleExpand}
              title={expanded ? "Collapse" : "Expand"}
            >
              <span className="button-text">{expanded ? "Collapse" : "Expand"}</span>
            </button>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>User</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((log, index) => (
              <tr key={index}>
                <td>{log.id}</td>
                <td>{log.event}</td>
                <td>{log.user}</td>
                <td>{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {expanded && (
          <div className="pagination-controls">
            
            {visibleCount >= 10 && (
              <button 
                className="log-action-button ce-button-use" 
                onClick={showLess}
              >
                <span className="button-text">Show Less</span>
              </button>
            )}

            {visibleCount < logData.length && (
              <button 
                className="log-action-button ce-button-use" 
                onClick={loadMore}
              >
                <span className="button-text">Load More</span>
              </button>
            )}
            
            {visibleCount < logData.length && (
              <button 
                className="log-action-button ce-button-use" 
                onClick={loadAll}
              >
                <span className="button-text">Load All</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};