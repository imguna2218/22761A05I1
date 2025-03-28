import React from 'react';

function PostCard({ post }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center mb-2">
        <img
          src={`https://picsum.photos/50?random=${post.userId}`}
          alt={post.username}
          className="rounded-full mr-4"
        />
        <div>
          <p className="font-semibold">{post.username}</p>
          <p className="text-sm text-gray-500">Post ID: {post.id}</p>
        </div>
      </div>
      <img
        src={`https://picsum.photos/300/200?random=${post.id}`}
        alt="Post"
        className="w-full h-48 object-cover rounded mb-2"
      />
      <p>{post.content || 'Sample post content'}</p>
      {post.commentCount !== undefined && (
        <p className="text-sm text-gray-600 mt-2">Comments: {post.commentCount}</p>
      )}
    </div>
  );
}

export default PostCard;