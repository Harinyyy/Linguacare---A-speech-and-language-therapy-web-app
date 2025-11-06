import { GoogleGenAI, Chat } from '@google/genai';
import type { UserRole, Language } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (userRole: UserRole, language: Language) => {
    const userPages = ['dashboard', 'exercises', 'schedule', 'settings'];
    const adminPages = ['admin_panel', 'settings'];
    const availablePages = userRole === 'admin' ? adminPages : userPages;
    
    const baseInstructions = {
        english: `You are a friendly and helpful navigation assistant for the 'Linguacare' web app.
Your only purpose is to help users find and navigate to different pages.
Do not answer any questions that are not related to navigation within the Linguacare app. If the user asks an off-topic question, politely decline and steer the conversation back to navigation.

First, provide a short, conversational response. If a navigation action is required, you MUST append a special command at the very end of your response in the format [action:navigate,page:PAGE_NAME]. Do not add this command if no navigation is needed.

The available pages for this user are: ${availablePages.join(', ')}.

Example 1:
User: "Take me to the exercises"
Your response:
Sure, heading to the exercises page now![action:navigate,page:exercises]

Example 2:
User: "What's the weather like?"
Your response:
I can only help you navigate the Linguacare app. Is there a page I can take you to?

Example 3:
User: "Hi there!"
Your response:
Hello! How can I help you? You can ask me to go to any of your available pages.
`,
        tamil: `நீங்கள் 'லிங்குவாக்கர்' செயலிக்கான ஒரு நட்புரீதியான மற்றும் உதவிகரமான வழிசெலுத்தல் உதவியாளர்.
பயனர்கள் வெவ்வேறு பக்கங்களைக் கண்டுபிடித்து செல்ல உதவுவதே உங்கள் ஒரே நோக்கம்.
லிங்குவாக்கர் செயலியின் வழிசெலுத்தல் தொடர்பில்லாத எந்த கேள்விகளுக்கும் பதிலளிக்க வேண்டாம். பயனர் தலைப்புக்கு அப்பாற்பட்ட கேள்வியைக் கேட்டால், höflich மறுத்து, உரையாடலை வழிசெலுத்தலுக்குத் திருப்பவும்.

முதலில், ஒரு சிறிய, உரையாடல் பதிலை வழங்கவும். வழிசெலுத்தல் செயல் தேவைப்பட்டால், உங்கள் பதிலின் இறுதியில் [action:navigate,page:PAGE_NAME] என்ற வடிவத்தில் ஒரு சிறப்பு கட்டளையை நீங்கள் சேர்க்க வேண்டும். வழிசெலுத்தல் தேவையில்லை என்றால் இந்த கட்டளையைச் சேர்க்க வேண்டாம்.

இந்த பயனருக்கு கிடைக்கும் பக்கங்கள்: ${availablePages.join(', ')}.
`,
        malayalam: `നിങ്ങൾ 'ലിംഗ്വാകെയർ' വെബ് ആപ്പിനായുള്ള ഒരു സൗഹൃദപരവും സഹായകവുമായ നാവിഗേഷൻ അസിസ്റ്റന്റാണ്.
ഉപയോക്താക്കളെ വ്യത്യസ്ത പേജുകൾ കണ്ടെത്താനും നാവിഗേറ്റ് ചെയ്യാനും സഹായിക്കുക എന്നതാണ് നിങ്ങളുടെ ഒരേയൊരു ലക്ഷ്യം.
ലിംഗ്വാകെയർ ആപ്പിലെ നാവിഗേഷനുമായി ബന്ധമില്ലാത്ത ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകരുത്. ഉപയോക്താവ് വിഷയത്തിൽ നിന്ന് മാറിയ ഒരു ചോദ്യം ചോദിച്ചാൽ, വിനയപൂർവ്വം നിരസിച്ച് സംഭാഷണം നാവിഗേഷനിലേക്ക് തിരികെ കൊണ്ടുവരിക.

ആദ്യം, ഒരു ചെറിയ, സംഭാഷണ രൂപത്തിലുള്ള മറുപടി നൽകുക. ഒരു നാവിഗേഷൻ പ്രവർത്തനം ആവശ്യമാണെങ്കിൽ, നിങ്ങളുടെ പ്രതികരണത്തിൻ്റെ അവസാനം [action:navigate,page:PAGE_NAME] എന്ന ഫോർമാറ്റിൽ ഒരു പ്രത്യേക കമാൻഡ് ചേർക്കണം. നാവിഗേഷൻ ആവശ്യമില്ലെങ്കിൽ ഈ കമാൻഡ് ചേർക്കരുത്.

ഈ ഉപയോക്താവിന് ലഭ്യമായ പേജുകൾ: ${availablePages.join(', ')}.
`
    };

    return baseInstructions[language] || baseInstructions['english'];
};

export const createChatbotSession = (userRole: UserRole, language: Language) => {
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: getSystemInstruction(userRole, language),
            thinkingConfig: { thinkingBudget: 0 },
        },
    });

    return {
        sendMessageStream: async (message: string) => {
            try {
                return await chat.sendMessageStream({ message });
            } catch (error) {
                console.error("Error communicating with chatbot API:", error);
                async function* errorStream() {
                    yield { text: "Sorry, I'm having a little trouble right now. Please try again in a moment." };
                }
                return errorStream();
            }
        }
    };
};