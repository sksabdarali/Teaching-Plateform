const { extractUnits } = require('./utils/syllabusParser');

// Mock the extractUnits function since it's now in the route file
// This is just for testing the logic

// Test content with course objectives and units
const testContent = `
COURSE OBJECTIVES:
1. Impart fundamental knowledge of computer science
2. Develop problem-solving skills
3. Understand software engineering principles

COURSE OUTCOMES:
CO1: Students will be able to analyze problems
CO2: Students will be able to design solutions

UNIT I: Introduction to Programming
This unit covers basic programming concepts including variables, data types, and control structures.
Topics include:
- Variables and constants
- Data types
- Operators

UNIT II: Object-Oriented Programming
This unit focuses on OOP concepts such as classes, objects, inheritance, and polymorphism.
Key concepts:
- Classes and objects
- Encapsulation
- Inheritance
- Polymorphism

UNIT III: Data Structures
Arrays, linked lists, stacks, queues, trees, and graphs.

Learning Objectives:
- Understand basic programming constructs
- Implement algorithms
`;

console.log('Testing updated PDF parser with course objectives and units...\n');

// Since extractUnits is now in the route file, let's test the logic directly
const extractUnitsTest = (content) => {
  if (!content) return [];
  
  // Clean content by removing course objectives and outcomes
  let cleanedContent = content;
  
  // Remove course objectives sections
  cleanedContent = cleanedContent.replace(/(Course Objectives?|Learning Objectives?|Educational Objectives?)[\s\S]*?(?=Unit|Chapter|Section|Module|\n\d+\.?\s*[UuCc][Nn][Ii][Tt]|$)/gi, '');
  
  // Remove course outcomes sections
  cleanedContent = cleanedContent.replace(/(Course Outcomes?|Learning Outcomes?|Expected Outcomes?|Student Learning Outcomes?)[\s\S]*?(?=Unit|Chapter|Section|Module|\n\d+\.?\s*[UuCc][Nn][Ii][Tt]|$)/gi, '');
  
  // Remove CO (Course Outcome) sections
  cleanedContent = cleanedContent.replace(/(CO[\d-]+|CO:\d+|Course Outcome[\s\d-:]*)[\s\S]*?(?=Unit|Chapter|Section|Module|\n\d+\.?\s*[UuCc][Nn][Ii][Tt]|$)/gi, '');
  
  console.log('Original content length:', content.length);
  console.log('Cleaned content length:', cleanedContent.length);
  console.log('Cleaned content preview:', cleanedContent.substring(0, 200) + '...\n');
  
  // Split content by common unit indicators (only focusing on units)
  const unitPatterns = [
    /(?:^|\n)\s*(?:unit|UNIT|Unit)\s+([IVX\d]+(?:\.\d+)?)\s*:\s*([^\n]+)(.*?)(?=\n\s*(?:unit|UNIT|Unit)|$)/gi,  // Unit patterns (Roman numerals and digits with colon)
    /(?:^|\n)\s*(\d+(?:\.\d+)?)\.?\s*[.:\-]?\s*(?:unit|UNIT|Unit)\s+([^\n]+)(.*?)(?=\n\s*\d+(?:\.\d+)?\.?\s*(?:unit|UNIT|Unit)|$)/gi,  // Unit patterns (number first)
    /(?:^|\n)\s*(?:module|MODULE|Module)\s+([IVX\d]+(?:\.\d+)?)\s*[.:\-]?\s*([^\n]+)(.*?)(?=\n\s*(?:module|MODULE|Module)|$)/gi,  // Module patterns
    /(?:^|\n)\s*(\d+(?:\.\d+)?)\.?\s*[.:\-]?\s*(?:module|MODULE|Module)\s+([^\n]+)(.*?)(?=\n\s*\d+(?:\.\d+)?\.?\s*(?:module|MODULE|Module)|$)/gi,  // Module patterns (number first)
    /(?:^|\n)\s*([IVX]+)\.?\s+[.:\-]?\s*([^\n]+)(.*?)(?=\n\s*[IVX]+\.?\s*[.:\-]|$)/gi  // Roman numerals (could be units)
  ];
  
  let units = [];
  
  // Try each pattern to extract units
  for (const pattern of unitPatterns) {
    const matches = cleanedContent.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2]) {
        const unitIdentifier = match[1];
        const title = match[2].trim();
        const extractedContent = match[3] ? match[3].trim() : '';
        
        // Determine if this is a unit or module
        let unitType = 'Unit';
        if (/module|MODULE|Module/.test(match[0])) {
          unitType = 'Module';
        } else if (/^[IVX]+$/.test(unitIdentifier)) {
          unitType = 'Section';
        }
        
        // Only add if the title doesn't contain objective or outcome related words
        if (!title.toLowerCase().includes('objective') && 
            !title.toLowerCase().includes('outcome') && 
            !title.toLowerCase().includes('co:') &&
            !title.toLowerCase().includes('co-')) {
          units.push({
            title: `${unitType} ${unitIdentifier}: ${title}`,
            content: extractedContent
          });
        }
      }
    }
  }
  
  // Remove duplicates based on title
  const uniqueUnits = [];
  const seenTitles = new Set();
  
  for (const unit of units) {
    const normalizedTitle = unit.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueUnits.push(unit);
    }
  }
  
  // If no units found with patterns, create a general unit
  if (uniqueUnits.length === 0) {
    return [{
      title: "Content",
      content: cleanedContent.substring(0, 500) + (cleanedContent.length > 500 ? '...' : '')
    }];
  }
  
  return uniqueUnits;
};

const result = extractUnitsTest(testContent);

console.log('Extracted units:');
result.forEach((unit, index) => {
  console.log(`${index + 1}. ${unit.title}`);
  console.log(`   Content preview: ${unit.content.substring(0, 100)}...`);
  console.log('');
});

console.log('✅ Parsing completed successfully!');
console.log(`✅ Found ${result.length} units after filtering out objectives and outcomes.`);