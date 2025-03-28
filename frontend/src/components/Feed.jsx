import React from 'react';
import { useFeed } from '../hooks/useApi';
import PostCard from './PostCard';

function Feed() {
  const { data: posts, isLoading, error } = useFeed();

  if (isLoading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center">Error fetching feed: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">Latest Feed</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default Feed;