import { PDFDocument, PDFDict, PDFArray, PDFName, PDFRef, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
// jsPDF paints contextual Arabic forms. Map those glyphs back to ordinary
// Unicode letters so PDF search/copy does not expose Presentation Forms.
export async function normalizeArabicTextMap(bytes) {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    // Re-encode page streams instead of carrying producer-specific compressed
    // stream dictionaries through the second writer, keeping the rewritten PDF
    // independent of the producer's original compression metadata.
    for (const page of pdf.getPages()) {
        const entry = page.node.get(PDFName.of('Contents'));
        const references = entry instanceof PDFArray ? entry.asArray() : [entry];
        for (const reference of references) {
            if (!(reference instanceof PDFRef))
                continue;
            const stream = pdf.context.lookup(reference);
            if (stream instanceof PDFRawStream)
                pdf.context.assign(reference, pdf.context.flateStream(decodePDFRawStream(stream).decode()));
        }
    }
    for (const [, object] of pdf.context.enumerateIndirectObjects()) {
        if (!(object instanceof PDFDict))
            continue;
        const reference = object.get(PDFName.of('ToUnicode'));
        if (!reference)
            continue;
        const stream = pdf.context.lookup(reference);
        if (!(stream instanceof PDFRawStream))
            continue;
        const raw = new TextDecoder().decode(decodePDFRawStream(stream).decode());
        const corrected = raw.replace(/(<[0-9a-f]{4}>\s*<)([0-9a-f]{4})(>)/gi, (match, prefix, hex, suffix) => {
            const code = parseInt(hex, 16);
            if (code < 0xfb50 || code > 0xfefc)
                return match;
            const logical = String.fromCharCode(code).normalize('NFKC');
            // PDF glyph order is visual; a multi-letter RTL ligature must follow that
            // same order before the reader's bidi algorithm reconstructs logical text.
            const visual = Array.from(logical).reverse().join('');
            const mapped = Array.from(visual).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
            return prefix + mapped + suffix;
        });
        if (corrected !== raw) {
            const replacement = pdf.context.flateStream(corrected);
            if (reference instanceof PDFRef)
                pdf.context.assign(reference, replacement);
            else
                object.set(PDFName.of('ToUnicode'), pdf.context.register(replacement));
        }
    }
    return pdf.save({ useObjectStreams: false });
}
