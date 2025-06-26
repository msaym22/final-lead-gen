// Add this temporary route for testing
// app/api/test-youtube/route.js
import { YoutubeResearcher } from '@/lib/youtube.js';

export async function GET() {
  const youtube = new YoutubeResearcher();
  const test = await youtube.validateConnection();
  return Response.json(test);
}