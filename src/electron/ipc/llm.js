const { ipcMain } = require('electron');

function registerLlmHandlers() {
  ipcMain.handle('llm:chat', async (_event, config, messages) => {
    const { type, baseUrl, apiKey, model, name, id } = config;

    const estimateTokens = (text) => Math.ceil(text.length / 4);

    try {
      if (type === 'ollama') {
        const response = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, stream: false }),
          signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const content = data.message?.content || '';
        return {
          content,
          provider: name,
          providerId: id,
          model,
          tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0) || estimateTokens(content + messages.map(m => m.content).join('')),
        };
      }

      if (type === 'anthropic') {
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');
        const response = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            ...(systemMsg ? { system: systemMsg.content } : {}),
            messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        return {
          content: text,
          provider: name,
          providerId: id,
          model,
          tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) || estimateTokens(text + messages.map(m => m.content).join('')),
        };
      }

      // OpenAI / OpenAI-compatible (default)
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ model, messages }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return {
        content,
        provider: name,
        providerId: id,
        model,
        tokensUsed: data.usage?.total_tokens || estimateTokens(content + messages.map(m => m.content).join('')),
      };
    } catch (err) {
      throw new Error(err.message || String(err));
    }
  });
}

module.exports = { registerLlmHandlers };
