const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const app = express();
const port = 5000;
const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

const TEST_SERVER_URL = 'http://20.244.56.144/test';
let AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzMTU3MzYyLCJpYXQiOjE3NDMxNTcwNjIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjdkOWFjYWExLTM4OWUtNGEzNi1iNmRmLWRkZTZlZTczMGFhOCIsInN1YiI6Imd1bmFzZWtoYXJwYXJpc2EyMjE4QGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6ImFmZm9yZC1MQlJDRSIsImNsaWVudElEIjoiN2Q5YWNhYTEtMzg5ZS00YTM2LWI2ZGYtZGRlNmVlNzMwYWE4IiwiY2xpZW50U2VjcmV0IjoiZ1VlcHNweWJNcFZvTGdGeSIsIm93bmVyTmFtZSI6IlBhcmlzYSBHdW5hc2VraGFyIiwib3duZXJFbWFpbCI6Imd1bmFzZWtoYXJwYXJpc2EyMjE4QGdtYWlsLmNvbSIsInJvbGxObyI6IjIyNzYxQTA1STEifQ.IVR9Jq5ejd7eQAxGShvnp44lJ18o5q-Mj5_YgO4D7KI'; // Initial token

// Middleware to enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Axios instance with default headers (will be updated dynamically)
const axiosInstance = axios.create({
  baseURL: TEST_SERVER_URL,
  timeout: 5000,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  },
});

