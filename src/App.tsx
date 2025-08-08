import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import SearchPage from './pages/SearchPage';
import NewPopularPage from './pages/NewPopularPage';
import MyListPage from './pages/MyListPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import WatchPage from './pages/WatchPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-netflix-black">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/new-popular" element={<NewPopularPage />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-shows" element={<TVShows />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collection/:id" element={<CollectionDetailPage />} />
              <Route path="/my-list" element={<MyListPage />} />
              <Route path="/movie/:id" element={<DetailPage type="movie" />} />
              <Route path="/tv/:id" element={<DetailPage type="tv" />} />
              <Route path="/watch/movie/:id" element={<WatchPage type="movie" />} />
              <Route path="/watch/tv/:id" element={<WatchPage type="tv" />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
