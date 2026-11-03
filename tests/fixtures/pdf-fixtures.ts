/**
 * Helper to build valid and invalid PDF buffers for testing.
 */

export function createValidSinglePagePdfBuffer(): Buffer {
  const text =
    "Transformers are neural network architectures designed to process sequential input data through self-attention mechanisms, capturing long-range dependencies without recurrence.";
  const stream = `BT\n/F1 12 Tf\n72 712 Td\n(${text}) Tj\nET`;

  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${stream.length} >> stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000325 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
${420 + stream.length}
%%EOF`;

  return Buffer.from(content, "utf-8");
}

export function createValidMultiPagePdfBuffer(): Buffer {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 44 >> stream
BT
/F1 12 Tf
72 712 Td
(Page 1: First page empirical results.) Tj
ET
endstream
endobj
6 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >> endobj
7 0 obj << /Length 45 >> stream
BT
/F1 12 Tf
72 712 Td
(Page 2: Second page analytical review.) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000122 00000 n 
0000000251 00000 n 
0000000332 00000 n 
0000000427 00000 n 
0000000556 00000 n 
trailer << /Size 8 /Root 1 0 R >>
startxref
652
%%EOF`;

  return Buffer.from(content, "utf-8");
}

export function createScannedNoTextPdfBuffer(): Buffer {
  const stream = `BT\n/F1 12 Tf\n72 712 Td\n() Tj\nET`;

  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${stream.length} >> stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000325 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
${420 + stream.length}
%%EOF`;

  return Buffer.from(content, "utf-8");
}

export function createCorruptedPdfBuffer(): Buffer {
  return Buffer.from("%PDF-1.4 corrupted invalid content not conforming to pdf syntax", "utf-8");
}

export function createNonPdfBuffer(): Buffer {
  return Buffer.from("<html><body>Not a PDF file</body></html>", "utf-8");
}
