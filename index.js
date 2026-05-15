require('dotenv').config()

const { Telegraf, Markup, session } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

const ADMIN_ID = process.env.ADMIN_ID

bot.use(session())

// ГЛАВНОЕ МЕНЮ
function mainMenu() {
    return Markup.keyboard([
        ['🔧 Ремонт ПК'],
        ['💻 Удаленная помощь'],
        ['🖨 Настройка принтера'],
        ['🆓 Бесплатная консультация'],
        ['💰 Цены', '📞 Контакты']
    ]).resize()
}

// СТАРТ
bot.start((ctx) => {

    ctx.session = {}

    ctx.reply(
`👋 Здравствуйте!

Я бот компьютерного мастера.

Выберите услугу ниже:`,
        mainMenu()
    )
})

// РЕМОНТ ПК
bot.hears('🔧 Ремонт ПК', (ctx) => {

    ctx.session.service = 'Ремонт ПК'
    ctx.session.step = 'problem'

    ctx.reply('📝 Опишите проблему:')
})

// УДАЛЕННАЯ ПОМОЩЬ
bot.hears('💻 Удаленная помощь', (ctx) => {

    ctx.session.service = 'Удаленная помощь'
    ctx.session.step = 'problem'

    ctx.reply('💻 Опишите проблему:')
})

// ПРИНТЕРЫ
bot.hears('🖨 Настройка принтера', (ctx) => {

    ctx.session.service = 'Настройка принтера'
    ctx.session.step = 'problem'

    ctx.reply('🖨 Опишите проблему:')
})

// БЕСПЛАТНАЯ КОНСУЛЬТАЦИЯ
bot.hears('🆓 Бесплатная консультация', (ctx) => {

    ctx.session.step = 'consultation'

    ctx.reply(
`🆓 Опишите ваш вопрос.

Например:
• Компьютер тормозит
• Не печатает принтер
• Синий экран
• Не включается ноутбук

Мастер ответит вам в ближайшее время.`
    )
})

// ЦЕНЫ
bot.hears('💰 Цены', (ctx) => {

    ctx.reply(
`💰 Примерные цены:

🔹 Установка Windows — от 7000 тг
🔹 Настройка принтера — от 4000 тг
🔹 Удаленная помощь — от 3000 тг
🔹 Чистка ноутбука — от 10000 тг

Точная стоимость зависит от сложности работы.`
    )
})

// КОНТАКТЫ
bot.hears('📞 Контакты', (ctx) => {

    ctx.reply(
`📞 Телефон: +7 776 508 16 64

💻 Удаленная помощь через AnyDesk
📍 Выезд по городу`
    )
})

// ОБРАБОТКА ТЕКСТА
bot.on('text', async (ctx) => {

    if (!ctx.session.step) return

    // КОНСУЛЬТАЦИЯ
    if (ctx.session.step === 'consultation') {

        await bot.telegram.sendMessage(
            ADMIN_ID,
`🆓 НОВАЯ КОНСУЛЬТАЦИЯ

👤 Клиент:
@${ctx.from.username || 'нет username'}

🆔 ID:
${ctx.from.id}

💬 Вопрос:
${ctx.message.text}`
        )

        ctx.session = {}

        return ctx.reply(
`✅ Ваш вопрос отправлен мастеру.

Ожидайте ответа.`,
            mainMenu()
        )
    }

    // ПРОБЛЕМА
    if (ctx.session.step === 'problem') {

        ctx.session.problem = ctx.message.text
        ctx.session.step = 'phone'

        return ctx.reply(
            '📱 Отправьте номер телефона:',
            Markup.keyboard([
                [Markup.button.contactRequest('📲 Отправить номер')]
            ]).resize()
        )
    }

    // ЕСЛИ НОМЕР ВВЕЛИ ТЕКСТОМ
    if (ctx.session.step === 'phone') {

        ctx.session.phone = ctx.message.text

        await bot.telegram.sendMessage(
            ADMIN_ID,
`🚨 НОВАЯ ЗАЯВКА

🔧 Услуга:
${ctx.session.service}

📝 Проблема:
${ctx.session.problem}

📞 Телефон:
${ctx.session.phone}

👤 Клиент:
@${ctx.from.username || 'нет username'}

🆔 ID:
${ctx.from.id}`
        )

        ctx.session = {}

        return ctx.reply(
`✅ Заявка отправлена!

Мастер скоро свяжется с вами.`,
            mainMenu()
        )
    }
})

// КОНТАКТ
bot.on('contact', async (ctx) => {

    ctx.session.phone = ctx.message.contact.phone_number

    await bot.telegram.sendMessage(
        ADMIN_ID,
`🚨 НОВАЯ ЗАЯВКА

🔧 Услуга:
${ctx.session.service}

📝 Проблема:
${ctx.session.problem}

📞 Телефон:
${ctx.session.phone}

👤 Клиент:
@${ctx.from.username || 'нет username'}

🆔 ID:
${ctx.from.id}`
    )

    ctx.session = {}

    ctx.reply(
        '✅ Заявка отправлена!',
        mainMenu()
    )
})

// ФОТО
bot.on('photo', async (ctx) => {

    await bot.telegram.sendPhoto(
        ADMIN_ID,
        ctx.message.photo[ctx.message.photo.length - 1].file_id,
        {
            caption:
`📷 Фото от клиента

👤 @${ctx.from.username || 'нет username'}

🆔 ID:
${ctx.from.id}`
        }
    )

    ctx.reply('✅ Фото отправлено мастеру', mainMenu())
})

// ЗАПУСК
bot.launch()

console.log('Бот запущен 🚀')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
