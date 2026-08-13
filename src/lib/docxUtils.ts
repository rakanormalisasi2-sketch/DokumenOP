import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * Converts a Base64 string to an ArrayBuffer.
 * Useful for preparing data for docxtemplater or docx-preview.
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * Performs a Mail Merge on a DOCX Base64 string using the provided data.
 * Uses {{fieldName}} double-brace syntax (consistent with HTML/XLSX templates).
 * Returns the merged document as a Blob.
 */
export const performMailMerge = (
    docxBase64: string,
    data: Record<string, any>
): Blob | null => {
    try {
        // 1. Load the DOCX file as a binary
        const zip = new PizZip(base64ToArrayBuffer(docxBase64));

        // 2. Parse the template with {{double brace}} delimiters
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{{', end: '}}' },
            nullGetter: () => '',
        });

        // 3. Render the document (replace {{placeholders}} with data)
        doc.render(data);

        // 4. Generate the output as a Blob
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        return out;
    } catch (error: any) {
        console.error('Mail Merge Error:', error);
        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors
                .map((e: any) => e.properties?.explanation || e.message)
                .join('\n');
            console.error('Docxtemplater errors:', errorMessages);
        }
        return null;
    }
};

/**
 * Generates a document by injecting data into the original binary using docxtemplater.
 * This preserves 100% of the original layout (headers, footers, signatures).
 * Uses {{fieldName}} double-brace syntax.
 */
export const generateDocument = async (originalBlob: Blob, data: Record<string, any>): Promise<Blob> => {
    const arrayBuffer = await originalBlob.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    // Configure docxtemplater with {{double brace}} delimiters
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
        nullGetter: () => ''
    });

    // Render the document
    try {
        doc.render(data);
    } catch (error: any) {
        console.error("Docxtemplater Error:", error);
        if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors.map(
                (e: any) => e.properties?.explanation || e.message
            ).join("\n");
            throw new Error(`Template Error: ${errorMessages}`);
        }
        throw error;
    }

    // Generate output blob
    const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return out;
};

/**
 * Detects variables in the format {{VAR_NAME}} from a string.
 */
export const detectVariables = (text: string): string[] => {
    const regex = /{{([^{}]+)}}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(text)) !== null) {
        const varName = match[1].trim();
        const cleanName = varName.replace(/^MERGEFIELD\s+/i, '').replace(/^\"|\"$/g, '').trim();

        if (cleanName) {
            variables.add(cleanName);
        }
    }

    return Array.from(variables);
};
