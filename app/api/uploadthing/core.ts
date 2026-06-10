import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  prescriptionUploader: f({
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "4MB" },
  })
    .middleware(async () => {
      const user = await currentUser();
      if (!user) throw new Error("غير مصرح");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;