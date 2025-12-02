import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
    const email = "test@example.com"
    const password = "password"

    console.log("Testing auth logic...")

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })
        console.log("User found:", user)

        if (!user || !user.password) {
            console.log("Creating user...")
            const hashedPassword = await bcrypt.hash(password, 10)
            console.log("Password hashed")
            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: email.split('@')[0],
                }
            })
            console.log("New user created:", newUser)
        } else {
            console.log("Verifying password...")
            const isValid = await bcrypt.compare(password, user.password)
            console.log("Password valid:", isValid)
        }

    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
