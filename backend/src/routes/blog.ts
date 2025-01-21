import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from '@amar96/medium-common';


//const app = new Hono();
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL : string
    MY_JWT_SECRET_KEY : string
  },
  Variables:{
     userId : string
  }
}>();

//All the routes which starts with /api/v1/blog/ will use this middleware. Notice we added a wildcard symbol at the end
blogRouter.use("/*", async (c, next)=>{
     //Check if user is authenticated
     const authHeader = c.req.header("authorization") || ""; //Fetch the header with key 'authorization' also the user might not provide the authorization in the header hence by default if it does not provide we are setting it as empty string to bypass the typescript type warning that says authheader may be string or undefined.
     const token = authHeader.split(" ")[1];
     try{
          const user = await verify(token, c.env.MY_JWT_SECRET_KEY);
          //If yes then attach the userId to the request and call next() so now userId will propagte through the callback chain and final callback can use this info to set authorId
          if(user.id){
               console.log(user);
               // If the user is authenticated, attach the userId to the context
               c.set("userId", user.id as string);
               await next();
          }
          else{
               c.status(403);
               return c.json({
                    message: "You are not logged in"
               })
          }
     }
     catch(err){
          c.status(403);
          c.json({
               message: "User is unauthorized"
          })
     }
});

blogRouter.post('/', async (c)=>{
     const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate());

     const body = await c.req.json();
     const { success } = createBlogInput.safeParse(body);
     if(!success){
          c.status(411);
          return c.json({
               message: "Invalid inputs..."
          });
     }
     const blog  = await prisma.blog.create({
          data : {
               title: body.title,
               content: body.content,
               authorId : c.get("userId")
          }
     });

     return c.json({
          id: blog.id
     })
});
        
blogRouter.put('/', async (c)=>{
     const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate());

     const body = await c.req.json();
     const { success } = updateBlogInput.safeParse(body);
     if(!success){
          c.status(411);
          return c.json({
               message: "Invalid inputs..."
          });
     }
     const blog  = await prisma.blog.update({
          where : {
               id: body.id
          },
          data : {
               title: body.title,
               content: body.content,
          }
     });

     return c.json({
          id: blog.id
     });
});

//Ideally you should add 'pagination' to this end point meaning you shouldn't return all the blogs, you should return some blogs to the user and the user can dynamically get more and more blogs as they scroll down the window in an infinite scroll effect.
blogRouter.get('/bulk',async (c)=>{
     const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate());

     const blogs = await prisma.blog.findMany();

     return c.json({
          blogs
     })
})
        
blogRouter.get('/:id',async (c)=>{
     const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate());

     //const body = await c.req.json();
     try{
          const blog  = await prisma.blog.findFirst({
               where : {
                    id: c.req.param("id") //Accessing the request parameter with key 'id'
               }
          });
     
          return c.json({
               blog: blog
          });
     }
     catch(err){
          c.status(411);
          return c.text("Error while fetching blog post. Check if id passed is valid id or not")
     }
})

//Ideally you should add 'pagination' to this end point meaning you shouldn't return all the blogs, you should return some blogs to the user and the user can dynamically get more and more blogs as they scroll down the window in an infinite scroll effect.
//Notice since above route /:id and below get route /bulk will conflict and above route will treat bulk as the value of the id in query paremeter. The way around is either add something else to the below route e.g. /get/bulk or simply put below route handler code above the above route handler which is what I will do
// blogRouter.get('/bulk',async (c)=>{
//      const prisma = new PrismaClient({
//           datasourceUrl: c.env.DATABASE_URL,
//      }).$extends(withAccelerate());

//      const blogs = await prisma.blog.findMany();

//      return c.json({
//           blogs
//      })
// })