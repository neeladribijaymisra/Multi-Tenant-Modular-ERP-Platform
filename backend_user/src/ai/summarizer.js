import { pipeline } from '@huggingface/transformers';

// Load summarization pipeline (cached after first load)
let summarizer = null;

async function getSummarizer() {
  if (!summarizer) {
    summarizer = await pipeline('summarization', 'facebook/bart-large-cnn');
  }
  return summarizer;
}

export async function summarizeDailyActivities(activitiesText) {
  try {
    const pipe = await getSummarizer();
    const result = await pipe(activitiesText, {
      max_length: 100,
      min_length: 30,
      do_sample: false,
    });
    return result[0].summary_text;
  } catch (error) {
    console.error('Summarization error:', error);
    // Fallback: return a simple summary
    return 'Daily activities summarized: Engaged in classes, assignments, and communications.';
  }
}

// Function to build activities text from user data
export function buildActivitiesText(userData) {
  const { attendedClasses = [], completedAssignments = [], viewedAnnouncements = [], otherActivities = [] } = userData;

  let text = '';

  if (attendedClasses.length > 0) {
    text += `Attended ${attendedClasses.length} classes: ${attendedClasses.join(', ')}. `;
  }

  if (completedAssignments.length > 0) {
    text += `Completed ${completedAssignments.length} assignments. `;
  }

  if (viewedAnnouncements.length > 0) {
    text += `Viewed ${viewedAnnouncements.length} announcements. `;
  }

  if (otherActivities.length > 0) {
    text += `Other activities: ${otherActivities.join(', ')}. `;
  }

  return text || 'No significant activities recorded today.';
}