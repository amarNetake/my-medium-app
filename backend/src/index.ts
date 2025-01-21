import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge' //In serverless offering you need to fetch PrismaClient from @Prism/client/edge instead of @Prisma/client
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';


//const app = new Hono();
const app = new Hono<{
  Bindings: {
    DATABASE_URL : string
    MY_JWT_SECRET_KEY : string
  }
}>();

app.route('/api/v1/user', userRouter);
app.route('/api/v1/blog', blogRouter);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


export default app


