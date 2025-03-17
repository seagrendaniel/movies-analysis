import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register needed Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);



export interface PerformanceDataPoint {
  date: string;
  ticketsSold: number;
  revenue: number;
}

export interface CompanyPerformance {
  theaterId: number;
  company: string;
  location: string;
  sales: PerformanceDataPoint[];
}

interface PerformanceGraphProps {
  performanceApiType: 'node' | 'django';
  initialMetric: MetricKey;
}

interface AggregatedRecord {
  [month: string]: {
    tsTickets: number;
    tsRevenue: number;
    pyTickets: number;
    pyRevenue: number;
  };
}

type MetricKey = 'ticketsSold' | 'revenue';


const PerformanceGraph: React.FC<PerformanceGraphProps> = (props) => {
  const [tsData, setTsData] = useState<CompanyPerformance[]>([]);
  const [pyData, setPyData] = useState<CompanyPerformance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [metric, setMetric] = useState<MetricKey>(props.initialMetric);
  const [apiType, setApiType] = useState<'node' | 'django'>('node');
  const [refresh, toggleRefresh] = useState<boolean>(false);


  // Fetch data for both companies on mount
  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      setError('');
      try {
        const port = apiType === 'node' ? '4000' : '8000';
        // Fetch performance data for TypeScript Theaters
        const tsRes = await fetch(`http://localhost:${port}/api/company_sales_performance?company=${encodeURIComponent('TypeScript Theaters')}`);
        if (!tsRes.ok) {
          throw new Error('Failed to fetch TypeScript Theaters data.');
        }
        const tsResult = await tsRes.json();
        // Fetch performance data for Python Playhouses
        const pyRes = await fetch(`http://localhost:${port}/api/company_sales_performance?company=${encodeURIComponent('Python Playhouses')}`);
        if (!pyRes.ok) {
          throw new Error('Failed to fetch Python Playhouses data.');
        }
        const pyResult = await pyRes.json();
        setTsData(tsResult);
        setPyData(pyResult);
      } catch (err: any) {
        setError(err.message || 'Unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

      fetchPerformanceData();
  }, [apiType, refresh]);

  if (loading) return <p>Loading performance data for both companies...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if ((!tsData || tsData.length === 0) || (!pyData || pyData.length === 0)) 
    return <p>No performance data found for either company.</p>;



  const aggregated: AggregatedRecord = {};

  const aggregateCompanyData = (data: CompanyPerformance[], isTS: boolean) => {
    data.forEach((companyData) => {
      companyData.sales.forEach((point) => {
        const month = point.date;
        if (!aggregated[month]) {
          aggregated[month] = { tsTickets: 0, tsRevenue: 0, pyTickets: 0, pyRevenue: 0 };
        }
        if (isTS) {
          aggregated[month].tsTickets += Number(point.ticketsSold);
          aggregated[month].tsRevenue += Number(point.revenue);
        } else {
          aggregated[month].pyTickets += Number(point.ticketsSold);
          aggregated[month].pyRevenue += Number(point.revenue);
        }
      });
    });
  };

  aggregateCompanyData(tsData, true);
  aggregateCompanyData(pyData, false);

  // Sort data by month (6mo from present date)
  const months = Object.keys(aggregated).sort();

  // Determine the field names based on the selected metric
  const tsField = metric === 'ticketsSold' ? 'tsTickets' : 'tsRevenue';
  const pyField = metric === 'ticketsSold' ? 'pyTickets' : 'pyRevenue';
  

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'TypeScript Theaters',
        data: months.map((m) => aggregated[m][tsField]),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
      {
        label: 'Python Playhouses',
        data: months.map((m) => aggregated[m][pyField]),
        fill: false,
        backgroundColor: 'rgba(153,102,255,0.4)',
        borderColor: 'rgba(153,102,255,1)',
      },
    ],
  };

  const chartTitle = metric === 'ticketsSold'
    ? 'Tickets Sold'
    : 'Revenue';


    return (
      <div className="text-center">
        <h3 className="mb-3">{chartTitle}</h3>
        <Line data={chartData} />
        <div className="mt-3">
          {/* Toggle for metric */}
          <button
            type="button"
            className={`btn me-2 ${metric === 'ticketsSold' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setMetric('ticketsSold')}
          >
            Tickets Sold
          </button>
          <button
            type="button"
            className={`btn ${metric === 'revenue' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setMetric('revenue')}
          >
            Revenue
          </button>
        </div>
        <div className="mt-3">
          {/* Toggle for API type */}
          <button
            type="button"
            className={`btn me-2 ${apiType === 'node' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {setApiType('node'); toggleRefresh(prev => !prev)}}
          >
            Use Node API
          </button>
          <button
            type="button"
            className={`btn ${apiType === 'django' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {setApiType('django'); toggleRefresh(prev => !prev);}}
          >
            Use Django API
          </button>
        </div>
      </div>
    );
};

export default PerformanceGraph;
