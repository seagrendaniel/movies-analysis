import { useState, useEffect } from 'react';

export interface TheaterOption {
  id: number;
  company: string;
  location: string;
}

export function useLocations() {
  const [theaters, setTheaters] = useState<TheaterOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/theaters');
        if (!response.ok) {
          throw new Error('Failed to fetch theaters.');
        }
        const data = await response.json();
        setTheaters(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { theaters, loading, error };
}
