export interface SuperAdminRegisterDTO {
    email: string;
    phone: string;
    password: string;
    companyName?: string;
    businessType?: string;
}

export interface SuperAdminLoginDTO {
    username?: string;
    email?: string;
    phone?: string;
    password: string;
}

export interface OTPVerificationDTO {
    userId: number;
    firebaseToken: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    token?: string;
    user?: any;
    requireOTP?: boolean;
    userId?: number;
    phoneNumber?: string;
}

export interface JWTPayload {
    userId: number;
    role: string;
    superAdminId?: number;
}