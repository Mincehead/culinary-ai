// Google Cloud Text-to-Speech Service
// Free tier: 1 million characters per month

const GOOGLE_TTS_API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY;
const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export interface GoogleVoice {
    name: string;
    displayName: string;
    ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
    languageCode: string;
}

// Recommended high-quality voices
export const RECOMMENDED_VOICES: GoogleVoice[] = [
    { name: 'en-US-Neural2-D', displayName: 'Deep Male (US)', ssmlGender: 'MALE', languageCode: 'en-US' },
    { name: 'en-US-Neural2-A', displayName: 'Rich Male (US)', ssmlGender: 'MALE', languageCode: 'en-US' },
    { name: 'en-GB-Neural2-B', displayName: 'British Male', ssmlGender: 'MALE', languageCode: 'en-GB' },
    { name: 'en-AU-Neural2-B', displayName: 'Australian Male', ssmlGender: 'MALE', languageCode: 'en-AU' },
];

export async function synthesizeSpeech(
    text: string,
    voiceName: string = 'en-US-Neural2-D'
): Promise<Blob> {
    console.log('🔑 Google TTS API Key present:', !!GOOGLE_TTS_API_KEY);

    if (!GOOGLE_TTS_API_KEY) {
        throw new Error('Google TTS API key not configured. Add VITE_GOOGLE_TTS_API_KEY to environment.');
    }

    const voice = RECOMMENDED_VOICES.find(v => v.name === voiceName) || RECOMMENDED_VOICES[0];

    const response = await fetch(`${GOOGLE_TTS_URL}?key=${GOOGLE_TTS_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: { text },
            voice: {
                languageCode: voice.languageCode,
                name: voice.name,
                ssmlGender: voice.ssmlGender
            },
            audioConfig: {
                audioEncoding: 'MP3',
                pitch: -2.0,
                speakingRate: 0.95,
            }
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`Google TTS error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: 'audio/mpeg' });
}
