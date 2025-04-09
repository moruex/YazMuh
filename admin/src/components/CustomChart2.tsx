import React from 'react';
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar, Line } from 'recharts';
import '@styles/components/CustomChart.css';

interface CustomChart2Props {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  chartType?: 'bar' | 'line';
  className?: string;
  title?: string;
}

const CustomChart2: React.FC<CustomChart2Props> = ({
  data,
  dataKey,
  xAxisKey,
  chartType = 'bar',
  className = '',
  title = 'Chart'
}) => {
  return (
    <div className={`chart-card ${className}`}>
      <h2 className="chart-title">{title}</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill="#8884d8" />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomChart2;
