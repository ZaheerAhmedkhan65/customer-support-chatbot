const pool = require('../config/database');

async function updateChatbotFields() {
    try {
        console.log('Adding new chatbot fields...');

        await pool.execute(`
            ALTER TABLE chatbots
            ADD COLUMN custom_emojis JSON DEFAULT NULL
        `);

        await pool.execute(`
            ALTER TABLE chatbots
            ADD COLUMN show_emoji_toggle BOOLEAN DEFAULT TRUE
        `);

        await pool.execute(`
            ALTER TABLE chatbots
            ADD COLUMN custom_quick_replies JSON DEFAULT NULL
        `);

        await pool.execute(`
            ALTER TABLE chatbots
            ADD COLUMN show_quick_replies BOOLEAN DEFAULT TRUE
        `);

        await pool.execute(`
            ALTER TABLE chatbots
            ADD COLUMN default_chatbot_open BOOLEAN DEFAULT FALSE
        `);

        console.log('✓ New chatbot fields added successfully');
        process.exit(0);
    } catch (error) {
        // Ignore duplicate column errors
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('✓ Columns already exist, skipping');
            process.exit(0);
        }
        console.error('Error updating chatbot fields:', error);
        process.exit(1);
    }
}

updateChatbotFields();