import {z} from "zod";

export const CreateRoomSchema = z.string().min(3).max(30)