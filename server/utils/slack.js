import fetch from 'node-fetch';

// Create a configuration object that will be populated when the module is initialized
let config = {
  SLACK_WEBHOOK_URL: null,
  SLACK_BOT_TOKEN: null,
  SLACK_CHANNEL: 'C08TH6GEM2T'  // Default channel ID (#all-fuzaildev)
};

/**
 * Initialize the Slack module with configuration
 * @param {Object} options - Configuration options
 * @param {string} [options.webhookUrl] - Slack webhook URL
 * @param {string} [options.botToken] - Slack bot token
 * @param {string} [options.channel] - Default channel to send messages to
 */
export const initSlack = (options = {}) => {
  config.SLACK_WEBHOOK_URL = options.webhookUrl || process.env.SLACK_WEBHOOK_URL;
  config.SLACK_BOT_TOKEN = options.botToken || process.env.SLACK_BOT_TOKEN;
  config.SLACK_CHANNEL = options.channel || process.env.SLACK_CHANNEL || config.SLACK_CHANNEL;
  
  // Log configuration for debugging
  console.log('Slack Config:');
  console.log('SLACK_WEBHOOK_URL:', config.SLACK_WEBHOOK_URL ? '*** (exists)' : 'Not found');
  console.log('SLACK_BOT_TOKEN:', config.SLACK_BOT_TOKEN ? '*** (exists)' : 'Not found');
  console.log('SLACK_CHANNEL:', config.SLACK_CHANNEL);
  
  return config;
};

// Helper function to get config
const getConfig = () => {
  // If config hasn't been initialized, try to initialize with environment variables
  if (!config.SLACK_WEBHOOK_URL && !config.SLACK_BOT_TOKEN) {
    console.warn('Slack module not initialized. Initializing with environment variables...');
    initSlack();
  }
  return config;
};

/**
 * Ensure the bot is in the specified channel
 */
