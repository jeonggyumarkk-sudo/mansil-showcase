export declare enum UserRole {
    ADMIN = "ADMIN",
    AGENT = "AGENT",
    LANDLORD = "LANDLORD",
    TENANT = "TENANT"
}
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phoneNumber?: string;
    profileImage?: string;
    createdAt: Date;
    updatedAt: Date;
}
