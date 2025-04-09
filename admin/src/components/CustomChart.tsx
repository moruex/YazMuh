import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar, Line } from 'recharts';
import '@styles/components/CustomChart.css';

interface CustomChartProps {
    data: any[];
    dataKey: string;
    xAxisKey: string;
    chartType?: 'bar' | 'line';
    className?: string;
    title?: string;
}

const CustomChart = ({ data, dataKey, xAxisKey, chartType = 'bar', className = '', title = 'Chart' }: CustomChartProps) => {
    return (
        <div className={`chart-card ${className}`}>
            <h2>{title}</h2>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart data={data} className={className}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} tick={{ className: `chart-axis ${className}`}} />
                            <YAxis tick={{ className: `chart-axis ${className}`}} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={dataKey} className={className} />
                        </BarChart>
                    ) : (
                        <LineChart data={data} className={className}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} tick={{ className: `chart-axis ${className}`}} />
                            <YAxis tick={{ className: `chart-axis ${className}`}} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey={dataKey} className={className} />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomChart;