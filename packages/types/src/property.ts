export enum PropertyType {
    ONE_ROOM = 'ONE_ROOM',
    TWO_ROOM = 'TWO_ROOM',
    OFFICE = 'OFFICE',
    STORE = 'STORE',
    APARTMENT = 'APARTMENT',
    VILLA = 'VILLA',
    ETC = 'ETC',
}

export enum TransactionType {
    MONTHLY = 'MONTHLY',
    JEONSE = 'JEONSE',
    SALE = 'SALE',
    SHORT_TERM = 'SHORT_TERM',
}

export enum PropertyStatus {
    AVAILABLE = 'AVAILABLE',
    CONTRACT_PENDING = 'CONTRACT_PENDING',
    CONTRACTED = 'CONTRACTED',
    UNAVAILABLE = 'UNAVAILABLE',
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

    // Financial fields (BigInt serialized as string)
    deposit?: string | null;
    monthlyRent?: string | null;
    maintenanceFee?: string | null;
    salePrice?: string | null;

    // Details
    areaPyeong: number;
    floor: number;
    totalFloors: number;
    roomCount: number;
    bathroomCount: number;

    // Location
    address: string;
    roadAddress: string;
    coordinates: Coordinates;

    // Metadata
    options: string[];
    images: string[];

    // Meta
    isVerified: boolean;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
