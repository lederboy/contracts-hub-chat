import {app,HttpRequest,HttpResponseInit,InvocationContext,} from "@azure/functions";
  import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
  import { ListContractsSchema } from "../definitions/exchange";
  import {v4 as uuidv4} from 'uuid';
  
  export async function ListContracts(request: HttpRequest,context: InvocationContext): Promise<HttpResponseInit> {
    const ListSesh = ListContractsSchema.parse(await request.json());
    let user = ListSesh.user;
    let contractType = ListSesh.contractType;

    
    const blobList: Array<{ title: string; docId: string }> = [];
    
  
    const containerClient = new ContainerClient(
      process.env.BLOB_CONTAINER_URL!,
      new StorageSharedKeyCredential(
        process.env.STORAGE_ACCOUNT_NAME!,
        process.env.STORAGE_ACCOUNT_KEY!
      )
    )
  
    try {
      const containerExists = await containerClient.exists();
  
      if (!containerExists) {
        return {
          headers: {
            "Content-Type": "application/json",
          },
          status: 404,
        };
      }
      const directoryName = `contracts/${contractType}/`;
      const ListIterator = containerClient.listBlobsFlat({prefix: directoryName});
      for await (const blob of ListIterator) {
        const title = blob.name.replace('contracts/', ''); // Replace with actual directory name if needed
        const docId =uuidv4();
        blobList.push({ title, docId });
      }
  
      return {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contracts: blobList,
        }),
      };
    } catch (error) {
      return {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500
      };
    }
  }
  
  app.http("ListContracts", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: ListContracts,
  });
  