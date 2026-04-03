import { pipeline } from '@huggingface/transformers';

// Load feature extraction for similarity (simple plagiarism check)
let extractor = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2');
  }
  return extractor;
}

// Simple cosine similarity for text comparison
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

export async function detectSubmissionQuality(submissionText, assignmentDescription) {
  try {
    const pipe = await getExtractor();

    // Get embeddings
    const subEmbedding = await pipe(submissionText, { pooling: 'mean', normalize: true });
    const descEmbedding = await pipe(assignmentDescription, { pooling: 'mean', normalize: true });

    // Calculate similarity
    const similarity = cosineSimilarity(subEmbedding.data, descEmbedding.data);

    let analysis = 'Submission appears original.';
    let flags = [];

    if (similarity > 0.8) {
      analysis = 'High similarity to assignment description - possible copying.';
      flags.push('potential_plagiarism');
    }

    if (submissionText.length < 50) {
      analysis += ' Submission is very short - may need more detail.';
      flags.push('too_short');
    }

    return {
      analysis,
      similarityScore: Math.round(similarity * 100) / 100,
      flags,
    };
  } catch (error) {
    console.error('Detection error:', error);
    return {
      analysis: 'Unable to analyze submission.',
      similarityScore: 0,
      flags: [],
    };
  }
}