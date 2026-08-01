import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Generate a username from email address
 * @param email The email to generate username from
 * @param role The role of the user
 */
function generateUsername(email: string, role: string = 'user'): string {
    // Extract the part before @
    const localPart = email.split('@')[0];
    
    // Remove common words like 'admin', 'contact', etc.
    let baseName = localPart
        .replace(/admin|contact|info|support|hello|user/gi, '')
        .replace(/[^a-z0-9]/gi, '');  // Remove special characters
    
    // If base name is too short after filtering, use the original local part
    if (baseName.length < 3) {
        baseName = localPart.replace(/[^a-z0-9]/gi, '');
    }
    
    // Append role if not already in base name
    if (role !== 'user' && !baseName.toLowerCase().includes(role.toLowerCase())) {
        // Make first character of role uppercase for readability
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
        return `${baseName}${formattedRole}`;
    }
    
    return baseName;
}

async function main() {
    console.log('Creating Admin User...');
    
    const email = 'cssinfratechadmin@gmail.com';
    const password = 'Cssadmin@pass';
    const role = 'admin';
    
    // Generate username from email
    let username = generateUsername(email, role);
    console.log(`Generated username: ${username}`);
    
    // Check if user with this email or username already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });
    
    if (existingUser) {
        console.log(`Admin user with email ${email} or username ${username} already exists, skipping creation`);
        return;
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create admin user
    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            role,
        }
    });
    
    console.log(`Admin user created successfully with ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });