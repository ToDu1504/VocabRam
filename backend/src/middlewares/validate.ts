import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { HttpError } from "../utils/httpError.js";

type Part = "body" | "params" | "query";

// Validates req[part]; parsed (coerced) values are stored in res.locals[part].
export function validate(schema: ZodTypeAny, part: Part = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join(".") || part}: ${i.message}`).join("; ");
      return next(new HttpError(400, "VALIDATION_ERROR", msg));
    }
    res.locals[part] = result.data;
    next();
  };
}
