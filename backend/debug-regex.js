const dirtyContent = `R.V.R. & J.C. College of Engineering (Autonomous), Guntur-522019, A.P.R-24 IT/CD/CO/ CS126 DATA STRUCTURESLTPCIntExt 4--4.03070 Semester II [First Year] UNIT I[Introduction to Data Structures. UNIT II[Stacks and Queues.`;

const regex = /(?:^|\n|\s)(?:unit|UNIT|Unit)\s+([IVX\d]+(?:\.\d+)?)\s*[:\-.[\]]?\s*([^\n\[]+?)([\s\S]*?)(?=\s(?:unit|UNIT|Unit)\s+[IVX\d]+|$)/gi;

console.log('Testing regex on:', dirtyContent);
console.log('Regex:', regex);

const matches = Array.from(dirtyContent.matchAll(regex));
console.log('Matches found:', matches.length);

matches.forEach((m, i) => {
    console.log(`\nMatch ${i + 1}:`);
    console.log('Full Match:', m[0]);
    console.log('Group 1 (ID):', m[1]);
    console.log('Group 2 (Title):', m[2]);
    console.log('Group 3 (Content):', m[3]);
});
