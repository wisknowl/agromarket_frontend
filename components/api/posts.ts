import { apiClient } from './client';
import { Post } from '../../types';
import { posts as mockPosts } from '../../mocks/data';

export const fetchFeedPostsApi = async (): Promise<Post[]> => {
  try {
    const res = await apiClient.get('/posts/feed');
    return res.data;
  } catch (error) {
    return mockPosts;
  }
};

export const createPostApi = async (data: { content: string; mediaUrl: string; isVideo?: boolean; linkedYieldId?: string }): Promise<Post> => {
  const res = await apiClient.post('/posts', data);
  return res.data;
};

export const toggleLikePostApi = async (postId: string): Promise<{ liked: boolean }> => {
  const res = await apiClient.post(`/posts/${postId}/like`);
  return res.data;
};

export const addPostCommentApi = async (postId: string, content: string): Promise<any> => {
  const res = await apiClient.post(`/posts/${postId}/comment`, { content });
  return res.data;
};
