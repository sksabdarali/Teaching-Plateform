// NOTE: This file is only used for text parsing functionality
// PDF parsing is now handled directly in the route/controller when needed

// Parse syllabus from text content
const parseSyllabusFromText = (content) => {
  // Split content into lines
  const lines = content.split('\n');

  // Identify sections based on common patterns
  const topics = [];
  let currentTopic = null;
  let currentSubtopic = null;

  // Enhanced pattern matching for topics and subtopics
  for (const line of lines) {
    // Skip lines that are just page numbers or metadata
    if (line.trim().match(/^(?:page|p)\s*\d+$/i) || 
        line.trim().match(/^[A-Z.\/(]+\s*[A-Z/0-9-]+$/) || // For course codes like IT/CB/CM/
        line.trim().match(/R-24/) || // Skip specific metadata lines
        line.trim().match(/Printed through web/)) {
      continue;
    }
    
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Enhanced topic detection patterns
    const topicPatterns = [
      // Pattern 1: 1. Topic Title, 1.1 Topic Title, etc.
      /^([0-9]+\.?[0-9]*)\s+(.+)$/, 
      // Pattern 2: Chapter-like titles (Chapter 1, CHAPTER 1, etc.)
      /^(?:chapter|unit|section|module)\s+([0-9]+)\s*[:\-.]?\s*(.+)$/i,
      // Pattern 3: Roman numerals (I. Topic Title, II. Topic Title, etc.)
      /^(I{1,3}|IV|V|VI{0,3}|IX|X)\.?\s+(.+)$/, 
      // Pattern 4: Alphabetical (A. Topic Title, B. Subtopic Title, etc.)
      /^([A-Z])\.?\s+(.+)$/, 
      // Pattern 5: Academic units (UNIT I, UNIT II, etc.)
      /^(?:UNIT|Unit|unit)\s+(I{1,3}|IV|V|VI{0,3}|IX|X|\d+)\s*[:\-.]?\s*(.+)?$/i,
      // Pattern 6: Academic units without number (UNIT I, UNIT II, etc.)
      /^(?:UNIT|Unit|unit)\s+(I{1,3}|IV|V|VI{0,3}|IX|X|\d+)$/i,
      // Pattern 7: Academic units without space (UNITI, UNITII, etc.) - common in PDFs with formatting issues
      /^(?:UNIT|Unit|unit)(I{1,3}|IV|V|VI{0,3}|IX|X|\d+)$/i
    ];

    let isTopic = false;
    for (const pattern of topicPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        // Only create a new topic if we have content
        if (currentTopic) {
          // If we already have a subtopic, save it
          if (currentSubtopic) {
            currentTopic.subtopics.push(currentSubtopic);
            currentSubtopic = null;
          }
          // Save the current topic
          topics.push(currentTopic);
        }
        
        // Create new topic
        currentTopic = {
          title: match[2] ? match[2].trim() : (match[1] ? `Unit ${match[1]}` : `Topic ${topics.length + 1}`),
          description: '',
          content: '',
          subtopics: [],
          resources: []
        };
        isTopic = true;
        break;
      }
    }
    
    if (isTopic) continue;
    
    // Enhanced subtopic detection patterns - only if we have a current topic
    if (currentTopic) {
      const subtopicPatterns = [
        // Pattern 1: 1.1 Subtopic Title, 1.1.1 Subtopic Title, etc.
        /^([0-9]+\.+[0-9.]+)\s+(.+)$/,
        // Pattern 2: Roman numeral subtopics (A. Subtopic Title, B. Subtopic Title, etc.)
        /^(I{1,3}|IV|V|VI{0,3}|IX|X)\.?\s+(.+)$/,
        // Pattern 2: Alphabetical subtopics (A. Subtopic Title, B. Subtopic Title, etc.)
        /^([A-Z])\.?\s+(.+)$/,
        // Pattern 4: Course objectives/outcomes patterns (e.g., "1.Impart knowledge on..." or "1. Impart knowledge on...")
        /^(\d+)\.?\s*([A-Z][^0-9.].*)$/,
        // Pattern 5: Academic objectives without space after number (e.g., "1.Impart knowledge")
        /^(\d+)\.([A-Z].*)$/
      ];
      
      let isSubtopic = false;
      for (const pattern of subtopicPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          if (currentSubtopic && currentTopic) {
            currentTopic.subtopics.push(currentSubtopic);
          }
          
          currentSubtopic = {
            title: match[2].trim(),
            content: ''
          };
          isSubtopic = true;
          break;
        }
      }
      
      // Check for academic content that might be a subtopic
      if (!isSubtopic) {
        // Check for patterns that might indicate subtopics in academic content
        // e.g., patterns with numbers followed by text like "1.1 Subtopic Title"
        const academicSubtopicPattern = /^(\d+\.\d+\.?\d*\s+.+)$/;
        const matchAcademic = trimmedLine.match(academicSubtopicPattern);
        if (matchAcademic) {
          if (currentSubtopic && currentTopic) {
            currentTopic.subtopics.push(currentSubtopic);
          }
          
          // Extract the title part after the number
          const titleMatch = matchAcademic[1].match(/\d+\.\d+\.?\d*\s+(.+)/);
          currentSubtopic = {
            title: titleMatch ? titleMatch[1].trim() : matchAcademic[1].trim(),
            content: ''
          };
          isSubtopic = true;
        } else {
          // Check for course objectives/outcomes patterns (e.g., "1.Impart knowledge on..." or "1. Impart knowledge on..." or "1.Impart knowledge")
          const objectivePattern1 = /^(\d+)\.?\s*([A-Z][^0-9.].*)$/;
          const objectivePattern2 = /^(\d+)\.([A-Z].*)$/;
          const matchObjective1 = trimmedLine.match(objectivePattern1);
          const matchObjective2 = trimmedLine.match(objectivePattern2);
          const matchObjective = matchObjective1 || matchObjective2;
          const matchedPattern = matchObjective1 || matchObjective2;
          if (matchObjective && !trimmedLine.toLowerCase().includes('objectives') && !trimmedLine.toLowerCase().includes('outcomes')) {
            if (currentSubtopic && currentTopic) {
              currentTopic.subtopics.push(currentSubtopic);
            }
            
            currentSubtopic = {
              title: matchedPattern[2].trim(),
              content: ''
            };
            isSubtopic = true;
          }
        }
      }
    }
    
    if (currentSubtopic) {
      // Add to current subtopic content
      currentSubtopic.content += trimmedLine + ' ';
    } else if (currentTopic) {
      // Add to current topic content
      currentTopic.content += trimmedLine + ' ';
    } else if (!isTopic) {
      // If no topic exists yet, treat as general content
      // Enhanced content classification
      if (trimmedLine.toLowerCase().includes('introduction') || 
          trimmedLine.toLowerCase().includes('overview') ||
          trimmedLine.toLowerCase().includes('meaning') ||
          trimmedLine.toLowerCase().includes('definition') ||
          trimmedLine.toLowerCase().includes('objective') ||
          trimmedLine.toLowerCase().includes('learning outcomes') ||
          trimmedLine.toLowerCase().includes('course objectives') ||
          trimmedLine.toLowerCase().includes('course outcomes') ||
          trimmedLine.toLowerCase().includes('syllabus') ||
          trimmedLine.toLowerCase().includes('topics') ||
          trimmedLine.toLowerCase().includes('content') ||
          trimmedLine.toLowerCase().includes('course objectives:') ||
          trimmedLine.toLowerCase().includes('course outcomes:') ||
          trimmedLine.toLowerCase().includes('text book') ||
          trimmedLine.toLowerCase().includes('co:') ||
          trimmedLine.match(/\[CO:\d+,?\d*\]/)) {
        // This might be a description or content
        if (currentTopic) {
          currentTopic.description += trimmedLine + ' ';
        }
      } else if (currentTopic) {
        // Add to current topic content
        currentTopic.content += trimmedLine + ' ';
      }
    }
  }

  // Add the last topic if it exists
  if (currentTopic) {
    if (currentSubtopic && currentTopic) {
      currentTopic.subtopics.push(currentSubtopic);
    }
    topics.push(currentTopic);
  }

  // If no topics were found, create a default topic with all content
  if (topics.length === 0) {
    let allContent = '';
    for (const line of lines) {
      if (line.trim() && 
          !line.trim().match(/^(?:page|p)\s*\d+$/i) && 
          !line.trim().match(/^[A-Z.\/(]+\s*[A-Z/0-9-]+$/) &&
          !line.trim().match(/R-24/) &&
          !line.trim().match(/Printed through web/)) {
        allContent += line.trim() + ' ';
      }
    }
    
    if (allContent.trim()) {
      topics.push({
        title: 'Course Content',
        description: allContent.substring(0, 200) + (allContent.length > 200 ? '...' : ''),
        content: allContent,
        subtopics: [],
        resources: []
      });
    }
  }

  return topics;
};

// We no longer parse PDFs immediately upon upload, so we don't need the PDF parsing functions here
// PDF parsing is done when the content is actually needed by the AI features

module.exports = {
  parseSyllabusFromText
};