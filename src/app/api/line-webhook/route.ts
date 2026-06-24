import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { messagingApi, webhook } from '@line/bot-sdk'
import prisma from '@/lib/prisma'
import { Readable } from 'stream'

// ตั้งค่า LINE Client Configuration
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
}

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
})

const lineBlobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: lineConfig.channelAccessToken,
})

/**
 * ฟังก์ชันสำหรับตรวจสอบ Signature ของ LINE Webhook
 */
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64')
  return hash === signature
}

/**
 * ฟังก์ชันช่วยประมวลผลและแกะข้อมูลข้อความแจ้งเตือนทางการเงิน (Thai Bank Notification Parser)
 */
function parseBankMessage(text: string): { amount: number; type: 'INCOME' | 'EXPENSE'; note: string; category: string } | null {
  // ค้นหายอดเงินในรูปแบบตัวเลขทศนิยม 2 ตำแหน่ง (เช่น 1,250.00 หรือ 350.00)
  const amountRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/
  const matchAmount = text.match(amountRegex)

  if (!matchAmount) return null

  // แปลงยอดเงินโดยเอาเครื่องหมายคอมมา (,) ออกและแปลงเป็น Float
  const amount = parseFloat(matchAmount[1].replace(/,/g, ''))
  if (isNaN(amount) || amount <= 0) return null

  // กำหนดค่าเริ่มต้น
  let type: 'INCOME' | 'EXPENSE' = 'EXPENSE'
  let note = 'บันทึกอัตโนมัติจาก LINE'
  let category = 'อื่นๆ'

  // กฎในการประเมินและคัดแยกประเภท (รายรับ / รายจ่าย) และรายละเอียด
  const textClean = text.replace(/\s+/g, ' ')

  // 1. ตรวจหาคำสำคัญประเภทรายจ่าย (Expense Keywords)
  const expenseKeywords = [
    'โอนเงินสำเร็จ',
    'โอนไป',
    'จ่ายให้',
    'ชำระเงิน',
    'ถอนเงิน',
    'ตัดบัญชี',
    'ชำระค่าสินค้า',
  ]
  // 2. ตรวจหาคำสำคัญประเภทรายรับ (Income Keywords)
  const incomeKeywords = [
    'เงินเข้า',
    'ได้รับเงิน',
    'รับเงินจาก',
    'ฝากเงิน',
    'โอนเข้าบัญชี',
    'ฝากเงินสำเร็จ',
  ]

  const hasExpense = expenseKeywords.some(keyword => textClean.includes(keyword))
  const hasIncome = incomeKeywords.some(keyword => textClean.includes(keyword))

  if (hasIncome) {
    type = 'INCOME'
    category = 'เงินเดือน' // หมวดหมู่เริ่มต้นสำหรับรายรับ

    // ตัวอย่างการสกัด Note เช่น "ได้รับเงินจาก นายสมชาย" -> Note: "นายสมชาย"
    const fromMatch = textClean.match(/(?:จาก|โอนเข้าบัญชีโดย)\s*([^\d\s\n]+)/)
    if (fromMatch && fromMatch[1]) {
      note = `รับจาก ${fromMatch[1].trim()}`
    } else {
      note = 'รายรับเข้าบัญชี'
    }
  } else if (hasExpense) {
    type = 'EXPENSE'
    category = 'อาหาร' // หมวดหมู่เริ่มต้นสำหรับรายจ่าย

    // ตัวอย่างการสกัด Note เช่น "โอนไป นายสมชาย" -> Note: "นายสมชาย"
    const toMatch = textClean.match(/(?:โอนไป|จ่ายให้|ชำระค่า)\s*([^\d\s\n]+)/)
    if (toMatch && toMatch[1]) {
      note = `จ่ายให้ ${toMatch[1].trim()}`
    } else {
      note = 'รายการจ่ายเงิน'
    }
  }

  return { amount, type, note, category }
}

/**
 * ฟังก์ชันดาวน์โหลดภาพจาก LINE Content API (สำหรับเก็บไปประมวลผลสลิป/OCR)
 */
