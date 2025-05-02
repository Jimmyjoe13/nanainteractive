/**
 * Send a message to the NANA AI agent via webhook
 * @param message The user's message to send to NANA
 * @returns A promise that resolves to NANA's response text
 */
export async function sendMessageToNana(message: string): Promise<string> {
  const webhookUrl = 'https://n8n-production-c3cb.up.railway.app/webhook/96837ad7-6e79-494f-a917-7e445b7b8b0f';
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.message || "Je suis désolée, j'ai eu du mal à comprendre. Pourriez-vous reformuler?";
  } catch (error) {
    console.error('Error sending message to NANA:', error);
    return "Je suis désolée, je rencontre des difficultés techniques. Merci de réessayer dans un instant.";
  }
}
