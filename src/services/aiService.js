// Mock AI Service to simulate text generation

const templates = {
  quiz: `# React Hooks Quiz

Here is a 5-question quiz based on React Hooks:

1. **What is the primary purpose of the \`useState\` hook?**
   - [ ] To fetch data from an API
   - [x] To declare a state variable that you can update directly
   - [ ] To manage context
   - [ ] To perform side effects

2. **Which hook is used to perform side effects in a functional component?**
   - [ ] \`useContext\`
   - [x] \`useEffect\`
   - [ ] \`useReducer\`
   - [ ] \`useMemo\`

3. **What does \`useMemo\` do?**
   - [x] Returns a memoized value to optimize performance
   - [ ] Returns a memoized callback function
   - [ ] Manages complex state logic
   - [ ] Subscribes to a context

4. **True or False: Hooks can be called inside loops, conditions, or nested functions.**
   - [ ] True
   - [x] False (Rules of Hooks)

5. **Which hook would you use to access DOM elements directly?**
   - [ ] \`useLayoutEffect\`
   - [x] \`useRef\`
   - [ ] \`useState\`
   - [ ] \`useEffect\`

**Answer Key:** 1(B), 2(B), 3(A), 4(False), 5(B)
`,
  syllabus: `# Course Syllabus: Introduction to Python

## Course Overview
This course provides a comprehensive introduction to Python programming, designed for beginners with no prior coding experience.

### Week 1: Python Basics
- Introduction to Python and IDEs
- Variables, Data Types, and Operators
- Basic Input/Output
- **Assignment 1:** Hello World & Simple Calculator

### Week 2: Control Flow
- If/Else Statements
- For Loops and While Loops
- List Comprehensions
- **Quiz 1:** Control Structures

### Week 3: Functions and Modules
- Defining Functions, Arguments, and Return Values
- Scope and Recursion
- Importing Standard Modules (Math, Random, Datetime)
- **Assignment 2:** Number Guessing Game

### Week 4: Data Structures
- Lists and Tuples
- Dictionaries and Sets
- Iteration and Unpacking
- **Final Project:** Build a Contact Management System

### Prerequisites
None! Just a computer and a willingness to learn.
`,
  summary: `Here is a summary of the topic you requested:

### Key Takeaways
* **Fundamental Concept:** The core idea revolves around simplifying complex workflows through modular design.
* **Architecture:** Utilizing a component-based structure allows for maximum reusability and maintainability.
* **Performance:** By leveraging memoization and strategic lazy-loading, applications remain highly performant even under load.

### Actionable Steps
1. Identify bottleneck areas in the current implementation.
2. Abstract repetitive logic into reusable functions/components.
3. Implement automated testing to ensure stability during refactoring.

If you need more specific details, feel free to ask!`,
  default: `I understand you need assistance with **course creation**. 

As an AI Assistant for Vaizai LMS, I can help you with:
- Generating comprehensive **Syllabuses**
- Creating multiple-choice **Quizzes**
- Writing detailed **Assignment descriptions**
- Summarizing complex **Topics**

*Tip: Be specific in your prompt. For example, "Generate a 10-question quiz about Advanced CSS Flexbox."*

Could you provide a bit more detail on what you are looking to build?`
};

export const generateAIResponse = async (prompt, onChunk) => {
  return new Promise((resolve) => {
    // Determine which template to use based on keywords
    const lowerPrompt = prompt.toLowerCase();
    let responseText = templates.default;
    
    if (lowerPrompt.includes('quiz') || lowerPrompt.includes('question')) {
      responseText = templates.quiz;
    } else if (lowerPrompt.includes('syllabus') || lowerPrompt.includes('outline')) {
      responseText = templates.syllabus;
    } else if (lowerPrompt.includes('summary') || lowerPrompt.includes('summarize') || lowerPrompt.includes('explain')) {
      responseText = templates.summary;
    }

    // Simulate typing effect
    const chars = responseText.split('');
    let currentIndex = 0;
    
    // Calculate typing speed (faster for longer text to not keep user waiting too long)
    const delay = Math.max(5, Math.min(30, 2000 / chars.length)); 

    const typeChunk = () => {
      // Send a few characters at a time for smoother appearance
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const chunk = chars.slice(currentIndex, currentIndex + chunkSize).join('');
      
      onChunk(chunk);
      currentIndex += chunkSize;

      if (currentIndex < chars.length) {
        // Add random pauses for realism (e.g. at punctuation)
        let nextDelay = delay;
        if (['.', '!', '?', '\n'].includes(chunk.slice(-1))) {
          nextDelay += 100 + Math.random() * 200; 
        }
        setTimeout(typeChunk, nextDelay);
      } else {
        resolve();
      }
    };

    // Initial delay simulating "thinking"
    setTimeout(typeChunk, 600 + Math.random() * 800);
  });
};
