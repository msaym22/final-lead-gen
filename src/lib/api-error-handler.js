export class APIErrorHandler {
  static handleYouTubeError(error) {
    if (error.response?.status === 403) {
      return {
        userMessage: 'YouTube API access denied',
        solution: 'Verify your API key and enable YouTube Data API v3',
        actions: [
          'Check Google Cloud Console quotas',
          'Verify API key restrictions'
        ]
      };
    }
    // ... other error cases
  }
}