import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {z} from 'zod';
import { BlobServiceClient } from "@azure/storage-blob";
import { readFileSync, writeFileSync, mkdirsSync } from 'fs';
import { PDFDocument } from 'pdf-lib';  

const SearchRequestSchema = z.object({
    document_name: z.string(),
    search: z.string()
});


export const listFilesFromBlobStorage = async(document: string, search: string) => {
    function convertValue(x: number, y: number, height: number, width: number, resolution: [number, number]) {
        const x0 = (x / width) * resolution[0];
        const y0 = (y / height) * resolution[1];
        return [x0, y0];
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage!);
    const containerClient = blobServiceClient.getContainerClient(process.env.BLOB_CONTAINER_NAME!);
    const analysisblob = containerClient.getBlockBlobClient(`analyses/${document.split('.pdf')[0]}.json`)
    const analysisblobBuffer = await analysisblob.downloadToBuffer()
    const analysisObj = JSON.parse(analysisblobBuffer.toString())
    const pdfblob = containerClient.getBlockBlobClient(`contracts/${document}`)
    const pdfbuffer = await pdfblob.downloadToBuffer();  

    
    const searchText = search;
    const pageSearcher: { [key: number]: any[] } = {};
 
    for (const [page, textElements] of Object.entries(analysisObj)) {
        const highlightedElements = textElements.filter((element: any) => element.text.includes(searchText));
        if (highlightedElements.length > 0) {
            pageSearcher[page] = highlightedElements;
        }
    }   
    const existingPdfDoc = await PDFDocument.load(pdfbuffer);  
    const newPdfDoc = await PDFDocument.create();   
    const selected_pages: (keyof MyDictionary)[] = Object.keys(pageSearcher) as (keyof MyDictionary)[];  
    for (const pageNumber of selected_pages) {  
        const [copiedPage] = await newPdfDoc.copyPages(existingPdfDoc, [Number(pageNumber) - 1]); // pageNumber is 1-based, index is 0-based  
        newPdfDoc.addPage(copiedPage);  
    }  
    const pdfBytes = await newPdfDoc.save(); 
    const array_data = Array.from(pdfBytes)
    return {buffer: array_data, pageInfo: pageSearcher}
}


// Convert a readable stream to a string
async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!readableStream) {
            resolve("");
            return;
        }
        const chunks: any[] = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}


export async function HighlightText(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const logger = context
    const searchRequest = SearchRequestSchema.parse(await request.json())
    const buffer = await listFilesFromBlobStorage(searchRequest.document_name, searchRequest.search)
    return { 
        headers : {
            'Content-Type':'application/json'
        },
        body : JSON.stringify({
            buffer: buffer
        })
    };
};

app.http('HighlightText', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: HighlightText
});
