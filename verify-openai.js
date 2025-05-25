import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: './server/.env' });

async function testOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No OpenAI API key found in environment variables');
    return false;
  }

  console.log('🔑 Found OpenAI API key');
  console.log(`Key starts with: ${apiKey.substring(0, 8)}...`);
  
  try {
    console.log('🔌 Testing connection to OpenAI API...');
    
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Test the API with a simple completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Hello, is this API key working?'
        }
      ],
      max_tokens: 10
    });

    console.log('✅ Successfully connected to OpenAI API!');
    console.log('Response received:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('❌ Error connecting to OpenAI API:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error code:', error.code);
    }
    
    return false;
  }
}

// Run the test
testOpenAIKey()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
