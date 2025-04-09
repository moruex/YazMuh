import { Users, Film, Calendar, Eye, Star, Activity, MessageSquare } from "lucide-react";

import { StatCard } from "@components/StatCard";
import { LogTable } from "@components/LogTable";
import CustomChart from "@components/CustomChart";

export const DashboardPage = () => {
    
    const sampleData = [
        { day: 'Mon', visits: 820 },
        { day: 'Tue', visits: 932 },
        { day: 'Wed', visits: 1101 },
        { day: 'Thu', visits: 876 },
        { day: 'Fri', visits: 965 },
        { day: 'Sat', visits: 654 },
        { day: 'Sun', visits: 789 },
    ];

    return (
        <>
            <div className="grid-container">
                <StatCard icon={Users} title="Total Users" value="1,254" color="green" />
                <StatCard icon={Eye} title="Current Watchers" value="342" color="blue" />
                <StatCard icon={Film} title="Total Movies" value="5,673" color="red" />
                <StatCard icon={Calendar} title="New Releases" value="12 this week" color="purple" />
                <StatCard icon={Activity} title="Daily Visits" value="8,452" color="teal" />
                <StatCard icon={Star} title="Most Rated" value="Inception" color="yellow" />
                <StatCard icon={MessageSquare} title="Most Visited" value="Spider-man 2" color="gray" />
            </div>
            <div className="extra-section">
                {/* <TrafficChart /> */}
                <CustomChart className="daily-traffic" data={sampleData} dataKey="visits" xAxisKey="day" chartType="bar" title="Weekly Visits" />
                <LogTable title="Recent Logs" />
            </div>
            {/* <div className="extra-section">
                <div className="recommendations">
                    <h2><b>Movie Recommendations</b></h2>
                    <ul>
                        <li>Interstellar</li>
                        <li>The Dark Knight</li>
                        <li>Parasite</li>
                    </ul>
                </div>
                <div className="comments">
                    <h2><b>Recent Comments</b></h2>
                    <p>"Amazing movie! - User123"</p>
                    <p>"Loved the cinematography - User456"</p>
                </div>
            </div> */}
        </>
    );
};

export default DashboardPage;