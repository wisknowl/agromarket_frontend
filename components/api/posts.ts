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

export const deletePostApi = async (postId: string): Promise<boolean> => {
  const res = await apiClient.delete(`/posts/${postId}`);
  return res.status === 200 || res.data?.success === true;
};

export const uploadMediaApi = async (
  fileUri: string,
  isVideo: boolean = false
): Promise<{ url: string; filename: string; isVideo: boolean }> => {
  const formData = new FormData();
  const rawFilename = fileUri.split('/').pop() || (isVideo ? 'upload.mp4' : 'upload.jpg');
  const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}${isVideo ? '.mp4' : '.jpg'}`;
  const ext = filename.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const mimeType = isVideo ? `video/${ext === 'mov' ? 'quicktime' : 'mp4'}` : `image/${ext === 'png' ? 'png' : 'jpeg'}`;

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: mimeType,
  } as any);

  const res = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => data, // Let Axios / React Native manage FormData boundary automatically
  });

  return res.data;
};
