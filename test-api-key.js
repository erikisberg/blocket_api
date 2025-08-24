// Test script to verify Anthropic API key configuration
// Run with: node test-api-key.js

const Anthropic = require('@anthropic-ai/sdk')

async function testAPIKey() {
  console.log('🔑 Testing Anthropic API key configuration...\n')
  
  // Check environment variables
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  
  if (!apiKey) {
    console.log('❌ No API key found in environment variables')
    console.log('   Please set ANTHROPIC_API_KEY or NEXT_PUBLIC_ANTHROPIC_API_KEY')
    console.log('   Example: export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here')
    return
  }
  
  if (apiKey === 'your_api_key_here' || apiKey === 'sk-ant-api03-din-nyckel-här') {
    console.log('❌ Placeholder API key detected')
    console.log('   Please replace with your actual API key')
    return
  }
  
  console.log('✅ API key found:', apiKey.substring(0, 20) + '...')
  console.log('   Length:', apiKey.length, 'characters')
  console.log('   Format:', apiKey.startsWith('sk-ant-api03-') ? 'Valid' : 'Invalid format')
  
  // Test the API key
  try {
    const anthropic = new Anthropic({
      apiKey: apiKey
    })
    
    console.log('\n🧪 Testing API connection...')
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from test script" in Swedish'
        }
      ]
    })
    
    console.log('✅ API connection successful!')
    console.log('   Response:', response.content[0].text)
    console.log('   Model used:', response.model)
    
  } catch (error) {
    console.log('❌ API connection failed:')
    console.log('   Error:', error.message)
    
    if (error.status === 401) {
      console.log('   This usually means the API key is invalid or expired')
      console.log('   Please check your API key at: https://console.anthropic.com/')
    }
  }
}

// Run the test
testAPIKey().catch(console.error)
