import { apiClient } from './client';
import { Post } from '../../types';

export const fetchFeedPostsApi = async (params?: { farmId?: string; userId?: string }): Promise<Post[]> => {
  try {
    const res = await apiClient.get('/posts', { params });
    if (res.data && Array.isArray(res.data)) {
      return res.data.map((item: any) => ({
        id: item.id,
        farmerId: item.farmerId || item.userId || 'f1',
        farmId: item.farmId,
        farm: item.farm,
        userId: item.userId,
        user: item.user,
        farmerName: item.farm?.name || item.user?.name || item.farmer?.farmName || 'Cameroon Agro Farm',
        farmerAvatar: item.farm?.coverPhoto || item.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        content: item.content,
        mediaUrl: item.mediaUrl,
        media: item.mediaUrl,
        isVideo: item.isVideo || false,
        linkedYieldId: item.linkedYieldId,
        likesCount: item.likesCount ?? item.likes?.length ?? 0,
        likes: item.likesCount ?? item.likes?.length ?? 0,
        commentsCount: item.commentsCount ?? item.comments?.length ?? 0,
        comments: item.comments || [],
        createdAt: item.createdAt || new Date().toISOString(),
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch feed posts:', error);
    return [];
  }
};

export const createPostApi = async (data: {
  content: string;
  mediaUrl: string;
  isVideo?: boolean;
  linkedYieldId?: string;
  farmId?: string;
}): Promise<Post> => {
  const res = await apiClient.post('/posts', data);
  const item = res.data.post || res.data;
  return {
    id: item.id,
    farmerId: item.farmerId || item.userId,
    farmId: item.farmId,
    farm: item.farm,
    userId: item.userId,
    user: item.user,
    farmerName: item.farm?.name || item.user?.name || 'My Farm',
    farmerAvatar: item.farm?.coverPhoto || item.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    content: item.content,
    mediaUrl: item.mediaUrl,
    media: item.mediaUrl,
    isVideo: item.isVideo || false,
    linkedYieldId: item.linkedYieldId,
    likesCount: item.likesCount ?? 0,
    likes: item.likesCount ?? 0,
    commentsCount: item.commentsCount ?? 0,
    comments: item.comments || [],
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

export const toggleLikePostApi = async (postId: string): Promise<{ liked: boolean }> => {
  const res = await apiClient.post(`/posts/${postId}/like`);
  return res.data;
};

export const addPostCommentApi = async (postId: string, content: string): Promise<any> => {
  const res = await apiClient.post(`/posts/${postId}/comment`, { content });
  return res.data;
};
