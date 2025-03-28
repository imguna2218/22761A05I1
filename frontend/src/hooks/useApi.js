import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Fetch top users
export function useTopUsers() {
  return useQuery({
    queryKey: ['topUsers'],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/users`);
      return response.data;
    },
    staleTime: 60000, // Cache for 60 seconds
  });
}

// Fetch trending posts
export function useTrendingPosts() {
  return useQuery({
    queryKey: ['trendingPosts'],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/posts?type=popular`);
      return response.data;
    },
    staleTime: 60000, // Cache for 60 seconds
  });
}

// Fetch latest posts (Feed)
export function useFeed() {
  return useQuery({
    queryKey: ['latestPosts'],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/posts?type=latest`);
      return response.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}