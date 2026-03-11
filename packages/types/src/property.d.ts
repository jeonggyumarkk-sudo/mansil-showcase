export declare enum PropertyType {
    ONE_ROOM = "ONE_ROOM",
    TWO_ROOM = "TWO_ROOM",
    THREE_ROOM = "THREE_ROOM",
    OFFICETEL = "OFFICETEL",
    APARTMENT = "APARTMENT",
    VILLA = "VILLA",
    COMMERCIAL = "COMMERCIAL"
}
export declare enum TransactionType {
    MONTHLY = "MONTHLY",
    JEONSE = "JEONSE",
    SALE = "SALE"
}
export declare enum PropertyStatus {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    CONTRACT_PENDING = "CONTRACT_PENDING",
    COMPLETED = "COMPLETED"
}
export interface Coordinates {
    lat: number;
    lng: number;
}
export interface Property {
    id: string;
    title: string;
    description: string;
    type: PropertyType;
    transactionType: TransactionType;
    status: PropertyStatus;
    deposit?: number;
    monthlyRent?: number;
    maintenanceFee?: number;
    salePrice?: number;
    area: number;
    floor: number;
    totalFloors: number;
    roomCount: number;
    bathroomCount: number;
    address: string;
    roadAddress: string;
    coordinates: Coordinates;
    options: string[];
    images: string[];
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
