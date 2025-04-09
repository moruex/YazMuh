export const StatCard = ({ icon: Icon, title, value, size = "small", color = "" }) => (
    <div className={`stat-card ${size}`}>
        <div className={`stat-icon ${color}`}><Icon size={24} /></div>
        <div className={`stat-info ${color}`}>
            <h3>{title}</h3>
            <p>{value}</p>
        </div>
    </div>
);
