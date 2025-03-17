import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocations, TheaterOption } from './hooks/useLocations';
import { useMovies, MovieOption } from './hooks/useMovies';
import { useBestTheater} from './hooks/useBestTheater';
import PerformanceGraph from './components/PerformanceGraph';

function App() {
  const [saleDate, setSaleDate] = useState<string>('');
  const [submittedSaleDate, setSubmittedSaleDate] = useState<string>('');

  // Min/Max date (6 month range)
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  // API selection state for /best_theater endpoint
  const [bestTheaterApiType, setBestTheaterApiType] = useState<'node' | 'django' | ''>('');
  // API selection state for /company_sales_performance endpoint
  const [performanceApiType, setPerformanceApiType] = useState<'node' | 'django'>('node');
  const [serverDisconnected, setServerDisconnected] = useState<boolean>(false)   // <---- to rerender other component data w/o page refresh
  
  // Display theaters & movies
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

    setMaxDate(todayStr);
    setMinDate(minStr);
  }, []);

  const isSaleDateValid = saleDate !== '' && saleDate !== "--/--/----";

  // Submit handler for Node API
  const handleSubmitNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSaleDateValid) {
      alert('Please select a date.');
      return;
    }
    if (saleDate < minDate || saleDate > maxDate) {
      alert('Date not in range');
      return;
    }
    try {
      setBestTheaterApiType('node');
      setSubmittedSaleDate(saleDate);
      const success = await fetchBestTheater('node', saleDate);
      if (!success) {
        setServerDisconnected(true)
        return
      }
    } catch(err) {
      setServerDisconnected(true)
      return
    }
  };

  // Submit handler for Django API
  const handleSubmitDjango = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate) {
      alert('Please select a date.');
      return;
    }
    if (saleDate < minDate || saleDate > maxDate) {
      alert('Date not in range');
      return;
    }
    try {
      setBestTheaterApiType('django');
      setSubmittedSaleDate(saleDate);
      const success = await fetchBestTheater('django', saleDate);
      if(!success) {
        setServerDisconnected(true)
        return
      }
    } catch(err) {
      setServerDisconnected(true)
      return
    }
  };

  if(serverDisconnected) {
    return (
      <div className="container my-4 d-flex flex-column align-items-center">
        <h1 className="text-center mb-4 text-danger">Server Disconnected</h1>
        <p className="text-center">
          Unable to connect to the server. Please try again later or check your network connection.
        </p>
      </div>
    )
  }

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
          <h3>Analyze Daily Theater Performance</h3>
          <input
            type="date"
            className="form-control w-50 mx-auto"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            placeholder="--/--/----"
            min={minDate}
            max={maxDate}
          />
        </div>

        <div className="mb-3 d-flex justify-content-around w-50 mx-auto">
          <button type="button" className="btn btn-primary" 
          onClick={handleSubmitNode}
          disabled={!isSaleDateValid}
          >
            Use Node API
          </button>
          <button type="button" className="btn btn-primary" 
          onClick={handleSubmitDjango}
          disabled={!isSaleDateValid}
          >
            Use Django API
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
              {bestTheaterApiType && <p className="small">Queried with {bestTheaterApiType.toUpperCase()} API</p>}
            </div>
          </div>
        </div>
      )}
<div className="w-100 d-flex flex-column align-items-center my-4">
  <h1 className="text-center mb-4">Theater Performance Dashboard</h1>
  <div className="w-100">
    <PerformanceGraph performanceApiType={performanceApiType} initialMetric="ticketsSold" />
  </div>
</div>

    </div>
  );
}

export default App;
