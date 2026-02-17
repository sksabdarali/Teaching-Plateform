const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const fs = require('fs');
const path = require('path');

// Normalize whitespace: collapse multiple spaces/tabs into single space and trim
const normalizeWhitespace = (text) => {
    if (!text) return '';
    return text
        .replace(/\t/g, ' ')           // tabs to spaces
        .replace(/ {2,}/g, ' ')         // collapse multiple spaces
        .replace(/ *\n */g, '\n')       // clean spaces around newlines
        .trim();
};

// Extract text from PDF
const parsePdf = async (buffer) => {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF file');
    }
};

// Extract text from Word (.docx)
const parseDocx = async (buffer) => {
    try {
        const result = await mammoth.extractRawText({ buffer: buffer });
        return result.value;
    } catch (error) {
        console.error('Error parsing DOCX:', error);
        throw new Error('Failed to parse DOCX file');
    }
};

// Extract text from PowerPoint (.pptx) or Word (.doc) or PowerPoint (.ppt)
// officeparser supports many formats including ppt, pptx, doc, docx, odt, odp, ods, xls, xlsx
const parseOfficeFile = async (buffer) => {
    return new Promise((resolve, reject) => {
        try {
            officeParser.parseOfficeBuffer(buffer, (data, err) => {
                if (err) {
                    console.error('Error parsing office file:', err);
                    return reject(err);
                }
                resolve(data);
            });
        } catch (error) {
            console.error('Error in office parser:', error);
            reject(error);
        }
    });
};

