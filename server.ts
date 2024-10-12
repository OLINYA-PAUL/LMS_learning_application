require("dotenv").config();
//@ts-ignore
const { connectDbUrl } = require("./utils/databaseDB");
const { app } = require("./app");

app.listen(process.env.PORT, async () => {
  try {
    await connectDbUrl(process.env.MODODB_URL).then((data: any) => {
      // console.log({ DATATA: data });
      console.log(`Server is listening to ${data?.connection.host || ""}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log("An unexpected error occurred:", error);
    }
  }
});
