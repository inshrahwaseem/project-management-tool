import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getCurrentUser } from "@/lib/auth-utils";

const f = createUploadthing();

export const ourFileRouter = {
  // Define a file route for task attachments
  taskAttachment: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 4 }, 
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "4MB" }
  })
    // Middleware runs before upload starts
    .middleware(async ({ req }) => {
      const user = await getCurrentUser();
      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");
      
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      
      // return data to client
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
