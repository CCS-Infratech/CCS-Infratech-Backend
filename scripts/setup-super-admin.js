// setup-super-admin.js
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

dotenv.config();
const prisma = new PrismaClient();

async function createSuperSuperAdmin() {
    try {
        // Check if command line arguments are provided
        const args = process.argv.slice(2);
        if (args.length < 3) {
            console.error('Usage: node setup-super-admin.js <email> <phone> <password>');
            process.exit(1);
        }

        const [email, phone, password] = args;

        // Validate inputs
        if (!email.includes('@') || password.length < 12 || !phone.match(/^\+\d{10,15}$/)) {
            console.error('Invalid inputs. Email must be valid, password must be at least 12 characters, and phone must include country code (+).');
            process.exit(1);
        }

        // Check if user with this email/phone already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });

        if (existingUser) {
            console.error('A user with this email or phone already exists.');
            process.exit(1);
        }

        // Get or create SUPER_SUPER_ADMIN role
        let superSuperAdminRole = await prisma.role.findFirst({
            where: { name: 'SUPER_SUPER_ADMIN' }
        });

        if (!superSuperAdminRole) {
            superSuperAdminRole = await prisma.role.create({
                data: {
                    name: 'SUPER_SUPER_ADMIN',
                    accessLevel: 100, // Highest level
                    permissions: {
                        FULL_SYSTEM_ACCESS: true,
                        MANAGE_ALL_USERS: true,
                        MANAGE_ALL_PROPERTIES: true,
                        ACCESS_FINANCIAL_DATA: true,
                        VIEW_ANALYTICS: true,
                        MANAGE_VENDORS: true,
                        MANAGE_ROLES: true,
                        MANAGE_SETTINGS: true,
                        MANAGE_BILLING: true,
                        VIEW_AUDIT_LOGS: true,
                        MANAGE_SUPER_ADMINS: true
                    },
                    description: 'Platform owner with complete access'
                }
            });
            console.log('Created SUPER_SUPER_ADMIN role');
        }

        // Create username from email
        const username = email.split('@')[0] + '_' + crypto.randomBytes(3).toString('hex');

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Begin transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    username,
                    email,
                    phone,
                    passwordHash,
                    roleId: superSuperAdminRole.id,
                    authMethod: 'BOTH',
                    status: 'ACTIVE',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            console.log(`Created user with ID: ${user.id}`);

            // Create SuperSuperAdmin record
            const superSuperAdmin = await tx.superSuperAdmin.create({
                data: {
                    userId: user.id,
                    ipWhitelist: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            console.log(`Created SuperSuperAdmin with ID: ${superSuperAdmin.id}`);

            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'SUPER_SUPER_ADMIN_CREATED',
                    entityType: 'USER',
                    entityId: user.id,
                    description: 'SuperSuperAdmin account created via setup script',
                    ipAddress: '127.0.0.1',
                    userAgent: 'Setup Script',
                    timestamp: new Date()
                }
            });

            return { user, superSuperAdmin };
        });

        console.log('\n===== SUPER SUPER ADMIN CREATED SUCCESSFULLY =====');
        console.log(`Email: ${email}`);
        console.log(`Username: ${username}`);
        console.log(`Phone: ${phone}`);
        console.log('Please store these credentials securely.');
        console.log('================================================\n');

        // Instructions for next steps
        console.log('Next steps:');
        console.log('1. Store these credentials in a secure password manager');
        console.log('2. Log in to the admin panel using these credentials');
        console.log('3. Complete the email and phone verification process');
        console.log('4. Update the IP whitelist in your account settings');
        console.log('5. Delete this setup script from your server');

    } catch (error) {
        console.error('Error creating SuperSuperAdmin:', error);
        console.error('Detailed error:', error.message);

        if (error.code === 'P2002') {
            console.error('Unique constraint violation. This might be due to a duplicate username, email, or phone number.');
        }

        if (error.code === 'P2003') {
            console.error('Foreign key constraint violation. Make sure all referenced records exist.');
        }

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperSuperAdmin();