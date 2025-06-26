export const validateYouTubeConfig = () => ({
  valid: !!process.env.YOUTUBE_API_KEY,
  quotaInfo: {
    dailyLimit: 10000,
    searchCost: 100,
    videoCost: 1
  }
});

export const getYouTubeQuotaStatus = async () => {
  if (!process.env.YOUTUBE_API_KEY) return null;
  
  const youtube = new YoutubeResearcher();
  return await youtube.validateConnection();
};