// Detect unit/module/chapter structure from text
const extractUnits = (content) => {
    if (!content) return [];

    // Clean content by removing course objectives and outcomes
    let cleanedContent = content;

    // Remove metadata lines that might interfere (e.g., page numbers, headers)
    cleanedContent = cleanedContent.replace(/^(?:page|p)\s*\d+$/gim, '');
    cleanedContent = cleanedContent.replace(/R-24/g, '');

    // Remove course objectives sections identified by headers
    cleanedContent = cleanedContent.replace(/(Course Objectives?|Learning Objectives?|Educational Objectives?)[\s\S]*?(?=Unit|Chapter|Section|Module|\n\d+\.?\s*[UuCc][Nn][Ii][Tt]|$)/gi, '');

    // Remove course outcomes sections identified by headers
    cleanedContent = cleanedContent.replace(/(Course Outcomes?|Learning Outcomes?|Expected Outcomes?|Student Learning Outcomes?)[\s\S]*?(?=Unit|Chapter|Section|Module|\n\d+\.?\s*[UuCc][Nn][Ii][Tt]|$)/gi, '');

    // Remove CO (Course Outcome) lines/sections - this was specifically requested by user to be removed
    // Remove CO (Course Outcome) lines/sections - ONLY if they look like headers/sections
    cleanedContent = cleanedContent.replace(/(?:^|\n)\s*(?:Course Outcomes?|Learning Outcomes?|Expected Outcomes?|Student Learning Outcomes?|COs?|CO-PO Mapping)[\s:.-][\s\S]*?(?=Unit|Chapter|Section|Module|\n\d+\.?\s*[UuCc][Nn][Ii][Tt]|$)/gi, '');

    // Remove inline CO tags like [CO:1], (CO:1), [CO1], etc. without removing the following text
    cleanedContent = cleanedContent.replace(/\[\s*CO[:\s-]*\d+\s*\]/gi, '');
    cleanedContent = cleanedContent.replace(/\(\s*CO[:\s-]*\d+\s*\)/gi, '');
    cleanedContent = cleanedContent.replace(/\bCO[:\s-]*\d+\b/gi, '');

    // Also remove lines that look like CO definitions if they weren't caught above
    cleanedContent = cleanedContent.replace(/^CO\d+.*$/gim, '');

    const unitPatterns = [
        // Robust pattern for "UNIT I[Title" or "UNIT I: Title" or "UNIT I Title"
        // Does NOT require newline before next unit, handles '[' as separator
        // Lookahead now uses word boundary \b which handles space, newline, or '[' separators
        // Start now uses word boundary \b to handle various previous separators including '['
        /\b(?:unit|UNIT|Unit)\s+([IVX\d]+(?:\.\d+)?)\s*[:\-.[\]]?\s*(.*?)([\s\S]*?)(?=\b(?:unit|UNIT|Unit)\s+[IVX\d]+|$)/gi,

        // "1. UNIT Title" patterns
        /(?:^|\n)\s*(\d+(?:\.\d+)?)\.?\s*[.:\-]?\s*(?:unit|UNIT|Unit)\s+([^\n]+)([\s\S]*?)(?=\n\s*\d+(?:\.\d+)?\.?\s*(?:unit|UNIT|Unit)|$)/gi,

        // "MODULE I: Title"
        /\b(?:module|MODULE|Module)\s+([IVX\d]+(?:\.\d+)?)\s*[:\-.[\]]?\s*(.*?)([\s\S]*?)(?=\b(?:module|MODULE|Module)\s+[IVX\d]+|$)/gi,

        // Header-style "UNIT - I" on its own line, followed by title on next line
        /(?:^|\n)\s*(?:unit|UNIT|Unit)\s*[-:]?\s*([IVX\d]+)(?:\s*\n+\s*([^\n]+))([\s\S]*?)(?=\n\s*(?:unit|UNIT|Unit)|$)/gi
    ];

    let units = [];

    // Try each pattern
    for (const pattern of unitPatterns) {
        // pattern is global, so we can use matchAll
        const matches = Array.from(cleanedContent.matchAll(pattern));

        if (matches.length > 0) {
            for (const match of matches) {
                if (match[1]) {
                    const unitIdentifier = match[1];
                    let title = match[2] ? match[2].trim() : '';
                    let extractedContent = match[3] ? match[3].trim() : '';

                    // If title contains "UNIT" it means our non-greedy match failed or we matched garbage, skip
                    if (title.toUpperCase().includes('UNIT ') && title.length < 10) continue;

                    // If content is empty but title is long, maybe the title captured the content?
                    if (extractedContent.length === 0 && title.length > 50) {
                        // Heuristic: if title is very long, it might be title + content.
                        // But with strict regex this shouldn't happen too often if we have separators.
                    }

                    // Determine unit type
                    let unitType = 'Unit';
                    if (match[0].toLowerCase().includes('module')) {
                        unitType = 'Module';
                    }

                    // Final check on title
                    if (!title.toLowerCase().includes('objective') &&
                        !title.toLowerCase().includes('outcome') &&
                        !title.toLowerCase().includes('co:') &&
                        !title.toLowerCase().includes('co-') &&
                        !['i', 'ii', 'iii', 'iv', 'v'].includes(title.toLowerCase())) {

                        // Ensure we don't have this unit already
                        const exists = units.some(u => u.title.includes(`${unitIdentifier}:`) || (u.title.includes(title) && title.length > 5));
                        if (!exists) {
                            units.push({
                                title: normalizeWhitespace(`${unitType} ${unitIdentifier}: ${title}`),
                                content: normalizeWhitespace(extractedContent)
                            });
                        }
                    }
                }
            }

            // If we found units with the first/best pattern, break to avoid duplicates from weaker patterns
            if (units.length > 0) break;
        }
    }

    // Deduplicate units just in case
    const uniqueUnits = [];
    const seenIds = new Set();

    for (const unit of units) {
        // Use the Unit number/identifier for deduping if possible, or title
        // "Unit I: ..." -> "Unit I"
        const idMatch = unit.title.match(/(?:Unit|Module)\s+([IVX\d]+)/i);
        const id = idMatch ? idMatch[1].toUpperCase() : unit.title;

        if (!seenIds.has(id)) {
            seenIds.add(id);
            uniqueUnits.push(unit);
        }
    }
    units = uniqueUnits;

    if (units.length === 0) {
        // Fallback: look for Roman Numerals at start of lines which often indicate units in sloppy PDFs
        // I. Introduction ...
        const romanPattern = /(?:^|\n)\s*([IVX]+)\.?\s+([^\n]+)([\s\S]*?)(?=\n\s*[IVX]+\.?\s+|$)/g;
        const matches = Array.from(cleanedContent.matchAll(romanPattern));
        for (const match of matches) {
            if (match[1] && match[2]) {
                const unitId = match[1];
                const title = match[2].trim();
                const text = match[3].trim();
                if (!title.toLowerCase().includes('objective') && !title.toLowerCase().includes('outcome')) {
                    units.push({
                        title: normalizeWhitespace(`Unit ${unitId}: ${title}`),
                        content: normalizeWhitespace(text)
                    });
                }
            }
        }
    }

    // If still no units, fallback to whole content
    if (units.length === 0) {
        return [{
            title: "Full Content (Auto-detected)",
            content: normalizeWhitespace(cleanedContent)
        }];
    }

    // Strip trailing reference/bibliography sections from the LAST unit
    if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const refPattern = /\n\s*(?:references?|bibliography|text\s*books?|textbooks?|reference\s*books?|suggested\s*readings?|web\s*references?|e-?resources?|recommended\s*books?|further\s*readings?)\s*[:\-]?/i;
        const refMatch = lastUnit.content.search(refPattern);
        if (refMatch !== -1) {
            lastUnit.content = normalizeWhitespace(lastUnit.content.substring(0, refMatch));
        }
    }

    return units;
};


// Main parse function
const parseFile = async (fileBuffer, mimeType, originalName) => {
    let text = '';

    console.log(`Parsing file: ${originalName}, Type: ${mimeType}`);

    try {
        if (mimeType === 'application/pdf') {
            text = await parsePdf(fileBuffer);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
            text = await parseDocx(fileBuffer);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') { // pptx
            text = await parseOfficeFile(fileBuffer);
        } else if (mimeType === 'application/msword' || mimeType === 'application/vnd.ms-powerpoint') { // doc, ppt
            text = await parseOfficeFile(fileBuffer);
        } else if (mimeType === 'text/plain') {
            text = fileBuffer.toString('utf8');
        } else {
            // Try office parser as fallback for unknown office types
            try {
                text = await parseOfficeFile(fileBuffer);
            } catch (e) {
                throw new Error(`Unsupported file type: ${mimeType}`);
            }
        }

        // console.log('Extracted text preview:', text.substring(0, 200));

        const units = extractUnits(text);
        return {
            text,
            units
        };

    } catch (error) {
        console.error('File parsing failed:', error);
        throw error;
    }
};

module.exports = {
    parseFile,
    extractUnits
};
