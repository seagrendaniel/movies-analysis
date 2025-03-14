import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocations, TheaterOption } from './hooks/useLocations';
import { useMovies, MovieOption } from './hooks/useMovies';
import { useBestTheater} from './hooks/useBestTheater';

function App() {
  const [saleDate, setSaleDate] = useState<string>('');

  // State to store the sale date that was submitted
  const [submittedSaleDate, setSubmittedSaleDate] = useState<string>('');

  // State for min and max date allowed (6 months range)
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  // API type selection state (last API used)
  const [apiType, setApiType] = useState<'node' | 'django' | ''>('');

  const { theaters, loading: theatersLoading, error: theatersError } = useLocations();
  const { movies, loading: moviesLoading, error: moviesError } = useMovies();

  // Filter theaters by company for display
  const tsTheaters = theaters.filter((t) => t.company === 'TypeScript Theaters');
  const pyTheaters = theaters.filter((t) => t.company === 'Python Playhouses');

  const { data, fetchBestTheater } = useBestTheater();

  // On mount, set default saleDate to today and calculate min/max dates (last 6 months)
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    const minStr = sixMonthsAgo.toISOString().split('T')[0];

    setSaleDate(todayStr);
    setMaxDate(todayStr);
    setMinDate(minStr);
  }, []);

  // Submit handler for Node API
  const handleSubmitNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate) {
      alert('Please select a date.');
      return;
    }
    // Validate that saleDate is within the allowed range
    if (saleDate < minDate || saleDate > maxDate) {
      alert('Date not in range');
      return;
    }
    setApiType('node');
    setSubmittedSaleDate(saleDate);
    fetchBestTheater('node', saleDate);
  };

  // Submit handler for Django API
  const handleSubmitDjango = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate) {
      alert('Please select a date.');
      return;
    }
    if (saleDate < minDate || saleDate > maxDate) {
      alert('Date not in range');
      return;
    }
    setApiType('django');
    setSubmittedSaleDate(saleDate);
    fetchBestTheater('django', saleDate);
  };

  return (
    <div className="container my-4 d-flex flex-column align-items-center">
      <h1 className="text-center mb-4">Investor’s Guide to Movie Theaters</h1>
      
      <div className="w-100">
        <div className="row">

          <div className="col-md-6 text-center">
            <h2>TypeScript Theaters</h2>
            <div className="mb-3">
              <h5 className="text-decoration-underline">Locations</h5>
              {theatersLoading ? (
                <p>Loading theaters...</p>
              ) : theatersError ? (
                <p className="text-danger">Error: {theatersError}</p>
              ) : (
                <ul className="list-group">
                  {tsTheaters.map((theater: TheaterOption) => (
                    <li key={theater.id} className="list-group-item">
                      {theater.location}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-3">
              <h5 className="text-decoration-underline">Movies</h5>
              {moviesLoading ? (
                <p>Loading movies...</p>
              ) : moviesError ? (
                <p className="text-danger">Error: {moviesError}</p>
              ) : (
                <ul className="list-group">
                  {movies.map((movie: MovieOption) => (
                    <li key={movie.id} className="list-group-item">
                      {movie.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-md-6 text-center">
            <h2>Python Playhouses</h2>
            <div className="mb-3">
              <h5 className="text-decoration-underline">Locations</h5>
              {theatersLoading ? (
                <p>Loading theaters...</p>
              ) : theatersError ? (
                <p className="text-danger">Error: {theatersError}</p>
              ) : (
                <ul className="list-group">
                  {pyTheaters.map((theater: TheaterOption) => (
                    <li key={theater.id} className="list-group-item">
                      {theater.location}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-3">
              <h5 className="text-decoration-underline">Movies</h5>
              {moviesLoading ? (
                <p>Loading movies...</p>
              ) : moviesError ? (
                <p className="text-danger">Error: {moviesError}</p>
              ) : (
                <ul className="list-group">
                  {movies.map((movie: MovieOption) => (
                    <li key={movie.id} className="list-group-item">
                      {movie.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3 text-center">
          <h3>Select a Date To Analyze Theater Performance</h3>
          <input
            type="date"
            className="form-control w-50 mx-auto"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            min={minDate}
            max={maxDate}
          />
        </div>

        <div className="mb-3 d-flex justify-content-around w-50 mx-auto">
          <button type="button" className="btn btn-primary" onClick={handleSubmitNode}>
            Find with Node API
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmitDjango}>
            Find with Django API
          </button>
        </div>
      </div>

      {data && (
        <div className="d-flex justify-content-center w-100">
          <div className="card w-auto shadow mb-4">
            <div className="card-body">
              <h3 className="card-title">Best Theater for {submittedSaleDate}</h3>
              <p className="card-text"><strong>Company:</strong> {data.company_name}</p>
              <p className="card-text"><strong>Location:</strong> {data.location}</p>
              <p className="card-text"><strong>Tickets Sold:</strong> {data.total_sales}</p>
              <p className="card-text"><strong>Total Revenue:</strong> ${data.total_revenue}</p>
              {apiType && <p className="small">Queried with {apiType.toUpperCase()} API</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