async function downloadLineContent(messageId: string): Promise<Buffer> {
  const stream = (await lineBlobClient.getMessageContent(messageId)) as Readable
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

/**
 * API Route Handler สำหรับ Webhook (POST)
 */
export async function POST(request: Request) {
  try {
    // 1. ตรวจสอบสภาพแวดล้อมระบบก่อนการประมวลผล
    if (!lineConfig.channelAccessToken || !lineConfig.channelSecret) {
      console.error('Missing LINE configuration environment variables.')
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 })
    }

    // 2. ดึงข้อมูลดิบ (Raw Body) และลายเซ็น (Signature)
    const rawBody = await request.text()
    const signature = request.headers.get('x-line-signature') || ''

    // 3. ตรวจสอบความถูกต้องของลายเซ็น (X-Line-Signature Validation)
    if (!verifySignature(rawBody, signature, lineConfig.channelSecret)) {
      console.warn('Invalid signature detected in request.')
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const events: webhook.Event[] = payload.events || []

    // 4. วนลูปประมวลผลกิจกรรมที่ส่งเข้ามา
    for (const event of events) {
      if (event.type !== 'message') continue
      
      const { replyToken } = event
      const lineUserId = event.source.userId

      if (!lineUserId || !replyToken) continue

      // ดักจับข้อความประเภท ตัวอักษร (Text Message)
      if (event.message.type === 'text') {
        const textMessage = event.message.text.trim()
        
        // ตรวจสอบการเชื่อมโยงบัญชีด้วยอีเมล (เช่น user@example.com หรือ link user@example.com)
        const emailMatch = textMessage.match(/^(?:link\s+)?([^\s@]+@[^\s@]+\.[^\s@]+)$/i)
        if (emailMatch) {
          const email = emailMatch[1].toLowerCase()
          try {
            // ค้นหาผู้ใช้ในระบบตามอีเมล
            const existingUser = await prisma.user.findUnique({
              where: { email },
            })

            if (!existingUser) {
              await lineClient.replyMessage({
                replyToken,
                messages: [{
                  type: 'text',
                  text: `ไม่พบอีเมล ${email} ในระบบค่ะ 🥺\nกรุณาสมัครสมาชิกบนเว็บไซต์ก่อนนะคะ`,
                }],
              })
            } else {
              // เชื่อมโยง LINE User ID เข้ากับผู้ใช้ที่มีอยู่
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { lineUserId },
              })

              await lineClient.replyMessage({
                replyToken,
                messages: [{
                  type: 'text',
                  text: `เชื่อมต่อบัญชีกับอีเมล ${email} สำเร็จแล้วค่ะ! 🎉\nตอนนี้คุณสามารถส่งข้อความแจ้งเตือนจากธนาคารเพื่อบันทึกรายการได้ทันทีค่ะ 💸`,
                }],
              })
            }
          } catch (linkError) {
            console.error('Error linking email:', linkError)
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: 'text',
                text: 'เกิดข้อผิดพลาดระหว่างเชื่อมโยงบัญชี กรุณาลองใหม่อีกครั้งค่ะ 🥺',
              }],
            })
          }
          continue
        }

        // ทดลองแกะข้อมูลแจ้งเตือนธนาคาร
        const parsed = parseBankMessage(textMessage)

        if (parsed) {
          const { amount, type, note, category } = parsed

          try {
            // ค้นหาผู้ใช้ตาม lineUserId
            const user = await prisma.user.findUnique({
              where: { lineUserId },
            })

            if (!user) {
              await lineClient.replyMessage({
                replyToken,
                messages: [{
                  type: 'text',
                  text: 'บัญชี LINE ของคุณยังไม่ได้เชื่อมโยงกับระบบค่ะ 🥺\n\n👉 กรุณาส่งอีเมลที่ใช้สมัครสมาชิกเพื่อเชื่อมต่อบัญชีของคุณก่อนนะคะ (เช่น user@example.com)',
                }],
              })
              continue
            }

            // บันทึกธุรกรรมลงใน Supabase Database ผ่าน Prisma
            await prisma.transaction.create({
              data: {
                amount,
                type: type.toLowerCase(), // บันทึกเป็น lowercase เพื่อความเข้ากันได้กับ Dashboard
                category,
                note,
                userId: user.id,
                date: new Date(), // ฟิลด์วันที่ของธุรกรรม
              },
            })

            // ส่งข้อความแจ้งผลความสำเร็จกลับหาผู้ใช้
            const displayType = type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'
            const replyText = `บันทึก${displayType}จำนวน ${formatAmount(amount)} บาท เรียบร้อยแล้วค่ะ! 💖\n\n📌 รายละเอียด: ${note}\n🏷️ หมวดหมู่: ${category}`

            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: 'text',
                text: replyText,
              }],
            })
          } catch (dbError) {
            console.error('Database/Reply Error during transaction logging:', dbError)
            
            // ตอบกลับในกรณีเชื่อมฐานข้อมูลขัดข้อง
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: 'text',
                text: 'เกิดข้อผิดพลาดในการบันทึกลงฐานข้อมูล กรุณาลองใหม่อีกครั้งภายหลังค่ะ 🥺',
              }],
            })
          }
        } else {
          // หากส่งข้อความปกติที่ไม่เข้าข่ายสลิปโอนเงินและการเชื่อมต่ออีเมล
          try {
            const user = await prisma.user.findUnique({
              where: { lineUserId },
            })

            if (user) {
              await lineClient.replyMessage({
                replyToken,
                messages: [{
                  type: 'text',
                  text: `ยินดีต้อนรับกลับมาค่ะ! 💖\nคุณเชื่อมต่อบัญชีกับอีเมล ${user.email} เรียบร้อยแล้ว\n\nส่งข้อความแจ้งยอดโอนเงิน หรือรูปภาพสลิปธนาคารเข้ามาเพื่อเก็บบันทึกรายรับ-รายจ่ายได้เลยนะคะ 🐷`,
                }],
              })
            } else {
              await lineClient.replyMessage({
                replyToken,
                messages: [{
                  type: 'text',
                  text: 'ยินดีต้อนรับค่ะ! บัญชี LINE ของคุณยังไม่ได้เชื่อมโยงกับระบบ 🥺\n\n👉 กรุณาส่งอีเมลที่ใช้สมัครสมาชิกเพื่อเชื่อมต่อบัญชีค่ะ (เช่น user@example.com)',
                }],
              })
            }
          } catch (checkError) {
            console.error('Error checking user link status:', checkError)
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: 'text',
                text: 'ยินดีต้อนรับค่ะ! ส่งข้อความแจ้งยอดโอนเงิน หรือรูปภาพสลิปธนาคารเข้ามาเพื่อเก็บบันทึกรายรับ-รายจ่ายได้เลยนะคะ 🐷',
              }],
            })
          }
        }
      }

      // ดักจับข้อความประเภท รูปภาพ (Image Message / สลิปโอนเงิน)
      else if (event.message.type === 'image') {
        try {
          // ตรวจสอบก่อนว่าเชื่อมบัญชีหรือยัง
          const user = await prisma.user.findUnique({
            where: { lineUserId },
          })

          if (!user) {
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: 'text',
                text: 'บัญชี LINE ของคุณยังไม่ได้เชื่อมโยงกับระบบค่ะ 🥺\n\n👉 กรุณาส่งอีเมลที่ใช้สมัครสมาชิกเพื่อเชื่อมต่อบัญชีของคุณก่อนนะคะ (เช่น user@example.com)',
              }],
            })
            continue
          }

          const messageId = event.message.id
          
          // ดาวน์โหลดข้อมูลรูปภาพดิบเป็น Buffer
          const imageBuffer = await downloadLineContent(messageId)
          console.log(`Downloaded image size: ${imageBuffer.length} bytes for message: ${messageId}`)

          /**
           * [IMAGE PROCESSING INTEGRATION NOTE]
           * ในขั้นตอนนี้สามารถส่ง Buffer ของรูปภาพไปยัง API ภายนอกเพื่อตรวจสลิปได้ เช่น:
           * const slipOkResult = await verifySlipWithSlipOk(imageBuffer);
           * หรือทำการอ่านตัวเลขผ่านระบบ OCR แล้วเรียกใช้ prisma.transaction.create ทำนองเดียวกัน
           */

          await lineClient.replyMessage({
            replyToken,
            messages: [{
              type: 'text',
              text: 'ได้รับรูปภาพสลิปแล้วค่ะ! ระบบกำลังส่งไปตรวจสอบและจะทำการลงบัญชีให้โดยเร็วที่สุดค่ะ 📸✨ (โครงสร้างระบบสแกนสลิปพร้อมใช้งาน)',
            }],
          })
        } catch (imgError) {
          console.error('Error handling image message content:', imgError)
          await lineClient.replyMessage({
            replyToken,
            messages: [{
              type: 'text',
              text: 'ไม่สามารถประมวลผลรูปภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ',
            }],
          })
        }
      }
    }

    // ส่งคืน 200 OK ให้ LINE Server เสมอเพื่อยืนยันว่าการรับ Webhook สำเร็จ
    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (globalError) {
    console.error('Global Webhook Error:', globalError)
    // คืน 200 เพื่อป้องกัน LINE ยิงซ้ำกรณีเซิร์ฟเวอร์หลักเกิดอาการแครชชั่วคราว
    return NextResponse.json({ message: 'Server Internal Handling' }, { status: 200 })
  }
}

/**
 * ฟังก์ชันจัดรูปแบบตัวเลขจำนวนเงิน
 */
function formatAmount(num: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
