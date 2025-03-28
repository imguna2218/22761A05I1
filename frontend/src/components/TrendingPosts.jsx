import React from 'react';
import { useTrendingPosts } from '../hooks/useApi';
import PostCard from './PostCard';

function TrendingPosts() {
  const { data: posts, isLoading, error } = useTrendingPosts();

  if (isLoading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center">Error fetching trending posts: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">Trending Posts</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default TrendingPosts;