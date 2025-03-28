import React from 'react';
import { useTopUsers } from '../hooks/useApi';

function TopUsers() {
  const { data: users, isLoading, error } = useTopUsers();

  if (isLoading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center">Error fetching top users: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">Top 5 Users by Post Count</h1>
      <ul className="space-y-4">
        {users.map((user) => (
          <li key={user.userId} className="bg-white p-4 rounded shadow">
            <div className="flex items-center">
              <img
                src={`https://picsum.photos/50?random=${user.userId}`}
                alt={user.name}
                className="rounded-full mr-4"
              />
              <div>
                <p className="font-semibold">{user.name}</p>
                <p>Posts: {user.postCount}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TopUsers;