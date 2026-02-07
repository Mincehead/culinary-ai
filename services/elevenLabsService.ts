import { supabase } from './supabaseClient';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Deep male voice ID - "Antoni" (professional, warm male voice)
// You can find more voices at: https://elevenlabs.io/voice-library
const VOICE_ID = 'ErXwobaYiN019PkySvjV'; // Antoni

export interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
}

/**
 * Generate speech using ElevenLabs TTS API
 * Returns an audio blob that can be played
 */
export async function generateSpeech(
    text: string,
    voiceSettings?: VoiceSettings
): Promise<Blob> {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured. Add VITE_ELEVENLABS_API_KEY to environment variables.');
    }

    const settings: VoiceSettings = voiceSettings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
    };

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_turbo_v2_5', // Fastest, lowest latency
            voice_settings: settings
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`ElevenLabs API error: ${error.message || response.statusText}`);
    }

    return await response.blob();
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices() {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured.');
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch voices');
    }

    return await response.json();
}

/**
 * Check remaining character quota
 */
export async function getCharacterQuota() {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured.');
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
        character_count: data.subscription.character_count,
        character_limit: data.subscription.character_limit,
        remaining: data.subscription.character_limit - data.subscription.character_count
    };
}