async function ensureBotInChannel(channelName) {
  const { SLACK_BOT_TOKEN, SLACK_CHANNEL } = getConfig();
  const targetChannel = channelName || SLACK_CHANNEL;
  
  if (!SLACK_BOT_TOKEN) return { success: false, error: 'No bot token configured' };
  
  try {
    // First, get the channel ID from the channel name
    const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    const channelsData = await channelsResponse.json();
    if (!channelsData.ok) {
      console.error('Error fetching channels:', channelsData.error);
      return { success: false, error: channelsData.error };
    }
    
    // Find the channel
    const channel = channelsData.channels.find(c => c.name === channelName.replace('#', ''));
    if (!channel) {
      return { success: false, error: `Channel ${channelName} not found` };
    }
    
    // Check if bot is already in the channel
    const membersResponse = await fetch(`https://slack.com/api/conversations.members?channel=${channel.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    const membersData = await membersResponse.json();
    if (!membersData.ok && membersData.error !== 'not_in_channel') {
      console.error('Error checking channel members:', membersData.error);
      return { success: false, error: membersData.error };
    }
    
    // If bot is not in channel, join it
    if (membersData.error === 'not_in_channel' || !membersData.members) {
      const joinResponse = await fetch('https://slack.com/api/conversations.join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          channel: channel.id
        })
      });
      
      const joinData = await joinResponse.json();
      if (!joinData.ok) {
        console.error('Error joining channel:', joinData.error);
        return { success: false, error: joinData.error };
      }
    }
    
    return { success: true, channelId: channel.id };
  } catch (error) {
    console.error('Error in ensureBotInChannel:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a message to Slack using Webhook (preferred) or Bot Token
 * @param {string} message - The message text to send
 * @param {string} [channel=null] - The channel to send to (defaults to DM with bot)
 * @param {Array} [blocks=null] - Rich message blocks for formatting
 * @returns {Promise<{success: boolean, error?: string}>} Result of the operation
 */
const sendToSlack = async (message, channel = null, blocks = null) => {
  const { SLACK_WEBHOOK_URL, SLACK_BOT_TOKEN, SLACK_CHANNEL: defaultChannel } = getConfig();
  const targetChannel = channel || defaultChannel;
  
  // Check if either Webhook URL or Bot Token is configured
  if (!SLACK_WEBHOOK_URL && !SLACK_BOT_TOKEN) {
    const errorMsg = '⚠️ Neither SLACK_WEBHOOK_URL nor SLACK_BOT_TOKEN is configured';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  // Try Webhook first if available
  if (SLACK_WEBHOOK_URL) {
    console.log('Attempting to send message via Webhook');
    try {
      let payload = { text: message };
      if (blocks) {
        try {
          // If blocks is a string, parse it
          payload = typeof blocks === 'string' ? JSON.parse(blocks) : { ...payload, blocks };
        } catch (e) {
          console.error('Error parsing blocks:', e);
        }
      }

      const response = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Slack Webhook error: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook failed, falling back to Bot Token:', error);
      // Continue to Bot Token fallback
    }
  }

  // Fallback to Bot Token if Webhook fails or not available
  if (SLACK_BOT_TOKEN) {
    try {
      // Use the specified channel or default to DM channel
      const targetChannelId = targetChannel || 'D08TUBJ8J13';
      
      // If it's a public channel (starts with #), ensure bot is in it
      if (targetChannelId.startsWith('#')) {
        const channelResult = await ensureBotInChannel(targetChannelId);
        if (!channelResult.success) {
          console.warn(`Warning: Could not ensure bot is in channel ${targetChannelId}:`, channelResult.error);
        }
      }
      
      const payload = {
        channel: targetChannelId,
        text: message,
        ...(blocks && { blocks }),
        link_names: true  // This will convert @username mentions
      };

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      return { success: true };
    } catch (error) {
      console.error('Bot Token also failed:', error);
      return { 
        success: false, 
        error: `Failed to send message: ${error.message}` 
      };
    }
  }

  console.warn('⚠️ Neither SLACK_WEBHOOK_URL nor SLACK_BOT_TOKEN is configured');
  return { 
    success: false, 
    error: 'Slack not configured. Please set up either Webhook URL or Bot Token.' 
  };
};

/**
 * Format todo list into a nice Slack message
 */
const formatTodoSummary = (todos) => {
  if (!todos || todos.length === 0) {
    return {
      text: "📋 *Todo Summary*\n_No todos found. Time to relax! 🎉_"
    };
  }

  const completed = todos.filter(todo => todo.completed);
  const pending = todos.filter(todo => !todo.completed);
  const now = new Date().toLocaleString();

  // Create blocks for rich formatting
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📋 *Todo Summary*\n_Generated on ${now}_`
      }
    },
    {
      type: 'divider'
    }
  ];

  // Add pending tasks
  if (pending.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📌 Pending Tasks (${pending.length})*`
      }
    });

    pending.forEach(todo => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• *${todo.title}*${todo.description ? `\n  _${todo.description}_` : ''}`
        }
      });
    });
  }

  // Add completed tasks
  if (completed.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\n*✅ Completed (${completed.length})*`
      }
    });

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: completed.map(todo => `• ~${todo.title}~`).join('\n')
      }
    });
  }


  // Add a nice footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_Total: ${todos.length} • Pending: ${pending.length} • Completed: ${completed.length}_`
      }
    ]
  });

  return {
    text: `📋 Todo Summary (${pending.length} pending, ${completed.length} completed)`,
    blocks: blocks
  };
};

/**
 * Send todo summary to Slack
 */
export const sendTodoSummary = async (todos) => {
  const { text, blocks } = formatTodoSummary(todos);
  const { SLACK_WEBHOOK_URL, SLACK_CHANNEL } = getConfig();
  
  // For webhook
  if (SLACK_WEBHOOK_URL) {
    return sendToSlack(JSON.stringify({ 
      text, 
      blocks,
      channel: SLACK_CHANNEL  // Using channel ID for webhook
    }));
  }
  
  // For bot token - using channel ID
  return sendToSlack(text, SLACK_CHANNEL, blocks);
};

// Initialize with environment variables on import
initSlack();

// Export all functions
export { sendToSlack, formatTodoSummary };
