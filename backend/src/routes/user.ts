import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { signupInput, signinInput } from '@amar96/medium-common'


//const app = new Hono();
export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL : string
    MY_JWT_SECRET_KEY : string
  }
}>();

// in hono 'c' contains all your request data(body, headers, query parameters), all your environment variables
// use c.env to access all the environment variables
userRouter.post('/signup',async (c)=>{
    
    //const dbUrl = c.env.DATABASE_URL;  //To get access of DATABASE_URL i.e., url of connection pool provided by prisma accelerate
    
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try{
      const body = await c.req.json();
      const { success } = signupInput.safeParse(body);
      if(!success){
        c.status(411);
        return c.json({
          message: "Invalid inputs..."
        });
      }
      const user = await prisma.user.create({
        data : {
          email: body.email,
          name: body.name,
          password: body.password,
        },
      })
      const jwt = await sign({id : user.id}, c.env.MY_JWT_SECRET_KEY);
      
      return c.json({ jwt });
    }
    catch(err){
      c.status(411);
      return c.json({error: "Invalid credentials. Email might be already registered..."});
    }
});
      
userRouter.post('/signin',async (c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({
          message: "Invalid inputs..."
        });
    }
    try{
      const user = await prisma.user.findUnique({
        where : {
          email : body.email,
          password: body.password
        }
      });
      if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
      }
      const jwt = await sign({ id: user.id }, c.env.MY_JWT_SECRET_KEY);
      return c.json({ jwt });
    }
    catch(err){
      c.status(411);
      return c.text('Invalid');
    }
    
})



