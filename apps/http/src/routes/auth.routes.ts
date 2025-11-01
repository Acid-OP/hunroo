import { Router, Request, Response, NextFunction } from 'express';
import { signup, login } from '../controllers/auth.controller';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();

const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  };
};

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

export default router;