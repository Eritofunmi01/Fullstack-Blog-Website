const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient();

exports.connectDB = async() => {
    try {
        await prisma.$connect()
        console.log("Connected to the Database Successfully!")
    } catch (error) {
        await prisma.$disconnect()
        console.log("Error connecting to Database", error)
        process.exit(1)
    }
}