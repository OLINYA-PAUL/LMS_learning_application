require("dotenv").config();
import { connectDbUrl } from "./utils/databaseDB";
import app from "./app";
import { cloudinaryConfig } from "./utils/cloudinary";

cloudinaryConfig();
app.listen(process.env.PORT, async () => {
  try {
    if (process.env.MONGODB_URL)
      await connectDbUrl(process.env.MONGODB_URL).then((data: any) => {
        // console.log({ DATATA: data });
        console.log(
          `Server is listening to ${process.env.PORT} - ${data.connection.host}`
        );
      });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log("An unexpected error occurred:", error);
    }
  }
});
