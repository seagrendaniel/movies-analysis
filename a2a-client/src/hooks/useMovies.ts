import { useState, useEffect } from 'react';

export interface MovieOption {
  id: number;
  title: string;
}

export function useMovies() {
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/movies');
        if (!response.ok) {
          throw new Error('Failed to fetch movies.');
        }
        const data = await response.json();
        setMovies(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return { movies, loading, error };
}
