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
    console.log('🚀 [CLIENT] Envoi du message vers l\'API backend:', message);
    console.log('🚀 [CLIENT] URL de l\'API:', apiUrl);
    console.log('🚀 [CLIENT] Localisation actuelle:', window.location.href);
    
    const requestBody = { message };
    console.log('🚀 [CLIENT] Corps de la requête:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🚀 [CLIENT] Statut de réponse:', response.status);
    console.log('🚀 [CLIENT] Réponse OK:', response.ok);
    console.log('🚀 [CLIENT] Headers de réponse:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🚀 [CLIENT] Corps de réponse d\'erreur:', errorText);
      throw new Error(`Server responded with status: ${response.status}, body: ${errorText}`);
    }
    
    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('🚀 [CLIENT] Réponse brute de l\'API backend:', responseText);
    
    // Parse the response, handling various response formats
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('🚀 [CLIENT] Données parsées:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('🚀 [CLIENT] Erreur de parsing JSON:', e);
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
    
    // Handle text-only response formats - priorité au nouveau format standardisé
    const text = 
      // Nouveau format standardisé du serveur { text: "...", originalResponse: {...} }
      data.text ||
      // Check for n8n webhook format with data.output (comme visible dans l'exemple)
      data.data?.output ||
      // Check standard format { message: "..." }
      data.message || 
      // Check for { response: "..." } format
      data.response || 
      // Check for { content: "..." } format
      data.content ||
      // Check for direct string in root
      (typeof data === 'string' ? data : null) ||
      // Check for other nested formats
      (data.data?.message || data.data?.text || data.data?.response || data.data?.content) ||
      // Vérifier dans originalResponse si disponible
      (data.originalResponse?.data?.output || data.originalResponse?.output || data.originalResponse?.message) ||
      // Default message if nothing found
      "Je suis désolée, j'ai eu du mal à comprendre. Pourriez-vous reformuler?";
    
    console.log('🚀 [CLIENT] Message extrait de la réponse:', text);
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