// Function to refresh the AUTH_TOKEN
async function refreshAuthToken() {
  try {
    const response = await axios.post(
      `${TEST_SERVER_URL}/auth`,
      {
        companyName: 'afford-LBRCE',
        clientID: '7d9acaa1-389e-4a36-b6df-dde6ee730aa8',
        clientSecret: 'gUepspybMpVoLgFy',
        ownerName: 'Parisa Gunasekhar',
        ownerEmail: 'gunasekharparisa2218@gmail.com',
        rollNo: '22761A05I1',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const newToken = response.data.token; // Adjust if response key differs (e.g., response.data.access_token)
    if (!newToken) throw new Error('No token received from /test/auth');
    AUTH_TOKEN = newToken;
    axiosInstance.defaults.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    console.log('Token refreshed successfully:', AUTH_TOKEN);
  } catch (error) {
    console.error('Error refreshing token:', error.response ? error.response.data : error.message);
  }
}

// Refresh token every 3 minutes (180,000 ms)
setInterval(refreshAuthToken, 180000);

// Initial token refresh on startup
refreshAuthToken();

// Helper function to fetch all users
async function fetchUsers() {
  const cacheKey = 'users';
  let users = cache.get(cacheKey);
  if (!users) {
    try {
      const response = await axiosInstance.get('/users');
      if (!response.data.users || typeof response.data.users !== 'object') {
        throw new Error('Invalid users data from test server');
      }
      users = response.data.users;
      cache.set(cacheKey, users);
    } catch (error) {
      const errorMsg = error.response
        ? `Test server responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error.message.includes('timeout')
        ? 'Request to test server timed out'
        : `Failed to connect to test server: ${error.message}`;
      console.error('Error fetching users:', errorMsg);
      throw new Error(errorMsg);
    }
  }
  return users;
}

// Helper function to fetch posts for a user
async function fetchUserPosts(userId) {
  const cacheKey = `posts_${userId}`;
  let posts = cache.get(cacheKey);
  if (!posts) {
    try {
      const response = await axiosInstance.get(`/users/${userId}/posts`);
      posts = Array.isArray(response.data.posts) ? response.data.posts : [];
      cache.set(cacheKey, posts);
    } catch (error) {
      const errorMsg = error.response
        ? `Test server responded with status ${error.response.status}`
        : `Failed to fetch posts for user ${userId}: ${error.message}`;
      console.error(`Error fetching posts for user ${userId}:`, errorMsg);
      throw new Error(errorMsg);
    }
  }
  return posts;
}

// Helper function to fetch comments for a post
async function fetchPostComments(postId) {
  const cacheKey = `comments_${postId}`;
  let comments = cache.get(cacheKey);
  if (!comments) {
    try {
      const response = await axiosInstance.get(`/posts/${postId}/comments`);
      comments = Array.isArray(response.data.comments) ? response.data.comments : [];
      cache.set(cacheKey, comments);
    } catch (error) {
      const errorMsg = error.response
        ? `Test server responded with status ${error.response.status}`
        : `Failed to fetch comments for post ${postId}: ${error.message}`;
      console.error(`Error fetching comments for post ${postId}:`, errorMsg);
      throw new Error(errorMsg);
    }
  }
  return comments;
}

// Background task to refresh caches
async function refreshCaches() {
  try {
    const users = await fetchUsers();
    const userIds = Object.keys(users);

    // Precompute Top Users
    const userPostCounts = await Promise.all(
      userIds.map(async (userId) => {
        const posts = await fetchUserPosts(userId);
        return { userId, name: users[userId], postCount: posts.length };
      })
    );
    const topUsers = userPostCounts
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5);
    cache.set('topUsers', topUsers, 60);

    // Precompute All Posts
    const allPosts = [];
    for (const userId of userIds) {
      const posts = await fetchUserPosts(userId);
      posts.forEach((post) => {
        post.userId = userId;
        post.username = users[userId];
        allPosts.push(post);
      });
    }
    cache.set('allPosts', allPosts, 60);

    // Precompute Trending Posts
    const postsWithComments = await Promise.all(
      allPosts.map(async (post) => {
        const comments = await fetchPostComments(post.id);
        return { ...post, commentCount: comments.length };
      })
    );
    const maxComments = Math.max(...postsWithComments.map((p) => p.commentCount));
    const trendingPosts = postsWithComments.filter((p) => p.commentCount === maxComments);
    cache.set('trendingPosts', trendingPosts, 60);

    // Update Latest Posts
    const latestPosts = allPosts
      .sort((a, b) => {
        const aTime = a.timestamp || a.id || 0;
        const bTime = b.timestamp || b.id || 0;
        return bTime - aTime;
      })
      .slice(0, 5);
    cache.set('latestPosts', latestPosts, 10);

    console.log('Caches refreshed successfully');
  } catch (error) {
    console.error('Error refreshing caches:', error.message);
    cache.del(['topUsers', 'allPosts', 'trendingPosts', 'latestPosts']);
  }
}

// Refresh caches every 60 seconds
setInterval(refreshCaches, 60000);

// Initial cache refresh on startup
refreshCaches();

// API 1: Top 5 users by post count
app.get('/users', async (req, res) => {
  try {
    const cachedTopUsers = cache.get('topUsers');
    if (cachedTopUsers) {
      res.json(cachedTopUsers);
    } else {
      const users = await fetchUsers();
      const userIds = Object.keys(users);
      const userPostCounts = await Promise.all(
        userIds.map(async (userId) => {
          const posts = await fetchUserPosts(userId);
          return { userId, name: users[userId], postCount: posts.length };
        })
      );
      const topUsers = userPostCounts
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 5);
      cache.set('topUsers', topUsers, 60);
      res.json(topUsers);
    }
  } catch (error) {
    console.error('Error in /users endpoint:', error.message);
    res.status(500).json({ error: 'Failed to fetch top users', details: error.message });
  }
});

// API 2: Top/Latest Posts
app.get('/posts', async (req, res) => {
  try {
    const type = req.query.type || 'latest';

    if (type === 'popular') {
      const cachedTrendingPosts = cache.get('trendingPosts');
      if (cachedTrendingPosts) {
        res.json(cachedTrendingPosts);
      } else {
        const allPosts = cache.get('allPosts') || [];
        if (!allPosts.length) {
          const users = await fetchUsers();
          const userIds = Object.keys(users);
          for (const userId of userIds) {
            const posts = await fetchUserPosts(userId);
            posts.forEach((post) => {
              post.userId = userId;
              post.username = users[userId];
              allPosts.push(post);
            });
          }
          cache.set('allPosts', allPosts, 60);
        }
        const postsWithComments = await Promise.all(
          allPosts.map(async (post) => {
            const comments = await fetchPostComments(post.id);
            return { ...post, commentCount: comments.length };
          })
        );
        const maxComments = Math.max(...postsWithComments.map((p) => p.commentCount));
        const trendingPosts = postsWithComments.filter((p) => p.commentCount === maxComments);
        cache.set('trendingPosts', trendingPosts, 60);
        res.json(trendingPosts);
      }
    } else if (type === 'latest') {
      const cachedLatestPosts = cache.get('latestPosts');
      if (cachedLatestPosts) {
        res.json(cachedLatestPosts);
      } else {
        const allPosts = cache.get('allPosts') || [];
        if (!allPosts.length) {
          const users = await fetchUsers();
          const userIds = Object.keys(users);
          for (const userId of userIds) {
            const posts = await fetchUserPosts(userId);
            posts.forEach((post) => {
              post.userId = userId;
              post.username = users[userId];
              allPosts.push(post);
            });
          }
          cache.set('allPosts', allPosts, 60);
        }
        const latestPosts = allPosts
          .sort((a, b) => {
            const aTime = a.timestamp || a.id || 0;
            const bTime = b.timestamp || b.id || 0;
            return bTime - aTime;
          })
          .slice(0, 5);
        cache.set('latestPosts', latestPosts, 10);
        res.json(latestPosts);
      }
    } else {
      res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    console.error('Error in /posts endpoint:', error.message);
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});