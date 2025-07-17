import {z} from "zod";

export const CreateRoomSchema = z.string().min(3,{message:"Too Short."}).max(40,{message:"Too Long."})