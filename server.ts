require("dotenv").config();
import { connectDbUrl } from "./utils/databaseDB";
import app from "./app";

app.listen(process.env.PORT, async () => {
  try {
    //@ts-ignore
    await connectDbUrl(process.env.MONGODB_URL).then((data: any) => {
      // console.log({ DATATA: data });
      console.log(`Server is listening to ${data.connection.host}`);
    });

    console.log("MONGODB connecte successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log("An unexpected error occurred:", error);
    }
  }
});
