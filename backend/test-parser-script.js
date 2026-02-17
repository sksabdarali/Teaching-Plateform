const fs = require('fs');
const path = require('path');
const { parseFile } = require('./utils/fileParser');

const testParser = async () => {
    console.log('Starting parser tests...');

    // Mock buffers for testing
    // 1. Test Text File
    console.log('\n--- Testing Text File ---');
    const textContent = `
UNIT I: Introduction to AI
Artificial Intelligence is the simulation of human intelligence processes by machines.
    `;
    const textBuffer = Buffer.from(textContent);
    try {
        const result = await parseFile(textBuffer, 'text/plain', 'test.txt');
        console.log('Text extracted:', result.text.trim());
        console.log('Units found:', result.units.length);
        if (result.units.length > 0) {
            console.log('First Unit Title:', result.units[0].title);
        }
    } catch (e) {
        console.error('Text test failed:', e);
    }

    // 2. Test PDF Mock (we can't easily create a valid PDF buffer without a library, so we will skip or rely on unit extraction logic test)
    // However, we can test the extraction logic with a string that mimics PDF output
    console.log('\n--- Testing Extraction Logic with PDF-like content ---');
    const pdfLikeContent = `
R.V.R. & J.C. College of Engineering (Autonomous)
Human Values & Professional Ethics

UNIT I: HUMAN VALUES
Morals, Values and Ethics - Integrity - Work Ethic - Service Learning - Civic Virtue.

UNIT II: ENGINEERING ETHICS
Senses of 'Engineering Ethics' - Variety of moral issues - Types of inquiry.

Course Objectives:
To understand the moral values that ought to guide the engineering profession.
    `;

    // We can use the extractUnits function directly
    const { extractUnits } = require('./utils/fileParser');
    const units = extractUnits(pdfLikeContent);
    console.log('Units extracted from PDF-like content:', units.length);
    units.forEach((u, i) => {
        console.log(`Unit ${i + 1}: ${u.title}`);
        console.log(`Content: ${u.content.substring(0, 50)}...`);
    });

    // 3. Test Dirty PDF Content (User's Example)
    console.log('\n--- Testing User Example (Dirty Content) ---');
    // 3. Test Dirty PDF Content (User's Example)
    console.log('\n--- Testing User Example (Dirty Content) ---');
    // Simulate the worst case: NO newlines, just one long string
    const dirtyContent = `R.V.R. & J.C. College of Engineering (Autonomous), Guntur-522019, A.P.R-24 IT/CD/CO/ CS126 DATA STRUCTURESLTPCIntExt 4--4.03070 Semester II [First Year] UNIT I[Introduction to Data Structures. UNIT II[Stacks and Queues.`;

    // Note: The user's example "UNIT I[" might actually be "UNIT I [" which regex might miss if strict.
    // My regex: /(?:^|\n)\s*(?:unit|UNIT|Unit)\s+([IVX\d]+(?:\.\d+)?)\s*[:\-.]?\s*([^\n]+)([\s\S]*?)(?=\n\s*(?:unit|UNIT|Unit)|$)/gi
    // It expects a separator or space. "UNIT I[" might fail if there is no space.
    // Let's refine the regex if this test fails.

    const dirtyUnits = extractUnits(dirtyContent);
    console.log('Units extracted from dirty content:', dirtyUnits.length);
    dirtyUnits.forEach((u, i) => {
        console.log(`Unit ${i + 1}: ${u.title}`);
        console.log(`Content: ${u.content}`);
    });
};

testParser();
