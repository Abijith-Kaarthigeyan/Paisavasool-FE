import { api } from "@/lib/axios"
import { UserResponse, UserCreateInput, UserUpdateInput } from "@/types"

export const userService = {
  listUsers: async (): Promise<UserResponse[]> => {
    const response = await api.get<{ users: UserResponse[] }>("/users");
    return response.data.users;
  },

  createUser: async (data: UserCreateInput): Promise<UserResponse> => {
    const response = await api.post<UserResponse>("/users", data);
    return response.data;
  },

  getUser: async (id: string): Promise<UserResponse> => {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: UserUpdateInput): Promise<UserResponse> => {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.data;
  },
}
