interface NanaResponse {
  text?: string;
  audioUrl?: string;
  mimeType?: string;
  fileType?: string;
  fileExtension?: string;
  fileName?: string;
  fileSize?: string;
  data?: any;
}

/**
 * Send a message to the NANA AI agent via webhook
 * @param message The user's message to send to NANA
 * @returns A promise that resolves to the NANA response
 */
export async function sendMessageToNana(message: string): Promise<NanaResponse> {
  // L'URL pointe maintenant vers notre propre backend, qui agit comme un proxy
  const apiUrl = '/api/chat';
  
  try {
    console.log('🚀 [DEBUG] Sending message to backend API:', message);
    console.log('🚀 [DEBUG] API URL:', apiUrl);
    console.log('🚀 [DEBUG] Current location:', window.location.href);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    console.log('🚀 [DEBUG] Response status:', response.status);
    console.log('🚀 [DEBUG] Response ok:', response.ok);
    console.log('🚀 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🚀 [DEBUG] Error response body:', errorText);
      throw new Error(`Server responded with status: ${response.status}, body: ${errorText}`);
    }
    
    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('Raw response from backend API:', responseText);
    
    // Parse the response, handling various response formats
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response as JSON:', e);
      // If the response is a plain text, use it directly
      return {
        text: responseText || "Désolé, la réponse n'a pas pu être traitée correctement."
      };
    }
    
    // Check if response contains audio information
    if (data.mimeType && data.mimeType.includes('audio')) {
      console.log('Audio response detected:', data);
      
      // Cette logique complexe de fallback n'est plus nécessaire car le backend gère la communication
      // et devrait nous renvoyer un format de données cohérent.
      // Nous nous attendons à ce que la réponse contienne le texte de l'agent.
      const agentText = data.data?.output || data.message || data.text || "Audio response received, but no text.";
      
      return {
        text: agentText,
        mimeType: data.mimeType,
        fileType: data.fileType,
        fileExtension: data.fileExtension,
        fileName: data.fileName,
        fileSize: data.fileSize
      };
    }
    
    // Handle text-only response formats
    const text = 
      // Check for n8n webhook format with data.output (comme visible dans l'exemple)
      data.data?.output ||
      // Check standard format { message: "..." }
      data.message || 
      // Check for { text: "..." } format
      data.text || 
      // Check for { response: "..." } format
      data.response || 
      // Check for { content: "..." } format
      data.content ||
      // Check for direct string in root
      (typeof data === 'string' ? data : null) ||
      // Check for other nested formats
      (data.data?.message || data.data?.text || data.data?.response || data.data?.content) ||
      // Default message if nothing found
      "Je suis désolée, j'ai eu du mal à comprendre. Pourriez-vous reformuler?";
    
    console.log('Extracted response message:', text);
    return { text };
  } catch (error) {
    console.error('🚀 [DEBUG] Error sending message to NANA:', error);
    console.error('🚀 [DEBUG] Error type:', typeof error);
    console.error('🚀 [DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.error('🚀 [DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      text: "Je suis désolée, je rencontre des difficultés techniques. Merci de réessayer dans un instant."
    };
  }
}
