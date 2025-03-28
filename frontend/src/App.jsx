import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopUsers from './components/TopUsers';
import TrendingPosts from './components/TrendingPosts';
import Feed from './components/Feed';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // Cache data for 60 seconds
      cacheTime: 300000, // Keep data in cache for 5 minutes
      refetchInterval: false, // Default: no auto-refetch (Feed will override)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 p-4 text-white">
          <ul className="flex space-x-6 justify-center">
            <li><Link to="/" className="hover:underline">Top Users</Link></li>
            <li><Link to="/trending" className="hover:underline">Trending Posts</Link></li>
            <li><Link to="/feed" className="hover:underline">Feed</Link></li>
          </ul>
        </nav>
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<TopUsers />} />
            <Route path="/trending" element={<TrendingPosts />} />
            <Route path="/feed" element={<Feed />} />
          </Routes>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;