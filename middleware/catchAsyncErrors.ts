//@ts-ignore
const { Request, Response, NextFunction } = require("express");
const catchAsyncErroMiddleWare =
  //@ts-ignore
  (errorFunction: any) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(errorFunction(req, res, next)).catch((err) =>
      next(err)
    );
  };

module.exports = { catchAsyncErroMiddleWare };
