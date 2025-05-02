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
  const webhookUrl = 'https://n8n-production-c3cb.up.railway.app/webhook/96837ad7-6e79-494f-a917-7e445b7b8b0f';
  
  try {
    console.log('Sending message to NANA webhook:', message);
    
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
    
    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('Raw response from webhook:', responseText);
    
    // Parse the response, handling various response formats
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse webhook response as JSON:', e);
      // If the response is a plain text, use it directly
      return {
        text: responseText || "Désolé, la réponse n'a pas pu être traitée correctement."
      };
    }
    
    // Check if response contains audio information
    if (data.mimeType && data.mimeType.includes('audio')) {
      console.log('Audio response detected:', data);
      
      // La structure de n8n ne nous permet pas d'accéder directement au fichier audio
      console.log('Pas d\'accès direct au fichier audio, récupération du texte transcrit');
      
      // Essayons de récupérer le texte qui devrait être dans la réponse (envoyé par n8n)
      // Faisons une nouvelle requête pour récupérer la réponse texte de l'agent
      try {
        const textResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: "Pouvez-vous répéter votre dernière réponse sous forme de texte uniquement?" })
        });
        
        if (textResponse.ok) {
          const textData = await textResponse.text();
          let parsedTextData;
          
          try {
            parsedTextData = JSON.parse(textData);
          } catch (e) {
            parsedTextData = { text: textData };
          }
          
          const fallbackText = 
            parsedTextData.message || 
            parsedTextData.text || 
            parsedTextData.response || 
            parsedTextData.content ||
            (typeof parsedTextData === 'string' ? parsedTextData : null) ||
            "Je suis désolé, je ne peux pas accéder directement au fichier audio, mais je reste à votre écoute.";
          
          console.log('Texte de fallback récupéré:', fallbackText);
          
          return {
            text: fallbackText,
            mimeType: data.mimeType,
            fileType: data.fileType,
            fileExtension: data.fileExtension,
            fileName: data.fileName,
            fileSize: data.fileSize
          };
        }
      } catch (fallbackError) {
        console.error('Erreur lors de la récupération du texte de secours:', fallbackError);
      }
      
      // Si la requête échoue, on renvoie un message générique
      return {
        text: "Je suis désolé, je ne peux pas accéder directement au fichier audio, mais je reste à votre écoute.",
        mimeType: data.mimeType,
        fileType: data.fileType,
        fileExtension: data.fileExtension,
        fileName: data.fileName,
        fileSize: data.fileSize
      };
    }
    
    // Handle text-only response formats
    const text = 
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
      // Check for { data: { message: "..." } } format
      (data.data?.message || data.data?.text || data.data?.response || data.data?.content) ||
      // Default message if nothing found
      "Je suis désolée, j'ai eu du mal à comprendre. Pourriez-vous reformuler?";
    
    console.log('Extracted response message:', text);
    return { text };
  } catch (error) {
    console.error('Error sending message to NANA:', error);
    return {
      text: "Je suis désolée, je rencontre des difficultés techniques. Merci de réessayer dans un instant."
    };
  }
}
