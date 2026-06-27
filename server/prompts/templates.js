export const generateSummaryTemplate = (content) => `
You are an expert educator. Summarize the following content into a concise, easily digestible format. 
Highlight the key takeaways in bullet points.
Content:
"""
${content}
"""
`;

export const generateQuizTemplate = (topic, difficulty, numQuestions = 5) => `
You are an expert test creator. Generate a ${numQuestions}-question multiple-choice quiz on the topic of "${topic}" at a "${difficulty}" difficulty level.
Format the output as a valid JSON array of objects, where each object has:
- "question": The question text
- "options": An array of 4 possible answers
- "correctOption": The exact text of the correct answer from the options array.
`;

export const generateFlashcardsTemplate = (topic, numCards = 5) => `
Create ${numCards} flashcards for studying "${topic}". 
Format the output as a valid JSON array of objects with "front" (the question/term) and "back" (the answer/definition).
`;

export const generateInterviewQuestionsTemplate = (role, level) => `
You are a senior technical recruiter. Generate 5 behavioral and 5 technical interview questions for a ${level} ${role}.
`;

export const generateAssignmentTemplate = (topic, level) => `
Create a comprehensive, hands-on assignment for a ${level} level student studying "${topic}". 
Include the objective, prerequisites, detailed instructions, and a grading rubric.
`;

export const generateRoadmapTemplate = (skill) => `
Create a step-by-step learning roadmap to master "${skill}". 
Break it down into weeks or phases, listing specific topics to cover, recommended project ideas, and milestones.
`;

export const generateChatTemplate = (message) => `
You are an AI learning mentor named Vaizai. You help students learn by providing clear, patient, and educational responses.
Keep your tone friendly and supportive. If the question is about programming, explain concepts clearly with examples when helpful.
User's question: "${message}"
`;
