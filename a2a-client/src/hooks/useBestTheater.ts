import { useState } from 'react';

export interface TheaterData {
  theater_id: number;
  company_name: string;
  location: string;
  total_sales: number;
  total_revenue: number;
}

export function useBestTheater() {
  const [data, setData] = useState<TheaterData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchBestTheater = async (api: 'node' | 'django', saleDate: string) => {
    setLoading(true);
    setError('');
    setData(null);

    const baseUrl =
      api === 'node'
        ? 'http://localhost:4000/api/best_theater'
        : 'http://localhost:8000/api/best_theater';
    const url = `${baseUrl}?sale_date=${saleDate}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching data from ${api} API.`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchBestTheater };
}
