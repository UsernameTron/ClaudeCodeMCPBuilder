---
name: document-processor
description: Process and transform documents with specific formatting requirements when user needs consistent document generation or conversion
---

# Document Processor

## Overview

This skill handles document creation and transformation tasks requiring consistent formatting and structure. It ensures documents follow organizational standards for branding, layout, and content organization.

## When to Use This Skill

Claude should invoke this skill when:
- Creating formatted documents from templates
- Converting between document formats (e.g., Markdown to Word)
- Applying brand guidelines to documents
- Generating reports with consistent structure
- Batch processing multiple documents

## Instructions

### Document Creation

1. **Analyze Requirements**
   - Identify document type (report, presentation, letter, etc.)
   - Determine required format and structure
   - Check for specific guidelines or templates

2. **Apply Formatting Rules**
   - Use company brand colors and fonts
   - Apply heading styles and hierarchy
   - Set margins, spacing, and layout
   - Insert logos and headers/footers

3. **Generate Content**
   - Follow content structure from template
   - Maintain consistent voice and tone
   - Include all required sections
   - Add tables, charts, or images as needed

4. **Validate Output**
   - Check formatting consistency
   - Verify all sections are present
   - Review for brand compliance
   - Confirm file format is correct

### Document Transformation

1. Parse source document structure
2. Map elements to target format
3. Preserve formatting where possible
4. Validate transformed output

## Examples

### Example 1: Brand-Compliant Report

**Input:**
```
Create a quarterly sales report with:
- Executive summary
- Sales metrics by region
- Year-over-year comparison
- Recommendations
```

**Output:**
```
Generated report.docx with:
- Company logo and colors
- Proper heading styles
- Formatted tables and charts
- Professional layout matching brand guidelines
```

### Example 2: Markdown to Word Conversion

**Input:**
```
Convert README.md to Word document with table of contents
```

**Output:**
```
Word document with:
- Markdown headers converted to Word styles
- Code blocks formatted as monospace
- Links preserved as hyperlinks
- Auto-generated table of contents
```

## Guidelines

### Formatting Standards
- Always use official brand colors and fonts
- Maintain consistent heading hierarchy (H1 → H2 → H3)
- Set standard margins: 1" all sides for documents, varies for presentations
- Use proper spacing: 1.15 line spacing for body text

### Content Standards
- Keep executive summaries to 1 page maximum
- Use active voice and clear, concise language
- Include page numbers on multi-page documents
- Add document metadata (author, date, version)

### Quality Checks
- Spell check and grammar check before finalizing
- Verify all cross-references are correct
- Ensure images are high quality (300 DPI minimum)
- Check that file size is reasonable for sharing

### Error Handling
- If template is missing, ask user for guidance
- If brand assets are unavailable, note this in output
- Validate file format compatibility before conversion
- Provide clear error messages with suggested fixes

## File Locations

- Templates: `resources/templates/`
- Brand assets: `resources/brand/`
- Sample outputs: `resources/examples/`
- Conversion scripts: `scripts/convert.py`

## Dependencies

- python-docx>=0.8.11 (for Word document handling)
- Pillow>=9.0.0 (for image processing)
- markdown>=3.4.0 (for Markdown parsing)

## Additional Resources

- See REFERENCE.md for complete formatting specifications
- Check resources/brand-guide.md for brand guidelines
- Review resources/templates/ for document templates

---
*Created: 2025-11-11*
*Version: 1.0.0*
*Dependencies: python>=3.8, python-docx>=0.8.11, Pillow>=9.0.0, markdown>=3.4.0*
