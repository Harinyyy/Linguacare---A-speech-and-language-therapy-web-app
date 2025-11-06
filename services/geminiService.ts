import { GoogleGenAI, Type } from '@google/genai';
import type { PronunciationFeedback, Language, DetailedPhraseAnalysis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // remove the data url prefix
            resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const feedbackSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: {
            type: Type.INTEGER,
            description: "An overall score from 1 to 100 on the user's pronunciation."
        },
        summary: {
            type: Type.STRING,
            description: "A brief, encouraging summary of the user's performance. It is crucial that this summary mentions any specific words the user mispronounced (based on the `wordAnalysis`) to guide their practice. For example: 'Good work! Let's focus on the word 'fox' next time.'"
        },
        wordAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    userPronunciationError: {
                        type: Type.STRING,
                        description: "If mispronounced, describe the specific error the user made (e.g., 'The 'sh' sound was pronounced like 's'.'). This is crucial for a good tip. Leave empty if correct."
                    },
                    tip: {
                        type: Type.STRING,
                        description: "Based on the `userPronunciationError`, provide a specific, actionable tip for improvement (e.g., 'To make the 'sh' sound, round your lips and push air out.'). Leave empty if correct."
                    },
                    pronunciationGuide: {
                        type: Type.STRING,
                        description: "A simplified phonetic guide for the correct pronunciation (e.g., 'SEE-shells'). This is not formal IPA. Leave empty if correct."
                    }
                }
            }
        }
    }
};

const detailedPhraseAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallPronunciationGuide: {
            type: Type.STRING,
            description: "A simplified phonetic guide for the entire phrase (e.g., 'SHEE SELLS SEE-shells...')."
        },
        challengingWords: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    syllables: { type: Type.STRING, description: "The word broken into syllables, e.g., 'sea-shells'." },
                    phoneticGuide: { type: Type.STRING, description: "Simplified phonetic guide for the word, e.g., 'SEE-shells'." },
                    commonMistakes: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A list of 1-2 common pronunciation mistakes for this word."
                    },
                    practiceTip: {
                        type: Type.STRING,
                        description: "A single, actionable tip for correct pronunciation (e.g., 'Touch your tongue to the roof of your mouth for the 'L' sound.')."
                    }
                }
            }
        }
    }
};

export const analyzePronunciation = async (promptText: string, audioBlob: Blob, language: Language): Promise<PronunciationFeedback> => {
    const audioData = await blobToBase64(audioBlob);

    const prompt = `You are an expert speech and language therapist AI named 'Linguacare Bot'. Your analysis must be guided by the principles of a multilingual pronunciation assistant. You must judge the user's speech based on accurate, natural phonetics for the specified language, without expecting translation.

    Your task is to analyze a user's pronunciation from an audio recording and provide constructive feedback.

    The user was asked to say the following phrase in ${language}:
    "${promptText}"
    
    The standard for correct pronunciation is the natural, native accent of that language (e.g., Tamil phonetics for Tamil text, Malayalam phonetics for Malayalam text).
    
    Analyze the provided audio. Compare the user's speech against the target phrase based on these high standards. Provide a detailed analysis in the specified JSON format. The feedback should be encouraging, clear, and helpful for someone practicing their speech.
    
    - For \`overallScore\`, provide an integer between 1 and 100.
    - For \`summary\`, give a concise, positive summary. Crucially, if there are any mispronounced words in your \`wordAnalysis\` (where \`isCorrect\` is false), you MUST mention those specific words by name in the summary. This makes the feedback personal and actionable. For example: 'Great effort! Let's focus on the words 'seashells' and 'seashore' for next time.'
    - For \`wordAnalysis\`, provide a detailed analysis for every single word in the original phrase.
    - If a word is pronounced correctly, set \`isCorrect\` to true and leave the other fields empty for that word.
    - If a word is mispronounced (\`isCorrect\` is false), you MUST complete the following fields:
      1. \`userPronunciationError\`: First, identify and describe the specific mistake the user made. Be precise. Examples: "The user said 'sip' instead of 'ship', replacing the 'sh' sound with 's'." or "The vowel sound in 'run' was too long, sounding more like 'ruun'."
      2. \`tip\`: Based *directly* on the \`userPronunciationError\`, provide one single, highly specific, and actionable tip to fix the mistake. This is the most important part of the feedback. Examples: "For the 'sh' sound, try rounding your lips and pushing air through them, like you're telling someone to be quiet." or "Keep the vowel sound in 'run' short and quick."
      3. \`pronunciationGuide\`: Provide a simplified phonetic guide for the correct pronunciation.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: audioBlob.type,
                        data: audioData,
                    },
                },
            ],
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: feedbackSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as PronunciationFeedback;
    } catch (error) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("The AI returned an invalid response format.");
    }
};

export const getDetailedPronunciationAnalysis = async (phrase: string, language: Language): Promise<DetailedPhraseAnalysis> => {
    const prompt = `You are an expert multilingual pronunciation assistant. Your job is to provide text-based guides for accurately pronouncing words and sentences in the language they are written in, without translating them.
- For Tamil text, provide guides based on natural Tamil phonetics.
- For Malayalam text, provide guides based on natural Malayalam phonetics.
- For English text, provide guides based on standard English pronunciation.
Do not translate or alter the script. Just create pronunciation guides for the text as written, in the native accent of that language.

Your task is to provide a detailed pronunciation guide for a given phrase for a user learning ${language}.

The phrase is: "${phrase}"

Please analyze this phrase and identify 1 to 3 words that might be challenging for a learner. Provide a detailed breakdown for these words.
    
Your entire response must be in the specified JSON format.
- \`overallPronunciationGuide\`: Create a simple, phonetic guide for the whole phrase.
- \`challengingWords\`: For each challenging word you identify, provide its syllables, a phonetic guide, common mistakes, and one key practice tip.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: detailedPhraseAnalysisSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as DetailedPhraseAnalysis;
    } catch (error) {
        console.error("Failed to parse Gemini response for detailed analysis:", response.text);
        throw new Error("The AI returned an invalid response format for the pronunciation guide.");
    }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const audioData = await blobToBase64(audioBlob);

    const prompt = "Transcribe the following audio recording. Provide only the transcribed text and nothing else.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: audioBlob.type || 'audio/webm',
                            data: audioData,
                        },
                    },
                ],
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error during audio transcription:", error);
        throw new Error("Failed to transcribe audio.");
    }
};