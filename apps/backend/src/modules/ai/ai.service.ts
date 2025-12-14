import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {

    async detectToxic(text: string) {
        // Mock Implementation
        let score = 0;
        const words: string[] = [];
        let type = 'clean';

        const badWords = ['insult', 'hate', 'spam', 'toxic'];
        const lowerText = text.toLowerCase();

        badWords.forEach(word => {
            if (lowerText.includes(word)) {
                score += 30;
                words.push(word);
            }
        });
        
        // Cap score at 100
        score = Math.min(score, 100);

        if (score > 80) type = 'hate';
        else if (score > 50) type = 'insult';
        else if (score > 20) type = 'spam';

        return {
            isToxic: score > 50,
            score,
            words,
            type
        };
    }

    async analyzeSentiment(text: string) {
        // Mock 
        const sentiments = ['positive', 'neutral', 'negative'];
        const random = Math.floor(Math.random() * sentiments.length);
        return { sentiment: sentiments[random] };
    }

    async rewrite(text: string) {
        // Mock
        return { rewritten: `[Polite Version] ${text}` };
    }

    async generateHashtags(text: string) {
        // Mock
        // Extract words > 4 chars and add #
        const words = text.split(' ').filter(w => w.length > 4);
        const hashtags = words.slice(0, 5).map(w => `#${w.replace(/[^a-zA-Z0-9]/g, '')}`);
        if (hashtags.length === 0) hashtags.push('#General', '#Mudly');
        return hashtags;
    }
}
