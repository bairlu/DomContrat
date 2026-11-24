import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
export async function pdfLogicalText(bytes) { const task = getDocument({ data: bytes.slice(), useSystemFonts: false }); try {
    const pdf = await task.promise;
    const text = [];
    for (let n = 1; n <= pdf.numPages; n++) {
        const result = await (await pdf.getPage(n)).getTextContent();
        text.push(result.items.filter(item => 'str' in item).map(item => item.str).join(' ').replace(/\s+/g,' '));
    }
    return { text: text.join(' '), pages: pdf.numPages };
}
finally {
    await task.destroy();
} }
