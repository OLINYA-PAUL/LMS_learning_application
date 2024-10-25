import { Request } from "express";
import { Iuser } from "../models/user.models";

declare global {
  namespace Express {
    interface Request {
      user?: Iuser;
    }
  }
}
