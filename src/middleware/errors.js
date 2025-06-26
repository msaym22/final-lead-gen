// /src/middleware/errors.js OR /src/lib/middleware/errors.js
export const handleAutomationError = (error) => {
  const errorMap = {
    'youtubeData is not defined': {
      userMessage: 'YouTube integration not configured',
      solution: 'Check your YouTube API key',
      severity: 'high'
    },
    'API key not valid': {
      userMessage: 'Invalid YouTube API key',
      solution: 'Update your .env file',
      severity: 'critical'
    }
  };

  return errorMap[error.message] || {
    userMessage: 'An automation error occurred',
    solution: 'Check system logs',
    severity: 'medium'
  };
};