import { PrismaClient } from '@prisma/client'

// ฟังก์ชันสำหรับสร้าง PrismaClient instance ใหม่
const prismaClientSingleton = () => {
  return new PrismaClient()
}

// ประกาศประเภทข้อมูลสำหรับ global object เพื่อให้ TypeScript รู้จัก
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// เรียกใช้ instance เดิมหากมีอยู่แล้ว ป้องกันปัญหาการสร้าง connection ซ้ำในช่วง Development (Hot Reloading)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
