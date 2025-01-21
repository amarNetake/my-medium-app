import z from "zod";

export const signupInput = z.object({   //Used in runtime type validation at the backend
     email : z.string().email(),
     password: z.string().min(6),
     name: z.string().optional(),
});

export const signinInput = z.object({   //Used in runtime type validation at the backend
     email : z.string().email(),
     password: z.string(),
});

export const createBlogInput = z.object({ //Used in runtime type validation at the backend
     title : z.string(),
     content: z.string(),
});

export const updateBlogInput = z.object({ //Used in runtime type validation at the backend
     title : z.string(),
     content: z.string(),
     id: z.string()
});


export type SignupInput = z.infer<typeof signupInput>; //will be used in frontend type validation at compile time

export type SigninInput = z.infer<typeof signinInput>; //will be used in frontend type validation at compile time

export type CreateBlogInput = z.infer<typeof createBlogInput>; //will be used in frontend type validation at compile time

export type UpdateBlogInput = z.infer<typeof updateBlogInput>; //will be used in frontend type validation at compile time