const { extractUnits } = require('./utils/fileParser');

const problematicString = `R.V.R. & J.C. College of Engineering (Autonomous), Guntur-522019, A.P.R-24 IT/CD/CO/ CS126 DATA STRUCTURESLTPCIntExt 4--4.03070 Semester II [First Year] UNIT I[UNIT II[UNIT III[UNIT IV[`;

console.log('Testing extraction with problematic string:');
console.log(problematicString);

const units = extractUnits(problematicString);

console.log(`\nFound ${units.length} units.`);
units.forEach((u, i) => {
    console.log(`\nUnit ${i + 1}:`);
    console.log(`Title: "${u.title}"`);
    console.log(`Content: "${u.content}"`);
});

if (units.length >= 4) {
    console.log('\n✅ SUCCESS: Found separate units!');
} else {
    console.log('\n❌ FAILURE: Did not separate units correctly.');
}
